import * as THREE from 'three';
import { roadPoint, lerp, clamp } from './track.js';
import { ENCOUNTER_RULES, ATTACK_COLORS } from './encounters.js';

export class EncounterView {
  constructor(view) {
    this.view = view;
    const chargeGeometry = new THREE.RingGeometry(1.6, 1.85, 48);
    chargeGeometry.rotateX(-Math.PI / 2);
    this.dartChargeBase = new THREE.Mesh(chargeGeometry, new THREE.MeshBasicMaterial({ color: 0x18242e, side: THREE.DoubleSide, depthWrite: false }));
    this.dartChargeBase.visible = false; view.scene.add(this.dartChargeBase);
    this.dartCharge = view.batch(40, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthWrite: false }));
    this.dartCharge.geometry = new THREE.RingGeometry(1.6, 1.85, 2, 1, 0, Math.PI * 2 / 40 * 0.9);
    this.dartCharge.geometry.rotateX(-Math.PI / 2);
    this.dartColors = Object.fromEntries(Object.entries(ATTACK_COLORS).map(([role, color]) => [role, new THREE.Color(color)]));
    const cueCanvas = document.createElement('canvas'); cueCanvas.width = 128; cueCanvas.height = 80;
    const cue = cueCanvas.getContext('2d');
    cue.lineCap = 'round'; cue.lineJoin = 'round';
    for (const [color, width] of [['#10181e', 22], ['#ffffff', 10]]) {
      cue.strokeStyle = color; cue.lineWidth = width;
      cue.beginPath(); cue.moveTo(30, 24); cue.lineTo(64, 55); cue.lineTo(98, 24); cue.stroke();
    }
    this.dartNext = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cueCanvas), depthTest: true, depthWrite: false, fog: false }));
    this.dartNext.scale.set(2.9, 1.8, 1); this.dartNext.visible = false; view.scene.add(this.dartNext);
    this.mineBodies = view.batch(ENCOUNTER_RULES.mineLimit, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
    this.mineBodies.geometry = new THREE.IcosahedronGeometry(0.65, 0);
    this.rings = view.batch(ENCOUNTER_RULES.mineLimit * 32, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthWrite: false }));
    this.rings.geometry = new THREE.RingGeometry(2.05, 2.2, 3, 1, 0, Math.PI * 2 / 32 * 0.85);
    this.rings.geometry.rotateX(-Math.PI / 2);
    this.orbits = view.batch(ENCOUNTER_RULES.mineLimit, new THREE.MeshBasicMaterial({ color: 0x728c9a, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    this.orbits.geometry = new THREE.RingGeometry(0.98, 1.02, 48); this.orbits.geometry.rotateX(-Math.PI / 2);
    this.arrows = view.batch(ENCOUNTER_RULES.mineLimit * 3, new THREE.MeshBasicMaterial({ color: 0xb9e8ec }));
    this.arrows.geometry = new THREE.ConeGeometry(0.28, 0.9, 3); this.arrows.geometry.rotateX(Math.PI / 2);
    this.blasts = view.batch(64, new THREE.MeshBasicMaterial({ color: 0xffae42, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    this.blasts.geometry = new THREE.RingGeometry(0.85, 1, 32); this.blasts.geometry.rotateX(-Math.PI / 2);
    this.paths = view.batch(48, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
    this.pickups = view.batch(3, new THREE.MeshBasicMaterial({ color: 0x62ffdf, fog: false }));
    this.pickups.geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = '#102a30'; context.fillRect(0, 0, 320, 64);
    context.strokeStyle = '#62ffdf'; context.lineWidth = 3; context.strokeRect(2, 2, 316, 60);
    context.fillStyle = '#c9fff3'; context.font = 'bold 28px sans-serif'; context.textAlign = 'center';
    context.fillText(`SALVAGE +${ENCOUNTER_RULES.reward}`, 160, 42);
    const labelMaterial = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false, depthWrite: false });
    this.labels = Array.from({ length: 3 }, () => {
      const label = new THREE.Sprite(labelMaterial); label.scale.set(9, 1.8, 1); label.renderOrder = 20; label.visible = false; view.scene.add(label); return label;
    });
    this.cyan = new THREE.Color(0x62dfea); this.orange = new THREE.Color(0xff922e); this.red = new THREE.Color(0xff503d);
  }
  update(sim) {
    const v = this.view, encounter = sim.encounter;
    let mines = 0, rings = 0, blasts = 0, paths = 0, pickups = 0, orbits = 0, arrows = 0;
    let chargeSegments = 0;
    this.dartNext.visible = false; this.dartChargeBase.visible = false;
    for (const label of this.labels) label.visible = false;
    if (encounter) {
      const next = encounter.members.find(e => e.id === encounter.dartNextId);
      if (next && encounter.dartReady(next)) {
        this.dartNext.visible = true;
        this.dartNext.position.set(next.x, 4.8, next.z);
      }
      const attack = encounter.dartAttack;
      if (attack && encounter.dartReady(attack.enemy)) {
        const e = attack.enemy, progress = clamp(attack.age / ENCOUNTER_RULES.dartWindup, 0, 1);
        this.dartChargeBase.visible = true; this.dartChargeBase.position.set(e.x, 0.07, e.z);
        chargeSegments = Math.floor(progress * 40);
        for (let i = 0; i < chargeSegments; i++) v.put(this.dartCharge, i, e.x, 0.085, e.z, 1, 1, 1,
          -Math.PI / 2 + i * Math.PI * 2 / 40, this.dartColors[e.role]);
      }
      for (const c of encounter.clusters.slice(0, ENCOUNTER_RULES.mineLimit)) {
        const center = roadPoint(c.s, c.lateral);
        v.put(this.orbits, orbits++, center.x, 0.04, center.z, c.radius, 1, c.radius);
        for (let i = 0; i < 3; i++) {
          const angle = i * Math.PI * 2 / 3 + c.age * c.direction * ENCOUNTER_RULES.orbitSpeed + 0.4;
          const a = roadPoint(c.s + Math.sin(angle) * c.radius, c.lateral + Math.cos(angle) * c.radius);
          const b = roadPoint(c.s + Math.sin(angle + c.direction * 0.05) * c.radius, c.lateral + Math.cos(angle + c.direction * 0.05) * c.radius);
          v.put(this.arrows, arrows++, a.x, 0.1, a.z, 1, 0.1, 1, Math.atan2(b.x - a.x, b.z - a.z));
        }
      }
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
      for (const e of encounter.members) if (e.hp > 0 && ['dashWarning', 'dash'].includes(e.phase)) {
        for (let i = 0; i < 12; i++) {
          if (e.phase === 'dashWarning' && i % 2) continue;
          const a = roadPoint(sim.s + lerp(6, 1.2, i / 12), lerp(e.dashStart, e.dashTarget, i / 12));
          const b = roadPoint(sim.s + lerp(6, 1.2, (i + 1) / 12), lerp(e.dashStart, e.dashTarget, (i + 1) / 12));
          v.put(this.paths, paths++, (a.x + b.x) / 2, 0.06, (a.z + b.z) / 2, 2.5, 0.04, Math.hypot(b.x - a.x, b.z - a.z), Math.atan2(b.x - a.x, b.z - a.z), e.phase === 'dashWarning' ? this.orange : this.red);
        }
      }
      for (const p of encounter.pickups) {
        const t = clamp(p.age / 0.25, 0, 1);
        const x = lerp(p.originX, p.x, t), z = lerp(p.originZ, p.z, t);
        const label = this.labels[pickups]; label.visible = true; label.position.set(x, 3.5, z);
        v.put(this.pickups, pickups++, x, 1.3 + Math.sin(t * Math.PI) * 3, z, 1, 1, 1, sim.time * 2);
      }
    }
    for (const [mesh, count] of [[this.dartCharge, chargeSegments], [this.mineBodies, mines], [this.rings, rings], [this.orbits, orbits], [this.arrows, arrows], [this.blasts, blasts], [this.paths, paths], [this.pickups, pickups]]) v.finish(mesh, count);
  }
}
