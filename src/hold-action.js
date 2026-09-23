// Each action tracks independent keys/fingers so releasing one cannot cancel another.
export class HoldAction {
  constructor(codes = ['ShiftLeft', 'ShiftRight']) { this.codes = new Set(codes); this.keys = new Set(); this.pointers = new Set(); }
  keyDown(code) { if (this.codes.has(code)) this.keys.add(code); }
  keyUp(code) { this.keys.delete(code); }
  pointerDown(id) { this.pointers.add(id); }
  pointerUp(id) { this.pointers.delete(id); }
  clear() { this.keys.clear(); this.pointers.clear(); }
  get active() { return this.keys.size > 0 || this.pointers.size > 0; }
}
