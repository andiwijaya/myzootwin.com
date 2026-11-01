import {waterTransaction,waterView} from '../animals/watering.ts';
import {foodTransaction,foodView,type FoodAction} from '../animals/feeding.ts';
import {stepAnimals,welcomeBirds,reserveBird,birdsView,type BirdCommand} from '../animals/autonomy.ts';
import {editLedger,refundable} from '../economy/refunds.ts';
import {quoteRemoval,removedWorld,sameWorld,targetId,type EditTarget,type RemovalQuote,type EditorState} from '../world/editing.ts';
import {preparePath,reconcilePathAccess,accessSummary} from '../world/paths.ts';
import {prepareHabitat} from '../world/build-habitat.ts';
import type {Point} from './state.ts';
import { createEventBus, type SimulationEvent } from './events.ts';
import { createFixedClock } from './fixed-clock.ts';
import { createInitialState } from './initial-state.ts';
import { nextRandom } from './random.ts';
import { MAX_TICK, TICK_MS, type ZooSaveV1 } from './state.ts';
import { validateSave } from '../persistence/save-v1.ts';

/** Fixed time plus atomic habitat occupancy. Care/money/mission rules remain later features. */
export function createSimulation(initial: ZooSaveV1 = createInitialState(), savedEditor?:EditorState) {
  const checked=validateSave(initial);
  if(!checked.ok)throw new Error(`Invalid initial state at ${checked.path}`);
  const reconciled=reconcilePathAccess(checked.value.world);
  const baseline={...checked.value,world:reconciled.world};
  let topology=reconciled.topology;
  let state=structuredClone(baseline);
  let editor:EditorState={revision:0,undo:null};
  if(savedEditor&&Number.isSafeInteger(savedEditor.revision)&&savedEditor.revision>=0&&savedEditor.revision<Number.MAX_SAFE_INTEGER){editor=structuredClone(savedEditor);if(editor.undo&&!sameWorld(editor.undo.after,state.world))editor.undo=null;}
  const invalidateEdit=()=>{editor={revision:editor.revision+1,undo:null};};
  let disposed=false;
  let lastFrame:number|null=null;
  const bus=createEventBus<SimulationEvent>();
  const clock=createFixedClock(()=>{
    if(state.tick>=MAX_TICK)throw new RangeError('Simulation tick limit reached');
    state.tick++;
    state.gameTimeMs=state.tick*TICK_MS;
    const random=nextRandom(state.randomState);
    state.randomState=random.state;
    const {fed,watered}=stepAnimals(state);for(const e of watered)bus.emit(Object.freeze({type:'animal-drank',...e,tick:state.tick,gameTimeMs:state.gameTimeMs}));for(const e of fed)bus.emit(Object.freeze({type:'animal-fed',...e,tick:state.tick,gameTimeMs:state.gameTimeMs}));
    bus.emit(Object.freeze({type:'tick',tick:state.tick,gameTimeMs:state.gameTimeMs,randomSample:random.value}));
  });
  return {
    advance: (deltaMs:number)=>clock.advance(deltaMs),
    frame(timeMs:number) {
      if(!Number.isFinite(timeMs) || timeMs<0)throw new RangeError('Invalid frame timestamp');
      if(disposed || clock.inspect().paused)return 0;
      const previous=lastFrame;
      lastFrame=previous===null?timeMs:Math.max(previous,timeMs);
      return clock.advance(previous===null?0:Math.max(0,timeMs-previous));
    },
    buildHabitat(anchor:Point,operationId:string){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      const prepared=prepareHabitat(state.world,anchor,operationId);
      if(!prepared.ok)return prepared;
      if(!prepared.duplicate){const connected=reconcilePathAccess(prepared.world);const next=validateSave({...state,world:connected.world});if(!next.ok)return {ok:false as const,reason:'command' as const};state=next.value;topology=connected.topology;invalidateEdit();bus.emit(Object.freeze({type:'habitat-built',habitatId:prepared.habitatId,tick:state.tick,gameTimeMs:state.gameTimeMs}));}
      return {ok:true as const,habitatId:prepared.habitatId,duplicate:prepared.duplicate};
    },
    buildPath(cell:Point){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      const prepared=preparePath(state.world,cell);if(!prepared.ok)return prepared;
      if(!prepared.duplicate){const connected=reconcilePathAccess(prepared.world);const next=validateSave({...state,world:connected.world});if(!next.ok)return {ok:false as const,reason:'command' as const};state=next.value;topology=connected.topology;invalidateEdit();bus.emit(Object.freeze({type:'path-built',cell:{...cell},tick:state.tick,gameTimeMs:state.gameTimeMs}));}
      return {ok:true as const,duplicate:prepared.duplicate};
    },
    birdInspect:()=>Object.fromEntries([...state.animals].sort((a,b)=>a.id.localeCompare(b.id)).flatMap((a,i)=>{const key=`bird${i+1}`;return [[`${key}X`,a.position?.x??-1],[`${key}Z`,a.position?.z??-1],[`${key}Height`,a.motion.elevation],[`${key}Phase`,['idle','walk-out','look','walk-home','ascend','perch','descend','seek-food','eat','leave-food','seek-water','drink','water-back','water-hop','leave-water','water-home','water-abort'].indexOf(a.motion.phase)],[`${key}Sequence`,a.motion.sequence],[`${key}Hunger`,a.hunger],[`${key}FoodEaten`,a.foodEaten],[`${key}Thirst`,a.thirst],[`${key}WaterDrunk`,a.waterDrunk]];})),
    birdSnapshot:()=>({animals:structuredClone(state.animals),habitats:structuredClone(state.world.habitats),width:state.world.width,height:state.world.height}),
    waterView:()=>waterView(state),
    water(action:FoodAction,revision:number){if(disposed||clock.inspect().paused||!Number.isSafeInteger(revision)||revision<0)return {ok:false as const,reason:'invalid' as const};const next=structuredClone(state),reason=waterTransaction(next,action,revision,editor.revision+1);if(reason!=='ok')return {ok:false as const,reason};const checked=validateSave(next);if(!checked.ok)return {ok:false as const,reason:'invalid' as const};state=checked.value;invalidateEdit();bus.emit(Object.freeze({type:'water-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};},
    foodView:()=>foodView(state),
    food(action:FoodAction,revision:number){if(disposed||clock.inspect().paused||!Number.isSafeInteger(revision)||revision<0)return {ok:false as const,reason:'invalid' as const};const next=structuredClone(state),reason=foodTransaction(next,action,revision,editor.revision+1);if(reason!=='ok')return {ok:false as const,reason};const checked=validateSave(next);if(!checked.ok)return {ok:false as const,reason:'invalid' as const};state=checked.value;invalidateEdit();bus.emit(Object.freeze({type:'food-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};},
    birdsView:()=>birdsView(state),
    birds(command:BirdCommand){
      if(disposed||clock.inspect().paused)return false;
      const next=structuredClone(state);
      if(command==='welcome'){if(!welcomeBirds(next))return false;}else if(command==='reserve'){if(!next.animals.some(a=>a.habitatId))return false;next.animals.forEach(reserveBird);}else return false;
      const checked=validateSave(next);if(!checked.ok)return false;state=checked.value;invalidateEdit();bus.emit(Object.freeze({type:'birds-changed',tick:state.tick,gameTimeMs:state.gameTimeMs}));return true;
    },
    editorSnapshot:()=>structuredClone(editor),
    quoteRemoval:(target:EditTarget)=>quoteRemoval(state,target,editor.revision),
    remove(quote:RemovalQuote,operationId:string){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      if(quote.revision!==editor.revision)return {ok:false as const,reason:'stale' as const};
      const checked=quoteRemoval(state,quote.target,editor.revision);if(!checked.ok)return checked;
      const transaction=editLedger(state,operationId,refundable(state,targetId(quote.target)).map(r=>({kind:'refund' as const,relatedId:r.paidId,amount:r.amount})));
      if(!transaction)return {ok:false as const,reason:'funds' as const};
      const connected=reconcilePathAccess(removedWorld(state.world,quote.target));
      const next=validateSave({...state,world:connected.world,currency:transaction.currency,ledger:transaction.ledger});
      if(!next.ok)return {ok:false as const,reason:'command' as const};
      editor={revision:editor.revision+1,undo:{before:structuredClone(state.world),after:structuredClone(connected.world),refundIds:transaction.entries.map(e=>e.id)}};
      state=next.value;topology=connected.topology;bus.emit(Object.freeze({type:'world-edited',tick:state.tick,gameTimeMs:state.gameTimeMs}));
      return {ok:true as const};
    },
    undo(operationId:string){
      if(disposed||clock.inspect().paused)return {ok:false as const,reason:'command' as const};
      const undo=editor.undo;if(!undo||!sameWorld(undo.after,state.world))return {ok:false as const,reason:'stale' as const};
      const refunds=undo.refundIds.map(id=>state.ledger.find(e=>e.id===id));
      if(refunds.some(e=>!e||e.kind!=='refund'))return {ok:false as const,reason:'command' as const};
      const transaction=editLedger(state,operationId,refunds.map(e=>({kind:'restore' as const,relatedId:e!.id,amount:-e!.amount})));
      if(!transaction)return {ok:false as const,reason:'funds' as const};
      const connected=reconcilePathAccess(undo.before),next=validateSave({...state,world:connected.world,currency:transaction.currency,ledger:transaction.ledger});
      if(!next.ok)return {ok:false as const,reason:'command' as const};
      state=next.value;topology=connected.topology;invalidateEdit();bus.emit(Object.freeze({type:'world-edited',tick:state.tick,gameTimeMs:state.gameTimeMs}));return {ok:true as const};
    },
    pathTopology:()=>structuredClone(topology),
    access:()=>accessSummary(topology),
    subscribe: bus.subscribe,
    snapshot: ()=>structuredClone(state),
    setPaused(value:boolean) { if(clock.inspect().paused!==value) { lastFrame=null; clock.setPaused(value); } },
    reset() { if(disposed)return; state=structuredClone(baseline);invalidateEdit();topology=reconcilePathAccess(state.world).topology; lastFrame=null; clock.reset(); bus.emit(Object.freeze({type:'reset',tick:state.tick,gameTimeMs:state.gameTimeMs})); },
    dispose() { if(disposed)return; disposed=true; lastFrame=null; clock.dispose(); bus.dispose(); },
    inspect: ()=>({editorRevision:editor.revision,canUndo:Boolean(editor.undo),tick:state.tick,gameTimeMs:state.gameTimeMs,randomState:state.randomState,currency:state.currency,birdCount:state.animals.length,pathTiles:topology.pathTiles,reachablePathTiles:topology.reachable.length,connectedHabitats:topology.habitats.filter(h=>h.connected).length,routeCells:accessSummary(topology).routeCells,habitatCount:state.world.habitats.length,occupiedTiles:state.world.tiles.filter(t=>t.occupantId!==null).length,...clock.inspect(),subscribers:bus.inspect().subscribers,listenerErrors:bus.inspect().listenerErrors}),
  };
}
