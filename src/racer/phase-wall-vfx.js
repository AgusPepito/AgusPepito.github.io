import * as THREE from 'three';
import {section, wrap, lateralDistance, clamp} from './track.js';
import {JUMP} from './jumps.js';
import {installPhaseField, updatePhaseField} from '../../public/assets/track/phase-field-r1.js';

export class PhaseWallVfx {
  constructor(entries) {
    this.entries = entries;
    this.last = null;
    for (const entry of entries) this.bind(entry);
  }
  bind(entry) {
    entry.fields = [];
    entry.group.traverse(mesh => {
      if (!mesh.isMesh || !mesh.material.userData.phaseField) return;
      entry.fields.push({mesh, uniforms: installPhaseField(THREE, mesh.material)});
    });
  }
  update(race, reduced, quality) {
    const previous = this.last;
    const reset = !previous || race.time < previous.time || Math.abs(race.s - previous.s) > 90 ||
      race.mode !== previous.mode || Boolean(race.demo) !== previous.demo ||
      (race.state === 'ready' && !race.demo && previous.state !== 'ready');
    const crossing = !reset && !reduced && !race.demo && race.mode === 'phase' && race.passed > previous.passed;
    for (const entry of this.entries) {
      const {gate, group, fields} = entry;
      if (!fields?.length) continue;
      for (const {mesh, uniforms} of fields) {
        mesh.visible = race.mode === 'phase';
        if (reset || reduced) uniforms.fieldImpact.value.z = -1000;
      }
      if (!group.visible || race.mode !== 'phase') continue;
      if (crossing && previous.s < gate.s && race.s >= gate.s && gate.phase === race.phase) {
        const road = section(gate.s), fraction = (gate.s - previous.s) / (race.s - previous.s);
        const delta = road.closed ? wrap(race.u - previous.u) : race.u - previous.u;
        const u = previous.u + delta * fraction;
        if (gate.full || lateralDistance(u, gate.center, gate.s) <= gate.width + 0.75 / road.halfWidth) {
          const offset = road.closed ? wrap(u - gate.center) : u - gate.center;
          const x = (offset + gate.width) * road.halfWidth;
          const height = JUMP.hover + previous.height + (race.height - previous.height) * fraction;
          const time = previous.time + (race.time - previous.time) * fraction;
          for (const {uniforms} of fields) uniforms.fieldImpact.value.set(x, height, time);
        }
      }
      const ahead = gate.s - race.s;
      const approach = ahead >= 0 ? 1 - clamp(ahead / 100, 0, 1) : 0;
      for (const {mesh} of fields) updatePhaseField(mesh.material, {
        time: race.time, phase: gate.phase, reduced, detail: quality === 'rich', approach,
        viewDistance: ahead + 12,
      });
    }
    this.last = {time:race.time, s:race.s, u:race.u, height:race.height, passed:race.passed,
      mode:race.mode, state:race.state, demo:Boolean(race.demo)};
  }
}
