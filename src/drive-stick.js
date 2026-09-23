import { clamp } from './track.js';

export const STICK = { deadzone: 0.12, enter: 0.7, exit: 0.55 };
export class DriveStick {
  constructor() { this.clear(); }
  clear() { this.mode = 'cruise'; this.value = { x: 0, y: 0, racing: false, braking: false, knobX: 0, knobY: 0 }; }
  sample(x, y) {
    const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
    if (y >= STICK.enter) this.mode = 'fast';
    else if (y <= -STICK.enter) this.mode = 'brake';
    else if ((this.mode === 'fast' && y < STICK.exit) || (this.mode === 'brake' && y > -STICK.exit)) this.mode = 'cruise';
    const axis = (v, max) => Math.sign(v) * clamp((Math.abs(v) - STICK.deadzone) / (max - STICK.deadzone), 0, 1);
    this.value = { x: axis(x, 1), y: this.mode === 'cruise' ? axis(y, STICK.enter) : 0,
      racing: this.mode === 'fast', braking: this.mode === 'brake', knobX: x, knobY: y };
    return this.value;
  }
}
