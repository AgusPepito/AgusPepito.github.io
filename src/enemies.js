import { lerp, smooth, trackAt, rampSample, roadPoint, roadFrame, advanceOnRoad } from './track.js';

export const FORMATION = { count: 7, hp: 24, speed: 16, entrySeconds: 3, deploySeconds: 1.3 };

// Slots remain stable after a kill. Narrowing retracts each shield's wings and
// compresses the same slots, preserving the opening the player has earned.
export function formationSlot(width, slot, age = 0) {
  const pitch = (width - 0.8) / FORMATION.count;
  return { lateral: -width / 2 + 0.4 + (slot + 0.5) * pitch + Math.sin(age * 1.1) * 0.12,
    halfWidth: (pitch - 0.5) / 2 };
}

export function placeEnemy(e, group) {
  const age = group.age - e.slot * 0.14;
  e.active = age >= 0; e.age = Math.max(0, age);
  if (!e.active) return;
  const oldX = e.x, oldZ = e.z;
  if (age < FORMATION.entrySeconds) {
    e.s = lerp(group.ramp.start, group.ramp.end, age / FORMATION.entrySeconds);
    e.lateral = rampSample(group.ramp, e.s).lateral;
    e.halfWidth = 1.2; e.deployed = 0;
  } else {
    e.deployed = smooth((age - FORMATION.entrySeconds) / FORMATION.deploySeconds);
    const ownS = advanceOnRoad(group.ramp.end, (e.armored ? FORMATION.speed : 22) * (age - FORMATION.entrySeconds));
    e.s = e.armored ? lerp(ownS, group.s, e.deployed) : ownS;
    const width = trackAt(e.s).width;
    const slot = e.armored ? formationSlot(width, e.slot, group.age) : {
      lateral: (e.slot - 1) * (width / 2 - 2.8) * 0.6 + Math.sin(age * 1.6 + e.slot) * 0.7,
      halfWidth: 1.2,
    };
    const join = group.ramp.side * (width / 2 - 3);
    e.lateral = lerp(join, slot.lateral, e.deployed);
    e.halfWidth = lerp(1.2, slot.halfWidth, e.deployed);
  }
  Object.assign(e, roadPoint(e.s, e.lateral));
  e.oldX = oldX; e.oldZ = oldZ;
  const dx = e.x - oldX, dz = e.z - oldZ;
  e.yaw = e.deployed === 1 && e.armored ? roadFrame(e.s).yaw : Math.hypot(dx, dz) > 1e-5 ? Math.atan2(-dx, -dz) : roadFrame(e.s).yaw;
}
