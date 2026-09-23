import { clamp, lerp, smooth, trackAt, roadPoint, roadFrame, advanceOnRoad, roadCoordinates } from './track.js';

export const ENCOUNTERS = {
  darts: { name: 'Dart squadron', hint: 'Three waves. Shoot an opening; watch converging volleys.' },
  interceptors: { name: 'Interceptors', hint: 'Bait the orange path. Dodge after it locks. Hit the exposed engine.' },
  mines: { name: 'Mine layers', hint: 'Clear pockets through two trails. Cyan mines are unarmed; orange mines are live.' },
  convoy: { name: 'Convoy hauler', hint: 'Break the three rear locks. Collect cyan salvage ahead of the convoy.' },
};
export const ENCOUNTER_RULES = {
  dartHold: 2.2, dartWarning: 0.7, dartChange: 1, dartWaveInterval: 7, dartWaves: 3,
  interceptorAim: 0.55, interceptorLock: 0.65, interceptorCharge: 1.15, interceptorRecovery: 1.6,
  mineArm: 1.15, mineDrop: 0.6, chainRadius: 5.5, chainHops: 2, blastRadius: 3.5, mineLimit: 96, reward: 250,
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
    this.result = ''; this.outcome = ''; this.finishTimer = 0; this.hint = ENCOUNTERS[type].hint;
    this.anchor = sim.s + 64;
    if (type === 'darts') { this.waves = []; this.spawnDartWave(); }
    if (type === 'interceptors') {
      for (let slot = 0; slot < 2; slot++) {
        const e = this.add('interceptor', slot, sim.s + 60 + slot * 12, slot ? 11 : -11, 12, 1.25, 2);
        e.phase = 'waiting'; e.phaseAge = 0; e.contact = false;
      }
      this.turn = 0; this.attackDelay = 0.5;
    }
    if (type === 'mines') {
      this.layers = [-1, 1].map((side, slot) => {
        const e = this.add('minelayer', slot, sim.s + 82 + slot * 18, side * 8, 10, 1.6, 2.2);
        e.dropTimer = 0.3 + slot * 0.3; return e;
      });
      for (let row = 0; row < 6; row++) {
        const gap = [0, 2, 1][row % 3];
        [-14, -7, -1.8, 1.8, 7, 14].forEach((lane, index) => {
          if (Math.floor(index / 2) !== gap) this.dropMine(sim.s + 28 + row * 12, lane, 2);
        });
      }
    }
    if (type === 'convoy') {
      this.hauler = this.add('hauler', 0, this.anchor, 0, Infinity, 3.7, 6.5);
      this.hauler.hideHealth = true; this.hauler.followSpeed = 24;
      this.locks = [-2.55, 0, 2.55].map((x, slot) => this.add('lock', slot, this.anchor - 7.2, x, 16, 0.78, 0.5));
      for (let slot = 0; slot < 2; slot++) this.add('escort', slot, this.anchor - 16 - slot * 5, slot ? 5 : -5, 8, 1.05, 1.8);
    }
  }
  add(kind, slot, s, lateral, hp, halfWidth, halfDepth) {
    const e = { id: this.sim.nextId++, encounter: true, kind, slot, hp, maxHp: hp, halfWidth, halfDepth,
      active: true, age: 0, deployed: 1, armored: false, charge: 0, fire: 0 };
    locate(e, s, lateral); this.members.push(e); this.sim.enemies.push(e); return e;
  }
  shoot(e, pattern, speed = 15, target = null, spread = 0) {
    if (e.hp <= 0 || e.s < this.sim.s + 8 || e.s > this.sim.s + (e.kind === 'dart' ? 140 : 125)) return;
    const f = roadFrame(e.s), behind = e.halfDepth + 0.5;
    const x = e.x - f.fx * behind, z = e.z - f.fz * behind;
    const angle = (target ? Math.atan2(target.x - x, target.z - z) : Math.atan2(-f.fx, -f.fz)) + spread;
    this.sim.bullets.push({ id: this.sim.nextId++, sourceId: e.id, pattern, slot: e.slot,
      x, z, s: e.s - behind, vx: Math.sin(angle) * speed, vz: Math.cos(angle) * speed, friendly: false, life: 5 });
  }
  aimPoint(e, lane = this.sim.lateral, speed = 27) {
    // Predict one point at firing time; bullets never track after launch.
    const travel = Math.max(0, e.s - this.sim.s) / (speed + this.sim.speed);
    return roadPoint(this.sim.s + this.sim.speed * travel, lane);
  }
  spawnDartWave() {
    const wave = { index: this.waves.length, age: 0, anchor: this.sim.s + 110, volley: -1 };
    this.waves.push(wave);
    for (let slot = 0; slot < 8; slot++) {
      const e = this.add('dart', slot, wave.anchor + Math.abs(slot - 3.5) * 5, (slot - 3.5) * 4, 3, 0.8, 1.2);
      e.wave = wave.index;
    }
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
    if (this.waves.length < ENCOUNTER_RULES.dartWaves && this.age >= this.waves.length * ENCOUNTER_RULES.dartWaveInterval) this.spawnDartWave();
    for (const wave of this.waves) this.updateDartWave(wave, dt);
    this.hint = `WAVE ${this.waves.length}/3 — ${this.members.filter(e => e.hp <= 0).length}/24 destroyed. Volleys converge, then sweep straight back.`;
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
      const span = Math.min(4, (trackAt(wave.anchor).width / 2 - 2) / 3.5);
      const vX = (e.slot - 3.5) * span, colX = (e.slot % 2 ? 1 : -1) * span * (wave.index % 2 ? 1.5 : 0.8);
      const vS = Math.abs(e.slot - 3.5) * 5, colS = e.slot * 3.5;
      locate(e, wave.anchor + lerp(vS, colS, column), lerp(vX, colX, column));
      e.formationWarning = warning;
    }
    const volley = Math.floor(Math.max(0, wave.age - 0.7) / 2.4);
    if (wave.volley !== volley) {
      wave.volley = volley;
      wave.order = members.slice().sort((a, b) => a.lateral - b.lateral || a.s - b.s).map(e => e.id);
      wave.targetLane = clamp(this.sim.lateral, -8, 8);
    }
    for (const e of members) {
      const due = 0.7 + volley * 2.4 + wave.order.indexOf(e.id) * 0.13;
      e.charge = wave.age >= due - 0.55 && wave.age < due ? 1 : 0;
      if (wave.age >= due && e.lastVolley !== volley) {
        const target = volley % 2 === 0 ? this.aimPoint(e, wave.targetLane + (e.slot - 3.5) * 0.7, 24) : null;
        this.shoot(e, 'dart', 24, target); e.lastVolley = volley;
      }
    }
  }
  updateInterceptors(dt) {
    const sim = this.sim, rules = ENCOUNTER_RULES;
    const rivals = this.members.filter(e => e.hp > 0 && !e.passed);
    let attacker = rivals.find(e => ['aim', 'locked', 'charge'].includes(e.phase));
    if (!attacker) {
      this.attackDelay -= dt;
      const waiting = rivals.filter(e => e.phase === 'waiting');
      if (this.attackDelay <= 0 && waiting.length) {
        attacker = waiting.find(e => e.slot === this.turn) || waiting[0];
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
        const t = smooth(e.phaseAge / 0.65);
        // Commit across the lane, then occupy the attack corridor for half a second.
        const gap = e.phaseAge < 0.65 ? lerp(e.startGap, 1.5, t) : lerp(1.5, -2.5, (e.phaseAge - 0.65) / 0.5);
        locate(e, sim.s + gap, lerp(e.startLane, e.targetLane, t));
        this.hint = 'DODGE THE CHARGE';
        if (e.phaseAge >= rules.interceptorCharge) {
          e.phase = 'recovery'; e.phaseAge = 0;
          this.turn = 1 - e.slot; this.attackDelay = 0.25;
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
    const m = { id: this.sim.nextId++, kind: 'mine', active: true, hp: 1, maxHp: 1, halfWidth: 0.55, halfDepth: 0.55, age, explodeAt: null, chainDepth: 0 };
    locate(m, s, lateral); this.mines.push(m); return m;
  }
  updateLayer(dt) {
    for (const e of this.layers) {
      if (e.hp <= 0 || e.passed) continue;
      const s = advanceOnRoad(e.s, 24 * dt), edge = Math.min(14, trackAt(s).width / 2 - 3);
      const lane = (e.slot ? 1 : -1) * edge * (0.55 + Math.sin(this.age * 1.5 + e.slot * 1.8) * 0.4);
      locate(e, s, lane); e.dropTimer -= dt;
      if (e.dropTimer <= 0) {
        if (e.s < this.sim.s + 200) for (const offset of [-1.6, 1.6]) this.dropMine(e.s - 9, e.lateral + offset);
        e.dropTimer += ENCOUNTER_RULES.mineDrop;
      }
    }
    this.hint = this.layers.every(e => e.hp <= 0 || e.passed) ? 'LAYERS GONE — remaining mines are still live.' : 'TWO LAYERS — clear small pockets. Chain reactions stop after two links.';
  }
  updateConvoy(dt) {
    const speedPhase = this.age % 7;
    this.convoySpeed = speedPhase < 3.5 ? 30 : 18;
    this.hauler.followSpeed = this.convoySpeed;
    this.anchor = advanceOnRoad(this.anchor, this.convoySpeed * dt);
    const swapCycle = Math.floor(this.age / 7), swapPhase = this.age % 7;
    const swap = (swapCycle % 2 ? -1 : 1) * (1 - 2 * smooth((swapPhase - 5.8) / 1.2));
    const swapWarning = swapPhase > 5.1 && swapPhase < 5.8;
    for (const e of this.members) if (e.hp > 0) {
      if (e.kind === 'hauler') locate(e, this.anchor, 0);
      if (e.kind === 'lock') locate(e, this.anchor - 7.2, (e.slot - 1) * 2.55);
      if (e.kind === 'escort') {
        // Rear guards move between an outer approach and the lock's firing line.
        const guardLane = lerp(5, 2.55, (1 + Math.sin(this.age * 1.3)) / 2);
        locate(e, this.anchor - 16 - e.slot * 5, (e.slot ? 1 : -1) * guardLane * swap);
        const cycle = Math.floor(this.age / 3.2), first = cycle * 3.2 + 0.9 + e.slot * 1.6;
        e.charge = swapWarning || (this.age >= first - 0.65 && this.age < first) ? 1 : 0;
        if (this.age >= first - 0.65 && e.aimCycle !== cycle) {
          e.aimCycle = cycle; e.aimLane = this.sim.lateral;
        }
        for (let shot = 0; shot < 3; shot++) {
          const key = cycle * 3 + shot, due = first + shot * 0.14;
          if (this.age >= due && (e.lastBurst ?? -1) < key) {
            const target = cycle % 2 === 0 ? this.aimPoint(e, e.aimLane ?? this.sim.lateral) : null;
            this.shoot(e, 'escort', 27, target, target ? (shot - 1) * 0.035 : 0); e.lastBurst = key;
          }
        }
      }
    }
    this.hint = swapWarning ? 'ESCORTS SWITCHING SIDES — watch the rear approach.' : speedPhase > 2.8 && speedPhase < 3.5 ? 'CONVOY BRAKING — make room.' : `${this.locksOpened}/3 LOCKS — dodge aimed bursts; shoot during the straight volleys.`;
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
      this.turn = 1 - e.slot; this.attackDelay = 0.25;
      return e.phase === 'recovery' && !e.contact ? 150 : 40;
    }
    return e.kind === 'lock' || e.kind === 'hauler' ? 0 : 40;
  }
  detonate(m) {
    if (m.hp <= 0) return;
    m.hp = 0; this.sim.score += 10;
    this.blasts.push({ ...m, age: 0, radius: ENCOUNTER_RULES.blastRadius });
    this.sim.events.push({ kind: 'kill', x: m.x, z: m.z, s: m.s });
    if (m.chainDepth < ENCOUNTER_RULES.chainHops) for (const other of this.mines) {
      if (other.hp > 0 && other.explodeAt == null && Math.hypot(other.x - m.x, other.z - m.z) <= ENCOUNTER_RULES.chainRadius) {
        other.explodeAt = this.age + 0.12; other.chainDepth = m.chainDepth + 1;
      }
    }
    if (Math.hypot(this.sim.x - m.x, this.sim.z - m.z) < ENCOUNTER_RULES.blastRadius + 0.65) this.sim.hurt(20, 'bullet');
    for (const layer of this.layers || []) if (layer.hp > 0 && Math.hypot(layer.x - m.x, layer.z - m.z) < ENCOUNTER_RULES.blastRadius + layer.halfDepth) this.sim.hitTarget(layer, 4, m);
  }
  hazards(dt, oldX, oldZ, swept) {
    for (const m of this.mines) {
      m.age += dt;
      if (m.hp <= 0) continue;
      if (m.explodeAt != null && this.age >= m.explodeAt) this.detonate(m);
      else if (m.age >= ENCOUNTER_RULES.mineArm && swept(oldX, oldZ, this.sim.x, this.sim.z, m, 2.2, 2.4)) {
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
    if (this.type === 'darts' && this.waves.length < ENCOUNTER_RULES.dartWaves) return;
    const unfinished = this.members.some(e => e.hp > 0 && !e.passed && e.s < this.sim.s + 230 && e.kind !== 'lock');
    const cleared = this.type === 'convoy' ? this.locksOpened === 3 : this.members.every(e => e.hp <= 0);
    const hazardsAhead = this.mines.some(m => m.s > this.sim.s - 4 && m.s < this.sim.s + 200) || this.pickups.length > 0;
    if ((!unfinished || cleared) && !hazardsAhead) {
      this.finishTimer += dt;
      if (this.finishTimer > 0.8 && this.sim.status === 'playing') {
        this.outcome = cleared ? 'cleared' : this.type === 'convoy' && this.locksOpened > 0 ? 'partial' : 'escaped';
        const title = cleared ? 'Encounter cleared' : this.outcome === 'partial' ? 'Partial raid' : 'Escaped — objective incomplete';
        this.result = this.type === 'convoy' ? `${title} · ${this.locksOpened}/3 locks · ${this.collected} salvage collected` : title;
        this.sim.status = 'complete';
      }
    } else this.finishTimer = 0;
  }
}
