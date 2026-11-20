import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createCommonEngineClock } from '../src/game/core/common-engine-clock.ts';
import { createSimulation } from '../src/game/core/simulation.ts';

test('Common Engine clock preserves MyZooTwin care, ticks and pause behavior', () => {
  const fixture = new URL('./fixtures/elephant-legacy-v1.json', import.meta.url);
  const { state } = JSON.parse(readFileSync(fixture, 'utf8')).entries.midQ02;
  const native = createSimulation(state);
  const pilot = createSimulation(state, undefined, createCommonEngineClock);

  try {
    for (const simulation of [native, pilot]) {
      const { revision, stock } = simulation.waterView();
      assert.ok(simulation.water('refill', revision, simulation.commandRevision()).ok);
      assert.ok(simulation.waterView().stock > stock);
    }

    for (const speed of [1, 10]) {
      native.setSpeed(speed);
      pilot.setSpeed(speed);
      for (const elapsed of [99, 1, 25, 450, 75, 200]) {
        assert.equal(pilot.advance(elapsed), native.advance(elapsed));
        assert.deepEqual(pilot.snapshot(), native.snapshot());
      }
    }
    assert.ok(pilot.snapshot().tick > state.tick);

    native.setPaused(true);
    pilot.setPaused(true);
    assert.equal(pilot.advance(250), 0);
    assert.deepEqual(pilot.snapshot(), native.snapshot());
    native.setPaused(false);
    pilot.setPaused(false);
    assert.equal(pilot.frame(1000), native.frame(1000));
    assert.equal(pilot.frame(1100), native.frame(1100));
    assert.deepEqual(pilot.snapshot(), native.snapshot());
  } finally {
    native.dispose();
    pilot.dispose();
  }
});
