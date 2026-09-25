import slabs from '../../public/assets/track/slab-surface-r1.js';
import lane from '../../public/assets/track/phase-lane-r1.js';
import serviceBelt from '../../public/assets/track/tube-service-belt-r2.js';
import emitter from '../../public/assets/track/phase-emitter-r1.js';
import checkpoint from '../../public/assets/track/checkpoint-r1.js';
import gapEdge from '../../public/assets/track/gap-edge-r1.js';
import gapBorder from '../../public/assets/track/gap-border-r1.js';
import tubeTermination from '../../public/assets/track/tube-gap-termination-r1.js';
import { LENGTH, GATES, STRIPS, PHASES, point, section, stripCenter } from './track.js';
import { GAPS } from './jumps.js';
import { OBSTACLES, WALL_HEIGHT, HOLE_HEIGHT, solidSpans } from './obstacles.js';
import { obstacleAssembly } from './obstacle-kit.js';
import { wallAssembly, mergeWallParts } from './wall-kit.js';
import { mountDetailedBay, mixedBayAt } from './mixed-kit.js';
import { cutGapLayers } from './gap-kit.js';
import { mountCourseSurface } from './course-surface.js';

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
  const layouts = [-1, 1].map((side, sideIndex) => {
    const layout = Array(Math.ceil((LENGTH + 100) / PITCH)).fill(null);
    for (let s = 100; s < LENGTH - 125; s += 400) {
      if (!clear(s - 15, s + 115) || [s, s + 50, s + 100].some(at => section(at).curl !== 0)) continue;
      for (let i = 0; i < 8; i++) layout[s / PITCH + i] = ['pipe', 'grille', 'cover', 'frame'][(Math.floor(i / 2) + sideIndex) % 4];
    }
    return layout;
  });
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

export function campaignChunk(THREE, start, decorations) {
  const root = new THREE.Group(), layers = new THREE.Group(), energy = new THREE.Group();
  const end = Math.min(start + 100, LENGTH + 100);
  for (let at = start; at < end; at += PITCH) {
    const length = Math.min(PITCH, end - at), center = at + length / 2, half = section(center).halfWidth;
    const source = slabs(THREE, {width: half * 2, length, columns: Math.max(6, Math.round(half * 2 / 5)), index: Math.floor(at / PITCH)});
    cutGapLayers(THREE, source, masksFor(at, at + length, center, half, decorations));
    layers.add(mountCourseSurface(THREE, source, center, half));
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
    layers.add(mountCourseSurface(THREE, serviceBelt(THREE, {radius: half / Math.PI, variant: belt.variant}), center, half));
  }
  for (let at = Math.max(0, Math.ceil(start / PITCH) * PITCH); at < end; at += PITCH) for (const [i, side] of [-1, 1].entries()) {
    const bay = mixedBayAt(decorations.layouts[i], at / PITCH);
    if (!bay) continue;
    const source = new THREE.Group(); mountDetailedBay(THREE, source, bay.family, bay.kind, side, 0);
    layers.add(mountCourseSurface(THREE, source, at + PITCH / 2, 18));
  }
  root.add(mergeWallParts(THREE, layers));
  const mergedEnergy = mergeWallParts(THREE, energy);
  mergedEnergy.traverse(m => { if (m.isMesh) m.renderOrder = 1; });
  root.add(mergedEnergy); root.userData.energyGroup = mergedEnergy;
  return root;
}

function finishStation(THREE, source, s, half, options) {
  const result = mergeWallParts(THREE, mountCourseSurface(THREE, source, s, half, options));
  result.traverse(m => { if (m.isMesh && m.material.name.endsWith('-curtain')) m.renderOrder = 2; });
  return result;
}

export function campaignGate(THREE, gate) {
  const half = section(gate.s).halfWidth;
  return finishStation(THREE, emitter(THREE, {width: gate.width * half * 2, color: PHASES[gate.phase].hex}), gate.s, half, {center: () => gate.center});
}

export function campaignCheckpoint(THREE) {
  const half = section(LENGTH).halfWidth;
  return finishStation(THREE, checkpoint(THREE, {width: half * 2}), LENGTH, half);
}

export function campaignObstacle(THREE, obstacle) {
  const {halfWidth: half, closed} = section(obstacle.s), height = obstacle.height ?? WALL_HEIGHT;
  const root = new THREE.Group();
  if (obstacle.kind === 'wall') {
    for (const [a, b] of solidSpans(obstacle)) root.add(wallAssembly(THREE, {width: (b - a) * half, center: (a + b) * half / 2}));
  } else {
    root.add(obstacleAssembly(THREE, {
      type: obstacle.kind === 'jump' ? 'jump-only' : height === 4.2 ? 'jump-or-opening' : 'opening-only',
      halfWidth: half, closed, opening: obstacle.width * half * 2, center: obstacle.center * half,
    }));
  }
  const sourceHeight = obstacle.kind === 'jump' ? 2.4 : height === 4.2 && obstacle.kind === 'hole' ? 4.2 : WALL_HEIGHT;
  return finishStation(THREE, root, obstacle.s, half, {prepare(geometry) {
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      // Preserve the 3.5 m opening when extending the authored 7 m P3 to
      // campaign's 9 m collision walls. Do not scale the clear route.
      const newY = obstacle.kind === 'hole' ? y <= HOLE_HEIGHT ? y : HOLE_HEIGHT + (y - HOLE_HEIGHT) * (height - HOLE_HEIGHT) / (sourceHeight - HOLE_HEIGHT) : y * height / sourceHeight;
      p.setXYZ(i, p.getX(i), newY, p.getZ(i) < 0 ? p.getZ(i) * obstacle.depth / 5 : p.getZ(i));
    }
  }});
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
          p.setXYZ(i, base.x + x * Math.cos(angle) - y * Math.sin(angle), base.y + cy + x * Math.sin(angle) + y * Math.cos(angle), base.z);
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
  return mergeWallParts(THREE, root);
}
