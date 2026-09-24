import { clamp, lerp, roadPoint, trackAt } from './track.js';
import { forkSample, forkFrame } from './forks.js';
import { moveVehicle } from './neutral-traffic.js';

// Two occupied lanes per group, with a changing escape lane. Tough enough that
// holding the firing line isn't a substitute for steering at normal speed.
export const BYPASS_TRAFFIC = {
  hp: 100, width: 2.2, depth: 3.4, impact: 18,
  cruiseSpeed: 8, fastSpeed: 30, firstGroup: 65, groupSpacing: 60,
  openLanes: [-1, 1, 0, -1, 1],
};

export function createBypassTraffic(fork, nextId) {
  const cars = [], rules = BYPASS_TRAFFIC;
  for (const [group, openLane] of rules.openLanes.entries()) {
    let stagger = 0;
    for (const lane of [-1, 0, 1]) {
      if (lane === openLane * fork.side) continue;
      const car = {
        id: nextId(), civilian: true, neutral: true, active: true,
        bypassFork: fork, bypassLane: lane,
        s: fork.start + rules.firstGroup + group * rules.groupSpacing + stagger,
        w: rules.width, d: rules.depth,
        halfWidth: rules.width / 2, halfDepth: rules.depth / 2,
        hp: rules.hp, maxHp: rules.hp,
      };
      placeOnBypass(car);
      car.oldX = car.x; car.oldZ = car.z;
      cars.push(car); stagger += 6;
    }
  }
  return cars;
}

function placeOnBypass(car) {
  const sample = forkSample(car.bypassFork, car.s);
  car.lateral = sample.center + car.bypassLane * sample.width / 3;
  Object.assign(car, roadPoint(car.s, car.lateral));
  car.yaw = forkFrame(car.bypassFork, car.s).yaw;
}

export function moveBypassTraffic(car, dt, fastFraction) {
  const speed = lerp(BYPASS_TRAFFIC.cruiseSpeed, BYPASS_TRAFFIC.fastSpeed, clamp(fastFraction, 0, 1));
  if (!car.bypassFork) { moveVehicle(car, dt, speed); return; }
  car.oldX = car.x; car.oldZ = car.z;
  const fork = car.bypassFork;
  // Seed the queue beyond view when the route is prepared, then let it roll
  // when the player reaches the junction. No cars materialize beside the player.
  if (fork.state === 'approach') return;
  car.s += speed * dt / Math.max(1, forkFrame(fork, car.s).scale);
  if (car.s < fork.end) { placeOnBypass(car); return; }
  // Continue onto the highway through the same merge rather than disappearing.
  const end = forkSample(fork, fork.end);
  car.lane = (end.center + car.bypassLane * end.width / 3)
    / (trackAt(fork.end).width / 2 - car.halfWidth - 0.5);
  car.bypassFork = null;
  moveVehicle(car, 0, speed);
}
