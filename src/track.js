export const COURSE_LENGTH = 2100;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// A track sample is gameplay data. The renderer and collisions use the same shape.
const knots = [
  [0, 0, 44], [400, 0, 44], [580, 0, 15],
  [740, 18, 15], [920, -17, 15], [1100, 4, 15],
  [1290, 0, 44], [1590, 0, 44], [1750, -6, 16],
  [1890, 10, 16], [2100, 0, 44],
];

export function trackAt(distance) {
  const s = ((distance % COURSE_LENGTH) + COURSE_LENGTH) % COURSE_LENGTH;
  let i = 0;
  while (i < knots.length - 2 && s > knots[i + 1][0]) i++;
  const a = knots[i], b = knots[i + 1];
  const span = b[0] - a[0], u = (s - a[0]) / span;
  const t = smooth(u);
  const center = lerp(a[1], b[1], t);
  const slope = (b[1] - a[1]) * 6 * u * (1 - u) / span;
  const second = (b[1] - a[1]) * (6 - 12 * u) / (span * span);
  const width = lerp(a[2], b[2], t);
  const tight = clamp((44 - width) / 29, 0, 1);
  let label = 'OPEN CIRCUIT';
  let hint = 'Find your target. Make room.';
  if ((s >= 400 && s < 580) || (s >= 1590 && s < 1750)) {
    label = 'TRACK NARROWING'; hint = 'Find the gap. Stay off the walls.';
  } else if (s >= 580 && s < 1100) {
    label = 'THE CHANNEL'; hint = 'Read the bend. Pick your line.';
  } else if (s >= 1750 && s < 1890) {
    label = 'FINAL CHICANE'; hint = 'One clean line through.';
  } else if ((s >= 1100 && s < 1290) || s >= 1890) {
    label = 'OPENING UP'; hint = 'Space to move. Weapons free.';
  }
  return { s, center, width, tight, label, hint, slope, second };
}

// Shared road frame: forward runs along the curve; right runs across it.
// s parameterizes the centerline, lateral is measured in metres perpendicular to it.
export function roadFrame(s) {
  const road = trackAt(s), scale = Math.hypot(road.slope, 1);
  return { ...road, scale, fx: road.slope / scale, fz: -1 / scale,
    rx: 1 / scale, rz: road.slope / scale, yaw: -Math.atan(road.slope) };
}

export function roadPoint(s, lateral = 0) {
  const f = roadFrame(s);
  return { x: f.center + f.rx * lateral, z: -s + f.rz * lateral };
}

export function roadLineYaw(s, widthFraction = 0, inset = 0) {
  const a = roadPoint(s - 0.1, trackAt(s - 0.1).width * widthFraction + inset);
  const b = roadPoint(s + 0.1, trackAt(s + 0.1).width * widthFraction + inset);
  return Math.atan2(a.x - b.x, a.z - b.z);
}

// Project straight-flying shots back into road coordinates for bounds/culling.
export function roadCoordinates(x, z) {
  let s = -z;
  for (let i = 0; i < 5; i++) {
    const f = trackAt(s);
    const denominator = 1 + f.slope * f.slope - (x - f.center) * f.second;
    if (Math.abs(denominator) < 0.1) break;
    const correction = ((x - f.center) * f.slope - (z + s)) / denominator;
    s += clamp(correction, -20, 20);
    if (Math.abs(correction) < 1e-7) break;
  }
  const f = roadFrame(s);
  return { s, lateral: (x - f.center) * f.rx + (z + s) * f.rz };
}

// Correct longitudinal travel for bend length, so indicated speed stays in m/s.
export function advanceOnRoad(s, metres) {
  const midpoint = s + metres / roadFrame(s).scale / 2;
  return s + metres / roadFrame(midpoint).scale;
}

export const OBSTACLES = [
  { s: 190, offset: -10, w: 4.5, d: 5.5 },
  { s: 275, offset: 9, w: 4.5, d: 5.5 },
  { s: 365, offset: 0, w: 5, d: 5.5 },
  { s: 640, offset: -4.9, w: 3.1, d: 4.8 },
  { s: 725, offset: 4.9, w: 3.1, d: 4.8 },
  { s: 805, offset: 4.9, w: 3.1, d: 4.8 },
  { s: 980, offset: -4.9, w: 3.1, d: 4.8 },
  { s: 1060, offset: 4.9, w: 3.1, d: 4.8 },
  { s: 1350, offset: 9, w: 4.5, d: 5.5 },
  { s: 1440, offset: -9, w: 4.5, d: 5.5 },
  { s: 1530, offset: 0, w: 5, d: 5.5 },
  { s: 1790, offset: 5.2, w: 3.3, d: 4.8 },
  { s: 1870, offset: -5.2, w: 3.3, d: 4.8 },
];

export function obstaclesNear(distance, behind = 25, ahead = 180) {
  const result = [];
  const first = Math.max(0, Math.floor((distance - behind) / COURSE_LENGTH));
  const last = Math.floor((distance + ahead) / COURSE_LENGTH);
  for (let lap = first; lap <= last; lap++) for (const obstacle of OBSTACLES) {
    const s = lap * COURSE_LENGTH + obstacle.s;
    if (s < distance - behind || s > distance + ahead) continue;
    result.push({ ...obstacle, s, ...roadPoint(s, obstacle.offset), yaw: roadFrame(s).yaw });
  }
  return result;
}
