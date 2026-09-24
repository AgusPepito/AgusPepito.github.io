import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, sweptHitsEntity } from '../src/simulation.js';
import { ENCOUNTERS, ENCOUNTER_RULES as R } from '../src/encounters.js';
import { roadPoint, trackAt } from '../src/track.js';
const run = (type, options = {}) => { const s = new Simulation({ encounter: type, encounterSupport: false, ...options }); s.start(); return s; };
function steps(s, seconds, input = {}) { for (let i = 0; i < seconds * 120; i++) s.step(1 / 120, typeof input === 'function' ? input(s) : input); }
function player(s, at, lane) { s.s = s.distance = at; s.offset = 0; s.lateral = lane; Object.assign(s, roadPoint(at, lane)); }

test('encounters isolate traffic, pause clocks and fully reset hazards', () => {
  for (const [type, count] of Object.entries({ darts: 6, interceptors: 3, mines: 2, convoy: 8 })) {
    const s = run(type, { invincible: true }); assert.equal(s.enemies.length, count);
    steps(s, 1); assert.equal(s.vehicles.length, 0); assert.equal(s.groups.length, 0);
    s.status = 'paused'; const age = s.encounter.age; s.step(2); assert.equal(s.encounter.age, age);
    s.options.encounter = 'darts'; s.reset();
    assert.equal(s.status, 'ready'); assert.equal(s.encounter.clusters.length, 0); assert.equal(s.bullets.length, 0);
    assert.equal(s.score, 0); assert.equal(s.encounter.notice, '');
  }
});

test('six Darts have two of each role and signal formation changes', () => {
  const s = run('darts', { invincible: true }); s.shotTimer = Infinity;
  assert.deepEqual(s.enemies.map(e => e.role), ['direct', 'predict', 'spread', 'direct', 'predict', 'spread']);
  assert.ok(s.enemies.every(e => Math.abs(e.lateral) > 1));
  steps(s, 2.5); assert.ok(s.enemies.every(e => e.formationWarning));
  steps(s, 1.5); assert.equal(s.enemies[0].lateral, s.enemies[2].lateral);
  assert.notEqual(s.enemies[0].s, s.enemies[2].s);
});

test('Darts fire direct triple bursts, single predictions and three-way fans', () => {
  const s = run('darts', { invincible: true }); s.shotTimer = Infinity;
  const initial = [...s.enemies];
  const seen = new Map();
  for (let i = 0; i < 120 * 7; i++) { s.step(1 / 120); for (const b of s.bullets) seen.set(b.id, { ...b }); }
  for (const e of initial) {
    const shots = [...seen.values()].filter(b => b.sourceId === e.id);
    assert.equal(shots.length, e.role === 'predict' ? 1 : 3);
    assert.ok(shots.every(b => b.color != null && !b.friendly));
    if (e.role === 'spread') assert.equal(new Set(shots.map(b => b.vx)).size, 3);
  }
});

test('prediction lead is capped and targets stay fixed after a player reversal', () => {
  const s = run('darts'); s.vx = 19;
  for (const e of s.enemies) e.visibleFor = R.visibleWarning;
  s.encounter.updateDartFire(0.21);
  assert.equal(s.enemies[0].aimLane, 0);
  for (let i = 0; i < 200 && s.encounter.dartLastId !== s.enemies[1].id; i++) s.encounter.updateDartFire(1 / 120);
  assert.equal(s.enemies[1].aimLane, R.dartLead);
  const target = { ...s.enemies[1].aimTarget };
  s.vx = -19; s.lateral = -8; s.encounter.updateDartFire(0.3);
  assert.deepEqual(s.enemies[1].aimTarget, target);
});

test('destroyed Darts stop firing and full clear pays its bonus once', () => {
  const s = run('darts');
  for (let i = 0; i < 120 * 16 && s.status === 'playing'; i++) {
    for (const e of s.enemies) s.hitTarget(e, 6);
    s.step(1 / 120);
  }
  assert.equal(s.encounter.waves.length, 3); assert.equal(s.encounter.members.length, 18);
  assert.equal(s.encounter.outcome, 'cleared'); assert.equal(s.score, 18 * 250 + R.clearBonus);
  const score = s.score; steps(s, 5); assert.equal(s.score, score);
  assert.equal(s.bullets.some(b => !b.friendly), false);
});

