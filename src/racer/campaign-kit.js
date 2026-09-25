import slabs from '../../public/assets/track/slab-surface-r1.js';
import lane from '../../public/assets/track/phase-lane-r1.js';
import serviceBelt from '../../public/assets/track/tube-service-belt-r2.js';
import emitter from '../../public/assets/track/phase-emitter-r1.js';
import checkpoint from '../../public/assets/track/checkpoint-r1.js';
import gapEdge from '../../public/assets/track/gap-edge-r1.js';
import gapBorder from '../../public/assets/track/gap-border-r1.js';
import tubeTermination from '../../public/assets/track/tube-gap-termination-r1.js';
import { LENGTH, GATES, STRIPS, PHASES, point, section, stripCenter, trackMotionAt } from './track.js';
import { GAPS } from './jumps.js';
import { OBSTACLES, WALL_HEIGHT, HOLE_HEIGHT, solidSpans } from './obstacles.js';
import { obstacleAssembly } from './obstacle-kit.js';
import { wallAssembly, mergeWallParts } from './wall-kit.js';
import { mountDetailedBay, mixedBayAt } from './mixed-kit.js';
import { cutGapLayers } from './gap-kit.js';
import { mountCourseSurface } from './course-surface.js';
import { inspectionBatches } from './inspection-batches.js';
import { gateModulePlan, repeatGateModule } from './gate-modules.js';
import {canDeformGate,deformGateModule} from './deformed-gate.js';
import {fullyMasked} from './mask-coverage.js';
import {mountEdgeLight,LIT_WALL_OFFSET} from './roadside-lighting.js';
import {roadEdgeFields} from './road-edge-fields.js';

const PITCH = 12.5;
const overlaps = (a, b, c, d) => a < d && b > c;

// Decoration placement is stable in global stations and independent of chunks.
// Avoid encounter footprints so no machinery is buried beneath a station.
export function campaignDecorations() {
  const occupied = [
    ...GATES.map(g => [g.s - 35, g.s + 29]),
    ...OBSTACLES.map(o => [o.s - 40, o.s + o.depth + 20]),
    ...GAPS.map(g => [g.start - 32, g.end + 32]), [LENGTH - 35, LENGTH + 35],
  ];
  const clear = (a, b) => !occupied.some(([c, d]) => overlaps(a, b, c, d));
  const services = [];
  for (let s = 100; s < LENGTH - 50; s += 200) {
    if (!section(s).closed || !section(s + 12).closed || !clear(s, s + 12)) continue;
    if (STRIPS.some(strip => overlaps(s, s + 12, strip.start, strip.end))) continue;
    services.push({ start: s, end: s + 12, variant: ['pipe', 'cooling', 'access', 'armor'][Math.floor(s / 200) % 4] });
  }
  const bayCount=Math.ceil((LENGTH+100)/PITCH), eligible=Array(bayCount).fill(false);
  // 450 m of walls / 50 m of breathing room, clipped per bay instead of
  // rejecting an entire run when just one gate or gap intersects it.
  for(let i=2;i<bayCount;i++){
    const s=i*PITCH,end=s+PITCH;
    if(end>LENGTH-35||(i-2)%40>=36||!clear(s-.75,end+.75))continue;
    // Extend along open curling edges too; finish before the two edges close.
    if([s,s+PITCH*.25,s+PITCH*.5,s+PITCH*.75,end].some(at=>Math.abs(section(at).curl)>=.8))continue;
    eligible[i]=true;
  }
  const layouts=[Array(bayCount).fill(null),Array(bayCount).fill(null)];
  const families=['cover','cover','pipe','cover','grille','cover'];
  for(let first=0;first<bayCount;){
    if(!eligible[first]){first++;continue;}
    let end=first+1;while(end<bayCount&&eligible[end])end++;
    // Avoid isolated ramp pairs in small leftover clearances.
    if(end-first>=4)for(let i=first;i<end;i++)for(let side=0;side<2;side++){
      layouts[side][i]=i===first||i===end-1?'cover':families[(Math.floor((i-first)/4)+side*2)%families.length];
    }
    first=end;
  }
  return { services, layouts };
}

