// Keep independent physical inputs alive until each is released. A second finger
// lifting from steering must not release racing, nor may one Shift release the other.
export class HoldAction {
  constructor() { this.keys = new Set(); this.pointers = new Set(); }
  keyDown(code) { if (['Space', 'ShiftLeft', 'ShiftRight'].includes(code)) this.keys.add(code); }
  keyUp(code) { this.keys.delete(code); }
  pointerDown(id) { this.pointers.add(id); }
  pointerUp(id) { this.pointers.delete(id); }
  clear() { this.keys.clear(); this.pointers.clear(); }
  get active() { return this.keys.size > 0 || this.pointers.size > 0; }
}
