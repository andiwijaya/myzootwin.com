import { TICK_MS } from './state.ts';

export const MAX_FRAME_MS = 250;
export const MAX_STEPS_PER_FRAME = 3;

/** Receives elapsed time from the existing RAF owner; schedules nothing itself. */
export function createFixedClock(step: () => void) {
  let accumulator = 0;
  let paused = false;
  let disposed = false;
  let droppedMs = 0;
  return {
    advance(deltaMs: number) {
      if (!Number.isFinite(deltaMs) || deltaMs < 0 || deltaMs > Number.MAX_SAFE_INTEGER) throw new RangeError('Invalid frame duration');
      if (disposed || paused) return 0;
      const accepted = Math.min(deltaMs, MAX_FRAME_MS);
      droppedMs += deltaMs - accepted;
      accumulator += accepted;
      let steps = 0;
      while (accumulator + 1e-7 >= TICK_MS && steps < MAX_STEPS_PER_FRAME) {
        step();
        accumulator = Math.max(0, accumulator - TICK_MS);
        steps++;
      }
      // Keep at most a sub-tick remainder even if the budget changes later.
      if (accumulator >= TICK_MS) {
        const dropped = Math.floor(accumulator / TICK_MS) * TICK_MS;
        accumulator -= dropped;
        droppedMs += dropped;
      }
      return steps;
    },
    setPaused(value: boolean) { if (paused !== value) accumulator = 0; paused = value; },
    reset() { accumulator = 0; droppedMs = 0; },
    dispose() { disposed = true; accumulator = 0; },
    inspect: () => ({ accumulatorMs: accumulator, paused, disposed, droppedMs }),
  };
}
