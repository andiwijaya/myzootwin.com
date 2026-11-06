import type {HabitatKind} from '../game/core/species.ts';
import {formatNumber} from './i18n-format.ts';
import type {VisitorFeedback,VisitorFeedbackSummary} from '../game/core/state.ts';
import {entryMessages,type EntryLocale} from './locale.ts';
const keys={comfortable:'visitorComfortable',concerned:'visitorConcerned',empty:'visitorEmpty', 'no-habitat':'visitorNoHabitat',unreachable:'visitorUnreachable',interrupted:'visitorInterrupted'} as const;
/** Text/icons and cause describe the immutable per-visit outcome, never current global welfare. */
export function presentVisitorFeedback(f:VisitorFeedback,locale:EntryLocale,habitatKind?:HabitatKind):string{
 const c=entryMessages[locale],badge=c[keys[f.outcome]],score=f.score===null?c.visitorUnscored:c.visitorScore.replace('{score}',formatNumber(f.score,locale));
 let reason:string;
 if(f.outcome==='comfortable'||f.outcome==='concerned')reason=c.visitorObserved.replace('{w}',formatNumber(f.observedWelfare,locale)).replace('{presence}',formatNumber(Math.round(f.occupiedSamples/f.samples*100),locale))+(f.outcome==='concerned'?' '+c.visitorCareAction:'');
 else if(f.outcome==='interrupted')reason=c[({closed:'visitorClosedReason','access-lost':'visitorAccessReason','habitat-removed':'visitorRemovedReason','time-limit':'visitorTimeoutReason',none:'visitorAccessReason'}as const)[f.reason]];
 else reason=c[({empty:'visitorEmptyReason','no-habitat':'visitorNoHabitatReason',unreachable:'visitorUnreachableReason'}as const)[f.outcome]];
 const feedback=c.visitorFeedbackLine.replace('{badge}',badge).replace('{score}',score).replace('{reason}',reason);
 return habitatKind?c.visitorHabitatFeedback.replace('{habitat}',c[habitatKind==='lion-savanna'?'visitorTargetLion':habitatKind==='elephant-grove'?'visitorTargetElephant':'visitorTargetMacaw']).replace('{feedback}',feedback):feedback;
}
export function renderVisitorSummary(root:HTMLElement,summary:VisitorFeedbackSummary,locale:EntryLocale,activeIds:string[],habitatKinds?:Record<string,HabitatKind>):void{
 const c=entryMessages[locale],p=root.querySelector('[data-visitor-satisfaction]');
 const text=(summary.scored?c.visitorSummary.replace('{average}',formatNumber(Math.round(summary.scoreSum/summary.scored),locale)).replace('{n}',formatNumber(summary.scored,locale)).replace('{positive}',formatNumber(summary.positive,locale)).replace('{negative}',formatNumber(summary.negative,locale)):c.visitorSummaryEmpty)+' '+c.visitorSummaryInterrupted.replace('{n}',formatNumber(summary.interrupted,locale));
 if(p&&p.textContent!==text)p.textContent=text;
 const list=root.querySelector('[data-visitor-recent]');if(!list)return;list.setAttribute('aria-label',c.visitorRecentLabel);
 const recent=summary.recent.filter(f=>!activeIds.includes(f.visitorId)),key=locale+JSON.stringify([recent,habitatKinds]);if(list.getAttribute('data-feedback-key')===key)return;
 list.setAttribute('data-feedback-key',key);list.replaceChildren(...recent.map(f=>{const li=document.createElement('li');li.dataset.visitorOutcome=f.outcome;li.textContent=c.visitorRecent.replace('{name}',c.visitorsName.replace('{id}',f.visitorId.slice(8))).replace('{feedback}',presentVisitorFeedback(f,locale,f.habitatId?habitatKinds?.[f.habitatId]:undefined));return li;}));
}
