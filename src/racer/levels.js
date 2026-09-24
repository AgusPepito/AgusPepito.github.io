import { GATES, STRIPS, setTrackProfile } from './track.js';
import { OBSTACLES } from './obstacles.js';
import { GAPS } from './jumps.js';
import { PHASE_CHAINS } from './sequences.js';

// Keep the developed course as the combinations level, then vary it for later rounds.
const original = structuredClone({ gates: GATES, strips: STRIPS, obstacles: OBSTACLES, gaps: GAPS, chains: PHASE_CHAINS });
const gate = (s, phase) => ({ s, phase, center: 0, width: 1, full: true });
const strip = (start, end, phase, u = 0) => ({ start, end, phase, from: u, to: u, width: 0.26 });
const wall = (s, center, width) => ({ s, kind: 'wall', center, width, depth: 5 });
const hole = (s, center, width, height = 9) => ({ s, kind: 'hole', center, width, depth: 5, height });
const jump = s => ({ s, kind: 'jump', center: 0, width: 1, depth: 5, height: 2.4 });
const gap = (start, end) => ({ start, end, center: 0, width: 1, full: true });
export function levelInfo(index) {
  return [
    { name: 'FIRST SHIFT', length: 2400, profile: 'flat', lesson: 'Follow the colored line. Match each gate with 1, 2 or 3.' },
    { name: 'AROUND THE TUBE', length: 6600, profile: 'mixed', lesson: 'Steer around the surface and follow the line through wide openings.' },
    { name: 'TAKE FLIGHT', length: 3400, profile: 'flat', lesson: 'Space jumps. W boosts. Jump late and save turbo for longer gaps.' },
    { name: 'COMBINATIONS', length: 6600, profile: 'mixed', lesson: 'Read the whole sequence: phases, passage, then landing.' },
  ][index] || { name: `OVERLOAD ${index - 3}`, length: 6600, profile: 'mixed', lesson: 'Three-phase chains, tighter openings, and longer gaps. Read ahead.' };
}
export function configureLevel(index) {
  const info = levelInfo(index);
  let data = { gates: [], strips: [], obstacles: [], gaps: [], chains: [] };
  if (index === 0) {
    data.gates = [gate(500, 0), gate(1100, 1), gate(1700, 2)];
    data.strips = [strip(180, 420, 0), strip(780, 1020, 1), strip(1400, 1620, 2)];
    data.obstacles = [wall(2100, 0, 0.3)];
  } else if (index === 1) {
    data.gates = [gate(700, 0), gate(1300, 1), gate(3400, 2), gate(3900, 0), gate(5700, 1)];
    data.strips = [strip(300, 550, 0), strip(1420, 1650, 1), strip(3650, 3820, 0), strip(5250, 5500, 1)];
    data.obstacles = [wall(1770, 0, 0.2), hole(2320, 0.5, 0.27), wall(4400, 0.1, 0.24), hole(5000, -0.45, 0.27)];
  } else if (index === 2) {
    data.gates = [gate(1750, 1)];
    data.strips = [strip(750, 1100, 0), strip(2300, 2550, 1)];
    data.obstacles = [jump(600), hole(2100, 0.3, 0.3, 4.2)];
    data.gaps = [gap(1250, 1350), gap(2750, 2930)];
  } else {
    data = structuredClone(original);
    if (index >= 4) {
      const round = index - 4, intensity = Math.min(round, 5), mirror = round % 2 ? -1 : 1;
      const spacing = 170 - intensity * 6; // Never less than 140 m between phase switches.
      data.chains = data.chains.map((chain, n) => ({ ...chain, id: `${chain.id}-${round}`, name: `OVERLOAD / ${n + 1}`,
        gates: [0, 1, 2].map(i => ({ s: chain.obstacleS - 210 - (2 - i) * spacing, phase: (i + n + round) % 3 })) }));
      data.gates = data.chains.flatMap(chain => chain.gates.map(g => ({ ...gate(g.s, g.phase), chainId: chain.id })));
      data.obstacles = data.obstacles.map(o => ({ ...o, center: o.center * mirror,
        width: o.kind === 'hole' ? Math.max(0.115, o.width - 0.015 - intensity * 0.005) : o.width }));
      data.gaps = data.gaps.map(g => ({ ...g, center: g.center * mirror, end: g.end + (g.full ? 5 + intensity * 3 : 0) }));
      data.strips = data.strips.map(s => ({ ...s, phase: (s.phase + round) % 3, from: s.from * mirror, to: s.to * mirror }));
    }
  }
  setTrackProfile(info.length, info.profile);
  // Preserve array identities for the simulation, renderer and guidance imports.
  GATES.splice(0, GATES.length, ...data.gates.sort((a, b) => a.s - b.s));
  STRIPS.splice(0, STRIPS.length, ...data.strips);
  OBSTACLES.splice(0, OBSTACLES.length, ...data.obstacles.sort((a, b) => a.s - b.s));
  GAPS.splice(0, GAPS.length, ...data.gaps.sort((a, b) => a.start - b.start));
  PHASE_CHAINS.splice(0, PHASE_CHAINS.length, ...data.chains);
  return info;
}
