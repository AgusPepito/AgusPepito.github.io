import { clamp, lerp, smooth, trackAt, roadPoint, rampsNear } from './track.js';

export const FORK_ROUTES = [
  { index: 0, side: -1, name: 'Darts bypass', skips: 'Darts' },
  { index: 2, side: 1, name: 'Mine-layer bypass', skips: 'Mine layers' },
];
export const FORK_RULES = { warningDistance: 420, length: 560, transition: 160, entryWidth: 9, narrowWidth: 9, outwardOffset: 42, junctionClearance: 24 };

export function createFork(index, s) {
  const route = FORK_ROUTES.find(route => route.index === index);
  if (!route) return null;
  let start = s + FORK_RULES.warningDistance;
  // Both crossing corridors must fit between same-side tunnel/ramp complexes.
  // The middle of the bypass stays outside those complexes laterally.
  for (let attempt = 0; attempt < 64; attempt++) {
    const end = start + FORK_RULES.length, clearance = FORK_RULES.junctionClearance;
    const junctions = [[start - clearance, start + FORK_RULES.transition + clearance],
      [end - FORK_RULES.transition - clearance, end + clearance]];
    let shift = 0;
    for (const ramp of rampsNear(start, 40, FORK_RULES.length + 40)) {
      if (ramp.side !== route.side) continue;
      for (const [from, to] of junctions) if (from < ramp.end + 12 && to > ramp.start - 24)
        shift = Math.max(shift, ramp.end + 12 - from + 1);
    }
    if (!shift) return { ...route, start, end, state: 'approach' };
    start += shift;
  }
  return null; // Never place a junction through a tunnel if the layout has no room.
}
export function forkSample(fork, s) {
  const at = clamp(s, fork.start, fork.end), t = at - fork.start;
  const blend = Math.min(smooth(t / FORK_RULES.transition), smooth((fork.end - at) / FORK_RULES.transition));
  const middle = clamp((t - FORK_RULES.transition) / (FORK_RULES.length - 2 * FORK_RULES.transition), 0, 1);
  const bends = Math.sin(middle * Math.PI * 4) * 5.5 * Math.sin(middle * Math.PI);
  const center = fork.side * (trackAt(at).width / 2 - FORK_RULES.entryWidth / 2 + (FORK_RULES.outwardOffset + bends) * blend);
  const width = lerp(FORK_RULES.entryWidth, FORK_RULES.narrowWidth, blend);
  return { center, width, left: center - width / 2, right: center + width / 2, ...roadPoint(at, center) };
}
export function forkFrame(fork, s) {
  const from = clamp(s - 0.1, fork.start, fork.end), to = clamp(s + 0.1, fork.start, fork.end);
  const a = forkSample(fork, from), b = forkSample(fork, to);
  const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz) || 0.1;
  return { fx: dx / length, fz: dz / length, rx: -dz / length, rz: dx / length,
    yaw: Math.atan2(-dx, -dz), scale: length / Math.max(0.001, to - from) };
}
export function forkOpensRail(fork, s, side) {
  if (side !== fork.side || s < fork.start || s > fork.end) return false;
  const sample = forkSample(fork, s);
  return Math.abs(sample.center) - sample.width / 2 <= trackAt(s).width / 2 + 0.65;
}
