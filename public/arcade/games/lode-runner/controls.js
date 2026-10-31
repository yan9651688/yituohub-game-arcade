(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LodeControls = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MOVES = ['up', 'down', 'left', 'right'];
  const DIGS = ['digLeft', 'digRight'];
  const SPEEDS = [0.75, 1, 1.25];
  const speedValue = value => SPEEDS.includes(Number(value)) ? Number(value) : 1;

  // Keep input edges until a simulation tick consumes them. A quick press and
  // release must not disappear between ticks. Holding a key is still continuous.
  // Movement and digging are separate, so a failed dig can fall back to moving.
  class InputBuffer {
    constructor() { this.held = new Map(); this.moves = []; this.digs = []; }
    enqueue(action, source) {
      const queue = MOVES.includes(action) ? this.moves : DIGS.includes(action) ? this.digs : null;
      if (!queue) return;
      // Bound an unusual event burst without permitting seconds of stale input.
      if (queue.length === 8) queue.shift();
      queue.push({action, source});
    }
    press(source, action) {
      if (this.held.get(source) === action) return;
      this.held.delete(source);
      this.held.set(source, action);
      this.enqueue(action, source);
    }
    release(source, cancelled = false) {
      this.held.delete(source);
      if (cancelled) {
        this.moves = this.moves.filter(item => item.source !== source);
        this.digs = this.digs.filter(item => item.source !== source);
      }
    }
    tap(action) { this.enqueue(action, null); }
    sample() {
      const active = [...this.held.values()].reverse();
      const movement = this.moves.shift()?.action || active.find(action => MOVES.includes(action));
      const dig = this.digs.shift()?.action || active.find(action => DIGS.includes(action));
      const input = {};
      if (movement) input.action = movement;
      if (dig) input[dig] = true;
      return input;
    }
    clear() { this.held.clear(); this.moves = []; this.digs = []; }
  }
  return {InputBuffer, SPEEDS, speedValue};
});