test('three Interceptors serialize attack chains and preserve warnings at boost speed', () => {
  const s = run('interceptors', { invincible: true }); s.shotTimer = Infinity;
  const attacks = new Set(), phases = new Map();
  for (let i = 0; i < 120 * 16; i++) {
    s.step(1 / 120, { boost: true, racing: true });
    const active = s.enemies.filter(e => ['aim', 'locked', 'charge', 'dashWarning', 'dash'].includes(e.phase));
    assert.ok(active.length <= 1);
    for (const e of active) {
      if (e.phase === 'charge') attacks.add(e.slot);
      const key = `${e.id}:${e.phase}`; if (!phases.has(key)) phases.set(key, s.time);
    }
  }
  assert.deepEqual([...attacks], [0, 1, 2]);
  for (const e of s.encounter.members) {
    assert.ok(phases.get(`${e.id}:charge`) - phases.get(`${e.id}:locked`) >= R.interceptorLock - 0.02);
    assert.ok(phases.get(`${e.id}:dash`) - phases.get(`${e.id}:dashWarning`) >= R.dashWarning - 0.02);
  }
  assert.equal(s.bullets.some(b => !b.friendly), false);
});

test('side dash locks its destination, traverses laterally, then exposes the engine', () => {
  const s = run('interceptors', { invincible: true }); s.shotTimer = Infinity; steps(s, 2.8);
  const e = s.enemies.find(e => e.phase === 'dashWarning'); assert.ok(e);
  const locked = e.dashTarget, start = e.dashStart; s.lateral = -locked;
  for (let i = 0; i < 240 && e.phase !== 'recovery'; i++) { s.step(1 / 120); assert.equal(e.dashTarget, locked); }
  assert.equal(e.phase, 'recovery'); assert.ok(Math.abs(e.lateral - start) > 3);
  e.contact = false; const before = e.hp;
  s.hitTarget(e, 1, roadPoint(e.s - 5, e.lateral)); assert.equal(e.hp, before - 1.5);
});

test('ordinary Interceptor staging stays ahead and armor protects unexposed engines', () => {
  const s = run('interceptors', { invincible: true }); s.shotTimer = Infinity; steps(s, 0.3, { boost: true });
  assert.ok(s.enemies.every(e => e.s - s.s > 18 && e.s - s.distance < 42));
  const e = s.enemies[0]; s.hitTarget(e, 1, roadPoint(e.s - 5, e.lateral)); assert.ok(Math.abs(e.hp - 11.8) < 1e-8);
  e.phase = 'recovery'; e.contact = false; assert.ok(s.encounter.killReward(e) > s.encounter.passed(e) * 5);
});

test('clusters rotate in opposite directions, drift, and preserve shot-out gaps', () => {
  const s = run('mines', { invincible: true }); s.shotTimer = Infinity;
  const [a, b] = s.encounter.clusters; assert.equal(a.members.length, 3); assert.equal(b.direction, -a.direction);
  const oldS = a.s, old = a.members[1].lateral;
  s.hitTarget(a.members[0]); steps(s, 0.5);
  assert.ok(a.s > oldS); assert.notEqual(a.members[1].lateral, old);
  assert.equal(a.members.filter(m => m.hp > 0).length, 2); assert.equal(b.members.filter(m => m.hp > 0).length, 3);
});

test('killing both layers preserves moving clusters and stops new drops', () => {
  const s = run('mines', { invincible: true }); s.shotTimer = Infinity;
  for (const layer of s.encounter.layers) s.hitTarget(layer, 30);
  const count = s.encounter.clusters.length, c = s.encounter.clusters[1], old = c.members[1].x;
  steps(s, 0.4); assert.equal(s.encounter.clusters.length, count); assert.notEqual(c.members[1].x, old);
  assert.equal(s.status, 'playing');
});

test('entire orbit fits narrowing roads without losing members', () => {
  const enc = run('mines').encounter; enc.mines = []; enc.clusters = [];
  const c = enc.dropCluster(510, 14, 1, 2), initial = c.radius;
  for (let at = 510; at <= 750; at++) {
    c.s = at; c.age += 1 / 120; enc.placeCluster(c, 1 / 120);
    for (const m of c.members) assert.ok(Math.abs(m.lateral) + m.halfWidth < trackAt(m.s).width / 2);
  }
  assert.ok(c.radius < initial); assert.equal(c.members.filter(m => m.hp > 0).length, 3);
});

test('unarmed mines are harmless; armed mines detect fast and lateral swept contact', () => {
  for (const armed of [false, true]) {
    const s = run('mines'); s.shotTimer = Infinity; for (const e of s.encounter.layers) e.hp = 0;
    s.encounter.mines = []; s.encounter.clusters = [];
    const m = s.encounter.dropMine(50, 0, armed ? 2 : 0);
    player(s, 46, 0); s.speed = 122; steps(s, 0.1, { boost: true });
    assert.equal(s.health, armed ? 80 : 100); assert.equal(m.hp, armed ? 0 : 1);
  }
  const s = run('mines'); s.encounter.mines = []; s.encounter.clusters = [];
  const m = s.encounter.dropMine(s.s, 4, 2); m.oldX = -4; m.oldZ = s.z;
  s.encounter.hazards(1 / 120, s.x, s.z, sweptHitsEntity); assert.equal(s.health, 80);
});

