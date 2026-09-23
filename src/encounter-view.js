import * as THREE from 'three';
import { roadPoint, lerp, clamp } from './track.js';
import { ENCOUNTER_RULES } from './encounters.js';

export class EncounterView {
  constructor(view) {
    this.view = view;
    this.mineBodies = view.batch(ENCOUNTER_RULES.mineLimit, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
    this.mineBodies.geometry = new THREE.IcosahedronGeometry(0.65, 0);
    this.rings = view.batch(ENCOUNTER_RULES.mineLimit * 32, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthWrite: false }));
    this.rings.geometry = new THREE.RingGeometry(2.05, 2.2, 3, 1, 0, Math.PI * 2 / 32 * 0.85);
    this.rings.geometry.rotateX(-Math.PI / 2);
    this.blasts = view.batch(64, new THREE.MeshBasicMaterial({ color: 0xffae42, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    this.blasts.geometry = new THREE.RingGeometry(0.85, 1, 32); this.blasts.geometry.rotateX(-Math.PI / 2);
    this.paths = view.batch(48, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
    this.pickups = view.batch(3, new THREE.MeshBasicMaterial({ color: 0x62ffdf, fog: false }));
    this.pickups.geometry = new THREE.OctahedronGeometry(0.8);
    this.cyan = new THREE.Color(0x62dfea); this.orange = new THREE.Color(0xff922e); this.red = new THREE.Color(0xff503d);
  }
  update(sim) {
    const v = this.view, encounter = sim.encounter;
    let mines = 0, rings = 0, blasts = 0, paths = 0, pickups = 0;
    if (encounter) {
      for (const mine of encounter.mines.slice(0, ENCOUNTER_RULES.mineLimit)) {
        const progress = clamp(mine.age / ENCOUNTER_RULES.mineArm, 0, 1);
        const color = progress < 1 ? this.cyan : this.orange;
        v.put(this.mineBodies, mines++, mine.x, 0.6, mine.z, 1, 1, 1, sim.time, color);
        const count = Math.max(2, Math.floor(progress * 32));
        for (let i = 0; i < count; i++) v.put(this.rings, rings++, mine.x, 0.05, mine.z, 1, 1, 1, i * Math.PI * 2 / 32, color);
      }
      for (const blast of encounter.blasts.slice(-64)) {
        const radius = blast.radius * (0.3 + blast.age / 0.45 * 0.7);
        v.put(this.blasts, blasts++, blast.x, 0.1, blast.z, radius, 1, radius);
      }
      for (const e of encounter.members) if (e.hp > 0 && ['aim', 'locked', 'charge'].includes(e.phase)) {
        const start = sim.s - 2, end = Math.max(start + 1, e.s);
        for (let i = 0; i < 24; i++) {
          if (e.phase === 'aim' && i % 2) continue;
          const a = roadPoint(lerp(start, end, i / 24), lerp(e.targetLane, e.lateral, i / 24));
          const b = roadPoint(lerp(start, end, (i + 1) / 24), lerp(e.targetLane, e.lateral, (i + 1) / 24));
          v.put(this.paths, paths++, (a.x + b.x) / 2, 0.045, (a.z + b.z) / 2, 2.5, 0.04, Math.hypot(a.x - b.x, a.z - b.z), Math.atan2(a.x - b.x, a.z - b.z), e.phase === 'aim' ? this.orange : this.red);
        }
      }
      for (const p of encounter.pickups) {
        const t = clamp(p.age / 0.25, 0, 1);
        v.put(this.pickups, pickups++, lerp(p.originX, p.x, t), 1.3 + Math.sin(t * Math.PI) * 3, lerp(p.originZ, p.z, t), 1, 1, 1, sim.time * 2);
      }
    }
    for (const [mesh, count] of [[this.mineBodies, mines], [this.rings, rings], [this.blasts, blasts], [this.paths, paths], [this.pickups, pickups]]) v.finish(mesh, count);
  }
}
