import type {ZooSave} from '../core/zoo-state.ts';
import type {Point} from '../core/state.ts';
import {ZEBRA_PRICES} from '../animals/zebras/rules.ts';
import {validateSaveV5,zebraUnlocked} from '../persistence/save-v5.ts';
import {ledgerProof} from './journal.ts';
import {debit} from './spending.ts';
import {prepareSpeciesHabitat} from '../world/species-habitat.ts';
import {reconcilePathAccess} from '../world/paths.ts';
import {recommendedZebraAnchor} from '../world/zebra-layout.ts';
export function zebraHabitatView(s:ZooSave){
 const grant=s.schemaVersion===5?s.zebraGrasslands.grant:null,receipt=grant?ledgerProof(s,grant.ledgerEntryId):null;
 const qualified=s.schemaVersion===5&&zebraUnlocked(s)&&grant!==null&&receipt?.kind==='reward'&&receipt.amount===ZEBRA_PRICES.grant&&receipt.relatedId==='zebra-grasslands'&&receipt.operationId===grant.id;
 const exists=s.world.habitats.some(h=>'kind'in h&&h.kind==='zebra-grasslands'),anchor=recommendedZebraAnchor(s.world),reason=!qualified?'locked':exists?'limit':s.currency<ZEBRA_PRICES.habitat?'funds':!anchor?'occupied':'ready';
 return{qualified,exists,reason,price:ZEBRA_PRICES.habitat,anchor,canBuild:reason==='ready',command:s.economy.nextCommand};
}
/** Pure paid candidate. The live engine adopts it only after durable CAS succeeds. */
export function prepareZebraConstruction(s:ZooSave,anchor:Point,operationId:string,command:number){
 if(s.schemaVersion!==5||!zebraHabitatView(s).qualified)return{ok:false as const,reason:'locked' as const};
 if(!validateSaveV5(s).ok||!Number.isSafeInteger(command)||command!==s.economy.nextCommand||command>=Number.MAX_SAFE_INTEGER)return{ok:false as const,reason:'command' as const};
 const built=prepareSpeciesHabitat(s.world,anchor,operationId,'zebra-grasslands');if(!built.ok)return built;
 if(built.duplicate)return{ok:true as const,state:structuredClone(s),habitatId:built.habitatId,duplicate:true};
 const next=structuredClone(s),failure=debit(next,ZEBRA_PRICES.habitat,'build',`buy-${operationId.slice(8)}`,built.habitatId);if(failure)return{ok:false as const,reason:failure==='duplicate'?'command' as const:failure};
 next.world=reconcilePathAccess(built.world).world;next.economy.nextCommand++;const checked=validateSaveV5(next);return checked.ok?{ok:true as const,state:checked.value,habitatId:built.habitatId,duplicate:false}:{ok:false as const,reason:'command' as const};
}
