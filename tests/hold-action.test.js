import test from 'node:test';
import assert from 'node:assert/strict';
import { HoldAction } from '../src/hold-action.js';

test('racing stays held until all keyboard and touch sources release', () => {
  const hold = new HoldAction();
  hold.keyDown('ShiftLeft'); hold.keyDown('ShiftRight'); hold.pointerDown(2);
  hold.keyUp('ShiftLeft'); assert.equal(hold.active, true);
  hold.pointerUp(1); assert.equal(hold.active, true, 'releasing the steering finger cannot cancel racing');
  hold.keyUp('ShiftRight'); assert.equal(hold.active, true);
  hold.pointerUp(2); assert.equal(hold.active, false);
});

test('focus loss/pause clears every held source; unrelated keys never activate racing', () => {
  const hold = new HoldAction();
  hold.keyDown('KeyW'); assert.equal(hold.active, false);
  hold.keyDown('ShiftLeft'); hold.pointerDown(7); hold.clear();
  assert.equal(hold.active, false);
  hold.keyDown('Space'); assert.equal(hold.active, false, 'Space is reserved for boost');
  hold.keyDown('ShiftLeft'); assert.equal(hold.active, true);
  hold.keyUp('ShiftLeft'); assert.equal(hold.active, false);
});

test('fast, brake and boost bindings remain independent with multiple physical inputs', () => {
  const fast = new HoldAction(), brake = new HoldAction(['ControlLeft', 'ControlRight']), boost = new HoldAction(['Space']);
  for (const action of [fast, brake, boost]) action.keyDown('Space');
  assert.equal(fast.active, false); assert.equal(brake.active, false); assert.equal(boost.active, true);
  boost.pointerDown(3); boost.keyUp('Space'); assert.equal(boost.active, true);
  boost.pointerUp(3); assert.equal(boost.active, false);
  brake.keyDown('ControlLeft'); brake.keyDown('ControlRight'); brake.keyUp('ControlLeft');
  assert.equal(brake.active, true); brake.clear(); assert.equal(brake.active, false);
});
