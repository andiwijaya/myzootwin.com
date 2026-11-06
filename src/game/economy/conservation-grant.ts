import type {ZooSave} from '../core/zoo-state.ts';
import type {RuntimeState} from '../core/runtime-state.ts';
import {ELEPHANT_PRICES} from './elephant-prices.ts';
import {validateMultiSave as validateSaveV2} from '../persistence/save.ts';
export const CONSERVATION_GRANT_ID='elephant-expansion-grant-v1' as const;
export interface ConservationGrantQuote {command:number;}
export type ConservationGrantSceneView=ReturnType<typeof conservationGrantView>&{busy:boolean;savingAvailable:boolean;failure:'storage'|'stale'|null};
export type GrantReason='locked'|'claimed'|'capacity'|'stale'|'ready';
export function conservationGrantView(s:RuntimeState){
  const claimed=Boolean(s.elephantGrove?.grant),qualified=s.schemaVersion!==1&&s.missions.completedIds.includes('Q04')&&s.missions.rewards.some(r=>r.missionId==='Q04'&&'unlockId'in r&&r.unlockId==='sanctuary-banner'&&'badgeId'in r&&r.badgeId==='thriving-sanctuary');
  const reason:GrantReason=claimed?'claimed':!qualified?'locked':!Number.isSafeInteger(s.currency+ELEPHANT_PRICES.grant)?'capacity':'ready';
  return {command:s.economy.nextCommand,amount:ELEPHANT_PRICES.grant,habitatPrice:ELEPHANT_PRICES.habitat,claimed,qualified,reason,canClaim:reason==='ready'};
}
/** Pure quoted candidate. The owner must durably commit it before adopting/publishing it. */
export function prepareConservationGrant<S extends ZooSave>(s:S,quote:ConservationGrantQuote):{ok:true;state:Extract<S,{schemaVersion:2|3}>}|{ok:false;reason:GrantReason}{
  const view=conservationGrantView(s);if(!view.canClaim)return {ok:false,reason:view.reason};
  if(s.schemaVersion===1||!quote||quote.command!==s.economy.nextCommand||!Number.isSafeInteger(quote.command)||quote.command>=Number.MAX_SAFE_INTEGER)return {ok:false,reason:'stale'};
  const next=structuredClone(s) as Extract<S,{schemaVersion:2|3}>;next.currency+=ELEPHANT_PRICES.grant;
  next.ledger.push({id:CONSERVATION_GRANT_ID,operationId:CONSERVATION_GRANT_ID,kind:'reward',amount:ELEPHANT_PRICES.grant,balanceAfter:next.currency,tick:next.tick,relatedId:'elephant-expansion'});
  next.elephantGrove.grant={id:CONSERVATION_GRANT_ID,ledgerEntryId:CONSERVATION_GRANT_ID,tick:next.tick,command:quote.command};next.economy.nextCommand++;
  const checked=validateSaveV2(next);return checked.ok?{ok:true,state:checked.value as Extract<S,{schemaVersion:2|3}>}:{ok:false,reason:'stale'};
}
