import {reconcileElephantWelfare} from '../animals/elephants/welfare.ts';
import {stepElephantCare} from '../animals/elephants/care-simulation.ts';
import {elephantCareView,elephantCareSnapshot,defaultElephantCareCell,validateElephantCarePlacement,prepareElephantCarePlacement,prepareElephantCareRefill,type ElephantCareKind,type ElephantCareQuote,type ElephantCareRefillQuote} from '../animals/elephants/care-resources.ts';
import {elephantResidentsView,prepareElephantWelcome} from '../animals/elephants/residents.ts';
import {elephantHabitatView,prepareElephantConstruction} from '../economy/elephant-construction.ts';
import {isVisualSettings} from './visual-settings.ts';
import {firstMissionGuide} from '../missions/onboarding.ts';
import {MISSION_RULES,evaluateMissions as evaluateMacawMissions,missionView,claimMission,type MissionQuote} from '../missions/engine.ts';
import {recoveryView,supportTransaction,type RecoveryQuote} from '../economy/recovery.ts';
import {attractionView} from '../visitors/attraction.ts';
import {compactFinance,retireClosedProofs,ledgerProof,totals} from '../economy/journal.ts';
import {PRICES,MONEY_RULES,moneyReason,debit,settleMaintenance,economyView} from '../economy/spending.ts';
import {ticketLimit,ticketView,TICKET_RULES} from '../economy/tickets.ts';
import {reconcileJourneys} from '../visitors/navigation.ts';
import {stepArrivals,arrivalsView} from '../visitors/arrivals.ts';
import {reconcileWelfare as reconcileMacawWelfare} from '../animals/welfare.ts';
import {perchTransaction,perchView,type PerchAction} from '../animals/resting.ts';
import {waterTransaction,waterView} from '../animals/watering.ts';
import {foodTransaction,foodView,type FoodAction} from '../animals/feeding.ts';
import {stepAnimals,welcomeBirds,reserveBird,birdsView,type BirdCommand} from '../animals/autonomy.ts';
import {editLedger,refundable} from '../economy/refunds.ts';
import {quoteRemoval,removedWorld,sameWorld,targetId,elephantRestorationBlocked,elephantResourceUndoWorld,type EditTarget,type RemovalQuote,type EditorState} from '../world/editing.ts';
import {preparePath,reconcilePathAccess,accessSummary} from '../world/paths.ts';
import {prepareHabitat} from '../world/build-habitat.ts';
import {prepareSpeciesHabitat} from '../world/species-habitat.ts';
import {macawRuntimeView,commitMacawRuntimeView,type RuntimeState} from './runtime-state.ts';
import {isMacaw,elephants} from './species.ts';
import type {ZooSave} from './zoo-state.ts';
import type {Point} from './state.ts';
import { createEventBus, type SimulationEvent } from './events.ts';
import { createFixedClock } from './fixed-clock.ts';
import { createInitialState } from './initial-state.ts';
import { nextRandom } from './random.ts';
import { MAX_TICK, TICK_MS, type ZooSaveV1 } from './state.ts';
import { validateSave } from '../persistence/save-v1.ts';
import {validateSaveV2} from '../persistence/save-v2.ts';
import {conservationGrantView,prepareConservationGrant,type ConservationGrantQuote} from '../economy/conservation-grant.ts';
import {serializeSaveV2} from '../persistence/save-v2.ts';
const validateState=(value:unknown)=>typeof value==='object'&&value!==null&&'schemaVersion'in value&&value.schemaVersion===2?validateSaveV2(value):validateSave(value);
const reconcileWelfare=<S extends RuntimeState>(state:S):S=>{reconcileMacawWelfare(macawRuntimeView(state));return state;};
const evaluateMissions=(state:RuntimeState,advance=false)=>evaluateMacawMissions(macawRuntimeView(state),advance);
const macawTransaction=<Result>(state:RuntimeState,run:(view:ZooSaveV1)=>Result):Result=>{const view=macawRuntimeView(state),result=run(view);commitMacawRuntimeView(state,view);return result;};

