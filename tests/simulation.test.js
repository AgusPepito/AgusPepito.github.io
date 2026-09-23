import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, segmentHitsBox, PLAYER } from '../src/simulation.js';
import { trackAt, COURSE_LENGTH, obstaclesNear } from '../src/track.js';

test('track has continuous width and center, including the lap seam', () => {
  for (let s = -1; s <= COURSE_LENGTH + 1; s += 0.5) {
    const a = trackAt(s), b = trackAt(s + 0.01);
    assert.ok(a.width >= 15 && a.width <= 44);
    assert.ok(Math.abs(a.width - b.width) < 0.01);
    assert.ok(Math.abs(a.center - b.center) < 0.01);
  }
  assert.deepEqual(trackAt(0), trackAt(COURSE_LENGTH));
});

test('movement is frame-rate independent through a full lap', () => {
  const run = (hz) => {
    const sim = new Simulation({ invincible: true }); sim.start();
    for (let i = 0; i < hz * 85; i++) sim.step(1 / hz, { x: Math.sin(i / hz), y: 0 });
    return sim;
  };
  const a = run(120), b = run(240);
  assert.ok(Math.abs(a.distance - b.distance) < 5);
  assert.ok(a.lap >= 2 && b.lap >= 2);
  assert.ok(a.enemies.length < 40 && a.bullets.length < 150);
});

test('high-speed projectiles detect thin targets across an update', () => {
  assert.equal(segmentHitsBox(0, 0, 0, 30, 0, 15, 1, 1), true);
  assert.equal(segmentHitsBox(3, 0, 3, 30, 0, 15, 1, 1), false);
  assert.equal(segmentHitsBox(0, 15, 0, 15, 0, 15, 1, 1), true);
});

test('wall contact bounds the ship, deals damage, and permits recovery', () => {
  const sim = new Simulation(); sim.start();
  for (let i = 0; i < 180; i++) sim.step(1 / 120, { x: 1, y: 0 });
  assert.ok(sim.health < 100 && sim.health > 0);
  const road = trackAt(sim.s);
  assert.ok(sim.x + PLAYER.halfWidth < road.center + road.width / 2);
  const x = sim.x;
  for (let i = 0; i < 30; i++) sim.step(1 / 120, { x: -1, y: 0 });
  assert.ok(sim.x < x - 1);
});

test('pause and death stop simulation; reset clears previous run', () => {
  const sim = new Simulation(); sim.start(); sim.step(1);
  sim.status = 'paused'; const distance = sim.distance; sim.step(2);
  assert.equal(sim.distance, distance);
  sim.status = 'playing'; sim.hurt(100, 'enemy'); sim.step(2);
  assert.equal(sim.status, 'over'); assert.equal(sim.distance, distance);
  sim.reset();
  assert.equal(sim.health, 100); assert.equal(sim.enemies.length, 0); assert.equal(sim.status, 'ready');
});

test('obstacles repeat at correct world positions on later laps', () => {
  const first = obstaclesNear(640, 10, 10)[0];
  const second = obstaclesNear(640 + COURSE_LENGTH, 10, 10)[0];
  assert.equal(first.x, second.x); assert.equal(second.s - first.s, COURSE_LENGTH);
});

test('autofire destroys enemies and produces score through normal simulation', () => {
  const sim = new Simulation({ invincible: true }); sim.start();
  for (let i = 0; i < 120 * 15; i++) sim.step(1 / 120);
  assert.ok(sim.kills > 0); assert.ok(sim.score >= sim.kills * 100);
  assert.ok(sim.events.some(event => event.kind === 'kill'));
});

test('speed transition can be disabled independently of track width', () => {
  const fast = new Simulation({ invincible: true }), constant = new Simulation({ invincible: true, speedShift: false });
  for (const sim of [fast, constant]) {
    sim.start(); sim.distance = 600; sim.s = 600; sim.x = trackAt(600).center;
    for (let i = 0; i < 120; i++) sim.step(1 / 120);
  }
  assert.ok(fast.speed > 38); assert.equal(constant.speed, 26);
});
