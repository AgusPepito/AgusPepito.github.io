import { COURSE_LENGTH, clamp, lerp, trackAt, roadFrame, roadPoint, roadCoordinates, advanceOnRoad, rampsNear, rampSample, drivableBounds } from './track.js';
import { FORMATION, placeEnemy, SHIELD_VOLLEY, shieldVolley } from './enemies.js';
import { vehicleSeed, createVehicle, moveVehicle } from './neutral-traffic.js';

export const PLAYER = { halfWidth: 0.65, halfDepth: 1.1 };
export const SPEED = { combat: 26, racing: 82 };

// Swept collision prevents fast bullets tunneling through ships between updates.
export function segmentHitsBox(ax, az, bx, bz, x, z, hw, hd) {
  let lo = 0, hi = 1;
  for (const [origin, delta, min, max] of [
    [ax, bx - ax, x - hw, x + hw],
    [az, bz - az, z - hd, z + hd],
  ]) {
    if (Math.abs(delta) < 1e-9) { if (origin < min || origin > max) return false; }
    else {
      let a = (min - origin) / delta, b = (max - origin) / delta;
      if (a > b) [a, b] = [b, a];
      lo = Math.max(lo, a); hi = Math.min(hi, b);
      if (lo > hi) return false;
    }
  }
  return true;
}

// Test in the target's road-aligned frame, including its movement during the step.
export function sweptHitsEntity(ax, az, bx, bz, target, hw, hd) {
  const c = Math.cos(target.yaw || 0), s = Math.sin(target.yaw || 0);
  const aX = ax - (target.oldX ?? target.x), aZ = az - (target.oldZ ?? target.z);
  const bX = bx - target.x, bZ = bz - target.z;
  return segmentHitsBox(c * aX - s * aZ, s * aX + c * aZ,
    c * bX - s * bZ, s * bX + c * bZ, 0, 0, hw, hd);
}

