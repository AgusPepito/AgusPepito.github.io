import { clamp, lerp, smooth, trackAt, roadPoint, roadFrame, advanceOnRoad, roadCoordinates } from './track.js';
import { SCOUT_FIRE } from './scout-fire.js';

export const ENCOUNTERS = {
  darts: { name: 'Dart squadron', hint: 'RED: direct burst · CYAN: prediction · GOLD: spread. Move, stop, reverse.' },
  interceptors: { name: 'Interceptors', hint: 'Bait the orange path. Dodge after it locks. Hit the exposed engine.' },
  mines: { name: 'Orbit mine layers', hint: 'Shoot a rotating gap. Cyan mines are unarmed; orange mines are live.' },
  convoy: { name: 'Armed convoy', hint: 'Destroy rear turrets for safety, or raid the three locks for salvage.' },
};
export const ENCOUNTER_RULES = {
  dartHold: 2.2, dartWarning: 0.7, dartChange: 1, dartAttackGap: 0.25, dartLead: 6,
  interceptorAim: 0.55, interceptorLock: 0.65, interceptorCharge: 0.75, interceptorRecovery: 1.6,
  dashWarning: 0.65, dashDuration: 1.05, dashDistance: 14,
  dartWaves: 3, dartWaveInterval: 7, visibleWarning: 0.7, supportInterval: 4.8,
  mineArm: 0.85, mineDrop: 1.3, mineWallPeriod: 5.5, orbitRadius: 3.8, orbitSpeed: 0.9, orbitDrift: 6,
  blastRadius: 3.5, mineLimit: 96, reward: 600, clearBonus: 2000,
};
export const ATTACK_COLORS = { direct: 0xff6070, predict: 0x60ddff, spread: 0xffcc55, track: 0xff6070, sweep: 0xffcc55 };

function locate(e, s, lateral) {
  e.oldX = e.x; e.oldZ = e.z;
  e.s = s;
  const edge = Math.max(0, trackAt(s).width / 2 - e.halfWidth - 0.5);
  e.lateral = clamp(lateral, -edge, edge);
  Object.assign(e, roadPoint(s, e.lateral)); e.yaw = roadFrame(s).yaw;
  e.oldX ??= e.x; e.oldZ ??= e.z;
}

