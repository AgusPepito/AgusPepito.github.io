import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, PLAYER, SPEED } from '../src/simulation.js';
import { createFork, forkSample } from '../src/forks.js';
import { roadPoint } from '../src/track.js';

const modes = [
  { speed: SPEED.combat, input: {} },
  { speed: SPEED.racing, input: { racing: true } },
  { speed: SPEED.boost, input: { racing: true, boost: true } },
];
function setup(index, mode, at, offset = 0, state = 'bypass') {
  const sim = new Simulation({ encounter: 'mixed', invincible: true, neutralTraffic: false });
  const fork = createFork(index, 30); assert.ok(fork);
  fork.state = state;
  sim.level.fork = fork; sim.level.forks = [fork]; sim.level.index = index;
  sim.level.outcomes = Array(index).fill('cleared'); sim.level.nextAt = fork.start;
  sim.s = sim.distance = at(fork); sim.speed = mode.speed;
  sim.raceBlend = mode.input.racing ? 1 : 0;
  sim.lateral = forkSample(fork, sim.s).center + offset;
  Object.assign(sim, roadPoint(sim.s, sim.lateral));
  sim.shotTimer = Infinity; sim.start();
  return { sim, fork };
}

test('steering away from the inner bypass wall works during fast entry bends', () => {
  for (const index of [0, 2]) for (const mode of modes) for (const hz of [60, 120]) {
    const { sim, fork } = setup(index, mode, f => f.start + 80);
    const side = fork.side, half = forkSample(fork, sim.s).width / 2 - PLAYER.halfWidth - 0.18;
    sim.lateral -= side * half; Object.assign(sim, roadPoint(sim.s, sim.lateral));
    const startOffset = sim.lateral - forkSample(fork, sim.s).center;
    for (let i = 0; i < hz / 4; i++) sim.step(1 / hz, { ...mode.input, x: side });
    const offset = sim.lateral - forkSample(fork, sim.s).center;
    assert.ok((offset - startOffset) * side > 2.4, `side ${side}, speed ${mode.speed}, ${hz} Hz: inward travel ${(offset - startOffset) * side}`);
    assert.equal(sim.wallHits, 0, 'moving away must not keep damaging the player');
  }
});

test('longitudinal movement follows the bypass without consuming lateral steering', () => {
  for (const index of [0, 2]) for (const mode of modes) {
    const { sim, fork } = setup(index, mode, f => f.start + 40, 1);
    for (let i = 0; i < 120; i++) {
      sim.step(1 / 120, { ...mode.input, y: i < 60 ? 1 : -1 });
      const offset = sim.lateral - forkSample(fork, sim.s).center;
      assert.ok(Math.abs(offset - 1) < 1e-7, `lane offset drifted to ${offset}`);
    }
    assert.equal(sim.wallHits, 0);
  }
});

test('joining and leaving either bypass preserves lateral lane position', () => {
  for (const index of [0, 2]) for (const mode of modes) {
    const entry = setup(index, mode, f => f.start - 0.1, 0.5, 'approach');
    entry.sim.step(1 / 60, mode.input);
    assert.equal(entry.sim.activeFork, entry.fork);
    assert.ok(Math.abs(entry.sim.lateral - forkSample(entry.fork, entry.sim.s).center - 0.5) < 1e-7);
    assert.equal(entry.sim.wallHits, 0);
    const exit = setup(index, mode, f => f.end - 0.1, -0.5);
    exit.sim.step(1 / 60, mode.input);
    assert.equal(exit.sim.activeFork, null);
    assert.equal(exit.sim.level.index, index + 1);
    assert.equal(exit.sim.level.outcomes[index], 'bypassed');
    assert.ok(Math.abs(exit.sim.lateral - forkSample(exit.fork, exit.fork.end).center + 0.5) < 1e-7);
    assert.equal(exit.sim.wallHits, 0);
  }
});

test('bypass walls still stop outward steering and allow an immediate reversal', () => {
  for (const index of [0, 2]) for (const mode of modes) {
    const { sim, fork } = setup(index, mode, f => f.start + 40);
    for (let i = 0; i < 120; i++) sim.step(1 / 120, { ...mode.input, x: fork.side });
    assert.ok(sim.wallHits > 0);
    const sample = forkSample(fork, sim.s), margin = PLAYER.halfWidth + 0.18;
    assert.ok(sim.lateral >= sample.left + margin - 1e-8 && sim.lateral <= sample.right - margin + 1e-8);
    const before = sim.lateral - sample.center, hits = sim.wallHits;
    for (let i = 0; i < 30; i++) sim.step(1 / 120, { ...mode.input, x: -fork.side });
    const after = sim.lateral - forkSample(fork, sim.s).center;
    assert.ok((before - after) * fork.side > 2.4);
    assert.equal(sim.wallHits, hits);
  }
});