export class Simulation {
  constructor(options = {}) {
    this.options = { speedShift: true, invincible: false, ...options };
    this.reset();
  }
  reset() {
    this.status = 'ready';
    this.time = 0; this.distance = 30; this.speed = SPEED.combat;
    this.racingHeld = false; this.raceBlend = 0;
    this.x = 0; this.z = -30; this.s = 30; this.lateral = 0; this.offset = 0; this.vx = 0; this.yaw = 0;
    this.health = 100; this.score = 0; this.kills = 0; this.passed = 0;
    this.wallHits = 0; this.hits = 0; this.lap = 1;
    this.invulnerability = 0; this.slowdown = 0; this.shieldRecovery = 0; this.followingShield = false;
    this.shotTimer = 0; this.nextId = 1; this.deathReason = '';
    this.groups = []; this.spawnedRamps = new Map();
    this.enemies = []; this.bullets = []; this.events = [];
    this.vehicles = []; this.nextVehicleSeed = 0; this.vehiclesDestroyed = 0;
    this.streamVehicles();
  }
  start() { if (this.status === 'ready') this.status = 'playing'; }
  hurt(amount, kind) {
    if (this.status !== 'playing') return;
    // Yellow traffic collisions remain lethal, even during the grace period after a hit.
    // Explicit no-damage practice mode remains available for mechanics testing.
    if (kind === 'obstacle' && !this.options.invincible) {
      this.health = 0; this.hits++; this.status = 'over'; this.deathReason = 'Yellow vehicle collision';
      this.events.push({ kind: 'hit', x: this.x, z: this.z, s: this.s });
      return;
    }
    if (this.invulnerability > 0 || this.status !== 'playing') return;
    const impact = kind === 'bullet' ? amount : Math.round(amount * lerp(1, 1.8, clamp((this.speed - SPEED.combat) / (SPEED.racing - SPEED.combat), 0, 1)));
    this.health = Math.max(0, this.health - (this.options.invincible ? 0 : impact));
    this.invulnerability = 0.8;
    this.hits++; if (kind === 'wall') this.wallHits++;
    this.slowdown = kind === 'bullet' ? 0.05 : 0.55;
    this.events.push({ kind: 'hit', x: this.x, z: this.z, s: this.s });
    if (this.health === 0) this.status = 'over';
  }
  spawnRamp(ramp) {
    const group = { id: this.nextId++, ramp, age: 0, s: ramp.end };
    this.groups.push(group); this.spawnedRamps.set(ramp.key, ramp.end);
    const armored = ramp.kind === 'armored', count = armored ? FORMATION.count : 3;
    for (let slot = 0; slot < count; slot++) {
      this.enemies.push({ id: this.nextId++, groupId: group.id, slot, armored,
        s: ramp.start, ...rampSample(ramp, ramp.start), oldX: undefined, oldZ: undefined,
        hp: armored ? FORMATION.hp : 3, maxHp: armored ? FORMATION.hp : 3,
        halfWidth: 1.2, halfDepth: armored ? 1.5 : 1.6,
        active: false, deployed: 0, yaw: roadFrame(ramp.start).yaw, age: 0, fire: 1.5 + slot * 0.3 });
    }
  }
  streamVehicles() {
    if (this.options.neutralTraffic === false) return;
    while (vehicleSeed(this.nextVehicleSeed).s <= this.s + 320) {
      const seed = vehicleSeed(this.nextVehicleSeed++);
      if (seed.s >= this.s - 40) this.vehicles.push(createVehicle(seed, this.nextId++));
    }
  }
  step(dt, input = { x: 0, y: 0 }) {
    if (this.status !== 'playing') return;
    this.time += dt;
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.slowdown = Math.max(0, this.slowdown - dt);
    this.shieldRecovery = Math.max(0, this.shieldRecovery - dt);
    this.racingHeld = Boolean(input.racing);
    this.raceBlend = lerp(this.raceBlend, this.racingHeld ? 1 : 0, 1 - Math.exp(-7 * dt));
    let desiredSpeed = lerp(SPEED.combat, this.options.speedShift ? SPEED.racing : SPEED.combat, this.raceBlend) * (this.slowdown > 0 ? 0.65 : 1);
    this.followingShield = false;
    if (!this.racingHeld) for (const e of this.enemies) {
      if (!e.armored || !e.active || e.hp <= 0 || e.deployed < 1 || e.s <= this.s) continue;
      // Combat mode follows only the intact carrier in our path. A shot-out slot
      // immediately releases the speed limit, allowing the player through the gap.
      if (Math.abs(e.lateral - this.lateral) > e.halfWidth + PLAYER.halfWidth + 0.35) continue;
      const gap = e.s - this.s - e.halfDepth - PLAYER.halfDepth;
      const followSpeed = FORMATION.speed + Math.max(0, gap - FORMATION.followGap) * 2.5;
      if (followSpeed < desiredSpeed) { desiredSpeed = followSpeed; this.followingShield = true; }
    }
    if (this.shieldRecovery > 0) desiredSpeed = Math.min(desiredSpeed, FORMATION.speed * 0.75);
    this.speed = lerp(this.speed, desiredSpeed, 1 - Math.exp(-(this.followingShield ? 12 : 4.5) * dt));
    this.distance = advanceOnRoad(this.distance, this.speed * dt);
    this.offset = clamp(this.offset + clamp(input.y || 0, -1, 1) * 11 * dt, -7, 10);
    const oldX = this.x, oldZ = this.z;
    this.s = this.distance + this.offset;
    this.vx = lerp(this.vx, clamp(input.x || 0, -1, 1) * 19, 1 - Math.exp(-15 * dt));
    this.lateral += this.vx * dt;
    const bounds = drivableBounds(this.s), margin = PLAYER.halfWidth + 0.18;
    const inside = clamp(this.lateral, bounds.left + margin, bounds.right - margin);
    const wallContact = inside !== this.lateral;
    this.lateral = inside;
    Object.assign(this, roadPoint(this.s, this.lateral));
    this.yaw = roadFrame(this.s).yaw;
    if (wallContact) { this.vx *= 0.2; this.hurt(8, 'wall'); }

    const newLap = Math.floor(this.distance / COURSE_LENGTH) + 1;
    if (newLap > this.lap) {
      this.lap = newLap; this.score += 1000;
      this.health = Math.min(100, this.health + 25);
      this.events.push({ kind: 'lap', x: this.x, z: this.z, s: this.s });
    }

    this.streamVehicles();
    for (const o of this.vehicles) {
      moveVehicle(o, dt);
      if (o.hp > 0 && sweptHitsEntity(oldX, oldZ, this.x, this.z, o, o.halfWidth + PLAYER.halfWidth, o.halfDepth + PLAYER.halfDepth)) {
        this.hurt(22, 'obstacle');
        if (this.status === 'over') return;
      }
    }
    if (this.options.traffic !== false) for (const ramp of rampsNear(this.s, 0, 190)) {
      if (ramp.start < this.s - 15 || this.spawnedRamps.has(ramp.key)) continue;
      this.spawnRamp(ramp);
    }
    for (const [key, end] of this.spawnedRamps) if (end < this.s - 100) this.spawnedRamps.delete(key);
    for (const group of this.groups) {
      group.age += dt;
      if (group.age > FORMATION.entrySeconds) group.s = advanceOnRoad(group.s, FORMATION.speed * dt);
    }
    this.shotTimer -= dt;
    if (this.shotTimer <= 0) {
      this.shotTimer += 0.16;
      const f = roadFrame(this.s);
      for (const side of [-0.38, 0.38]) this.bullets.push({
        id: this.nextId++, x: this.x + f.rx * side + f.fx * 1.4, z: this.z + f.rz * side + f.fz * 1.4, s: this.s + 1.4,
        vx: f.fx * (this.speed + 105), vz: f.fz * (this.speed + 105), friendly: true, life: 1.4,
      });
    }
    for (const e of this.enemies) {
      const group = this.groups.find(g => g.id === e.groupId);
      if (!group) continue;
      placeEnemy(e, group);
      if (!e.active) continue;
      const road = trackAt(e.s);
      e.fire -= dt;
      if (!e.armored && e.deployed === 1 && road.tight < 0.5 && e.fire <= 0 && e.s > this.s + 9 && e.s < this.s + 65) {
        e.fire = 2.25;
        const dx = this.x - e.x, dz = this.z - e.z;
        const length = Math.hypot(dx, dz), f = roadFrame(e.s);
        for (const spread of [-0.15, 0, 0.15]) {
          const angle = Math.atan2(dx, dz) + spread;
          this.bullets.push({ id: this.nextId++, x: e.x - f.fx * 1.6, z: e.z - f.fz * 1.6, s: e.s - 1.6, vx: Math.sin(angle) * 17, vz: Math.cos(angle) * 17, friendly: false, life: Math.min(5, length / 12 + 1) });
        }
      }
      if (sweptHitsEntity(oldX, oldZ, this.x, this.z, e, e.halfWidth + PLAYER.halfWidth, e.halfDepth + PLAYER.halfDepth)) {
        this.hurt(e.armored ? FORMATION.impact : 18, 'enemy');
        if (e.armored && this.status === 'playing') {
          // A solid shield row cannot be skipped by exploiting damage immunity.
          this.s = Math.min(this.s, e.s - e.halfDepth - PLAYER.halfDepth - 0.4);
          this.distance = this.s - this.offset; this.speed = Math.min(this.speed, FORMATION.speed * 0.65);
          this.shieldRecovery = FORMATION.recoverySeconds;
          Object.assign(this, roadPoint(this.s, this.lateral)); this.yaw = roadFrame(this.s).yaw;
        }
        if (this.status === 'over') return;
      }
      if (e.s < this.s - 10 && !e.passed) { e.passed = true; this.passed++; this.score += 40; }
    }
    for (const group of this.groups) {
      if (group.ramp.kind !== 'armored' || this.options.shieldFire === false) continue;
      const members = this.enemies.filter(e => e.groupId === group.id);
      for (const e of shieldVolley(group, members, this.s)) {
        const f = roadFrame(e.s), muzzle = e.halfDepth + 0.5;
        this.bullets.push({ id: this.nextId++, sourceId: e.id, pattern: 'shield', slot: e.slot,
          x: e.x - f.fx * muzzle, z: e.z - f.fz * muzzle, s: e.s - muzzle,
          vx: -f.fx * SHIELD_VOLLEY.speed, vz: -f.fz * SHIELD_VOLLEY.speed, friendly: false, life: 4 });
      }
    }
    for (const b of this.bullets) {
      const bx = b.x, bz = b.z;
      b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt;
      const projected = roadCoordinates(b.x, b.z); b.s = projected.s;
      if (b.friendly) {
        // Process targets from the shot's origin so a truck absorbs shots before
        // enemies behind it. Swept tests still account for target motion.
        const targets = [...this.enemies, ...this.vehicles].filter(e => e.active && e.hp > 0)
          .sort((a, c) => Math.hypot(a.x - bx, a.z - bz) - Math.hypot(c.x - bx, c.z - bz));
        for (const e of targets) if (sweptHitsEntity(bx, bz, b.x, b.z, e, e.halfWidth + 0.05, e.halfDepth + 0.2)) {
          b.life = 0; e.hp--;
          if (e.hp === 0) {
            if (e.neutral) this.vehiclesDestroyed++;
            else { this.kills++; this.score += e.armored ? 400 : 100; }
            this.events.push({ kind: 'kill', x: e.x, z: e.z, s: e.s });
          } else this.events.push({ kind: 'spark', x: e.x, z: e.z, s: e.s });
          break;
        }
      } else if (sweptHitsEntity(bx, bz, b.x, b.z, { x: this.x, z: this.z, oldX, oldZ, yaw: this.yaw }, PLAYER.halfWidth + 0.15, PLAYER.halfDepth + 0.15)) {
        b.life = 0; this.hurt(12, 'bullet');
      }
      const lane = drivableBounds(b.s);
      if (projected.lateral < lane.left || projected.lateral > lane.right) b.life = 0;
    }
    this.enemies = this.enemies.filter(e => e.hp > 0 && (!e.active || e.s > this.s - 25));
    this.vehicles = this.vehicles.filter(v => v.hp > 0 && v.s > this.s - 60);
    this.groups = this.groups.filter(g => this.enemies.some(e => e.groupId === g.id));
    this.bullets = this.bullets.filter(b => b.life > 0 && b.s > this.s - 20 && b.s < this.s + 170);
  }
}
