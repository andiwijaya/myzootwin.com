import type {Visitor,VisitorExperience,VisitorFeedback,VisitorOutcome,VisitorInterruption,ZooSaveV1} from '../core/state.ts';

/** Starting game rules, not scientific visitor research or final balancing. No FIFO wait penalty. */
export const SATISFACTION_RULES=Object.freeze({comfortableThreshold:60,observationTicks:30,recentLimit:4});
export const newExperience=():VisitorExperience=>({samples:0,occupiedSamples:0,welfareHundredths:0,feedback:null});
/** Called only while actually facing/viewing the target, after this tick's animal welfare update. */
export function observeHabitat(s:ZooSaveV1,v:Visitor):void{
 const e=v.experience;if(!e||e.feedback||e.samples>=SATISFACTION_RULES.observationTicks)return;
 const birds=s.animals.filter(a=>a.habitatId===v.journey?.habitatId&&a.position!==null);
 e.samples++;
 if(birds.length){e.occupiedSamples++;e.welfareHundredths+=Math.round(birds.reduce((n,a)=>n+a.welfare,0)/birds.length*100);}
}
export function resetObservation(v:Visitor):void{if(v.experience&&!v.experience.feedback){v.experience.samples=0;v.experience.occupiedSamples=0;v.experience.welfareHundredths=0;}}
export function finishFeedback(s:ZooSaveV1,v:Visitor,outcome:VisitorOutcome,reason:VisitorInterruption='none'):boolean{
 const e=v.experience;if(!e||e.feedback)return false;
 if(['comfortable','concerned','empty'].includes(outcome)&&e.samples!==SATISFACTION_RULES.observationTicks)return false;
 if((outcome==='interrupted')===(reason==='none'))return false;
 const score=outcome==='interrupted'?null:['comfortable','concerned'].includes(outcome)?Math.round(e.welfareHundredths/e.samples/100):0;
 const feedback:VisitorFeedback={visitorId:v.id,habitatId:v.journey?.habitatId??null,tick:s.tick,outcome,reason,score,observedWelfare:e.occupiedSamples?Math.round(e.welfareHundredths/e.occupiedSamples/100):null,samples:e.samples,occupiedSamples:e.occupiedSamples,welfareHundredths:e.welfareHundredths};
 e.feedback=feedback;v.satisfaction=score;
 const f=s.visitorFlow.feedback;f.evaluated++;
 if(score!==null){f.scored++;f.scoreSum+=score;if(outcome==='comfortable')f.positive++;else f.negative++;}else f.interrupted++;
 f.recent.unshift(structuredClone(feedback));f.recent.length=Math.min(f.recent.length,SATISFACTION_RULES.recentLimit);return true;
}
export function completeFeedback(s:ZooSaveV1,v:Visitor):boolean{
 const e=v.experience;if(!e||e.feedback||e.samples!==SATISFACTION_RULES.observationTicks)return false;
 const score=Math.round(e.welfareHundredths/e.samples/100);
 return finishFeedback(s,v,!e.occupiedSamples?'empty':score>=SATISFACTION_RULES.comfortableThreshold?'comfortable':'concerned');
}
export function interruptedFeedback(s:ZooSaveV1,v:Visitor,reason:Exclude<VisitorInterruption,'none'>):void{finishFeedback(s,v,'interrupted',reason);}
