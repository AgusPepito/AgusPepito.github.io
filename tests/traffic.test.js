import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, PLAYER, SPEED } from '../src/simulation.js';
import { rampsNear, rampSample, trackAt, roadPoint, COURSE_LENGTH, MERGE_RAMPS, drivableBounds } from '../src/track.js';
import { FORMATION, formationSlot, placeEnemy } from '../src/enemies.js';
import { effectStrength, EFFECT_DEFAULTS } from '../src/speed-effects.js';

test('yellow barrier collision is fatal at either speed, including during hit immunity', () => {
  for (const speed of [SPEED.combat, SPEED.racing]) {
    const sim = new Simulation({ traffic: false }); sim.start();
    sim.s = sim.distance = 185; sim.lateral = -10; sim.speed = speed;
    sim.invulnerability = 0.7; Object.assign(sim, roadPoint(sim.s, sim.lateral));
    for (let i = 0; i < 60 && sim.status === 'playing'; i++) sim.step(1 / 120, { racing: speed === SPEED.racing });
    assert.equal(sim.status, 'over'); assert.equal(sim.health, 0);
    assert.equal(sim.deathReason, 'Yellow barrier collision');
  }
  const practice = new Simulation({ invincible: true }); practice.start(); practice.hurt(22, 'obstacle');
  assert.equal(practice.status, 'playing'); assert.equal(practice.health, 100);
});

test('distributed ramps repeat each lap and every enemy begins on its entry lane', () => {
  assert.equal(MERGE_RAMPS.length, 6);
  for (const definition of MERGE_RAMPS) {
    const ramp = rampsNear(definition.s, 0, 0).find(r => r.id === definition.id);
    const next = rampsNear(definition.s + COURSE_LENGTH, 0, 0).find(r => r.id === definition.id);
    assert.equal(next.start - ramp.start, COURSE_LENGTH); assert.notEqual(next.key, ramp.key);
    const sim = new Simulation(); sim.spawnRamp(ramp);
    const group = sim.groups[0];
    for (const e of sim.enemies) {
      group.age = e.slot * 0.14 + 0.02; placeEnemy(e, group);
      const p = rampSample(ramp, e.s);
      assert.ok(Math.abs(e.x - p.x) < 1e-7 && Math.abs(e.z - p.z) < 1e-7);
      assert.ok(Math.abs(e.lateral) > trackAt(e.s).width / 2, 'starts outside main roadway');
    }
    const end = rampSample(ramp, ramp.end);
    assert.ok(Math.abs(end.lateral) < trackAt(ramp.end).width / 2, 'ramp joins the highway');
  }
});

test('shield rows cover the road and one destroyed slot leaves a usable gap at every width', () => {
  for (let width = 15; width <= 44; width += 0.5) {
    const row = Array.from({ length: FORMATION.count }, (_, slot) => formationSlot(width, slot, 2));
    const shipWidth = PLAYER.halfWidth * 2;
    assert.ok(row[0].lateral - row[0].halfWidth + width / 2 < shipWidth);
    assert.ok(width / 2 - row.at(-1).lateral - row.at(-1).halfWidth < shipWidth);
    for (let i = 1; i < row.length; i++) {
      const gap = row[i].lateral - row[i].halfWidth - row[i - 1].lateral - row[i - 1].halfWidth;
      assert.ok(gap < shipWidth);
    }
    const openedGap = row[4].lateral - row[4].halfWidth - row[2].lateral - row[2].halfWidth;
    assert.ok(openedGap > shipWidth + 0.8, 'destroying middle slot creates room, even in the narrowest section');
  }
});

test('deployment is continuous, shield wings retract, and killed slots never repack', () => {
  const sim = new Simulation(), ramp = rampsNear(420, 0, 0).find(r => r.kind === 'armored');
  sim.spawnRamp(ramp); const group = sim.groups[0];
  for (let frame = 0; frame <= 840; frame++) {
    group.age = frame / 120; group.s = ramp.end + Math.max(0, group.age - 3) * FORMATION.speed;
    for (const e of sim.enemies) {
      const previous = { x: e.x, z: e.z }; placeEnemy(e, group);
      assert.ok(Number.isFinite(e.x + e.z + e.yaw));
      assert.ok(Math.hypot(e.x - previous.x, e.z - previous.z) < 1, 'no teleport at merge or deployment');
    }
  }
  assert.ok(sim.enemies.every(e => e.deployed === 1));
  const wide = formationSlot(44, 0).halfWidth, narrow = formationSlot(15, 0).halfWidth;
  assert.ok(narrow < wide);
  sim.enemies = sim.enemies.filter(e => e.slot !== 3);
  group.s = 900;
  for (const e of sim.enemies) { placeEnemy(e, group); assert.ok(Math.abs(e.lateral - formationSlot(trackAt(group.s).width, e.slot, group.age).lateral) < 1e-8); }
  assert.equal(sim.enemies.some(e => e.slot === 3), false);
});

test('autofire can destroy a shield carrier and impact immunity cannot pass through one', () => {
  const prepare = () => {
    const sim = new Simulation({ traffic: false, invincible: true }); sim.start();
    const ramp = rampsNear(420, 0, 0).find(r => r.kind === 'armored'); sim.spawnRamp(ramp);
    const group = sim.groups[0]; group.age = 10; group.s = 610;
    for (const e of sim.enemies) placeEnemy(e, group);
    sim.s = sim.distance = 580; Object.assign(sim, roadPoint(sim.s));
    return sim;
  };
  const fighting = prepare();
  for (let i = 0; i < 120 * 5; i++) fighting.step(1 / 120);
  assert.ok(fighting.kills > 0, 'sustained combat fire opens a gap');
  assert.equal(fighting.enemies.some(e => e.slot === 3), false);
  const rushing = prepare(); rushing.shotTimer = Infinity; rushing.invulnerability = 100;
  for (let i = 0; i < 120 * 3; i++) rushing.step(1 / 120, { racing: true });
  const middle = rushing.enemies.find(e => e.slot === 3);
  assert.ok(rushing.s < middle.s - middle.halfDepth - PLAYER.halfDepth);
});

test('connected merge aprons have matching driveable space and disconnect behind the ramp', () => {
  const ramp = rampsNear(120, 0, 0)[0];
  const s = ramp.start + 85, bounds = drivableBounds(s), lane = rampSample(ramp, s);
  assert.ok(bounds.left < -trackAt(s).width / 2);
  assert.equal(bounds.left, lane.lateral - lane.width / 2);
  assert.equal(drivableBounds(ramp.end + 1).left, -trackAt(ramp.end + 1).width / 2);
});

test('effects scale with speed, allow full disable, respect reduced motion, and reserve turbo headroom', () => {
  for (const value of Object.values(EFFECT_DEFAULTS)) {
    assert.ok(effectStrength(82, value) > effectStrength(26, value));
    assert.ok(effectStrength(82, value) < 0.5);
    assert.equal(effectStrength(82, 0), 0); assert.equal(effectStrength(82, value, true), 0);
    assert.equal(effectStrength(82, value, false, 2), 2 * effectStrength(82, value));
  }
});
