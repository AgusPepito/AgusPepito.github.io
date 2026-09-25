import { section, wrap, frame } from './track.js';

// Analytic coast distance: no assumed future boost, strip acceleration or steering.
function coastRange(speed, time) {
  let distance = 0;
  for (const [target, rate] of speed > 110 ? [[154, 28], [110, 8]] : [[110, 24]]) {
    if (speed > 110 && speed <= target) continue;
    const duration = Math.min(time, Math.abs(speed - target) / rate);
    const acceleration = Math.sign(target - speed) * rate;
    distance += speed * duration + acceleration * duration * duration / 2;
    speed += acceleration * duration; time -= duration;
  }
  return distance + speed * time;
}

export function gapJumpCue(race, gap) {
  if (!gap || !gapAt(gap.start + 0.1, race.u)) return null;
  // Use the largest sampled track metric so bends cannot overstate forward range.
  let metric = 1;
  for (let i = 0; i <= 8; i++) metric = Math.max(metric, frame(gap.start + (gap.end - gap.start) * i / 8, race.u).metric);
  const speed = race.brakeTime > 0 ? Math.min(race.speed, race.brakeTarget) : race.speed;
  const range = coastRange(speed, JUMP.duration - 0.05) / metric;
  const latest = gap.start - 2;
  const earliest = Math.max(gap.start - speed / metric * 0.2, gap.end + 8 - range);
  const enough = earliest <= latest;
  const airborne = race.airborne && race.jumpTime >= 0;
  return { earliest, latest, enough, airborne, range,
    bandStart: enough ? earliest : gap.start - 10,
    ready: !airborne && enough && race.s >= earliest && (race.s <= latest || race.edgeGrace > 0),
    near: gap.start - race.s < speed / metric * 1.5,
  };
}

// Barrier clearance includes the nose entering and tail leaving the full depth.
// Estimate a launch window from the same piecewise jump curve used by Race.
// Bound forward travel between coasting/current braking and continued boost;
// recompute before launch as speed and braking change. No physics is modified.
export function barrierJumpCue(race, obstacle) {
  const required=(obstacle.height??2.4)+JUMP.bodyHalfHeight-JUMP.hover+.18;
  if(required>=JUMP.peak)return null;
  const ratio=Math.max(0,required/JUMP.peak);
  const riseTime=JUMP.rise*(1-Math.sqrt(1-ratio))+.025;
  const fallTime=JUMP.rise+JUMP.fall*(-.3+Math.sqrt(.09+2.8*(1-ratio)))/1.4-.04;
  let minMetric=Infinity,maxMetric=1;
  for(let i=0;i<=8;i++){
    const s=race.s+(obstacle.s+obstacle.depth+3-race.s)*i/8;
    const metric=frame(s,race.u).metric;minMetric=Math.min(minMetric,metric);maxMetric=Math.max(maxMetric,metric);
  }
  const speed=race.speed;
  const fastTravel=t=>{
    const accelerating=Math.min(t,Math.max(0,250-speed)/150);
    return speed*accelerating+75*accelerating*accelerating+Math.max(speed,250)*(t-accelerating);
  };
  const slowTravel=t=>race.brakeTime>0
    ? Math.min(speed,race.brakeTarget)*Math.min(t,race.brakeTime)+coastRange(Math.min(speed,race.brakeTarget),Math.max(0,t-race.brakeTime))
    : coastRange(speed,t);
  const latest=obstacle.s-1.95-fastTravel(riseTime)/minMetric;
  const clearanceStart=obstacle.s+obstacle.depth+1.95-slowTravel(fallTime)/maxMetric;
  const earliest=Math.max(clearanceStart,latest-Math.max(8,Math.min(18,speed*.12)));
  const enough=earliest<=latest;
  return {earliest,latest,enough,bandStart:enough?earliest:latest-5,
    ready:enough&&!race.airborne&&race.s>=earliest&&race.s<=latest,
    near:obstacle.s-race.s<speed/maxMetric*2.5,
    range:slowTravel(JUMP.duration)/maxMetric,airborne:race.airborne&&race.jumpTime>=0};
}

export const JUMP = { peak: 4.9, rise: 0.32, fall: 0.98, duration: 1.3, edgeGrace: 0.1, gravity: 32, hover: 1.05, bodyHalfHeight: 0.65 };
// Fast ease-out launch, then an accelerating descent with no stationary apex hold.
// Continue below the road when a jump ends over a gap instead of snapping onto it.
export function jumpPose(time) {
  if (time < JUMP.rise) {
    const t = Math.max(0, time) / JUMP.rise;
    return { height: JUMP.peak * (1 - (1 - t) ** 2), velocity: 2 * JUMP.peak * (1 - t) / JUMP.rise };
  }
  if (time <= JUMP.duration) {
    const t = (time - JUMP.rise) / JUMP.fall;
    return { height: JUMP.peak * (1 - 0.3 * t - 0.7 * t * t), velocity: -JUMP.peak * (0.3 + 1.4 * t) / JUMP.fall };
  }
  const t = time - JUMP.duration, velocity = -JUMP.peak * 1.7 / JUMP.fall;
  return { height: velocity * t - JUMP.gravity * t * t / 2, velocity: velocity - JUMP.gravity * t };
}
export const GAPS = [];
export function gapAt(s, u) {
  return GAPS.find(gap => s >= gap.start && s < gap.end && (gap.full ||
    Math.abs(section(s).closed ? wrap(u - gap.center) : u - gap.center) < gap.width));
}

// Exact longitudinal cuts and lateral masks shared by every pavement/marking ribbon.
export function surfaceSlices(start, end) {
  const cuts = [start, end, ...GAPS.flatMap(g => [g.start, g.end]).filter(s => s > start && s < end)].sort((a, b) => a - b);
  return cuts.slice(0, -1).map((a, i) => {
    const b = cuts[i + 1], mid = (a + b) / 2;
    let spans = [[-4, 4]];
    for (const gap of GAPS.filter(g => mid >= g.start && mid < g.end)) {
      if (gap.full) { spans = []; break; }
      for (const offset of section(mid).closed ? [-4, -2, 0, 2, 4] : [0]) {
        const low = gap.center + offset - gap.width, high = gap.center + offset + gap.width;
        spans = spans.flatMap(([l, r]) => high <= l || low >= r ? [[l, r]] :
          [[l, Math.max(l, low)], [Math.min(r, high), r]].filter(([x, y]) => y > x));
      }
    }
    return { start: a, end: b, spans };
  });
}
