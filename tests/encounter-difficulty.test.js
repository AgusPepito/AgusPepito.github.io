import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, sweptHitsEntity } from '../src/simulation.js';
import { ENCOUNTERS, ENCOUNTER_RULES } from '../src/encounters.js';

function run(type, input = {}, seconds = 30) {
  const sim = new Simulation({ encounter: type }); sim.start();
  for (let i = 0; i < seconds * 120 && sim.status === 'playing'; i++) sim.step(1 / 120, typeof input === 'function' ? input(sim) : input);
  return sim;
}

test('remaining centered with autofire now incurs substantial danger in every encounter', () => {
  for (const type of Object.keys(ENCOUNTERS)) {
    const sim = run(type);
    assert.ok(sim.health <= 70, `${type} must require a response; health was ${sim.health}`);
    assert.ok(sim.time >= 10, `${type} must allow time to react before death or completion`);
  }
});

test('holding boost straight ahead never awards a clear and encounters inflict danger', () => {
  for (const type of Object.keys(ENCOUNTERS)) {
    const sim = run(type, { boost: true, racing: true });
    assert.notEqual(sim.encounter.outcome, 'cleared');
    assert.ok(sim.health < 100, `${type} straight boost must encounter an actual hazard`);
    if (type === 'darts') {
      assert.equal(sim.encounter.waves.length, 3);
      assert.equal(sim.encounter.members.length, 24);
      assert.ok(sim.time > ENCOUNTER_RULES.dartWaveInterval * 2);
    }
  }
});

test('baiting locked interceptor paths preserves a clean fast escape and its rewards', () => {
  const sim = run('interceptors', s => {
    const attacker = s.enemies.find(e => ['locked', 'charge'].includes(e.phase));
    const lane = attacker ? (attacker.targetLane >= 0 ? -6 : 6) : s.lateral;
    return { racing: true, boost: true, x: Math.max(-1, Math.min(1, (lane - s.lateral) * 0.5)) };
  });
  assert.equal(sim.health, 100);
  assert.equal(sim.encounter.outcome, 'escaped');
  assert.equal(sim.passed, 2); assert.ok(sim.score >= 300);
});

test('mine chains stop after two links, even when a longer trail is within propagation range', () => {
  const sim = new Simulation({ encounter: 'mines' }); sim.start();
  const enc = sim.encounter; enc.mines = [];
  for (const layer of enc.layers) layer.hp = 0;
  const mines = Array.from({ length: 6 }, (_, i) => enc.dropMine(200 + i * 5, 0, 2));
  sim.hitTarget(mines[0]);
  for (let i = 0; i < 8; i++) { enc.age += 0.13; enc.hazards(0.13, sim.x, sim.z, sweptHitsEntity); }
  assert.deepEqual(mines.map(m => m.hp), [0, 0, 0, 1, 1, 1]);
  sim.hitTarget(mines[3]);
  for (let i = 0; i < 8; i++) { enc.age += 0.13; enc.hazards(0.13, sim.x, sim.z, sweptHitsEntity); }
  assert.ok(mines.every(m => m.hp === 0), 'a separately fired shot can start another pocket');
});

test('convoy guards warn before swapping sides and pace changes warn before braking', () => {
  const sim = new Simulation({ encounter: 'convoy' }), enc = sim.encounter;
  const escorts = enc.members.filter(e => e.kind === 'escort');
  enc.age = 3; enc.updateConvoy(0);
  assert.match(enc.hint, /BRAKING/); assert.equal(enc.hauler.followSpeed, 30);
  enc.age = 4; enc.updateConvoy(0); assert.equal(enc.hauler.followSpeed, 18);
  enc.age = 5.4; enc.updateConvoy(0);
  assert.ok(escorts.every(e => e.charge === 1));
  const before = escorts.map(e => Math.sign(e.lateral));
  enc.age = 7; enc.updateConvoy(0);
  assert.deepEqual(escorts.map(e => Math.sign(e.lateral)), before.map(x => -x));
});

test('convoy results distinguish escape, partial raid, and all-lock clear', () => {
  for (const locks of [0, 1, 3]) {
    const sim = new Simulation({ encounter: 'convoy' }); sim.start();
    const enc = sim.encounter;
    for (let i = 0; i < locks; i++) sim.hitTarget(enc.locks[i], 16);
    enc.pickups = [];
    for (const e of enc.members) e.passed = true;
    enc.finish(1);
    assert.equal(sim.status, 'complete');
    assert.equal(enc.outcome, ['escaped', 'partial', , 'cleared'][locks]);
  }
});
