/** Compile-only negative contracts, included by the repository's strict Astro check. */
import type {AnimalMotion, ZooSaveV1} from '../../src/game/core/state.ts';
import type {ElephantAnimal, ElephantMotion, ZooAnimal} from '../../src/game/core/species.ts';
import {isMacaw} from '../../src/game/core/species.ts';
import {reserveBird} from '../../src/game/animals/autonomy.ts';

export function speciesTypeContract(animal:ZooAnimal,elephant:ElephantAnimal,birdMotion:AnimalMotion,groundMotion:ElephantMotion,legacy:ZooSaveV1){
  if(isMacaw(animal))reserveBird(animal);
  // @ts-expect-error Ground elephants cannot enter the macaw FSM.
  reserveBird(elephant);
  // @ts-expect-error Bird flight/perch motion is not ground motion.
  groundMotion=birdMotion;
  // @ts-expect-error Ground waypoints cannot replace bird elevation and flight phases.
  birdMotion=groundMotion;
  // @ts-expect-error V1 remains macaw-only, even after shared species types exist.
  legacy.animals.push(elephant);
  return {birdMotion,groundMotion};
}
