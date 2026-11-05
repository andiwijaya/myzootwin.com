import type { Point, WorldState, RuntimeWorld } from '../core/state.ts';
import {cellKey,validatePlacement,type PlacementReason} from './placement-preview.ts';
// Conservative fixed Tropical Creek scenery footprint, derived from actual art bounds.
// A geometry-contract test prevents this pure gameplay mask drifting from rendered scenery.
const sceneryKeys=["0,0", "0,1", "0,2", "0,3", "0,4", "0,5", "0,6", "0,8", "1,0", "1,1", "1,2", "1,3", "1,4", "1,5", "1,6", "1,8", "10,0", "10,1", "10,2", "10,3", "10,4", "10,5", "10,6", "10,7", "10,8", "10,9", "11,0", "11,1", "11,2", "11,4", "11,5", "11,6", "11,7", "11,8", "2,0", "2,1", "2,2", "2,3", "2,4", "2,5", "2,6", "2,8", "3,0", "3,1", "3,2", "4,0", "4,1", "4,2", "5,0", "5,1", "5,2", "6,0", "6,1", "6,2", "6,8", "6,9", "7,0", "7,1", "7,2", "7,8", "7,9", "8,0", "8,1", "8,2", "8,5", "8,6", "8,8", "8,9", "9,0", "9,1", "9,2", "9,4", "9,5", "9,6", "9,7", "9,8", "9,9"];
const scenery=new Set(sceneryKeys);
export const STARTER_HABITAT_LIMIT=1;
export const habitatBlockerKeys=():ReadonlySet<string>=>new Set(scenery);
export function validateHabitatPlacement(world:RuntimeWorld,anchor:Point|null){
  const checked=validatePlacement(world,anchor,scenery);
  return checked.reason==='ready'&&world.habitats.filter(h=>!('kind'in h)||h.kind==='macaw-aviary').length>=STARTER_HABITAT_LIMIT?{...checked,reason:'limit' as const}:checked;
}
export type HabitatBuildResult={ok:true;world:WorldState;habitatId:string;duplicate:boolean}|{ok:false;reason:PlacementReason};
/** Prepare a complete world transaction; never mutate the caller or mint money/progress. */
export function prepareHabitat(world:WorldState,anchor:Point,operationId:string):HabitatBuildResult{
  if(typeof operationId!=='string'||!/^habitat-[a-z0-9-]{1,40}$/.test(operationId))return {ok:false,reason:'command'};
  const existing=world.habitats.find(h=>h.id===operationId);
  if(existing){const desired=validatePlacement({...world,tiles:world.tiles.map(t=>({...t,occupantId:null}))},anchor,new Set()).proposal;return desired&&existing.cells.length===desired.cells.length&&desired.cells.every(c=>existing.cells.some(e=>cellKey(e)===cellKey(c)))?{ok:true,world:structuredClone(world),habitatId:existing.id,duplicate:true}:{ok:false,reason:'command'};}
  const checked=validateHabitatPlacement(world,anchor);
  if(checked.reason!=='ready'||!checked.proposal)return {ok:false,reason:checked.reason};
  const next=structuredClone(world),keys=new Set(checked.proposal.cells.map(cellKey));
  next.habitats.push({id:operationId,cells:checked.proposal.cells.map(c=>({...c})),viewingCell:null});
  for(const tile of next.tiles)if(keys.has(cellKey(tile.cell)))tile.occupantId=operationId;
  return {ok:true,world:next,habitatId:operationId,duplicate:false};
}
