import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, sweptHitsEntity } from '../src/simulation.js';
import { ENCOUNTERS, ENCOUNTER_RULES } from '../src/encounters.js';
import { roadPoint } from '../src/track.js';

const run = (type, extra = {}) => { const s = new Simulation({ encounter: type, ...extra }); s.start(); return s; };
function steps(sim, seconds, input = {}) { for (let i = 0; i < seconds * 120; i++) sim.step(1 / 120, input); }
function setPlayer(sim, s, lateral) { sim.s = sim.distance = s; sim.offset = 0; sim.lateral = lateral; Object.assign(sim, roadPoint(s, lateral)); }

test('each encounter is isolated, starts immediately, and resets without leaking hazards', () => {
  const counts = { darts: 5, interceptors: 2, mines: 1, convoy: 6 };
  for (const type of Object.keys(ENCOUNTERS)) {
    const sim = run(type, { invincible: true });
    assert.equal(sim.enemies.length, counts[type]); assert.equal(sim.vehicles.length, 0);
    steps(sim, 0.5); assert.equal(sim.groups.length, 0); assert.equal(sim.vehicles.length, 0);
    sim.status = 'paused'; const age = sim.encounter.age; sim.step(1); assert.equal(sim.encounter.age, age);
    sim.options.encounter = 'darts'; sim.reset();
    assert.equal(sim.encounter.type, 'darts'); assert.equal(sim.encounter.mines.length, 0); assert.equal(sim.encounter.pickups.length, 0);
    assert.equal(sim.bullets.length, 0); assert.equal(sim.status, 'ready');
  }
});

test('Darts signal before changing from V to aligned columns and fire slow sequential straight shots', () => {
  const sim = run('darts', { invincible: true }); sim.shotTimer = Infinity;
  const initial = sim.enemies.map(e => [e.s, e.lateral]);
  assert.ok(initial[0][0] > initial[2][0] && initial[4][0] > initial[2][0]);
  const seen = new Map();
  for (let i = 0; i < 120 * 3.4; i++) {
    sim.step(1 / 120);
    for (const b of sim.bullets) if (!seen.has(b.sourceId)) seen.set(b.sourceId, { slot: b.slot, time: sim.time, vx: b.vx, vz: b.vz });
  }
  assert.deepEqual([...seen.values()].map(b => b.slot), [0, 1, 2, 3, 4]);
  assert.ok(sim.enemies.every(e => e.formationWarning));
  for (const b of seen.values()) { assert.ok(Math.abs(b.vx) < 1e-8); assert.equal(b.vz, 15); }
  steps(sim, 1.7);
  const alive = sim.enemies;
  assert.ok(Math.abs(alive[0].lateral - alive[2].lateral) < 0.01);
  assert.ok(Math.abs(alive[1].lateral - alive[3].lateral) < 0.01);
  assert.ok(alive[0].s !== alive[2].s);
});

test('destroyed Darts stop contributing to volleys and clearing them completes the test', () => {
  const sim = run('darts'); const dead = sim.enemies[0]; sim.hitTarget(dead, 3);
  sim.shotTimer = Infinity; steps(sim, 2);
  assert.equal(sim.bullets.some(b => b.sourceId === dead.id), false);
  for (const e of sim.enemies) sim.hitTarget(e, 3);
  steps(sim, 1);
  assert.equal(sim.status, 'complete'); assert.equal(sim.encounter.result, 'Encounter cleared');
});

test('interceptor warning has minimum reaction time at boost speed, locks its target, and only one attacks', () => {
  const sim = run('interceptors', { invincible: true }); sim.shotTimer = Infinity;
  let aimAt, lockAt, chargeAt, lockedLane;
  for (let i = 0; i < 120 * 3; i++) {
    sim.step(1 / 120, { boost: true, x: lockAt ? 0.3 : 0 });
    const active = sim.enemies.filter(e => e.phase !== 'waiting'); assert.ok(active.length <= 1);
    const e = active[0]; if (!e) continue;
    if (e.phase === 'aim') aimAt ??= sim.time;
    if (e.phase === 'locked') { lockAt ??= sim.time; lockedLane ??= e.targetLane; assert.equal(e.targetLane, lockedLane); }
    if (e.phase === 'charge') { chargeAt ??= sim.time; assert.equal(e.targetLane, lockedLane); }
  }
  assert.ok(lockAt - aimAt >= ENCOUNTER_RULES.interceptorAim - 0.02);
  assert.ok(chargeAt - lockAt >= ENCOUNTER_RULES.interceptorLock - 0.02);
  assert.equal(sim.bullets.some(b => !b.friendly), false);
});

