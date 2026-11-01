import type {VisitorFeedback,VisitorFeedbackSummary} from '../game/core/state.ts';
import {entryMessages,type EntryLocale} from './locale.ts';
const keys={comfortable:'visitorComfortable',concerned:'visitorConcerned',empty:'visitorEmpty', 'no-habitat':'visitorNoHabitat',unreachable:'visitorUnreachable',interrupted:'visitorInterrupted'} as const;
/** Text/icons and cause describe the immutable per-visit outcome, never current global welfare. */
export function presentVisitorFeedback(f:VisitorFeedback,locale:EntryLocale):string{
 const c=entryMessages[locale],badge=c[keys[f.outcome]],score=f.score===null?c.visitorUnscored:c.visitorScore.replace('{score}',String(f.score));
 let reason:string;
 if(f.outcome==='comfortable'||f.outcome==='concerned')reason=c.visitorObserved.replace('{w}',String(f.observedWelfare)).replace('{presence}',String(Math.round(f.occupiedSamples/f.samples*100)))+(f.outcome==='concerned'?' '+c.visitorCareAction:'');
 else if(f.outcome==='interrupted')reason=c[({closed:'visitorClosedReason','access-lost':'visitorAccessReason','habitat-removed':'visitorRemovedReason','time-limit':'visitorTimeoutReason',none:'visitorAccessReason'}as const)[f.reason]];
 else reason=c[({empty:'visitorEmptyReason','no-habitat':'visitorNoHabitatReason',unreachable:'visitorUnreachableReason'}as const)[f.outcome]];
 return c.visitorFeedbackLine.replace('{badge}',badge).replace('{score}',score).replace('{reason}',reason);
}
export function renderVisitorSummary(root:HTMLElement,summary:VisitorFeedbackSummary,locale:EntryLocale,activeIds:string[]):void{
 const c=entryMessages[locale],p=root.querySelector('[data-visitor-satisfaction]');
 const text=(summary.scored?c.visitorSummary.replace('{average}',String(Math.round(summary.scoreSum/summary.scored))).replace('{n}',String(summary.scored)).replace('{positive}',String(summary.positive)).replace('{negative}',String(summary.negative)):c.visitorSummaryEmpty)+' '+c.visitorSummaryInterrupted.replace('{n}',String(summary.interrupted));
 if(p&&p.textContent!==text)p.textContent=text;
 const list=root.querySelector('[data-visitor-recent]');if(!list)return;list.setAttribute('aria-label',c.visitorRecentLabel);
 const recent=summary.recent.filter(f=>!activeIds.includes(f.visitorId)),key=locale+JSON.stringify(recent);if(list.getAttribute('data-feedback-key')===key)return;
 list.setAttribute('data-feedback-key',key);list.replaceChildren(...recent.map(f=>{const li=document.createElement('li');li.dataset.visitorOutcome=f.outcome;li.textContent=c.visitorRecent.replace('{name}',c.visitorsName.replace('{id}',f.visitorId.slice(8))).replace('{feedback}',presentVisitorFeedback(f,locale));return li;}));
}
