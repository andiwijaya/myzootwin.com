import {prepareHabitat} from '../world/build-habitat.ts';
import type {Point} from './state.ts';
import { createEventBus, type SimulationEvent } from './events.ts';
import { createFixedClock } from './fixed-clock.ts';
import { createInitialState } from './initial-state.ts';
import { nextRandom } from './random.ts';
import { MAX_TICK, TICK_MS, type ZooSaveV1 } from './state.ts';
import { validateSave } from '../persistence/save-v1.ts';

/** Fixed time plus atomic habitat occupancy. Care/money/mission rules remain later features. */
export function createSimulation(initial: ZooSaveV1 = createInitialState()) {
  const checked=validateSave(initial);
  if(!checked.ok)throw new Error(`Invalid initial state at ${checked.path}`);
  const baseline=checked.value;
  let state=structuredClone(baseline);
  let disposed=false;
  let lastFrame:number|null=null;
  const bus=createEventBus<SimulationEvent>();
  const clock=createFixedClock(()=>{
    if(state.tick>=MAX_TICK)throw new RangeError('Simulation tick limit reached');
    state.tick++;
    state.gameTimeMs=state.tick*TICK_MS;
    const random=nextRandom(state.randomState);
    state.randomState=random.state;
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
      if(!prepared.duplicate){const next=validateSave({...state,world:prepared.world});if(!next.ok)return {ok:false as const,reason:'command' as const};state=next.value;bus.emit(Object.freeze({type:'habitat-built',habitatId:prepared.habitatId,tick:state.tick,gameTimeMs:state.gameTimeMs}));}
      return {ok:true as const,habitatId:prepared.habitatId,duplicate:prepared.duplicate};
    },
    subscribe: bus.subscribe,
    snapshot: ()=>structuredClone(state),
    setPaused(value:boolean) { if(clock.inspect().paused!==value) { lastFrame=null; clock.setPaused(value); } },
    reset() { if(disposed)return; state=structuredClone(baseline); lastFrame=null; clock.reset(); bus.emit(Object.freeze({type:'reset',tick:state.tick,gameTimeMs:state.gameTimeMs})); },
    dispose() { if(disposed)return; disposed=true; lastFrame=null; clock.dispose(); bus.dispose(); },
    inspect: ()=>({tick:state.tick,gameTimeMs:state.gameTimeMs,randomState:state.randomState,currency:state.currency,birdCount:state.animals.length,habitatCount:state.world.habitats.length,occupiedTiles:state.world.tiles.filter(t=>t.occupantId!==null).length,...clock.inspect(),subscribers:bus.inspect().subscribers,listenerErrors:bus.inspect().listenerErrors}),
  };
}
