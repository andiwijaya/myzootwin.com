import type {Animal} from '../src/game/core/state.ts';
import type {ElephantAnimal,LionAnimal} from '../src/game/core/species.ts';
import {isGiraffe,type GiraffeAnimal,type GiraffeMotion,type GiraffeResource,type V4ZooAnimal,type ZooSaveV4} from '../src/game/core/giraffe-state.ts';
function narrow(animal:V4ZooAnimal){if(isGiraffe(animal)){const g:GiraffeAnimal=animal;return g.highBrowses;}return 0;}
function rejectOtherSpecies(bird:Animal,elephant:ElephantAnimal,lion:LionAnimal,giraffe:GiraffeAnimal){
 // @ts-expect-error Macaw ownership cannot become giraffe ownership.
 const a:GiraffeAnimal=bird;
 // @ts-expect-error Elephant ownership cannot become giraffe ownership.
 const b:GiraffeAnimal=elephant;
 // @ts-expect-error Lion ownership cannot become giraffe ownership.
 const c:GiraffeAnimal=lion;
 // @ts-expect-error A giraffe cannot enter the old macaw-only subsystem.
 const d:Animal=giraffe;
 return [a,b,c,d];
}
function rejectBehaviors(motion:GiraffeMotion,resource:GiraffeResource,save:ZooSaveV4){
 // @ts-expect-error Giraffes cannot roar.
 motion.phase='roar';
 // @ts-expect-error Giraffes cannot bathe or spray as elephants.
 motion.phase='spray';
 // @ts-expect-error Old resource discriminants are not giraffe care.
 resource.kind='lion-meat';
 // @ts-expect-error V4 does not have the V3 schema discriminant.
 save.schemaVersion=3;
}
void narrow;void rejectOtherSpecies;void rejectBehaviors;
