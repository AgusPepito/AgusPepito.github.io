import { Vector3 } from 'three';
import {transitionSection,transitionPoint,runSection} from './transition-profile.js';

export let LENGTH = 2400;
let profile = 'flat',profileRuns=[],profileMotion=[];
export function setTrackProfile(length, shape, runs=[], motion=[]) { LENGTH = length; profile = shape; profileRuns=runs; profileMotion=motion; }
export function trackProfileSnapshot() { return { length: LENGTH, shape: profile, runs:profileRuns, motion:profileMotion }; }
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
export function profileSection(s,shape,runs=[]) {
  if(shape==='authored')return runSection(runs,s);
  if(shape==='transition-09'||shape==='transition-10')return transitionSection(shape.slice(-2),s);
  if (shape === 'flat'||shape==='gap-flat') return { curl: 0, halfWidth: 18, closed: false, name: 'OPEN ROAD' };
  if (shape === 'outside' || shape === 'inside') return { curl: shape === 'inside' ? 1 : -1, halfWidth: Math.PI * RADIUS, closed: true, name: shape === 'inside' ? 'INSIDE TUBE' : 'OUTSIDE TUBE' };
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
export function section(s) {return profileSection(s,profile,profileRuns);}

// Authored displacement increments have smooth, stationary ends. Geometry,
// collision and the chase camera all follow this same banking transform.
export function trackMotionAt(s) {
  let x=0,y=0,roll=0;
  for(const move of profileMotion){
    if(s<=move.start)continue;
    const t=smooth((s-move.start)/(move.end-move.start));
    x+=move.x*t;y+=move.y*t;roll+=move.roll*t;
  }
  return {x,y,roll};
}

export function point(s, u, target = new Vector3()) {
  if(profile==='transition-09'||profile==='transition-10')return target.set(...transitionPoint(profile.slice(-2),s,u));
  const { curl, halfWidth } = section(s), lateral = u * halfWidth, k = curl / RADIUS;
  const x = Math.abs(k) < 1e-7 ? lateral : Math.sin(k * lateral) / k;
  const y = Math.abs(k) < 1e-7 ? 0 : (1 - Math.cos(k * lateral)) / k;
  // Authored bends have truly straight approaches and exits; z remains monotonic.
  const tubeReview = profile === 'outside' || profile === 'inside' || profile === 'authored' || profile === 'gap-flat';
  const centerX = tubeReview ? 0 : profile === 'flat' ? 18 * smooth((s / LENGTH - 0.15) / 0.2) - 36 * smooth((s / LENGTH - 0.4) / 0.2) + 18 * smooth((s / LENGTH - 0.7) / 0.2) : 95 * smooth((s - 300) / 550) - 170 * smooth((s - 1450) / 750)
    + 210 * smooth((s - 2950) / 500) - 180 * smooth((s - 4050) / 900)
    + 45 * smooth((s - 5900) / 450);
  const centerY = profile === 'flat' || tubeReview ? 0 : 24 * smooth((s - 1500) / 800) - 40 * smooth((s - 4150) / 900);
  const motion=trackMotionAt(s),c=Math.cos(motion.roll),sn=Math.sin(motion.roll);
  return target.set(x*c-y*sn+centerX+motion.x, x*sn+y*c+centerY+motion.y, -s);
}

// Same finite-difference frame as gameplay, with reusable vectors for geometry
// generation. The returned object is scratch storage and must not be retained.
export function createFrameSampler() {
  const p = new Vector3(), along = new Vector3(), forward = new Vector3(), right = new Vector3(), normal = new Vector3(), scratch = new Vector3();
  const result = {p, along, forward, right, normal, metric: 0};
  // Many gate vertices share a longitudinal station. Cache only the station's
  // centerline/curvature, not a rounded position or interpolated frame.
  const stations = new Map(), authoredTransition = profile.startsWith('transition-');
  const samplePoint = (s, u, target) => {
    if (authoredTransition) return point(s, u, target);
    let data = stations.get(s);
    if (!data) {
      const road = section(s), origin = point(s, 0);
      const roll=trackMotionAt(s).roll;
      data = {k:road.curl/RADIUS,half:road.halfWidth,x:origin.x,y:origin.y,c:Math.cos(roll),sn:Math.sin(roll)};
      if (stations.size >= 8192) stations.clear();
      stations.set(s,data);
    }
    const lateral = u * data.half, k = data.k;
    const x = Math.abs(k) < 1e-7 ? lateral : Math.sin(k*lateral)/k;
    const y = Math.abs(k) < 1e-7 ? 0 : (1-Math.cos(k*lateral))/k;
    return target.set(x*data.c-y*data.sn+data.x,x*data.sn+y*data.c+data.y,-s);
  };
  return (s, u) => {
    samplePoint(s, u, p);
    samplePoint(s + .1, u, along).sub(samplePoint(s - .1, u, scratch)).multiplyScalar(5);
    forward.copy(along).normalize();
    samplePoint(s, u + .0001, right).sub(samplePoint(s, u - .0001, scratch)).normalize();
    normal.copy(right).cross(forward).normalize(); right.copy(forward).cross(normal).normalize();
    result.metric = along.length(); return result;
  };
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

// Runtime arrays keep their identities; configureLevel supplies authored data.
export const STRIPS = [];
export const GATES = [];
export function stripCenter(strip, s) {
  return strip.from + (strip.to - strip.from) * clamp((s - strip.start) / (strip.end - strip.start), 0, 1);
}
export function lateralDistance(a, b, s) {
  return Math.abs(section(s).closed ? wrap(a - b) : a - b);
}
export function onStrip(strip, s, u) {
  const halfWidth=strip.widthMeters?strip.widthMeters/(2*section(s).halfWidth):strip.width;
  return s >= strip.start && s <= strip.end && lateralDistance(u, stripCenter(strip, s), s) <= halfWidth;
}
