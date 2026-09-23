import { clamp, lerp, trackAt } from './track.js';

export function cameraPose(sim, aspect, cameraShift) {
  const road = trackAt(sim.distance);
  const blend = cameraShift ? clamp(sim.raceBlend || 0, 0, 1) : 0;
  const portrait = clamp((1.3 - aspect) / 0.8, 0, 1);
  // Track some fore/aft motion when close, retaining steering room below the ship.
  const anchor = sim.distance + sim.offset * blend * 0.85;
  const lookAhead = trackAt(anchor + 24);
  return {
    position: [lerp(road.center, sim.x, blend * 0.95), lerp(55 + portrait * 42, 10 + portrait * 4, blend), -anchor + lerp(24 + portrait * 10, 18, blend)],
    target: [lerp(road.center, sim.x + (lookAhead.center - road.center) * 0.08, blend * 0.95), 0, -anchor - lerp(12, 8, blend)],
    fov: lerp(55, 73, blend),
  };
}
