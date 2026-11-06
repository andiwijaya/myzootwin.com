import type {RuntimeState} from '../core/runtime-state.ts';
import type {ZooSave,ZooSaveV3} from '../core/zoo-state.ts';
import {LION_PRICES} from '../animals/lions/rules.ts';
import {validateSaveV3} from '../persistence/save-v3.ts';
export const LION_GRANT_ID='lion-savanna-grant-v1' as const;
export interface LionGrantQuote {command:number;}
export function lionGrantView(s:RuntimeState){
 const qualified=s.schemaVersion===3&&Boolean(s.elephantGrove?.missions.completedIds.includes('EH04')&&s.elephantGrove.missions.rewards.some(r=>r.missionId==='EH04'&&r.award==='gentle-giants'&&r.ledgerEntryId==='mission-eh04'));
 const claimed=Boolean(s.lionSavanna?.grant),reason=claimed?'claimed' as const:!qualified?'locked' as const:!Number.isSafeInteger(s.currency+LION_PRICES.grant)?'capacity' as const:'ready' as const;
 return {qualified,claimed,reason,canClaim:reason==='ready',amount:LION_PRICES.grant,command:s.economy.nextCommand};
}
/** Durable CAS must win before the caller adopts this exact candidate. No migration/view side effect. */
export function prepareLionGrant(s:ZooSave,q:LionGrantQuote):{ok:true;state:ZooSaveV3}|{ok:false;reason:'claimed'|'locked'|'capacity'|'ready'|'stale'}{
 const view=lionGrantView(s);if(s.schemaVersion!==3||!view.canClaim)return {ok:false,reason:view.reason};
 if(!q||!Number.isSafeInteger(q.command)||q.command!==s.economy.nextCommand||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false,reason:'stale'};
 const next=structuredClone(s);next.currency+=1800;next.ledger.push({id:LION_GRANT_ID,operationId:LION_GRANT_ID,kind:'reward',amount:1800,balanceAfter:next.currency,tick:next.tick,relatedId:'lion-savanna'});next.lionSavanna.grant={id:LION_GRANT_ID,ledgerEntryId:LION_GRANT_ID,tick:next.tick,command:q.command};next.economy.nextCommand++;
 const checked=validateSaveV3(next);return checked.ok?{ok:true,state:checked.value}:{ok:false,reason:'stale'};
}
