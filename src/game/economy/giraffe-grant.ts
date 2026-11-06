import type {RuntimeState} from '../core/runtime-state.ts';
import type {ZooSave} from '../core/zoo-state.ts';
import {validateSaveV4} from '../persistence/save-v4.ts';
import {ledgerProof} from './journal.ts';
import {GIRAFFE_PRICES} from '../animals/giraffes/rules.ts';
export const GIRAFFE_GRANT_ID='giraffe-plains-grant-v1' as const;
export interface GiraffeGrantQuote {command:number;}
export function giraffeGrantView(s:RuntimeState){
 const reward=s.lionSavanna?.missions.rewards.find(r=>r.missionId==='LQ04'),receipt=reward?.ledgerEntryId?ledgerProof(s,reward.ledgerEntryId):null;
 const qualified=s.schemaVersion===4&&Boolean(s.lionSavanna?.missions.completedIds.includes('LQ04')&&reward?.award==='savanna-guardian'&&reward.ledgerEntryId==='mission-lq04'&&receipt?.kind==='reward'&&receipt.amount===250&&receipt.relatedId==='lq04'&&receipt.operationId==='claim-lq04'&&receipt.tick===reward.tick);
 const claimed=Boolean(s.giraffePlains?.grant),reason=claimed?'claimed' as const:!qualified?'locked' as const:!Number.isSafeInteger(s.currency+GIRAFFE_PRICES.grant)?'capacity' as const:'ready' as const;
 return {qualified,claimed,reason,canClaim:reason==='ready',amount:GIRAFFE_PRICES.grant,command:s.economy.nextCommand};
}
/** Pure candidate. Only durable CAS adoption may publish success or credit the live UI. */
export function prepareGiraffeGrant(s:ZooSave,q:GiraffeGrantQuote){
 const view=giraffeGrantView(s);if(s.schemaVersion!==4||!view.canClaim)return {ok:false as const,reason:view.reason};
 if(!q||!Number.isSafeInteger(q.command)||q.command!==s.economy.nextCommand||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};
 const next=structuredClone(s);next.currency+=GIRAFFE_PRICES.grant;next.ledger.push({id:GIRAFFE_GRANT_ID,operationId:GIRAFFE_GRANT_ID,kind:'reward',amount:GIRAFFE_PRICES.grant,balanceAfter:next.currency,tick:next.tick,relatedId:'giraffe-plains'});next.giraffePlains.grant={id:GIRAFFE_GRANT_ID,ledgerEntryId:GIRAFFE_GRANT_ID,tick:next.tick,command:q.command};next.economy.nextCommand++;
 const checked=validateSaveV4(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'stale' as const};
}
