import {ZQ_IDS,initialZebraProgress,zebras,type ZebraMissionId} from '../core/zebra-state.ts';
import type {RuntimeState} from '../core/runtime-state.ts';
import type {ZooSave} from '../core/zoo-state.ts';
import {ZEBRA_MISSION_RULES as RULES,ZEBRA_PRICES} from '../animals/zebras/rules.ts';
import {visitTargetForState} from '../visitors/graph.ts';
import {ledgerProof,admissionProofs} from '../economy/journal.ts';
import {validateSaveV5} from '../persistence/save-v5.ts';
import {analyzePaths} from '../world/paths.ts';

export interface ZebraMissionQuote {id:ZebraMissionId;command:number;}
function qualified(s:RuntimeState){const g=s.zebraGrasslands?.grant,e=g?ledgerProof(s,g.ledgerEntryId):null;return s.schemaVersion===5&&Boolean(g&&e?.kind==='reward'&&e.amount===ZEBRA_PRICES.grant&&e.operationId===g.id&&e.relatedId==='zebra-grasslands');}
function connected(s:RuntimeState){const home=s.world.habitats.find(h=>h.kind==='zebra-grasslands'),herd=zebras(s.animals);return Boolean(home&&herd.length===4&&herd.every(a=>a.habitatId===home.id)&&visitTargetForState(s,home.id));}
/** Only accepted canonical events collect lifetime action proofs. Fixed ticks alone
 * advance continuous intervals; views/cold loading never evaluate or award them. */
export function evaluateZebraMissions(s:RuntimeState,fixedTick=false){
 if(!qualified(s)||!s.zebraGrasslands)return;
 const m=s.zebraGrasslands.missions,o=m.objectives,herd=zebras(s.animals);
 o.fedIds=herd.filter(a=>a.foodEaten>0).map(a=>a.id);o.wateredIds=herd.filter(a=>a.waterDrunk>0).map(a=>a.id);
 o.restedIds=herd.filter(a=>a.restedTicks>0).map(a=>a.id);o.enrichedIds=herd.filter(a=>a.enrichedTicks>0).map(a=>a.id);
 // Each real reciprocal completion increments both partners once.
 o.groomings=Math.floor(herd.reduce((n,a)=>n+a.groomings,0)/2);
 const care=herd.length===4&&o.fedIds.length===4&&o.wateredIds.length===4&&herd.every(a=>a.welfare>=60);
 const thriving=herd.length===4&&herd.every(a=>a.welfare>=70);
 if(o.comfortableTicks<RULES.comfortableTicks){if(m.currentId!=='ZQ02'||!care)o.comfortableTicks=0;else if(fixedTick)o.comfortableTicks++;}
 if(o.thrivingTicks<RULES.thrivingTicks){if(m.currentId!=='ZQ04'||!thriving)o.thrivingTicks=0;else if(fixedTick)o.thrivingTicks++;}
 if(o.viewedVisitorIds.length>=RULES.viewers)return;
 const admissions=admissionProofs(s),feedback=[...s.visitorFlow.feedback.recent,...s.visitors.flatMap(v=>v.experience?.feedback?[v.experience.feedback]:[])];
 for(const f of feedback){
  if(o.viewedVisitorIds.length>=RULES.viewers)break;
  if(o.viewedVisitorIds.includes(f.visitorId)||f.samples!==30||f.occupiedSamples!==30||!['comfortable','concerned'].includes(f.outcome)||!s.world.habitats.some(h=>h.kind==='zebra-grasslands'&&h.id===f.habitatId))continue;
  const a=admissions.find(a=>a.visitorId===f.visitorId&&a.entry?.habitatId===f.habitatId),e=a?ledgerProof(s,a.ledgerEntryId):null;
  if(a&&e?.kind==='ticket'&&e.amount===10&&e.relatedId===a.id&&e.tick<=f.tick)o.viewedVisitorIds.push(f.visitorId);
 }
}
export function zebraMissionView(s:RuntimeState){
 const eligible=qualified(s),m=s.zebraGrasslands?.missions??initialZebraProgress().missions,o=m.objectives;
 return{qualified:eligible,command:s.economy.nextCommand,currentId:m.currentId,completed:m.completedIds.length,objectives:structuredClone(o),awards:m.rewards.flatMap(r=>r.award?[r.award]:[]),rows:ZQ_IDS.map(id=>{
  const ready=id==='ZQ01'?connected(s):id==='ZQ02'?o.comfortableTicks===RULES.comfortableTicks:id==='ZQ03'?o.groomings>0&&(o.restedIds.length>0||o.enrichedIds.length>0):o.thrivingTicks===RULES.thrivingTicks&&o.viewedVisitorIds.length===RULES.viewers;
  const status=m.completedIds.includes(id)?'claimed' as const:!eligible||m.currentId!==id?'locked' as const:ready?'ready' as const:'active' as const;
  return{id,status,...RULES[id]};
 })};
}
/** Pure exact-once quote. The live owner only adopts after durable CAS succeeds. */
export function prepareZebraMission(s:ZooSave,q:ZebraMissionQuote){
 if(s.schemaVersion!==5||!q||!ZQ_IDS.includes(q.id)||!qualified(s))return{ok:false as const,reason:'locked' as const};
 if(!validateSaveV5(s).ok)return{ok:false as const,reason:'stale' as const};
 const m=s.zebraGrasslands.missions;
 if(m.completedIds.includes(q.id))return{ok:false as const,reason:'claimed' as const};
 if(!Number.isSafeInteger(q.command)||q.command!==s.economy.nextCommand||q.command>=Number.MAX_SAFE_INTEGER)return{ok:false as const,reason:'stale' as const};
 if(zebraMissionView(s).rows.find(r=>r.id===q.id)?.status!=='ready')return{ok:false as const,reason:'incomplete' as const};
 const next=structuredClone(s),rule=RULES[q.id],id=rule.coins?`mission-${q.id.toLowerCase()}`:null;
 if(!Number.isSafeInteger(next.currency+rule.coins)||id&&ledgerProof(next,id))return{ok:false as const,reason:'stale' as const};
 if(id){next.currency+=rule.coins;next.ledger.push({id,operationId:`claim-${q.id.toLowerCase()}`,kind:'reward',amount:rule.coins,balanceAfter:next.currency,tick:next.tick,relatedId:q.id.toLowerCase()});}
 next.zebraGrasslands.missions.completedIds.push(q.id);
 const access=q.id==='ZQ01'?analyzePaths(s.world).habitats.find(h=>h.habitatId===s.world.habitats.find(h=>h.kind==='zebra-grasslands')?.id):null;
 next.zebraGrasslands.missions.rewards.push({missionId:q.id,command:q.command,tick:next.tick,ledgerEntryId:id,award:rule.award,...(access?.viewingCell?{connection:{habitatId:access.habitatId,viewingCell:structuredClone(access.viewingCell),route:structuredClone(access.route)}}:{})});
 next.zebraGrasslands.missions.currentId=ZQ_IDS[next.zebraGrasslands.missions.completedIds.length]??null;
 next.economy.nextCommand++;
 const checked=validateSaveV5(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'stale' as const};
}
