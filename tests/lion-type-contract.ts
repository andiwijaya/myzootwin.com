import type {LionAnimal,ElephantAnimal} from '../src/game/core/species.ts';
// This file uses only erased compile-time contracts; not part of the runtime.
export function scope(lion:LionAnimal,elephant:ElephantAnimal){
 // @ts-expect-error A lion cannot acquire the elephant bathing phase.
 lion.motion.phase='bathe';
 // @ts-expect-error Elephant identity cannot be assigned to a lion.
 lion.speciesId=elephant.speciesId;
 // @ts-expect-error A female-only elephant cannot represent Raka.
 elephant.sex='male';
}
