import * as THREE from 'three';
import { trackAt, obstaclesNear, roadFrame, roadPoint, roadLineYaw } from './track.js';
import makePlayer from './placeholders/player.js';
import makeEnemy from './placeholders/enemy.js';
import { cameraPose } from './camera.js';

// Everything in this file is temporary graybox presentation, including track geometry.
// The simulation owns dimensions and collisions; render assets never determine hitboxes.
const GREEN = new THREE.Color('#caff64');
const ORANGE = new THREE.Color('#ffb25c');

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
    this.rushLines = this.batch(48, new THREE.MeshBasicMaterial({ color: 0xc8e8f5, transparent: true, opacity: 0, depthWrite: false }));
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.obstacles = this.batch(20, new THREE.MeshStandardMaterial({ color: 0xfab35e, roughness: 0.6 }));
    this.obstacleMarks = this.batch(20, new THREE.MeshBasicMaterial({ color: 0x2b2825 }));
    this.shots = this.batch(220, new THREE.MeshBasicMaterial({ color: 0xcaff64 }));
    this.hostileShots = this.batch(220, new THREE.MeshBasicMaterial({ color: 0xff687d }));
    this.particlesBatch = this.batch(250, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.shadows = this.batch(70, new THREE.MeshBasicMaterial({ color: 0x081015, transparent: true, opacity: 0.65 }));
    this.player = makePlayer(THREE); this.scene.add(this.player);
    this.player.rotation.order = 'YXZ';
    this.playerMarker = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.43, 40), new THREE.MeshBasicMaterial({ color: 0xcaff64, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    this.playerMarker.rotation.x = -Math.PI / 2; this.scene.add(this.playerMarker);
    this.enemyTemplate = makeEnemy(THREE);
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
  updateRoad(s) {
    const base = Math.floor((s - 55) / 2) * 2;
    if (base === this.lastRoadBase) return;
    this.lastRoadBase = base;
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
    let count = 0;
    for (const o of obstaclesNear(s, 45, 220)) {
      this.put(this.obstacles, count, o.x, 0.95, o.z, o.w, 1.9, o.d, o.yaw);
      this.put(this.obstacleMarks, count, o.x, 1.915, o.z, o.w - 0.35, 0.025, 0.4, o.yaw);
      count++;
    }
    this.finish(this.obstacles, count); this.finish(this.obstacleMarks, count);
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
    this.updateRoad(sim.s);
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
    const rush = this.reducedMotion ? 0 : Math.max(0, Math.min(1, (sim.speed - 26) / 56));
    this.rushLines.material.opacity = rush * 0.38;
    for (let i = 0; i < 48; i++) {
      // World-distance based streaks travel past the ship; never cover its aiming line.
      const ahead = ((i * 23.71 - sim.distance * 0.8) % 150 + 150) % 150 - 25;
      const side = i % 2 ? 1 : -1;
      const road = trackAt(sim.s + ahead);
      this.putRoad(this.rushLines, i, sim.s + ahead, side * (road.width / 2 + 2 + (i % 5) * 1.7), 0.5 + (i % 7) * 0.9, 0.035, 0.035, 3 + rush * 9);
    }
    this.finish(this.rushLines, rush > 0.03 ? 48 : 0);
    this.player.position.set(sim.x, 0.6 + Math.sin(sim.time * 8) * 0.06, sim.z);
    this.player.rotation.set(0, Math.PI + sim.yaw, sim.vx * 0.008, 'YXZ');
    this.player.visible = sim.invulnerability <= 0 || Math.floor(sim.time * 18) % 2 === 0;
    this.playerMarker.position.set(sim.x, 0.025, sim.z);
    this.put(this.shadows, 0, sim.x + 0.35, 0.022, sim.z - 0.2, 1.45, 0.025, 2.5, sim.yaw);
    const active = new Set(); let shadow = 1;
    for (const e of sim.enemies) {
      active.add(e.id);
      let mesh = this.enemyMeshes.get(e.id);
      if (!mesh) { mesh = this.enemyTemplate.clone(); this.enemyMeshes.set(e.id, mesh); this.scene.add(mesh); }
      mesh.position.set(e.x, 0.6, e.z);
      mesh.rotation.set(0, Math.PI + e.yaw, Math.cos(e.age * 1.6 + e.phase) * 0.08, 'YXZ');
      this.put(this.shadows, shadow++, e.x + 0.4, 0.022, e.z - 0.1, 2.65, 0.025, 3.4, e.yaw);
    }
    for (const [id, mesh] of this.enemyMeshes) if (!active.has(id)) { this.scene.remove(mesh); this.enemyMeshes.delete(id); }
    this.finish(this.shadows, shadow);
    let friendly = 0, hostile = 0;
    for (const b of sim.bullets) {
      const yaw = Math.atan2(b.vx, b.vz);
      if (b.friendly && friendly < 220) this.put(this.shots, friendly++, b.x, 1, b.z, 0.14, 0.15, 1.7, yaw);
      if (!b.friendly && hostile < 220) this.put(this.hostileShots, hostile++, b.x, 1, b.z, 0.48, 0.48, 0.7, yaw);
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
