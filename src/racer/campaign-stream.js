import { unpackAsset } from './asset-transfer.js';
import { assetKey, campaignJobs } from './campaign-jobs.js';

export const PREFETCH_BYTES = 128 * 1024 * 1024;

// A stream can prepare a future level without a scene, then be adopted by its
// RaceView. No future-level work mutates the current track globals.
export class CampaignStream {
  constructor(config, {background = false, budgetBytes = PREFETCH_BYTES, source = null} = {}) {
    this.pending = campaignJobs(config).map((entry,id)=>({...entry,id,group:null,packet:null}));
    this.entries = new Map(this.pending.map(entry=>[assetKey(entry.job),entry]));
    if (this.entries.size !== this.pending.length) throw new Error('Duplicate campaign asset keys');
    this.busy = null; this.received = null; this.error = null; this.background = background;
    this.completed = 0; this.generated = 0; this.total = this.pending.length; this.disposed = false;
    this.cacheBytes = 0; this.attachedBytes = 0; this.expandedBytes = 0; this.workerStopped = false;
    this.budgetBytes = budgetBytes; this.source = source;
    // A cache-backed view borrows the retained packet buffers without creating
    // another worker or copying geometry. Disposing the view releases only its references.
    if(source){this.worker=null;this.workerStopped=true;return;}
    this.worker = new Worker(new URL('./campaign-worker.js', import.meta.url), { type: 'module', name: 'campaign-assets' });
    this.worker.onmessage = ({ data }) => {
      if (this.disposed) return;
      if (data.error) { this.fail(data.error); return; }
      if (data.id !== this.busy?.id) { this.fail('Unexpected asset worker response'); return; }
      this.received = data;
    };
    this.worker.onerror = event => { event.preventDefault(); this.fail(event.message || 'Asset worker could not start'); };
    this.worker.onmessageerror = () => this.fail('Could not receive generated track geometry');
    const settings=new URLSearchParams(location.search);
    this.worker.postMessage({ type: 'configure', config,gateModules:settings.get('gateModules')!=='off',optimizations:settings.get('assetOptimizations')!=='off',deformGates:settings.get('gateDeform')!=='off' });
  }
  fail(message) {
    this.error = message; this.worker?.terminate(); this.received = null; this.busy = null;
  }
  add(group, job, start, end, installed) {
    const entry = this.entries.get(assetKey(job));
    if (!entry || entry.group) throw new Error(`Campaign job mismatch: ${assetKey(job)}`);
    Object.assign(entry, {group,installed});
  }
  activate() { this.background = false; }
  ready() { return !this.error && !this.disposed && this.pending.length === 0; }
  get prefetchLimited() { return this.background && this.cacheBytes >= this.budgetBytes && this.generated < this.total; }
  update(distance, attach) {
    if (this.disposed || this.error) return null;
    let metric = null;
    if(this.source){
      const source=this.source();
      if(source?.error){this.fail(source.error);return null;}
      for(const entry of this.pending){
        if(entry.packet)continue;
        const cached=source?.entries.get(assetKey(entry.job));
        if(!cached?.packet)continue;
        entry.packet=cached.packet;entry.bytes=cached.bytes;entry.expandedBytes=cached.expandedBytes;
        this.cacheBytes+=entry.bytes;this.generated++;
      }
    }
    if (this.received) {
      const data = this.received, entry = this.busy;
      this.received = null; this.busy = null;
      entry.packet = data.packet; entry.bytes = data.bytes; entry.expandedBytes = data.expandedBytes;
      this.cacheBytes += data.bytes; this.generated++;
      metric = {workerBuildMs:data.buildMs,workerPackMs:data.packMs,assetAttachMs:0,
        assetStart:entry.start,assetKind:entry.job.kind,assetBytes:data.bytes,expandedAssetBytes:data.expandedBytes,gateStages:data.gateStages,assetOptimization:data.packet.optimization,assetGeometry:data.geometryStats};
    }
    if (!this.background) {
      // Warm handoffs can consume a few cached packets per callback, bounded by
      // both elapsed CPU time and count. Geometry arrays are never copied here.
      const attachBegan = performance.now();
      let attachments = 0, attachMs = 0;
      while (attachments < 4 && performance.now() - attachBegan < 3) {
        const entry = this.pending.find(e=>e.packet && e.group);
        if (!entry) break;
        const began = performance.now();
        try {
          const root = unpackAsset(entry.packet);
          attach(entry.group,root); entry.installed?.(root);
          entry.packet = null; this.cacheBytes -= entry.bytes; this.attachedBytes += entry.bytes;
          this.expandedBytes += entry.expandedBytes;
          this.pending.splice(this.pending.indexOf(entry),1); this.completed++;
          attachMs += performance.now()-began; attachments++;
          metric = {assetStart:entry.start,assetKind:entry.job.kind,...metric,assetAttachMs:attachMs,
            assetAttachCount:attachments,assetAttachStart:entry.start};
        } catch (error) { this.fail(error.message); return null; }
      }
    }
    if (!this.source && !this.busy && !this.prefetchLimited) {
      const next = this.pending.find(entry=>!entry.packet);
      if (next) {
        this.busy = next;
        this.worker.postMessage({ type: 'build', id: next.id, job: next.job });
      } else if (!this.workerStopped) {
        this.worker.terminate(); this.workerStopped = true;
      }
    }
    return metric;
  }
  dispose() {
    this.disposed = true; this.worker?.terminate(); this.received = null; this.busy = null;
    this.pending.length = 0; this.entries.clear(); this.cacheBytes = 0;
  }
}
