import { Vector3 } from 'three';
import { PHASE_CHAINS } from './sequences.js';

export let LENGTH = 6600;
let profile = 'mixed';
export function setTrackProfile(length, shape) { LENGTH = length; profile = shape; }
export const RADIUS = 18;
export const PHASES = [
  { name: 'ION', symbol: '●', color: '#4de1ff', hex: 0x4de1ff },
  { name: 'SOL', symbol: '▲', color: '#ffbe55', hex: 0xffbe55 },
  { name: 'FLUX', symbol: '◆', color: '#dc8aff', hex: 0xdc8aff },
];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
export const wrap = u => ((u + 1) % 2 + 2) % 2 - 1;

// Signed curvature: negative rolls away into an exterior, positive curls into an interior.
// The same parameterization supplies geometry, collision, driving and the camera frame.
export function section(s) {
  if (profile === 'flat') return { curl: 0, halfWidth: 18, closed: false, name: 'OPEN ROAD' };
  if (profile === 'outside' || profile === 'inside') return { curl: profile === 'inside' ? 1 : -1, halfWidth: Math.PI * RADIUS, closed: true, name: profile === 'inside' ? 'INSIDE TUBE' : 'OUTSIDE TUBE' };
  let curl = 0, name = 'LAUNCH STRAIGHT';
  if (s >= 850 && s < 1300) { curl = -smooth((s - 850) / 450); name = 'ROLLING OUTWARD'; }
  else if (s >= 1300 && s < 2500) { curl = -1; name = 'OUTSIDE / ORBIT'; }
  else if (s >= 2500 && s < 2950) { curl = -1 + smooth((s - 2500) / 450); name = 'OPENING TO ROAD'; }
  else if (s >= 2950 && s < 3500) name = 'SWEEPING STRAIGHT';
  else if (s >= 3500 && s < 3950) { curl = smooth((s - 3500) / 450); name = 'CURLING INWARD'; }
  else if (s >= 3950 && s < 5400) { curl = 1; name = 'INSIDE / TUNNEL'; }
  else if (s >= 5400 && s < 5850) { curl = 1 - smooth((s - 5400) / 450); name = 'OPENING TO ROAD'; }
  else if (s >= 5850) name = 'FINAL SPRINT';
  const halfWidth = 18 + (Math.PI * RADIUS - 18) * Math.abs(curl);
  return { curl, halfWidth, closed: Math.abs(curl) === 1, name };
}

export function point(s, u) {
  const { curl, halfWidth } = section(s), lateral = u * halfWidth, k = curl / RADIUS;
  const x = Math.abs(k) < 1e-7 ? lateral : Math.sin(k * lateral) / k;
  const y = Math.abs(k) < 1e-7 ? 0 : (1 - Math.cos(k * lateral)) / k;
  // Authored bends have truly straight approaches and exits; z remains monotonic.
  const tubeReview = profile === 'outside' || profile === 'inside';
  const centerX = tubeReview ? 0 : profile === 'flat' ? 18 * smooth((s / LENGTH - 0.15) / 0.2) - 36 * smooth((s / LENGTH - 0.4) / 0.2) + 18 * smooth((s / LENGTH - 0.7) / 0.2) : 95 * smooth((s - 300) / 550) - 170 * smooth((s - 1450) / 750)
    + 210 * smooth((s - 2950) / 500) - 180 * smooth((s - 4050) / 900)
    + 45 * smooth((s - 5900) / 450);
  const centerY = profile === 'flat' || tubeReview ? 0 : 24 * smooth((s - 1500) / 800) - 40 * smooth((s - 4150) / 900);
  return new Vector3(x + centerX, y + centerY, -s);
}

export function frame(s, u) {
  const p = point(s, u);
  const along = point(s + 0.1, u).sub(point(s - 0.1, u)).multiplyScalar(5);
  const forward = along.clone().normalize();
  const right = point(s, u + 0.0001).sub(point(s, u - 0.0001)).normalize();
  const normal = right.clone().cross(forward).normalize();
  right.copy(forward).cross(normal).normalize();
  return { p, forward, right, normal, metric: along.length() };
}

export const STRIPS = [
  { start: 140, end: 630, phase: 0, from: -0.4, to: -0.4, width: 0.24 },
  { start: 340, end: 630, phase: 1, from: 0.4, to: 0.4, width: 0.24 },
  { start: 900, end: 1190, phase: 1, from: 0, to: 0, width: 0.19 },
  { start: 1380, end: 2260, phase: 0, from: 0, to: 1.5, width: 0.12 },
  { start: 1500, end: 2130, phase: 2, from: -0.4, to: -0.4, width: 0.12 },
  { start: 2700, end: 3370, phase: 2, from: 0, to: -0.38, width: 0.22 },
  { start: 3650, end: 3910, phase: 0, from: 0, to: 0, width: 0.18 },
  { start: 4050, end: 4930, phase: 2, from: 0.1, to: -1.35, width: 0.12 },
  { start: 4130, end: 4870, phase: 0, from: 0.48, to: 0.48, width: 0.12 },
  { start: 5550, end: 6080, phase: 1, from: 0, to: 0.4, width: 0.22 },
  { start: 6100, end: 6500, phase: 2, from: -0.4, to: -0.4, width: 0.24 },
];
export const GATES = [
  { s: 730, phase: 0, center: 0, width: 1, full: true },
  { s: 1240, phase: 1, center: 0, width: 0.38 },
  { s: 3300, phase: 2, center: -0.38, width: 0.35 },
  { s: 5180, phase: 1, center: 0, width: 1, full: true },
  { s: 6350, phase: 2, center: 0, width: 1, full: true },
  ...PHASE_CHAINS.flatMap(chain => chain.gates.map(gate => ({ ...gate, center: 0, width: 1, full: true, chainId: chain.id }))),
].sort((a, b) => a.s - b.s);
export function stripCenter(strip, s) {
  return strip.from + (strip.to - strip.from) * clamp((s - strip.start) / (strip.end - strip.start), 0, 1);
}
export function lateralDistance(a, b, s) {
  return Math.abs(section(s).closed ? wrap(a - b) : a - b);
}
export function onStrip(strip, s, u) {
  return s >= strip.start && s <= strip.end && lateralDistance(u, stripCenter(strip, s), s) <= strip.width;
}
