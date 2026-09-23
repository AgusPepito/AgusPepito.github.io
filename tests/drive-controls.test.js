import test from 'node:test';
import assert from 'node:assert/strict';
import { DriveStick } from '../src/drive-stick.js';
import { BoostMeter, BOOST } from '../src/boost.js';
import { Simulation, SPEED } from '../src/simulation.js';

test('stick separates repositioning from outer fast/brake zones and permits diagonal steering', () => {
  const stick = new DriveStick();
  assert.equal(stick.sample(0.05, 0.1).y, 0);
  let v = stick.sample(0.3, 0.4);
  assert.ok(v.x > 0 && v.y > 0); assert.equal(v.racing, false); assert.equal(v.braking, false);
  v = stick.sample(1, 1); assert.ok(v.x > 0.6 && v.racing); assert.equal(v.y, 0);
  assert.ok(Math.hypot(v.knobX, v.knobY) <= 1 + 1e-9);
  v = stick.sample(-1, -1); assert.ok(v.x < -0.6 && v.braking); assert.equal(v.y, 0);
  stick.clear(); assert.equal(stick.mode, 'cruise'); assert.equal(stick.value.braking, false);
});

test('stick thresholds resist flickering and release to normal repositioning', () => {
  const stick = new DriveStick();
  assert.equal(stick.sample(0, 0.69).racing, false);
  assert.equal(stick.sample(0, 0.72).racing, true);
  assert.equal(stick.sample(0, 0.6).racing, true);
  assert.equal(stick.sample(0, 0.54).racing, false);
  assert.equal(stick.sample(0, -0.72).braking, true);
  assert.equal(stick.sample(0, -0.6).braking, true);
  assert.equal(stick.sample(0, -0.54).braking, false);
});

test('boost has four seconds of charge, delayed slow regeneration, and no empty-meter pulsing', () => {
  const meter = new BoostMeter();
  for (let i = 0; i < 480; i++) meter.step(1 / 120, true, false);
  assert.equal(meter.energy, 0); assert.equal(meter.active, false); assert.equal(meter.locked, true);
  for (let i = 0; i < 240; i++) meter.step(1 / 120, true, false);
  assert.equal(meter.energy, 0);
  for (let i = 0; i < 120 * 21; i++) meter.step(1 / 120, true, false);
  assert.equal(meter.energy, BOOST.capacity); assert.equal(meter.active, false);
  meter.step(1 / 120, false, false); assert.equal(meter.step(1 / 120, true, false), true);
});

test('brake cancels boost and requires a fresh boost press, with matching timer behavior across rates', () => {
  for (const hz of [60, 120, 240]) {
    const meter = new BoostMeter();
    for (let i = 0; i < hz; i++) meter.step(1 / hz, true, false);
    assert.ok(Math.abs(meter.energy - 75) < 1e-7);
    meter.step(1 / hz, true, true); assert.equal(meter.active, false);
    meter.step(1 / hz, true, false); assert.equal(meter.active, false);
    meter.step(1 / hz, false, false); assert.equal(meter.step(1 / hz, true, false), true);
  }
});

function runSim() {
  const sim = new Simulation({ traffic: false, neutralTraffic: false }); sim.start(); return sim;
}
function advance(sim, seconds, input) { for (let i = 0; i < seconds * 120; i++) sim.step(1 / 120, input); }

test('W/S-style repositioning does not change cruise speed; fast is unlimited and brake overrides all modes', () => {
  const sim = runSim(); advance(sim, 0.5, { y: 1 });
  assert.ok(sim.offset > 0); assert.equal(sim.speed, SPEED.combat);
  advance(sim, 0.5, { y: -1 }); assert.ok(Math.abs(sim.offset) < 1e-7);
  advance(sim, 2, { racing: true }); assert.ok(sim.speed > 80); assert.equal(sim.boost.energy, 100);
  advance(sim, 0.5, { racing: true, boost: true }); assert.ok(sim.speed > SPEED.racing);
  advance(sim, 0.5, { racing: true, boost: true, braking: true });
  assert.ok(sim.speed < 13); assert.equal(sim.boostActive, false); assert.equal(sim.racingHeld, false);
  advance(sim, 2, {}); assert.ok(Math.abs(sim.speed - SPEED.combat) < 0.1);
});

test('boost works from cruise or fast mode, expires to the held mode, and freezes during pause', () => {
  for (const racing of [false, true]) {
    const sim = runSim(); advance(sim, 1, { boost: true, racing });
    assert.ok(sim.speed > 115); assert.ok(sim.boost.energy < 76);
    sim.status = 'paused'; const energy = sim.boost.energy, distance = sim.distance;
    sim.step(3, { boost: true }); assert.equal(sim.boost.energy, energy); assert.equal(sim.distance, distance);
    sim.status = 'playing'; advance(sim, 5, { boost: true, racing });
    assert.equal(sim.boostActive, false); assert.equal(sim.boost.locked, true);
    assert.ok(Math.abs(sim.speed - (racing ? SPEED.racing : SPEED.combat)) < 0.2);
    sim.reset(); assert.equal(sim.boost.energy, 100); assert.equal(sim.braking, false);
  }
});
