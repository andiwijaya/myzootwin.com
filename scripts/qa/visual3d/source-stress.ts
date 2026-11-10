/** QA-only bounded playback through the one original source FrameDriver.
 * Yield after every callback so a 10x batch cannot block the browser input task.
 * Explicit100ms timestamps are deterministic test input, never native wall/FPS.
 */
export function createSourceStress(hooks:{canRun:()=>boolean;dispatch:(ms:number)=>boolean;tick:()=>number;yieldTask:()=>Promise<void>}){
 let busy=false,cancelled=false,disposed=false,last:Record<string,unknown>|null=null;
 return{async run(frames=100){
  if(busy||disposed||!hooks.canRun())throw Error('Live sole manual10x owner required');
  if(!Number.isSafeInteger(frames)||frames<1||frames>100)throw Error('Bounded1..100callbacks required');
  busy=true;cancelled=false;const before=hooks.tick();let delivered=0;
  try{for(let i=0;i<frames;i++){
   if(cancelled||disposed||!hooks.canRun())break;
   if(!hooks.dispatch(100))throw Error('Original source callback unavailable');
   delivered++;await hooks.yieldTask();
  }}finally{busy=false;last={requested:frames,delivered,before,after:hooks.tick(),cancelled:cancelled||disposed||delivered!==frames,scope:'Explicit100ms source callback playback with task yields; not native10x wall time/presentation'};}
  return last;
 },cancel(){cancelled=true;},dispose(){cancelled=true;disposed=true;},inspect:()=>({busy,disposed,last})};
}