// Rectangles in the current tile's unwrapped coordinates. The same gameplay
// entities own their surface apertures, including partial spans and tube seams.
function masksFor(start, end, center, half, decorations) {
  const masks = [];
  function add(a, b, low, high) {
    if (!overlaps(start, end, a, b)) return;
    for (const offset of section((Math.max(a, start) + Math.min(b, end)) / 2).closed ? [-2, 0, 2] : [0]) {
      masks.push([(low + offset) * half, (high + offset) * half, center - b, center - a]);
    }
  }
  for (const g of GAPS) {
    const low = g.full ? -1 : g.center - g.width, high = g.full ? 1 : g.center + g.width;
    add(g.start - 12, g.end + 12, low, high);
    if (!g.full) add(g.start, g.end, low - .64 / half, high + .64 / half);
  }
  for (const g of GATES) add(g.s - 15, g.s + 9, g.center - g.width, g.center + g.width);
  add(LENGTH - 15, LENGTH + 15, -1, 1);
  for (const belt of decorations.services) add(belt.start, belt.end, -1, 1);
  return masks;
}

export function campaignChunk(THREE, start, decorations, {inspect=false,skipMasked=true} = {}) {
  const root = new THREE.Group(), layers = new THREE.Group(), energy = new THREE.Group();
  root.userData.optimization={version:8,kind:'chunk',skipMasked,skippedSlabTiles:0};
  const roadParts=inspect?new THREE.Group():layers, serviceParts=inspect?new THREE.Group():layers, bayParts=inspect?new THREE.Group():layers;
  const end = Math.min(start + 100, LENGTH + 100);
  for (let at = start; at < end; at += PITCH) {
    const length = Math.min(PITCH, end - at), center = at + length / 2, half = section(center).halfWidth;
    const masks=masksFor(at,at+length,center,half,decorations);
    if(skipMasked&&fullyMasked([-half,half,-length/2,length/2],masks)){root.userData.optimization.skippedSlabTiles++;continue;}
    const source = slabs(THREE, {width: half * 2, length, columns: Math.max(6, Math.round(half * 2 / 5)), index: Math.floor(at / PITCH)});
    cutGapLayers(THREE, source, masks);
    roadParts.add(mountCourseSurface(THREE, source, center, half));
  }
  for (const strip of STRIPS) for (let at = strip.start; at < strip.end; at += PITCH) {
    const a = Math.max(start, at), b = Math.min(end, at + PITCH, strip.end);
    if (a >= b) continue;
    const center = (a + b) / 2, half = section(center).halfWidth;
    const source = lane(THREE, {kind: a === strip.start ? 'start' : b === strip.end ? 'end' : 'middle', phase: strip.phase, length: b - a, width: strip.widthMeters ?? strip.width * half * 2});
    // Move into road coordinates BEFORE cutting, so shifted and moving lanes
    // use exactly the same masks as their underlying surface.
    source.updateMatrixWorld(true);
    source.traverse(m => {
      if (!m.isMesh) return;
      m.geometry.applyMatrix4(m.matrixWorld);
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const s = center - p.getZ(i);
        const x = strip.widthMeters ? p.getX(i) * half / section(s).halfWidth : p.getX(i);
        p.setXYZ(i, x + stripCenter(strip, s) * half, p.getY(i) + .012, p.getZ(i));
      }
    });
    source.traverse(n => { n.position.set(0, 0, 0); n.rotation.set(0, 0, 0); n.scale.set(1, 1, 1); });
    cutGapLayers(THREE, source, masksFor(a, b, center, half, decorations));
    energy.add(mountCourseSurface(THREE, source, center, half));
  }
  for (const belt of decorations.services) if (belt.start >= start && belt.start < end) {
    const center = (belt.start + belt.end) / 2, half = section(center).halfWidth;
    serviceParts.add(mountCourseSurface(THREE, serviceBelt(THREE, {radius: half / Math.PI, variant: belt.variant}), center, half, {instanceRigid:true}));
  }
  for (let at = Math.max(0, Math.ceil(start / PITCH) * PITCH); at < end; at += PITCH) for (const [i, side] of [-1, 1].entries()) {
    const bay = mixedBayAt(decorations.layouts[i], at / PITCH);
    if (!bay) continue;
    const center=at+PITCH/2,half=section(center).halfWidth;
    const source = new THREE.Group();
    // The new one-metre shoulder seats between the road and the housing foot.
    // It shares the bay layout, so encounters/gaps and exposed run ends stop
    // both fixtures together. Only decoration moves; collision width stays fixed.
    mountDetailedBay(THREE,source,bay.family,bay.kind,side,0,{lateral:half+LIT_WALL_OFFSET,height:-.03});
    mountEdgeLight(THREE,source,side,{half});
    bayParts.add(mountCourseSurface(THREE, source, center, half));
  }
  const containment=roadEdgeFields(start,end,decorations.layouts);
  if(containment)root.add(containment);
  if(inspect){
    root.add(inspectionBatches(THREE,roadParts,'Road slabs'),inspectionBatches(THREE,serviceParts,'Service belts'),inspectionBatches(THREE,bayParts,'Roadside bays'));
    const lanes=inspectionBatches(THREE,energy,'Phase lanes');lanes.traverse(m=>{if(m.isMesh)m.renderOrder=1;});root.add(lanes);
    root.userData.energyGroup=lanes;return root;
  }
  root.add(mergeWallParts(THREE, layers, {indexed:true,worldBaked:true}));
  const mergedEnergy = mergeWallParts(THREE, energy, {indexed:true,worldBaked:true});
  mergedEnergy.traverse(m => { if (m.isMesh) m.renderOrder = 1; });
  root.add(mergedEnergy); root.userData.energyGroup = mergedEnergy;
  return root;
}

