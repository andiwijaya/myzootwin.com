import {GQ_IDS,initialGiraffeProgress,giraffes,type GiraffeMissionId} from '../core/giraffe-state.ts';
import type {ZooSave} from '../core/zoo-state.ts';
import type {RuntimeState} from '../core/runtime-state.ts';
import {GIRAFFE_MISSION_RULES} from '../animals/giraffes/rules.ts';
import {giraffeGrantView} from '../economy/giraffe-grant.ts';
import {visitTargetForState} from '../visitors/graph.ts';
import {ledgerProof,admissionProofs} from '../economy/journal.ts';
import {validateMultiSave} from '../persistence/save.ts';
export interface GiraffeMissionQuote {id:GiraffeMissionId;command:number;}
const connected=(s:RuntimeState)=>{const h=s.world.habitats.find(h=>h.kind==='giraffe-plains'),herd=giraffes(s.animals);return Boolean(h&&herd.length>=1&&herd.every(a=>a.habitatId===h.id)&&visitTargetForState(s,h.id));};
export function evaluateGiraffeMissions(s:RuntimeState,fixedTick=false){
 if((s.schemaVersion!==4&&s.schemaVersion!==5)||!s.giraffePlains||!giraffeGrantView(s).qualified)return;const m=s.giraffePlains.missions,o=m.objectives,herd=giraffes(s.animals);
 o.fedIds=herd.filter(a=>a.foodEaten>0).map(a=>a.id);o.wateredIds=herd.filter(a=>a.waterDrunk>0).map(a=>a.id);o.highBrowses=herd.reduce((n,a)=>n+a.highBrowses,0);o.socialInteractions=herd.reduce((n,a)=>n+a.socialInteractions,0);
 const care=herd.length===3&&o.fedIds.length===3&&o.wateredIds.length===3&&herd.every(a=>a.welfare>=60),thriving=herd.length===3&&herd.every(a=>a.welfare>=70);
 if(o.comfortableTicks<50){if(m.currentId!=='GQ02'||!care)o.comfortableTicks=0;else if(fixedTick)o.comfortableTicks++;}
 if(o.thrivingTicks<100){if(m.currentId!=='GQ04'||!thriving)o.thrivingTicks=0;else if(fixedTick)o.thrivingTicks++;}
 if(o.viewedVisitorIds.length>=3)return;const feedback=[...s.visitorFlow.feedback.recent,...s.visitors.flatMap(v=>v.experience?.feedback?[v.experience.feedback]:[])],admissions=admissionProofs(s);
 for(const f of feedback){if(o.viewedVisitorIds.length>=3)break;if(o.viewedVisitorIds.includes(f.visitorId)||f.samples!==30||f.occupiedSamples<1||!['comfortable','concerned'].includes(f.outcome)||!s.world.habitats.some(h=>h.kind==='giraffe-plains'&&h.id===f.habitatId)||!admissions.some(a=>a.visitorId===f.visitorId&&a.entry?.habitatId===f.habitatId))continue;o.viewedVisitorIds.push(f.visitorId);}
}
export function giraffeMissionView(s:RuntimeState){const qualified=giraffeGrantView(s).qualified,m=s.giraffePlains?.missions??initialGiraffeProgress().missions,o=m.objectives;return {qualified,command:s.economy.nextCommand,currentId:m.currentId,completed:m.completedIds.length,objectives:structuredClone(o),awards:m.rewards.flatMap(r=>r.award?[r.award]:[]),rows:GQ_IDS.map(id=>{const ready=id==='GQ01'?connected(s):id==='GQ02'?o.comfortableTicks===50:id==='GQ03'?o.highBrowses>=2&&o.socialInteractions>0:o.thrivingTicks===100&&o.viewedVisitorIds.length===3,status=m.completedIds.includes(id)?'claimed' as const:!qualified||id!==m.currentId?'locked' as const:ready?'ready' as const:'active' as const;return {id,status,...GIRAFFE_MISSION_RULES[id]};})};}
export function prepareGiraffeMission(s:ZooSave,q:GiraffeMissionQuote){
 if((s.schemaVersion!==4&&s.schemaVersion!==5)||!q||!GQ_IDS.includes(q.id)||!giraffeGrantView(s).qualified)return {ok:false as const,reason:'locked' as const};const m=s.giraffePlains.missions;if(m.completedIds.includes(q.id))return {ok:false as const,reason:'claimed' as const};if(!Number.isSafeInteger(q.command)||q.command!==s.economy.nextCommand||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};if(giraffeMissionView(s).rows.find(r=>r.id===q.id)?.status!=='ready')return {ok:false as const,reason:'incomplete' as const};
 const next=structuredClone(s),rule=GIRAFFE_MISSION_RULES[q.id],id=rule.coins?`mission-${q.id.toLowerCase()}`:null;if(!Number.isSafeInteger(next.currency+rule.coins)||id&&ledgerProof(next,id))return {ok:false as const,reason:'stale' as const};if(id){next.currency+=rule.coins;next.ledger.push({id,operationId:`claim-${q.id.toLowerCase()}`,kind:'reward',amount:rule.coins,balanceAfter:next.currency,tick:next.tick,relatedId:q.id.toLowerCase()});}next.giraffePlains.missions.completedIds.push(q.id);next.giraffePlains.missions.rewards.push({missionId:q.id,command:q.command,tick:next.tick,ledgerEntryId:id,award:rule.award});next.giraffePlains.missions.currentId=GQ_IDS[next.giraffePlains.missions.completedIds.length]??null;next.economy.nextCommand++;const checked=validateMultiSave(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'stale' as const};
}
