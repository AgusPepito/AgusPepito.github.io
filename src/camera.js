import { clamp, lerp, roadFrame, roadPoint } from './track.js';
import { forkFrame } from './forks.js';

export function cameraPose(sim, aspect, cameraShift) {
  const blend = cameraShift ? clamp(sim.raceBlend || 0, 0, 1) : 0;
  const portrait = clamp((1.3 - aspect) / 0.8, 0, 1);
  // Track some fore/aft motion when close, retaining steering room below the ship.
  const anchor = sim.distance + sim.offset * blend * 0.85;
  const branch = sim.activeFork;
  const f = branch ? forkFrame(branch, sim.s) : roadFrame(anchor);
  const center = sim.forkCameraOffset || 0;
  const origin = roadPoint(anchor, lerp(center, sim.lateral, blend * 0.95));
  const behind = lerp(24 + portrait * 10, 18, blend), ahead = lerp(12, 8, blend);
  return {
    position: [origin.x - f.fx * behind, lerp(55 + portrait * 42, 10 + portrait * 4, blend), origin.z - f.fz * behind],
    target: [origin.x + f.fx * ahead, 0, origin.z + f.fz * ahead],
    fov: lerp(55, 73, blend),
  };
}
