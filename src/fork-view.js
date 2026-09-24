import * as THREE from 'three';
import { trackAt, roadPoint, roadFrame } from './track.js';
import { FORK_RULES, forkSample, forkOpensRail } from './forks.js';

export class ForkView {
  constructor(view) {
    this.view = view; this.roads = new Map();
    this.surface = new THREE.MeshStandardMaterial({ color: 0x40504e, roughness: 0.95, side: THREE.DoubleSide });
    this.rails = view.batch(512, new THREE.MeshStandardMaterial({ color: 0x71818a, roughness: 0.8 }));
    this.lights = view.batch(512, new THREE.MeshBasicMaterial({ color: 0xffb25c }));
    this.marks = view.batch(256, new THREE.MeshBasicMaterial({ color: 0xffc46e }));
    this.entryLane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffb25c, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    this.entryLane.rotation.x = -Math.PI / 2; view.scene.add(this.entryLane);
    this.canvas = document.createElement('canvas'); this.canvas.width = 512; this.canvas.height = 128;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, depthTest: false, depthWrite: false }));
    this.sign.scale.set(12, 3, 1); this.sign.renderOrder = 15; view.scene.add(this.sign);
  }
  update(sim) {
    const v = this.view, forks = sim.level?.forks || [], active = new Set();
    let rails = 0, marks = 0;
    this.sign.visible = false; this.entryLane.visible = false;
    for (const fork of forks) {
      if (fork.end < sim.s - 65 || fork.start > sim.s + 260) continue;
      const key = `${fork.index}:${fork.start}`; active.add(key);
      const segments = Math.ceil((fork.end - fork.start) / 2), step = (fork.end - fork.start) / segments;
      if (!this.roads.has(key)) {
        const geometry = new THREE.PlaneGeometry(1, 1, 1, segments), positions = geometry.attributes.position;
        for (let i = 0; i <= segments; i++) {
          const s = fork.start + i * step, sample = forkSample(fork, s);
          for (const [j, lane] of [sample.left, sample.right].entries()) {
            const point = roadPoint(s, lane); positions.setXYZ(i * 2 + j, point.x, -0.06, point.z);
          }
        }
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, this.surface); mesh.frustumCulled = false;
        this.roads.set(key, mesh); v.scene.add(mesh);
      }
      for (let i = 0; i < segments; i++) {
        const s = fork.start + i * step;
        if (s < sim.s - 60 || s > sim.s + 245) continue;
        const a = forkSample(fork, s), b = forkSample(fork, s + step);
        for (const side of [-1, 1]) {
          // The outside rail continues around the whole junction. The inside
          // rail exists only once the two roads have actually separated.
          if (side !== fork.side && forkOpensRail(fork, s + step / 2, fork.side)) continue;
          const lane = a.center + side * (a.width / 2 + 0.32);
          const p = roadPoint(s, lane), q = roadPoint(s + step, b.center + side * (b.width / 2 + 0.32));
          const yaw = Math.atan2(p.x - q.x, p.z - q.z), length = Math.hypot(p.x - q.x, p.z - q.z) + 0.05;
          v.put(this.rails, rails, (p.x + q.x) / 2, 0.6, (p.z + q.z) / 2, 0.62, 1.2, length, yaw);
          v.put(this.lights, rails++, (p.x + q.x) / 2, 1.22, (p.z + q.z) / 2, 0.17, 0.06, length, yaw);
        }
        // Two dividers form three real lanes; markings beneath the main road
        // are naturally hidden where the two pavements overlap.
        if (i % 4 === 0) for (const fraction of [-1 / 6, 1 / 6]) {
          const p = roadPoint(s, a.center + a.width * fraction), q = roadPoint(s + step, b.center + b.width * fraction);
          v.put(this.marks, marks++, p.x, -0.035, p.z, 0.16, 0.02, 2.5, Math.atan2(p.x - q.x, p.z - q.z));
        }
      }
    }
    for (const [key, mesh] of this.roads) if (!active.has(key)) {
      v.scene.remove(mesh); mesh.geometry.dispose(); this.roads.delete(key);
    }
    const fork = sim.level?.fork;
    if (fork?.state === 'approach') {
      const distance = Math.max(0, fork.start - sim.s), s = Math.min(fork.start, sim.s + 19);
      const lane = fork.side * (trackAt(s).width / 2 - FORK_RULES.entryWidth / 2), point = roadPoint(s, lane), frame = roadFrame(s);
      const armed = fork.side * sim.lateral >= trackAt(sim.s).width / 2 - FORK_RULES.entryWidth;
      this.entryLane.visible = true; this.entryLane.position.set(point.x, 0.035, point.z);
      this.entryLane.rotation.set(-Math.PI / 2, frame.yaw, 0, 'YXZ'); this.entryLane.scale.set(FORK_RULES.entryWidth - 0.5, 18, 1);
      this.entryLane.material.color.set(armed ? 0xcaff64 : 0xffb25c);
      this.sign.visible = true; this.sign.position.set(point.x, 4.2, point.z);
      const label = `${fork.side < 0 ? '←' : '→'} BYPASS ${fork.skips.toUpperCase()}`;
      const detail = `${Math.ceil(distance / 5) * 5} m · ${armed ? 'HOLD THIS LANE' : 'TAKE THIS LANE'}`;
      const stamp = `${label}:${detail}`;
      if (stamp !== this.stamp) {
        this.stamp = stamp;
        const c = this.canvas.getContext('2d'); c.clearRect(0, 0, 512, 128);
        c.fillStyle = '#101b22ed'; c.fillRect(0, 0, 512, 128);
        c.strokeStyle = armed ? '#caff64' : '#ffb25c'; c.lineWidth = 5; c.strokeRect(3, 3, 506, 122);
        c.textAlign = 'center'; c.fillStyle = c.strokeStyle; c.font = 'bold 29px sans-serif'; c.fillText(label, 256, 38);
        c.fillStyle = '#eef4ef'; c.font = 'bold 23px sans-serif'; c.fillText(detail, 256, 77);
        c.fillStyle = '#b5c6cc'; c.font = '19px sans-serif'; c.fillText('SLOW TRAFFIC · FIND THE GAPS', 256, 108);
        this.texture.needsUpdate = true;
      }
      // Ground dashes lead through the final approach and identify the commit line.
      for (let offset = 6; offset < 58; offset += 8) {
        const at = sim.s + offset; if (at > fork.start) break;
        v.putRoad(this.marks, marks++, at, fork.side * (trackAt(at).width / 2 - FORK_RULES.entryWidth / 2), 0.055, 0.5, 0.03, 3);
      }
      if (distance < 120) v.putRoad(this.marks, marks++, fork.start, forkSample(fork, fork.start).center, 0.055, FORK_RULES.entryWidth, 0.03, 0.6);
    }
    v.finish(this.rails, rails); v.finish(this.lights, rails); v.finish(this.marks, marks);
  }
}
