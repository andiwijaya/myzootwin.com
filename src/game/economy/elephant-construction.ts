import type {elephantResidentsView} from '../animals/elephants/residents.ts';
import type {ZooSave} from '../core/zoo-state.ts';
import type {RuntimeState} from '../core/runtime-state.ts';
import {conservationGrantView,type ConservationGrantSceneView} from './conservation-grant.ts';
import {ELEPHANT_PRICES} from './elephant-prices.ts';
import {debit} from './spending.ts';
import {prepareSpeciesHabitat} from '../world/species-habitat.ts';
import {reconcilePathAccess} from '../world/paths.ts';
import {validateMultiSave as validateSaveV2} from '../persistence/save.ts';
import type {Point} from '../core/state.ts';

export function elephantHabitatView(s:RuntimeState){
  const qualified=conservationGrantView(s).qualified,exists=s.world.habitats.some(h=>'kind'in h&&h.kind==='elephant-grove');
  const reason:'locked'|'limit'|'funds'|'ready'=!qualified?'locked':exists?'limit':s.currency<ELEPHANT_PRICES.habitat?'funds':'ready';
  return {qualified,exists,price:ELEPHANT_PRICES.habitat,reason,canBuild:reason==='ready'};
}
export type ElephantCatalogView=ConservationGrantSceneView&{habitat:ReturnType<typeof elephantHabitatView>;residents:ReturnType<typeof elephantResidentsView>};

/** A caller-owned, complete paid world mutation. Never changes the input or grants residents. */
export function prepareElephantConstruction<S extends ZooSave>(s:S,anchor:Point,operationId:string,command:number){
  if(s.schemaVersion===1||!conservationGrantView(s).qualified)return {ok:false as const,reason:'locked' as const};
  if(command!==s.economy.nextCommand||!Number.isSafeInteger(command)||command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'command' as const};
  const prepared=prepareSpeciesHabitat(s.world,anchor,operationId,'elephant-grove');if(!prepared.ok)return prepared;
  if(prepared.duplicate)return {ok:true as const,state:structuredClone(s),habitatId:prepared.habitatId,duplicate:true};
  const next=structuredClone(s) as Extract<S,{schemaVersion:2|3}>,failure=debit(next,ELEPHANT_PRICES.habitat,'build',`buy-${operationId.slice(8)}`,prepared.habitatId);
  if(failure)return {ok:false as const,reason:failure==='duplicate'?'command' as const:failure};
  next.world=reconcilePathAccess(prepared.world).world;next.economy.nextCommand++;
  const checked=validateSaveV2(next);return checked.ok?{ok:true as const,state:checked.value,habitatId:prepared.habitatId,duplicate:false}:{ok:false as const,reason:'command' as const};
}
