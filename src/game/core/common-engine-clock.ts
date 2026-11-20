import { createSimulationRuntime } from '@andiwijaya/common-engine';
import { MAX_FAST_STEPS_PER_FRAME, MAX_FRAME_MS, MAX_STEPS_PER_FRAME, type createFixedClock } from './fixed-clock.ts';
import { TICK_MS, type SimulationSpeed } from './state.ts';

export const createCommonEngineClock: typeof createFixedClock = (step, initialSpeed = 1) =>
  createSimulationRuntime<SimulationSpeed, never, void, void>({
    stepMs: TICK_MS,
    maxFrameMs: MAX_FRAME_MS,
    initialSpeed,
    stepsPerFrame: { 1: MAX_STEPS_PER_FRAME, 10: MAX_FAST_STEPS_PER_FRAME },
    step,
    applyCommand: () => undefined,
    readSnapshot: () => undefined,
  });
