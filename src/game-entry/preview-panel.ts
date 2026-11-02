import type {VisualSettings} from '../game/core/visual-settings.ts';
import {formatNumber} from './i18n-format.ts';
import { revealHudTarget, scrollHudTarget } from './hud-layout.ts';
import {mountSpeedPanel,type SpeedView} from './speed-panel.ts';
import {mountOnboardingPanel} from './onboarding-panel.ts';
import type {FirstMissionGuide} from '../game/missions/onboarding.ts';
import {mountMissionPanel} from './mission-panel.ts';
import type {MissionView} from '../game/missions/engine.ts';
import type {RecoveryView,RecoveryQuote} from '../game/economy/recovery.ts';
import type {EconomyView} from '../game/economy/spending.ts';
import {renderTickets} from './ticket-feedback.ts';
import {presentVisitorFeedback,renderVisitorSummary} from './visitor-feedback.ts';
import type {ArrivalView} from '../game/visitors/arrivals.ts';
import {mountAnimalInfo} from './animal-info.ts';
import type {PerchView,PerchCommand} from '../game/animals/resting.ts';
import type {FoodView,FoodCommand} from '../game/animals/feeding.ts';
import type {BirdsView,BirdCommand} from '../game/animals/autonomy.ts';
import type {StudioView,StudioCommand} from '../game/render3d/macaw/studio-contract.ts';
import type {EditView,RemovalQuote,EditTarget} from '../game/world/editing.ts';
import type {AccessSummary} from '../game/world/paths.ts';
import {sanctuarySessionFor} from '../game/core/session-state.ts';
import type { PlacementCommand, PlacementView } from '../game/world/placement-preview.ts';
import type { SceneIdentity } from '../game/render3d/scene-selection.ts';
import { presentSelection } from './selection-presentation.ts';
import type { CameraCommand } from '../game/render3d/camera-navigation.ts';
import { createPreviewController, type PreviewLoader, type PreviewState } from '../game/render3d/preview-controller';
import { entryMessages, type EntryLocale, type EntryMessage } from './locale';

export interface PreviewPanelOptions { loadRenderer?: PreviewLoader; stateStore?:import("../game/core/session-state.ts").SanctuarySessionState;canOpen?:()=>boolean;beforeOpen?:()=>boolean; }
const mounted = new WeakMap<HTMLElement, ReturnType<typeof createPanel>>();

