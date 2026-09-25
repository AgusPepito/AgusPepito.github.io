import { section, wrap } from './track.js';
import { JUMP } from './jumps.js';

// Widths are surface-coordinate half-widths. All walls are solid regardless of phase.
export const OBSTACLES = [];
export const WALL_HEIGHT = 7;
export const HOLE_HEIGHT = 3.5;

function ranges(center, width, closed) {
  return (closed ? [-2, 0, 2] : [0]).map(offset =>
    [Math.max(-1, center + offset - width), Math.min(1, center + offset + width)])
    .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
}
export function openingSpans(obstacle) {
  return ranges(obstacle.center, obstacle.width, section(obstacle.s).closed);
}
export function solidSpans(obstacle) {
  if (obstacle.kind === 'jump') return [[-1, 1]];
  const spans = openingSpans(obstacle);
  if (obstacle.kind === 'wall') return spans;
  const result = []; let left = -1;
  for (const [a, b] of spans) { if (a > left) result.push([left, a]); left = b; }
  if (left < 1) result.push([left, 1]);
  return result;
}

// Steering guidance uses surface coordinates, including the shorter route around a tube.
export function passageDirection(obstacle, u) {
  if (obstacle.kind === 'jump') return 0;
  const road = section(obstacle.s), margin = 1.8 / road.halfWidth;
  const delta = value => road.closed ? wrap(value - u) : value - u;
  const distance = Math.abs(delta(obstacle.center));
  if (obstacle.kind === 'hole') return distance < obstacle.width - margin ? 0 : Math.sign(delta(obstacle.center));
  if (distance > obstacle.width + margin) return 0;
  const clearance = 4 / road.halfWidth;
  const targets = [obstacle.center - obstacle.width - clearance, obstacle.center + obstacle.width + clearance]
    .filter(target => road.closed || Math.abs(target) < 1 - margin);
  targets.sort((a, b) => Math.abs(delta(a)) - Math.abs(delta(b)));
  return targets.length ? Math.sign(delta(targets[0])) : 0;
}

// Sweep the entire ship through the wall's thickness, including lateral movement and tube seams.
export function wallHit(obstacle, oldS, newS, oldU, newU, oldHeight = 0, newHeight = 0) {
  const travel = newS - oldS;
  if (travel <= 0) return null;
  const enter = Math.max(0, (obstacle.s - 1.95 - oldS) / travel);
  const exit = Math.min(1, (obstacle.s + obstacle.depth + 1.95 - oldS) / travel);
  if (enter > exit) return null;
  const road = section(obstacle.s), du = road.closed ? wrap(newU - oldU) : newU - oldU;
  // Include the visible wings and the smaller radius at hover height inside tubes.
  const margin = 1.65 / (road.halfWidth * (1 - road.curl * (JUMP.hover + Math.max(oldHeight, newHeight)) / 18));
  let first = null;
  const volumes = solidSpans(obstacle).map(span => ({ span, bottom: 0, top: obstacle.height ?? WALL_HEIGHT }));
  if (obstacle.kind === 'hole') for (const span of openingSpans(obstacle))
    volumes.push({ span, bottom: HOLE_HEIGHT, top: obstacle.height ?? WALL_HEIGHT });
  for (const { span: [a, b], bottom, top } of volumes) for (const offset of road.closed ? [-2, 0, 2] : [0]) {
    const low = a + offset - margin, high = b + offset + margin;
    let from = enter, to = exit;
    if (Math.abs(du) < 1e-10) { if (oldU < low || oldU > high) continue; }
    else {
      const t1 = (low - oldU) / du, t2 = (high - oldU) / du;
      from = Math.max(from, Math.min(t1, t2)); to = Math.min(to, Math.max(t1, t2));
    }
    const h = JUMP.hover + oldHeight, dh = newHeight - oldHeight;
    const lowH = bottom - JUMP.bodyHalfHeight, highH = top + JUMP.bodyHalfHeight;
    if (Math.abs(dh) < 1e-10) { if (h < lowH || h > highH) continue; }
    else {
      const t1 = (lowH - h) / dh, t2 = (highH - h) / dh;
      from = Math.max(from, Math.min(t1, t2)); to = Math.min(to, Math.max(t1, t2));
    }
    if (from <= to && (first === null || from < first)) first = from;
  }
  return first;
}
