import {elephantWelfareParts} from '../animals/elephants/welfare.ts';
import {EH_IDS,initialElephantMissions,type ElephantMissionId,type ZooSave,type MultiSpeciesSave as ZooSaveV2} from '../core/zoo-state.ts';
import type {RuntimeState} from '../core/state.ts';
import {elephants} from '../core/species.ts';
import {visitTargetForState} from '../visitors/graph.ts';
import {conservationGrantView} from '../economy/conservation-grant.ts';
import {admissionProofs,ledgerProof} from '../economy/journal.ts';
import {validateMultiSave as validateSaveV2} from '../persistence/save.ts';
import {ELEPHANT_ENRICHMENT} from '../animals/elephants/care-rules.ts';
export const ELEPHANT_MISSION_RULES=Object.freeze({careWelfare:60,careTicks:50,herdWelfare:70,herdTicks:100,viewers:3,EH01:Object.freeze({coins:0,award:'elephant-keeper' as const}),EH02:Object.freeze({coins:150,award:null}),EH03:Object.freeze({coins:0,award:'elephant-water-lilies' as const}),EH04:Object.freeze({coins:200,award:'gentle-giants' as const})});
export interface ElephantMissionQuote {id:ElephantMissionId;command:number;}
export type ElephantMissionFailure='locked'|'incomplete'|'claimed'|'stale'|'balance';
const home=(s:RuntimeState)=>{const herd=elephants(s.animals),habitat=s.world.habitats.find(h=>h.kind==='elephant-grove');return Boolean(habitat&&herd.length===2&&herd.every(a=>a.habitatId===habitat.id&&a.position)&&visitTargetForState(s,habitat.id));};
/** Lifetime completed actions can predate a quest. Consecutive streaks advance only on the one canonical tick. Earned caps persist. */
export function evaluateElephantMissions(s:RuntimeState,fixedTick=false):void{
 if(s.schemaVersion===1||!s.elephantGrove||!conservationGrantView(s).qualified)return;
 const m=s.elephantGrove.missions,o=m.objectives,herd=elephants(s.animals),rules=ELEPHANT_MISSION_RULES;
 o.fedIds=herd.filter(a=>a.foodEaten>0).map(a=>a.id);o.wateredIds=herd.filter(a=>a.waterDrunk>0).map(a=>a.id);o.baths=herd.reduce((n,a)=>n+a.baths,0);o.enrichments=herd.reduce((n,a)=>n+Math.floor(a.enrichedTicks/ELEPHANT_ENRICHMENT.logTicks),0);
 const care=m.currentId==='EH02'&&o.comfortableTicks<rules.careTicks&&herd.length===2&&o.fedIds.length===2&&o.wateredIds.length===2&&herd.every(a=>elephantWelfareParts(s as ZooSaveV2,a).welfare>=rules.careWelfare),thriving=m.currentId==='EH04'&&o.thrivingTicks<rules.herdTicks&&herd.length===2&&herd.every(a=>elephantWelfareParts(s as ZooSaveV2,a).welfare>=rules.herdWelfare);
 if(o.comfortableTicks<rules.careTicks){if(m.currentId!=='EH02'||!care)o.comfortableTicks=0;else if(fixedTick)o.comfortableTicks++;}
 if(o.thrivingTicks<rules.herdTicks){if(m.currentId!=='EH04'||!thriving)o.thrivingTicks=0;else if(fixedTick)o.thrivingTicks++;}
 if(o.viewedVisitorIds.length>=rules.viewers)return;
 const feedback=[...s.visitorFlow.feedback.recent,...s.visitors.flatMap(v=>v.experience?.feedback?[v.experience.feedback]:[])],proofs=admissionProofs(s);
 for(const f of feedback){if(o.viewedVisitorIds.length>=rules.viewers)break;if(o.viewedVisitorIds.includes(f.visitorId)||f.samples!==30||f.occupiedSamples<1||!['comfortable','concerned'].includes(f.outcome)||!s.world.habitats.some(h=>h.id===f.habitatId&&h.kind==='elephant-grove')||!proofs.some(a=>a.visitorId===f.visitorId&&a.entry?.habitatId===f.habitatId))continue;o.viewedVisitorIds.push(f.visitorId);}
}
/** Detached read-only progress. Rendering cannot add duration or reward. */
export function elephantMissionView(s:RuntimeState){
 const qualified=conservationGrantView(s).qualified,m=s.elephantGrove?.missions??initialElephantMissions(),o=m.objectives,connected=home(s),rules=ELEPHANT_MISSION_RULES;
 return{qualified,command:s.economy.nextCommand,currentId:m.currentId,completed:m.completedIds.length,objectives:structuredClone(o),home:connected,rewards:m.rewards.reduce((n,r)=>n+(r.ledgerEntryId?ledgerProof(s,r.ledgerEntryId)?.amount??0:0),0),awards:m.rewards.flatMap(r=>r.award?[r.award]:[]),rows:EH_IDS.map(id=>{const ready=id==='EH01'?connected:id==='EH02'?o.comfortableTicks===rules.careTicks:id==='EH03'?o.baths>0&&o.enrichments>0:o.thrivingTicks===rules.herdTicks&&o.viewedVisitorIds.length===rules.viewers,status:'claimed'|'locked'|'ready'|'active'=m.completedIds.includes(id)?'claimed':!qualified||m.currentId!==id?'locked':ready?'ready':'active';return{id,status,...rules[id]};})};
}
export type ElephantMissionView=ReturnType<typeof elephantMissionView>;
/** A candidate must be durably committed with generation+revision CAS before publication, for cash and noncash alike. */
export function prepareElephantMission<S extends ZooSave>(s:S,q:ElephantMissionQuote):{ok:true;state:Extract<S,{schemaVersion:2|3|4}>}|{ok:false;reason:ElephantMissionFailure}{
 if(s.schemaVersion===1||!conservationGrantView(s).qualified||!q||!EH_IDS.includes(q.id))return{ok:false,reason:'locked'};
 const m=s.elephantGrove.missions;if(m.completedIds.includes(q.id))return{ok:false,reason:'claimed'};
 if(!Number.isSafeInteger(q.command)||q.command!==s.economy.nextCommand||q.command>=Number.MAX_SAFE_INTEGER)return{ok:false,reason:'stale'};
 if(m.currentId!==q.id)return{ok:false,reason:'locked'};if(elephantMissionView(s).rows.find(r=>r.id===q.id)?.status!=='ready')return{ok:false,reason:'incomplete'};
 const rule=ELEPHANT_MISSION_RULES[q.id];if(!Number.isSafeInteger(s.currency+rule.coins))return{ok:false,reason:'balance'};
 const next=structuredClone(s) as Extract<S,{schemaVersion:2|3|4}>,ledgerEntryId=rule.coins?`mission-${q.id.toLowerCase()}`:null;
 if(ledgerEntryId){if(ledgerProof(next,ledgerEntryId))return{ok:false,reason:'claimed'};next.currency+=rule.coins;next.ledger.push({id:ledgerEntryId,operationId:`claim-${q.id.toLowerCase()}`,kind:'reward',amount:rule.coins,balanceAfter:next.currency,tick:next.tick,relatedId:q.id.toLowerCase()});}
 next.elephantGrove.missions.completedIds.push(q.id);next.elephantGrove.missions.rewards.push({missionId:q.id,tick:next.tick,command:q.command,ledgerEntryId,award:rule.award});next.elephantGrove.missions.currentId=EH_IDS[next.elephantGrove.missions.completedIds.length]??null;next.economy.nextCommand++;
 const valid=validateSaveV2(next);return valid.ok?{ok:true,state:valid.value as Extract<S,{schemaVersion:2|3|4}>}:{ok:false,reason:'stale'};
}
