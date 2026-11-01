import {MISSION_IDS,type MissionId,type ZooSaveV1} from '../core/state.ts';
import {analyzePaths} from '../world/paths.ts';
import {ledgerProof,totals} from '../economy/journal.ts';

/** Later objectives deliberately remain planned until their separate acceptance slices. */
export const MISSION_RULES=Object.freeze({Q01:Object.freeze({enabled:true,coins:20}),Q02:Object.freeze({enabled:false,coins:0}),Q03:Object.freeze({enabled:false,coins:0}),Q04:Object.freeze({enabled:false,coins:0})});
export interface MissionQuote {id:MissionId;command:number;}
export type MissionStatus='active'|'ready'|'claimed'|'locked'|'planned';
function connected(s:ZooSaveV1){return analyzePaths(s.world).habitats.some(h=>h.connected);}
/** Cached objective flags are descriptive only; eligibility always reads authoritative topology. */
export function evaluateMissions(s:ZooSaveV1){s.missions.objectives.habitatConnected=connected(s);}
export function missionView(s:ZooSaveV1){const access=connected(s),habitat=s.world.habitats.length>0;return {currentId:s.missions.currentId,command:s.economy.nextCommand,completed:s.missions.completedIds.length,rewards:totals(s).amounts.reward,habitat,connected:access,rows:MISSION_IDS.map(id=>{const claimed=s.missions.completedIds.includes(id),current=s.missions.currentId===id,enabled=MISSION_RULES[id].enabled;const status:MissionStatus=claimed?'claimed':!current?'locked':!enabled?'planned':id==='Q01'&&habitat&&access?'ready':'active';return{id,status,coins:MISSION_RULES[id].coins};})};}
export type MissionView=ReturnType<typeof missionView>;
export type ClaimFailure='stale'|'locked'|'planned'|'incomplete'|'claimed'|'balance';
/** Mutates only the simulation-owned transaction clone; caller validates and publishes atomically. */
export function claimMission(s:ZooSaveV1,q:MissionQuote):ClaimFailure|null{
 if(!q||q.command!==s.economy.nextCommand||!Number.isSafeInteger(q.command)||q.command>=Number.MAX_SAFE_INTEGER)return 'stale';
 if(!(MISSION_IDS as readonly unknown[]).includes(q.id))return 'locked';
 if(s.missions.completedIds.includes(q.id)||s.missions.rewards.some(r=>r.missionId===q.id))return 'claimed';
 if(s.missions.currentId!==q.id)return 'locked';
 const rule=MISSION_RULES[q.id];if(!rule.enabled)return 'planned';
 if(missionView(s).rows.find(r=>r.id===q.id)?.status!=='ready')return 'incomplete';
 const id=`mission-${q.id.toLowerCase()}`;if(ledgerProof(s,id)||!Number.isSafeInteger(s.currency+rule.coins)||rule.coins<=0)return 'balance';
 s.currency+=rule.coins;s.ledger.push({id,operationId:id,kind:'reward',amount:rule.coins,balanceAfter:s.currency,tick:s.tick,relatedId:q.id});
 s.missions.completedIds.push(q.id);s.missions.rewards.push({missionId:q.id,ledgerEntryId:id});s.missions.currentId=MISSION_IDS[s.missions.completedIds.length]??null;s.economy.nextCommand++;evaluateMissions(s);return null;
}
