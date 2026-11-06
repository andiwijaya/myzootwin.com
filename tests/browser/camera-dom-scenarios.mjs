/** Explicitly injected DOM integration checks, never native/physical touch evidence. */
export function runCameraDomScenarios(root,inspect,setPaused,world={width:12,height:10,originX:6,originZ:5}) {
  const canvas=root.querySelector('canvas'),host=root.querySelector('[data-preview-stage]');
  const cases=[];const b=canvas.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
  const check=(ok,label)=>{if(!ok)throw Error(label);};
  const same=(a,b)=>Math.abs(a.cameraZoom-b.cameraZoom)<1e-8&&Math.abs(a.cameraPanX-b.cameraPanX)<1e-8&&Math.abs(a.cameraPanZ-b.cameraPanZ)<1e-8;
  const button=command=>root.querySelector(`[data-camera-command="${command}"]`);
  const reset=()=>button('reset').click();
  const pointer=(type,id,x=cx,y=cy,target=canvas)=>target.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y,bubbles:true,cancelable:true}));
  const wheel=(delta,target=canvas,mode=0)=>{const e=new WheelEvent('wheel',{deltaY:delta,deltaMode:mode,clientX:cx,clientY:cy,bubbles:true,cancelable:true});target.dispatchEvent(e);return e.defaultPrevented;};
  const key=(value,mod={})=>{const e=new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...mod});host.dispatchEvent(e);return e.defaultPrevented;};
  const run=(id,fn)=>{fn();const s=inspect();check(s.cameraZoom>=1&&s.cameraZoom<=3&&s.cameraFocusX>-world.originX&&s.cameraFocusX<world.width-world.originX&&s.cameraFocusZ>-world.originZ&&s.cameraFocusZ<world.height-world.originZ,id+' bounds');cases.push({id,status:'PASS',session:s});};
  try {
    run('tap-threshold',()=>{reset();button('zoom-in').click();const before=inspect();pointer('pointerdown',101);pointer('pointermove',101,cx+3,cy+1);pointer('pointerup',101,cx+3,cy+1);check(same(before,inspect()),'small tap moved camera');});
    run('one-finger-drag',()=>{const before=inspect();pointer('pointerdown',102);pointer('pointermove',102,cx+35,cy+15);pointer('pointerup',102,cx+35,cy+15);check(!same(before,inspect())&&inspect().cameraPointers===0,'drag failed');});
    run('two-finger-pinch',()=>{reset();pointer('pointerdown',103,cx-35,cy);pointer('pointerdown',104,cx+35,cy);pointer('pointermove',103,cx-70,cy);pointer('pointermove',104,cx+70,cy);check(inspect().cameraZoom>1.9&&inspect().cameraPinching,'pinch did not zoom');pointer('pointerup',104,cx+70,cy);const before=inspect();pointer('pointermove',103,cx-70,cy);check(same(before,inspect()),'pinch lift jumped');pointer('pointerup',103,cx-70,cy);});
    for(const reason of ['pointercancel','lostpointercapture'])run(reason,()=>{pointer('pointerdown',105);pointer('pointermove',105,cx+30,cy);pointer(reason,105,cx+30,cy);const before=inspect();pointer('pointermove',105,cx+100,cy);pointer('pointerup',105,cx+100,cy);check(same(before,inspect())&&inspect().cameraPointers===0,reason+' late event moved view');});
    run('wheel-clamps-and-page-isolation',()=>{const scroll=window.scrollY;reset();for(let i=0;i<10;i++)check(wheel(-999),'wheel did not cancel default');check(inspect().cameraZoom===3,'zoom maximum missing');for(let i=0;i<10;i++)wheel(999);check(inspect().cameraZoom===1,'zoom minimum missing');wheel(-2,canvas,1);wheel(-1,canvas,2);check(window.scrollY===scroll,'injected wheel changed page scroll');});
    run('toolbar-isolation',()=>{const before=inspect();check(!wheel(-100,button('zoom-in')),'toolbar consumed canvas wheel');pointer('pointerdown',106,cx,cy,button('zoom-in'));pointer('pointermove',106,cx+80,cy,button('zoom-in'));pointer('pointerup',106,cx+80,cy,button('zoom-in'));check(same(before,inspect())&&inspect().cameraPointers===0,'toolbar moved world');});
    run('keyboard-and-escape',()=>{key('Home');check(inspect().cameraZoom===1,'Home failed');key('=');const before=inspect();key('ArrowRight');check(!same(before,inspect()),'arrow pan failed');const stable=inspect();check(!key('=',{ctrlKey:true}),'browser shortcut intercepted');check(same(stable,inspect()),'modifier shortcut changed view');pointer('pointerdown',107);key('Escape');check(inspect().cameraPointers===0,'Escape did not release gesture');});
    run('pause-interrupts-gesture',()=>{pointer('pointerdown',108);pointer('pointermove',108,cx+20,cy);setPaused(true);const before=inspect();pointer('pointermove',108,cx+100,cy);pointer('pointerup',108,cx+100,cy);check(same(before,inspect())&&inspect().cameraPointers===0&&!inspect().cameraInputEnabled,'paused input mutated view');setPaused(false);});
    reset();return {status:'PASS',method:'injected PointerEvent/WheelEvent/KeyboardEvent through local labelled harness',physicalTouch:false,cases};
  }catch(error){return {status:'FAIL',method:'injected DOM events',physicalTouch:false,cases,error:String(error)};}
  finally{setPaused(false);for(const id of [101,102,103,104,105,106,107,108])pointer('pointercancel',id);reset();}
}

export function beginInjectedCameraGesture(root) {
  const canvas=root.querySelector('canvas');if(!canvas)throw Error('Open native preview first');
  root.querySelector('[data-camera-command="zoom-in"]').click();
  const b=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:777,pointerType:'touch',button:0,buttons:1,clientX:b.left+b.width/2,clientY:b.top+b.height/2,bubbles:true,cancelable:true}));
}
