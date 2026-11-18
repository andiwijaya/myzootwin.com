import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';

type Context={root:HTMLElement;host:HTMLElement;read:()=>ZooSave;session:()=>Record<string,number|boolean>|undefined;errors:string[];selectHome:(kind:string,pointerType?:string)=>Promise<void>};

/** QA-only touch events exercise the product canvas; no mode choice precedes the first drag. */
export async function runMobileGestureAudit({root,host,read,session,errors,selectHome}:Context){
 const output=document.createElement('pre');output.id='qa-mobile-gesture-result';output.dataset.status='RUNNING';document.querySelector('#qa-actions')!.append(output);
 const checks:{name:string;passed:boolean;detail?:unknown}[]=[],cases:unknown[]=[],performanceCases:unknown[]=[];
 const delay=(ms=80)=>new Promise<void>(r=>setTimeout(r,ms));
 const frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
 const wait=async(test:()=>boolean,label:string)=>{const until=performance.now()+45000;while(!test()){if(performance.now()>until)throw Error('Timeout '+label);await delay();}};
 const button=(selector:string)=>root.querySelector<HTMLButtonElement>(selector)!;
 const click=(selector:string)=>{const b=button(selector);if(!b?.checkVisibility()||b.matches(':disabled'))throw Error('Unavailable '+selector);b.click();};
 const check=(name:string,passed:boolean,detail?:unknown)=>{checks.push({name,passed,detail});if(!passed)throw Error(name+' '+JSON.stringify(detail));};
 const view=()=>({angle:Number(host.dataset.cameraAzimuth),zoom:Number(host.dataset.cameraZoom),x:Number(host.dataset.cameraPanX),z:Number(host.dataset.cameraPanZ),mode:host.dataset.cameraDragMode,pointers:session()?.cameraPointers});
 const pointer=(type:string,id:number,x:number,y:number)=>host.querySelector('canvas')!.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:id===101,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX:x,clientY:y}));
 const drag=(dx:number,dy=0)=>{const b=host.getBoundingClientRect(),x=b.left+b.width*.42,y=b.top+b.height*.5;pointer('pointerdown',101,x,y);pointer('pointermove',101,x+dx,y+dy);pointer('pointerup',101,x+dx,y+dy);};
 const same=(a:ReturnType<typeof view>,b:ReturnType<typeof view>)=>['angle','zoom','x','z'].every(k=>Math.abs(Number(a[k as keyof typeof a])-Number(b[k as keyof typeof b]))<1e-8);
 const dump=(status:string,error?:unknown)=>{const state=read();output.dataset.status=status;output.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,method:'Internal Chromium viewport; synthetic UUID V5 save; injected touch PointerEvents through original UI/canvas. Raw bursts are measured before and after the original visual frame. Not physical touch or presented FPS.',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},checks,cases,performanceCases,errors,final:{view:view(),valid:state?validateSaveV5(state).ok:false,habitats:state?.world.habitats.length,animals:state?.animals.length,canvases:host.querySelectorAll('canvas').length}},null,2);};
 let viewEvents=0;const onView=()=>viewEvents++;host.addEventListener('camera-view-change',onView);
 const metrics=()=>{const s=session()!;return {updates:Number(s.cameraGestureUpdates),moves:Number(s.cameraPointerMoves),taps:Number(s.cameraTapCount),pending:s.cameraGesturePending,pointers:Number(s.cameraPointers),frames:Number(s.pendingFrames),renders:Number(s.renderSubmissions),tick:Number(s.simulationTick),events:viewEvents};};
 async function burstAudit(kind:string){
  const wasPlaying=session()?.simulationPaused===false;if(wasPlaying)click('[data-pause-toggle]');await delay();
  if(!button('[data-camera-command="reset"]').matches(':disabled'))click('[data-camera-command="reset"]');await frame();
  const b=host.getBoundingClientRect(),cx=b.left+b.width*.5,cy=b.top+b.height*.5,r=Math.min(b.width,b.height)*.2;
  let before=metrics(),pose=view(),started=performance.now();pointer('pointerdown',101,cx-30,cy);
  for(let i=1;i<=64;i++)pointer('pointermove',101,cx-30+i*.5,cy);
  const queued=metrics();check(kind+' burst has one pending frame and no eager camera work',queued.frames===1&&queued.pending===true&&queued.updates===before.updates&&queued.events===before.events&&same(pose,view()));
  await frame();let after=metrics();const elapsedMs=performance.now()-started;
  check(kind+' 64 thumb samples make one camera update and one render',after.moves-before.moves===64&&after.updates-before.updates===1&&after.events-before.events===1&&after.renders-before.renders===1&&!after.pending,{before,queued,after,elapsedMs});
  check(kind+' first requested frame already follows the thumb',view().angle!==pose.angle&&after.tick===before.tick&&after.taps===before.taps);
  pointer('pointerup',101,cx+2,cy);await frame();check(kind+' release leaves no extra camera frame',metrics().frames===0&&metrics().renders===after.renders&&metrics().pointers===0&&metrics().taps===before.taps);
  performanceCases.push({kind,input:'64 one-finger positions',before,queued,after,elapsedMs});
  for(const limit of[1,3]){
   if(!button('[data-camera-command="reset"]').matches(':disabled'))click('[data-camera-command="reset"]');if(limit===3)for(let i=0;i<6;i++)if(!button('[data-camera-command="zoom-in"]').matches(':disabled'))click('[data-camera-command="zoom-in"]');await frame();
   before=metrics();pose=view();started=performance.now();pointer('pointerdown',101,cx-r,cy);pointer('pointerdown',102,cx+r,cy);
   for(let i=1;i<=32;i++){pointer('pointermove',101,cx-r+i*.4,cy+i*.2);pointer('pointermove',102,cx+r+i*.4,cy+i*.2);}
   check(kind+' pan at '+limit+' keeps raw events out of camera matrices',metrics().updates===before.updates&&metrics().frames===1);await frame();after=metrics();const elapsedMs=performance.now()-started;
   check(kind+' pan at '+limit+' is one atomic update without zoom drift',Math.abs(view().zoom-limit)<1e-8&&view().angle===pose.angle&&after.updates-before.updates===1&&after.events-before.events===1&&after.renders-before.renders===1,{before,after,pose:view(),elapsedMs});
   pointer('pointerup',101,cx-r+12.8,cy+6.4);pointer('pointerup',102,cx+r+12.8,cy+6.4);await frame();check(kind+' pan at '+limit+' never picks',metrics().taps===before.taps&&metrics().pointers===0&&metrics().frames===0);
   performanceCases.push({kind,input:'64 two-finger positions',limit,before,after,elapsedMs});
  }
  const taps=metrics().taps,selected=host.dataset.selectedId;
  pointer('pointerdown',101,cx,cy);for(const x of[cx+3,cx,cx+3])pointer('pointermove',101,x,cy);pointer('pointerup',101,cx+3,cy);await frame();
  check(kind+' sub-threshold backtracking is never an object tap',metrics().taps===taps&&host.dataset.selectedId===selected);
  pointer('pointerdown',101,cx,cy);pointer('pointermove',101,cx+4,cy);pointer('pointerup',101,cx+4,cy);await frame();check(kind+' 4px camera drag never picks',metrics().taps===taps&&host.dataset.selectedId===selected);
  pointer('pointerdown',101,cx,cy);await delay(330);pointer('pointerup',101,cx,cy);check(kind+' long hold does not select on release',metrics().taps===taps&&host.dataset.selectedId===selected);
  before=metrics();pose=view();pointer('pointerdown',101,cx,cy);pointer('pointermove',101,cx+30,cy);pointer('pointercancel',101,cx+30,cy);pointer('pointerup',101,cx+30,cy);await frame();
  check(kind+' cancelling queued motion prevents drift or selection',same(pose,view())&&metrics().updates===before.updates&&metrics().taps===taps&&metrics().pointers===0);
  check(kind+' paused input never advances simulation time',metrics().tick===before.tick);
  if(!button('[data-camera-command="reset"]').matches(':disabled'))click('[data-camera-command="reset"]');if(wasPlaying)click('[data-pause-toggle]');
 }
 try{
  await wait(()=>button('[data-continue]')?.checkVisibility()&&!button('[data-continue]').matches(':disabled'),'Continue ready');click('[data-continue]');
  await wait(()=>button('[data-save-resume-button]')?.checkVisibility()||!!host.querySelector('canvas'),'resume prompt');
  if(button('[data-save-resume-button]')?.checkVisibility())click('[data-save-resume-button]');
  await wait(()=>session()?.assetsWaiting===false&&!!host.querySelector('canvas'),'assets');if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');
  await wait(()=>session()?.simulationPaused===false,'playing');await document.fonts.ready;
  for(const kind of['zoo','macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
   click(`[data-zoo-destination="${kind}"]`);await delay(150);await wait(()=>session()?.assetsWaiting===false,'habitat assets');host.scrollIntoView({block:'center',behavior:'instant'});await delay();
   if(!button('[data-camera-command="reset"]').matches(':disabled'))click('[data-camera-command="reset"]');
   const prefix=kind+' ',revision=session()?.commandRevision,selected=host.dataset.selectedId,mobile=innerWidth<900;
   check(prefix+'mobile needs no mode selector',mobile?!root.querySelector('.zoo-drag-modes')!.checkVisibility():root.querySelector('.zoo-drag-modes')!.checkVisibility());
   const rect=host.getBoundingClientRect(),start=view(),scroll=scrollY;drag(rect.width*.137,4);const rotated=view();
   check(prefix+'first thumb drag rotates without choosing Putar',Math.abs(rotated.angle-start.angle)>1&&Math.abs(rotated.angle%45)>1&&rotated.zoom===start.zoom,rotated);
   check(prefix+'thumb leaves no pointer or selection',rotated.pointers===0&&host.dataset.selectedId===selected);
   check(prefix+'thumb does not scroll document',Math.abs(scrollY-scroll)<.5);
   click('[data-camera-command="reset"]');click('[data-camera-command="zoom-in"]');await frame();await delay(30);
   const b=host.getBoundingClientRect(),cx=b.left+b.width*.5,cy=b.top+b.height*.5,r=Math.min(b.width,b.height)*.2;
   pointer('pointerdown',101,cx-r,cy);pointer('pointerdown',102,cx+r,cy);const panBefore=view();
   pointer('pointermove',101,cx-r+12,cy+8);pointer('pointermove',102,cx+r+12,cy+8);await frame();const panned=view();
   check(prefix+'two fingers pan',Math.hypot(panned.x-panBefore.x,panned.z-panBefore.z)>.001,panned);
   check(prefix+'pan keeps angle and final pinch distance',panned.angle===panBefore.angle&&Math.abs(panned.zoom-panBefore.zoom)<1e-8);
   pointer('pointerup',101,cx-r+12,cy+8);pointer('pointerup',102,cx+r+12,cy+8);
   click('[data-camera-command="reset"]');await frame();const pinchBefore=view();
   pointer('pointerdown',101,cx-r,cy);pointer('pointerdown',102,cx+r,cy);pointer('pointerdown',103,cx,cy);
   check(prefix+'third finger is ignored',session()?.cameraPointers===2);
   pointer('pointermove',101,cx-r*1.5,cy-r*.45);pointer('pointermove',102,cx+r*1.5,cy+r*.45);await frame();const pinched=view();
   check(prefix+'pinch zooms with a tilted pair',pinched.zoom>1.45,pinched);
   check(prefix+'two fingers never rotate the camera',pinched.angle===pinchBefore.angle);
   check(prefix+'two fingers own the gesture',session()?.cameraPointers===2&&session()?.cameraPinching===true);
   pointer('pointerup',103,cx,cy);pointer('pointerup',102,cx+r*1.5,cy+r*.45);const lifted=view();pointer('pointermove',101,cx-r*1.5,cy-r*.45);
   check(prefix+'lifting a finger has no jump',same(lifted,view()));pointer('pointermove',101,cx-r*1.5+15,cy-r*.45);await frame();
   check(prefix+'remaining finger resumes direct rotation',view().angle!==lifted.angle);pointer('pointerup',101,cx-r*1.5+15,cy-r*.45);
   check(prefix+'multitouch releases without selecting',session()?.cameraPointers===0&&host.dataset.selectedId===selected);
   pointer('pointerdown',101,cx,cy);click('[data-camera-command="reset"]');const reset=view();pointer('pointermove',101,cx+40,cy);pointer('pointerup',101,cx+40,cy);
   check(prefix+'reset cancels held and late touches',reset.pointers===0&&same(reset,view()));
   pointer('pointerdown',101,cx,cy);pointer('pointercancel',101,cx,cy);const cancelled=view();pointer('pointermove',101,cx+40,cy);pointer('pointerup',101,cx+40,cy);
   check(prefix+'pointercancel stays cancelled',cancelled.pointers===0&&same(cancelled,view()));
   pointer('pointerdown',101,cx,cy);click('[data-pause-toggle]');await delay();const held=view(),pausedTick=session()?.simulationTick;
   pointer('pointermove',101,cx+40,cy);pointer('pointerup',101,cx+40,cy);check(prefix+'pause cancels held touch',same(held,view())&&view().pointers===0);
   drag(rect.width*.1);check(prefix+'paused thumb rotates without simulation progress',view().angle!==held.angle&&session()?.simulationTick===pausedTick&&session()?.simulationPaused===true);click('[data-pause-toggle]');
   click('[data-camera-command="reset"]');check(prefix+'Fit restores angle and zoom',view().angle===0&&view().zoom===1);
   check(prefix+'camera gestures never change command ledger',session()?.commandRevision===revision,{before:revision,after:session()?.commandRevision});
   check(prefix+'one world and valid progress',host.querySelectorAll('canvas').length===1&&validateSaveV5(read()).ok&&read().world.habitats.length===5&&read().animals.length===14);
   await burstAudit(kind);check(prefix+'all camera gestures leave object tap counter untouched',metrics().taps===0);
   cases.push({kind,start,rotated,panBefore,panned,pinched,revision,final:view()});dump('RUNNING');
  }
  click('[data-zoo-destination="zoo"]');if(session()?.simulationPaused===false)click('[data-pause-toggle]');await delay();const taps=metrics().taps;
  await selectHome('giraffe-plains','touch');check('a deliberate short touch still opens the actual tapped habitat',root.dataset.zooScope==='giraffe-plains'&&metrics().taps>taps);click('[data-zoo-destination="zoo"]');if(!button('[data-camera-command="reset"]').matches(':disabled'))click('[data-camera-command="reset"]');
  check('no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);check('no application errors',errors.length===0);dump('PASS');
 }catch(error){dump('FAIL',error);}
 finally{host.removeEventListener('camera-view-change',onView);if(session()?.simulationPaused===false&&button('[data-pause-toggle]')?.checkVisibility())click('[data-pause-toggle]');}
}
