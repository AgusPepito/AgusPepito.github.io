import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, SPEED } from '../src/simulation.js';
import { NEUTRAL, createVehicle, moveVehicle, vehicleSeed } from '../src/neutral-traffic.js';
import { SHIELD_VOLLEY, shieldVolley, placeEnemy } from '../src/enemies.js';
import { trackAt, rampsNear, roadPoint } from '../src/track.js';

test('neutral vehicles advance slowly and stay within narrowing roads through bends', () => {
  const truck = createVehicle(vehicleSeed(0), 1), initial = truck.s;
  for (let i = 0; i < 120; i++) moveVehicle(truck, 1 / 120);
  assert.ok(Math.abs(truck.s - initial - NEUTRAL.speed) < 0.01);
  assert.ok(NEUTRAL.speed < SPEED.combat / 2);
  for (let i = 0; i < 120 * 150; i++) {
    moveVehicle(truck, 1 / 120);
    assert.ok(Math.abs(truck.lateral) + truck.halfWidth < trackAt(truck.s).width / 2);
    assert.ok(Number.isFinite(truck.x + truck.z + truck.yaw));
  }
  assert.ok(truck.s > 1100);
});

test('neutral traffic takes hits, can be destroyed, does not shoot or respawn, and resets cleanly', () => {
  const sim = new Simulation({ traffic: false }); sim.start(); sim.shotTimer = Infinity;
  const truck = sim.vehicles[0];
  const shoot = () => sim.bullets.push({ id: sim.nextId++, x: truck.x, z: truck.z + 8,
    s: truck.s - 8, vx: 0, vz: -2000, friendly: true, life: 1 });
  shoot(); sim.step(1 / 120);
  assert.equal(truck.hp, NEUTRAL.hp - 1); assert.ok(truck.hp > 100);
  sim.status = 'paused'; const s = truck.s; sim.step(1);
  assert.equal(truck.s, s); assert.equal(truck.hp, NEUTRAL.hp - 1);
  sim.status = 'playing';
  for (let i = 0; i < NEUTRAL.hp - 1; i++) shoot();
  sim.step(1 / 120);
  assert.equal(sim.vehicles.some(v => v.id === truck.id), false);
  assert.equal(sim.vehiclesDestroyed, 1); assert.equal(sim.kills, 0); assert.equal(sim.score, 0);
  for (let i = 0; i < 240; i++) sim.step(1 / 120);
  assert.equal(sim.vehicles.some(v => v.id === truck.id), false);
  assert.equal(sim.bullets.some(b => !b.friendly), false);
  sim.reset(); assert.equal(sim.vehiclesDestroyed, 0);
  assert.ok(sim.vehicles.every(v => v.hp === NEUTRAL.hp));
});

function volleyFixture() {
  return { group: { age: 0, s: 200 }, members: Array.from({ length: 7 }, (_, slot) => ({ slot, active: true, deployed: 1, hp: 12 })) };
}

test('purple volleys warn, sweep left to right with delays, and leave destroyed slots empty', () => {
  const { group, members } = volleyFixture(); members[3].hp = 0;
  const fired = [];
  for (let i = 0; i <= 120 * 7; i++) {
    group.age = i / 120;
    const shots = shieldVolley(group, members, 100);
    if (group.age < SHIELD_VOLLEY.warning) assert.equal(shots.length, 0);
    for (const e of shots) fired.push({ time: group.age, slot: e.slot });
  }
  assert.deepEqual(fired.map(e => e.slot), [0, 1, 2, 4, 5, 6, 0, 1, 2, 4, 5, 6]);
  for (let i = 1; i < 6; i++) {
    const interval = (fired[i].slot - fired[i - 1].slot) * SHIELD_VOLLEY.delay;
    assert.ok(Math.abs(fired[i].time - fired[i - 1].time - interval) < 1 / 120 + 1e-6);
  }
  assert.ok(Math.abs(fired[6].time - fired[0].time - SHIELD_VOLLEY.period) < 0.01);
});

test('shield rows cannot fire while merging or after being overtaken', () => {
  const { group, members } = volleyFixture();
  members[6].deployed = 0.5;
  group.age = 10; assert.deepEqual(shieldVolley(group, members, 100), []);
  members[6].deployed = 1;
  shieldVolley(group, members, 100);
  group.age += 0.5;
  assert.deepEqual(shieldVolley(group, members, 210), []);
  group.age += 10;
  assert.deepEqual(shieldVolley(group, members, 210), []);
  assert.ok(members.every(e => e.charge === 0));
  assert.deepEqual(shieldVolley(group, members, 100), [], 'returning to range starts a fresh warning');
});

test('deployed shield rows emit hostile pattern projectiles in the running simulation', () => {
  const sim = new Simulation({ traffic: false, neutralTraffic: false, invincible: true }); sim.start();
  sim.spawnRamp(rampsNear(420, 0, 0).find(r => r.kind === 'armored'));
  const group = sim.groups[0]; group.age = 10; group.s = 610;
  for (const e of sim.enemies) placeEnemy(e, group);
  sim.s = sim.distance = 540; Object.assign(sim, roadPoint(sim.s)); sim.shotTimer = Infinity;
  const slots = new Set();
  for (let i = 0; i < 120 * 3; i++) {
    sim.step(1 / 120);
    for (const b of sim.bullets) {
      assert.equal(b.friendly, false); assert.equal(b.pattern, 'shield'); slots.add(b.slot);
      assert.ok(Math.abs(Math.hypot(b.vx, b.vz) - SHIELD_VOLLEY.speed) < 1e-6);
    }
  }
  assert.deepEqual([...slots].sort(), [0, 1, 2, 3, 4, 5, 6]);
});
