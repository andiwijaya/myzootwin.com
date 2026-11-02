import { TICK_MS, type SimulationSpeed } from './state.ts';
export const MAX_FRAME_MS=250;
export const MAX_STEPS_PER_FRAME=3;
export const MAX_FAST_STEPS_PER_FRAME=25;
/** Receives wall elapsed time from the one RAF owner. Every intermediate100ms step runs in order. */
export function createFixedClock(step:()=>void,initialSpeed:SimulationSpeed=1){
 if(initialSpeed!==1&&initialSpeed!==10)throw new RangeError('Invalid simulation speed');
 let accumulator=0,paused=false,disposed=false,advancing=false,droppedMs=0,droppedSimulationMs=0,speed=initialSpeed,lastAdvanceSteps=0;
 const drop=(wall:number,sim:number)=>{droppedMs=Math.min(Number.MAX_SAFE_INTEGER,droppedMs+wall);droppedSimulationMs=Math.min(Number.MAX_SAFE_INTEGER,droppedSimulationMs+sim);};
 return{
  advance(deltaMs:number){
   if(!Number.isFinite(deltaMs)||deltaMs<0||deltaMs>Number.MAX_SAFE_INTEGER)throw new RangeError('Invalid frame duration');if(advancing)return 0;lastAdvanceSteps=0;if(disposed||paused)return 0;
   advancing=true;try{
   const accepted=Math.min(deltaMs,MAX_FRAME_MS);drop(deltaMs-accepted,(deltaMs-accepted)*speed);accumulator+=accepted*speed;
   const budget=speed===10?MAX_FAST_STEPS_PER_FRAME:MAX_STEPS_PER_FRAME;
   while(accumulator+1e-7>=TICK_MS&&lastAdvanceSteps<budget){step();accumulator=Math.max(0,accumulator-TICK_MS);lastAdvanceSteps++;}
   if(accumulator>=TICK_MS){const lost=Math.floor(accumulator/TICK_MS)*TICK_MS;accumulator-=lost;drop(lost/speed,lost);}
   return lastAdvanceSteps;
   }finally{advancing=false;}
  },
  /** Event observers cannot submit another elapsed-time interval inside the current atomic batch. */
  isAdvancing:()=>advancing,
  setSpeed(value:SimulationSpeed){if(value!==1&&value!==10)throw new RangeError('Invalid simulation speed');if(disposed||speed===value)return false;speed=value;return true;},
  setPaused(value:boolean){if(paused!==value)accumulator=0;paused=value;},
  reset(){accumulator=0;droppedMs=0;droppedSimulationMs=0;lastAdvanceSteps=0;},
  dispose(){disposed=true;accumulator=0;lastAdvanceSteps=0;},
  inspect:()=>({accumulatorMs:accumulator,paused,disposed,droppedMs,droppedSimulationMs,speed,lastAdvanceSteps}),
 };
}
