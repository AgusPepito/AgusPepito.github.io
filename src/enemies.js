import { lerp, smooth, trackAt, rampSample, roadPoint, roadFrame, advanceOnRoad } from './track.js';

export const FORMATION = {
  count: 7, hp: 12, speed: 22, entrySeconds: 3, deploySeconds: 1.3,
  followGap: 12, impact: 18, recoverySeconds: 1.25,
};

export const SHIELD_VOLLEY = { delay: 0.18, period: 3.8, warning: 0.7, speed: 18, minRange: 12, maxRange: 105 };

// Shared row clock preserves left-to-right timing even when a slot is destroyed.
// Arm only after merging; passing the row cancels its attacks instead of chasing.
export function shieldVolley(group, members, playerS) {
  const alive = members.filter(e => e.hp > 0);
  for (const e of members) e.charge = 0;
  const gap = group.s - playerS;
  if (!alive.length || alive.some(e => !e.active || e.deployed < 1) || gap < SHIELD_VOLLEY.minRange || gap > SHIELD_VOLLEY.maxRange) {
    group.volleyAt = null; return [];
  }
  if (group.volleyAt == null) {
    group.volleyAt = group.age + SHIELD_VOLLEY.warning;
    group.volleyIndex = (group.volleyIndex ?? -1) + 1;
  }
  while (group.age >= group.volleyAt + SHIELD_VOLLEY.period) {
    group.volleyAt += SHIELD_VOLLEY.period; group.volleyIndex++;
  }
  const firing = [];
  for (const e of alive) {
    const due = group.volleyAt + e.slot * SHIELD_VOLLEY.delay;
    if (e.lastVolley === group.volleyIndex) continue;
    e.charge = Math.max(0, 1 - (due - group.age) / SHIELD_VOLLEY.warning);
    if (group.age >= due) {
      e.lastVolley = group.volleyIndex; e.charge = 0; firing.push(e);
    }
  }
  return firing;
}

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
