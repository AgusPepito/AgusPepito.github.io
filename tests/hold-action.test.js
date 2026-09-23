import test from 'node:test';
import assert from 'node:assert/strict';
import { HoldAction } from '../src/hold-action.js';

test('racing stays held until all keyboard and touch sources release', () => {
  const hold = new HoldAction();
  hold.keyDown('Space'); hold.keyDown('ShiftRight'); hold.pointerDown(2);
  hold.keyUp('Space'); assert.equal(hold.active, true);
  hold.pointerUp(1); assert.equal(hold.active, true, 'releasing the steering finger cannot cancel racing');
  hold.keyUp('ShiftRight'); assert.equal(hold.active, true);
  hold.pointerUp(2); assert.equal(hold.active, false);
});

test('focus loss/pause clears every held source; unrelated keys never activate racing', () => {
  const hold = new HoldAction();
  hold.keyDown('KeyW'); assert.equal(hold.active, false);
  hold.keyDown('ShiftLeft'); hold.pointerDown(7); hold.clear();
  assert.equal(hold.active, false);
  hold.keyDown('Space'); assert.equal(hold.active, true);
  hold.keyUp('Space'); assert.equal(hold.active, false);
});
