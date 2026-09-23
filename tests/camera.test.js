import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraPose } from '../src/camera.js';
import { trackAt } from '../src/track.js';

test('ship remains visible above bottom HUD through both camera modes and fore/aft travel', () => {
  for (const aspect of [390 / 844, 907 / 958, 16 / 9, 844 / 390]) {
    const camera = new PerspectiveCamera(55, aspect, 0.1, 350);
    for (const cameraShift of [true, false]) for (let distance = 30; distance < 2100; distance += 10) {
      for (const offset of [-7, 0, 10]) for (const side of [-1, 0, 1]) {
        const road = trackAt(distance + offset);
        const sim = { distance, offset, s: distance + offset, x: road.center + side * (road.width / 2 - 1) };
        const pose = cameraPose(sim, aspect, cameraShift);
        camera.position.fromArray(pose.position); camera.lookAt(new Vector3(...pose.target)); camera.updateMatrixWorld();
        const projected = new Vector3(sim.x, 0.975, -sim.s).project(camera);
        assert.ok(projected.y > -0.65 && projected.y < 0.8, `ship at ${distance}, offset ${offset}, aspect ${aspect}: ${projected.y}`);
        assert.ok(Math.abs(projected.x) < 0.97, `ship sideways at ${distance}, offset ${offset}, aspect ${aspect}: ${projected.x}`);
      }
    }
  }
});
