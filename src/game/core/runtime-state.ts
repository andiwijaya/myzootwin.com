import type {GiraffeProgress} from './giraffe-state.ts';
import type {Habitat,WorldState,ZooSaveV1} from './state.ts';
import type {ZooSaveV2,LionSavannaProgress} from './zoo-state.ts';
import {isMacaw,type ZooAnimal,type ZooResource,type HabitatKind} from './species.ts';

export type RuntimeHabitat=Habitat&{kind?:HabitatKind};
export interface RuntimeWorld extends Omit<WorldState,'habitats'|'resources'> {habitats:RuntimeHabitat[];resources:ZooResource[];}
/** Common mutable subsystem contract. The canonical root is validated as exact V1 or V2. */
export interface RuntimeState extends Omit<ZooSaveV1,'schemaVersion'|'world'|'animals'> {schemaVersion:1|2|3|4;world:RuntimeWorld;animals:ZooAnimal[];elephantGrove?:ZooSaveV2['elephantGrove'];lionSavanna?:LionSavannaProgress;giraffePlains?:GiraffeProgress;}
const macawHabitat=(h:RuntimeHabitat)=>h.kind===undefined||h.kind==='macaw-aviary';
const macawResource=(r:ZooResource):r is ZooSaveV1['world']['resources'][number]=>r.kind==='food'||r.kind==='water'||r.kind==='perch';
const worldViews=new WeakMap<RuntimeWorld,{world:WorldState;habitats:RuntimeWorld['habitats'];resources:RuntimeWorld['resources'];tiles:RuntimeWorld['tiles']}>();
function macawWorldView(world:RuntimeWorld):WorldState {
  const cached=worldViews.get(world);
  if(cached&&cached.habitats===world.habitats&&cached.resources===world.resources&&cached.tiles===world.tiles)return cached.world;
  const view:WorldState={...world,habitats:world.habitats.filter(macawHabitat),resources:world.resources.filter(macawResource)};
  worldViews.set(world,{world:view,habitats:world.habitats,resources:world.resources,tiles:world.tiles});return view;
}

/** Transient references for the existing bird subsystem, NEVER a save/codec projection.
 * Its birds, resources, mission/economy objects belong to the same canonical root.
 * Full-world occupancy remains visible so old commands cannot collide with a grove. */
export function macawRuntimeView(state:RuntimeState):ZooSaveV1 {
  const {elephantGrove:_,lionSavanna:__,giraffePlains:___,...common}=state;
  return {...common,schemaVersion:1,animals:state.animals.filter(isMacaw),world:macawWorldView(state.world)};
}
function merge<T extends {id:string}>(current:readonly T[],changed:readonly T[],belongs:(item:T)=>boolean):T[]{
  const replacements=new Map(changed.map(x=>[x.id,x])),result:T[]=[];
  for(const item of current){if(!belongs(item))result.push(item);else{const replacement=replacements.get(item.id);if(replacement){result.push(replacement);replacements.delete(item.id);}}}
  result.push(...replacements.values());return result;
}
/** Commit a legacy subsystem's caller-owned transaction clone without replacing other species. */
export function commitMacawRuntimeView(state:RuntimeState,view:ZooSaveV1):void {
  const {schemaVersion:_,world,animals,...common}=view;
  Object.assign(state,common);
  state.animals=merge<ZooAnimal>(state.animals,animals,isMacaw);
  state.world.resources=merge<ZooResource>(state.world.resources,world.resources,macawResource);
  const habitats:RuntimeHabitat[]=world.habitats.map(h=>state.schemaVersion>=2?{...h,kind:'macaw-aviary'}:h);
  state.world.habitats=merge<RuntimeHabitat>(state.world.habitats,habitats,macawHabitat);
  state.world.tiles=world.tiles;state.world.width=world.width;state.world.height=world.height;state.world.gate=world.gate;
}
