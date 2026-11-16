import type {HabitatKind} from './species.ts';
import type {RuntimeState} from './runtime-state.ts';

export interface ZooOverview {
  animals:number;
  habitats:{id:string;kind:HabitatKind;animals:number}[];
}

/** A small read-only presentation view. Reserves and orphan references are not placed animals. */
export function zooOverview(state:Pick<RuntimeState,'world'|'animals'>):ZooOverview {
  const counts=new Map<string,number>();
  for(const h of state.world.habitats)counts.set(h.id,0);
  for(const a of state.animals)if(a.habitatId&&counts.has(a.habitatId))counts.set(a.habitatId,counts.get(a.habitatId)!+1);
  const habitats=state.world.habitats.map(h=>({id:h.id,kind:('kind' in h?h.kind:'macaw-aviary') as HabitatKind,animals:counts.get(h.id)!}));
  return {animals:habitats.reduce((sum,h)=>sum+h.animals,0),habitats};
}
