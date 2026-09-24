import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { Simulation } from '../src/simulation.js';
import { cameraPose } from '../src/camera.js';
import { threatVisible } from '../src/threat-visibility.js';
import { ENCOUNTER_RULES as R } from '../src/encounters.js';
import { trackAt } from '../src/track.js';

function cameraAt(camera, sim, aspect, shift = false) {
  const pose = cameraPose(sim, aspect, shift); camera.fov = pose.fov; camera.updateProjectionMatrix();
  camera.position.fromArray(pose.position); camera.lookAt(new Vector3(...pose.target)); camera.updateMatrixWorld();
}
function advance(s, seconds) { for (let i = 0; i < seconds * 120; i++) s.step(1 / 120); }

test('top-down encounter staging is inside the readable view on desktop and phone', () => {
  for (const aspect of [16 / 9, 390 / 844, 844 / 390]) for (const type of ['darts', 'interceptors', 'mines', 'convoy']) {
    const s = new Simulation({ encounter: type }), camera = new PerspectiveCamera(55, aspect, 0.1, 350);
    cameraAt(camera, s, aspect);
    for (const e of s.enemies) assert.ok(threatVisible(camera, e), `${type} ${e.kind} slot ${e.slot}, aspect ${aspect}`);
  }
});

test('hostile shots originate from readable shooters after visible warning time', () => {
  for (const aspect of [16 / 9, 390 / 844]) for (const type of ['darts', 'interceptors', 'mines', 'convoy']) {
    const s = new Simulation({ encounter: type, invincible: true }); s.start(); s.shotTimer = Infinity;
    const camera = new PerspectiveCamera(55, aspect, 0.1, 350); s.threatVisible = e => threatVisible(camera, e);
    const seen = new Set(); let count = 0;
    for (let i = 0; i < 120 * 9; i++) {
      cameraAt(camera, s, aspect); s.step(1 / 120);
      for (const b of s.bullets) if (!b.friendly && !seen.has(b.id)) {
        seen.add(b.id); count++;
        const e = s.encounter.members.find(e => e.id === b.sourceId);
        assert.ok(threatVisible(camera, e), `${type} shot from outside view`);
        assert.ok(e.visibleFor >= R.visibleWarning);
      }
    }
    assert.ok(count > 0, `${type} must still attack; visibility must not suppress everything`);
  }
});

test('hidden shooters cannot attack and reentry requires a fresh readable interval', () => {
  const s = new Simulation({ encounter: 'darts', invincible: true }); s.start(); s.shotTimer = Infinity;
  s.threatVisible = () => false; advance(s, 3);
  assert.equal(s.bullets.length, 0);
  s.threatVisible = () => true; advance(s, 0.6); assert.equal(s.bullets.length, 0);
  advance(s, 3); assert.ok(s.bullets.length > 0);
  const previous = new Set(s.bullets.map(b => b.id)); s.threatVisible = () => false; advance(s, 2);
  assert.ok(s.bullets.every(b => previous.has(b.id)));
});

test('every encounter gets recurring normal red scouts alongside primary enemies', () => {
  for (const type of ['darts', 'interceptors', 'mines', 'convoy']) {
    const s = new Simulation({ encounter: type, invincible: true }); s.start(); s.shotTimer = Infinity;
    advance(s, 1.4);
    const first = s.encounter.members.filter(e => e.support);
    assert.equal(first.length, 2); assert.ok(first.every(e => e.kind === 'scout' && e.hp === 3));
    const ids = new Set(first.map(e => e.id)); let fired = false;
    for (let i = 0; i < 120 * 6; i++) {
      s.step(1 / 120); fired ||= s.bullets.some(b => b.pattern === 'scout' && ids.has(b.sourceId));
    }
    assert.ok(fired); assert.ok(s.encounter.members.some(e => e.support && !ids.has(e.id)));
  }
});

test('Darts have doubled HP and three waves; miners are tougher and deploy rotating walls', () => {
  const darts = new Simulation({ encounter: 'darts', invincible: true }); darts.start();
  assert.ok(darts.enemies.every(e => e.hp === 6)); darts.shotTimer = Infinity; advance(darts, 14.1);
  assert.equal(darts.encounter.waves.length, 3); assert.equal(darts.encounter.members.filter(e => e.kind === 'dart').length, 18);
  const s = new Simulation({ encounter: 'mines', encounterSupport: false, invincible: true }); s.start(); s.shotTimer = Infinity;
  assert.ok(s.encounter.layers.every(e => e.hp === 30)); advance(s, 3.7);
  const wall = s.encounter.clusters.filter(c => c.wall);
  assert.equal(wall.length, 4); assert.equal(new Set(wall.map(c => c.direction)).size, 2);
  assert.ok(wall.every(c => c.members.length === 3)); assert.ok(s.encounter.mines.length > 12);
  const narrow = new Simulation({ encounter: 'mines' }).encounter; narrow.mines = []; narrow.clusters = [];
  narrow.dropMineWall(650); assert.equal(narrow.clusters.length, 2);
  for (const c of narrow.clusters) for (const m of c.members) assert.ok(Math.abs(m.lateral) + m.halfWidth < trackAt(m.s).width / 2);
});

test('four convoy turrets form a targetable rear row, and dash length is sustained', () => {
  const s = new Simulation({ encounter: 'convoy' }), turrets = s.encounter.turrets;
  assert.equal(turrets.length, 4); assert.equal(new Set(turrets.map(e => e.s)).size, 1);
  assert.deepEqual(turrets.map(e => e.role), ['track', 'sweep', 'track', 'sweep']);
  assert.ok(turrets.every(e => e.s < s.encounter.locks[0].s));
  const i = new Simulation({ encounter: 'interceptors', invincible: true, encounterSupport: false }); i.start(); i.shotTimer = Infinity;
  const e = i.enemies[0]; e.phase = 'dash'; e.phaseAge = 0; e.dashStart = -7; e.dashTarget = 7;
  advance(i, 0.7); assert.equal(e.phase, 'dash');
  advance(i, 0.4); assert.equal(e.phase, 'recovery'); assert.ok(e.lateral > 6);
});

test('waiting Interceptors keep their staging distance while the player boosts from a forward offset', () => {
  const s = new Simulation({ encounter: 'interceptors', invincible: true, encounterSupport: false });
  s.start(); s.offset = 10; s.shotTimer = Infinity;
  for (let i = 0; i < 120 * 4; i++) {
    s.step(1 / 120, { boost: true, racing: true });
    for (const e of s.enemies.filter(e => e.phase === 'waiting')) assert.ok(e.s - s.s > 18);
  }
});
