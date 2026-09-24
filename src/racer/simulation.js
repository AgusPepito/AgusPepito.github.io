import { LENGTH, GATES, STRIPS, clamp, wrap, section, frame, onStrip, lateralDistance } from './track.js';
import { BoostMeter } from '../boost.js';
import { OBSTACLES, wallHit } from './obstacles.js';
import { JUMP, gapAt, jumpPose } from './jumps.js';

export class Race {
  constructor() { this.mode = 'phase'; this.reset(); }
  reset() {
    this.boost = new BoostMeter({ regen: 6 });
    Object.assign(this, { s: 0, u: 0, speed: 95, lateralSpeed: 0, phase: 0, time: 0,
      state: 'ready', boosting: false, stripBoost: false, boostActive: false, boostBlend: 0, thrustBlend: 0,
      height: 0, verticalSpeed: 0, airborne: false, landing: 0, jumpTime: -1, edgeGrace: 0, jumpOriginHeight: 0,
      brakeTime: 0, brakeCooldown: 0, brakeTarget: 0, brakeRate: 0,
      scrape: 0, passed: 0, splits: [], cause: '', crashKind: '', finishTime: null });
  }
  step(dt, steer, boostHeld, jumpPressed = false, brakePressed = false) {
    if (this.state !== 'running') return;
    const oldS = this.s, oldU = this.u, oldTime = this.time, oldHeight = this.height;
    this.time += dt;
    this.brakeCooldown = Math.max(0, this.brakeCooldown - dt);
    if (brakePressed && this.brakeCooldown === 0) {
      this.brakeTime = 0.25; this.brakeCooldown = 0.65;
      this.brakeTarget = Math.min(this.speed, Math.max(65, this.speed * 0.72));
      this.brakeRate = (this.speed - this.brakeTarget) / this.brakeTime;
    }
    const braking = this.brakeTime > 0;
    this.landing = Math.max(0, this.landing - dt);
    const groundedJump = !this.airborne && (this.mode === 'drive' || !gapAt(this.s, this.u));
    const graceJump = this.airborne && this.jumpTime < 0 && this.edgeGrace > 0;
    if (jumpPressed && (groundedJump || graceJump)) {
      this.jumpOriginHeight = this.height;
      this.airborne = true; this.jumpTime = 0; this.edgeGrace = 0; this.verticalSpeed = jumpPose(0).velocity;
    }
    this.edgeGrace = Math.max(0, this.edgeGrace - dt);
    this.scrape = Math.max(0, this.scrape - dt);
    this.stripBoost = !braking && this.mode === 'phase' && !this.airborne && !gapAt(this.s, this.u) && STRIPS.some(strip => strip.phase === this.phase && onStrip(strip, this.s, this.u));
    this.boostActive = this.boost.step(dt, boostHeld, braking);
    this.boosting = this.stripBoost || this.boostActive;
    this.boostBlend += ((this.boosting ? 1 : 0) - this.boostBlend) * (1 - Math.exp(-7 * dt));
    this.thrustBlend += ((this.boostActive ? 1 : 0) - this.thrustBlend) * (1 - Math.exp(-(this.boostActive ? 12 : 5) * dt));
    const target = this.boostActive ? (this.stripBoost ? 285 : 250) : this.stripBoost ? 154 : 110;
    // A committed burst, with a recoverable coast when released ahead of a sequence.
    const accel = this.speed > target ? (this.speed > 154 ? 28 : 8) : this.boostActive ? 150 : this.stripBoost ? 38 : 24;
    if (braking) {
      this.speed = Math.max(this.brakeTarget, this.speed - this.brakeRate * Math.min(dt, this.brakeTime));
      this.brakeTime = Math.max(0, this.brakeTime - dt);
    } else this.speed += clamp(target - this.speed, -accel * dt, accel * dt);
    const steeringSurface = section(this.s);
    // Tubes require much longer lateral trips than flat roads. Blend the extra
    // steering speed through the roll-in, and arrest drift quickly on release.
    const steeringSpeed = 30 + 22 * Math.abs(steeringSurface.curl);
    const steeringResponse = steer === 0 ? 20 : 14;
    this.lateralSpeed += (steer * steeringSpeed - this.lateralSpeed) * (1 - Math.exp(-steeringResponse * dt));
    this.u += this.lateralSpeed * dt / steeringSurface.halfWidth;
    this.s += this.speed * dt / frame(this.s, this.u).metric;
    const road = section(this.s);
    if (road.closed) this.u = wrap(this.u);
    else {
      const edge = 1 - 0.85 / road.halfWidth;
      if (Math.abs(this.u) > edge) {
        this.u = clamp(this.u, -edge, edge); this.lateralSpeed = 0;
        this.speed = Math.max(40, this.speed - 35 * dt); this.scrape = 0.2;
      }
    }
    const unsupported = this.mode === 'phase' && gapAt(this.s, this.u);
    if (!this.airborne && unsupported) {
      this.airborne = true; this.jumpTime = -1; this.verticalSpeed = 0;
      this.edgeGrace = Math.max(0, JUMP.edgeGrace - dt);
    }
    if (this.airborne) {
      if (this.jumpTime >= 0) {
        this.jumpTime += dt;
        const pose = jumpPose(this.jumpTime); this.height = this.jumpOriginHeight + pose.height; this.verticalSpeed = pose.velocity;
      } else {
        this.height += this.verticalSpeed * dt - JUMP.gravity * dt * dt / 2;
        this.verticalSpeed -= JUMP.gravity * dt;
      }
      if (this.height <= 0 && this.verticalSpeed < 0) {
        const contact = oldHeight > 0 ? clamp(oldHeight / (oldHeight - this.height), 0, 1) : 0;
        const du = road.closed ? wrap(this.u - oldU) : this.u - oldU;
        const contactS = oldS + (this.s - oldS) * contact, contactU = oldU + du * contact;
        const contactGap = this.mode === 'phase' && gapAt(contactS, contactU);
        if (!unsupported && !contactGap && oldHeight >= -0.05) {
          this.height = 0; this.verticalSpeed = 0; this.airborne = false; this.jumpTime = -1; this.edgeGrace = 0; this.jumpOriginHeight = 0; this.landing = 0.18;
        } else if (this.height < -1.4 || (!unsupported && oldHeight < -0.05)) {
          this.state = 'crashed'; this.crashKind = 'gap';
          this.cause = 'Missed the landing. Jump near the edge and use boost for extra distance';
          this.boosting = false; this.boostActive = false; this.boost.active = false; return;
        }
      }
    }
    for (const obstacle of this.mode === 'phase' ? OBSTACLES : []) {
      const hit = wallHit(obstacle, oldS, this.s, oldU, this.u, oldHeight, this.height);
      if (hit === null) continue;
      const du = section(obstacle.s).closed ? wrap(this.u - oldU) : this.u - oldU;
      this.s = oldS + (this.s - oldS) * hit;
      this.u = section(obstacle.s).closed ? wrap(oldU + du * hit) : oldU + du * hit;
      this.time = oldTime + dt * hit; this.state = 'crashed'; this.crashKind = 'wall';
      this.height = oldHeight + (this.height - oldHeight) * hit;
      this.cause = obstacle.kind === 'jump' ? 'Jump required: hit the low barrier' : obstacle.kind === 'hole' ? 'Hit the wall or the roof of its opening' : 'Hit a solid wall';
      this.boosting = false; this.boostActive = false; this.boost.active = false; return;
    }
    for (const gate of this.mode === 'phase' ? GATES : []) {
      if (oldS < gate.s && this.s >= gate.s) {
        const fraction = (gate.s - oldS) / (this.s - oldS);
        const delta = section(gate.s).closed ? wrap(this.u - oldU) : this.u - oldU;
        const crossingU = oldU + delta * fraction;
        const overlaps = gate.full || lateralDistance(crossingU, gate.center, gate.s) <= gate.width + 0.75 / section(gate.s).halfWidth;
        if (overlaps && this.phase !== gate.phase) {
          this.s = gate.s; this.u = section(gate.s).closed ? wrap(crossingU) : crossingU;
          this.time = oldTime + dt * fraction; this.state = 'crashed';
          this.crashKind = 'phase'; this.cause = `Barrier required phase ${gate.phase + 1}`;
          this.boosting = false; this.boostActive = false; this.boost.active = false; return;
        }
        this.passed++;
      }
    }
    for (const distance of [LENGTH]) {
      if (oldS < distance && this.s >= distance) {
        const at = oldTime + dt * (distance - oldS) / (this.s - oldS);
        this.splits.push(at);
      }
    }
    if (this.s >= LENGTH) {
      this.s = LENGTH; this.state = 'checkpoint'; this.finishTime = this.splits.at(-1); this.time = this.finishTime;
      this.boosting = false; this.boostActive = false; this.boost.active = false;
    }
  }
}
