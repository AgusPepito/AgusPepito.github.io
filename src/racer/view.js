import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SpeedEffects, EFFECT_DEFAULTS } from '../speed-effects.js';
import { PassageGuide } from './guidance.js';
import { OBSTACLES, solidSpans, openingSpans, WALL_HEIGHT, HOLE_HEIGHT } from './obstacles.js';
import { LENGTH, PHASES, STRIPS, GATES, section, frame, point, stripCenter, clamp } from './track.js';
import { GAPS, JUMP, gapAt, surfaceSlices } from './jumps.js';
import { constructionReview, constructionBaseline } from './levels.js';
import { foundationChunk } from './construction.js';

// Temporary procedural prototype geometry, pending the jam's final recipe art pass.
function surface(s, u, height = 0) {
  if (!height) return point(s, u);
  const f = frame(s, u); return f.p.addScaledVector(f.normal, height);
}
function ribbonPatch(start, end, left, right, height, across = 1) {
  const along = Math.max(1, Math.ceil((end - start) / 9));
  const vertices = [], indices = [];
  for (let i = 0; i <= along; i++) {
    const s = start + (end - start) * i / along;
    for (let j = 0; j <= across; j++) {
      const u = left(s) + (right(s) - left(s)) * j / across;
      const p = surface(s, u, height); vertices.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < along; i++) for (let j = 0; j < across; j++) {
    const a = i * (across + 1) + j, b = a + across + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}
function ribbon(start, end, left, right, height, across = 1, cutGaps = true) {
  if (!cutGaps) return ribbonPatch(start, end, left, right, height, across);
  const pieces = [];
  for (const slice of surfaceSlices(start, end)) for (const [low, high] of slice.spans) {
    if (Math.max(right(slice.start), right(slice.end)) <= low || Math.min(left(slice.start), left(slice.end)) >= high) continue;
    pieces.push(ribbonPatch(slice.start, slice.end, s => clamp(left(s), low, high), s => clamp(right(s), low, high), height, across));
  }
  if (!pieces.length) {
    const empty = new THREE.BufferGeometry(); empty.setAttribute('position', new THREE.Float32BufferAttribute([], 3)); return empty;
  }
  if (pieces.length === 1) return pieces[0];
  const result = mergeGeometries(pieces); pieces.forEach(piece => piece.dispose()); return result;
}
function barrier(gate, bottom, top) {
  const vertices = [], indices = [], count = Math.max(8, Math.ceil(gate.width * 96));
  for (let i = 0; i <= count; i++) {
    const u = gate.center - gate.width + 2 * gate.width * i / count;
    for (const h of [bottom, top]) { const p = surface(gate.s, u, h); vertices.push(p.x, p.y, p.z); }
  }
  for (let i = 0; i < count; i++) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}
const basis = f => new THREE.Matrix4().makeBasis(f.right, f.normal, f.forward.clone().negate());

function wallVolume(obstacle, left, right, bottom, top) {
  const vertices = [], indices = [], count = Math.max(1, Math.ceil((right - left) * 64));
  for (let i = 0; i < count; i++) {
    const a = left + (right - left) * i / count, b = left + (right - left) * (i + 1) / count;
    const base = vertices.length / 3;
    for (const s of [obstacle.s, obstacle.s + obstacle.depth])
      for (const u of [a, b]) for (const h of [bottom, top]) {
        const p = surface(s, u, h); vertices.push(p.x, p.y, p.z);
      }
    for (const face of [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [1, 3, 7, 5], [0, 4, 6, 2]]) {
      const [a, b, c, d] = face.map(n => n + base); indices.push(a, b, c, a, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

export class RaceView {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x080e19);
    this.scene.fog = new THREE.Fog(0x080e19, 210, 710);
    this.camera = new THREE.PerspectiveCamera(77, 1, 0.15, 850);
    this.scene.add(this.camera);
    this.speedEffects = new SpeedEffects(this.camera);
    this.cameraBase = new THREE.Quaternion();
    this.scene.add(new THREE.HemisphereLight(0xb5d8ff, 0x465578, 2.4));
    const sun = new THREE.DirectionalLight(0xd6eeff, 2.4); sun.position.set(120, 180, 40); this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x6a9bdf, 1.5); fill.position.set(-70, -100, -60); this.scene.add(fill);
    this.chunks = []; this.gates = []; this.energyGroups = []; this.walls = []; this.gapMarkers = [];
    this.gapFills = new THREE.Group(); this.scene.add(this.gapFills);
    const asphalt = new THREE.MeshStandardMaterial({ color: 0x263649, roughness: 0.8, side: THREE.DoubleSide });
    const lane = new THREE.MeshBasicMaterial({ color: 0x678298, side: THREE.DoubleSide });
    const edge = new THREE.MeshBasicMaterial({ color: 0xc1d7e6, side: THREE.DoubleSide });
    const energy = PHASES.map(p => new THREE.MeshBasicMaterial({ color: p.hex, side: THREE.DoubleSide }));
    for (let start = -50; start < LENGTH + 200; start += 100) {
      const end = start + 100, group = new THREE.Group();
      if (constructionReview && !constructionBaseline) {
        group.add(foundationChunk(start));
        this.chunks.push({ start, group }); this.scene.add(group); continue;
      }
      group.add(new THREE.Mesh(ribbon(start, end, () => -1, () => 1, 0, 64), asphalt));
      for (let j = -3; j <= 3; j++) {
        const u = j / 3;
        group.add(new THREE.Mesh(ribbon(start, end, s => u - 0.045 / section(s).halfWidth,
          s => u + 0.045 / section(s).halfWidth, 0.045), Math.abs(j) === 3 ? edge : lane));
      }
      for (let at = Math.ceil(start / 40) * 40; at < end; at += 40) {
        group.add(new THREE.Mesh(ribbon(at, at + 0.18, () => -1, () => 1, 0.025, 64), lane));
      }
      for (const strip of STRIPS) {
        const a = Math.max(start, strip.start), b = Math.min(end, strip.end);
        if (a >= b) continue;
        const energyGroup = new THREE.Group(); group.add(energyGroup); this.energyGroups.push(energyGroup);
        energyGroup.add(new THREE.Mesh(ribbon(a, b, s => stripCenter(strip, s) - strip.width,
          s => stripCenter(strip, s) + strip.width, 0.09, 12), energy[strip.phase]));
        // Repeated phase badges and short transverse cuts communicate flow along the strip.
        for (let at = Math.ceil(a / 70) * 70; at < b; at += 70) {
          if (gapAt(at, stripCenter(strip, at))) continue;
          const f = frame(at, stripCenter(strip, at));
          const badge = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5), this.badgeMaterial(strip.phase));
          badge.position.copy(f.p).addScaledVector(f.normal, 0.12);
          badge.quaternion.setFromRotationMatrix(basis(f)); badge.rotateX(-Math.PI / 2); energyGroup.add(badge);
        }
      }
      this.chunks.push({ start, group }); this.scene.add(group);
    }
    const gapEdge = new THREE.MeshBasicMaterial({ color: 0xffdf88, side: THREE.DoubleSide, fog: false });
    for (const gap of GAPS) {
      const group = new THREE.Group(), left = gap.full ? -1 : gap.center - gap.width, right = gap.full ? 1 : gap.center + gap.width;
      // Driving-only mode fills the missing pavement back in.
      const fill = new THREE.Mesh(ribbon(gap.start, gap.end, () => left, () => right, 0, 64, false), asphalt);
      this.gapFills.add(fill);
      for (const s of [gap.start - 0.8, gap.end])
        group.add(new THREE.Mesh(ribbon(s, s + 0.8, () => left, () => right, 0.04, 64, false), gapEdge));
      if (!gap.full) for (const u of [left, right])
        group.add(new THREE.Mesh(ribbon(gap.start, gap.end, s => u - 0.07 / section(s).halfWidth,
          s => u + 0.07 / section(s).halfWidth, 0.04, 1, false), gapEdge));
      this.scene.add(group); this.gapMarkers.push({ gap, group });
    }
    for (const gate of GATES) {
      const group = new THREE.Group(), color = PHASES[gate.phase].hex;
      group.add(new THREE.Mesh(barrier(gate, 0.1, 7), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.26, depthWrite: false })));
      const rim = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      group.add(new THREE.Mesh(barrier(gate, 0.1, 0.3), rim));
      group.add(new THREE.Mesh(barrier(gate, 6.8, 7), rim));
      const count = gate.full ? 6 : 2;
      for (let i = 0; i < count; i++) {
        const u = gate.center - gate.width + gate.width * 2 * (i + 0.5) / count;
        const f = frame(gate.s, u), post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 7, 0.2), rim);
        post.position.copy(f.p).addScaledVector(f.normal, 3.5); post.quaternion.setFromRotationMatrix(basis(f)); group.add(post);
        const badge = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8), this.badgeMaterial(gate.phase));
        badge.position.copy(f.p).addScaledVector(f.normal, 4.3).addScaledVector(f.forward, -0.12);
        badge.quaternion.setFromRotationMatrix(basis(f)); group.add(badge);
      }
      this.scene.add(group); this.gates.push({ gate, group });
    }
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x943e35, roughness: 0.8, side: THREE.DoubleSide });
    const warningMaterial = new THREE.MeshBasicMaterial({ color: 0xff7662, side: THREE.DoubleSide });
    const openingMaterial = new THREE.MeshBasicMaterial({ color: 0xf1fff4, side: THREE.DoubleSide });
    for (const obstacle of OBSTACLES) {
      const group = new THREE.Group(), height = obstacle.height ?? WALL_HEIGHT;
      const trim = height < 5 ? gapEdge : warningMaterial;
      for (const [a, b] of solidSpans(obstacle)) {
        group.add(new THREE.Mesh(wallVolume(obstacle, a, b, 0, height), wallMaterial));
        const front = { s: obstacle.s - 0.05, center: (a + b) / 2, width: (b - a) / 2 };
        for (const h of [0.3, height * 0.5, height - 0.25]) group.add(new THREE.Mesh(barrier(front, h, h + 0.16), trim));
      }
      if (obstacle.kind === 'hole') for (const [a, b] of openingSpans(obstacle)) {
        group.add(new THREE.Mesh(wallVolume(obstacle, a, b, HOLE_HEIGHT, height), wallMaterial));
        const front = { s: obstacle.s - 0.07, center: (a + b) / 2, width: (b - a) / 2 };
        group.add(new THREE.Mesh(barrier(front, HOLE_HEIGHT, HOLE_HEIGHT + 0.2), openingMaterial));
        for (const u of [a, b]) {
          const rimWidth = 0.09 / section(obstacle.s).halfWidth;
          group.add(new THREE.Mesh(barrier({ s: front.s, center: u, width: rimWidth }, 0.05, HOLE_HEIGHT), openingMaterial));
        }
        // White approach lines lead into the physical opening; they never grant a phase bonus.
        for (const u of [a + 0.025, b - 0.025]) group.add(new THREE.Mesh(ribbon(obstacle.s - 220, obstacle.s,
          s => u - 0.055 / section(s).halfWidth, s => u + 0.055 / section(s).halfWidth, 0.15), openingMaterial));
      }
      this.scene.add(group); this.walls.push({ obstacle, group });
    }
    // Sparse distance beacons provide peripheral parallax without adding collision clutter.
    const beaconGeometry = new THREE.BoxGeometry(0.4, 6, 0.4);
    const beaconMaterial = new THREE.MeshBasicMaterial({ color: 0x53778d });
    for (let s = 0; s <= LENGTH; s += 100) {
      if (constructionReview) break;
      if (section(s).closed) continue;
      const chunk = this.chunks.find(c => s >= c.start && s < c.start + 100);
      for (const side of [-1, 1]) {
        if (gapAt(s, side)) continue;
        const f = frame(s, side), mesh = new THREE.Mesh(beaconGeometry, beaconMaterial);
        mesh.position.copy(f.p).addScaledVector(f.normal, 3); mesh.quaternion.setFromRotationMatrix(basis(f)); chunk?.group.add(mesh);
      }
    }
    this.ship = new THREE.Group();
    this.hullMaterial = new THREE.MeshStandardMaterial({ color: 0xe9f2fa, metalness: 0.5, roughness: 0.3 });
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.9, 4), this.hullMaterial); hull.rotation.x = -Math.PI / 2; this.ship.add(hull);
    const wings = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.16, 1.5), this.hullMaterial); wings.position.z = 0.6; this.ship.add(wings);
    this.phaseMaterial = new THREE.MeshBasicMaterial({ color: PHASES[0].hex });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 1.6), this.phaseMaterial); canopy.position.y = 0.35; this.ship.add(canopy);
    this.exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.34, 3, 8), this.phaseMaterial); this.exhaust.rotation.x = Math.PI / 2; this.exhaust.position.z = 2.5; this.ship.add(this.exhaust);
    this.scene.add(this.ship);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: 0x050912,
      transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
    this.scene.add(this.shadow);
    this.finish = new THREE.Group();
    const finishFrame = frame(LENGTH, 0);
    const finishMat = new THREE.MeshBasicMaterial({ color: 0xe9f4ff });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(36, 0.5, 0.5), finishMat);
    bar.position.copy(finishFrame.p).addScaledVector(finishFrame.normal, 9); bar.quaternion.setFromRotationMatrix(basis(finishFrame)); this.finish.add(bar);
    for (const u of [-1, 1]) {
      const f = frame(LENGTH, u), post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), finishMat);
      post.position.copy(f.p).addScaledVector(f.normal, 4.5); post.quaternion.setFromRotationMatrix(basis(f)); this.finish.add(post);
    }
    this.scene.add(this.finish);
    this.passageGuide = new PassageGuide(this.scene);
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize(); this.snap = true;
  }
  badgeMaterial(phase) {
    this.badges ??= [];
    if (!this.badges[phase]) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#0b1726'; ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = PHASES[phase].color; ctx.lineWidth = 5; ctx.strokeRect(3, 3, 122, 122);
      ctx.fillStyle = PHASES[phase].color; ctx.beginPath();
      if (phase === 0) ctx.arc(64, 64, 27, 0, Math.PI * 2);
      else if (phase === 1) { ctx.moveTo(64, 30); ctx.lineTo(97, 92); ctx.lineTo(31, 92); }
      else { ctx.moveTo(64, 27); ctx.lineTo(100, 64); ctx.lineTo(64, 101); ctx.lineTo(28, 64); }
      ctx.closePath(); ctx.fill();
      const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
      this.badges[phase] = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide });
    }
    return this.badges[phase];
  }
  dispose() {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of object.material ? Array.isArray(object.material) ? object.material : [object.material] : []) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    this.renderer.dispose();
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false); this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
  render(race, dt) {
    const landingDip = this.reduced ? 0 : Math.sin(Math.PI * race.landing / 0.18) * 0.14;
    const f = frame(race.s, race.u), lift = JUMP.hover + race.height - landingDip + (this.reduced || race.airborne ? 0 : Math.sin(race.time * 7) * 0.055);
    this.ship.position.copy(f.p).addScaledVector(f.normal, lift);
    this.ship.quaternion.setFromRotationMatrix(basis(f));
    this.ship.rotateZ(clamp(-race.lateralSpeed * 0.012, -0.32, 0.32));
    this.ship.rotateX(clamp(race.verticalSpeed * 0.012, -0.16, 0.16));
    this.shadow.visible = race.mode === 'drive' || !gapAt(race.s, race.u);
    this.shadow.position.copy(f.p).addScaledVector(f.normal, 0.025);
    this.shadow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), f.normal);
    this.shadow.material.opacity = 0.5 / (1 + Math.max(0, race.height) * 0.15);
    this.phaseMaterial.color.setHex(PHASES[race.phase].hex);
    this.exhaust.scale.set(1 + race.thrustBlend * 0.45, (race.stripBoost ? 1.9 : 0.7) + race.thrustBlend * 2.4, 1);
    const portrait = this.camera.aspect < 0.85;
    const boostPull = this.reduced ? 0 : race.thrustBlend * 2.2;
    this.camera.position.copy(f.p).addScaledVector(f.forward, (portrait ? -16 : -12) - boostPull).addScaledVector(f.normal, (portrait ? 6.5 : 5.2) + Math.max(0, race.height) * 0.45);
    const target = point(race.s + 35, race.u).addScaledVector(f.normal, 1.6 + Math.max(0, race.height) * 0.35);
    const desired = new THREE.Matrix4().lookAt(this.camera.position, target, f.normal);
    const q = new THREE.Quaternion().setFromRotationMatrix(desired);
    // Smooth the unshaken pose separately, then apply the original game's local-camera effects.
    // This keeps vibration from accumulating and makes it rotate correctly inside/outside tubes.
    if (this.snap) { this.cameraBase.copy(q); this.snap = false; }
    else this.cameraBase.slerp(q, 1 - Math.exp(-12 * dt));
    this.camera.quaternion.copy(this.cameraBase);
    const fov = this.reduced ? 80 : 78 + clamp((race.speed - 95) / 190, 0, 1) * 16 + race.thrustBlend * 8;
    if (Math.abs(this.camera.fov - fov) > 0.05) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    for (const chunk of this.chunks) chunk.group.visible = chunk.start > race.s - 180 && chunk.start < race.s + 760;
    for (const group of this.energyGroups) group.visible = race.mode === 'phase';
    for (const { gate, group } of this.gates) group.visible = race.mode === 'phase' && gate.s > race.s - 30 && gate.s < race.s + 730;
    for (const { obstacle, group } of this.walls) group.visible = race.mode === 'phase' && obstacle.s > race.s - 40 && obstacle.s < race.s + 730;
    this.gapFills.visible = race.mode === 'drive';
    for (const { gap, group } of this.gapMarkers) group.visible = race.mode === 'phase' && gap.end > race.s - 50 && gap.start < race.s + 730;
    this.finish.visible = !constructionReview && race.s > LENGTH - 750;
    this.passageGuide.update(race, this.reduced);
    this.speedEffects.update({ speed: race.speed, time: race.time, distance: race.s,
      boostBlend: race.boostBlend, status: race.state }, {
      shake: EFFECT_DEFAULTS.shake + race.thrustBlend * 0.34,
      wind: EFFECT_DEFAULTS.wind + race.thrustBlend * 0.35,
    }, this.reduced);
    this.renderer.render(this.scene, this.camera);
  }
}

