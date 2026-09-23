import { clamp, lerp, smooth, trackAt, roadPoint, roadFrame, advanceOnRoad, roadCoordinates } from './track.js';

export const ENCOUNTERS = {
  darts: { name: 'Dart squadron', hint: 'Clear a firing lane. Watch the V change into columns.' },
  interceptors: { name: 'Interceptors', hint: 'Bait the orange path. Dodge after it locks. Hit the exposed engine.' },
  mines: { name: 'Mine layer', hint: 'Shoot a chain reaction. Cyan mines are unarmed; orange mines are live.' },
  convoy: { name: 'Convoy hauler', hint: 'Break the three rear locks. Collect cyan salvage ahead of the convoy.' },
};
export const ENCOUNTER_RULES = {
  dartHold: 3, dartWarning: 0.8, dartChange: 1.2,
  interceptorAim: 0.7, interceptorLock: 0.65, interceptorCharge: 0.65, interceptorRecovery: 2.8,
  mineArm: 1.3, mineDrop: 0.55, chainRadius: 12.5, blastRadius: 3.5, reward: 250,
};

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
    this.mines = []; this.blasts = []; this.pickups = []; this.locksOpened = 0; this.collected = 0;
    this.result = ''; this.finishTimer = 0; this.hint = ENCOUNTERS[type].hint;
    this.anchor = sim.s + 64;
    if (type === 'darts') for (let slot = 0; slot < 5; slot++) this.add('dart', slot, this.anchor + Math.abs(slot - 2) * 6, (slot - 2) * 5, 3, 0.8, 1.2);
    if (type === 'interceptors') {
      for (let slot = 0; slot < 2; slot++) {
        const e = this.add('interceptor', slot, sim.s + 60 + slot * 12, slot ? 11 : -11, 12, 1.25, 2);
        e.phase = 'waiting'; e.phaseAge = 0; e.contact = false;
      }
      this.turn = 0; this.attackDelay = 0.8;
    }
    if (type === 'mines') {
      this.layer = this.add('minelayer', 0, sim.s + 85, 0, 8, 1.6, 2.2);
      this.dropTimer = 0.45;
      for (let i = 0; i < 5; i++) this.dropMine(sim.s + 25 + i * 10, (i % 2 ? -1 : 1) * 2.1, 2 - i * 0.35);
    }
    if (type === 'convoy') {
      this.hauler = this.add('hauler', 0, this.anchor, 0, Infinity, 3.7, 6.5);
      this.hauler.hideHealth = true; this.hauler.followSpeed = 24;
      this.locks = [-2.55, 0, 2.55].map((x, slot) => this.add('lock', slot, this.anchor - 7.2, x, 6, 0.78, 0.5));
      for (let slot = 0; slot < 2; slot++) this.add('escort', slot, this.anchor - 1, slot ? 7.2 : -7.2, 5, 1.05, 1.8);
    }
  }
  add(kind, slot, s, lateral, hp, halfWidth, halfDepth) {
    const e = { id: this.sim.nextId++, encounter: true, kind, slot, hp, maxHp: hp, halfWidth, halfDepth,
      active: true, age: 0, deployed: 1, armored: false, charge: 0, fire: 0 };
    locate(e, s, lateral); this.members.push(e); this.sim.enemies.push(e); return e;
  }
  shoot(e, pattern, speed = 15) {
    if (e.hp <= 0 || e.s < this.sim.s + 8 || e.s > this.sim.s + 125) return;
    const f = roadFrame(e.s), behind = e.halfDepth + 0.5;
    this.sim.bullets.push({ id: this.sim.nextId++, sourceId: e.id, pattern, slot: e.slot,
      x: e.x - f.fx * behind, z: e.z - f.fz * behind, s: e.s - behind,
      vx: -f.fx * speed, vz: -f.fz * speed, friendly: false, life: 5 });
  }
  update(dt) {
    this.age += dt;
    for (const e of this.members) { e.age += dt; e.charge = 0; }
    if (this.type === 'darts') this.updateDarts(dt);
    if (this.type === 'interceptors') this.updateInterceptors(dt);
    if (this.type === 'mines') this.updateLayer(dt);
    if (this.type === 'convoy') this.updateConvoy(dt);
  }
  updateDarts(dt) {
    this.anchor = advanceOnRoad(this.anchor, 23 * dt);
    const duration = ENCOUNTER_RULES.dartHold + ENCOUNTER_RULES.dartWarning + ENCOUNTER_RULES.dartChange;
    const cycle = Math.floor(this.age / duration), phase = this.age % duration;
    const blend = smooth((phase - ENCOUNTER_RULES.dartHold - ENCOUNTER_RULES.dartWarning) / ENCOUNTER_RULES.dartChange);
    const column = cycle % 2 ? 1 - blend : blend;
    const warning = phase >= ENCOUNTER_RULES.dartHold && phase < ENCOUNTER_RULES.dartHold + ENCOUNTER_RULES.dartWarning;
    this.hint = warning ? 'FORMATION CHANGING — find the next firing line.' : column > 0.8 ? 'COLUMNS — follow a firing line to clear several Darts.' : ENCOUNTERS.darts.hint;
    for (const e of this.members) if (e.hp > 0) {
      const span = Math.min(5, (trackAt(this.anchor).width / 2 - 2) / 2);
      const vX = (e.slot - 2) * span, colX = e.slot % 2 ? span * 0.55 : -span * 0.55;
      const vS = Math.abs(e.slot - 2) * 6, colS = e.slot * 4.5;
      locate(e, this.anchor + lerp(vS, colS, column), lerp(vX, colX, column));
      e.formationWarning = warning;
    }
    const volley = Math.floor(Math.max(0, this.age - 1.4) / 3.2);
    if (this.dartVolley !== volley) {
      this.dartVolley = volley;
      this.dartOrder = this.members.filter(e => e.hp > 0).sort((a, b) => a.lateral - b.lateral || a.s - b.s).map(e => e.id);
    }
    for (const e of this.members) if (e.hp > 0) {
      const due = 1.4 + volley * 3.2 + this.dartOrder.indexOf(e.id) * 0.19;
      if (this.age >= due && e.lastVolley !== volley) { this.shoot(e, 'dart'); e.lastVolley = volley; }
    }
  }
  updateInterceptors(dt) {
    const sim = this.sim, rules = ENCOUNTER_RULES;
    const rivals = this.members.filter(e => e.hp > 0 && !e.passed);
    let attacker = rivals.find(e => e.phase !== 'waiting');
    if (!attacker) {
      this.attackDelay -= dt;
      if (this.attackDelay <= 0 && rivals.length) {
        attacker = rivals.find(e => e.slot === this.turn) || rivals[0];
        attacker.phase = 'aim'; attacker.phaseAge = 0; attacker.contact = false;
      }
    }
    for (const e of rivals) {
      e.phaseAge += dt;
      if (e.phase === 'waiting' || e.phase === 'aim' || e.phase === 'locked') {
        const gap = e.phase === 'waiting' ? 72 : 58;
        const s = lerp(e.s, sim.s + gap, 1 - Math.exp(-5 * dt));
        const flank = (e.slot ? 1 : -1) * Math.min(11, trackAt(s).width / 2 - 2.5);
        locate(e, s, lerp(e.lateral, flank, 1 - Math.exp(-4 * dt)));
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
        locate(e, sim.s + lerp(e.startGap, 1.6, t), lerp(e.startLane, e.targetLane, t));
        this.hint = 'DODGE THE CHARGE';
        if (e.phaseAge >= rules.interceptorCharge) {
          e.phase = 'recovery'; e.phaseAge = 0; e.recoveryS = e.s;
        }
      } else if (e.phase === 'recovery') {
        // A brief forward escape opens the rear engine ahead of the player.
        const speed = e.phaseAge < 0.35 ? sim.speed + 36 : 22;
        locate(e, advanceOnRoad(e.s, speed * dt), e.lateral);
        this.hint = e.contact ? 'INTERCEPTOR RECOVERING — prepare to bait its next charge.' : 'ENGINE EXPOSED — line up behind it, or race past for a bonus.';
        if (e.phaseAge >= rules.interceptorRecovery) {
          e.phase = 'waiting'; e.phaseAge = 0; this.turn = 1 - e.slot; this.attackDelay = 0.7;
        }
      }
    }
  }
  dropMine(s, lateral, age = 0) {
    if (this.mines.length >= 48) return null;
    const m = { id: this.sim.nextId++, kind: 'mine', active: true, hp: 1, maxHp: 1, halfWidth: 0.55, halfDepth: 0.55, age, explodeAt: null };
    locate(m, s, lateral); this.mines.push(m); return m;
  }
  updateLayer(dt) {
    const e = this.layer;
    if (e.hp <= 0 || e.passed) { this.hint = 'LAYER GONE — the remaining mines are still dangerous.'; return; }
    const s = advanceOnRoad(e.s, 20 * dt);
    locate(e, s, Math.sin(this.age * 1.25) * Math.min(5.5, trackAt(s).width / 2 - 2.8));
    this.dropTimer -= dt;
    if (this.dropTimer <= 0) { if (e.s < this.sim.s + 200) this.dropMine(e.s - 3.4, e.lateral); this.dropTimer += ENCOUNTER_RULES.mineDrop; }
  }
  updateConvoy(dt) {
    this.anchor = advanceOnRoad(this.anchor, 24 * dt);
    const width = trackAt(this.anchor).width;
    for (const e of this.members) if (e.hp > 0) {
      if (e.kind === 'hauler') locate(e, this.anchor, 0);
      if (e.kind === 'lock') locate(e, this.anchor - 7.2, (e.slot - 1) * 2.55);
      if (e.kind === 'escort') {
        locate(e, this.anchor - 1, (e.slot ? 1 : -1) * Math.min(7.2, width / 2 - 1.8));
        // Left burst, breathing room, right burst; destroyed escorts leave silence.
        const cycle = Math.floor(this.age / 4.6);
        for (let shot = 0; shot < 3; shot++) {
          const key = cycle * 3 + shot, due = cycle * 4.6 + 1 + e.slot * 1.8 + shot * 0.18;
          if (this.age >= due && (e.lastBurst ?? -1) < key) { this.shoot(e, 'escort', 17); e.lastBurst = key; }
        }
      }
    }
    this.hint = `${this.locksOpened}/3 LOCKS OPEN — ${this.collected} salvage collected. Each cyan pickup is worth ${ENCOUNTER_RULES.reward}.`;
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
      const lane = e.slot === 0 ? -5.6 : e.slot === 2 ? 5.6 : (this.sim.lateral < 0 ? -5.6 : 5.6);
      const s = Math.max(this.anchor + 12, this.sim.s + Math.max(18, this.sim.speed * 0.65));
      const pickup = { id: this.sim.nextId++, age: 0, halfWidth: 0.7, halfDepth: 0.7, originX: e.x, originZ: e.z };
      locate(pickup, s, lane); this.pickups.push(pickup);
      if (this.locksOpened === 3) this.hauler.hp = 0;
    }
  }
  passed(e) {
    if (e.kind === 'interceptor') {
      this.turn = 1 - e.slot; this.attackDelay = 0.7;
      return e.phase === 'recovery' && !e.contact ? 150 : 40;
    }
    return e.kind === 'lock' || e.kind === 'hauler' ? 0 : 40;
  }
  detonate(m) {
    if (m.hp <= 0) return;
    m.hp = 0; this.sim.score += 10;
    this.blasts.push({ ...m, age: 0, radius: ENCOUNTER_RULES.blastRadius });
    this.sim.events.push({ kind: 'kill', x: m.x, z: m.z, s: m.s });
    for (const other of this.mines) if (other.hp > 0 && other.explodeAt == null && Math.hypot(other.x - m.x, other.z - m.z) <= ENCOUNTER_RULES.chainRadius) other.explodeAt = this.age + 0.1;
    if (Math.hypot(this.sim.x - m.x, this.sim.z - m.z) < ENCOUNTER_RULES.blastRadius + 0.65) this.sim.hurt(20, 'bullet');
    if (this.layer?.hp > 0 && Math.hypot(this.layer.x - m.x, this.layer.z - m.z) < ENCOUNTER_RULES.chainRadius) this.sim.hitTarget(this.layer, 5, m);
  }
  hazards(dt, oldX, oldZ, swept) {
    for (const m of this.mines) {
      m.age += dt;
      if (m.hp <= 0) continue;
      if (m.explodeAt != null && this.age >= m.explodeAt) this.detonate(m);
      else if (m.age >= ENCOUNTER_RULES.mineArm && swept(oldX, oldZ, this.sim.x, this.sim.z, m, 1.4, 1.7)) {
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
        this.sim.events.push({ kind: 'pickup', x: p.x, z: p.z, s: p.s });
      }
    }
    this.pickups = this.pickups.filter(p => !p.collected && p.s > this.sim.s - 15 && p.age < 25);
  }
  finish(dt) {
    const unfinished = this.members.some(e => e.hp > 0 && !e.passed && e.s < this.sim.s + 230 && e.kind !== 'lock');
    const cleared = this.type === 'convoy' ? this.locksOpened === 3 : this.members.every(e => e.hp <= 0);
    const hazardsAhead = this.mines.some(m => m.s > this.sim.s - 4 && m.s < this.sim.s + 200) || this.pickups.length > 0;
    if ((!unfinished || cleared) && !hazardsAhead) {
      this.finishTimer += dt;
      if (this.finishTimer > 0.8 && this.sim.status === 'playing') {
        this.result = this.type === 'convoy' ? `${this.locksOpened}/3 cargo locks opened · ${this.collected} salvage collected` : cleared ? 'Encounter cleared' : 'Encounter passed';
        this.sim.status = 'complete';
      }
    } else this.finishTimer = 0;
  }
}
