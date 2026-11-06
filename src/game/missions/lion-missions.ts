import {LQ_IDS,initialLionProgress,type ZooSave,type LionMissionId} from '../core/zoo-state.ts';
import type {RuntimeState} from '../core/state.ts';
import {lions} from '../core/species.ts';
import {lionGrantView} from '../economy/lion-grant.ts';
import {visitTargetForState} from '../visitors/graph.ts';
import {ledgerProof,admissionProofs} from '../economy/journal.ts';
import {validateSaveV3} from '../persistence/save-v3.ts';
export const LION_MISSION_RULES=Object.freeze({LQ01:{coins:0,award:'pride-founder' as const},LQ02:{coins:200,award:null},LQ03:{coins:0,award:'savanna-wildflowers' as const},LQ04:{coins:250,award:'savanna-guardian' as const}});
export interface LionMissionQuote {id:LionMissionId;command:number;}
const home=(s:RuntimeState)=>{const h=s.world.habitats.find(h=>h.kind==='lion-savanna'),pride=lions(s.animals);return Boolean(h&&pride.length===3&&pride.every(a=>a.habitatId===h.id)&&visitTargetForState(s,h.id));};
export function evaluateLionMissions(s:RuntimeState,fixedTick=false):void{
 if(s.schemaVersion!==3||!s.lionSavanna||!lionGrantView(s).qualified)return;const m=s.lionSavanna.missions,o=m.objectives,pride=lions(s.animals);
 o.fedIds=pride.filter(a=>a.foodEaten>0).map(a=>a.id);o.wateredIds=pride.filter(a=>a.waterDrunk>0).map(a=>a.id);o.roars=pride.reduce((n,a)=>n+a.roars,0);o.scentInvestigations=pride.reduce((n,a)=>n+a.scentInvestigations,0);
 const care=pride.length===3&&o.fedIds.length===3&&o.wateredIds.length===3&&pride.every(a=>a.welfare>=60),thriving=pride.length===3&&pride.every(a=>a.welfare>=70);
 if(o.comfortableTicks<50){if(m.currentId!=='LQ02'||!care)o.comfortableTicks=0;else if(fixedTick)o.comfortableTicks++;}
 if(o.thrivingTicks<100){if(m.currentId!=='LQ04'||!thriving)o.thrivingTicks=0;else if(fixedTick)o.thrivingTicks++;}
 if(o.viewedVisitorIds.length>=3)return;const feedback=[...s.visitorFlow.feedback.recent,...s.visitors.flatMap(v=>v.experience?.feedback?[v.experience.feedback]:[])],admissions=admissionProofs(s);
 for(const f of feedback){if(o.viewedVisitorIds.length>=3)break;if(o.viewedVisitorIds.includes(f.visitorId)||f.samples!==30||f.occupiedSamples<1||!['comfortable','concerned'].includes(f.outcome)||!s.world.habitats.some(h=>h.kind==='lion-savanna'&&h.id===f.habitatId)||!admissions.some(a=>a.visitorId===f.visitorId&&a.entry?.habitatId===f.habitatId))continue;o.viewedVisitorIds.push(f.visitorId);}
}
export function lionMissionView(s:RuntimeState){const qualified=lionGrantView(s).qualified,m=s.lionSavanna?.missions??initialLionProgress().missions,o=m.objectives;return {qualified,command:s.economy.nextCommand,currentId:m.currentId,completed:m.completedIds.length,objectives:structuredClone(o),awards:m.rewards.flatMap(r=>r.award?[r.award]:[]),rows:LQ_IDS.map(id=>{const ready=id==='LQ01'?home(s):id==='LQ02'?o.comfortableTicks===50:id==='LQ03'?o.roars>0&&o.scentInvestigations>0:o.thrivingTicks===100&&o.viewedVisitorIds.length===3,status=m.completedIds.includes(id)?'claimed' as const:!qualified||id!==m.currentId?'locked' as const:ready?'ready' as const:'active' as const;return {id,status,...LION_MISSION_RULES[id]};})};}
export function prepareLionMission(s:ZooSave,q:LionMissionQuote){
 if(s.schemaVersion!==3||!q||!LQ_IDS.includes(q.id)||!lionGrantView(s).qualified)return {ok:false as const,reason:'locked' as const};const m=s.lionSavanna.missions;if(m.completedIds.includes(q.id))return {ok:false as const,reason:'claimed' as const};if(!Number.isSafeInteger(q.command)||q.command!==s.economy.nextCommand||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};if(lionMissionView(s).rows.find(r=>r.id===q.id)?.status!=='ready')return {ok:false as const,reason:'incomplete' as const};
 const next=structuredClone(s),rule=LION_MISSION_RULES[q.id],id=rule.coins?`mission-${q.id.toLowerCase()}`:null;if(!Number.isSafeInteger(next.currency+rule.coins)||id&&ledgerProof(next,id))return {ok:false as const,reason:'stale' as const};if(id){next.currency+=rule.coins;next.ledger.push({id,operationId:`claim-${q.id.toLowerCase()}`,kind:'reward',amount:rule.coins,balanceAfter:next.currency,tick:next.tick,relatedId:q.id.toLowerCase()});}next.lionSavanna.missions.completedIds.push(q.id);next.lionSavanna.missions.rewards.push({missionId:q.id,command:q.command,tick:next.tick,ledgerEntryId:id,award:rule.award});next.lionSavanna.missions.currentId=LQ_IDS[next.lionSavanna.missions.completedIds.length]??null;next.economy.nextCommand++;const checked=validateSaveV3(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'stale' as const};
}
