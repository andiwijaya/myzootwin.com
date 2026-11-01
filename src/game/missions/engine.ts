import {evaluateThriving,thrivingMissionView,THRIVING_RULES} from './thriving-objective.ts';
import {captureVisitorObjective,visitorMissionView,VISITOR_MISSION_RULES} from './visitor-objective.ts';
import {MISSION_IDS,type MissionId,type ZooSaveV1} from '../core/state.ts';
import {analyzePaths} from '../world/paths.ts';
import {ledgerProof,totals} from '../economy/journal.ts';
import {welfareParts} from '../animals/welfare.ts';

/** Tunable game objectives; seconds below are simulation time, never wall/render time. */
export const CARE_MISSION_RULES=Object.freeze({threshold:60,durationTicks:50,unlockId:'aviary-blossoms' as const});
export const MISSION_RULES=Object.freeze({Q01:Object.freeze({enabled:true,coins:20,unlockId:null,badgeId:null}),Q02:Object.freeze({enabled:true,coins:0,unlockId:CARE_MISSION_RULES.unlockId,badgeId:null}),Q03:Object.freeze({enabled:true,coins:VISITOR_MISSION_RULES.coins,unlockId:null,badgeId:VISITOR_MISSION_RULES.badgeId}),Q04:Object.freeze({enabled:true,coins:0,unlockId:THRIVING_RULES.unlockId,badgeId:THRIVING_RULES.badgeId})});
export interface MissionQuote {id:MissionId;command:number;}
export type MissionStatus='active'|'ready'|'claimed'|'locked'|'planned';
function connected(s:ZooSaveV1){return analyzePaths(s.world).habitats.some(h=>h.connected);}
export function careMissionView(s:ZooSaveV1){
 const animals=[...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).map(a=>{const p=welfareParts(s,a);return{id:a.id,placed:Boolean(p.habitat),fed:a.foodEaten>0,watered:a.waterDrunk>0,welfare:p.welfare,foodAccess:p.foodAccess,waterAccess:p.waterAccess,perchAccess:p.perchAccess};});
 const placed=animals.filter(a=>a.placed).length,fed=animals.filter(a=>a.fed).length,watered=animals.filter(a=>a.watered).length;
 const holding=placed===2&&fed===2&&watered===2&&animals.every(a=>a.welfare>=CARE_MISSION_RULES.threshold);
 const unlocked=s.missions.completedIds.includes('Q02')&&s.missions.rewards.some(r=>'unlockId'in r&&r.missionId==='Q02'&&r.unlockId===CARE_MISSION_RULES.unlockId);
 const next:'birds'|'food'|'water'|'perch'|'observe'=placed<2?'birds':animals.some(a=>!a.foodAccess)?'food':animals.some(a=>!a.waterAccess)?'water':!holding&&animals.some(a=>!a.perchAccess)?'perch':'observe';
 return{animals,placed,fed,watered,holding,unlocked,next,threshold:CARE_MISSION_RULES.threshold,durationTicks:CARE_MISSION_RULES.durationTicks,comfortableTicks:s.missions.objectives.comfortableTicks};
}
/** Consumption counters are authoritative lifetime evidence, including care before Q01 and recovery supplies.
 * Only one final fixed-tick event can add duration; ordinary state events can reset, never advance it. */
export function evaluateMissions(s:ZooSaveV1,fixedTick=false){
 captureVisitorObjective(s);evaluateThriving(s,fixedTick);const m=s.missions;m.objectives.habitatConnected=connected(s);
 m.objectives.birdsFedIds=s.animals.filter(a=>a.foodEaten>0).map(a=>a.id);m.objectives.birdsWateredIds=s.animals.filter(a=>a.waterDrunk>0).map(a=>a.id);
 // Once the required consecutive streak is achieved, its objective proof is retained.
 // Later welfare still changes and demands care, but cannot erase an earned mission before Claim.
 if(m.completedIds.includes('Q02')||m.objectives.comfortableTicks===CARE_MISSION_RULES.durationTicks)return;
 if(m.currentId!=='Q02'||!careMissionView(s).holding)m.objectives.comfortableTicks=0;
 else if(fixedTick)m.objectives.comfortableTicks=Math.min(CARE_MISSION_RULES.durationTicks,m.objectives.comfortableTicks+1);
}
export function missionView(s:ZooSaveV1){const access=connected(s),habitat=s.world.habitats.length>0,care=careMissionView(s),visit=visitorMissionView(s),thriving=thrivingMissionView(s);return {currentId:s.missions.currentId,command:s.economy.nextCommand,completed:s.missions.completedIds.length,rewards:totals(s).amounts.reward,habitat,connected:access,care,visit,thriving,rows:MISSION_IDS.map(id=>{const claimed=s.missions.completedIds.includes(id),current=s.missions.currentId===id,enabled=MISSION_RULES[id].enabled,ready=id==='Q01'?habitat&&access:id==='Q02'?care.comfortableTicks>=CARE_MISSION_RULES.durationTicks:id==='Q03'?visit.qualified:id==='Q04'?thriving.qualified:false;const status:MissionStatus=claimed?'claimed':!current?'locked':!enabled?'planned':ready?'ready':'active';return{id,status,coins:MISSION_RULES[id].coins,unlockId:MISSION_RULES[id].unlockId,badgeId:MISSION_RULES[id].badgeId};})};}
export type MissionView=ReturnType<typeof missionView>;
export type ClaimFailure='stale'|'locked'|'planned'|'incomplete'|'claimed'|'balance';
/** Clone-only atomic cash OR typed noncash claim. Noncash is never a zero-value ledger transaction. */
export function claimMission(s:ZooSaveV1,q:MissionQuote):ClaimFailure|null{
 if(!q||q.command!==s.economy.nextCommand||!Number.isSafeInteger(q.command)||q.command>=Number.MAX_SAFE_INTEGER)return 'stale';
 if(!(MISSION_IDS as readonly unknown[]).includes(q.id))return 'locked';
 if(s.missions.completedIds.includes(q.id)||s.missions.rewards.some(r=>r.missionId===q.id))return 'claimed';
 if(s.missions.currentId!==q.id)return 'locked';const rule=MISSION_RULES[q.id];if(!rule.enabled)return 'planned';
 if(missionView(s).rows.find(r=>r.id===q.id)?.status!=='ready')return 'incomplete';
 if(rule.unlockId){s.missions.rewards.push(rule.unlockId===THRIVING_RULES.unlockId?{missionId:q.id,unlockId:rule.unlockId,badgeId:THRIVING_RULES.badgeId,tick:s.tick,command:q.command}:{missionId:q.id,unlockId:rule.unlockId,tick:s.tick,command:q.command});}
 else{const id=`mission-${q.id.toLowerCase()}`;if(ledgerProof(s,id)||!Number.isSafeInteger(s.currency+rule.coins)||rule.coins<=0)return 'balance';s.currency+=rule.coins;s.ledger.push({id,operationId:id,kind:'reward',amount:rule.coins,balanceAfter:s.currency,tick:s.tick,relatedId:q.id});s.missions.rewards.push(rule.badgeId?{missionId:q.id,ledgerEntryId:id,badgeId:rule.badgeId,tick:s.tick,command:q.command}:{missionId:q.id,ledgerEntryId:id});}
 s.missions.completedIds.push(q.id);s.missions.currentId=MISSION_IDS[s.missions.completedIds.length]??null;s.economy.nextCommand++;evaluateMissions(s);return null;
}
