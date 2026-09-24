import { Vector3 } from 'three';

const point = new Vector3();
// Numeric projection only. Reserve the HUD edges and require the complete body
// to be readable, rather than trusting a fixed world-space firing distance.
export function threatVisible(camera, entity) {
  const yaw = entity.yaw || 0, c = Math.cos(yaw), s = Math.sin(yaw);
  for (const x of [-entity.halfWidth, entity.halfWidth]) for (const z of [-entity.halfDepth, entity.halfDepth]) for (const y of [0.6, entity.kind === 'hauler' ? 4 : 3]) {
    point.set(entity.x + c * x + s * z, y, entity.z - s * x + c * z).project(camera);
    if (point.z <= -1 || point.z >= 1 || Math.abs(point.x) > 0.88 || point.y < -0.7 || point.y > 0.64) return false;
  }
  return true;
}