function createPanel(root: HTMLElement, options: PreviewPanelOptions) {
  const panel = root.querySelector<HTMLElement>('[data-renderer-panel]');
  const illustration = root.querySelector<HTMLElement>('[data-preview-illustration]');
  const host = root.querySelector<HTMLElement>('[data-preview-stage]');
  const feedback = root.querySelector<HTMLElement>('[data-preview-feedback]');
  const title = root.querySelector<HTMLElement>('[data-preview-title]');
  const detail = root.querySelector<HTMLElement>('[data-preview-detail]');
  const caption = root.querySelector<HTMLElement>('[data-preview-caption]');
  const open = root.querySelector<HTMLButtonElement>('[data-preview-open]');
  const close = root.querySelector<HTMLButtonElement>('[data-preview-close]');
  const retry = root.querySelector<HTMLButtonElement>('[data-preview-retry]');
  const reload = root.querySelector<HTMLButtonElement>('[data-preview-reload]');
  if (!panel || !illustration || !host || !feedback || !title || !detail || !caption || !open || !close || !retry || !reload) throw new Error('Incomplete preview panel');
  let recovery:RecoveryView|undefined,recoveryPending:RecoveryQuote|null=null;
  const recoveryDialog=root.querySelector<HTMLDialogElement>('[data-recovery-dialog]');
  const recoveryText=()=>{if(!recovery)return'';const c=entryMessages[locale],key=({habitat:'recoveryHabitat',path:'recoveryPath',food:'recoveryFood',water:'recoveryWater',perch:'recoveryPerch','food-refill':'recoveryFoodRefill','water-refill':'recoveryWaterRefill',rations:'recoveryRations',welcome:'recoveryWelcome',open:'recoveryOpen',reclaim:'recoveryReclaim','repair-food':'recoveryRepairFood','repair-water':'recoveryRepairWater','repair-perch':'recoveryRepairPerch',wait:'recoveryWait',steady:'recoverySteady'}as const)[recovery.kind];return c[key].replace('{x}',formatNumber((recovery.cell?.x??0)+1,locale)).replace('{z}',formatNumber((recovery.cell?.z??0)+1,locale)).replace('{refund}',formatNumber(recovery.refund,locale));};
  function renderRecovery(){const section=root.querySelector<HTMLElement>('[data-recovery-tools]');if(!section||!recovery)return;section.hidden=state.status!=='ready'||studio.active||!recovery.low;section.dataset.kind=recovery.kind;section.dataset.gift=String(recovery.gift);section.dataset.command=String(recovery.command);section.dataset.wait=String(recovery.waitTicks);const c=entryMessages[locale],cost=recovery.gift?c.recoveryGift:c.recoveryCost.replace('{cost}',formatNumber(recovery.cost,locale)).replace('{balance}',formatNumber(economy?.balance??0,locale)),texts={'[data-recovery-title]':c.recoveryTitle,'[data-recovery-intro]':c.recoveryIntro,'[data-recovery-next]':recoveryText(),'[data-recovery-cost]':cost,'[data-recovery-wait]':recovery.waitTicks?c.recoveryCooldown.replace('{seconds}',formatNumber(Math.ceil(recovery.waitTicks/10),locale)):!recovery.available&&recovery.kind!=='steady'?c.recoveryWait:'','[data-recovery-review]':c.recoveryAction,'#recovery-dialog-title':c.recoveryDialog,'[data-recovery-confirm-step]':recoveryText(),'[data-recovery-confirm-cost]':cost,'[data-recovery-cancel]':c.recoveryCancel,'[data-recovery-confirm]':c.recoveryConfirm};for(const[key,value]of Object.entries(texts)){const e=root.querySelector(key);if(e&&e.textContent!==value)e.textContent=value;}const button=root.querySelector<HTMLButtonElement>('[data-recovery-review]');if(button)button.disabled=!recovery.available;}
  let economy:EconomyView|null=null;
  let locale: EntryLocale = 'en';
  let disposed = false;
  let state: PreviewState = { status: 'closed' };
  const events = new AbortController();
  const speedPanel=mountSpeedPanel(root.querySelector('[data-speed-tools]'),events.signal,value=>controller.speed(value));
  host.addEventListener('scene-speed-change',event=>speedPanel.update((event as CustomEvent<SpeedView>).detail),{signal:events.signal});
  let guidedStart=false;
  const onboardingPanel=mountOnboardingPanel(root.querySelector('[data-onboarding-tools]'),events.signal,(c,r)=>controller.guide(c,r),()=>reviewRecovery(),()=>{root.dataset.guided='false';revealHudTarget(root.querySelector('[data-placement-tools]'));host.focus({preventScroll:true});scrollHudTarget(host);});
  host.addEventListener('scene-onboarding-change',event=>onboardingPanel.update((event as CustomEvent<FirstMissionGuide>).detail),{signal:events.signal});
  const careAction=(target:import('./care-mission-panel.ts').CareDestination)=>{
    if(root.querySelector('dialog[open]'))return;
    const selector=target==='birds'||target==='observe'?'[data-bird-tools]':`[data-${target}-tools]`,tool=root.querySelector<HTMLElement>(selector);
    revealHudTarget(tool??null);
    if(target==='observe'){
      const inspect=tool?.querySelector<HTMLButtonElement>('[data-welfare-low="true"] [data-animal-info]:not(:disabled)')??tool?.querySelector<HTMLButtonElement>('[data-animal-info]:not(:disabled)');
      if(inspect){inspect.click();return;}
    }
    const action=target==='birds'||target==='observe'?(tool?.querySelector<HTMLButtonElement>('[data-birds-command="welcome"]:not([hidden]):not(:disabled)')??tool?.querySelector<HTMLButtonElement>('[data-animal-info]:not(:disabled)')):['confirm','refill','preview'].map(command=>tool?.querySelector<HTMLButtonElement>(`[data-${target}-command="${command}"]:not(:disabled)`)).find(button=>button&&!button.closest('[hidden]'));
    if(action){action.focus({preventScroll:true});scrollHudTarget(action);}else{tool?.setAttribute('tabindex','-1');tool?.focus({preventScroll:true});scrollHudTarget(tool);}
  };
  const missionPanel=mountMissionPanel(root.querySelector('[data-mission-tools]'),events.signal,q=>controller.claimMission(q),careAction,target=>{if(root.querySelector('dialog[open]'))return;if(target==='gate'){controller.visitors('open');return;}if(target==='observe'){controller.visitors('focus');host.focus({preventScroll:true});scrollHudTarget(host);return;}if(target==='path'){root.dataset.guided='false';revealHudTarget(root.querySelector('[data-placement-tools]'));controller.placement('begin-path');host.focus({preventScroll:true});scrollHudTarget(host);return;}careAction(target);});
  host.addEventListener('scene-missions-change',event=>missionPanel.update((event as CustomEvent<MissionView>).detail),{signal:events.signal});
  host.addEventListener('scene-mission-result',event=>missionPanel.result((event as CustomEvent<{ok:boolean}>).detail.ok),{signal:events.signal});
  let selected:SceneIdentity|null=null;
  let studio:StudioView={active:false,habitat:false,clip:'perch',angle:'quarter',motionPaused:false,canHabitat:false};
  let food:FoodView={canPlace:false,habitat:false,exists:false,reachable:false,stock:0,capacity:8,revision:0,portions:[0,0],preview:false,reason:null};
  const foodDialog=root.querySelector<HTMLDialogElement>('[data-food-dialog]');let foodRemovalRevision:number|null=null;
  let water:FoodView={canPlace:false,habitat:false,exists:false,reachable:false,stock:0,capacity:8,revision:0,portions:[0,0],preview:false,reason:null};
  const waterDialog=root.querySelector<HTMLDialogElement>('[data-water-dialog]');let waterRemovalRevision:number|null=null;
  let perch:PerchView={canPlace:false,habitat:false,exists:false,reachable:false,capacity:2,revision:0,preview:false,reason:null,resting:0,exploring:0};
  const perchDialog=root.querySelector<HTMLDialogElement>('[data-perch-dialog]');let perchRemovalRevision:number|null=null;
  let visitorView:ArrivalView={open:false,active:0,capacity:3,ready:false,total:0,reason:'closed',ids:[],people:[],queued:0,walking:0,viewing:0,returning:0,viewedTotal:0,feedback:{evaluated:0,scored:0,scoreSum:0,positive:0,negative:0,interrupted:0,recent:[]},attraction:{ready:false,reason:'closed',welfare:null,intervalTicks:900,level:'low'},tickets:{balance:1500,price:10,admissions:0,revenue:0,reason:'closed',last:null}};
  function renderCosts(){renderRecovery();if(!economy)return;const e=economy,c=entryMessages[locale],prices=e.prices;
    const text=(value:string)=>value.replaceAll('{balance}',formatNumber(e.balance,locale)).replaceAll('{fee}',formatNumber(prices.maintenance,locale)).replaceAll('{due}',formatNumber(e.maintenanceDue,locale));
    const status=root.querySelector<HTMLElement>('[data-economy-status]');if(status){status.dataset.balance=String(e.balance);status.dataset.spent=String(e.spent);status.dataset.refunds=String(e.refunds);status.dataset.maintenanceDue=String(e.maintenanceDue);const value=text(c[e.maintenanceDue?'economyDue':'economyReady']);if(status.textContent!==value)status.textContent=value;}
    const flow=root.querySelector<HTMLElement>('[data-cashflow]');if(flow){const signed=e.net>0?`+${formatNumber(e.net,locale)}`:formatNumber(e.net,locale),lines=[c.cashflowTitle,c.cashflowIncome.replace('{tickets}',formatNumber(e.ticketIncome,locale)).replace('{rewards}',formatNumber(e.rewards,locale)),c.cashflowCosts.replace('{construction}',formatNumber(e.construction,locale)).replace('{supplies}',formatNumber(e.supplies,locale)).replace('{upkeep}',formatNumber(e.upkeep,locale)),c.cashflowAdjustments.replace('{refunds}',formatNumber(e.refunds,locale)).replace('{undo}',formatNumber(e.undo,locale)),c.cashflowNet.replace('{net}',signed)];for(const key of ['ticketIncome','rewards','construction','supplies','upkeep','refunds','undo','net']as const)flow.dataset[key]=String(e[key]);if(flow.textContent!==lines.join(''))flow.replaceChildren(...lines.map(value=>{const p=document.createElement('p');p.textContent=value;p.style.marginBlock='.3rem';return p;}));}
    const placementCost=root.querySelector('[data-economy-cost="placement"]');if(placementCost)placementCost.textContent=text(c.economyPlacementPrice.replace('{habitat}',formatNumber(prices.habitat,locale)).replace('{path}',formatNumber(prices.path,locale)));
    for(const name of ['food','water','perch']as const){const cost=root.querySelector(`[data-economy-cost="${name}"]`),fee=prices[name],refill=name==='water'?prices.waterRefill:prices.foodRefill;const refundHint=root.querySelector(`[data-entry-text="${name}RemoveHint"]`);if(refundHint){const value=c[name==='food'?'foodRemoveHint':name==='water'?'waterRemoveHint':'perchRemoveHint']+' '+c.economyRefund.replace('{n}',formatNumber(e.resourceRefunds[name],locale));if(refundHint.textContent!==value)refundHint.textContent=value;}const current=name==='food'?food:name==='water'?water:perch,needed=current.exists?(name==='perch'?0:refill):fee;if(cost)cost.textContent=text(c[name==='perch'?'economyPerchPrice':'economyCarePrice'].replace('{build}',formatNumber(fee,locale)).replace('{refill}',formatNumber(refill,locale)))+(e.balance<needed?' '+c.economyFunds:'');
      for(const command of ['confirm','refill']as const){const b=root.querySelector<HTMLButtonElement>(`[data-${name}-command="${command}"]`);if(!b)continue;const amount=command==='confirm'?fee:refill,basic=c[name==='food'?(command==='confirm'?'foodConfirm':'foodFill'):name==='water'?(command==='confirm'?'waterConfirm':'waterFill'):'perchConfirm'];b.textContent=basic+` · ${amount} ZC`;if(e.balance<amount)b.disabled=true;}}
    for(const [command,key,amount]of [['begin','placementStart',prices.habitat],['begin-path','pathStart',prices.path],['confirm',placement?.kind==='path'?'pathConfirm':'placementConfirm',placement?.kind==='path'?prices.path:prices.habitat]]as const){const b=root.querySelector<HTMLButtonElement>(`[data-placement-command="${command}"]`);if(b){b.textContent=c[key]+` · ${amount} ZC`;if(command==='confirm'&&(e.balance<amount))b.disabled=true;}}
  }
  host.addEventListener('scene-economy-change',event=>{economy=(event as CustomEvent<EconomyView>).detail;renderFood();renderWater();renderPerch();renderPlacement();renderEdit();renderCosts();},{signal:events.signal});
  function renderVisitors(){const section=root.querySelector<HTMLElement>('[data-visitor-tools]');if(!section)return;section.hidden=state.status!=='ready'||studio.active;const copy=entryMessages[locale];
    for(const b of section.querySelectorAll<HTMLButtonElement>('[data-visitors-command]')){const c=b.dataset.visitorsCommand;b.textContent=copy[c==='open'?'visitorsOpen':c==='close'?'visitorsClose':c==='follow'?'visitorsFollow':'visitorsFocus'];b.disabled=c==='follow'&&visitorView.active===0||c==='open'&&['capacity','balance'].includes(visitorView.tickets.reason);b.hidden=c==='open'?visitorView.open:c==='close'?!visitorView.open:false;}
    section.querySelector('[data-entry-text="visitorsTitle"]')?.replaceChildren(copy.visitorsTitle);section.querySelector('[data-entry-text="visitorsHint"]')?.replaceChildren(copy.visitorsHint);
    const key={closed:'visitorsClosed',departing:'visitorsDeparting',path:'visitorsPath',habitat:'visitorsHabitat',limit:'visitorsLimit',ready:'visitorsReady'}as const,text=copy[key[visitorView.reason]].replace('{n}',formatNumber(visitorView.active,locale)).replace('{cap}',formatNumber(visitorView.capacity,locale)).replace('{total}',formatNumber(visitorView.total,locale))+' '+copy.visitorsProgress.replace('{q}',formatNumber(visitorView.queued,locale)).replace('{w}',formatNumber(visitorView.walking,locale)).replace('{v}',formatNumber(visitorView.viewing,locale)).replace('{r}',formatNumber(visitorView.returning,locale)).replace('{done}',formatNumber(visitorView.viewedTotal,locale));const status=section.querySelector('[data-visitors-status]');if(status&&status.textContent!==text)status.textContent=text;
      const attraction=section.querySelector<HTMLElement>('[data-attraction]'),a=visitorView.attraction;if(attraction){attraction.dataset.reason=a.reason;attraction.dataset.welfare=String(a.welfare??'');attraction.dataset.interval=String(a.intervalTicks);const key=({closed:'attractionClosed',path:'attractionPath',habitat:'attractionHabitat',animals:'attractionAnimals',ready:'attractionReady'}as const)[a.reason],value=copy[key].replace('{w}',formatNumber(a.welfare,locale)).replace('{seconds}',formatNumber((a.intervalTicks/10),locale,1,1));if(attraction.textContent!==value)attraction.textContent=value;}
    const list=section.querySelector('[data-visitor-list]');if(list){const ids=JSON.stringify(visitorView.people);if(list.getAttribute('data-ids')!==ids||list.getAttribute('lang')!==locale){list.setAttribute('data-ids',ids);list.setAttribute('lang',locale);list.replaceChildren(...visitorView.people.map(({id,phase,feedback,entry,ticketAmount})=>{const li=document.createElement('li');li.dataset.visitorId=id;li.dataset.visitorPhase=phase;li.textContent=copy.visitorsPerson.replace('{name}',copy.visitorsName.replace('{id}',id.replace('arrival-',''))).replace('{phase}',copy[({arrival:'visitorsArriving',queued:'visitorsQueued',entering:'visitorsWalking',viewing:'visitorsViewing',leaving:'visitorsReturning',exiting:'visitorsExiting'}as const)[phase]]);const ticket=document.createElement('span');ticket.dataset.visitorTicket=entry;ticket.style.display='block';ticket.textContent=entry==='paid'?copy.ticketPersonPaid.replace('{amount}',formatNumber(ticketAmount,locale)):entry==='free'?copy.ticketPersonFree:feedback?copy.ticketPersonNotAdmitted:copy.ticketPersonPending;li.append(ticket);if(feedback){const detail=document.createElement('span');detail.dataset.visitorFeedback=feedback.outcome;detail.textContent=presentVisitorFeedback(feedback,locale);detail.style.cssText='display:block;margin-block:.35rem;padding:.45rem;border-inline-start:3px solid currentColor;font-size:.92em';li.append(detail);}return li;}));}}
    renderTickets(section,visitorView.tickets,locale);renderVisitorSummary(section,visitorView.feedback,locale,visitorView.ids);
  }
  host.addEventListener('scene-visitors-change',event=>{visitorView=(event as CustomEvent<ArrivalView>).detail;renderVisitors();},{signal:events.signal});
  for(const b of root.querySelectorAll<HTMLButtonElement>('[data-visitors-command]'))b.addEventListener('click',()=>{controller.visitors(b.dataset.visitorsCommand as 'open'|'close'|'focus'|'follow');host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});
  let birds:BirdsView={tick:0,habitat:false,placed:0,birds:[]};
  const animalInfo=mountAnimalInfo(root.querySelector<HTMLElement>('[data-bird-tools]')!,events.signal);
  let editView:EditView={canUndo:false,reason:null,result:null};
  let removal:RemovalQuote|null=null;
  let removalName='';
  const editDialog=root.querySelector<HTMLDialogElement>('[data-edit-dialog]');
  function renderEdit(){
    const copy=entryMessages[locale],ready=state.status==='ready';
    root.querySelector('[data-entry-text="editHint"]')?.replaceChildren(copy.editHint);
    const remove=root.querySelector<HTMLButtonElement>('[data-edit-remove]');
    if(remove){remove.hidden=!ready||studio.active||!selected||!['habitat','path'].includes(selected.kind);remove.textContent=copy.editRemove;}
    const undo=root.querySelector<HTMLButtonElement>('[data-edit-undo]');if(undo){undo.hidden=!ready||!editView.canUndo;undo.textContent=copy.editUndo+` · ${editView.undoCost??0} ZC`;undo.disabled=Boolean(economy&&economy.balance<(editView.undoCost??0));}
    const keys={missing:'editMissing',protected:'editProtected','in-use':'editInUse','visitor-route':'editVisitorRoute','visitor-occupied':'editVisitorOccupied',stale:'editStale',funds:'editFunds',capacity:'economyCapacity',command:'editCommand'} as const;
    root.querySelector('[data-edit-status]')?.replaceChildren(editView.reason?copy[keys[editView.reason]]:editView.result?copy[editView.result==='removed'?'editRemoved':'editRestored']:'');
    root.querySelector('[data-edit-cancel]')?.replaceChildren(copy.editCancel);root.querySelector('[data-edit-confirm]')?.replaceChildren(copy.editConfirm);
    root.querySelector('#edit-dialog-title')?.replaceChildren(copy.editTitle);root.querySelector('#edit-dialog-description')?.replaceChildren(copy.editIntro);
    root.querySelector('[data-edit-object]')?.replaceChildren(removalName);
    root.querySelector('[data-edit-refund]')?.replaceChildren(copy.editRefund.replace('{n}',formatNumber(removal?.refund??0,locale)));renderCosts();
  }
  const selectionPanel=root.querySelector<HTMLElement>('[data-scene-selection]');
  const selectionStatus=root.querySelector<HTMLOutputElement>('[data-selection-announcement]');
  function renderSelection() {
    renderEdit();
    if(!selectionPanel)return;
    selectionPanel.hidden=state.status!=='ready'||studio.active||!selected;
    const button=root.querySelector<HTMLButtonElement>('[data-clear-selection]');if(button)button.textContent=entryMessages[locale].selectionDismiss;
    if(selected&&state.status==='ready') {
      const view=presentSelection(selected,locale);
      root.querySelector('[data-selection-title]')?.replaceChildren(view.title);
      root.querySelector('[data-selection-location]')?.replaceChildren(view.location);
      root.querySelector('[data-selection-detail]')?.replaceChildren(view.detail);
      if(selectionStatus)selectionStatus.value=view.title;
    } else {
      for(const field of ['title','location','detail'])root.querySelector(`[data-selection-${field}]`)?.replaceChildren();
    }
  }
  let placement:PlacementView|null=null;
  let habitatCount=0;let access:AccessSummary|null=null;
  const placementTools=root.querySelector<HTMLElement>('[data-placement-tools]');
  function renderPlacement(){
    if(!placementTools)return;const copy=entryMessages[locale],active=Boolean(placement?.active),path=placement?.kind==='path';
    placementTools.hidden=state.status!=='ready'||studio.active||food.preview||water.preview||perch.preview;placementTools.dataset.valid=String(placement?.reason==='ready');
    const start=root.querySelector<HTMLButtonElement>('[data-placement-command="begin"]');if(start){start.hidden=active;start.textContent=copy.placementStart;}
    const pathStart=root.querySelector<HTMLButtonElement>('[data-placement-command="begin-path"]');if(pathStart){pathStart.hidden=active;pathStart.textContent=copy.pathStart;}
    root.querySelector('[data-access-status]')?.replaceChildren(copy[!access?.habitats?'accessNoHabitat':access.connected?'accessConnected':'accessDisconnected'].replace('{n}',formatNumber(access?.pathTiles??1,locale)).replace('{r}',formatNumber(access?.routeCells??0,locale)));
    if(placementTools)placementTools.dataset.connected=String(Boolean(access?.connected));
    const edit=root.querySelector<HTMLElement>('[data-placement-edit]');if(edit)edit.hidden=!active;
    for(const el of root.querySelectorAll<HTMLElement>('[data-placement-text]'))el.textContent=copy[path?(el.dataset.placementText==='placementTitle'?'pathTitle':'pathHint'):el.dataset.placementText as EntryMessage];
    for(const command of ['confirm','cancel','left','right','up','down'] as const){const button=root.querySelector<HTMLButtonElement>(`[data-placement-command="${command}"]`);if(!button)continue;const key=`placement${command[0].toUpperCase()}${command.slice(1)}` as EntryMessage;if(command==='confirm'||command==='cancel')button.textContent=copy[path?(command==='confirm'?'pathConfirm':'pathCancel'):key];else button.setAttribute('aria-label',copy[key]);if(command==='confirm')button.disabled=!active||placement?.reason!=='ready';}
    const reasonKey=`placement${(placement?.reason??'choose')[0].toUpperCase()}${(placement?.reason??'choose').slice(1)}` as EntryMessage;
    root.querySelector('[data-placement-reason]')?.replaceChildren(active?copy[path&&placement?.reason==='ready'?'pathReady':path&&placement?.reason==='path'?'pathAlready':reasonKey]:'');
    root.querySelector('.placement-arrows')?.setAttribute('aria-label',path?copy.pathTitle:copy.placementTitle);
    const anchor=placement?.proposal?.anchor;
    root.querySelector('[data-placement-location]')?.replaceChildren(active&&anchor?copy.placementLocation.replace('{x}',formatNumber(anchor.x+1,locale)).replace('{z}',formatNumber(anchor.z+1,locale)):'');
    const confirmed=root.querySelector<HTMLElement>('[data-placement-confirmed]');if(confirmed){confirmed.hidden=habitatCount===0||active;confirmed.textContent=copy.placementConfirmed;}renderCosts();
  }
  const cameraControls=root.querySelector<HTMLElement>('[data-camera-controls]');
  const zoomOutput=root.querySelector<HTMLOutputElement>('[data-camera-zoom]');
  function cameraState(zoom=Number(host?.dataset.cameraZoom??1)) {
    if(zoomOutput)zoomOutput.value=`${Math.round(zoom*100)}%`;
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-camera-command]'))button.disabled=state.status!=='ready'||(button.dataset.cameraCommand==='zoom-in'?zoom>=3:button.dataset.cameraCommand==='zoom-out'?zoom<=1:zoom===1);
  }

  function renderBirds(){
    const tools=root.querySelector<HTMLElement>('[data-bird-tools]');if(!tools)return;const copy=entryMessages[locale];tools.hidden=state.status!=='ready'||studio.active;
    for(const el of tools.querySelectorAll<HTMLElement>('[data-entry-text]'))el.textContent=copy[el.dataset.entryText as EntryMessage];
    const welcome=tools.querySelector<HTMLButtonElement>('[data-birds-command="welcome"]'),reserve=tools.querySelector<HTMLButtonElement>('[data-birds-command="reserve"]');
    if(welcome){welcome.hidden=birds.placed>0;welcome.disabled=!birds.habitat;welcome.textContent=copy.birdsWelcome;}if(reserve){reserve.hidden=birds.placed===0;reserve.textContent=copy.birdsReserve;}
    tools.querySelector('[data-birds-status]')?.replaceChildren(copy[birds.placed?'birdsPlaced':birds.habitat?'birdsWaiting':'birdsNeedHabitat']);
    animalInfo.update(birds,locale,state.status==='ready'&&!studio.active);
  }
  function renderFood(){const tools=root.querySelector<HTMLElement>('[data-food-tools]');if(!tools)return;const c=entryMessages[locale];tools.hidden=state.status!=='ready'||studio.active;
    for(const el of tools.querySelectorAll<HTMLElement>('[data-entry-text]'))el.textContent=c[el.dataset.entryText as EntryMessage];
    const place=tools.querySelector<HTMLButtonElement>('[data-food-command="preview"]');if(place){place.hidden=food.exists||food.preview;place.disabled=!food.habitat;place.textContent=c.foodPlace;}
    const preview=tools.querySelector<HTMLElement>('[data-food-preview]');if(preview)preview.hidden=!food.preview;const actions=tools.querySelector<HTMLElement>('[data-food-actions]');if(actions)actions.hidden=!food.exists||food.preview;
    for(const [cmd,key]of [['confirm','foodConfirm'],['cancel','foodCancel'],['refill','foodFill']]as const){const b=tools.querySelector<HTMLButtonElement>(`[data-food-command="${cmd}"]`);if(b){b.textContent=c[key];if(cmd==='refill')b.disabled=food.stock>=food.capacity;if(cmd==='confirm')b.disabled=!food.canPlace;}}
    tools.querySelector('[data-food-remove]')?.replaceChildren(c.foodRemove);
    const reasons={missing:'foodMissing',exists:'foodExists',stale:'foodStale',full:'foodFull',invalid:'foodInvalid',busy:'foodBusy',funds:'economyFunds',capacity:'economyCapacity'}as const;
    const text=c[food.reason?reasons[food.reason]:food.preview&&!food.canPlace?'foodBusy':!food.habitat?'foodNeedHabitat':!food.exists?'foodReady':!food.reachable?'foodUnreachable':food.stock===0?'foodEmpty':food.portions.some(n=>n===0)?'foodOneEmpty':'foodStock'].replace('{n}',formatNumber(food.stock,locale)).replace('{cap}',formatNumber(food.capacity,locale)).replace('{a}',formatNumber(food.portions[0],locale)).replace('{b}',formatNumber(food.portions[1],locale));const status=tools.querySelector('[data-food-status]');if(status?.textContent!==text)status?.replaceChildren(text);
    root.querySelector('[data-food-keep]')?.replaceChildren(c.foodKeep);root.querySelector('[data-food-remove-confirm]')?.replaceChildren(c.foodRemoveConfirm);root.querySelector('#food-dialog-title')?.replaceChildren(c.foodRemoveTitle);root.querySelector('[data-entry-text="foodRemoveHint"]')?.replaceChildren(c.foodRemoveHint);renderCosts();
  }
  function renderWater(){const tools=root.querySelector<HTMLElement>('[data-water-tools]');if(!tools)return;const c=entryMessages[locale];tools.hidden=state.status!=='ready'||studio.active;
    for(const el of tools.querySelectorAll<HTMLElement>('[data-entry-text]'))el.textContent=c[el.dataset.entryText as EntryMessage];
    const place=tools.querySelector<HTMLButtonElement>('[data-water-command="preview"]');if(place){place.hidden=water.exists||water.preview;place.disabled=!water.habitat;place.textContent=c.waterPlace;}
    const preview=tools.querySelector<HTMLElement>('[data-water-preview]');if(preview)preview.hidden=!water.preview;const actions=tools.querySelector<HTMLElement>('[data-water-actions]');if(actions)actions.hidden=!water.exists||water.preview;
    for(const [cmd,key]of [['confirm','waterConfirm'],['cancel','waterCancel'],['refill','waterFill']]as const){const b=tools.querySelector<HTMLButtonElement>(`[data-water-command="${cmd}"]`);if(b){b.textContent=c[key];if(cmd==='refill')b.disabled=water.stock>=water.capacity;if(cmd==='confirm')b.disabled=!water.canPlace;}}
    tools.querySelector('[data-water-remove]')?.replaceChildren(c.waterRemove);
    const reasons={missing:'waterMissing',exists:'waterExists',stale:'waterStale',full:'waterFull',invalid:'waterInvalid',busy:'waterBusy',funds:'economyFunds',capacity:'economyCapacity'}as const;
    const text=c[water.reason?reasons[water.reason]:water.preview&&!water.canPlace?'waterBusy':!water.habitat?'waterNeedHabitat':!water.exists?'waterReady':!water.reachable?'waterUnreachable':water.stock===0?'waterEmpty':water.portions.some(n=>n===0)?'waterOneEmpty':'waterStock'].replace('{n}',formatNumber(water.stock,locale)).replace('{cap}',formatNumber(water.capacity,locale)).replace('{a}',formatNumber(water.portions[0],locale)).replace('{b}',formatNumber(water.portions[1],locale));const status=tools.querySelector('[data-water-status]');if(status?.textContent!==text)status?.replaceChildren(text);
    root.querySelector('[data-water-keep]')?.replaceChildren(c.waterKeep);root.querySelector('[data-water-remove-confirm]')?.replaceChildren(c.waterRemoveConfirm);root.querySelector('#water-dialog-title')?.replaceChildren(c.waterRemoveTitle);root.querySelector('[data-entry-text="waterRemoveHint"]')?.replaceChildren(c.waterRemoveHint);renderCosts();
  }
  function renderPerch(){const tools=root.querySelector<HTMLElement>('[data-perch-tools]');if(!tools)return;const c=entryMessages[locale];tools.hidden=state.status!=='ready'||studio.active;
    for(const el of tools.querySelectorAll<HTMLElement>('[data-entry-text]'))el.textContent=c[el.dataset.entryText as EntryMessage];
    const place=tools.querySelector<HTMLButtonElement>('[data-perch-command="preview"]');if(place){place.hidden=perch.exists||perch.preview;place.disabled=!perch.habitat;place.textContent=c.perchPlace;}
    const preview=tools.querySelector<HTMLElement>('[data-perch-preview]');if(preview)preview.hidden=!perch.preview;const actions=tools.querySelector<HTMLElement>('[data-perch-actions]');if(actions)actions.hidden=!perch.exists||perch.preview;
    const confirm=tools.querySelector<HTMLButtonElement>('[data-perch-command="confirm"]');if(confirm){confirm.textContent=c.perchConfirm;confirm.disabled=!perch.canPlace;}tools.querySelector('[data-perch-command="cancel"]')?.replaceChildren(c.perchCancel);tools.querySelector('[data-perch-remove]')?.replaceChildren(c.perchRemove);
    const reasons={missing:'perchMissing',exists:'perchExists',stale:'perchStale',invalid:'perchInvalid',busy:'perchBusy',funds:'economyFunds',capacity:'economyCapacity'}as const;
    const text=c[perch.reason?reasons[perch.reason]:perch.preview&&!perch.canPlace?'perchBusy':!perch.habitat?'perchNeedHabitat':!perch.exists?'perchReady':!perch.reachable?'perchUnreachable':'perchStatus'].replace('{r}',formatNumber(perch.resting,locale)).replace('{g}',formatNumber(perch.exploring,locale)).replaceAll('{cap}',formatNumber(perch.capacity,locale));const status=tools.querySelector('[data-perch-status]');if(status?.textContent!==text)status?.replaceChildren(text);
    root.querySelector('[data-perch-keep]')?.replaceChildren(c.perchKeep);root.querySelector('[data-perch-remove-confirm]')?.replaceChildren(c.perchRemoveConfirm);root.querySelector('#perch-dialog-title')?.replaceChildren(c.perchRemoveTitle);root.querySelector('[data-entry-text="perchRemoveHint"]')?.replaceChildren(c.perchRemoveHint);renderCosts();
  }
  function renderStudio(){
    speedPanel.show(state.status==='ready'&&!studio.active,locale);renderVisitors();missionPanel.show(state.status==='ready'&&!studio.active,locale);onboardingPanel.show(state.status==='ready'&&!studio.active,locale);const guideLanguage=root.querySelector<HTMLSelectElement>('[data-guide-language]');if(guideLanguage){guideLanguage.value=locale;guideLanguage.setAttribute('aria-label',entryMessages[locale].language);}
    const copy=entryMessages[locale],ready=state.status==='ready',tools=root.querySelector<HTMLElement>('[data-macaw-tools]');if(!tools)return;
    tools.hidden=!ready;const controls=root.querySelector<HTMLElement>('[data-macaw-controls]');if(controls)controls.hidden=!studio.active;
    for(const button of tools.querySelectorAll<HTMLButtonElement>('[data-studio-command]')){const command=button.dataset.studioCommand as StudioCommand;const key=command==='pause'?(studio.motionPaused?'macawResume':'macawPause'):command==='open'?'macawOpen':command==='close'?'macawClose':command==='detail'?'macawDetail':'macawHabitat';button.textContent=copy[key];button.hidden=command==='open'?studio.active:command==='detail'?!studio.habitat:command==='habitat'?studio.habitat:false;if(command==='habitat')button.disabled=habitatCount===0;}
    for(const el of tools.querySelectorAll<HTMLElement>('[data-entry-text]'))el.textContent=copy[el.dataset.entryText as EntryMessage];
    for(const [selector,value]of [['[data-macaw-clip]',studio.clip],['[data-macaw-angle]',studio.angle]]){const select=root.querySelector<HTMLSelectElement>(selector);if(!select)continue;select.value=value;for(const option of select.options)option.textContent=copy[`macaw${option.value[0].toUpperCase()}${option.value.slice(1)}` as EntryMessage];}
    root.querySelector('[data-macaw-status]')?.replaceChildren(copy[studio.motionPaused?'macawPaused':'macawPlaying']);root.querySelector('[data-macaw-scale]')?.replaceChildren(studio.habitat?copy.macawScaleHint:habitatCount===0?copy.macawNeedHabitat:'');
    if(cameraControls)cameraControls.hidden=!ready||(studio.active&&!studio.habitat);
    host?.setAttribute('aria-label',copy[studio.active?'macawCanvas':'previewCanvas']);
    host?.setAttribute('aria-keyshortcuts',studio.active?(studio.habitat?'ArrowUp ArrowDown ArrowLeft ArrowRight Home Escape':'Escape'):'ArrowUp ArrowDown ArrowLeft ArrowRight Home Escape Enter');
    root.querySelector('[data-camera-help]')?.replaceChildren(copy[studio.active&&studio.habitat?'macawScaleHint':'cameraHelp']);
    if(caption)caption.textContent=copy[studio.active?'macawSubtitle':state.status==='ready'||state.status==='loading'?'previewCaption':'artCaption'];
    renderBirds();renderFood();renderWater();renderPerch();
    if(ready){if(title)title.textContent=copy[studio.active?'macawTitle':'previewReady'];if(detail)detail.textContent=copy[studio.active?'macawSubtitle':'previewReadyDetail'];}
  }

  function render(next: PreviewState) {
    speedPanel.show(next.status==='ready'&&!studio.active,locale);
    const previous = state.status;
    state = next;
    if (!panel || !illustration || !host || !feedback || !title || !detail || !caption || !open || !close || !retry || !reload) return;
    const copy = entryMessages[locale];
    for(const el of root.querySelectorAll<HTMLElement>('[data-guide-toolbar] [data-entry-text]'))el.textContent=copy[el.dataset.entryText as EntryMessage];
    panel.lang = locale;
    if(next.status==='closed')root.dataset.guided='false';
    if(next.status!=='ready'){recoveryPending=null;if(recoveryDialog?.open)recoveryDialog.close();perchRemovalRevision=null;if(perchDialog?.open)perchDialog.close();waterRemovalRevision=null;if(waterDialog?.open)waterDialog.close();foodRemovalRevision=null;if(foodDialog?.open)foodDialog.close();studio={...studio,active:false,habitat:false};selected=null;placement=null;missionPanel.setPreviewActive(false);onboardingPanel.placement(null);habitatCount=0;access=null;editView={canUndo:false,reason:null,result:null};removal=null;if(editDialog?.open)editDialog.close();}
    renderPlacement();
    renderSelection();renderVisitors();
    if(cameraControls){cameraControls.hidden=next.status!=='ready';cameraControls.setAttribute('aria-label',copy.cameraControls);}
    root.querySelector('[data-camera-help]')?.replaceChildren(copy.cameraHelp);
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-camera-command]')) {
      const command=button.dataset.cameraCommand;
      if(command==='reset')button.textContent=copy.cameraReset;
      button.setAttribute('aria-label',copy[command==='zoom-in'?'cameraZoomIn':command==='zoom-out'?'cameraZoomOut':'cameraReset']);
    }
    cameraState();
    const failed = next.status === 'unsupported' || next.status === 'error';
    panel.dataset.rendererState = next.status;
    const startButton=root.querySelector<HTMLButtonElement>('[data-onboarding-start]');if(startButton)startButton.disabled=next.status==='loading'||options.canOpen?.()===false;
    illustration.hidden = next.status === 'loading' || next.status === 'ready';
    host.hidden = next.status !== 'loading' && next.status !== 'ready';
    host.setAttribute('aria-label', copy.previewCanvas);
    host.setAttribute('aria-busy', String(next.status === 'loading'));
    feedback.hidden = next.status === 'closed';
    feedback.setAttribute('role', failed ? 'alert' : 'status');
    open.hidden = next.status !== 'closed';
    open.disabled = options.canOpen?.()===false;
    open.textContent = copy.previewOpen;
    close.hidden = next.status === 'closed';
    close.textContent = copy[failed ? 'previewBack' : 'previewClose'];
    retry.hidden = !failed || (next.status === 'error' && next.reason === 'load');
    retry.textContent = copy.previewRetry;
    reload.hidden = next.status !== 'error' || next.reason !== 'load';
    reload.textContent = copy.previewReload;
    caption.textContent = copy[next.status === 'loading' || next.status === 'ready' ? 'previewCaption' : 'artCaption'];
    let titleKey: EntryMessage = 'previewLoading';
    let detailKey: EntryMessage = 'previewLoadingDetail';
    if (next.status === 'ready') { titleKey = 'previewReady'; detailKey = 'previewReadyDetail'; }
    if (next.status === 'unsupported') { titleKey = 'previewUnsupported'; detailKey = 'previewUnsupportedDetail'; }
    if (next.status === 'error') {
      titleKey = next.reason === 'context-lost' ? 'previewLost' : next.reason === 'load' ? 'previewLoadError' : 'previewError';
      detailKey = next.reason === 'load' ? 'previewReloadDetail' : 'previewErrorDetail';
    }
    title.textContent = copy[titleKey];
    detail.textContent = copy[detailKey];
    renderStudio();
    if(next.status==='ready'&&guidedStart){guidedStart=false;if(!missionPanel.focusCare())onboardingPanel.focus();}
    if (previous !== next.status && next.status !== 'closed' && (root.dataset.guided!=='true'||failed) && !root.querySelector('dialog[open]')) {
      (failed ? next.status === 'error' && next.reason === 'load' ? reload : retry : close).focus();
    }
  }

  const load: PreviewLoader = options.loadRenderer ?? (async () => {
    const module = await import('../game/render3d/foundation-scene');
    return (onFailure) => module.mountFoundationScene(host, onFailure,{stateStore:options.stateStore??sanctuarySessionFor(root)});
  });
  const controller = createPreviewController(load, render);
  host.addEventListener('scene-food-change',event=>{food=(event as CustomEvent<FoodView>).detail;renderFood();renderPlacement();},{signal:events.signal});
  for(const b of root.querySelectorAll<HTMLButtonElement>('[data-food-command]')){b.addEventListener('keydown',event=>{if(event.repeat&&(event.key==='Enter'||event.key===' '))event.preventDefault();},{signal:events.signal});b.addEventListener('click',event=>{if(event.detail>1)return;const cmd=b.dataset.foodCommand as FoodCommand;controller.food(cmd,food.revision);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});}
  root.querySelector('[data-food-tools]')?.addEventListener('keydown',event=>{if((event as KeyboardEvent).key==='Escape')controller.food('cancel');},{signal:events.signal});
  host.addEventListener('scene-recovery-change',event=>{recovery=(event as CustomEvent<RecoveryView>).detail;renderRecovery();onboardingPanel.support(recovery.low&&recovery.available);},{signal:events.signal});
  function reviewRecovery(){if(!recoveryDialog||recoveryPending)return;const quote=controller.recoveryQuote();if(!quote){const help=root.querySelector<HTMLElement>('[data-recovery-tools]');revealHudTarget(help??null);scrollHudTarget(help);help?.setAttribute('tabindex','-1');help?.focus({preventScroll:true});return;}recoveryPending=quote;renderRecovery();recoveryDialog.showModal();controller.setPaused(true);root.querySelector<HTMLElement>('[data-recovery-cancel]')?.focus();}
  root.querySelector('[data-recovery-review]')?.addEventListener('click',reviewRecovery,{signal:events.signal});
  const dismissRecovery=()=>{recoveryPending=null;if(recoveryDialog?.open)recoveryDialog.close();controller.setPaused(false);};
  root.querySelector('[data-recovery-cancel]')?.addEventListener('click',dismissRecovery,{signal:events.signal});recoveryDialog?.addEventListener('close',()=>{recoveryPending=null;controller.setPaused(false);},{signal:events.signal});
  root.querySelector('[data-recovery-confirm]')?.addEventListener('click',()=>{const quote=recoveryPending;if(!quote)return;dismissRecovery();controller.recover(quote);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});
  root.querySelector('[data-food-remove]')?.addEventListener('click',()=>{if(!food.exists||!foodDialog)return;foodRemovalRevision=food.revision;foodDialog.showModal();controller.setPaused(true);root.querySelector<HTMLElement>('[data-food-keep]')?.focus();},{signal:events.signal});
  const dismissFood=()=>{foodRemovalRevision=null;foodDialog?.close();controller.setPaused(false);};
  root.querySelector('[data-food-keep]')?.addEventListener('click',dismissFood,{signal:events.signal});foodDialog?.addEventListener('close',()=>{foodRemovalRevision=null;controller.setPaused(false);},{signal:events.signal});
  root.querySelector('[data-food-remove-confirm]')?.addEventListener('click',()=>{const rev=foodRemovalRevision;foodRemovalRevision=null;dismissFood();if(rev!==null)controller.food('remove',rev);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});
  host.addEventListener('scene-water-change',event=>{water=(event as CustomEvent<FoodView>).detail;renderWater();renderPlacement();},{signal:events.signal});
  for(const b of root.querySelectorAll<HTMLButtonElement>('[data-water-command]')){b.addEventListener('keydown',event=>{if(event.repeat&&(event.key==='Enter'||event.key===' '))event.preventDefault();},{signal:events.signal});b.addEventListener('click',event=>{if(event.detail>1)return;const cmd=b.dataset.waterCommand as FoodCommand;controller.water(cmd,water.revision);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});}
  root.querySelector('[data-water-tools]')?.addEventListener('keydown',event=>{if((event as KeyboardEvent).key==='Escape')controller.water('cancel');},{signal:events.signal});
  root.querySelector('[data-water-remove]')?.addEventListener('click',()=>{if(!water.exists||!waterDialog)return;waterRemovalRevision=water.revision;waterDialog.showModal();controller.setPaused(true);root.querySelector<HTMLElement>('[data-water-keep]')?.focus();},{signal:events.signal});
  const dismissWater=()=>{waterRemovalRevision=null;waterDialog?.close();controller.setPaused(false);};
  root.querySelector('[data-water-keep]')?.addEventListener('click',dismissWater,{signal:events.signal});waterDialog?.addEventListener('close',()=>{waterRemovalRevision=null;controller.setPaused(false);},{signal:events.signal});
  root.querySelector('[data-water-remove-confirm]')?.addEventListener('click',()=>{const rev=waterRemovalRevision;waterRemovalRevision=null;dismissWater();if(rev!==null)controller.water('remove',rev);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});
  host.addEventListener('scene-perch-change',event=>{perch=(event as CustomEvent<PerchView>).detail;renderPerch();renderPlacement();},{signal:events.signal});
  for(const b of root.querySelectorAll<HTMLButtonElement>('[data-perch-command]')){b.addEventListener('keydown',event=>{if(event.repeat&&(event.key==='Enter'||event.key===' '))event.preventDefault();},{signal:events.signal});b.addEventListener('click',event=>{if(event.detail>1)return;controller.perch(b.dataset.perchCommand as PerchCommand,perch.revision);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});}
  root.querySelector('[data-perch-tools]')?.addEventListener('keydown',event=>{if((event as KeyboardEvent).key==='Escape')controller.perch('cancel');},{signal:events.signal});
  root.querySelector('[data-perch-remove]')?.addEventListener('click',()=>{if(!perch.exists||!perchDialog)return;perchRemovalRevision=perch.revision;perchDialog.showModal();controller.setPaused(true);root.querySelector<HTMLElement>('[data-perch-keep]')?.focus();},{signal:events.signal});
  const dismissPerch=()=>{perchRemovalRevision=null;perchDialog?.close();controller.setPaused(false);};
  root.querySelector('[data-perch-keep]')?.addEventListener('click',dismissPerch,{signal:events.signal});perchDialog?.addEventListener('close',()=>{perchRemovalRevision=null;controller.setPaused(false);},{signal:events.signal});
  root.querySelector('[data-perch-remove-confirm]')?.addEventListener('click',()=>{const rev=perchRemovalRevision;perchRemovalRevision=null;dismissPerch();if(rev!==null)controller.perch('remove',rev);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});
  host.addEventListener('scene-birds-change' ,event=>{birds=(event as CustomEvent<BirdsView>).detail;renderBirds();},{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-birds-command]'))button.addEventListener('click',()=>{controller.birds(button.dataset.birdsCommand as BirdCommand);host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});
  host.addEventListener('scene-studio-change' ,event=>{studio=(event as CustomEvent<StudioView>).detail;renderPlacement();renderSelection();renderStudio();},{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-studio-command]'))button.addEventListener('click',()=>{const command=button.dataset.studioCommand as StudioCommand;controller.studio(command);host.focus({preventScroll:true});if(command!=='pause')scrollHudTarget(host);},{signal:events.signal});
  root.querySelector<HTMLSelectElement>('[data-macaw-clip]')?.addEventListener('change',event=>{controller.studio('clip',(event.target as HTMLSelectElement).value);scrollHudTarget(host);},{signal:events.signal});
  root.querySelector<HTMLSelectElement>('[data-macaw-angle]')?.addEventListener('change',event=>{controller.studio('angle',(event.target as HTMLSelectElement).value);scrollHudTarget(host);},{signal:events.signal});
  root.querySelector('[data-edit-remove]')?.addEventListener('click',()=>{
    if(!selected||removal||!editDialog)return;
    const target:EditTarget=selected.kind==='habitat'?{kind:'habitat',id:selected.id}:{kind:'path',cell:{...selected.cell}};
    const result=controller.quoteRemoval(target);if(!result)return;
    if(!result.ok){editView={...editView,reason:result.reason,result:null};renderEdit();return;}
    controller.placement('cancel');removal=result.quote;removalName=presentSelection(selected,locale).title;renderEdit();
    editDialog.showModal();controller.setPaused(true);root.querySelector<HTMLElement>('[data-edit-cancel]')?.focus();
  },{signal:events.signal});
  function dismissRemoval(){removal=null;if(editDialog?.open)editDialog.close();controller.setPaused(false);if(state.status==='ready')host?.focus({preventScroll:true});}
  root.querySelector('[data-edit-cancel]')?.addEventListener('click',dismissRemoval,{signal:events.signal});
  root.querySelector('[data-edit-confirm]')?.addEventListener('click',()=>{const quote=removal;if(!quote)return;dismissRemoval();controller.edit('remove',quote);},{signal:events.signal});
  editDialog?.addEventListener('close',()=>{removal=null;controller.setPaused(false);},{signal:events.signal});
  root.querySelector('[data-edit-undo]')?.addEventListener('click',()=>{controller.edit('undo');host?.focus({preventScroll:true});},{signal:events.signal});
  host.addEventListener('scene-edit-change',event=>{editView=(event as CustomEvent<EditView>).detail;renderEdit();},{signal:events.signal});
  host.addEventListener('scene-selection-change' ,event=>{const had=Boolean(selected);selected=(event as CustomEvent<SceneIdentity|null>).detail;renderSelection();if(!selected&&had&&selectionStatus)selectionStatus.value=entryMessages[locale].selectionCleared;},{signal:events.signal});
  host.addEventListener('scene-access-change',event=>{access=(event as CustomEvent<AccessSummary>).detail;renderPlacement();},{signal:events.signal});
  host.addEventListener('scene-habitat-change',event=>{habitatCount=(event as CustomEvent<{count:number}>).detail.count;renderPlacement();renderStudio();},{signal:events.signal});
  host.addEventListener('scene-placement-change',event=>{placement=(event as CustomEvent<PlacementView>).detail;missionPanel.setPreviewActive(placement.active);onboardingPanel.placement(placement);renderPlacement();},{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-placement-command]'))button.addEventListener('click',()=>{const command=button.dataset.placementCommand as PlacementCommand;controller.placement(command,placement?.revision);if(command==='begin'||command==='begin-path'||command==='cancel'||command==='confirm')host.focus({preventScroll:true});},{signal:events.signal});
  placementTools?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();controller.placement('cancel');host.focus({preventScroll:true});}},{signal:events.signal});
  const dismiss=()=>{controller.clearSelection();host.focus({preventScroll:true});};
  root.querySelector('[data-clear-selection]')?.addEventListener('click',dismiss,{signal:events.signal});
  selectionPanel?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dismiss();}},{signal:events.signal});
  host.addEventListener('camera-view-change',()=>cameraState(),{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-camera-command]'))button.addEventListener('click',()=>controller.camera(button.dataset.cameraCommand as CameraCommand),{signal:events.signal});
  const guidedButton=root.querySelector<HTMLButtonElement>('[data-onboarding-start]');if(guidedButton){guidedButton.disabled=false;guidedButton.addEventListener('click',()=>{if(!mayOpen())return;root.dataset.guided='true';guidedStart=true;if(state.status==='ready'){guidedStart=false;if(!missionPanel.focusCare())onboardingPanel.focus();}else void controller.open();},{signal:events.signal});}
  root.addEventListener('hud-input-cancel',()=>controller.cancelInput(),{signal:events.signal});
  root.addEventListener('hud-panel-change',()=>{controller.cancelInput();controller.placement('cancel');controller.food('cancel');controller.water('cancel');controller.perch('cancel');},{signal:events.signal});
  root.querySelector('[data-onboarding-exit]')?.addEventListener('click',()=>{root.dataset.guided='false';revealHudTarget(root.querySelector('[data-placement-tools]'));host.focus({preventScroll:true});scrollHudTarget(host);},{signal:events.signal});
  root.querySelector<HTMLSelectElement>('[data-guide-language]')?.addEventListener('change',event=>{const value=(event.target as HTMLSelectElement).value;if(value!=='en'&&value!=='id')return;locale=value;render(state);root.dispatchEvent(new CustomEvent('entry-locale-request',{detail:value}));},{signal:events.signal});
  const mayOpen=()=>options.canOpen?.()!==false&&options.beforeOpen?.()!==false;
  open.addEventListener('click', () => { if(mayOpen())void controller.open(); }, { signal: events.signal });
  retry.addEventListener('click', () => { if(mayOpen())void controller.open(); }, { signal: events.signal });
  close.addEventListener('click', () => { controller.close(); open.focus(); }, { signal: events.signal });
  reload.addEventListener('click', () => window.location.reload(), { signal: events.signal });
  // Close GPU resources on navigation while keeping entry controls usable in BFCache.
  window.addEventListener('pagehide', () => controller.close(), { signal: events.signal });

  return {
    setMuted(value:boolean){if(!disposed)controller.muted(value);},
    setVisualSettings(value:VisualSettings){if(!disposed)controller.visualSettings(value);},
    setLocale(value: EntryLocale) { if (!disposed) { locale = value; controller.locale(value);render(state); } },
    setPaused(value: boolean) { if (!disposed) controller.setExternalPaused(value); },
    refresh:()=>{if(!disposed)render(state);},
    async openGame(paused=false){if(disposed||!mayOpen())return;guidedStart=true;root.dataset.guided='true';controller.setExternalPaused(paused);await controller.open();},
    close: () => { if (!disposed) controller.close(); },
    dispose() { if (disposed) return; disposed = true; controller.dispose();if(recoveryDialog?.open)recoveryDialog.close();if(editDialog?.open)editDialog.close(); events.abort(); if(foodDialog?.open)foodDialog.close();if(waterDialog?.open)waterDialog.close();if(perchDialog?.open)perchDialog.close();mounted.delete(root); },
    inspect: () => ({ state: controller.getState(), session: controller.inspectSession() }),
  };
}

export function mountPreviewPanel(root: HTMLElement, options: PreviewPanelOptions = {}) {
  mounted.get(root)?.dispose();
  const handle = createPanel(root, options);
  mounted.set(root, handle);
  return handle;
}
