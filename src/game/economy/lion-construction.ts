import type {ZooSave} from '../core/zoo-state.ts';
import type {Point} from '../core/state.ts';
import {lionGrantView} from './lion-grant.ts';
import {LION_PRICES} from '../animals/lions/rules.ts';
import {prepareSpeciesHabitat} from '../world/species-habitat.ts';
import {reconcilePathAccess} from '../world/paths.ts';
import {debit} from './spending.ts';
import {validateMultiSave} from '../persistence/save.ts';
export function lionHabitatView(s:ZooSave){const qualified=lionGrantView(s).qualified,exists=s.world.habitats.some(h=>'kind'in h&&h.kind==='lion-savanna'),reason=!qualified?'locked':exists?'limit':s.currency<LION_PRICES.habitat?'funds':'ready';return {qualified,exists,reason,price:LION_PRICES.habitat,canBuild:reason==='ready'};}
export function prepareLionConstruction(s:ZooSave,anchor:Point,operationId:string,command:number){
 if(s.schemaVersion!==3&&(s.schemaVersion!==4&&s.schemaVersion!==5)||!lionGrantView(s).qualified)return {ok:false as const,reason:'locked' as const};
 if(!Number.isSafeInteger(command)||command!==s.economy.nextCommand||command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'command' as const};
 const built=prepareSpeciesHabitat(s.world,anchor,operationId,'lion-savanna');if(!built.ok)return built;
 if(built.duplicate)return {ok:true as const,state:structuredClone(s),habitatId:built.habitatId,duplicate:true};
 const next=structuredClone(s),failure=debit(next,LION_PRICES.habitat,'build',`buy-${operationId.slice(8)}`,built.habitatId);if(failure)return {ok:false as const,reason:failure==='duplicate'?'command' as const:failure};
 next.world=reconcilePathAccess(built.world).world;next.economy.nextCommand++;const checked=validateMultiSave(next);return checked.ok?{ok:true as const,state:checked.value,habitatId:built.habitatId,duplicate:false}:{ok:false as const,reason:'command' as const};
}
