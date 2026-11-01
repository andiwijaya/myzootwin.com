import {WATER_RULES} from '../animals/watering.ts';
import {FOOD_RULES} from '../animals/feeding.ts';
import {emptyMotion} from '../animals/autonomy.ts';
import { MISSION_IDS, SPECIES_ID, type Animal, type ZooSaveV1 } from './state.ts';

export function createInitialState(seed = 0x5a17c0de): ZooSaveV1 {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff) throw new RangeError('Seed must be a nonzero uint32');
  const gate = { x: 1, z: 8 };
  const animals: Animal[] = ['macaw-1', 'macaw-2'].map(id => ({ id, speciesId: SPECIES_ID, habitatId: null, position: null, target: null, targetResourceId: null, hunger: FOOD_RULES.startingHunger, thirst: WATER_RULES.startingThirst, energy: 100, habitatFit: 0, enrichment: 0, welfare: 0, currentBehavior: 'idle',motion:emptyMotion(),foodEaten:0,waterDrunk:0 }));
  return {
    schemaVersion: 1, randomSeed: seed, randomState: seed, tick: 0, gameTimeMs: 0, currency: 1500,
    world: { width: 12, height: 10, gate, tiles: Array.from({ length: 120 }, (_, index) => {
      const cell = { x: index % 12, z: Math.floor(index / 12) };
      return { cell, terrain: cell.x === 9 && cell.z > 0 && cell.z < 9 ? 'creek' : 'land', occupantId: null, path: cell.x === gate.x && cell.z === gate.z };
    }), habitats: [], resources: [] },
    animals, visitors: [], admissions: [],
    ledger: [{ id: 'ledger-starter', operationId: 'starter-grant', kind: 'starter', amount: 1500, balanceAfter: 1500, tick: 0, relatedId: null }],
    missions: { currentId: MISSION_IDS[0], completedIds: [], rewards: [], objectives: { habitatConnected: false, birdsFedIds: [], birdsWateredIds: [], comfortableTicks: 0, viewedVisitorIds: [], thrivingTicks: 0 } },
    preferences: { locale: 'en', graphics: 'auto', muted: true, reducedMotion: false },
  };
}
