import type {RuntimeState} from '../core/runtime-state.ts';
import type {ZooSave} from '../core/zoo-state.ts';
import {validateSaveV5} from '../persistence/save-v5.ts';
import {ledgerProof} from './journal.ts';
import {GIRAFFE_MISSION_RULES} from '../animals/giraffes/rules.ts';
import {ZEBRA_PRICES} from '../animals/zebras/rules.ts';
export const ZEBRA_GRANT_ID='zebra-grasslands-grant-v1' as const;
export interface ZebraGrantQuote {command:number;}
export function zebraGrantView(s:RuntimeState){
 const reward=s.giraffePlains?.missions.rewards.find(r=>r.missionId==='GQ04'),receipt=reward?.ledgerEntryId?ledgerProof(s,reward.ledgerEntryId):null;
 const qualified=s.schemaVersion===5&&Boolean(s.giraffePlains?.missions.completedIds.includes('GQ04')&&reward?.award==='giraffe-safari-banner'&&reward.ledgerEntryId==='mission-gq04'&&receipt?.kind==='reward'&&receipt.amount===GIRAFFE_MISSION_RULES.GQ04.coins&&receipt.relatedId==='gq04'&&receipt.operationId==='claim-gq04'&&receipt.tick===reward.tick);
 const claimed=Boolean(s.zebraGrasslands?.grant)||Boolean(ledgerProof(s,ZEBRA_GRANT_ID)),reason=claimed?'claimed' as const:!qualified?'locked' as const:(!Number.isSafeInteger(s.currency+ZEBRA_PRICES.grant)||!Number.isSafeInteger(s.economy.nextCommand)||s.economy.nextCommand>=Number.MAX_SAFE_INTEGER)?'capacity' as const:'ready' as const;
 return{qualified,claimed,reason,canClaim:reason==='ready',amount:ZEBRA_PRICES.grant,command:s.economy.nextCommand};
}
/** Pure candidate only. Live money/proof is adopted after the durable CAS wins. */
export function prepareZebraGrant(s:ZooSave,q:ZebraGrantQuote){
 const view=zebraGrantView(s);if(s.schemaVersion!==5||!view.canClaim)return{ok:false as const,reason:view.reason};
 if(!q||!Number.isSafeInteger(q.command)||q.command!==s.economy.nextCommand||q.command>=Number.MAX_SAFE_INTEGER||!validateSaveV5(s).ok)return{ok:false as const,reason:'stale' as const};
 const next=structuredClone(s),reward=next.giraffePlains.missions.rewards.find(r=>r.missionId==='GQ04')!;
 next.currency+=ZEBRA_PRICES.grant;next.ledger.push({id:ZEBRA_GRANT_ID,operationId:ZEBRA_GRANT_ID,kind:'reward',amount:ZEBRA_PRICES.grant,balanceAfter:next.currency,tick:next.tick,relatedId:'zebra-grasslands'});
 next.zebraGrasslands.unlock={missionId:'GQ04',ledgerEntryId:reward.ledgerEntryId!,tick:reward.tick,command:reward.command};next.zebraGrasslands.grant={id:ZEBRA_GRANT_ID,ledgerEntryId:ZEBRA_GRANT_ID,tick:next.tick,command:q.command};next.economy.nextCommand++;
 const checked=validateSaveV5(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'stale' as const};
}
