import * as THREE from 'three';
import { section, frame, wrap, clamp, GATES, PHASES } from './track.js';
import { OBSTACLES, passageDirection } from './obstacles.js';
import { GAPS, JUMP, gapAt, jumpPose, gapJumpCue } from './jumps.js';

// A Hermite curve in track coordinates: a world-space spline would cut through tubes.
export class PassageGuide {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group);
    this.steps = 128; this.arrowCount = 22;
    this.positions = new Float32Array((this.steps + 1) * 6);
    this.colors = new Float32Array(this.positions.length);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    const indices = [];
    for (let i = 0; i < this.steps; i++) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geometry.setIndex(indices);
    this.ribbon = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true,
      transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.ribbon.frustumCulled = false; this.ribbon.renderOrder = 5; this.group.add(this.ribbon);
    this.arrowPositions = new Float32Array(this.arrowCount * 9);
    this.arrowColors = new Float32Array(this.arrowPositions.length);
    const arrows = new THREE.BufferGeometry(); arrows.setAttribute('position', new THREE.BufferAttribute(this.arrowPositions, 3));
    arrows.setAttribute('color', new THREE.BufferAttribute(this.arrowColors, 3));
    this.arrowMesh = new THREE.Mesh(arrows, new THREE.MeshBasicMaterial({ color: 0xffffff,
      vertexColors: true, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    this.arrowMesh.frustumCulled = false; this.arrowMesh.renderOrder = 6; this.group.add(this.arrowMesh);
    this.marker = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.1, 6, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
    this.landingMarker = new THREE.Mesh(this.marker.geometry, this.marker.material);
    this.phaseColors = PHASES.map(p => new THREE.Color(p.hex));
    this.bandPositions = new Float32Array(24 * 18);
    const bandGeometry = new THREE.BufferGeometry();
    bandGeometry.setAttribute('position', new THREE.BufferAttribute(this.bandPositions, 3));
    this.takeoffBand = new THREE.Mesh(bandGeometry, new THREE.MeshBasicMaterial({ color: 0xffdf88,
      transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    this.takeoffBand.frustumCulled = false; this.takeoffBand.renderOrder = 7;
    this.group.add(this.takeoffBand);
    this.group.add(this.marker, this.landingMarker); this.group.visible = false;
  }
  update(race, reducedMotion) {
    const wall = OBSTACLES.find(o => o.s + o.depth + 2 > race.s && o.s - race.s < 650);
    const gap = GAPS.find(g => g.end + 4 > race.s && g.start - race.s < 650);
    const gate = GATES.find(g => g.s > race.s + 4 && g.s - race.s < 650);
    const obstacle = (gap && (!wall || gap.start < wall.s) ? { ...gap, s: gap.start, depth: gap.end - gap.start, kind: 'gap' } : wall) || (gate && { ...gate, kind: 'phase' });
    const leap = obstacle && (obstacle.kind === 'jump' || obstacle.kind === 'gap');
    this.group.visible = Boolean(obstacle && (leap || obstacle.s > race.s + 4) && race.mode === 'phase' && ['running', 'paused'].includes(race.state));
    if (!this.group.visible) return;
    const cue = obstacle.kind === 'gap' ? gapJumpCue(race, obstacle) : null;
    this.takeoffBand.visible = Boolean(cue && !race.airborne && race.s < cue.latest);
    if (this.takeoffBand.visible) {
      this.takeoffBand.material.color.setHex(cue.enough ? 0xffdf88 : 0xff945c);
      this.takeoffBand.material.opacity = cue.ready ? 0.95 : 0.4;
      const halfWidth = 5 / section(obstacle.start).halfWidth;
      for (let i = 0; i < 24; i++) {
        const a = race.u - halfWidth + halfWidth * 2 * i / 24;
        const b = a + halfWidth * 2 / 24;
        const vertices = [[cue.bandStart, a], [cue.latest, a], [cue.bandStart, b],
          [cue.bandStart, b], [cue.latest, a], [cue.latest, b]];
        vertices.forEach(([s, u], j) => {
          const local = section(s);
          const f = frame(s, local.closed ? wrap(u) : clamp(u, -0.97, 0.97));
          f.p.addScaledVector(f.normal, 0.18).toArray(this.bandPositions, i * 18 + j * 3);
        });
      }
      this.takeoffBand.geometry.attributes.position.needsUpdate = true;
    }
    // Show the passage beyond the landing while the gap is still the active hazard.
    // Do not skip another missing section or another wall to reach that passage.
    const followingWall = obstacle.kind === 'gap' ? OBSTACLES.find(o => o.s > obstacle.end) : null;
    const continuation = followingWall && followingWall.kind === 'hole' && followingWall.s - obstacle.end < 650 &&
      !GAPS.some(g => g.start >= obstacle.end && g.start < followingWall.s) ? followingWall : null;
    const destination = continuation || obstacle;
    const startS = race.s + 2;
    const landingS = obstacle.kind === 'gap' ? obstacle.end + 12 : null;
    const endS = continuation ? continuation.s - 2 : obstacle.kind === 'gap' ? landingS : obstacle.kind === 'jump' ? obstacle.s + Math.max(35, race.speed * 0.55) : obstacle.s - 2;
    const length = endS - startS;
    if (length <= 2) { this.group.visible = false; return; }
    const road = section(destination.s);
    let targetU = continuation ? continuation.center : leap || obstacle.kind === 'phase' ? race.u : obstacle.center;
    if (obstacle.kind === 'wall') {
      const turn = passageDirection(obstacle, race.u);
      targetU = turn === 0 ? race.u : obstacle.center + turn * (obstacle.width + 4 / road.halfWidth);
    }
    // Wrap only when the entire approach is closed; crossing an open seam is not a route.
    const closedApproach = Array.from({ length: 17 }, (_, i) => section(startS + length * i / 16).closed).every(Boolean);
    targetU = road.closed ? wrap(targetU) : clamp(targetU, -0.9, 0.9);
    const delta = closedApproach ? wrap(targetU - race.u) : targetU - race.u;
    const tangent = clamp(race.lateralSpeed / section(race.s).halfWidth * length / Math.max(1, race.speed), -0.3, 0.3);
    const jumpRoute = obstacle.kind === 'jump' || obstacle.kind === 'gap' && Boolean(gapAt(obstacle.start + 0.1, race.u));
    const takeoff = obstacle.kind === 'gap' ? cue?.enough ? (cue.earliest + cue.latest) / 2 : obstacle.start - 2 : obstacle.s - Math.max(25, race.speed * 0.3);
    const fallbackColor = new THREE.Color(jumpRoute ? 0xffdf88 : 0xf1fff4);
    const routeGates = GATES.filter(g => g.s > race.s && g.s <= endS + 3);
    const colorAt = s => {
      const next = routeGates.find(g => g.s >= s);
      return next ? this.phaseColors[next.phase] : fallbackColor;
    };
    this.marker.material.color.copy(colorAt(endS));
    const sample = t => {
      const eased = t * t * (3 - 2 * t);
      let u = race.u + delta * eased + tangent * t * (1 - t) ** 2;
      const s = startS + length * t, local = section(s);
      if (!closedApproach) u = clamp(u, -1 + 1.8 / local.halfWidth, 1 - 1.8 / local.halfWidth);
      const f = frame(s, u);
      const flight = clamp((s - takeoff) / Math.max(1, (landingS ?? endS) - takeoff), 0, 1);
      const arc = jumpRoute ? Math.max(0, jumpPose(flight * JUMP.duration).height) : 0;
      const lift = Math.max(arc, Math.max(0, race.height) * (1 - t) ** 3);
      return { ...f, ground: f.p.clone(), p: f.p.addScaledVector(f.normal, 0.38 + lift) };
    };
    for (let i = 0; i <= this.steps; i++) {
      const f = sample(i / this.steps);
      f.p.clone().addScaledVector(f.right, -0.22).toArray(this.positions, i * 6);
      f.p.clone().addScaledVector(f.right, 0.22).toArray(this.positions, i * 6 + 3);
      const color = colorAt(startS + length * i / this.steps);
      color.toArray(this.colors, i * 6); color.toArray(this.colors, i * 6 + 3);
    }
    this.ribbon.geometry.attributes.position.needsUpdate = true;
    this.ribbon.geometry.attributes.color.needsUpdate = true;
    const count = Math.min(this.arrowCount, Math.max(2, Math.floor(length / 22)));
    this.arrowMesh.geometry.setDrawRange(0, count * 3);
    for (let i = 0; i < count; i++) {
      const travel = reducedMotion ? 0.5 : (race.time * 1.4) % 1;
      let t = (i + travel) / count;
      // Pack the approaching chevrons toward the takeoff band, retaining the
      // rest of the route and any following wall passage beyond the gap.
      const bandT = cue && !race.airborne ? clamp((takeoff - startS) / length, 0, 1) : 0;
      if (bandT > 0 && t < bandT) t = bandT * (1 - (1 - t / bandT) ** 1.6);
      const f = sample(t), next = sample(Math.min(1, t + 0.003));
      const direction = next.p.clone().sub(f.p).normalize();
      const right = direction.clone().cross(f.normal).normalize();
      const size = Math.min(1.5, length / 12);
      const p = f.p.addScaledVector(f.normal, 0.04);
      p.clone().addScaledVector(direction, size * 1.6).toArray(this.arrowPositions, i * 9);
      p.clone().addScaledVector(direction, -size).addScaledVector(right, -size).toArray(this.arrowPositions, i * 9 + 3);
      p.clone().addScaledVector(direction, -size).addScaledVector(right, size).toArray(this.arrowPositions, i * 9 + 6);
      const color = colorAt(startS + length * t);
      for (let vertex = 0; vertex < 3; vertex++) color.toArray(this.arrowColors, i * 9 + vertex * 3);
    }
    this.arrowMesh.geometry.attributes.position.needsUpdate = true;
    this.arrowMesh.geometry.attributes.color.needsUpdate = true;
    const end = sample(1); this.marker.position.copy(end.p);
    this.marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), end.normal);
    this.landingMarker.visible = Boolean(landingS > startS && (continuation || cue?.airborne));
    if (this.landingMarker.visible) {
      const landing = sample(clamp((landingS - startS) / length, 0, 1));
      this.landingMarker.position.copy(landing.ground).addScaledVector(landing.normal, 0.38);
      this.landingMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), landing.normal);
    }
  }
}
