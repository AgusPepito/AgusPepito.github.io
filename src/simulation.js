import { COURSE_LENGTH, clamp, lerp, trackAt, obstaclesNear } from './track.js';

export const PLAYER = { halfWidth: 0.65, halfDepth: 1.1 };

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

export class Simulation {
  constructor(options = {}) {
    this.options = { speedShift: true, invincible: false, ...options };
    this.reset();
  }
  reset() {
    this.status = 'ready';
    this.time = 0; this.distance = 30; this.speed = 26;
    this.x = 0; this.s = 30; this.offset = 0; this.vx = 0;
    this.health = 100; this.score = 0; this.kills = 0; this.passed = 0;
    this.wallHits = 0; this.hits = 0; this.lap = 1;
    this.invulnerability = 0; this.slowdown = 0;
    this.shotTimer = 0; this.waveAt = 85; this.nextId = 1;
    this.enemies = []; this.bullets = []; this.events = [];
  }
  start() { if (this.status === 'ready') this.status = 'playing'; }
  hurt(amount, kind) {
    if (this.invulnerability > 0 || this.status !== 'playing') return;
    this.health = Math.max(0, this.health - (this.options.invincible ? 0 : amount));
    this.invulnerability = 0.8;
    this.hits++; if (kind === 'wall') this.wallHits++;
    this.slowdown = kind === 'bullet' ? 0.05 : 0.55;
    this.events.push({ kind: 'hit', x: this.x, s: this.s });
    if (this.health === 0) this.status = 'over';
  }
  wave() {
    const spawnS = this.s + 80;
    const track = trackAt(spawnS);
    const racer = track.tight > 0.65;
    const index = Math.floor(this.waveAt / 40);
    const offsets = racer ? [(index % 2 ? -1 : 1) * 2.4] : [-10, 0, 10];
    for (const [i, offset] of offsets.entries()) {
      this.enemies.push({
        id: this.nextId++, s: spawnS + i * 3.5, x: track.center + offset,
        offset, racer, hp: racer ? 4 : 2, age: 0,
        fire: 1.6 + i * 0.3, phase: index + i * 1.6,
      });
    }
    this.waveAt += racer ? 135 : 95;
  }
  step(dt, input = { x: 0, y: 0 }) {
    if (this.status !== 'playing') return;
    this.time += dt;
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.slowdown = Math.max(0, this.slowdown - dt);
    const track = trackAt(this.s);
    const desiredSpeed = lerp(26, this.options.speedShift ? 43 : 26, track.tight) * (this.slowdown > 0 ? 0.77 : 1);
    this.speed = lerp(this.speed, desiredSpeed, 1 - Math.exp(-2.2 * dt));
    this.distance += this.speed * dt;
    this.offset = clamp(this.offset + clamp(input.y || 0, -1, 1) * 11 * dt, -7, 10);
    const oldS = this.s, oldX = this.x;
    this.s = this.distance + this.offset;
    this.vx = lerp(this.vx, clamp(input.x || 0, -1, 1) * 19, 1 - Math.exp(-15 * dt));
    this.x += this.vx * dt;
    const here = trackAt(this.s);
    const limit = here.width / 2 - PLAYER.halfWidth - 0.18;
    const inside = clamp(this.x, here.center - limit, here.center + limit);
    if (inside !== this.x) { this.x = inside; this.vx *= 0.2; this.hurt(8, 'wall'); }

    const newLap = Math.floor(this.distance / COURSE_LENGTH) + 1;
    if (newLap > this.lap) {
      this.lap = newLap; this.score += 1000;
      this.health = Math.min(100, this.health + 25);
      this.events.push({ kind: 'lap', x: this.x, s: this.s });
    }

    for (const o of obstaclesNear(this.s, 8, 8)) {
      if (segmentHitsBox(oldX, oldS, this.x, this.s, o.x, o.s, o.w / 2 + PLAYER.halfWidth, o.d / 2 + PLAYER.halfDepth)) {
        this.hurt(22, 'obstacle');
      }
    }
    if (this.distance >= this.waveAt) this.wave();
    this.shotTimer -= dt;
    if (this.shotTimer <= 0) {
      this.shotTimer += 0.16;
      for (const side of [-0.38, 0.38]) this.bullets.push({
        id: this.nextId++, x: this.x + side, s: this.s + 1.4,
        vx: 0, vs: this.speed + 105, friendly: true, life: 1.4,
      });
    }
    for (const e of this.enemies) {
      e.age += dt; e.s += (e.racer ? 26 : 13) * dt;
      const road = trackAt(e.s);
      const offset = clamp(e.offset, -road.width / 2 + 2, road.width / 2 - 2);
      e.x = road.center + offset + Math.sin(e.age * 1.6 + e.phase) * (e.racer ? 0.6 : 1.6);
      e.fire -= dt;
      if (!e.racer && road.tight < 0.5 && e.fire <= 0 && e.s > this.s + 9 && e.s < this.s + 65) {
        e.fire = 2.25;
        const dx = this.x - e.x, ds = this.s - e.s;
        const length = Math.hypot(dx, ds);
        for (const spread of [-0.15, 0, 0.15]) {
          const angle = Math.atan2(dx, -ds) + spread;
          this.bullets.push({ id: this.nextId++, x: e.x, s: e.s - 1.6, vx: Math.sin(angle) * 17, vs: -Math.cos(angle) * 17, friendly: false, life: Math.min(5, length / 12 + 1) });
        }
      }
      if (segmentHitsBox(oldX, oldS, this.x, this.s, e.x, e.s, 1.2 + PLAYER.halfWidth, 1.6 + PLAYER.halfDepth)) this.hurt(18, 'enemy');
      if (e.s < this.s - 10 && !e.passed) { e.passed = true; this.passed++; this.score += 40; }
    }
    for (const b of this.bullets) {
      const bx = b.x, bs = b.s;
      b.x += b.vx * dt; b.s += b.vs * dt; b.life -= dt;
      if (b.friendly) {
        for (const e of this.enemies) if (e.hp > 0 && segmentHitsBox(bx, bs, b.x, b.s, e.x, e.s, 1.25, 1.8)) {
          b.life = 0; e.hp--;
          if (e.hp === 0) {
            this.kills++; this.score += e.racer ? 180 : 100;
            this.events.push({ kind: 'kill', x: e.x, s: e.s });
          } else this.events.push({ kind: 'spark', x: e.x, s: e.s });
          break;
        }
      } else if (segmentHitsBox(bx, bs, b.x, b.s, this.x, this.s, PLAYER.halfWidth + 0.15, PLAYER.halfDepth + 0.15)) {
        b.life = 0; this.hurt(12, 'bullet');
      }
      const lane = trackAt(b.s);
      if (Math.abs(b.x - lane.center) > lane.width / 2) b.life = 0;
    }
    this.enemies = this.enemies.filter(e => e.hp > 0 && e.s > this.s - 25);
    this.bullets = this.bullets.filter(b => b.life > 0 && b.s > this.s - 20 && b.s < this.s + 170);
  }
}
