import * as THREE from 'three';
import { trackAt, roadFrame, roadPoint, roadLineYaw, rampsNear, rampSample, rampOpensRail, RAMP_WIDTH, RAMP_LENGTH } from './track.js';
import makePlayer from './placeholders/player.js';
import makeEnemy from './placeholders/enemy.js';
import makeArmored from './placeholders/armored.js';
import { SpeedEffects } from './speed-effects.js';
import { cameraPose } from './camera.js';
import { encounterModels } from './placeholders/encounter-models.js';
import { EncounterView } from './encounter-view.js';
import { ATTACK_COLORS } from './encounters.js';
import { ForkView } from './fork-view.js';
import { forkOpensRail } from './forks.js';

const attackColors = Object.fromEntries(Object.values(ATTACK_COLORS).map(color => [color, new THREE.Color(color)]));
const attackMaterials = Object.fromEntries(Object.entries(ATTACK_COLORS).map(([key, color]) => [key, new THREE.MeshBasicMaterial({ color })]));
const dartIdleMaterials = Object.fromEntries(Object.entries(ATTACK_COLORS).map(([key, color]) => [key, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.65) })]));
const dartBrightMaterials = Object.fromEntries(Object.entries(ATTACK_COLORS).map(([key, color]) => [key, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.65) })]));
const dartSpentMaterial = new THREE.MeshBasicMaterial({ color: 0x65414b });

// Everything in this file is temporary graybox presentation, including track geometry.
// The simulation owns dimensions and collisions; render assets never determine hitboxes.
const GREEN = new THREE.Color('#caff64');
const ORANGE = new THREE.Color('#ffb25c');
const PURPLE_SHOT = new THREE.Color('#cb9aff'), PINK_SHOT = new THREE.Color('#ff687d');
const TRUCK_BODY = new THREE.Color(0xfab35e), TRUCK_CAB = new THREE.Color(0xffd986);
const CIVILIAN_BODY = new THREE.Color(0x79afb8), CIVILIAN_CAB = new THREE.Color(0xc4dde0);

