import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';

type Context={root:HTMLElement;host:HTMLElement;read:()=>ZooSave;session:()=>Record<string,number|boolean>|undefined;errors:string[]};

/** QA-only PointerEvents exercise the production canvas adapter, never an owner database. */
export async function runMobileGestureAudit({root,host,read,session,errors}:Context){
 const output=document.createElement('pre');output.id='qa-mobile-gesture-result';output.dataset.status='RUNNING';document.querySelector('#qa-actions')!.append(output);
 const checks:{name:string;passed:boolean;detail?:unknown}[]=[],cases:unknown[]=[];
 const delay=(ms=80)=>new Promise<void>(r=>setTimeout(r,ms));
 const wait=async(test:()=>boolean,label:string)=>{const until=performance.now()+45000;while(!test()){if(performance.now()>until)throw Error('Timeout '+label);await delay();}};
 const button=(selector:string)=>root.querySelector<HTMLButtonElement>(selector)!;
 const click=(selector:string)=>{const b=button(selector);if(!b?.checkVisibility()||b.matches(':disabled'))throw Error('Unavailable '+selector);b.click();};
 const check=(name:string,passed:boolean,detail?:unknown)=>{checks.push({name,passed,detail});if(!passed)throw Error(name+' '+JSON.stringify(detail));};
 const view=()=>({angle:Number(host.dataset.cameraAzimuth),zoom:Number(host.dataset.cameraZoom),x:Number(host.dataset.cameraPanX),z:Number(host.dataset.cameraPanZ),mode:host.dataset.cameraDragMode,pointers:session()?.cameraPointers});
 const pointer=(type:string,id:number,x:number,y:number)=>host.querySelector('canvas')!.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:id===101,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX:x,clientY:y}));
 const drag=(dx:number,dy=0,id=101)=>{const b=host.getBoundingClientRect(),x=b.left+b.width*.42,y=b.top+b.height*.5;pointer('pointerdown',id,x,y);pointer('pointermove',id,x+dx,y+dy);pointer('pointerup',id,x+dx,y+dy);};
 const same=(a:ReturnType<typeof view>,b:ReturnType<typeof view>)=>['angle','zoom','x','z'].every(k=>Math.abs(Number(a[k as keyof typeof a])-Number(b[k as keyof typeof b]))<1e-8);
 const dump=(status:string,error?:unknown)=>{const state=read();output.dataset.status=status;output.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,method:'Internal Chromium browser viewport; synthetic UUID V5 QA save; injected touch PointerEvents through actual product canvas and real UI controls. No physical touch or device claim.',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},checks,cases,errors,final:{view:view(),valid:state?validateSaveV5(state).ok:false,habitats:state?.world.habitats.length,animals:state?.animals.length,canvases:host.querySelectorAll('canvas').length}},null,2);};
 try{
  await wait(()=>button('[data-continue]')?.checkVisibility()&&!button('[data-continue]').matches(':disabled'),'Continue ready');click('[data-continue]');
  await wait(()=>button('[data-save-resume-button]')?.checkVisibility()||!!host.querySelector('canvas'),'resume prompt');
  if(button('[data-save-resume-button]')?.checkVisibility())click('[data-save-resume-button]');
  await wait(()=>session()?.assetsWaiting===false&&!!host.querySelector('canvas'),'assets');if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');
  await wait(()=>session()?.simulationPaused===false,'playing');await document.fonts.ready;
  const kinds=['zoo','macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands'];
  for(const kind of kinds){
   click(`[data-zoo-destination="${kind}"]`);await delay(150);host.scrollIntoView({block:'center',behavior:'instant'});await delay();
   if(!button('[data-camera-command="reset"]').matches(':disabled'))click('[data-camera-command="reset"]');
   const prefix=kind+' ',revision=session()?.commandRevision,selected=host.dataset.selectedId;
   click('[data-camera-command="drag-rotate"]');const start=view(),scroll=scrollY;
   check(prefix+'Rotate selected',start.mode==='rotate'&&button('[data-camera-command="drag-rotate"]').getAttribute('aria-pressed')==='true'&&button('[data-camera-command="drag-pan"]').getAttribute('aria-pressed')==='false');
   const rect=host.getBoundingClientRect();drag(rect.width*.137,4);const rotated=view();
   check(prefix+'one thumb rotates continuously',Math.abs(rotated.angle-start.angle)>1&&Math.abs(rotated.angle%45)>1&&rotated.zoom===start.zoom,rotated);
   check(prefix+'thumb leaves no pointer or selection',rotated.pointers===0&&host.dataset.selectedId===selected);
   check(prefix+'thumb does not scroll document',Math.abs(scrollY-scroll)<.5);
   for(const mode of['rotate','pan']){
    click(`[data-camera-command="drag-${mode}"]`);click('[data-camera-command="reset"]');
    const b=host.getBoundingClientRect(),cx=b.left+b.width*.5,cy=b.top+b.height*.5,r=Math.min(b.width,b.height)*.17;
    pointer('pointerdown',101,cx-r,cy);pointer('pointerdown',102,cx+r,cy);pointer('pointerdown',103,cx,cy);
    check(prefix+mode+' ignores third finger',session()?.cameraPointers===2);
    pointer('pointermove',101,cx-r*1.5,cy-r*.45);pointer('pointermove',102,cx+r*1.5,cy+r*.45);const combined=view();
    check(prefix+mode+' pinch plus twist',combined.zoom>1.45&&combined.angle>1&&combined.angle<359,combined);
    check(prefix+mode+' keeps pair captured logically',session()?.cameraPointers===2&&session()?.cameraPinching===true);
    pointer('pointerup',103,cx,cy);pointer('pointerup',102,cx+r*1.5,cy+r*.45);const lifted=view();pointer('pointermove',101,cx-r*1.5,cy-r*.45);
    check(prefix+mode+' lifting pinch has no jump',same(lifted,view()));pointer('pointerup',101,cx-r*1.5,cy-r*.45);
    check(prefix+mode+' releases pair without selecting',session()?.cameraPointers===0&&host.dataset.selectedId===selected);
   }
   click('[data-camera-command="drag-pan"]');click('[data-camera-command="reset"]');click('[data-camera-command="zoom-in"]');const panBefore=view();drag(rect.width*.08,rect.height*.03);const panAfter=view();
   check(prefix+'one finger Pan still moves',Math.hypot(panAfter.x-panBefore.x,panAfter.z-panBefore.z)>.001&&panAfter.angle===panBefore.angle);
   const b=host.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
   pointer('pointerdown',101,cx-25,cy);pointer('pointerdown',102,cx+25,cy);const panPair=view();pointer('pointermove',101,cx-13,cy+8);pointer('pointermove',102,cx+37,cy+8);const panPairAfter=view();
   check(prefix+'two fingers pan',Math.hypot(panPairAfter.x-panPair.x,panPairAfter.z-panPair.z)>.001,panPairAfter);pointer('pointerup',101,cx-13,cy+8);pointer('pointerup',102,cx+37,cy+8);
   pointer('pointerdown',101,cx,cy);click('[data-camera-command="drag-rotate"]');const changed=view();pointer('pointermove',101,cx+50,cy);pointer('pointerup',101,cx+50,cy);
   check(prefix+'mode switch cancels late pointer',changed.pointers===0&&same(changed,view()));
   pointer('pointerdown',101,cx,cy);pointer('pointercancel',101,cx,cy);const cancelled=view();pointer('pointermove',101,cx+50,cy);pointer('pointerup',101,cx+50,cy);
   check(prefix+'pointercancel stays cancelled',cancelled.pointers===0&&same(cancelled,view()));
   click('[data-camera-command="reset"]');drag(rect.width*.09);pointer('pointerdown',101,cx,cy);click('[data-pause-toggle]');await delay();
   const heldView=view(),pausedTick=session()?.simulationTick;pointer('pointermove',101,cx+40,cy);pointer('pointerup',101,cx+40,cy);
   check(prefix+'pause cancels the held touch',same(heldView,view())&&session()?.cameraPointers===0);drag(rect.width*.1);
   check(prefix+'paused camera stays usable without simulation progress',view().angle!==heldView.angle&&session()?.simulationTick===pausedTick&&session()?.simulationPaused===true);click('[data-pause-toggle]');
   click('[data-camera-command="reset"]');check(prefix+'Fit restores overview',view().angle===0&&view().zoom===1);
   check(prefix+'no camera command changes simulation ledger',session()?.commandRevision===revision,{before:revision,after:session()?.commandRevision});
   for(const command of['drag-pan','drag-rotate']){const r=button(`[data-camera-command="${command}"]`).getBoundingClientRect();check(prefix+command+' touch target',r.width>=44&&r.height>=44,{width:r.width,height:r.height});}
   check(prefix+'one world and valid save',host.querySelectorAll('canvas').length===1&&validateSaveV5(read()).ok&&read().world.habitats.length===5&&read().animals.length===14);
   cases.push({kind,rotated,panBefore,panAfter,revision,final:view()});dump('RUNNING');
  }
  click('[data-zoo-destination="zoo"]');click('[data-camera-command="drag-pan"]');check('no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);check('no application errors',errors.length===0);
  dump('PASS');
 }catch(error){dump('FAIL',error);}
 finally{if(session()?.simulationPaused===false&&button('[data-pause-toggle]')?.checkVisibility())click('[data-pause-toggle]');}
}
