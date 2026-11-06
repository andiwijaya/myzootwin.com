import type {ZooSave} from '../core/zoo-state.ts';
import type {Point} from '../core/state.ts';
import {giraffeGrantView} from './giraffe-grant.ts';
import {GIRAFFE_PRICES} from '../animals/giraffes/rules.ts';
import {prepareSpeciesHabitat} from '../world/species-habitat.ts';
import {recommendedGiraffeAnchor} from '../world/giraffe-expansion.ts';
import {reconcilePathAccess} from '../world/paths.ts';
import {debit} from './spending.ts';
import {validateSaveV4} from '../persistence/save-v4.ts';
export function giraffeHabitatView(s:ZooSave){const qualified=giraffeGrantView(s).qualified,exists=s.world.habitats.some(h=>'kind'in h&&h.kind==='giraffe-plains'),reason=!qualified?'locked':exists?'limit':s.currency<GIRAFFE_PRICES.habitat?'funds':'ready';return {qualified,exists,reason,price:GIRAFFE_PRICES.habitat,anchor:recommendedGiraffeAnchor(s.world),canBuild:reason==='ready'};}
export function prepareGiraffeConstruction(s:ZooSave,anchor:Point,operationId:string,command:number){
 if(s.schemaVersion!==4||!giraffeGrantView(s).qualified)return {ok:false as const,reason:'locked' as const};
 if(!Number.isSafeInteger(command)||command!==s.economy.nextCommand||command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'command' as const};
 const recommended=recommendedGiraffeAnchor(s.world);if(anchor?.x!==recommended.x||anchor.z!==recommended.z)return {ok:false as const,reason:'zone' as const};
 const built=prepareSpeciesHabitat(s.world,anchor,operationId,'giraffe-plains');if(!built.ok)return built;
 if(built.duplicate)return {ok:true as const,state:structuredClone(s),habitatId:built.habitatId,duplicate:true};
 const next=structuredClone(s),failure=debit(next,GIRAFFE_PRICES.habitat,'build',`buy-${operationId.slice(8)}`,built.habitatId);if(failure)return {ok:false as const,reason:failure==='duplicate'?'command' as const:failure};
 next.world=reconcilePathAccess(built.world).world;next.economy.nextCommand++;const checked=validateSaveV4(next);return checked.ok?{ok:true as const,state:checked.value,habitatId:built.habitatId,duplicate:false}:{ok:false as const,reason:'command' as const};
}