export class Encounter {
  constructor(sim, type) {
    this.sim = sim; this.type = type; this.age = 0; this.members = [];
    this.mines = []; this.clusters = []; this.blasts = []; this.pickups = []; this.locksOpened = 0; this.collected = 0;
    this.notice = ''; this.noticeUntil = 0;
    this.result = ''; this.outcome = ''; this.finishTimer = 0; this.hint = ENCOUNTERS[type].hint;
    this.anchor = sim.distance + 30;
    this.supportTimer = 0.9; this.supportWave = 0;
    if (type === 'darts') {
      this.waves = []; this.dartAttack = null; this.dartLastId = 0; this.dartDelay = 0.2;
      this.spawnDartWave();
    }
    if (type === 'interceptors') {
      for (let slot = 0; slot < 3; slot++) {
        const e = this.add('interceptor', slot, sim.distance + 32 + slot * 3, [-8, 8, 0][slot], 12, 1.25, 2);
        e.phase = 'waiting'; e.phaseAge = 0; e.contact = false;
      }
      this.turn = 0; this.attackDelay = 0.5;
    }
    if (type === 'mines') {
      this.layers = [-1, 1].map((side, slot) => {
        const e = this.add('minelayer', slot, sim.distance + 34 + slot * 5, side * 7, 30, 1.6, 2.2);
        e.dropTimer = 0.8 + slot * 1.1; return e;
      });
      this.wallTimer = 3.5; this.wallCount = 0;
      for (let row = 0; row < 2; row++) this.dropCluster(sim.s + 18 + row * 14, row ? 5 : -5, row ? -1 : 1);
    }
    if (type === 'convoy') {
      this.hauler = this.add('hauler', 0, this.anchor, 0, Infinity, 3.7, 6.5);
      this.hauler.hideHealth = true; this.hauler.followSpeed = 24;
      this.convoyLane = 0; this.laneCycle = -1;
      this.locks = [-2.55, 0, 2.55].map((x, slot) => this.add('lock', slot, this.anchor - 7.2, x, 16, 0.78, 0.5));
      this.turrets = [-3.3, -1.1, 1.1, 3.3].map((x, slot) => {
        const e = this.add('turret', slot, this.anchor - 8.4, x, 10, 0.6, 0.65);
        e.role = slot % 2 ? 'sweep' : 'track'; return e;
      });
    }
  }
  add(kind, slot, s, lateral, hp, halfWidth, halfDepth) {
    const e = { id: this.sim.nextId++, encounter: true, kind, slot, hp, maxHp: hp, halfWidth, halfDepth,
      active: true, age: 0, deployed: 1, armored: false, charge: 0, fire: 0, visibleFor: 0 };
    locate(e, s, lateral); this.members.push(e); this.sim.enemies.push(e); return e;
  }
  shoot(e, pattern, speed = 15, target = null, spread = 0) {
    if (e.hp <= 0 || e.s < this.sim.s + 8 || !this.isVisible(e) || e.visibleFor < ENCOUNTER_RULES.visibleWarning) return;
    const f = roadFrame(e.s), behind = e.halfDepth + 0.5;
    const x = e.x - f.fx * behind, z = e.z - f.fz * behind;
    const angle = (target ? Math.atan2(target.x - x, target.z - z) : Math.atan2(-f.fx, -f.fz)) + spread;
    this.sim.bullets.push({ id: this.sim.nextId++, sourceId: e.id, pattern, slot: e.slot,
      x, z, s: e.s - behind, vx: Math.sin(angle) * speed, vz: Math.cos(angle) * speed, friendly: false, life: 5, color: ATTACK_COLORS[e.role] });
  }
  isVisible(e) {
    return this.sim.threatVisible ? this.sim.threatVisible(e) : e.s > this.sim.s - 5 && e.s < this.sim.distance + 45;
  }
  primaryResolved() {
    if (this.type === 'darts' && this.waves.length < ENCOUNTER_RULES.dartWaves) return false;
    if (this.type === 'convoy' && this.locksOpened === 3) return true;
    return this.members.filter(e => !e.support && e.kind !== 'lock').every(e => e.hp <= 0 || e.passed);
  }
  updateSupports(dt) {
    if (this.sim.options.encounterSupport === false) return;
    this.supportTimer -= dt;
    if (this.supportTimer <= 0 && !this.primaryResolved()) {
      const alive = this.members.filter(e => e.support && e.hp > 0 && !e.passed);
      if (alive.length <= 2) for (let slot = 0; slot < 2; slot++) {
        const side = (slot + this.supportWave) % 2 ? 1 : -1;
        const s = this.sim.distance + 25 + slot * 5;
        const e = this.add('scout', slot, s, side * Math.min(14, trackAt(s).width / 2 - 2), 3, 1.2, 1.6);
        e.support = true; e.side = side; e.fire = 1 + slot * SCOUT_FIRE.volleyGap; e.entryLane = e.lateral;
      }
      this.supportWave++; this.supportTimer = ENCOUNTER_RULES.supportInterval;
    }
    for (const e of this.members) if (e.support && e.hp > 0 && !e.passed) {
      const s = advanceOnRoad(e.s, 22 * dt), edge = Math.min(9, trackAt(s).width / 2 - 2);
      const lane = e.side * edge * 0.65 + Math.sin(e.age * 1.6 + e.slot) * 2;
      locate(e, s, lerp(e.entryLane, lane, smooth(e.age / 1.2)));
      e.fire -= dt; e.charge = e.fire < 0.7 ? 1 : 0;
      if (e.fire <= 0 && this.sim.time >= this.sim.scoutNextFire && e.s >= this.sim.s + 8 &&
          this.isVisible(e) && e.visibleFor >= ENCOUNTER_RULES.visibleWarning) {
        for (const spread of [-SCOUT_FIRE.spread, 0, SCOUT_FIRE.spread])
          this.shoot(e, 'scout', SCOUT_FIRE.speed, { x: this.sim.x, z: this.sim.z }, spread);
        e.fire = SCOUT_FIRE.cooldown;
        this.sim.scoutNextFire = this.sim.time + SCOUT_FIRE.volleyGap;
      }
    }
  }
  aimPoint(e, lane = this.sim.lateral, speed = 27) {
    // Predict one point at firing time; bullets never track after launch.
    const travel = Math.max(0, e.s - this.sim.s) / (speed + this.sim.speed);
    return roadPoint(this.sim.s + this.sim.speed * travel, lane);
  }
  spawnDartWave() {
    const wave = { index: this.waves.length, age: 0, anchor: this.sim.distance + 24 };
    this.waves.push(wave);
    for (let slot = 0; slot < 6; slot++) {
      const e = this.add('dart', slot, wave.anchor + Math.abs(slot - 2.5) * 5, (slot - 2.5) * 5, 6, 0.8, 1.2);
      e.wave = wave.index; e.role = ['direct', 'predict', 'spread'][slot % 3];
    }
  }
  update(dt) {
    this.age += dt;
    for (const e of this.members) { e.age += dt; e.charge = 0; e.visibleFor = this.isVisible(e) ? e.visibleFor + dt : 0; }
    if (this.type === 'darts') this.updateDarts(dt);
    if (this.type === 'interceptors') this.updateInterceptors(dt);
    if (this.type === 'mines') this.updateLayer(dt);
    if (this.type === 'convoy') this.updateConvoy(dt);
  }
  updateDarts(dt) {
    if (this.waves.length < ENCOUNTER_RULES.dartWaves && this.age >= this.waves.length * ENCOUNTER_RULES.dartWaveInterval) this.spawnDartWave();
    for (const wave of this.waves) this.updateDartWave(wave, dt);
    this.updateDartFire(dt);
    this.hint = `WAVE ${this.waves.length}/3 · ${ENCOUNTERS.darts.hint}`;
  }
  updateDartWave(wave, dt) {
    const duration = ENCOUNTER_RULES.dartHold + ENCOUNTER_RULES.dartWarning + ENCOUNTER_RULES.dartChange;
    wave.age += dt; wave.anchor = advanceOnRoad(wave.anchor, 24 * dt);
    const cycle = Math.floor(wave.age / duration), phase = wave.age % duration;
    const blend = smooth((phase - ENCOUNTER_RULES.dartHold - ENCOUNTER_RULES.dartWarning) / ENCOUNTER_RULES.dartChange);
    const column = cycle % 2 ? 1 - blend : blend;
    const warning = phase >= ENCOUNTER_RULES.dartHold && phase < ENCOUNTER_RULES.dartHold + ENCOUNTER_RULES.dartWarning;
    const members = this.members.filter(e => e.wave === wave.index && e.hp > 0 && !e.passed);
    for (const e of members) {
      const span = Math.min(5, (trackAt(wave.anchor).width / 2 - 2) / 2.5);
      const vX = (e.slot - 2.5) * span, colX = (e.slot % 2 ? 1 : -1) * span;
      const vS = Math.abs(e.slot - 2.5) * 5, colS = e.slot * 4;
      locate(e, wave.anchor + lerp(vS, colS, column), lerp(vX, colX, column));
      e.formationWarning = warning;
    }
  }
  updateDartFire(dt) {
    const ready = e => e.hp > 0 && !e.passed && e.s >= this.sim.s + 8 &&
      this.isVisible(e) && e.visibleFor >= ENCOUNTER_RULES.visibleWarning;
    // One firing turn across ALL waves. No overdue volleys accumulate offscreen.
    if (this.dartAttack && !ready(this.dartAttack.enemy)) {
      this.dartAttack.enemy.charge = 0;
      this.dartAttack = null; this.dartDelay = ENCOUNTER_RULES.dartAttackGap;
      return;
    }
    if (!this.dartAttack) {
      this.dartDelay -= dt;
      if (this.dartDelay > 0) return;
      const candidates = this.members.filter(e => e.kind === 'dart' && ready(e));
      const e = candidates.find(e => e.id > this.dartLastId) || candidates[0];
      if (!e) return;
      this.dartLastId = e.id;
      const delay = ENCOUNTER_RULES.dartWarning;
      const travel = Math.max(0, e.s - this.sim.s) / (32 + this.sim.speed);
      const lead = e.role === 'predict' ? clamp(this.sim.vx * (delay + travel), -ENCOUNTER_RULES.dartLead, ENCOUNTER_RULES.dartLead) : 0;
      const targetS = e.role === 'direct' ? this.sim.s : Math.min(e.s - 8, this.sim.s + this.sim.speed * (delay + travel));
      const edge = trackAt(targetS).width / 2 - 1;
      e.aimLane = clamp(this.sim.lateral + lead, -edge, edge);
      e.aimTarget = roadPoint(targetS, e.aimLane);
      this.dartAttack = { enemy: e, age: 0, shot: 0 };
      e.charge = 1; return;
    }
    const attack = this.dartAttack, e = attack.enemy;
    attack.age += dt; e.charge = attack.age < ENCOUNTER_RULES.dartWarning ? 1 : 0;
    if (attack.age < ENCOUNTER_RULES.dartWarning + attack.shot * 0.16) return;
    if (e.role === 'spread') for (const spread of [-0.18, 0, 0.18]) this.shoot(e, 'dart-spread', 28, e.aimTarget, spread);
    else this.shoot(e, `dart-${e.role}`, e.role === 'predict' ? 36 : 30, e.aimTarget);
    attack.shot++;
    if (attack.shot >= (e.role === 'direct' ? 3 : 1)) {
      this.dartAttack = null; this.dartDelay = ENCOUNTER_RULES.dartAttackGap;
    }
  }
  updateInterceptors(dt) {
    const sim = this.sim, rules = ENCOUNTER_RULES;
    const rivals = this.members.filter(e => e.kind === 'interceptor' && e.hp > 0 && !e.passed);
    let attacker = rivals.find(e => ['aim', 'locked', 'charge', 'dashWarning', 'dash'].includes(e.phase));
    if (!attacker) {
      this.attackDelay -= dt;
      const waiting = rivals.filter(e => e.phase === 'waiting' && e.visibleFor >= ENCOUNTER_RULES.visibleWarning);
      if (this.attackDelay <= 0 && waiting.length) {
        attacker = waiting.find(e => e.slot === this.turn) || waiting[0];
        attacker.phase = 'aim'; attacker.phaseAge = 0; attacker.contact = false;
      }
    }
    for (const e of rivals) {
      e.phaseAge += dt;
      if (e.phase === 'waiting' || e.phase === 'aim' || e.phase === 'locked') {
        const destination = Math.max(sim.s + 16, sim.distance + (e.phase === 'waiting' ? 32 + e.slot * 3 : 26));
        // Feed forward player travel so pacing does not lag into the player at boost speed.
        const s = lerp(advanceOnRoad(e.s, sim.speed * dt), destination, 1 - Math.exp(-5 * dt));
        const side = [-1, 1, 0][e.slot], edge = trackAt(s).width / 2 - 2.5;
        const flank = clamp(lerp(side * Math.min(8, edge), sim.lateral + side * 5, sim.raceBlend), -edge, edge);
        locate(e, s, lerp(e.lateral, flank, 1 - Math.exp(-4 * dt)));
        if (e.phase !== 'waiting' && !this.isVisible(e)) { e.phase = 'aim'; e.phaseAge = 0; }
      }
      if (e.phase === 'aim') {
        e.targetLane = sim.lateral;
        e.charge = e.phaseAge / rules.interceptorAim;
        this.hint = 'BAIT THE PATH — it is still tracking your lane.';
        if (e.phaseAge >= rules.interceptorAim) { e.phase = 'locked'; e.phaseAge = 0; }
      } else if (e.phase === 'locked') {
        e.charge = 1; this.hint = 'PATH LOCKED — move sideways now.';
        if (e.phaseAge >= rules.interceptorLock) {
          e.phase = 'charge'; e.phaseAge = 0; e.startLane = e.lateral; e.startGap = e.s - sim.s;
        }
      } else if (e.phase === 'charge') {
        const t = smooth(e.phaseAge / rules.interceptorCharge);
        const gap = lerp(e.startGap, 1.5, t);
        locate(e, sim.s + gap, lerp(e.startLane, e.targetLane, t));
        this.hint = 'DODGE THE CHARGE';
        if (e.phaseAge >= rules.interceptorCharge) {
          e.phase = 'dashWarning'; e.phaseAge = 0; e.dashStart = e.lateral;
          const direction = Math.sign(sim.lateral - e.lateral) || Math.sign(sim.vx) || (e.slot % 2 ? -1 : 1);
          const edge = trackAt(sim.s).width / 2 - e.halfWidth - 0.5;
          e.dashTarget = clamp(e.lateral + direction * rules.dashDistance, -edge, edge);
        }
      } else if (e.phase === 'dashWarning') {
        locate(e, sim.s + lerp(1.5, 6, smooth(e.phaseAge / 0.2)), e.dashStart);
        e.charge = 1; this.hint = 'SIDE DASH LOCKED — reverse or stay outside the marked lane.';
        if (e.phaseAge >= rules.dashWarning) { e.phase = 'dash'; e.phaseAge = 0; }
      } else if (e.phase === 'dash') {
        const t = smooth(e.phaseAge / rules.dashDuration);
        locate(e, sim.s + lerp(6, 1.2, t), lerp(e.dashStart, e.dashTarget, t));
        this.hint = 'SIDE DASH — engine opens next';
        if (e.phaseAge >= rules.dashDuration) {
          e.phase = 'recovery'; e.phaseAge = 0;
          this.turn = (e.slot + 1) % 3; this.attackDelay = 0.15;
        }
      } else if (e.phase === 'recovery') {
        // A brief forward escape opens the rear engine ahead of the player.
        const speed = e.phaseAge < 0.35 ? sim.speed + 48 : e.contact ? sim.speed : 22;
        locate(e, advanceOnRoad(e.s, speed * dt), e.lateral);
        this.hint = e.contact ? 'INTERCEPTOR RECOVERING — prepare to bait its next charge.' : 'ENGINE EXPOSED — line up behind it, or race past for a bonus.';
        if (e.phaseAge >= rules.interceptorRecovery) {
          e.phase = 'waiting'; e.phaseAge = 0;
        }
      }
    }
  }
  dropMine(s, lateral, age = 0) {
    if (this.mines.length >= ENCOUNTER_RULES.mineLimit) return null;
    const m = { id: this.sim.nextId++, kind: 'mine', active: true, hp: 1, maxHp: 1, halfWidth: 0.55, halfDepth: 0.55, age };
    locate(m, s, lateral); this.mines.push(m); return m;
  }
  dropCluster(s, lateral, direction, age = 0, radiusLimit = ENCOUNTER_RULES.orbitRadius) {
    if (this.mines.length + 3 > ENCOUNTER_RULES.mineLimit) return;
    const c = { id: this.sim.nextId++, s, lateral, direction, age, radiusLimit, radius: Math.min(radiusLimit, trackAt(s).width * 0.18), members: [] };
    this.clusters.push(c);
    this.placeCluster(c, 0);
    for (let slot = 0; slot < 3; slot++) {
      const angle = slot * Math.PI * 2 / 3 + c.age * c.direction * ENCOUNTER_RULES.orbitSpeed;
      const m = this.dropMine(c.s + Math.sin(angle) * c.radius, c.lateral + Math.cos(angle) * c.radius, age);
      m.clusterId = c.id; m.orbitSlot = slot; c.members.push(m);
    }
    return c;
  }
  placeCluster(c, dt) {
    // Fit the entire orbit, including its forward/backward extent, inside the road.
    const width = Math.min(...[-5, 0, 5].map(offset => trackAt(c.s + offset).width));
    const target = Math.min(c.radiusLimit, width * 0.18);
    c.radius = Math.min(c.radius + (target - c.radius) * (1 - Math.exp(-3 * dt)), width / 2 - 2);
    const edge = Math.max(0, width / 2 - c.radius - 1.2);
    c.lateral = clamp(c.lateral, -edge, edge);
    for (const m of c.members) if (m.hp > 0) {
      const angle = m.orbitSlot * Math.PI * 2 / 3 + c.age * c.direction * ENCOUNTER_RULES.orbitSpeed;
      locate(m, c.s + Math.sin(angle) * c.radius, c.lateral + Math.cos(angle) * c.radius);
    }
  }
  updateLayer(dt) {
    const live = this.layers.filter(e => e.hp > 0 && !e.passed);
    this.wallTimer -= dt;
    if (live.length && this.wallTimer <= 0) {
      this.dropMineWall(Math.max(this.sim.s + 28, Math.min(...live.map(e => e.s)) - 10));
      this.wallTimer = ENCOUNTER_RULES.mineWallPeriod;
    }
    for (const e of this.layers) {
      if (e.hp <= 0 || e.passed) continue;
      const s = advanceOnRoad(e.s, 24 * dt), edge = Math.min(14, trackAt(s).width / 2 - 3);
      const lane = (e.slot ? 1 : -1) * edge * (0.55 + Math.sin(this.age * 1.5 + e.slot * 1.8) * 0.4);
      locate(e, s, lane); e.dropTimer -= dt;
      e.charge = this.wallTimer < 0.8 ? 1 : 0;
      if (e.dropTimer <= 0) {
        if (e.s < this.sim.s + 200) this.dropCluster(e.s - 12, e.lateral * 0.7, e.slot ? -1 : 1);
        e.dropTimer += ENCOUNTER_RULES.mineDrop;
      }
    }
    for (const c of this.clusters) {
      c.age += dt; c.s = advanceOnRoad(c.s, ENCOUNTER_RULES.orbitDrift * dt); this.placeCluster(c, dt);
    }
    this.clusters = this.clusters.filter(c => c.s > this.sim.s - 35 && c.members.some(m => m.hp > 0));
    this.hint = !live.length ? 'LAYERS GONE — their mine clusters keep rotating.' : this.wallTimer < 0.8 ? 'MINE WALL INCOMING — shoot a moving gap.' : 'HEAVY LAYERS — orbit clusters and rotating mine walls.';
  }
  dropMineWall(s) {
    const width = Math.min(...[-5, 0, 5].map(offset => trackAt(s + offset).width));
    const count = width >= 28 ? 4 : 2;
    const radius = Math.min(2.6, width / (count * 3.5));
    const span = width / 2 - radius - 3;
    this.wallCount++;
    for (let i = 0; i < count; i++) {
      const c = this.dropCluster(s, lerp(-span, span, i / (count - 1)), (i + this.wallCount) % 2 ? 1 : -1, 0, radius);
      if (c) c.wall = this.wallCount;
    }
  }
  updateConvoy(dt) {
    const speedPhase = this.age % 7;
    this.convoySpeed = speedPhase < 3.5 ? 30 : 18;
    this.hauler.followSpeed = this.convoySpeed;
    this.anchor = advanceOnRoad(this.anchor, this.convoySpeed * dt);
    const cycle = Math.floor(this.age / 7), phase = this.age % 7;
    const edge = Math.max(0, Math.min(6, trackAt(this.anchor).width / 2 - 5.6));
    if (phase >= 4 && this.laneCycle !== cycle) {
      this.laneCycle = cycle; this.laneStart = this.convoyLane; this.laneTarget = (cycle % 2 ? -1 : 1) * edge;
    }
    this.laneWarning = phase >= 4 && phase < 4.9;
    if (phase >= 4.9) this.convoyLane = lerp(this.laneStart, this.laneTarget, smooth((phase - 4.9) / 1.6));
    this.convoyLane = clamp(this.convoyLane, -edge, edge);
    for (const e of this.members) if (e.hp > 0) {
      if (e.kind === 'hauler') locate(e, this.anchor, this.convoyLane);
      if (e.kind === 'lock') locate(e, this.anchor - 7.2, this.convoyLane + (e.slot - 1) * 2.55);
      if (e.kind === 'turret') {
        locate(e, this.anchor - 8.4, this.convoyLane + [-3.3, -1.1, 1.1, 3.3][e.slot]);
        this.updateTurret(e);
      }
    }
    this.hint = this.laneWarning ? `TRUCK MOVING ${this.laneTarget > this.convoyLane ? 'RIGHT' : 'LEFT'} — reposition.` :
      this.turrets.some(e => e.hp > 0 && e.retaliateAt != null) ? 'CARGO DEFENSE CHARGING — turrets retaliate next.' :
      `${this.locksOpened}/3 LOCKS · FOUR TURRETS — break the rear gun line or raid its gaps.`;
  }
  updateTurret(e) {
    const cycle = Math.floor((this.age - e.slot) / 4.4);
    if (e.retaliateAt != null) {
      e.charge = 1; e.aimTarget = e.defenseTarget;
      if (this.age >= e.retaliateAt) {
        for (const spread of [-0.14, 0, 0.14]) this.shoot(e, 'turret-defense', 30, e.defenseTarget, spread);
        e.retaliateAt = null;
      }
      // Suppress this normal burst rather than releasing missed shots all at once.
      e.suppressedCycle = cycle; return;
    }
    if (cycle < 0 || cycle === e.suppressedCycle) return;
    const first = cycle * 4.4 + e.slot + 0.95;
    if (this.age >= first - 0.65 && this.age < first) {
      e.charge = 1; e.aimTarget = this.aimPoint(e); e.aimLane = this.sim.lateral;
    }
    const count = e.role === 'track' ? 6 : 7;
    for (let shot = 0; shot < count; shot++) {
      const key = cycle * 10 + shot, due = first + shot * 0.12;
      if (this.age >= due && (e.lastBurst ?? -1) < key) {
        const target = e.role === 'track' ? this.aimPoint(e) : e.aimTarget || this.aimPoint(e);
        e.aimTarget = target;
        this.shoot(e, `turret-${e.role}`, 30, target, e.role === 'sweep' ? lerp(-0.3, 0.3, shot / (count - 1)) : 0);
        e.lastBurst = key;
      }
    }
  }
  killReward(e) {
    return { dart: 250, interceptor: 750, minelayer: 600, turret: 500 }[e.kind] || 100;
  }
  damageScale(e, source) {
    if (e.kind === 'hauler') return 0;
    if (e.kind !== 'interceptor') return 1;
    const behind = source && roadCoordinates(source.x, source.z).s < e.s;
    return e.phase === 'recovery' && !e.contact && behind ? 1.5 : 0.2;
  }
  destroyed(e) {
    if (e.kind === 'lock') {
      this.locksOpened++;
      const lane = this.convoyLane + (e.slot === 0 ? -6.3 : e.slot === 2 ? 6.3 : (this.sim.lateral < this.convoyLane ? -6.3 : 6.3));
      const s = Math.max(this.anchor + 12, this.sim.s + Math.max(18, this.sim.speed * 0.65));
      const pickup = { id: this.sim.nextId++, age: 0, halfWidth: 0.7, halfDepth: 0.7, originX: e.x, originZ: e.z };
      locate(pickup, s, lane); this.pickups.push(pickup);
      this.sim.score += 200;
      for (const turret of this.turrets) if (turret.hp > 0 && turret.retaliateAt == null) {
        turret.retaliateAt = this.age + 0.8; turret.defenseTarget = this.aimPoint(turret);
      }
      if (this.locksOpened === 3) { this.hauler.hp = 0; for (const turret of this.turrets) turret.hp = 0; }
    }
  }
  passed(e) {
    if (e.kind === 'interceptor') {
      this.turn = (e.slot + 1) % 3; this.attackDelay = 0.15;
      return e.phase === 'recovery' && !e.contact ? 75 : 10;
    }
    return ['lock', 'hauler', 'turret'].includes(e.kind) ? 0 : 10;
  }
  detonate(m) {
    if (m.hp <= 0) return;
    m.hp = 0; this.sim.score += 10;
    this.blasts.push({ ...m, age: 0, radius: ENCOUNTER_RULES.blastRadius });
    this.sim.events.push({ kind: 'kill', x: m.x, z: m.z, s: m.s });
    // Orbit mines explode independently: one hit creates a moving gap, not a cleared cluster.
    if (Math.hypot(this.sim.x - m.x, this.sim.z - m.z) < ENCOUNTER_RULES.blastRadius + 0.65) this.sim.hurt(20, 'bullet');
    for (const layer of this.layers || []) if (layer.hp > 0 && Math.hypot(layer.x - m.x, layer.z - m.z) < ENCOUNTER_RULES.blastRadius + layer.halfDepth) this.sim.hitTarget(layer, 4, m);
  }
  hazards(dt, oldX, oldZ, swept) {
    for (const m of this.mines) {
      m.age += dt;
      if (m.hp <= 0) continue;
      if (m.age >= ENCOUNTER_RULES.mineArm && swept(oldX, oldZ, this.sim.x, this.sim.z, m, 2.2, 2.4)) {
        this.sim.hurt(20, 'bullet'); this.detonate(m);
      }
    }
    this.mines = this.mines.filter(m => m.hp > 0 && m.s > this.sim.s - 30);
    for (const b of this.blasts) b.age += dt;
    this.blasts = this.blasts.filter(b => b.age < 0.45);
    for (const p of this.pickups) {
      p.age += dt; locate(p, advanceOnRoad(p.s, 8 * dt), p.lateral);
      if (p.age > 0.25 && swept(oldX, oldZ, this.sim.x, this.sim.z, p, 1.5, 2)) {
        p.collected = true; this.collected++; this.sim.score += ENCOUNTER_RULES.reward;
        this.notice = `SALVAGE COLLECTED +${ENCOUNTER_RULES.reward}`; this.noticeUntil = this.age + 2.5;
        this.sim.events.push({ kind: 'pickup', x: p.x, z: p.z, s: p.s });
      }
    }
    this.pickups = this.pickups.filter(p => !p.collected && p.s > this.sim.s - 15 && p.age < 25);
  }
  finish(dt) {
    if (this.type === 'darts' && this.waves.length < ENCOUNTER_RULES.dartWaves) return;
    const primary = this.members.filter(e => !e.support);
    const unfinished = primary.some(e => e.hp > 0 && !e.passed && e.s < this.sim.s + 230 && e.kind !== 'lock');
    const cleared = this.type === 'convoy' ? this.locksOpened === 3 : primary.every(e => e.hp <= 0);
    const hazardsAhead = this.mines.some(m => m.s > this.sim.s - 4 && m.s < this.sim.s + 200) || this.pickups.length > 0;
    if ((!unfinished || cleared) && !hazardsAhead) {
      this.finishTimer += dt;
      if (this.finishTimer > 0.8 && this.sim.status === 'playing') {
        this.outcome = cleared ? 'cleared' : this.type === 'convoy' && this.locksOpened > 0 ? 'partial' : 'escaped';
        if (cleared) this.sim.score += ENCOUNTER_RULES.clearBonus;
        const title = cleared ? 'Encounter cleared' : this.outcome === 'partial' ? 'Partial raid' : 'Escaped — objective incomplete';
        const bonus = cleared ? ` · +${ENCOUNTER_RULES.clearBonus} clear bonus` : '';
        this.result = (this.type === 'convoy' ? `${title} · ${this.locksOpened}/3 locks · ${this.collected} salvage collected` : title) + bonus;
        this.sim.status = 'complete';
      }
    } else this.finishTimer = 0;
  }
}