test('interceptor armor resists shots and only the exposed rear engine takes amplified damage', () => {
  const sim = run('interceptors'), e = sim.enemies[0];
  const source = roadPoint(e.s - 10, e.lateral);
  sim.hitTarget(e, 1, source); assert.ok(Math.abs(e.hp - 11.8) < 1e-8);
  e.phase = 'recovery'; sim.hitTarget(e, 1, roadPoint(e.s + 10, e.lateral));
  assert.ok(Math.abs(e.hp - 11.6) < 1e-8);
  sim.hitTarget(e, 1, source); assert.ok(Math.abs(e.hp - 10.1) < 1e-8);
  e.contact = false; assert.equal(sim.encounter.passed(e), 150);
  e.contact = true; assert.equal(sim.encounter.passed(e), 40);
});

test('mines are harmless before arming and cause local damage after arming, including at speed', () => {
  for (const armed of [false, true]) {
    const sim = run('mines'); sim.shotTimer = Infinity; sim.encounter.layer.hp = 0;
    sim.encounter.mines = [];
    const m = sim.encounter.dropMine(50, 0, armed ? 2 : 0);
    setPlayer(sim, 46, 0); sim.speed = 122;
    steps(sim, 0.1, { boost: true });
    assert.equal(sim.health, armed ? 80 : 100);
    assert.equal(m.hp, armed ? 0 : 1);
  }
});

test('mines chain locally, damage the layer, and remain after the layer is killed', () => {
  const sim = run('mines', { invincible: true }); sim.shotTimer = Infinity;
  const enc = sim.encounter; enc.mines = [];
  const a = enc.dropMine(enc.layer.s - 19, 0, 2), b = enc.dropMine(enc.layer.s - 8, 0, 2), c = enc.dropMine(enc.layer.s - 2, 0, 2);
  sim.hitTarget(a, 1); assert.equal(b.hp, 1); assert.ok(b.explodeAt > enc.age);
  steps(sim, 0.4);
  assert.equal(b.hp, 0); assert.equal(c.hp, 0); assert.equal(enc.layer.hp, 0);
  const other = run('mines'); other.shotTimer = Infinity;
  const count = other.encounter.mines.length; other.hitTarget(other.encounter.layer, 8); steps(other, 0.2);
  assert.equal(other.encounter.mines.length, count); assert.equal(other.status, 'playing');
});

test('convoy escorts alternate three-shot rearward bursts and the hauler never shoots', () => {
  const sim = run('convoy', { invincible: true }); sim.shotTimer = Infinity;
  const shots = new Map();
  for (let i = 0; i < 120 * 4; i++) {
    sim.step(1 / 120);
    for (const b of sim.bullets) shots.set(b.id, { slot: b.slot, pattern: b.pattern, vx: b.vx, vz: b.vz });
  }
  assert.deepEqual([...shots.values()].map(b => b.slot), [0, 0, 0, 1, 1, 1]);
  for (const b of shots.values()) { assert.equal(b.pattern, 'escort'); assert.ok(Math.abs(b.vx) < 1e-8); assert.equal(b.vz, 17); }
});

test('convoy locks open independently, launch collectible rewards ahead, and all three remove the hull', () => {
  const sim = run('convoy'); sim.shotTimer = Infinity; const enc = sim.encounter;
  sim.hitTarget(enc.hauler, 1000); assert.equal(enc.hauler.hp, Infinity);
  sim.hitTarget(enc.locks[0], 6);
  assert.equal(enc.locksOpened, 1); assert.equal(enc.locks[1].hp, 6); assert.equal(enc.pickups.length, 1);
  const p = enc.pickups[0]; assert.ok(p.s > sim.s + 10); assert.ok(Math.abs(p.lateral) > enc.hauler.halfWidth + 0.65);
  p.age = 0.3; setPlayer(sim, p.s, p.lateral);
  enc.hazards(1 / 120, sim.x, sim.z, sweptHitsEntity);
  assert.equal(enc.collected, 1); assert.equal(sim.score, ENCOUNTER_RULES.reward);
  enc.hazards(1 / 120, sim.x, sim.z, sweptHitsEntity); assert.equal(enc.collected, 1);
  sim.hitTarget(enc.locks[1], 6); sim.hitTarget(enc.locks[2], 6);
  assert.equal(enc.locksOpened, 3); assert.equal(enc.hauler.hp, 0); assert.equal(enc.pickups.length, 2);
});

test('autofire actually hits convoy rear locks before the invulnerable hull', () => {
  const sim = run('convoy', { invincible: true });
  steps(sim, 1.5);
  assert.ok(sim.encounter.locks[1].hp < 6);
});

test('all encounter simulations remain finite and bounded in cruise, fast and boost', () => {
  for (const type of Object.keys(ENCOUNTERS)) for (const input of [{}, { racing: true }, { boost: true }]) {
    const sim = run(type, { invincible: true });
    for (let i = 0; i < 120 * 25 && sim.status === 'playing'; i++) {
      sim.step(1 / 120, input);
      assert.ok(Number.isFinite(sim.s + sim.x + sim.z + sim.speed));
      for (const e of sim.enemies) assert.ok(Number.isFinite(e.x + e.z + e.yaw));
      assert.ok(sim.encounter.mines.length <= 48); assert.ok(sim.bullets.length < 200);
    }
  }
});
