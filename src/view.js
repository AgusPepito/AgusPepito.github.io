import * as THREE from 'three';
import { trackAt, obstaclesNear } from './track.js';
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
    this.obstacles = this.batch(20, new THREE.MeshStandardMaterial({ color: 0xfab35e, roughness: 0.6 }));
    this.obstacleMarks = this.batch(20, new THREE.MeshBasicMaterial({ color: 0x2b2825 }));
    this.shots = this.batch(220, new THREE.MeshBasicMaterial({ color: 0xcaff64 }));
    this.hostileShots = this.batch(220, new THREE.MeshBasicMaterial({ color: 0xff687d }));
    this.particlesBatch = this.batch(250, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.shadows = this.batch(70, new THREE.MeshBasicMaterial({ color: 0x081015, transparent: true, opacity: 0.65 }));
    this.player = makePlayer(THREE); this.scene.add(this.player);
    this.player.rotation.y = Math.PI;
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
    let rails = 0, ticks = 0;
    for (let i = 0; i <= this.roadSegments; i++) {
      const at = base + i * 2, t = trackAt(at);
      positions.setXYZ(i * 2, t.center - t.width / 2, 0, -at);
      positions.setXYZ(i * 2 + 1, t.center + t.width / 2, 0, -at);
      if (i === this.roadSegments) continue;
      const next = trackAt(at + 2);
      const color = this.color.copy(GREEN).lerp(ORANGE, t.tight);
      for (const sign of [-1, 1]) {
        const x0 = t.center + sign * (t.width / 2 + 0.32);
        const x1 = next.center + sign * (next.width / 2 + 0.32);
        const rotation = -Math.atan2(x1 - x0, 2);
        const depth = Math.hypot(2, x1 - x0) + 0.05;
        this.put(this.rails, rails, (x0 + x1) / 2, 0.6, -at - 1, 0.62, 1.2, depth, rotation);
        this.put(this.edgeLights, rails, (x0 + x1) / 2, 1.22, -at - 1, 0.17, 0.06, depth, rotation, color);
        rails++;
      }
      if (Math.round(at) % 12 === 0) {
        for (const sign of [-1, 1]) this.put(this.ticks, ticks++, t.center + sign * (t.width / 2 - 1.5), 0.015, -at, 0.13, 0.02, 2.5, 0, color);
        for (const fraction of [-0.25, 0, 0.25]) this.put(this.ticks, ticks++, t.center + fraction * t.width, 0.012, -at, 0.07, 0.02, 1.8, 0, new THREE.Color(0x81949d));
      }
      if (Math.round(at) % 48 === 0) this.put(this.ticks, ticks++, t.center, 0.012, -at, t.width - 1, 0.02, 0.05, 0, new THREE.Color(0x687c86));
    }
    positions.needsUpdate = true; this.roadGeometry.computeVertexNormals();
    this.finish(this.rails, rails); this.finish(this.edgeLights, rails); this.finish(this.ticks, ticks);
    let count = 0;
    for (const o of obstaclesNear(s, 45, 220)) {
      this.put(this.obstacles, count, o.x, 0.95, -o.s, o.w, 1.9, o.d);
      this.put(this.obstacleMarks, count, o.x, 1.915, -o.s, o.w - 0.35, 0.025, 0.4);
      count++;
    }
    this.finish(this.obstacles, count); this.finish(this.obstacleMarks, count);
  }
  event(event) {
    if (event.kind === 'lap') return;
    const count = event.kind === 'spark' ? 3 : 16;
    for (let i = 0; i < count; i++) this.particles.push({
      x: event.x, s: event.s, y: 1.1,
      vx: (Math.random() - 0.5) * 13, vs: (Math.random() - 0.5) * 16,
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
    this.camera.position.copy(this.cameraPosition); this.camera.lookAt(this.cameraAim);
    this.cameraInitialized = true;
    this.player.position.set(sim.x, 0.6 + Math.sin(sim.time * 8) * 0.06, -sim.s);
    this.player.rotation.z = sim.vx * 0.008;
    this.player.visible = sim.invulnerability <= 0 || Math.floor(sim.time * 18) % 2 === 0;
    this.playerMarker.position.set(sim.x, 0.025, -sim.s);
    this.put(this.shadows, 0, sim.x + 0.35, 0.022, -sim.s - 0.2, 1.45, 0.025, 2.5);
    const active = new Set(); let shadow = 1;
    for (const e of sim.enemies) {
      active.add(e.id);
      let mesh = this.enemyMeshes.get(e.id);
      if (!mesh) { mesh = this.enemyTemplate.clone(); this.enemyMeshes.set(e.id, mesh); this.scene.add(mesh); }
      mesh.position.set(e.x, 0.6, -e.s);
      mesh.rotation.z = Math.cos(e.age * 1.6 + e.phase) * 0.08;
      this.put(this.shadows, shadow++, e.x + 0.4, 0.022, -e.s - 0.1, 2.65, 0.025, 3.4);
    }
    for (const [id, mesh] of this.enemyMeshes) if (!active.has(id)) { this.scene.remove(mesh); this.enemyMeshes.delete(id); }
    this.finish(this.shadows, shadow);
    let friendly = 0, hostile = 0;
    for (const b of sim.bullets) {
      if (b.friendly && friendly < 220) this.put(this.shots, friendly++, b.x, 1, -b.s, 0.14, 0.15, 1.7);
      if (!b.friendly && hostile < 220) this.put(this.hostileShots, hostile++, b.x, 1, -b.s, 0.48, 0.48, 0.7);
    }
    this.finish(this.shots, friendly); this.finish(this.hostileShots, hostile);
    let particles = 0;
    for (const p of this.particles) {
      if (sim.status === 'playing') {
        p.life -= dt; p.x += p.vx * dt; p.s += p.vs * dt; p.y += p.vy * dt; p.vy -= 16 * dt;
      }
      const size = Math.max(0.03, p.life * 0.35);
      this.put(this.particlesBatch, particles++, p.x, Math.max(0.03, p.y), -p.s, size, size, size, 0, p.color);
    }
    this.particles = this.particles.filter(p => p.life > 0);
    this.finish(this.particlesBatch, particles);
    this.renderer.render(this.scene, this.camera);
  }
}
