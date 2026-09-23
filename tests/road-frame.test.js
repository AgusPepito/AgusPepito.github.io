import test from 'node:test';
import assert from 'node:assert/strict';
import { roadFrame, roadPoint, roadCoordinates, roadLineYaw, advanceOnRoad, trackAt, COURSE_LENGTH } from '../src/track.js';
import { Simulation, sweptHitsEntity } from '../src/simulation.js';

const close = (a, b, epsilon = 1e-6) => assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);
function onBend(lateral = 0) {
  const sim = new Simulation({ invincible: true }); sim.start();
  sim.distance = 610; sim.s = 610; sim.lateral = lateral;
  Object.assign(sim, roadPoint(sim.s, lateral));
  sim.waveAt = Infinity;
  return sim;
}

test('road frames are orthonormal and world coordinates round-trip through bends and lap seams', () => {
  for (let s = -20; s < COURSE_LENGTH * 2 + 20; s += 7) {
    const f = roadFrame(s);
    close(f.fx * f.rx + f.fz * f.rz, 0);
    close(Math.hypot(f.fx, f.fz), 1); close(Math.hypot(f.rx, f.rz), 1);
    for (const lateral of [-f.width / 2, 0, f.width / 2]) {
      const p = roadPoint(s, lateral), inverse = roadCoordinates(p.x, p.z);
      close(inverse.s, s); close(inverse.lateral, lateral);
    }
  }
});

test('center and edge markings point along their lane through curves and funnels', () => {
  for (const s of [490, 665, 830, 1040, 1210, 1710, 1990]) for (const fraction of [-0.5, 0, 0.5]) {
    const angle = roadLineYaw(s, fraction);
    const a = roadPoint(s - 0.5, trackAt(s - 0.5).width * fraction);
    const b = roadPoint(s + 0.5, trackAt(s + 0.5).width * fraction);
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const alignment = -Math.sin(angle) * (b.x - a.x) / length - Math.cos(angle) * (b.z - a.z) / length;
    assert.ok(alignment > 0.9999);
  }
});

test('neutral steering holds a road-relative line through multiple bends', () => {
  const sim = onBend(2);
  for (let i = 0; i < 120 * 10; i++) {
    sim.step(1 / 120, { racing: true });
    const p = roadPoint(sim.s, 2);
    close(sim.lateral, 2); close(sim.x, p.x); close(sim.z, p.z);
  }
  assert.ok(sim.s > 1100, 'crossed both directions of the S-bend');
  assert.equal(sim.wallHits, 0);
  const before = sim.lateral;
  for (let i = 0; i < 12; i++) sim.step(1 / 120, { x: 1 });
  assert.ok(sim.lateral > before + 0.5, 'right input moves across the road');
});

test('shots leave along the road tangent and retain straight world-space velocity', () => {
  const sim = onBend();
  sim.distance = 660; sim.s = 660; Object.assign(sim, roadPoint(sim.s));
  sim.step(1 / 120);
  const shot = sim.bullets.find(b => b.friendly), f = roadFrame(sim.s);
  const speed = Math.hypot(shot.vx, shot.vz);
  close(shot.vx / speed, f.fx); close(shot.vz / speed, f.fz);
  assert.ok(shot.vx > 1, 'shot is not aligned to world Z');
  const { x, z, vx, vz } = shot;
  for (let i = 0; i < 24; i++) sim.step(1 / 120);
  close(shot.vx, vx); close(shot.vz, vz);
  close(shot.x, x + vx * 0.2); close(shot.z, z + vz * 0.2);
});

test('swept collisions respect rotated targets and target motion', () => {
  const yaw = -Math.PI / 4, c = Math.cos(yaw), s = Math.sin(yaw);
  const p = (x, z) => ({ x: c * x + s * z, z: -s * x + c * z });
  const a = p(0, -20), b = p(0, 20);
  assert.equal(sweptHitsEntity(a.x, a.z, b.x, b.z, { x: 0, z: 0, yaw }, 0.5, 2), true);
  const missA = p(1, -20), missB = p(1, 20);
  assert.equal(sweptHitsEntity(missA.x, missA.z, missB.x, missB.z, { x: 0, z: 0, yaw }, 0.5, 2), false);
  assert.equal(sweptHitsEntity(0, 0, 0, 0, { oldX: -4, oldZ: 0, x: 4, z: 0, yaw: 0 }, 0.5, 0.5), true);
});

test('forward travel compensates for centerline length on a bend', () => {
  for (const s of [650, 820, 1020, 1800]) {
    const a = roadPoint(s), b = roadPoint(advanceOnRoad(s, 0.5));
    close(Math.hypot(b.x - a.x, b.z - a.z), 0.5, 1e-5);
  }
});
