import type {ZooSaveV1} from '../core/state.ts';
import {admissionProofs,ledgerProof} from '../economy/journal.ts';
import {analyzePaths} from '../world/paths.ts';
import {welfareParts,WELFARE_RULES} from '../animals/welfare.ts';

export const VISITOR_MISSION_RULES=Object.freeze({admissions:3,viewings:1,coins:40,badgeId:'first-visitors' as const});
/** Reads actual paid receipts and completed occupied observations, never event payloads/UI flags.
 * First three paid identities plus one viewing receipt remain pinned in the existing bounded journal. */
export function captureVisitorObjective(s:ZooSaveV1){
 const o=s.missions.objectives,paid=admissionProofs(s).filter(a=>a.entry!==null&&/^arrival-[1-9][0-9]*$/.test(a.visitorId)&&ledgerProof(s,a.ledgerEntryId)?.kind==='ticket').sort((a,b)=>a.tick-b.tick||Number(a.visitorId.slice(8))-Number(b.visitorId.slice(8)));
 for(const a of paid)if(o.admittedVisitorIds.length<VISITOR_MISSION_RULES.admissions&&!o.admittedVisitorIds.includes(a.visitorId))o.admittedVisitorIds.push(a.visitorId);
 if(o.viewingEvidence)return;
 for(const v of s.visitors){const f=v.experience?.feedback,a=paid.find(a=>a.visitorId===v.id);if(v.entry?.status==='paid'&&v.journey?.viewed&&a?.entry&&f&&f.visitorId===v.id&&f.habitatId===a.entry.habitatId&&f.tick>=a.tick&&f.reason==='none'&&f.samples===30&&f.occupiedSamples>0&&(f.outcome==='comfortable'||f.outcome==='concerned')){o.viewingEvidence=structuredClone(f);o.viewedVisitorIds=[v.id];break;}}
}
/** Independent descriptive reads also reject malformed flags/duplicate IDs on mutable external snapshots. */
export function validVisitorViewing(s:ZooSaveV1){const f=s.missions.objectives.viewingEvidence;if(!f)return false;const a=admissionProofs(s).find(a=>a.visitorId===f.visitorId),e=a?ledgerProof(s,a.ledgerEntryId):undefined;return Boolean(a?.entry&&e?.kind==='ticket'&&e.relatedId===a.id&&f.habitatId===a.entry.habitatId&&f.tick>=a.tick&&f.tick<=s.tick&&f.reason==='none'&&f.samples===30&&f.occupiedSamples>0&&f.occupiedSamples<=30&&f.welfareHundredths>=0&&f.welfareHundredths<=f.occupiedSamples*10000&&f.score===Math.round(f.welfareHundredths/30/100)&&f.observedWelfare===Math.round(f.welfareHundredths/f.occupiedSamples/100)&&(f.outcome==='comfortable'||f.outcome==='concerned'));}
export function visitorMissionView(s:ZooSaveV1){const o=s.missions.objectives,proofs=admissionProofs(s),admissions=[...new Set(o.admittedVisitorIds)].filter(id=>proofs.some(a=>a.visitorId===id&&a.entry!==null)).length,viewings=validVisitorViewing(s)&&o.viewedVisitorIds.length===1&&o.viewedVisitorIds[0]===o.viewingEvidence!.visitorId?1:0;
 const connected=analyzePaths(s.world).habitats.some(h=>h.connected),parts=s.animals.map(a=>welfareParts(s,a)),placed=parts.filter(p=>p.habitat).length,badged=s.missions.completedIds.includes('Q03')&&s.missions.rewards.some(r=>'badgeId'in r&&r.missionId==='Q03'&&r.badgeId===VISITOR_MISSION_RULES.badgeId),qualified=admissions>=VISITOR_MISSION_RULES.admissions&&viewings>=VISITOR_MISSION_RULES.viewings;
 const next:'path'|'birds'|'gate'|'food'|'water'|'perch'|'observe'=!connected?'path':placed<2?'birds':!s.visitorFlow.open?'gate':parts.some(p=>!p.foodAccess)?'food':parts.some(p=>!p.waterAccess)?'water':parts.some(p=>p.welfare<WELFARE_RULES.low&&!p.perchAccess)?'perch':'observe';
 return{admissions,viewings,requiredAdmissions:VISITOR_MISSION_RULES.admissions,requiredViewings:VISITOR_MISSION_RULES.viewings,ids:[...o.admittedVisitorIds],viewedId:o.viewingEvidence?.visitorId??null,badged,qualified,connected,open:s.visitorFlow.open,next,coins:VISITOR_MISSION_RULES.coins,badgeId:VISITOR_MISSION_RULES.badgeId};}