test('convoy turrets are independently destructible and escorts are removed', () => {
  const s = run('convoy', { invincible: true }); s.shotTimer = Infinity;
  assert.equal(s.enemies.filter(e => e.kind === 'escort').length, 0);
  const dead = s.encounter.turrets[0]; s.hitTarget(dead, 10); steps(s, 5);
  assert.equal(s.bullets.some(b => b.sourceId === dead.id), false);
  assert.ok(s.bullets.some(b => b.pattern === 'turret-sweep')); assert.equal(s.score, 500);
});

test('turrets alternate tracking and sweeping bursts from the truck itself', () => {
  const s = run('convoy', { invincible: true }); s.shotTimer = Infinity; const seen = new Map();
  for (let i = 0; i < 120 * 4.75; i++) { s.step(1 / 120); for (const b of s.bullets) seen.set(b.id, { ...b }); }
  const track = [...seen.values()].filter(b => b.pattern === 'turret-track');
  const sweep = [...seen.values()].filter(b => b.pattern === 'turret-sweep');
  assert.equal(track.length, 12); assert.equal(sweep.length, 14);
  assert.ok(new Set(sweep.map(b => b.vx)).size >= 6);
  assert.ok([...seen.values()].every(b => s.encounter.turrets.some(e => e.id === b.sourceId)));
});

test('lock retaliation is warned and killed turrets cannot respond', () => {
  const s = run('convoy', { invincible: true }); s.shotTimer = Infinity;
  const enc = s.encounter; s.hitTarget(enc.locks[0], 16); s.hitTarget(enc.turrets[0], 10);
  steps(s, 0.7); assert.equal(s.bullets.some(b => b.pattern === 'turret-defense'), false); assert.ok(enc.turrets[1].charge > 0);
  steps(s, 0.15); const shots = s.bullets.filter(b => b.pattern === 'turret-defense');
  assert.equal(shots.length, 9); assert.ok(shots.every(b => b.sourceId !== enc.turrets[0].id));
});

test('convoy warns before lane changes and mounted targets move with the hull', () => {
  const s = run('convoy', { invincible: true }); s.shotTimer = Infinity;
  steps(s, 4.4); assert.equal(s.encounter.laneWarning, true); assert.equal(s.encounter.convoyLane, 0);
  steps(s, 1.5); const enc = s.encounter; assert.ok(enc.convoyLane > 1);
  assert.equal(enc.locks[1].lateral, enc.hauler.lateral);
  assert.ok(Math.abs(enc.turrets[3].lateral - enc.hauler.lateral - 3.3) < 1e-6);
});

test('autofire hits locks before hull, salvage pays once with feedback, full raid removes turrets', () => {
  const s = run('convoy', { invincible: true }); steps(s, 1.5); const enc = s.encounter;
  assert.ok(enc.locks[1].hp < 16); s.shotTimer = Infinity; s.hitTarget(enc.locks[0], 16);
  const p = enc.pickups[0]; assert.ok(p.s > s.s + 10);
  p.age = 0.3; player(s, p.s, p.lateral); const score = s.score;
  enc.hazards(1 / 120, s.x, s.z, sweptHitsEntity);
  assert.equal(s.score - score, R.reward); assert.match(enc.notice, /SALVAGE COLLECTED/);
  enc.hazards(1 / 120, s.x, s.z, sweptHitsEntity); assert.equal(enc.collected, 1);
  s.hitTarget(enc.locks[1], 16); s.hitTarget(enc.locks[2], 16);
  assert.equal(enc.hauler.hp, 0); assert.ok(enc.turrets.every(e => e.hp === 0));
});

test('escape, partial raid and clear rewards stay distinct', () => {
  for (const locks of [0, 1, 3]) {
    const s = run('convoy'), enc = s.encounter;
    for (let i = 0; i < locks; i++) s.hitTarget(enc.locks[i], 16);
    enc.pickups = []; for (const e of enc.members) e.passed = true; enc.finish(1);
    assert.equal(enc.outcome, locks === 3 ? 'cleared' : locks ? 'partial' : 'escaped');
    assert.equal(s.score, locks * 200 + (locks === 3 ? R.clearBonus : 0));
  }
});

test('all encounters remain finite and bounded across cruise, fast and boost', () => {
  for (const type of Object.keys(ENCOUNTERS)) for (const input of [{}, { racing: true }, { boost: true }]) {
    const s = run(type, { invincible: true, encounterSupport: true });
    for (let i = 0; i < 120 * 25 && s.status === 'playing'; i++) {
      s.step(1 / 120, input); assert.ok(Number.isFinite(s.s + s.x + s.z + s.speed));
      assert.ok(s.encounter.mines.length <= R.mineLimit); assert.ok(s.bullets.length <= 220);
      for (const e of [...s.enemies, ...s.encounter.mines]) assert.ok(Number.isFinite(e.x + e.z + e.s));
    }
  }
});
