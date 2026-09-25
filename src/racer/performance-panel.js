// Local, opt-in diagnostics. No graphics settings or simulation behavior change.
const FRAME_LIMIT = 18000, SAMPLE_LIMIT = 900, EVENT_LIMIT = 500;
const LOG_KEY = 'vector-shift-performance-log-v1';
const LOG_LIMIT = 100;
const settings=new URLSearchParams(location.search);
const OPTIMIZATION_VERSION = `shared-assets-v8-side-kit15-walls-dense-v1-space-scenery-v3-handoff-reuse-v1-shader-warmup-v1${settings.get('assetOptimizations')==='off'?'-v7-baseline':''}${settings.get('gateModules')==='off'?'-gates-baked':''}${settings.get('gateDeform')==='off'?'-cpu-gates':''}`;
const number = value => Math.round(value).toLocaleString();
const ms = value => `${value.toFixed(1)} ms`;
const mib = value => `${(value / 1048576).toFixed(1)} MiB`;

class Ring {
  constructor(limit) { this.limit = limit; this.clear(); }
  clear() { this.items = []; this.next = 0; }
  push(value) {
    if (this.items.length < this.limit) this.items.push(value);
    else { this.items[this.next] = value; this.next = (this.next + 1) % this.limit; }
  }
  values() { return this.items.slice(this.next).concat(this.items.slice(0, this.next)); }
}

function summary(frames) {
  if (!frames.length) return null;
  const sorted = frames.map(f => f.intervalMs).sort((a, b) => a - b);
  const total = sorted.reduce((a, b) => a + b, 0);
  const percentile = p => sorted[Math.ceil(sorted.length * p) - 1];
  return { frames: sorted.length, seconds: total / 1000, fps: sorted.length * 1000 / total,
    medianMs: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), maxMs: sorted.at(-1),
    over33Ms: sorted.filter(v => v > 1000 / 30).length, over50Ms: sorted.filter(v => v > 50).length,
    over100Ms: sorted.filter(v => v > 100).length };
}

function inventory(view) {
  const geometries = new Set(), materials = new Set(), buffers = new Set();
  let meshes = 0, vertices = 0, geometryBytes = 0, shadowLights = 0, instancedMeshes = 0, hardwareInstances = 0, instanceBytes = 0;
  const lights = {}, materialTypes = {};
  const addAttribute = a => { const buffer = (a?.isInterleavedBufferAttribute ? a.data.array : a?.array)?.buffer;
    if (buffer && !buffers.has(buffer)) { buffers.add(buffer); geometryBytes += buffer.byteLength; } };
  view.scene.traverse(object => {
    if (object.isMesh) meshes++;
    if (object.isInstancedMesh) {
      instancedMeshes++; hardwareInstances += object.count;
      const before=geometryBytes;addAttribute(object.instanceMatrix);addAttribute(object.instanceColor);
      instanceBytes+=geometryBytes-before;
    }
    if (object.isLight) { lights[object.type] = (lights[object.type] ?? 0) + 1; if (object.castShadow) shadowLights++; }
    if (object.geometry && !geometries.has(object.geometry)) {
      const g = object.geometry; geometries.add(g); vertices += g.attributes.position?.count ?? 0;
      Object.values(g.attributes).forEach(addAttribute); addAttribute(g.index);
      Object.values(g.morphAttributes).forEach(attributes => attributes.forEach(addAttribute));
    }
    if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
  });
  for (const material of materials) materialTypes[material.type] = (materialTypes[material.type] ?? 0) + 1;
  return { meshes, uniqueGeometries: geometries.size, uniqueMaterials: materials.size, vertices, geometryBytes,
    instancedMeshes, hardwareInstances, instanceBytes,
    lights, shadowLights, materialTypes, transparentMaterials: [...materials].filter(m => m.transparent).length };
}

