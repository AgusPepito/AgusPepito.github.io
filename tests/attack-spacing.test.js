import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { SCOUT_FIRE as F } from '../src/scout-fire.js';
import { ENCOUNTER_RULES as R } from '../src/encounters.js';

function run(options) {
  const s = new Simulation({ invincible: true, neutralTraffic: false, ...options });
  s.start(); s.shotTimer = Infinity; return s;
}
function capture(s, seconds, inspect) {
  const seen = new Set();
  for (let i = 0; i < seconds * 120; i++) {
    s.step(1 / 120);
    const fresh = s.bullets.filter(b => !b.friendly && !seen.has(b.id));
    for (const b of fresh) seen.add(b.id);
    inspect(fresh, s.time);
  }
}

test('red fans are slower, wider and globally spaced across reinforcement pairs and highway groups', () => {
  for (const options of [{ encounter: 'convoy' }, { traffic: false }]) {
    const s = run(options), sources = new Set(); let last = -Infinity, volleys = 0;
    if (!options.encounter) {
      // Start two normal ramp groups already merged, in firing range.
      for (const side of [-1, 1]) {
        s.spawnRamp({ key: `test-${side}`, start: 20, end: 60, side, kind: 'scout' });
        s.groups.at(-1).age = 4.5;
      }
    }
    capture(s, options.encounter ? 18 : 10, (fresh, time) => {
      const shots = fresh.filter(b => b.pattern === 'scout');
      if (!shots.length) return;
      assert.equal(shots.length, 3);
      assert.equal(new Set(shots.map(b => b.sourceId)).size, 1);
      assert.ok(time - last >= F.volleyGap - 1e-8, 'overlapping scout volleys');
      last = time; volleys++; sources.add(shots[0].sourceId);
      for (const b of shots) assert.ok(Math.abs(Math.hypot(b.vx, b.vz) - 12) < 1e-8);
      for (let j = 1; j < shots.length; j++) {
        const dot = shots[j - 1].vx * shots[j].vx + shots[j - 1].vz * shots[j].vz;
        assert.ok(Math.abs(Math.acos(dot / 144) - 0.3) < 1e-8);
      }
    });
    assert.ok(volleys >= 4); assert.ok(sources.size >= 3, 'different cars must get firing turns');
  }
});

test('Dart firing turns stay separated when all three waves overlap', () => {
  const s = run({ encounter: 'darts', encounterSupport: false });
  const sources = new Set(), waves = new Set(); let last = -Infinity, previous = null;
  capture(s, 20, (fresh, time) => {
    const shots = fresh.filter(b => b.pattern?.startsWith('dart-'));
    if (!shots.length) return;
    assert.equal(new Set(shots.map(b => b.sourceId)).size, 1);
    const source = shots[0].sourceId;
    if (source !== previous) assert.ok(time - last >= R.dartAttackGap + R.dartWarning - 0.01);
    sources.add(source); waves.add(s.encounter.members.find(e => e.id === source).wave);
    previous = source; last = time;
  });
  assert.ok(sources.size >= 9); assert.equal(waves.size, 3);
});

test('hidden or destroyed Darts abandon their turn without releasing queued attacks', () => {
  for (const reason of ['hidden', 'destroyed']) {
    const s = run({ encounter: 'darts', encounterSupport: false });
    for (let i = 0; i < 120 && !s.encounter.dartAttack; i++) s.step(1 / 120);
    const target = s.encounter.dartAttack.enemy;
    if (reason === 'hidden') s.threatVisible = e => e.id !== target.id;
    else s.hitTarget(target, 6);
    let fired = 0;
    capture(s, 3, fresh => { assert.ok(fresh.every(b => b.sourceId !== target.id)); fired += fresh.length; });
    assert.ok(fired > 0, 'next visible shooter must take over');
  }
});

test('new firing schedules pause and reset with the simulation', () => {
  const s = run({ encounter: 'darts' });
  capture(s, 2, () => {});
  s.status = 'paused';
  const before = JSON.stringify([s.time, s.scoutNextFire, s.encounter.dartAttack, s.encounter.dartDelay]);
  s.step(10);
  assert.equal(JSON.stringify([s.time, s.scoutNextFire, s.encounter.dartAttack, s.encounter.dartDelay]), before);
  s.reset(); assert.equal(s.scoutNextFire, 0); assert.equal(s.encounter.dartAttack, null);
});