function finishStation(THREE, source, s, half, options) {
  const result = mergeWallParts(THREE, mountCourseSurface(THREE, source, s, half, {instanceRigid:true,...options}), {indexed:true,worldBaked:true});
  result.traverse(m => { if (m.isMesh && m.material.name.endsWith('-curtain')) m.renderOrder = 2; });
  return result;
}

export function campaignGate(THREE, gate, timings = null, {inspect=false,modules=true,deform=true} = {}) {
  const road = section(gate.s), half = road.halfWidth;
  const field = {curl:road.curl,closed:road.closed&&gate.width>=1};
  const began = timings ? performance.now() : 0;
  const plan=modules?gateModulePlan(gate):{mode:'baked',reason:'Module instancing disabled for comparison'};
  if(modules&&deform&&plan.mode==='baked'&&canDeformGate()){
    const source=emitter(THREE,{width:gate.width*half*2,color:PHASES[gate.phase].hex,firstModuleOnly:true,...field});
    const authored=performance.now();
    const result=deformGateModule(THREE,source,gate,{inspect,timings});
    if(timings)timings.sourceMs=authored-began;
    return result;
  }
  const repeated=plan.mode!=='baked';
  const source = emitter(THREE, {width: gate.width * half * 2, color: PHASES[gate.phase].hex, reuseModules:true,firstModuleOnly:repeated,...field});
  const authored = timings ? performance.now() : 0;
  mountCourseSurface(THREE, source, gate.s, half, {center: () => gate.center, timings,cacheFrames:true,instanceRigid:true});
  const conformed = timings ? performance.now() : 0;
  const merged = inspect?inspectionBatches(THREE,source,'Gate'):mergeWallParts(THREE, source, {indexed:true,timings,worldBaked:true});
  const result=repeated?repeatGateModule(THREE,merged,plan):merged;
  result.userData.gateModules=plan;
  result.traverse(m => { if (m.isMesh && m.material.name.endsWith('-curtain')) m.renderOrder = 2; });
  if (timings) Object.assign(timings, {sourceMs:authored-began,conformMs:conformed-authored,mergeMs:performance.now()-conformed,modulePlan:plan});
  return result;
}

export function campaignCheckpoint(THREE) {
  const half = section(LENGTH).halfWidth;
  return finishStation(THREE, checkpoint(THREE, {width: half * 2}), LENGTH, half);
}

