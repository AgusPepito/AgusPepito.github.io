import * as THREE from 'three';
import { setTrackProfile, GATES, STRIPS } from './track.js';
import { OBSTACLES } from './obstacles.js';
import { GAPS } from './jumps.js';
import { campaignChunk, campaignDecorations, campaignGate, campaignObstacle, campaignGap, campaignCheckpoint } from './campaign-kit.js';
import { packAsset } from './asset-transfer.js';

let decorations,modules=true,optimizations=true,deform=true;
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'configure') {
      const config = data.config;
      modules=data.gateModules!==false;
      optimizations=data.optimizations!==false;deform=optimizations&&data.deformGates!==false;
      setTrackProfile(config.length, config.shape);
      for (const [target, source] of [[GATES, config.gates], [STRIPS, config.strips], [OBSTACLES, config.obstacles], [GAPS, config.gaps]]) {
        target.splice(0, target.length, ...source);
      }
      decorations = campaignDecorations();
      return;
    }
    const began = performance.now(), job = data.job;
    const gateStages = job.kind === 'gate' ? {} : null;
    if (!decorations) throw new Error('Campaign worker is not configured');
    const factories = { chunk: () => campaignChunk(THREE, job.start, decorations,{skipMasked:optimizations}),
      gate: () => campaignGate(THREE, job.entity, gateStages,{modules,deform}), obstacle: () => campaignObstacle(THREE, job.entity,{modules:optimizations}),
      gap: () => campaignGap(THREE, job.entity), checkpoint: () => campaignCheckpoint(THREE) };
    if (!factories[job.kind]) throw new Error(`Unknown campaign asset: ${job.kind}`);
    const root = factories[job.kind](), built = performance.now();
    if (gateStages) {
      const families = Object.entries(gateStages.families??{}).map(([name,values])=>({name,...values,
        totalMs:values.prepareSplitMs+values.sampleMs+values.normalsMs}));
      delete gateStages.families;
      gateStages.surfaceTotals = families.reduce((sum,row)=>({meshes:sum.meshes+row.meshes,
        verticesBefore:sum.verticesBefore+row.verticesBefore,verticesAfter:sum.verticesAfter+row.verticesAfter,
        prepareSplitMs:sum.prepareSplitMs+row.prepareSplitMs,sampleMs:sum.sampleMs+row.sampleMs,normalsMs:sum.normalsMs+row.normalsMs}),
        {meshes:0,verticesBefore:0,verticesAfter:0,prepareSplitMs:0,sampleMs:0,normalsMs:0});
      gateStages.hotspots = families.sort((a,b)=>b.totalMs-a.totalMs).slice(0,8);
    }
    const { packet, transfer, expandedBytes } = packAsset(root);
    const bytes = transfer.reduce((sum, buffer) => sum + buffer.byteLength, 0);
    const geometryStats={bytes,
      storedTriangles:packet.geometries.reduce((n,g)=>n+(g.index?.array.length??g.attributes.position.array.length/3)/3,0),
      placedTriangles:packet.meshes.reduce((n,m)=>{const g=packet.geometries[m.geometry];return n+(g.index?.array.length??g.attributes.position.array.length/3)/3*(m.instances?.count??1);},0)};
    if(gateStages)gateStages.geometry=geometryStats;
    self.postMessage({ id: data.id, packet, bytes, expandedBytes, geometryStats, gateStages, buildMs: built - began, packMs: performance.now() - built }, transfer);
  } catch (error) {
    self.postMessage({ id: data.id, error: error.message || String(error) });
  }
};
