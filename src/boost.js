export const BOOST = { capacity: 100, drain: 25, regen: 5, delay: 2.5, minimum: 15 };

export class BoostMeter {
  constructor({ regen = BOOST.regen } = {}) { this.regen = regen; this.reset(); }
  reset() { this.energy = BOOST.capacity; this.cooldown = 0; this.active = false; this.locked = false; }
  step(dt, held, braking) {
    if (!held) this.locked = false;
    if (braking && held) this.locked = true;
    const canStart = this.active || this.energy >= BOOST.minimum;
    this.active = Boolean(held && !braking && !this.locked && canStart && this.energy > 0);
    if (this.active) {
      this.energy = Math.max(0, this.energy - BOOST.drain * dt);
      this.cooldown = BOOST.delay;
      if (this.energy < 1e-8) { this.energy = 0; this.active = false; this.locked = true; }
    } else {
      const regenTime = Math.max(0, dt - this.cooldown);
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.energy = Math.min(BOOST.capacity, this.energy + this.regen * regenTime);
      // Holding an unavailable boost never auto-fires as soon as charge returns.
      if (held && !canStart) this.locked = true;
    }
    return this.active;
  }
}