/** Fixed simulation time and validated atomic world, care and financial transactions. */
export function createSimulation(initial: ZooSave = createInitialState(), savedEditor?:EditorState) {
  const checked=validateState(initial);
  if(!checked.ok)throw new Error(`Invalid initial state at ${checked.path}`);
  const reconciled=reconcilePathAccess(checked.value.world);
  const baseline:ZooSave=structuredClone(checked.value);baseline.world=reconciled.world;
  let topology=reconciled.topology;
  let state=reconcileWelfare(structuredClone(baseline));evaluateMissions(state);
  let editor:EditorState={revision:0,undo:null};
  if(savedEditor&&Number.isSafeInteger(savedEditor.revision)&&savedEditor.revision>=0&&savedEditor.revision<Number.MAX_SAFE_INTEGER){editor=structuredClone(savedEditor);if(editor.undo&&!sameWorld(editor.undo.after,state.world)&&!elephantResourceUndoWorld(state.world,editor.undo))editor.undo=null;}
  const invalidateEdit=()=>{editor={revision:editor.revision+1,undo:null};};
  const authorized=(expected?:number)=>Number.isSafeInteger(state.economy.nextCommand)&&state.economy.nextCommand<Number.MAX_SAFE_INTEGER&&(expected===state.economy.nextCommand||expected===undefined&&state.economy.checkpoint.entries===0);
  const compactNow=()=>{if(state.ledger.length<MONEY_RULES.journalEntries)return;const next=structuredClone(state);compactFinance(next,editor.undo?.refundIds??[]);const checked=validateState(next);if(!checked.ok)throw new Error(`Invalid financial checkpoint at ${checked.path}`);state=checked.value;};
  compactNow();
  let disposed=false;
  let lastFrame:number|null=null;
  const bus=createEventBus<SimulationEvent>();
  const publish=(event:SimulationEvent)=>{evaluateMissions(state,event.type==='tick');bus.emit(event);};
  const clock=createFixedClock(()=>{
    if(state.tick>=MAX_TICK)throw new RangeError('Simulation tick limit reached');
    state.tick++;
    state.gameTimeMs=state.tick*TICK_MS;
    if(settleMaintenance(state)){compactNow();publish(Object.freeze({type:'economy-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));}
    const random=nextRandom(state.randomState);
    state.randomState=random.state;
    const {fed,watered}=stepAnimals(macawRuntimeView(state));if(state.schemaVersion===2){const care=stepElephantCare(state);fed.push(...care.fed);watered.push(...care.watered);}reconcileWelfare(state);for(const e of watered)publish(Object.freeze({type:'animal-drank',...e,tick:state.tick,gameTimeMs:state.gameTimeMs}));for(const e of fed)publish(Object.freeze({type:'animal-fed',...e,tick:state.tick,gameTimeMs:state.gameTimeMs}));
    const previousAdmissions=state.admissions.length,viewed=stepArrivals(state);
    const admitted=state.admissions.slice(previousAdmissions).map(a=>({visitorId:a.visitorId,admissionId:a.id,amount:ledgerProof(state,a.ledgerEntryId)!.amount}));
    evaluateMissions(state);retireClosedProofs(state);compactNow();
    for(const e of viewed)publish(Object.freeze({type:'visitor-viewed',...e,tick:state.tick,gameTimeMs:state.gameTimeMs}));
    for(const e of admitted)publish(Object.freeze({type:'visitor-admitted',...e,tick:state.tick,gameTimeMs:state.gameTimeMs}));
    publish(Object.freeze({type:'tick',tick:state.tick,gameTimeMs:state.gameTimeMs,randomSample:random.value}));
  },state.preferences.speed);
  const api={
    advance: (deltaMs:number)=>clock.advance(deltaMs),
    frame(timeMs:number) {
      if(!Number.isFinite(timeMs) || timeMs<0)throw new RangeError('Invalid frame timestamp');
      if(disposed || clock.inspect().paused || clock.isAdvancing())return 0;
      const previous=lastFrame;
      lastFrame=previous===null?timeMs:Math.max(previous,timeMs);
      return clock.advance(previous===null?0:Math.max(0,timeMs-previous));
    },
    /** A real rate change reanchors the browser frame adapter, so it cannot retroactively accelerate time before the input. Sub-tick simulation remainder is retained. */
    setSpeed(value:number){if(disposed||(value!==1&&value!==10)||clock.inspect().speed===value)return false;state.preferences.speed=value;clock.setSpeed(value);lastFrame=null;publish(Object.freeze({type:'speed-changed',speed:value,tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;},
    setMuted(value:unknown){if(disposed||typeof value!=='boolean'||state.preferences.muted===value)return false;state.preferences.muted=value;publish(Object.freeze({type:'preferences-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;},
    visualSettings:()=>({graphics:state.preferences.graphics,reducedMotion:state.preferences.reducedMotion}),
    setVisualSettings(value:unknown){if(disposed||!isVisualSettings(value)||state.preferences.graphics===value.graphics&&state.preferences.reducedMotion===value.reducedMotion)return false;state.preferences.graphics=value.graphics;state.preferences.reducedMotion=value.reducedMotion;publish(Object.freeze({type:'preferences-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;},
    setLocale(value:unknown){if(disposed||(value!=='en'&&value!=='id')||state.preferences.locale===value)return false;state.preferences.locale=value;publish(Object.freeze({type:'preferences-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;},
    onboardingView:()=>firstMissionGuide(macawRuntimeView(state)),
    missionView:()=>missionView(macawRuntimeView(state)),
    conservationGrantView:()=>conservationGrantView(state),
    prepareConservationGrant:(quote:ConservationGrantQuote)=>prepareConservationGrant(state,quote),
    acceptCommittedGrant(candidate:ZooSave,quote:ConservationGrantQuote){
      if(disposed||candidate.schemaVersion!==2)return false;
      const prepared=prepareConservationGrant(state,quote);if(!prepared.ok)return false;
      const next=structuredClone(candidate);next.preferences={...state.preferences};prepared.state.preferences={...state.preferences};
      if(serializeSaveV2(next)!==serializeSaveV2(prepared.state))return false;
      state=next;publish(Object.freeze({type:'conservation-grant-claimed',amount:conservationGrantView(state).amount,tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;
    },
    claimMission(quote:MissionQuote){
      if(disposed||clock.inspect().paused||!authorized(quote?.command))return {ok:false as const,reason:'stale' as const};
      const next=structuredClone(state),view=macawRuntimeView(next),reason=claimMission(view,quote);if(reason)return {ok:false as const,reason};commitMacawRuntimeView(next,view);
      const valid=validateState(next);if(!valid.ok)return {ok:false as const,reason:'stale' as const};
      state=valid.value;compactNow();publish(Object.freeze({type:'mission-claimed',missionId:quote.id,amount:MISSION_RULES[quote.id].coins,tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};
    },
    recoveryView:()=>recoveryView(macawRuntimeView(state)),
    recover(quote:RecoveryQuote):boolean{
      if(disposed||clock.inspect().paused||!authorized(quote.command))return false;
      const v=recoveryView(macawRuntimeView(state));if(!v.low||!v.available||v.key!==quote.key)return false;
      if(v.kind==='reclaim'&&v.cell){const q=api.quoteRemoval({kind:'path',cell:v.cell});return q.ok&&api.remove(q.quote,`edit-${state.economy.nextCommand.toString(16).padStart(32,'0')}`).ok;}
      if(v.kind.startsWith('repair-')){const k=v.kind.slice(7)as'food'|'water'|'perch',r=state.world.resources.find(r=>r.kind===k);return Boolean(r&&api[k]('remove',r.revision,v.command).ok);}
      if(!v.gift&&v.kind!=='rations'&&v.kind!=='open'&&v.kind!=='welcome'){
        if(v.kind==='habitat'&&v.cell)return api.buildHabitat(v.cell,`habitat-guided-${v.command}`,v.command).ok;
        if(v.kind==='path'&&v.cell)return api.buildPath(v.cell,v.command).ok;
        if(v.kind==='food-refill'||v.kind==='water-refill'){const k=v.kind==='food-refill'?'food':'water';return api[k]('refill',api[k+'View' as'foodView'|'waterView']().revision,v.command).ok;}
        if(v.kind==='food'||v.kind==='water'||v.kind==='perch')return api[v.kind]('place',0,v.command).ok;
        return false;
      }
      const next=structuredClone(state);
      if(v.kind==='path'&&v.cell&&v.gift){const p=preparePath(next.world,v.cell);if(!p.ok||p.duplicate||refundable(next,`path-${v.cell.x}-${v.cell.z}`).length)return false;next.world=p.world;next.economy.nextCommand++;next.economy.recovery.equipmentGrants++;}
      else {const view=macawRuntimeView(next);if(!supportTransaction(view,v))return false;commitMacawRuntimeView(next,view);}
      const connected=reconcilePathAccess(next.world),valid=validateState(reconcileWelfare(reconcileJourneys({...next,world:connected.world})));if(!valid.ok)return false;
      state=valid.value;topology=connected.topology;invalidateEdit();compactNow();publish(Object.freeze({type:'recovery-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;
    },
    commandRevision:()=>state.economy.nextCommand,
    elephantCareView:()=>elephantCareView(state),
    elephantCareSnapshot:()=>elephantCareSnapshot(state),
    defaultElephantCareCell:(kind:ElephantCareKind)=>defaultElephantCareCell(state,kind),
    elephantCarePlacementView:(kind:ElephantCareKind,cell:Point|null)=>validateElephantCarePlacement(state,kind,cell),
    placeElephantCare(quote:ElephantCareQuote){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'stale' as const};const result=prepareElephantCarePlacement(state,quote);if(!result.ok)return result;state=result.state;invalidateEdit();compactNow();publish(Object.freeze({type:'elephant-care-changed',resourceId:result.resourceId,tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const,resourceId:result.resourceId};
    },
    refillElephantCare(quote:ElephantCareRefillQuote){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'stale' as const};const result=prepareElephantCareRefill(state,quote);if(!result.ok)return result;state=result.state;invalidateEdit();compactNow();publish(Object.freeze({type:'elephant-care-changed',resourceId:result.resourceId,tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const,resourceId:result.resourceId};
    },
    elephantResidentsView:()=>elephantResidentsView(state),
    elephantSnapshot:()=>({animals:structuredClone(elephants(state.animals)),width:state.world.width,height:state.world.height}),
    welcomeElephants(command:number){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      const result=prepareElephantWelcome(state,command);if(!result.ok)return result;
      const checked=validateState(reconcileJourneys(result.state));if(!checked.ok)return {ok:false as const,reason:'command' as const};state=checked.value;invalidateEdit();compactNow();publish(Object.freeze({type:'elephants-welcomed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};
    },
    elephantHabitatView:()=>elephantHabitatView(state),
    buildElephantHabitat(anchor:Point,operationId:string,expectedCommand:number){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      const result=prepareElephantConstruction(state,anchor,operationId,expectedCommand);if(!result.ok)return result;
      if(!result.duplicate){const connected=reconcilePathAccess(result.state.world),checked=validateState(reconcileJourneys({...result.state,world:connected.world}));if(!checked.ok)return {ok:false as const,reason:'command' as const};state=reconcileWelfare(checked.value);topology=connected.topology;invalidateEdit();compactNow();publish(Object.freeze({type:'habitat-built',habitatId:result.habitatId,tick:state.tick,gameTimeMs:state.gameTimeMs}));}
      return {ok:true as const,habitatId:result.habitatId,duplicate:result.duplicate};
    },
    buildHabitat(anchor:Point,operationId:string,expectedCommand?:number){
      if(disposed||clock.inspect().paused||!authorized(expectedCommand))return {ok:false as const,reason:'command' as const};
      const prepared=state.schemaVersion===2?prepareSpeciesHabitat(state.world,anchor,operationId,'macaw-aviary'):prepareHabitat(state.world,anchor,operationId);
      if(!prepared.ok)return prepared;
      if(!prepared.duplicate){const paid=structuredClone(state),reason=debit(paid,PRICES.habitat,'build',`buy-${operationId.slice(8)}`,prepared.habitatId);if(reason)return {ok:false as const,reason:reason==='duplicate'?'command' as const:reason};paid.economy.nextCommand++;const connected=reconcilePathAccess(prepared.world);const next=validateState(reconcileJourneys({...paid,world:connected.world}));if(!next.ok)return {ok:false as const,reason:'command' as const};state=reconcileWelfare(next.value);topology=connected.topology;invalidateEdit();compactNow();publish(Object.freeze({type:'habitat-built',habitatId:prepared.habitatId,tick:state.tick,gameTimeMs:state.gameTimeMs}));}
      return {ok:true as const,habitatId:prepared.habitatId,duplicate:prepared.duplicate};
    },
    buildPath(cell:Point,expectedCommand?:number){
      if(disposed||clock.inspect().paused||!authorized(expectedCommand))return {ok:false as const,reason:'command' as const};
      const prepared=preparePath(state.world,cell);if(!prepared.ok)return prepared;
      if(!prepared.duplicate){const paid=structuredClone(state),reason=debit(paid,PRICES.path,'build',`buy-path-${cell.x}-${cell.z}-${state.ledger.length}`,`path-${cell.x}-${cell.z}`);if(reason)return {ok:false as const,reason:reason==='duplicate'?'command' as const:reason};paid.economy.nextCommand++;const connected=reconcilePathAccess(prepared.world);const next=validateState(reconcileJourneys({...paid,world:connected.world}));if(!next.ok)return {ok:false as const,reason:'command' as const};state=reconcileWelfare(next.value);topology=connected.topology;invalidateEdit();compactNow();publish(Object.freeze({type:'path-built',cell:{...cell},tick:state.tick,gameTimeMs:state.gameTimeMs}));}
      return {ok:true as const,duplicate:prepared.duplicate};
    },
    visitors(open:boolean){if(disposed||clock.inspect().paused||typeof open!=='boolean'||state.visitorFlow.open===open||(open&&ticketLimit(state)!==null))return false;state.visitorFlow.open=open;state.visitorFlow.cooldownTicks=0;publish(Object.freeze({type:'visitor-entrance-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;},
    visitorView:()=>arrivalsView(state),
    visitorInspect:()=>({...(()=>{const v=state.visitors.find(v=>v.journey?.startedTick!==null&&v.journey?.startedTick!==undefined);return {attractionWelfare:attractionView(state).welfare??-1,attractionInterval:attractionView(state).intervalTicks,attractionReady:attractionView(state).ready?1:0,visitorWalkerSerial:v?.arrival?.serial??0,visitorWalkerX:v?.position.x??-1,visitorWalkerZ:v?.position.z??-1,visitorWalkerHeading:v?.journey?.heading??0,visitorWalkerRouteIndex:v?.routeIndex??-1,visitorEvaluated:state.visitorFlow.feedback.evaluated,visitorScored:state.visitorFlow.feedback.scored,visitorScoreSum:state.visitorFlow.feedback.scoreSum,visitorPositive:state.visitorFlow.feedback.positive,visitorNegative:state.visitorFlow.feedback.negative,visitorInterrupted:state.visitorFlow.feedback.interrupted,visitorObservationSamples:v?.experience?.samples??0,visitorObservationOccupied:v?.experience?.occupiedSamples??0,visitorObservationSum:v?.experience?.welfareHundredths??0,ticketAdmissions:ticketView(state).admissions,ticketRevenue:ticketView(state).revenue,ticketLedgerEntries:totals(state).counts.ticket,ticketPrice:TICKET_RULES.price,ticketWalkerPaid:v?.entry?.status==='paid'?1:0,ticketWalkerEntryTick:v?.entry?.tick??-1};})(),...Object.fromEntries([0,1,2].flatMap(i=>{const v=state.visitors.find(v=>v.arrival?.slot===i),a=v?.arrival,k=`visitor${i+1}`;return [[`${k}Serial`,a?.serial??0],[`${k}Age`,a?state.tick-a.spawnTick:0],[`${k}X`,v?.position.x??-1],[`${k}Z`,v?.position.z??-1]];}))}),
    visitorFocus:()=>{const v=state.visitors.find(v=>v.journey?.startedTick!==null&&v.journey?.startedTick!==undefined)??state.visitors[0];return v?{...v.position}:null;},
    visitorSnapshot:()=>({visitors:structuredClone(state.visitors),width:state.world.width,height:state.world.height,tick:state.tick,gate:{...state.world.gate}}),
    birdInspect:()=>Object.fromEntries(macawRuntimeView(state).animals.sort((a,b)=>a.id.localeCompare(b.id)).flatMap((a,i)=>{const key=`bird${i+1}`;return [[`${key}X`,a.position?.x??-1],[`${key}Z`,a.position?.z??-1],[`${key}Height`,a.motion.elevation],[`${key}Phase`,['idle','walk-out','look','walk-home','ascend','perch','descend','seek-food','eat','leave-food','seek-water','drink','water-back','water-hop','leave-water','water-home','water-abort','seek-rest','rest','enrich'].indexOf(a.motion.phase)],[`${key}Sequence`,a.motion.sequence],[`${key}Welfare`,a.welfare],[`${key}HabitatFit`,a.habitatFit],[`${key}WelfareLow`,a.care.low?1:0],[`${key}Hunger`,a.hunger],[`${key}FoodEaten`,a.foodEaten],[`${key}Thirst`,a.thirst],[`${key}WaterDrunk`,a.waterDrunk],[`${key}Energy`,a.energy],[`${key}Enrichment`,a.enrichment],[`${key}RestedTicks`,a.restedTicks],[`${key}EnrichedTicks`,a.enrichedTicks]];})),
    birdSnapshot:()=>({animals:structuredClone(macawRuntimeView(state).animals),habitats:structuredClone(macawRuntimeView(state).world.habitats),width:state.world.width,height:state.world.height}),
    perchView:()=>perchView(macawRuntimeView(state)),
    perch(action:PerchAction,revision:number,expectedCommand?:number){if(disposed||clock.inspect().paused||!authorized(expectedCommand)||!Number.isSafeInteger(revision)||revision<0)return {ok:false as const,reason:'invalid' as const};const next=structuredClone(state),reason=macawTransaction(next,view=>perchTransaction(view,action,revision,state.economy.nextCommand));if(reason!=='ok')return {ok:false as const,reason};const resource=action==='remove'?state.world.resources.find(r=>r.kind==='perch'):next.world.resources.find(r=>r.kind==='perch');if(!resource)return {ok:false as const,reason:'invalid' as const};
      if(action==='remove'){const items=refundable(state,resource.id).map(r=>({kind:'refund' as const,relatedId:r.paidId,amount:r.amount}));const transaction=editLedger(state,`care-remove-${resource.kind}-${state.ledger.length}`,items);if(!transaction)return {ok:false as const,reason:'invalid' as const};next.currency=transaction.currency;next.ledger=transaction.ledger;}
      else{const fee=PRICES.perch,failure=debit(next,fee,action==='place'?'build':'supplies',`care-perch-${state.ledger.length}-${action}`,resource.id);if(failure)return {ok:false as const,reason:failure==='duplicate'?'stale' as const:failure};}next.economy.nextCommand++;const checked=validateState(next);if(!checked.ok)return {ok:false as const,reason:'invalid' as const};state=reconcileWelfare(checked.value);invalidateEdit();compactNow();publish(Object.freeze({type:'perch-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};},
    waterView:()=>waterView(macawRuntimeView(state)),
    water(action:FoodAction,revision:number,expectedCommand?:number){if(disposed||clock.inspect().paused||!authorized(expectedCommand)||!Number.isSafeInteger(revision)||revision<0)return {ok:false as const,reason:'invalid' as const};const next=structuredClone(state),reason=macawTransaction(next,view=>waterTransaction(view,action,revision,state.economy.nextCommand));if(reason!=='ok')return {ok:false as const,reason};const resource=action==='remove'?state.world.resources.find(r=>r.kind==='water'):next.world.resources.find(r=>r.kind==='water');if(!resource)return {ok:false as const,reason:'invalid' as const};
      if(action==='remove'){const items=refundable(state,resource.id).map(r=>({kind:'refund' as const,relatedId:r.paidId,amount:r.amount}));const transaction=editLedger(state,`care-remove-${resource.kind}-${state.ledger.length}`,items);if(!transaction)return {ok:false as const,reason:'invalid' as const};next.currency=transaction.currency;next.ledger=transaction.ledger;}
      else{const fee=action==='place'?PRICES.water:PRICES.waterRefill,failure=debit(next,fee,action==='place'?'build':'supplies',`care-water-${state.ledger.length}-${action}`,resource.id);if(failure)return {ok:false as const,reason:failure==='duplicate'?'stale' as const:failure};}next.economy.nextCommand++;const checked=validateState(next);if(!checked.ok)return {ok:false as const,reason:'invalid' as const};state=reconcileWelfare(checked.value);invalidateEdit();compactNow();publish(Object.freeze({type:'water-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};},
    foodView:()=>foodView(macawRuntimeView(state)),
    food(action:FoodAction,revision:number,expectedCommand?:number){if(disposed||clock.inspect().paused||!authorized(expectedCommand)||!Number.isSafeInteger(revision)||revision<0)return {ok:false as const,reason:'invalid' as const};const next=structuredClone(state),reason=macawTransaction(next,view=>foodTransaction(view,action,revision,state.economy.nextCommand));if(reason!=='ok')return {ok:false as const,reason};const resource=action==='remove'?state.world.resources.find(r=>r.kind==='food'):next.world.resources.find(r=>r.kind==='food');if(!resource)return {ok:false as const,reason:'invalid' as const};
      if(action==='remove'){const items=refundable(state,resource.id).map(r=>({kind:'refund' as const,relatedId:r.paidId,amount:r.amount}));const transaction=editLedger(state,`care-remove-${resource.kind}-${state.ledger.length}`,items);if(!transaction)return {ok:false as const,reason:'invalid' as const};next.currency=transaction.currency;next.ledger=transaction.ledger;}
      else{const fee=action==='place'?PRICES.food:PRICES.foodRefill,failure=debit(next,fee,action==='place'?'build':'supplies',`care-food-${state.ledger.length}-${action}`,resource.id);if(failure)return {ok:false as const,reason:failure==='duplicate'?'stale' as const:failure};}next.economy.nextCommand++;const checked=validateState(next);if(!checked.ok)return {ok:false as const,reason:'invalid' as const};state=reconcileWelfare(checked.value);invalidateEdit();compactNow();publish(Object.freeze({type:'food-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};},
    birdsView:()=>birdsView(macawRuntimeView(state)),
    birds(command:BirdCommand){
      if(disposed||clock.inspect().paused)return false;
      const next=structuredClone(state);
      const view=macawRuntimeView(next);if(command==='welcome'){if(!welcomeBirds(view))return false;}else if(command==='reserve'){if(!view.animals.some(a=>a.habitatId))return false;view.animals.forEach(reserveBird);}else return false;commitMacawRuntimeView(next,view);
      const checked=validateState(next);if(!checked.ok)return false;state=reconcileWelfare(checked.value);invalidateEdit();publish(Object.freeze({type:'birds-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;
    },
    editorSnapshot:()=>structuredClone(editor),
    quoteRemoval:(target:EditTarget)=>quoteRemoval(state,target,editor.revision),
    remove(quote:RemovalQuote,operationId:string){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      if(quote.revision!==editor.revision||!authorized(quote.command))return {ok:false as const,reason:'stale' as const};
      const checked=quoteRemoval(state,quote.target,editor.revision);if(!checked.ok)return checked;
      const transaction=editLedger(state,operationId,refundable(state,targetId(quote.target)).map(r=>({kind:'refund' as const,relatedId:r.paidId,amount:r.amount})));
      if(!transaction)return {ok:false as const,reason:'funds' as const};
      const connected=reconcilePathAccess(removedWorld(state.world,quote.target));
      const next=validateState(reconcileJourneys({...structuredClone(state),world:connected.world,currency:transaction.currency,ledger:transaction.ledger,economy:{...structuredClone(state.economy),nextCommand:state.economy.nextCommand+1}}));
      if(!next.ok)return {ok:false as const,reason:'command' as const};
      editor={revision:editor.revision+1,undo:{before:structuredClone(state.world),after:structuredClone(connected.world),refundIds:transaction.entries.map(e=>e.id)}};
      state=reconcileWelfare(next.value);if(state.schemaVersion===2&&quote.target.kind==='elephant-resource')reconcileElephantWelfare(state);topology=connected.topology;compactNow();publish(Object.freeze({type:'world-edited',tick:state.tick,gameTimeMs:state.gameTimeMs}));
      return {ok:true as const};
    },
    undo(operationId:string,expectedCommand?:number){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      const undo=editor.undo;if(!authorized(expectedCommand)||!undo)return {ok:false as const,reason:'stale' as const};
      const elephantWorld=elephantResourceUndoWorld(state.world,undo);if(!elephantWorld&&!sameWorld(undo.after,state.world))return {ok:false as const,reason:'stale' as const};
      const refunds=undo.refundIds.map(id=>ledgerProof(state,id));
      if(refunds.some(e=>!e||e.kind!=='refund'))return {ok:false as const,reason:'command' as const};
      const transaction=editLedger(state,operationId,refunds.map(e=>({kind:'restore' as const,relatedId:e!.id,amount:-e!.amount})));
      if(!transaction)return {ok:false as const,reason:'funds' as const};
      const connected=reconcilePathAccess(elephantWorld??undo.before),restored=structuredClone(state);if(restored.economy.recovery.habitatGrant&&connected.world.habitats.some(h=>h.id===restored.economy.recovery.habitatGrant!.id))restored.economy.recovery.habitatGrant.tick=state.tick;const next=validateState(reconcileJourneys({...restored,world:connected.world,currency:transaction.currency,ledger:transaction.ledger,economy:{...restored.economy,nextCommand:state.economy.nextCommand+1}}));
      if(!next.ok)return {ok:false as const,reason:'command' as const};
      const restoresElephantCare=undo.before.resources.some(r=>r.kind.startsWith('elephant-')&&!undo.after.resources.some(a=>a.id===r.id));if(restoresElephantCare&&elephantRestorationBlocked(next.value))return {ok:false as const,reason:'elephant-space' as const};
      state=reconcileWelfare(next.value);if(state.schemaVersion===2&&restoresElephantCare)reconcileElephantWelfare(state);topology=connected.topology;invalidateEdit();compactNow();publish(Object.freeze({type:'world-edited',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};
    },
    economyView:()=>economyView(state),
    purchaseReason:(kind:'habitat'|'path')=>moneyReason(state,PRICES[kind]),
    /** Renderer-owned copy: excludes ledger, missions and unrelated entity state. */
    worldSnapshot:()=>structuredClone(state.world),
    macawWorldSnapshot:()=>structuredClone(macawRuntimeView(state).world),
    pathTopology:()=>structuredClone(topology),
    access:()=>accessSummary(topology),
    macawAccess:()=>accessSummary({...topology,habitats:topology.habitats.filter(h=>state.world.habitats.some(w=>w.id===h.habitatId&&(!('kind'in w)||w.kind==='macaw-aviary')))}),
    subscribe: bus.subscribe,
    snapshot: ()=>structuredClone(state),
    setPaused(value:boolean) { if(clock.inspect().paused!==value) { lastFrame=null; clock.setPaused(value); } },
    reset() { if(disposed)return; state=reconcileWelfare(structuredClone(baseline));invalidateEdit();topology=reconcilePathAccess(state.world).topology; lastFrame=null; clock.setSpeed(state.preferences.speed);clock.reset();compactNow(); publish(Object.freeze({type:'reset',tick:state.tick,gameTimeMs:state.gameTimeMs})); },
    dispose() { if(disposed)return; disposed=true; lastFrame=null; clock.dispose(); bus.dispose(); },
    inspect: ()=>{const finance=economyView(state);return ({editorRevision:editor.revision,canUndo:Boolean(editor.undo),undoCost:editor.undo?.refundIds.reduce((n,id)=>n+(ledgerProof(state,id)?.amount??0),0)??0,tick:state.tick,gameTimeMs:state.gameTimeMs,randomState:state.randomState,currency:state.currency,maintenancePeriod:state.economy.maintenancePeriod,maintenanceDue:finance.maintenanceDue,economyGrants:finance.grants,economySpent:finance.spent,economyRefunds:finance.refunds,ledgerEntries:totals(state).entries,journalRetained:state.ledger.length,journalArchived:state.economy.checkpoint.entries,journalCompactions:state.economy.checkpoint.compactions,commandRevision:state.economy.nextCommand,retiredVisitorThrough:state.economy.checkpoint.visitorThrough,retiredOpenCount:state.economy.checkpoint.openSerials.length,recoveryHabitatTick:state.economy.recovery.habitatGrant?.tick??-1,recoveryHabitatNonce:Number(state.economy.recovery.habitatGrant?.id.split('-').at(-1)??0),recoveryGrants:state.economy.recovery.equipmentGrants,recoveryRations:state.economy.recovery.rationBatches,recoveryLastRation:state.economy.recovery.lastRationTick??-1,birdCount:state.animals.filter(isMacaw).length,pathTiles:topology.pathTiles,reachablePathTiles:topology.reachable.length,connectedHabitats:topology.habitats.filter(h=>h.connected).length,routeCells:accessSummary(topology).routeCells,habitatCount:state.world.habitats.length,occupiedTiles:state.world.tiles.filter(t=>t.occupantId!==null).length,...clock.inspect(),subscribers:bus.inspect().subscribers,listenerErrors:bus.inspect().listenerErrors});},
  };
  return api;
}