export class PerformancePanel {
  constructor() {
    this.dev = settings.get('dev') === '1';
    this.enabled = false;
    this.frames = new Ring(FRAME_LIMIT); this.samples = new Ring(SAMPLE_LIMIT); this.events = new Ring(EVENT_LIMIT);
    this.rolling = new Ring(240); this.reset();
    this.button = document.createElement('button'); this.button.id = 'perf-toggle';
    this.button.hidden = !this.dev;
    this.button.textContent = 'Perf'; this.button.title = 'Performance panel · F8';
    this.button.setAttribute('aria-controls', 'perf-panel');
    document.querySelector('header').prepend(this.button);
    this.panel = document.createElement('section'); this.panel.id = 'perf-panel'; this.panel.hidden = true;
    this.panel.setAttribute('aria-label', 'Performance diagnostics');
    this.panel.innerHTML = `<div class="perf-heading"><strong>PERFORMANCE</strong><span data-perf="state">Ready</span></div>
      <div class="perf-actions"><button data-action="compact">Compact</button><button data-action="reset">Reset</button><button data-action="memory">Measure memory</button><button data-action="export">Save report</button><button data-action="log">Save CSV</button></div>
      <div class="perf-log-status" data-perf="log">Log saves in this browser</div>
      <div class="perf-grid">
        <span>FPS · recent</span><b data-perf="fps">—</b>
        <span>Frame p95 / worst</span><b data-perf="frame">—</b>
        <span>Draw calls</span><b data-perf="calls">—</b>
        <span>Triangles / frame</span><b data-perf="triangles">—</b>
      </div>
      <div class="perf-detail"><canvas width="288" height="48" aria-label="Recent frame times; reference lines at 16.7 and 33.3 milliseconds"></canvas>
      <div class="perf-grid">
        <span>Capture FPS / p99</span><b data-perf="capture">—</b>
        <span>Frames &gt;33 / 50 / 100 ms</span><b data-perf="spikes">—</b>
        <span>Main CPU / render submit</span><b data-perf="cpu">—</b>
        <span>Simulation / HUD</span><b data-perf="sim">—</b>
        <span>Asset attach / guide + effects</span><b data-perf="build">—</b>
        <span>Last worker build</span><b data-perf="lastBuild">—</b>
        <span>Gate src / bend / merge · ms</span><b data-perf="gateStages">—</b>
        <span>Track waits / total time</span><b data-perf="waits">—</b>
        <span>Lines / points</span><b data-perf="primitives">—</b>
        <span>GPU geometries / textures</span><b data-perf="gpuResources">—</b>
        <span>Shader programs</span><b data-perf="programs">—</b>
        <span>Scene lights / shadow casters</span><b data-perf="lights">—</b>
        <span>Scene meshes / materials</span><b data-perf="objects">—</b>
        <span>Unique geometry / vertices</span><b data-perf="geometry">—</b>
        <span>Geometry arrays · CPU</span><b data-perf="bytes">—</b>
        <span>Instanced batches / copies</span><b data-perf="instances">—</b>
        <span>JS heap · browser estimate</span><b data-perf="heap">—</b>
        <span>JS heap · sampled peak</span><b data-perf="heapPeak">—</b>
        <span>All-level cache / progress</span><b data-perf="allCache">Off</b>
        <span>All-level startup wall time</span><b data-perf="allTime">—</b>
        <span>Unique retained geometry</span><b data-perf="resident">—</b>
        <span>Browser memory snapshot</span><b data-perf="memory">Not measured</b>
        <span>Chunks visible / built / total</span><b data-perf="chunks">—</b>
        <span>Pending asset jobs</span><b data-perf="pending">—</b>
        <span>Next level · assets / cache</span><b data-perf="prefetch">—</b>
        <span>Generated level buffers</span><b data-perf="preload">—</b>
        <span>Indexed + shared buffer saving</span><b data-perf="saving">—</b>
        <span>Render pixels / DPR</span><b data-perf="resolution">—</b>
        <span>Diagnostic CPU · last / max</span><b data-perf="overhead">—</b>
      </div>
      <p>Frame times use real elapsed time. CPU render submission is not GPU time. Resource counts and geometry arrays are not VRAM usage. Capture statistics include active driving only; recent FPS includes menus. Inventory refreshes every 2 s. Reset before each comparison.</p></div>`;
    document.body.append(this.panel);
    this.fields = Object.fromEntries([...this.panel.querySelectorAll('[data-perf]')].map(el => [el.dataset.perf, el]));
    this.chart = this.panel.querySelector('canvas').getContext('2d');
    this.button.onclick = () => this.toggle();
    this.panel.querySelector('[data-action="compact"]').onclick = e => {
      const compact = this.panel.classList.toggle('perf-compact');
      e.target.textContent = compact ? 'Details' : 'Compact';
    };
    this.panel.querySelector('[data-action="reset"]').onclick = () => this.reset();
    this.panel.querySelector('[data-action="export"]').onclick = () => this.download();
    this.panel.querySelector('[data-action="log"]').onclick = () => this.downloadLog();
    this.panel.querySelector('[data-action="memory"]').onclick = () => this.measureMemory('manual');
    window.addEventListener('keydown', e => {
      if (this.dev && e.code === 'F8') { e.preventDefault(); if (!e.repeat) this.toggle(); }
    });
    document.addEventListener('visibilitychange', () => {
      this.previous = null;
      if (document.hidden) this.saveLog();
    });
    window.addEventListener('pagehide', () => this.saveLog());
    if (new URLSearchParams(location.search).get('perf') === '1'||new URLSearchParams(location.search).get('preload')==='all') this.toggle();
    else this.button.setAttribute('aria-expanded', 'false');
  }
  reset() {
    if (this.frames.items.length) this.saveLog();
    this.startedAt = new Date().toISOString(); this.origin = performance.now();
    this.frames.clear(); this.samples.clear(); this.events.clear(); this.rolling.clear();
    this.previous = null; this.lastPaint = -Infinity; this.lastSample = -Infinity; this.lastInventory = -Infinity;
    this.sceneInventory = null; this.captureSummary = null; this.totalFrames = 0; this.latest = null; this.lastBuild = null;
    this.overheadMs = 0; this.maxOverheadMs = 0;
    this.lastLog = -Infinity; this.loggedFrames = 0;
    this.waitMs = 0; this.waitCount = 0; this.loggedWaitMs = 0;
    this.peakWorkerBuildMs = 0; this.peakAssetAttachMs = 0;
    this.lastGateStages = null;
    this.cacheSnapshot=null;this.peakMainHeapBytes=0;this.peakResidentGeometryBytes=0;this.lastLogStamp=null;
    this.baselineMainHeapBytes=performance.memory?.usedJSHeapSize??null;
    this.memorySnapshots=[];this.memoryStatus='Not measured';
  }
  async measureMemory(reason) {
    if(!this.dev)return;
    if(this.memoryPending)return;
    if(!globalThis.crossOriginIsolated||typeof performance.measureUserAgentSpecificMemory!=='function'){
      this.memoryStatus='Unavailable (browser / isolation)';
      this.memorySnapshots.push({reason,status:'unavailable',crossOriginIsolated:globalThis.crossOriginIsolated,at:new Date().toISOString()});
      this.saveLog();return;
    }
    this.memoryPending=true;this.memoryStatus='Measuring…';
    const began=performance.now();
    try{
      const result=await performance.measureUserAgentSpecificMemory();
      this.memorySnapshots.push({reason,status:'measured',at:new Date().toISOString(),durationMs:performance.now()-began,...result});
      this.memoryStatus=mib(result.bytes);
    }catch(error){
      this.memoryStatus='Unavailable';this.memorySnapshots.push({reason,status:'failed',message:error.message,at:new Date().toISOString()});
    }finally{this.memoryPending=false;this.saveLog();}
  }
  toggle() {
    if(!this.dev)return;
    this.enabled = !this.enabled; this.panel.hidden = !this.enabled;
    this.button.setAttribute('aria-expanded', String(this.enabled));
    this.button.classList.toggle('active', this.enabled);
    if (!this.enabled) this.saveLog();
    this.previous = null; this.rolling.clear(); this.lastPaint = -Infinity;
    this.event('diagnostics', { enabled: this.enabled });
  }
  event(type, data = {}) {
    if(!this.dev)return;
    if (data.gateStages) this.lastGateStages = data.gateStages;
    if (type === 'prefetch-asset'||type==='all-cache-asset') this.peakWorkerBuildMs = Math.max(this.peakWorkerBuildMs, data.workerBuildMs ?? 0);
    this.events.push({ atMs: performance.now() - this.origin, type, ...data });
  }
  record(now, view, context, timing) {
    if (!this.enabled || document.hidden) { this.previous = null; return; }
    const overheadStart = performance.now();
    const info = view.renderer.info, canvas = view.renderer.domElement;
    const current = { atMs: now - this.origin, ...context, ...timing,
      calls: info.render.calls, triangles: info.render.triangles, lines: info.render.lines, points: info.render.points,
      gpuGeometries: info.memory.geometries, gpuTextures: info.memory.textures, programs: info.programs?.length ?? 0,
      pendingAssets: view.pendingAssets.length,
      visibleChunks: view.chunks.filter(c => c.group.visible).length,
      builtChunks: view.chunks.filter(c => c.group.children.length > 0).length, totalChunks: view.chunks.length,
      width: canvas.width, height: canvas.height, pixelRatio: view.renderer.getPixelRatio(),
      jsHeapBytes: performance.memory?.usedJSHeapSize ?? null };
    if (context.state === 'buffering' && this.previous?.data.state !== 'buffering') this.waitCount++;
    // Associate the interval with the PREVIOUS callback's work: its cost delays this callback.
    if (this.previous) {
      const frame = { ...this.previous.data, intervalMs: now - this.previous.now };
      if (frame.intervalMs > 0) {
        this.rolling.push(frame);
        if (this.previous.data.state === 'buffering') this.waitMs += frame.intervalMs;
        if (this.previous.data.state === 'running' && context.startedRunning) {
          this.frames.push(frame); this.totalFrames++;
          if (frame.intervalMs > 50) this.event('slow-frame', frame);
        }
      }
    }
    if (timing.assetBuildMs > 0) {
      this.lastBuild = timing.assetBuildMs;
      this.event('asset-build', { ...context, durationMs: timing.assetBuildMs, assetStart: timing.assetStart });
    }
    if (timing.workerBuildMs > 0) {
      this.lastBuild = timing.workerBuildMs;
      this.event('worker-asset', { ...context, durationMs: timing.workerBuildMs, packMs: timing.workerPackMs,
        attachMs: timing.assetAttachMs, attachStart:timing.assetAttachStart, attachCount:timing.assetAttachCount,
        assetStart: timing.assetStart, assetKind: timing.assetKind, gateStages:timing.gateStages,assetOptimization:timing.assetOptimization,assetGeometry:timing.assetGeometry });
    }
    this.peakWorkerBuildMs = Math.max(this.peakWorkerBuildMs, timing.workerBuildMs ?? 0);
    this.peakAssetAttachMs = Math.max(this.peakAssetAttachMs, timing.assetAttachMs ?? 0);
    if (now - this.lastInventory >= 2000 || this.inventoryView !== view) {
      this.sceneInventory = inventory(view); this.inventoryView = view; this.lastInventory = now;
      this.cacheSnapshot=this.cacheProvider?.()??null;
      this.inventoryCachedActiveBytes=context.cachedActiveBytes??0;
      this.inventoryPrefetchBytes=context.prefetchBytes??0;
      this.captureSummary = summary(this.frames.values());
    }
    this.latest = { ...current, ...this.sceneInventory };
    const residentGeometryBytes=(this.cacheSnapshot?.bytes??0)+this.sceneInventory.geometryBytes-this.inventoryCachedActiveBytes+this.inventoryPrefetchBytes;
    // Scene inventory and attached-byte counters must come from the same instant.
    // Store the latter with inventory; otherwise loading between scans undercounts.
    this.latest.allCacheBytes=this.cacheSnapshot?.bytes??0;
    this.latest.residentGeometryBytes=Math.max(0,residentGeometryBytes);
    this.peakMainHeapBytes=Math.max(this.peakMainHeapBytes,current.jsHeapBytes??0);
    this.peakResidentGeometryBytes=Math.max(this.peakResidentGeometryBytes,this.latest.residentGeometryBytes);
    if (now - this.lastSample >= 1000) { this.samples.push(this.latest); this.lastSample = now; }
    if (now - this.lastLog >= 10000 || (this.previous?.data.state === 'running' && context.state !== 'running')) {
      this.saveLog(); this.lastLog = now;
    }
    if (now - this.lastPaint >= 500) { this.paint(); this.lastPaint = now; }
    this.overheadMs = performance.now() - overheadStart;
    this.maxOverheadMs = Math.max(this.maxOverheadMs, this.overheadMs);
    this.previous = { now, data: { ...current, diagnosticMs: this.overheadMs } };
  }
  paint() {
    const v = this.latest, recent = this.rolling.values(), stats = summary(recent), capture = this.captureSummary;
    const set = (key, value) => { this.fields[key].textContent = value; };
    set('state', `L${v.level + 1} · ${v.state}`);
    set('fps', stats ? stats.fps.toFixed(1) : '—');
    set('frame', stats ? `${ms(stats.p95Ms)} / ${ms(stats.maxMs)}` : '—');
    set('calls', number(v.calls)); set('triangles', number(v.triangles));
    set('capture', capture ? `${capture.fps.toFixed(1)} / ${ms(capture.p99Ms)}` : 'Drive to capture');
    set('spikes', capture ? `${capture.over33Ms} / ${capture.over50Ms} / ${capture.over100Ms}` : '—');
    set('cpu', `${ms(v.mainMs)} / ${ms(v.renderSubmitMs)}`);
    set('sim', `${ms(v.simulationMs)} / ${ms(v.hudMs)}`);
    set('build', `${ms(v.assetAttachMs ?? v.assetBuildMs)} / ${ms(v.guideEffectsMs)}`);
    set('lastBuild', this.lastBuild === null ? '—' : ms(this.lastBuild));
    set('gateStages', this.lastGateStages ? [this.lastGateStages.sourceMs,this.lastGateStages.conformMs,this.lastGateStages.mergeMs].map(number).join(' / ') : '—');
    set('waits', `${this.waitCount} / ${(this.waitMs / 1000).toFixed(1)} s`);
    set('primitives', `${number(v.lines)} / ${number(v.points)}`);
    set('gpuResources', `${v.gpuGeometries} / ${v.gpuTextures}`); set('programs', v.programs);
    set('lights', `${Object.values(v.lights).reduce((a, b) => a + b, 0)} / ${v.shadowLights}`);
    set('objects', `${v.meshes} / ${v.uniqueMaterials}`);
    set('geometry', `${v.uniqueGeometries} / ${number(v.vertices)}`); set('bytes', mib(v.geometryBytes));
    set('instances', `${v.instancedMeshes} / ${number(v.hardwareInstances)}`);
    set('heap', v.jsHeapBytes === null ? 'Unavailable' : mib(v.jsHeapBytes));
    set('heapPeak',this.peakMainHeapBytes?mib(this.peakMainHeapBytes):'Unavailable');
    const cache=this.cacheSnapshot;
    set('allCache',cache?`${mib(cache.bytes)} · ${cache.generated}/${cache.total}${cache.ready?' · ready':''}`:'Off');
    set('allTime',cache?`${(cache.durationMs/1000).toFixed(1)} s`:'—');
    set('resident',mib(v.residentGeometryBytes));set('memory',this.memoryStatus);
    set('chunks', `${v.visibleChunks} / ${v.builtChunks} / ${v.totalChunks}`); set('pending', v.pendingAssets);
    set('prefetch', `${v.prefetchAssets ?? 0}/${v.prefetchTotal ?? 0} · ${mib(v.prefetchBytes ?? 0)}${v.prefetchLimited ? ' · capped' : ''}`);
    set('preload', mib(v.preloadBytes ?? 0));
    set('saving', v.expandedLevelBytes ? `${(100 * (1 - v.preloadBytes / v.expandedLevelBytes)).toFixed(1)}%` : '—');
    set('resolution', `${v.width} × ${v.height} / ${v.pixelRatio.toFixed(2)}`);
    set('overhead', `${ms(this.overheadMs)} / ${ms(this.maxOverheadMs)}`);
    const ctx = this.chart; ctx.clearRect(0, 0, 288, 48);
    for (const threshold of [1000 / 60, 1000 / 30]) {
      ctx.strokeStyle = '#627189'; ctx.beginPath(); const y = 48 - threshold / 100 * 48;
      ctx.moveTo(0, y); ctx.lineTo(288, y); ctx.stroke();
    }
    recent.forEach((f, i) => {
      ctx.fillStyle = f.intervalMs > 50 ? '#ff8775' : f.intervalMs > 1000 / 30 ? '#ffcf79' : '#74dccb';
      const height = Math.min(48, f.intervalMs / 100 * 48);
      ctx.fillRect(i * 288 / 240, 48 - height, 288 / 240, height);
    });
  }
  download() {
    this.saveLog();
    const frames = this.frames.values();
    const report = { schemaVersion: 5, baselineCommit: '7cdd162', optimizationVersion: OPTIMIZATION_VERSION,
      allLevelCache:this.cacheProvider?.()??null,
      memory:{snapshots:this.memorySnapshots,pending:Boolean(this.memoryPending),peakMainHeapBytes:this.peakMainHeapBytes||null,
        baselineMainHeapBytes:this.baselineMainHeapBytes,peakResidentGeometryBytes:this.peakResidentGeometryBytes,crossOriginIsolated:globalThis.crossOriginIsolated},
      trackWaits: { count: this.waitCount, durationMs: this.waitMs }, startedAt: this.startedAt, exportedAt: new Date().toISOString(),
      assetPeaks: {workerBuildMs:this.peakWorkerBuildMs,attachMs:this.peakAssetAttachMs},
      gateProfiles:this.events.values().filter(event=>event.gateStages).map(event=>({level:event.level,assetStart:event.assetStart,
        background:event.type==='prefetch-asset'||event.type==='all-cache-asset',workerBuildMs:event.durationMs??event.workerBuildMs,stages:event.gateStages})),
      environment: { userAgent: navigator.userAgent, url: location.origin + location.pathname + location.search,
        hardwareConcurrency: navigator.hardwareConcurrency, deviceMemoryGiB: navigator.deviceMemory ?? null,
        touchPoints: navigator.maxTouchPoints, devicePixelRatio, viewport: [innerWidth, innerHeight] },
      notes: ['Full selected-level generation precedes driving; the next level has a bounded runtime prefetch cache. Indexed geometry preserves triangles and attributes.',
        'preload=all instead retains all four authored campaign levels with one generation worker at a time and no prefetch memory cap. Overload rounds are outside that cache.',
        'Cached and active level geometry share backing buffers: do not add their byte counts. Inactive levels remain CPU packets; GPU upload still follows rendering.',
        'Browser memory snapshots are browser-reported estimates, may trigger garbage collection, and are not GPU/VRAM or total OS-process memory. Main heap peaks are sampled and exclude worker heaps.',
        'Geometry bytes include instance matrices. Expanded bytes estimate a separate nonindexed copy per instance. Instanced counts cover the attached scene, including hidden assets.',
        'Decorative asteroid and station prototypes, the ship and sky are retained across level changes, separately from the 251 campaign jobs. Only scenery placements are rebuilt. Scene inventory and browser memory include them; allLevelCache bytes and worker timings exclude them. view-created events include reusedSharedAssets, scenery generationMs, layoutMs and reusedPrototypes. previous-view-disposed and start-first-render isolate other transition work.',
        'Gate surfaceTotals cover baked parts only; rigid grouping, placement and batching are separate fields inside the total conformMs.',
        'v8 skips fully masked slab tiles, instances compatible closed jump barriers, and uses shader-deformed shared gate strips where rigid v7 transforms cannot match the track. Gate profiles include modulePlan and stored/placed triangle counts; asset events include skipped tile counts and barrier module plans.',
        'assetOptimizations=off restores v7 generation. gateDeform=off disables only shader gate deformation. gateModules=off disables all gate module instancing. Shader deformation adds per-frame vertex work; worker timings do not measure this GPU cost.',
        'The historical hardwareInstances / peakHardwareInstances fields now include repeated module batches as well as fittings; they count rendered instances, not distinct complete modules.',
        'Intervals are uncapped RAF elapsed milliseconds, associated with the previous callback work.',
        'Capture includes driving only, excluding pause/resume, track buffering and hidden-page intervals. Compare trackWaits alongside FPS. Recent display also includes menus.',
        'CPU timings overlap: main includes simulation, HUD, asset pump, view, guides and render submission. Worker build/pack timings are independent. Main excludes diagnostics and browser/GPU work.',
        'Main-thread heap estimates do not include worker memory. Track waits are measured while profiling and the page is visible.',
        'Render submission is CPU time, not GPU execution time. Geometry bytes are unique backing ArrayBuffers in the attached scene, not VRAM.',
        'Inventory sampled every 2 seconds; per-second samples are snapshots, not averages. Resource counts come from Three.js.',
        'Frame retention: latest 18000 active frames. Summary and per-level summaries cover retained frames only; samples and events are bounded too.'],
      totalRecordedFrames: this.totalFrames, retainedFrames: frames.length, limits: { frames: FRAME_LIMIT, samples: SAMPLE_LIMIT, events: EVENT_LIMIT },
      summary: summary(frames), perLevel: [...new Set(frames.map(f => f.level))].map(level => ({ level, ...summary(frames.filter(f => f.level === level)) })),
      latest: this.latest, diagnosticMaxMs: this.maxOverheadMs, frames, samples: this.samples.values(), events: this.events.values() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url;
    link.download = `vector-shift-performance-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    // Exporting can be expensive; keep that user action out of the driving interval sample.
    this.previous = null;
  }
  readLog() {
    const rows = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    return Array.isArray(rows) ? rows.filter(row => row && typeof row === 'object').slice(-LOG_LIMIT) : [];
  }
  saveLog() {
    if(!this.dev)return;
    const cache=this.cacheProvider?.()??null;
    const stamp=`${this.totalFrames}:${this.waitMs}:${cache?.bytes}:${cache?.ready}:${this.memorySnapshots.length}:${this.memoryPending}:${this.peakMainHeapBytes}:${this.peakResidentGeometryBytes}`;
    if ((!this.totalFrames && !this.waitMs && !cache) || stamp===this.lastLogStamp) return;
    const frames = this.frames.values(), stats = summary(frames) ?? { seconds: 0, frames: 0, fps: 0, p95Ms: 0, p99Ms: 0, maxMs: 0, over33Ms: 0, over50Ms: 0, over100Ms: 0 };
    const peak = key => frames.reduce((max, frame) => Math.max(max, frame[key] ?? 0), 0);
    const row = { startedAt: this.startedAt, updatedAt: new Date().toISOString(), baselineCommit: '7cdd162', optimizationVersion: OPTIMIZATION_VERSION,
      allLevelsReady:cache?.ready??'',allLevelCacheMiB:cache?+(cache.bytes/1048576).toFixed(2):'',
      allLevelStartupSeconds:cache?+(cache.durationMs/1000).toFixed(2):'',allLevelAssets:cache?.generated??'',
      peakMainHeapMiB:this.peakMainHeapBytes?+(this.peakMainHeapBytes/1048576).toFixed(2):'',
      peakResidentGeometryMiB:+(this.peakResidentGeometryBytes/1048576).toFixed(2),
      browserMemoryMiB:this.memorySnapshots.filter(s=>s.status==='measured').at(-1)?.bytes/1048576||'',
      levels: [...new Set(frames.map(f => f.level + 1))].join('/'), modes: [...new Set(frames.map(f => f.mode))].join('/'),
      seconds: +stats.seconds.toFixed(2), retainedFrames: stats.frames, totalFrames: this.totalFrames,
      fps: +stats.fps.toFixed(2), p95Ms: +stats.p95Ms.toFixed(2), p99Ms: +stats.p99Ms.toFixed(2), worstMs: +stats.maxMs.toFixed(2),
      over33Ms: stats.over33Ms, over50Ms: stats.over50Ms, over100Ms: stats.over100Ms,
      peakDrawCalls: peak('calls'), peakTriangles: peak('triangles'), peakTextures: peak('gpuTextures'),
      peakGeometries: peak('gpuGeometries'), peakPrograms: peak('programs'),
      peakInstancedBatches: this.samples.values().reduce((n,s)=>Math.max(n,s.instancedMeshes??0),0),
      peakHardwareInstances: this.samples.values().reduce((n,s)=>Math.max(n,s.hardwareInstances??0),0),
      peakInstanceMiB: +(this.samples.values().reduce((n,s)=>Math.max(n,s.instanceBytes??0),0)/1048576).toFixed(2),
      peakMainCpuMs: +peak('mainMs').toFixed(2), peakAssetBuildMs: +peak('assetBuildMs').toFixed(2),
      peakWorkerBuildMs: +this.peakWorkerBuildMs.toFixed(2), peakAssetAttachMs: +this.peakAssetAttachMs.toFixed(2),
      peakPrefetchMiB: +(peak('prefetchBytes') / 1048576).toFixed(2), peakLevelBuffersMiB: +(peak('preloadBytes') / 1048576).toFixed(2),
      expandedLevelEquivalentMiB: +(peak('expandedLevelBytes') / 1048576).toFixed(2),
      trackWaits: this.waitCount, trackWaitSeconds: +(this.waitMs / 1000).toFixed(2),
      peakDiagnosticMs: +peak('diagnosticMs').toFixed(2),
      renderSize: `${this.latest?.width}x${this.latest?.height}`, renderDpr: this.latest?.pixelRatio,
      userAgent: navigator.userAgent };
    this.pendingLogRow = row;
    try {
      const rows = this.readLog().filter(entry => entry.startedAt !== this.startedAt);
      rows.push(row); localStorage.setItem(LOG_KEY, JSON.stringify(rows.slice(-LOG_LIMIT)));
      this.loggedFrames = this.totalFrames;
      this.lastLogStamp=stamp;
      this.loggedWaitMs = this.waitMs;
      if (this.fields) this.fields.log.textContent = `${Math.min(rows.length, LOG_LIMIT)} saved captures · auto-save every 10 s`;
    } catch {
      if (this.fields) this.fields.log.textContent = 'Browser storage unavailable · download CSV before leaving';
    }
  }
  downloadLog() {
    this.saveLog();
    let rows = [];
    try { rows = this.readLog(); } catch { /* Current capture can still be exported. */ }
    if (this.pendingLogRow) {
      rows = rows.filter(row => row.startedAt !== this.pendingLogRow.startedAt);
      rows.push(this.pendingLogRow);
    }
    if (!rows.length) { this.fields.log.textContent = 'Drive with Perf enabled to create a log entry'; return; }
    const columns = Object.keys(rows.at(-1));
    const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.map(cell).join(','), ...rows.map(row => columns.map(key => cell(row[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url;
    link.download = `vector-shift-performance-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    this.previous = null;
  }
}
