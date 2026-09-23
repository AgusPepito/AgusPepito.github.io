import * as THREE from 'three';
import { clamp } from './track.js';

export const EFFECT_DEFAULTS = { shake: 0.18, wind: 0.3 };
// Fast mode uses 1; consumable boost intensifies effects without overriding settings.
export function effectStrength(speed, amount, reducedMotion = false, multiplier = 1) {
  return reducedMotion ? 0 : clamp((speed - 20) / 62, 0, 1) * clamp(amount, 0, 1) * Math.max(0, multiplier);
}

export class SpeedEffects {
  constructor(camera) {
    this.camera = camera;
    this.positions = new Float32Array(64 * 6);
    this.colors = new Float32Array(64 * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.lines.frustumCulled = false; this.lines.renderOrder = 50;
    camera.add(this.lines);
  }
  update(sim, settings, reducedMotion) {
    const shake = effectStrength(sim.speed, settings.shake, reducedMotion, 1 + sim.boostBlend * 0.5);
    const t = sim.time;
    // The base camera pose is restored every frame, so vibration never accumulates.
    this.camera.rotateX(Math.sin(t * 39) * shake * 0.006);
    this.camera.rotateY(Math.sin(t * 47 + 1) * shake * 0.004);
    this.camera.rotateZ(Math.sin(t * 31) * shake * 0.006);
    const wind = effectStrength(sim.speed, settings.wind, reducedMotion, 1 + sim.boostBlend * 0.85);
    this.lines.visible = wind > 0 && sim.status !== 'ready';
    this.lines.material.opacity = wind * 0.55;
    const tan = Math.tan(this.camera.fov * Math.PI / 360);
    for (let i = 0; i < 64; i++) {
      const phase = ((sim.distance * 0.012 + i * 0.618034) % 1 + 1) % 1;
      const angle = i * 2.39996, z = -90 + phase * 86;
      // Start near the periphery and fan outward as each line approaches the lens.
      const radius = (28 + (i % 9) * 2.5) * tan;
      const x = Math.cos(angle) * radius * this.camera.aspect, y = Math.sin(angle) * radius;
      const length = 1.5 + wind * 8;
      this.positions.set([x, y, z, x, y, z - length], i * 6);
      const fade = Math.sin(Math.PI * phase) ** 2;
      this.colors.set([0.55 * fade, 0.78 * fade, fade, 0, 0, 0], i * 6);
    }
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.lines.geometry.attributes.color.needsUpdate = true;
  }
}
