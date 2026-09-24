import { VEHICLE_SEEDS, COURSE_LENGTH, trackAt, roadPoint, roadLineYaw, advanceOnRoad } from './track.js';

export const NEUTRAL = { speed: 8, hp: 160 };
export function vehicleSeed(index) {
  const seed = VEHICLE_SEEDS[index % VEHICLE_SEEDS.length];
  return { ...seed, s: seed.s + Math.floor(index / VEHICLE_SEEDS.length) * COURSE_LENGTH };
}
export function createVehicle(seed, id) {
  const v = { ...seed, id, neutral: true, active: true, hp: NEUTRAL.hp, maxHp: NEUTRAL.hp,
    halfWidth: seed.w / 2, halfDepth: seed.d / 2,
    lane: seed.offset / (trackAt(seed.s).width / 2 - seed.w / 2 - 0.5) };
  moveVehicle(v, 0);
  v.oldX = v.x; v.oldZ = v.z;
  return v;
}
export function moveVehicle(v, dt, speed = NEUTRAL.speed) {
  v.oldX = v.x; v.oldZ = v.z;
  v.s = advanceOnRoad(v.s, speed * dt);
  v.lateral = v.lane * (trackAt(v.s).width / 2 - v.halfWidth - 0.5);
  Object.assign(v, roadPoint(v.s, v.lateral));
  v.yaw = roadLineYaw(v.s, v.lane / 2, -v.lane * (v.halfWidth + 0.5));
}
