import { revealHudTarget, scrollHudTarget } from './hud-layout.ts';
import type {BirdsView,BirdInfo} from '../game/animals/autonomy.ts';
import type {CareCause} from '../game/animals/welfare.ts';
import {entryMessages,type EntryLocale,type EntryMessage} from './locale.ts';
const causes:Record<CareCause,EntryMessage>={habitat:'careCauseHabitat','food-missing':'careCauseFoodMissing','food-unreachable':'careCauseFoodUnreachable','food-empty':'careCauseFoodEmpty',hungry:'careCauseHungry','water-missing':'careCauseWaterMissing','water-unreachable':'careCauseWaterUnreachable','water-empty':'careCauseWaterEmpty',thirsty:'careCauseThirsty','perch-missing':'careCausePerchMissing','perch-unreachable':'careCausePerchUnreachable',tired:'careCauseTired',bored:'careCauseBored'};
const set=(el:Element|null,value:string)=>{if(el&&el.textContent!==value)el.textContent=value;};
/** Stable keyed DOM, no timers or global listeners. Tick scores never replace a focused button. */
export function mountAnimalInfo(root:HTMLElement,signal:AbortSignal){
 const list=root.querySelector('[data-birds-list]'),panel=root.querySelector<HTMLElement>('[data-animal-detail]'),announcement=root.querySelector('[data-care-announcement]');
 list?.replaceChildren();if(panel){panel.hidden=true;panel.removeAttribute('data-animal-id');}set(announcement,'');const oldAlerts=root.querySelector('[data-care-alerts]');oldAlerts?.replaceChildren();oldAlerts?.removeAttribute('data-signature');oldAlerts?.removeAttribute('lang');
 let view:BirdsView={habitat:false,placed:0,birds:[],tick:0},locale:EntryLocale='en',active=false,selected:string|null=null,lastSignature='',lastAnnouncedTick=-100;
 const nodes=new Map<string,{row:HTMLLIElement;summary:HTMLParagraphElement;status:HTMLParagraphElement;button:HTMLButtonElement}>();
 const name=(b:BirdInfo)=>entryMessages[locale].birdName.replace('{n}',String(b.ordinal));
 function draw(){const c=entryMessages[locale];
  for(const [id,n]of nodes)if(!view.placed||!view.birds.some(b=>b.id===id)){n.row.remove();nodes.delete(id);}
  if(!view.placed){selected=null;lastSignature='';set(announcement,'');}
  if(view.placed)for(const b of view.birds){let n=nodes.get(b.id);if(!n){const row=document.createElement('li'),summary=document.createElement('p'),status=document.createElement('p'),button=document.createElement('button');row.dataset.birdId=b.id;summary.dataset.birdSummary='';status.dataset.birdWellbeing='';status.setAttribute('aria-live','off');button.type='button';button.dataset.animalInfo=b.id;button.setAttribute('aria-controls','animal-details');row.append(summary,status,button);list?.append(row);n={row,summary,status,button};nodes.set(b.id,n);}
   set(n.summary,c.birdStatus.replace('{name}',name(b)).replace('{behavior}',c[b.behavior==='rest'?'birdRest':b.behavior==='enrich'?'birdEnrich':b.behavior==='seek-rest'?'birdSeekRest':b.behavior==='drink'?'birdDrink':b.behavior==='seek-water'?'birdSeekWater':b.behavior==='eat'?'birdEat':b.behavior==='seek-food'?'birdSeekFood':b.behavior==='wander'?'birdWander':b.behavior==='perch'?'birdPerch':'birdIdle']).replace('{e}',String(b.energy)).replace('{b}',String(b.enrichment)).replace('{t}',String(b.thirst)).replace('{d}',String(b.waterDrunk)).replace('{h}',String(b.hunger)).replace('{n}',String(b.foodEaten)));
   set(n.status,c.careSummary.replace('{w}',String(Math.round(b.welfare))).replace('{status}',c[b.low?'careLow':'careGood']));n.row.dataset.welfareLow=String(b.low);n.button.setAttribute('aria-expanded',String(selected===b.id));n.button.disabled=!active;set(n.button,c.careInspect.replace('{name}',name(b)));
  }
  const b=view.birds.find(b=>b.id===selected);if(panel)panel.hidden=!active||!view.placed||!b;
  if(!active||!view.placed||!b){if(!view.birds.some(b=>b.id===selected))selected=null;return;}
  const number=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(n);
  panel!.dataset.animalId=b.id;panel!.dataset.welfare=String(b.welfare);panel!.dataset.welfareLow=String(b.low);
  set(root.querySelector('[data-care-name]'),c.careIdentity.replace('{name}',name(b)).replace('{id}',b.id));set(root.querySelector('[data-care-welfare]'),c.careWelfare.replace('{w}',number(b.welfare)).replace('{status}',c[b.low?'careLow':'careGood']));
  for(const [part,value,key]of [['food',b.foodScore,'careFoodPart'],['water',b.waterScore,'careWaterPart'],['habitat',b.habitatFit,'careHabitatPart'],['enrichment',b.enrichmentScore,'careEnrichmentPart']]as const)set(root.querySelector(`[data-care-part="${part}"]`),c[key].replace('{n}',number(value)));
  const alerts=root.querySelector('[data-care-alerts]');if(alerts){const signature=JSON.stringify(b.alerts);if(alerts.getAttribute('data-signature')!==signature||alerts.getAttribute('lang')!==locale){alerts.replaceChildren();for(const a of b.alerts){const li=document.createElement('li');li.dataset.careCause=a.cause;li.textContent=c[causes[a.cause]];if(a.action!=='wait'){const button=document.createElement('button');button.type='button';button.dataset.careTarget=a.action;button.textContent=c[a.action==='food'?'careGoFood':a.action==='water'?'careGoWater':a.action==='perch'?'careGoPerch':'careGoHabitat'];li.append(button);}alerts.append(li);}if(!b.alerts.length){const li=document.createElement('li');li.textContent=c.careNoIssues;alerts.append(li);}alerts.setAttribute('data-signature',signature);alerts.setAttribute('lang',locale);}}
  const signature=b.id+':'+b.low+':'+b.alerts.map(a=>a.cause).join(',')+':'+locale;if(signature!==lastSignature&&view.tick-lastAnnouncedTick>=30){set(announcement,c.careAnnouncement.replace('{name}',name(b)).replace('{status}',c[b.low?'careLow':'careGood']).replace('{cause}',b.alerts[0]?c[causes[b.alerts[0].cause]]:c.careNoIssues));lastSignature=signature;lastAnnouncedTick=view.tick;}
 }
 root.addEventListener('click',event=>{const target=event.target as HTMLElement,inspect=target.closest<HTMLButtonElement>('[data-animal-info]'),dismiss=target.closest('[data-care-dismiss]'),care=target.closest<HTMLButtonElement>('[data-care-target]');if(!active)return;
  if(inspect){selected=inspect.dataset.animalInfo??null;lastAnnouncedTick=view.tick-30;draw();root.querySelector<HTMLElement>('[data-care-name]')?.focus({preventScroll:true});scrollHudTarget(panel);}
  if(dismiss){const old=selected;selected=null;draw();nodes.get(old??'')?.button.focus({preventScroll:true});}
  if(care){const kind=care.dataset.careTarget,tools=root.closest('[data-play-entry]')?.querySelector<HTMLElement>(kind==='habitat'?'[data-placement-tools]':`[data-${kind}-tools]`);revealHudTarget(tools??null);const button=Array.from(tools?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]).find(b=>!b.closest('[hidden]'));scrollHudTarget(tools);button?.focus({preventScroll:true});scrollHudTarget(button??null);}
 },{signal});
 panel?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();const old=selected;selected=null;draw();nodes.get(old??'')?.button.focus({preventScroll:true});}},{signal});
 return {update(next:BirdsView,l:EntryLocale,ready:boolean){if(locale!==l||active!==ready||next.tick<view.tick){lastSignature='';lastAnnouncedTick=next.tick-30;}view=next;locale=l;active=ready;if(!ready)set(announcement,'');draw();}};
}
