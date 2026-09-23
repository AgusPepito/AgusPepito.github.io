import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, segmentHitsBox, PLAYER, SPEED } from '../src/simulation.js';
import { trackAt, COURSE_LENGTH, obstaclesNear, roadPoint } from '../src/track.js';

test('track has continuous width and center, including the lap seam', () => {
  for (let s = -1; s <= COURSE_LENGTH + 1; s += 0.5) {
    const a = trackAt(s), b = trackAt(s + 0.01);
    assert.ok(a.width >= 15 && a.width <= 44);
    assert.ok(Math.abs(a.width - b.width) < 0.01);
    assert.ok(Math.abs(a.center - b.center) < 0.01);
  }
  assert.deepEqual(trackAt(0), trackAt(COURSE_LENGTH));
});

test('unobstructed movement is frame-rate independent through a full lap', () => {
  const run = (hz) => {
    const sim = new Simulation({ invincible: true }); sim.start();
    // Isolate integration from discrete collision cooldowns and slowdown events,
    // whose timing is covered separately by collision/recovery tests.
    sim.hurt = () => {};
    for (let i = 0; i < hz * 85; i++) sim.step(1 / hz, { x: Math.sin(i / hz), y: 0, racing: (i / hz) % 12 < 4 });
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
  assert.ok(sim.lateral + PLAYER.halfWidth < road.width / 2);
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
    sim.start();
    for (let i = 0; i < 120; i++) sim.step(1 / 120, { racing: true });
  }
  assert.ok(fast.speed > 65); assert.equal(constant.speed, SPEED.combat);
});

test('zones never activate racing, and holding/releasing works in open space', () => {
  const sim = new Simulation({ invincible: true }); sim.start();
  sim.distance = 600; sim.s = 600; Object.assign(sim, roadPoint(600));
  for (let i = 0; i < 60; i++) sim.step(1 / 120);
  assert.equal(sim.raceBlend, 0); assert.equal(sim.speed, SPEED.combat);
  sim.reset(); sim.start();
  for (let i = 0; i < 180; i++) sim.step(1 / 120, { racing: true });
  assert.ok(sim.raceBlend > 0.99 && sim.speed > 79);
  assert.ok(sim.distance < 400, 'overdrive works in the wide first section');
  for (let i = 0; i < 180; i++) sim.step(1 / 120, { racing: false });
  assert.ok(sim.raceBlend < 0.001 && sim.speed < 27);
  assert.equal(sim.racingHeld, false);
  sim.reset(); assert.equal(sim.raceBlend, 0);
});

test('high-speed physical impacts are more dangerous without amplifying bullets', () => {
  const damage = (speed, kind) => { const sim = new Simulation(); sim.start(); sim.speed = speed; sim.hurt(20, kind); return 100 - sim.health; };
  assert.ok(damage(SPEED.racing, 'obstacle') > damage(SPEED.combat, 'obstacle'));
  assert.equal(damage(SPEED.racing, 'bullet'), damage(SPEED.combat, 'bullet'));
});
