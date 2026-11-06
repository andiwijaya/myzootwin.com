import {recommendedGiraffeAnchor} from './giraffe-expansion.ts';
import type {Habitat,Point,WorldState} from '../core/state.ts';
import {SPECIES,habitatSpecies,type HabitatKind} from '../core/species.ts';
import {habitatBlockerKeys} from './build-habitat.ts';
import {cellKey,validatePlacement,type PlacementReason} from './placement-preview.ts';
export type HabitatPlacementWorld=Pick<WorldState,'width'|'height'|'tiles'|'habitats'>;
export const HABITAT_LIMITS=Object.freeze({'macaw-aviary':1,'elephant-grove':1,'lion-savanna':1,'giraffe-plains':1});
const kindOf=(h:Habitat):HabitatKind|null=>!('kind'in h)?'macaw-aviary':h.kind==='macaw-aviary'||h.kind==='elephant-grove'||h.kind==='lion-savanna'||h.kind==='giraffe-plains'?h.kind:null;

/** One shared footprint/collision authority, with separate per-species construction caps. */
export function validateSpeciesHabitatPlacement(world:HabitatPlacementWorld,anchor:Point|null,kind:HabitatKind){
  const species=habitatSpecies(kind);
  if(species===null)return {proposal:null,reason:'command' as const};
  const checked=validatePlacement(world,anchor,habitatBlockerKeys(),'habitat',SPECIES[species].footprint);
  if(checked.reason!=='ready')return checked;
  if(anchor&&world.width===24&&kind!=='giraffe-plains'&&anchor.x+SPECIES[species].footprint>12)return {...checked,reason:'zone' as const};
  if(kind==='giraffe-plains'&&(!anchor||world.width!==24||world.height!==26||anchor.x!==13||anchor.z!==recommendedGiraffeAnchor(world).z))return {...checked,reason:'zone' as const};
  if(kind==='elephant-grove'&&anchor&&(anchor.z<10||anchor.z+6>18))return {...checked,reason:'zone' as const};
  if(kind==='macaw-aviary'&&world.height===26&&anchor&&anchor.z+2>18)return {...checked,reason:'zone' as const};
  if(kind==='lion-savanna'&&anchor&&anchor.z<18)return {...checked,reason:'zone' as const};
  if(world.habitats.some(h=>kindOf(h)===null))return {...checked,reason:'command' as const};
  return world.habitats.filter(h=>kindOf(h)===kind).length>=HABITAT_LIMITS[kind]?{...checked,reason:'limit' as const}:checked;
}
type Result<W>={ok:true;world:W;habitatId:string;duplicate:boolean}|{ok:false;reason:PlacementReason};
/** Pure world transaction only. Paid construction/unlock/save are separate gates, not bypassed here. */
export function prepareSpeciesHabitat<W extends HabitatPlacementWorld>(world:W,anchor:Point,operationId:string,kind:HabitatKind):Result<W>{
  if(typeof operationId!=='string'||!/^habitat-[a-z0-9-]{1,40}$/.test(operationId)||habitatSpecies(kind)===null)return {ok:false,reason:'command'};
  const existing=world.habitats.find(h=>h.id===operationId),species=habitatSpecies(kind)!;
  if(existing){
    const desired=validatePlacement(world,anchor,new Set(),'habitat',SPECIES[species].footprint).proposal;
    return kindOf(existing)===kind&&desired&&existing.cells.length===desired.cells.length&&desired.cells.every(c=>existing.cells.some(e=>cellKey(e)===cellKey(c)))?{ok:true,world:structuredClone(world),habitatId:existing.id,duplicate:true}:{ok:false,reason:'command'};
  }
  const checked=validateSpeciesHabitatPlacement(world,anchor,kind);
  if(checked.reason!=='ready'||!checked.proposal)return {ok:false,reason:checked.reason};
  const next=structuredClone(world),cells=checked.proposal.cells.map(c=>({...c})),keys=new Set(cells.map(cellKey)),habitat={id:operationId,kind,cells,viewingCell:null};
  next.habitats.push(habitat);for(const tile of next.tiles)if(keys.has(cellKey(tile.cell)))tile.occupantId=operationId;
  return {ok:true,world:next,habitatId:operationId,duplicate:false};
}