export class GameView {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#10181e');
    this.scene.fog = new THREE.Fog('#10181e', 100, 245);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 350);
    this.scene.add(this.camera); this.speedEffects = new SpeedEffects(this.camera);
    this.scene.add(new THREE.HemisphereLight(0xc9e4fa, 0x384454, 2.5));
    const sun = new THREE.DirectionalLight(0xfff5de, 3.2);
    sun.position.set(-22, 50, 15); this.scene.add(sun);
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.matrix = new THREE.Matrix4();
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.cameraPosition = new THREE.Vector3(); this.cameraAim = new THREE.Vector3();
    this.tempPosition = new THREE.Vector3(); this.tempAim = new THREE.Vector3();
    this.roadSegments = 150;
    // A deformable constructor-generated plane gives renderer/collision agreement in funnels.
    this.roadGeometry = new THREE.PlaneGeometry(1, 1, 1, this.roadSegments);
    const road = new THREE.Mesh(this.roadGeometry, new THREE.MeshStandardMaterial({ color: 0x36434b, roughness: 0.95, side: THREE.DoubleSide }));
    road.frustumCulled = false; this.scene.add(road);
    this.rails = this.batch(310, new THREE.MeshStandardMaterial({ color: 0x71818a, roughness: 0.7 }));
    this.edgeLights = this.batch(310, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.ticks = this.batch(300, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
    this.posts = this.batch(60, new THREE.MeshStandardMaterial({ color: 0x778792, roughness: 0.7 }));
    this.postLights = this.batch(60, new THREE.MeshBasicMaterial({ color: 0xffb25c }));
    this.rampMeshes = new Map();
    this.rampMaterial = new THREE.MeshStandardMaterial({ color: 0x40535d, roughness: 0.95, side: THREE.DoubleSide });
    this.tunnelMaterial = new THREE.MeshStandardMaterial({ color: 0x4b5c65, roughness: 0.95 });
    this.tunnelDark = new THREE.MeshBasicMaterial({ color: 0x080e12 });
    this.tunnelLight = new THREE.MeshBasicMaterial({ color: 0xffbd68 });
    this.rampRails = this.batch(256, new THREE.MeshStandardMaterial({ color: 0x71818a, roughness: 0.7 }));
    this.rampTicks = this.batch(128, new THREE.MeshBasicMaterial({ color: 0xa985ed }));
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.obstacles = this.batch(40, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
    this.obstacleMarks = this.batch(40, new THREE.MeshBasicMaterial({ color: 0x2b2825 }));
    this.vehicleCabs = this.batch(40, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
    this.vehicleWheels = this.batch(160, new THREE.MeshStandardMaterial({ color: 0x192129 }));
    this.healthLayers = [0x101010, 0xe52e36, 0x39f267].map((color, i) => {
      const mesh = this.batch(80, new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
      mesh.geometry = new THREE.PlaneGeometry(1, 1); mesh.renderOrder = 100 + i;
      return mesh;
    });
    this.healthPoint = new THREE.Vector3(); this.healthRight = new THREE.Vector3();
    this.healthLocal = new THREE.Vector3(); this.healthRotation = new THREE.Quaternion();
    this.shots = this.batch(220, new THREE.MeshBasicMaterial({ color: 0xcaff64 }));
    this.hostileShots = this.batch(220, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.particlesBatch = this.batch(250, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.shadows = this.batch(70, new THREE.MeshBasicMaterial({ color: 0x081015, transparent: true, opacity: 0.65 }));
    this.player = makePlayer(THREE); this.scene.add(this.player);
    this.player.rotation.order = 'YXZ';
    this.playerMarker = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.43, 40), new THREE.MeshBasicMaterial({ color: 0xcaff64, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    this.playerMarker.rotation.x = -Math.PI / 2; this.scene.add(this.playerMarker);
    this.enemyTemplate = makeEnemy(THREE);
    this.armoredTemplate = makeArmored(THREE);
    this.encounterTemplates = encounterModels(THREE); this.encounterView = new EncounterView(this);
    this.forkView = new ForkView(this);
    this.enemyMeshes = new Map(); this.particles = [];
    this.lastRoadBase = null; this.cameraInitialized = false;
    this.resize();
  }
  batch(count, material) {
    const mesh = new THREE.InstancedMesh(this.box, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false; mesh.count = 0; this.scene.add(mesh); return mesh;
  }
  put(mesh, i, x, y, z, w, h, d, rotation = 0, color = null) {
    this.dummy.position.set(x, y, z); this.dummy.scale.set(w, h, d);
    this.dummy.rotation.set(0, rotation, 0); this.dummy.updateMatrix();
    mesh.setMatrixAt(i, this.dummy.matrix);
    if (color) mesh.setColorAt(i, color);
  }
  finish(mesh, count) {
    mesh.count = count; mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  putRoad(mesh, i, s, lateral, y, w, h, d, color = null, yaw = roadFrame(s).yaw) {
    const p = roadPoint(s, lateral);
    this.put(mesh, i, p.x, y, p.z, w, h, d, yaw, color);
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.cameraInitialized = false;
  }
  updateRoad(s, forks = []) {
    const base = Math.floor((s - 55) / 2) * 2;
    const key = `${base}:${forks.map(fork => fork.start).join(',')}`;
    if (key === this.lastRoadBase) return;
    this.lastRoadBase = key;
    const ramps = rampsNear(s, 55, 245);
    this.updateRamps(ramps);
    const positions = this.roadGeometry.attributes.position;
    let rails = 0, ticks = 0, posts = 0;
    for (let i = 0; i <= this.roadSegments; i++) {
      const at = base + i * 2, t = trackAt(at);
      const left = roadPoint(at, -t.width / 2), right = roadPoint(at, t.width / 2);
      positions.setXYZ(i * 2, left.x, 0, left.z);
      positions.setXYZ(i * 2 + 1, right.x, 0, right.z);
      if (i === this.roadSegments) continue;
      const next = trackAt(at + 2);
      const color = this.color.copy(GREEN).lerp(ORANGE, t.tight);
      for (const sign of [-1, 1]) {
        if (ramps.some(r => rampOpensRail(r, at + 1, sign)) || forks.some(fork => forkOpensRail(fork, at + 1, sign))) continue;
        const a = roadPoint(at, sign * (t.width / 2 + 0.32));
        const b = roadPoint(at + 2, sign * (next.width / 2 + 0.32));
        const rotation = Math.atan2(a.x - b.x, a.z - b.z);
        const depth = Math.hypot(b.z - a.z, b.x - a.x) + 0.05;
        this.put(this.rails, rails, (a.x + b.x) / 2, 0.6, (a.z + b.z) / 2, 0.62, 1.2, depth, rotation);
        this.put(this.edgeLights, rails, (a.x + b.x) / 2, 1.22, (a.z + b.z) / 2, 0.17, 0.06, depth, rotation, color);
        rails++;
      }
      if (Math.round(at) % 6 === 0) {
        for (const sign of [-1, 1]) this.putRoad(this.ticks, ticks++, at, sign * (t.width / 2 - 1.5), 0.015, 0.24, 0.02, 3.2, color, roadLineYaw(at, sign / 2, -sign * 1.5));
        for (const fraction of [-0.25, 0, 0.25]) this.putRoad(this.ticks, ticks++, at, fraction * t.width, 0.012, 0.12, 0.02, 2.4, new THREE.Color(0xa6bbc5), roadLineYaw(at, fraction));
      }
      if (Math.round(at) % 12 === 0) {
        for (const sign of [-1, 1]) {
          if (ramps.some(r => rampOpensRail(r, at, sign)) || forks.some(fork => forkOpensRail(fork, at, sign))) continue;
          const lateral = sign * (t.width / 2 + 1.1), p = roadPoint(at, lateral), f = roadFrame(at);
          this.putRoad(this.posts, posts, at, lateral, 2, 0.5, 4, 0.6);
          this.put(this.postLights, posts++, p.x - f.fx * 0.32, 3.2, p.z - f.fz * 0.32, 0.4, 1.2, 0.06, f.yaw);
        }
      }
      if (Math.round(at) % 48 === 0) this.putRoad(this.ticks, ticks++, at, 0, 0.012, t.width - 1, 0.02, 0.05, new THREE.Color(0x687c86));
    }
    positions.needsUpdate = true; this.roadGeometry.computeVertexNormals();
    this.finish(this.rails, rails); this.finish(this.edgeLights, rails); this.finish(this.ticks, ticks);
    this.finish(this.posts, posts); this.finish(this.postLights, posts);
  }
  updateVehicles(sim) {
    let count = 0, wheels = 0;
    for (const o of sim.vehicles) {
      if (o.s < sim.s - 45 || o.s > sim.s + 220) continue;
      const f = { fx: -Math.sin(o.yaw), fz: -Math.cos(o.yaw), rx: Math.cos(o.yaw), rz: -Math.sin(o.yaw) };
      const frontX = o.x + f.fx * o.d * 0.27, frontZ = o.z + f.fz * o.d * 0.27;
      const height = o.civilian ? 0.6 : 1;
      this.put(this.obstacles, count, o.x, 0.95 * height, o.z, o.w, 1.9 * height, o.d, o.yaw, o.civilian ? CIVILIAN_BODY : TRUCK_BODY);
      this.put(this.vehicleCabs, count, frontX, 1.93 * height, frontZ, o.w * 0.82, 0.65 * height, o.d * 0.32, o.yaw, o.civilian ? CIVILIAN_CAB : TRUCK_CAB);
      this.put(this.obstacleMarks, count, frontX, 2.27 * height, frontZ, o.w * 0.7, 0.025, 0.55, o.yaw);
      for (const side of [-1, 1]) for (const end of [-1, 1]) {
        this.put(this.vehicleWheels, wheels++, o.x + f.rx * side * (o.halfWidth - 0.05) + f.fx * end * o.d * 0.3,
          0.45 * height, o.z + f.rz * side * (o.halfWidth - 0.05) + f.fz * end * o.d * 0.3, 0.3, 0.85 * height, 0.9 * height, o.yaw);
      }
      count++;
    }
    this.finish(this.obstacles, count); this.finish(this.obstacleMarks, count);
    this.finish(this.vehicleCabs, count); this.finish(this.vehicleWheels, wheels);
  }
  updateHealthBars(sim) {
    let count = 0;
    const [outline, background, fill] = this.healthLayers;
    this.healthRotation.copy(this.camera.quaternion).invert();
    this.healthRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const pixelScale = 2 * Math.tan(this.camera.fov * Math.PI / 360) / window.innerHeight;
    for (const e of [...sim.enemies, ...sim.vehicles]) {
      if (!e.active || e.hideHealth || e.hp <= 0 || e.s < sim.s - 35 || e.s > sim.s + 140 || count >= 80) continue;
      this.healthPoint.set(e.x, e.civilian ? 2 : e.neutral ? 3.2 : 2.7, e.z);
      this.healthLocal.copy(this.healthPoint).sub(this.camera.position).applyQuaternion(this.healthRotation);
      const depth = -this.healthLocal.z;
      if (depth <= 0) continue;
      // Camera-facing bars stay readable in both top-down and chase views.
      // Sizes are in CSS pixels so the minimum height survives distance and DPR.
      const pixel = depth * pixelScale;
      const width = Math.max(20 * pixel, Math.min(52 * pixel, e.neutral ? 3.4 : 1.9));
      const height = 7 * pixel;
      const ratio = THREE.MathUtils.clamp(e.hp / e.maxHp, 0, 1);
      const putBar = (mesh, w, h, offset = 0) => {
        this.dummy.position.copy(this.healthPoint).addScaledVector(this.healthRight, offset);
        this.dummy.quaternion.copy(this.camera.quaternion); this.dummy.scale.set(w, h, 1);
        this.dummy.updateMatrix(); mesh.setMatrixAt(count, this.dummy.matrix);
      };
      putBar(outline, width + 2 * pixel, height + 2 * pixel);
      putBar(background, width, height);
      // Leave a red rim at full health; depleted health exposes the red track.
      const inner = width - 2 * pixel;
      putBar(fill, inner * ratio, height - 2 * pixel, -inner * (1 - ratio) / 2);
      count++;
    }
    for (const mesh of this.healthLayers) this.finish(mesh, count);
  }
  updateRamps(ramps) {
    const active = new Set(); let rails = 0, ticks = 0;
    for (const ramp of ramps) {
      active.add(ramp.key);
      if (!this.rampMeshes.has(ramp.key)) {
        const geometry = new THREE.PlaneGeometry(1, 1, 1, 32);
        const positions = geometry.attributes.position;
        for (let i = 0; i <= 32; i++) {
          const s = ramp.start + i * RAMP_LENGTH / 32, sample = rampSample(ramp, s);
          for (const [j, side] of [-1, 1].entries()) {
            const p = roadPoint(s, sample.lateral + side * RAMP_WIDTH / 2);
            // Keep the ramp and its markings beneath the highway at the merge.
            positions.setXYZ(i * 2 + j, p.x, -0.08, p.z);
          }
        }
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, this.rampMaterial);
        mesh.add(this.makeTunnelExit(ramp));
        mesh.frustumCulled = false; this.scene.add(mesh); this.rampMeshes.set(ramp.key, mesh);
      }
      for (let i = 0; i < 32; i++) {
        const s = ramp.start + i * RAMP_LENGTH / 32, next = s + RAMP_LENGTH / 32;
        const a = rampSample(ramp, s), b = rampSample(ramp, next);
        for (const side of [-1, 1]) {
          if (side !== ramp.side && rampOpensRail(ramp, (s + next) / 2, ramp.side)) continue;
          const p = roadPoint(s, a.lateral + side * (RAMP_WIDTH / 2 + 0.32));
          const q = roadPoint(next, b.lateral + side * (RAMP_WIDTH / 2 + 0.32));
          this.put(this.rampRails, rails++, (p.x + q.x) / 2, 0.6, (p.z + q.z) / 2, 0.62, 1.2, Math.hypot(p.x - q.x, p.z - q.z) + 0.05, Math.atan2(p.x - q.x, p.z - q.z));
        }
        if (i % 2 === 0 && i > 0) this.put(this.rampTicks, ticks++, a.x, -0.055, a.z, 0.18, 0.025, 2.2, Math.atan2(a.x - b.x, a.z - b.z));
      }
    }
    for (const [key, mesh] of this.rampMeshes) if (!active.has(key)) {
      this.scene.remove(mesh); mesh.geometry.dispose(); this.rampMeshes.delete(key);
    }
    this.finish(this.rampRails, rails); this.finish(this.rampTicks, ticks);
  }
  makeTunnelExit(ramp) {
    const mouth = rampSample(ramp, ramp.start), next = rampSample(ramp, ramp.start + 0.5);
    const tunnel = new THREE.Group();
    tunnel.position.set(mouth.x, -0.08, mouth.z);
    tunnel.rotation.y = Math.atan2(mouth.x - next.x, mouth.z - next.z);
    const part = (material, x, y, z, w, h, d) => {
      const mesh = new THREE.Mesh(this.box, material);
      mesh.position.set(x, y, z); mesh.scale.set(w, h, d); tunnel.add(mesh);
    };
    // The covered approach sits behind the ramp start; its open mouth faces traffic flow.
    part(this.rampMaterial, 0, -0.15, 7, 8, 0.3, 14);
    part(this.tunnelDark, 0, 3, 13.8, 6, 6, 0.2);
    for (const side of [-1, 1]) {
      part(this.tunnelMaterial, side * 3.6, 3, 7, 1.2, 6, 14);
      part(this.tunnelMaterial, side * 3.75, 3.2, 0, 1.5, 6.4, 1.5);
      part(this.tunnelLight, side * 3.1, 3.2, -0.78, 0.16, 4.6, 0.08);
    }
    part(this.tunnelMaterial, 0, 6.2, 7, 8.7, 1.2, 14);
    part(this.tunnelMaterial, 0, 6.1, 0, 9, 1.4, 1.5);
    part(this.tunnelLight, 0, 5.55, -0.78, 5.8, 0.15, 0.08);
    return tunnel;
  }
  event(event) {
    if (event.kind === 'lap') return;
    const count = event.kind === 'spark' ? 3 : 16;
    for (let i = 0; i < count; i++) this.particles.push({
      x: event.x, z: event.z, y: 1.1,
      vx: (Math.random() - 0.5) * 13, vz: (Math.random() - 0.5) * 16,
      vy: 2 + Math.random() * 5, life: 0.3 + Math.random() * 0.45,
      color: new THREE.Color(event.kind === 'hit' ? 0xffb25c : 0xff7182),
    });
    this.particles = this.particles.slice(-250);
  }
  reset() {
    this.cameraInitialized = false; this.particles.length = 0; this.lastRoadBase = null;
    for (const mesh of this.enemyMeshes.values()) this.scene.remove(mesh);
    this.enemyMeshes.clear();
  }
  render(sim, dt, settings) {
    this.updateRoad(sim.s, sim.level?.forks || []);
    this.forkView.update(sim);
    this.updateVehicles(sim);
    const pose = cameraPose(sim, this.camera.aspect, settings.cameraShift);
    this.tempPosition.fromArray(pose.position); this.tempAim.fromArray(pose.target);
    const follow = this.cameraInitialized ? 1 - Math.exp(-5 * dt) : 1;
    this.cameraPosition.lerp(this.tempPosition, follow); this.cameraAim.lerp(this.tempAim, follow);
    // Follow the road in both horizontal axes; world-X lag would skew curved framing.
    this.cameraPosition.x = this.tempPosition.x; this.cameraAim.x = this.tempAim.x;
    this.cameraPosition.z = this.tempPosition.z; this.cameraAim.z = this.tempAim.z;
    this.camera.position.copy(this.cameraPosition); this.camera.lookAt(this.cameraAim);
    if (Math.abs(this.camera.fov - pose.fov) > 0.01) { this.camera.fov = pose.fov; this.camera.updateProjectionMatrix(); }
    if (!this.reducedMotion) this.camera.rotateZ(-sim.vx * sim.raceBlend * 0.0012);
    this.cameraInitialized = true;
    this.speedEffects.update(sim, settings, this.reducedMotion);
    this.player.position.set(sim.x, 0.6 + Math.sin(sim.time * 8) * 0.06, sim.z);
    this.player.rotation.set(0, Math.PI + sim.yaw, sim.vx * 0.008, 'YXZ');
    this.player.visible = sim.invulnerability <= 0 || Math.floor(sim.time * 18) % 2 === 0;
    this.playerMarker.position.set(sim.x, 0.025, sim.z);
    this.put(this.shadows, 0, sim.x + 0.35, 0.022, sim.z - 0.2, 1.45, 0.025, 2.5, sim.yaw);
    const active = new Set(); let shadow = 1;
    for (const e of sim.enemies) {
      if (!e.active) continue;
      active.add(e.id);
      let mesh = this.enemyMeshes.get(e.id);
      if (!mesh) {
        mesh = (this.encounterTemplates[e.kind === 'dart' ? `dart-${e.role}` : e.kind] || (e.armored ? this.armoredTemplate : this.enemyTemplate)).clone();
        if (e.role) for (const name of ['signal', 'role']) {
          const part = mesh.getObjectByName(name); if (part) part.material = attackMaterials[e.role];
        }
        this.enemyMeshes.set(e.id, mesh); this.scene.add(mesh);
      }
      mesh.position.set(e.x, 0.6, e.z);
      mesh.rotation.set(0, Math.PI + e.yaw, e.armored || e.encounter ? 0 : Math.cos(e.age * 1.6 + e.slot) * 0.08, 'YXZ');
      const signal = mesh.getObjectByName('signal');
      if (signal) signal.visible = e.kind === 'dart' ? (e.charge || 0) > 0 : e.formationWarning || (e.charge || 0) > 0;
      if (e.kind === 'dart') {
        const attacking = sim.encounter?.dartAttack?.enemy === e;
        const flash = (e.dartFlashUntil || 0) > (sim.encounter?.age || 0);
        mesh.getObjectByName('muzzle-flash').visible = flash;
        const glyphs = mesh.getObjectByName('glyphs');
        for (let i = 0; i < glyphs.children.length; i++) {
          const spent = e.role === 'direct' && i < (e.dartShots || 0);
          glyphs.children[i].material = spent ? dartSpentMaterial : attacking || flash ? dartBrightMaterials[e.role] : dartIdleMaterials[e.role];
        }
      }
      if (e.kind === 'interceptor') mesh.getObjectByName('engine').visible = e.phase === 'recovery' && !e.contact;
      if (e.kind === 'hauler') for (let i = 0; i < 3; i++) mesh.getObjectByName(`open-${i}`).visible = sim.encounter.locks[i].hp <= 0;
      if (e.kind === 'hauler') for (const side of ['left', 'right']) {
        const direction = sim.encounter.laneTarget > sim.encounter.convoyLane ? 'right' : 'left';
        mesh.getObjectByName(`indicator-${side}`).visible = sim.encounter.laneWarning && side === direction && Math.floor(sim.time * 10) % 2 === 0;
      }
      if (e.kind === 'turret' && e.aimTarget) mesh.getObjectByName('aim').rotation.y = Math.atan2(e.aimTarget.x - e.x, e.aimTarget.z - e.z) - e.yaw;
      if (e.armored) {
        mesh.getObjectByName('shield').scale.x = e.halfWidth * 2;
        const charge = mesh.getObjectByName('charge');
        charge.visible = (e.charge || 0) > 0;
        charge.scale.setScalar(0.4 + (e.charge || 0) * 0.9);
      }
      this.put(this.shadows, shadow++, e.x + 0.4, 0.022, e.z - 0.1, e.halfWidth * 2 + 0.2, 0.025, e.halfDepth * 2 + 0.2, e.yaw);
    }
    for (const [id, mesh] of this.enemyMeshes) if (!active.has(id)) { this.scene.remove(mesh); this.enemyMeshes.delete(id); }
    this.finish(this.shadows, shadow);
    this.updateHealthBars(sim);
    this.encounterView.update(sim);
    let friendly = 0, hostile = 0;
    for (const b of sim.bullets) {
      const yaw = Math.atan2(b.vx, b.vz);
      if (b.friendly && friendly < 220) this.put(this.shots, friendly++, b.x, 1, b.z, 0.14, 0.15, 1.7, yaw);
      if (!b.friendly && hostile < 220) this.put(this.hostileShots, hostile++, b.x, 1, b.z, 0.48, 0.48, 0.7, yaw, attackColors[b.color] || (b.pattern === 'shield' ? PURPLE_SHOT : PINK_SHOT));
    }
    this.finish(this.shots, friendly); this.finish(this.hostileShots, hostile);
    let particles = 0;
    for (const p of this.particles) {
      if (sim.status === 'playing') {
        p.life -= dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt; p.vy -= 16 * dt;
      }
      const size = Math.max(0.03, p.life * 0.35);
      this.put(this.particlesBatch, particles++, p.x, Math.max(0.03, p.y), p.z, size, size, size, 0, p.color);
    }
    this.particles = this.particles.filter(p => p.life > 0);
    this.finish(this.particlesBatch, particles);
    this.renderer.render(this.scene, this.camera);
  }
}