export function campaignObstacle(THREE, obstacle, {modules=true}={}) {
  const {halfWidth: half, closed} = section(obstacle.s), height = obstacle.height ?? WALL_HEIGHT;
  // Closed full-width jump barriers have no unique end caps. Keep partial,
  // open-road and varying-cross-section assemblies on the existing path.
  const plan=modules&&closed&&obstacle.kind==='jump'?gateModulePlan({s:obstacle.s,width:1,center:0},
    {moduleWidth:4.5,approach:25,departure:Math.max(6,obstacle.depth+1)}):{mode:'baked',reason:'Barrier needs its original assembly'};
  const repeated=plan.mode!=='baked';
  const root = new THREE.Group();
  if (obstacle.kind === 'wall') {
    for (const [a, b] of solidSpans(obstacle)) root.add(wallAssembly(THREE, {width: (b - a) * half, center: (a + b) * half / 2}));
  } else {
    root.add(obstacleAssembly(THREE, {
      type: obstacle.kind === 'jump' ? 'jump-only' : height === 4.2 ? 'jump-or-opening' : 'opening-only',
      firstModuleOnly:repeated,
      halfWidth: half, closed, opening: obstacle.width * half * 2, center: obstacle.center * half,
    }));
  }
  const sourceHeight = obstacle.kind === 'jump' ? 2.4 : height === 4.2 && obstacle.kind === 'hole' ? 4.2 : WALL_HEIGHT;
  const options={prepare(geometry) {
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      // Preserve the 3.5 m opening when extending the authored 7 m P3 to
      // campaign's 9 m collision walls. Do not scale the clear route.
      const newY = obstacle.kind === 'hole' ? y <= HOLE_HEIGHT ? y : HOLE_HEIGHT + (y - HOLE_HEIGHT) * (height - HOLE_HEIGHT) / (sourceHeight - HOLE_HEIGHT) : y * height / sourceHeight;
      p.setXYZ(i, p.getX(i), newY, p.getZ(i) < 0 ? p.getZ(i) * obstacle.depth / 5 : p.getZ(i));
    }
  }};
  let result;
  if(repeated){
    const marks=root.getObjectByName('jump-approach-markings');marks.removeFromParent();
    result=repeatGateModule(THREE,finishStation(THREE,root,obstacle.s,half,options),plan);
    result.add(finishStation(THREE,marks,obstacle.s,half,options));
  }else result=finishStation(THREE,root,obstacle.s,half,options);
  result.userData.optimization={version:8,kind:'obstacle',modulePlan:plan};
  return result;
}

export function campaignGap(THREE, gap) {
  const root = new THREE.Group();
  for (const [s, kind] of [[gap.start, 'takeoff'], [gap.end, 'landing']]) {
    const road = section(s), half = road.halfWidth, width = (gap.full ? 2 : gap.width * 2) * half;
    const source = gapEdge(THREE, {kind, width, finishedSides: !gap.full || !road.closed});
    root.add(mountCourseSurface(THREE, source, s, half, {center: () => gap.full ? 0 : gap.center}));
    if (road.closed) {
      const inside = road.curl > 0;
      const cap = tubeTermination(THREE, {inside, kind, partial: !gap.full, openingWidth: width});
      // These are already radial meshes. Only rotate the partial opening and
      // follow the centerline; never feed them through circumference wrapping.
      cap.updateMatrixWorld(true);
      cap.traverse(m => {
        if (!m.isMesh) return;
        m.geometry.applyMatrix4(m.matrixWorld);
        const p = m.geometry.attributes.position, angle = (gap.full ? 0 : gap.center) * Math.PI * (inside ? 1 : -1), cy = inside ? 18 : -18;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i) - cy, station = s - p.getZ(i), base = point(station, 0);
          const roll=trackMotionAt(station).roll,c=Math.cos(roll),sn=Math.sin(roll);
          const radialX=x*Math.cos(angle)-y*Math.sin(angle),radialY=cy+x*Math.sin(angle)+y*Math.cos(angle);
          p.setXYZ(i,base.x+radialX*c-radialY*sn,base.y+radialX*sn+radialY*c,base.z);
        }
        m.geometry.computeVertexNormals();
      });
      cap.traverse(n => { n.position.set(0,0,0); n.rotation.set(0,0,0); n.scale.set(1,1,1); }); root.add(cap);
    }
  }
  if (!gap.full) for (let at = gap.start; at < gap.end; at += PITCH) for (const side of [-1, 1]) {
    const end = Math.min(gap.end, at + PITCH), center = (at + end) / 2;
    const source = gapBorder(THREE, {length: end - at});
    if (side < 0) source.rotation.y = Math.PI;
    root.add(mountCourseSurface(THREE, source, center, section(center).halfWidth, {center: () => gap.center + side * gap.width}));
  }
  return mergeWallParts(THREE, root, {indexed:true});
}
