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
  const t = smooth((s - a[0]) / (b[0] - a[0]));
  const center = lerp(a[1], b[1], t);
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
  return { s, center, width, tight, label, hint };
}

export const OBSTACLES = [
  { s: 640, offset: -4.9, w: 3.1, d: 4.8 },
  { s: 805, offset: 4.9, w: 3.1, d: 4.8 },
  { s: 980, offset: -4.9, w: 3.1, d: 4.8 },
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
    result.push({ ...obstacle, s, x: trackAt(s).center + obstacle.offset });
  }
  return result;
}
