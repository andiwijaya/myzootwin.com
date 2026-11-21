import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { createCameraNavigation } from '../src/game/render3d/camera-navigation.ts';
import { createCameraGestures } from '../src/game/render3d/camera-gestures.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {raycastScene} from '../src/game/render3d/scene-picking.ts';
import {createPlacementPreview} from '../src/game/render3d/placement-preview.ts';
import { mountCameraControls } from '../src/game/render3d/camera-controls.ts';
const frame={width:500,height:350,halfWidth:10,halfHeight:7,rightX:.75,rightZ:-.66,upX:-.35,upZ:-.4,originX:-1,originZ:-1.2,mapWidth:12,mapHeight:10};
const make=()=>{const n=createCameraNavigation();n.configure(frame);return n;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('toolbar pan follows native drag coordinates and stays bounded after repeated commands',()=>{
 for(const [command,dx,dy]of [['pan-left',40,0],['pan-right',-40,0],['pan-up',0,40],['pan-down',0,-40]]){
  const n=make(),drag=make();n.zoomBy(2);drag.zoomBy(2);n.command(command);drag.panPixels(dx,dy);assert.deepEqual(n.inspect(),drag.inspect());
  for(let i=0;i<200;i++)n.command(command);const s=n.inspect();assert.ok(s.x>=s.minX&&s.x<=s.maxX&&s.z>=s.minZ&&s.z<=s.maxZ);
  n.command('reset');n.command(command);close(n.inspect().x,0);close(n.inspect().z,0);
 }
});
test('camera overview, zoom and adversarial panning keep the ground focus inside actual map at every aspect',()=>{
  const n=make();n.panPixels(9999,-9999);assert.equal(n.inspect().x,0);assert.equal(n.inspect().z,0);
  let seed=2317;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(const [width,height] of [[1366,768],[360,780],[780,360],[1920,1080]]) {
    n.configure({...frame,width,height});
    for(let i=0;i<500;i++){
      n.zoomBy(Math.exp((random()-.5)*5),random()*2-1,random()*2-1);n.panPixels((random()-.5)*100000,(random()-.5)*100000);const s=n.inspect();
      assert.ok(s.zoom>=1&&s.zoom<=3);assert.ok(s.x>=s.minX&&s.x<=s.maxX&&s.z>=s.minZ&&s.z<=s.maxZ);
      assert.ok(Math.abs(s.focusX)<6 && Math.abs(s.focusZ)<5);
    }
  }
  n.command('reset');assert.equal(n.inspect().zoom,1);assert.equal(n.inspect().x,0);assert.equal(n.inspect().z,0);
});
test('anchored zoom keeps the pointed ground position stable away from clamps; bad data does not poison navigation',()=>{
  const n=make();n.zoomBy(1.5);const before=n.inspect();const a=.1,b=-.1;
  const projected=s=>[frame.rightX*s.x+frame.rightZ*s.z+a*frame.halfWidth/s.zoom,frame.upX*s.x+frame.upZ*s.z+b*frame.halfHeight/s.zoom];
  n.zoomBy(1.25,a,b);projected(before).forEach((v,i)=>close(v,projected(n.inspect())[i]));
  const stable=n.inspect();n.panPixels(NaN,2);n.zoomBy(Infinity);n.zoomBy(-2);n.zoomBy(2,NaN,0);assert.deepEqual(n.inspect(),stable);
  for(const bad of [{...frame,width:0},{...frame,mapWidth:1},{...frame,originX:99},{...frame,upX:0,upZ:0}])assert.throws(()=>n.configure(bad),RangeError);
  assert.deepEqual(n.inspect(),stable);
});
test('tap/drag threshold, pinch, third finger and lifting a pinch never create false taps or jumps',()=>{
  const n=make(),taps=[],g=createCameraGestures(n,()=>({left:0,top:0,width:500,height:350}),p=>taps.push(p));
  n.zoomBy(2);g.down({id:1,x:100,y:100});g.move({id:1,x:103,y:102});g.up({id:1,x:103,y:102});assert.equal(taps.length,1);assert.equal(n.inspect().x,0);
  g.down({id:2,x:100,y:100});g.move({id:2,x:120,y:100});g.up({id:2,x:120,y:100});assert.equal(taps.length,1);assert.notEqual(n.inspect().x,0);
  n.command('reset');g.down({id:3,x:200,y:175});g.down({id:4,x:300,y:175});assert.equal(g.down({id:5,x:250,y:175}),false);
  g.move({id:3,x:150,y:175});g.move({id:4,x:350,y:175});assert.ok(n.inspect().zoom>1.9);g.up({id:4,x:350,y:175});const before=n.inspect();g.move({id:3,x:150,y:175});assert.deepEqual(n.inspect(),before);g.up({id:3,x:150,y:175});assert.equal(taps.length,1);assert.equal(g.inspect().pointers,0);
});
test('pointer cancellation and reset invalidate all late moves/ups and never deliver a pick',()=>{
  const n=make(),g=createCameraGestures(n,()=>({left:0,top:0,width:500,height:350}),()=>assert.fail('cancelled tap'));
  n.zoomBy(2);g.down({id:7,x:200,y:200});g.cancel(7);const before=n.inspect();g.move({id:7,x:400,y:400});g.up({id:7,x:400,y:400});assert.deepEqual(n.inspect(),before);
  g.down({id:8,x:200,y:200});g.down({id:9,x:300,y:200});g.cancelAll();g.up({id:8,x:200,y:200});assert.equal(g.inspect().pointers,0);assert.equal(g.down({id:NaN,x:0,y:0}),false);
});
class Element extends EventTarget {
  style={};dataset={};captured=new Set();box={left:0,top:0,width:500,height:350};
  getBoundingClientRect(){return this.box;}focus(){}setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);}
}
function fire(target,type,data={}){const e=new Event(type,{cancelable:true});Object.assign(e,data);target.dispatchEvent(e);return e;}
function setup(onTap,onCancel){const previous=globalThis.window;globalThis.window=new EventTarget();const host=new Element(),canvas=new Element(),camera=new OrthographicCamera(),bounds=new Box3(new Vector3(-6,-.4,-5),new Vector3(6,2.4,5));const c=mountCameraControls(host,canvas,camera,bounds,{width:12,height:10},onTap,onCancel);c.resize(500,350);return {host,canvas,camera,c,finish(){c.dispose();globalThis.window=previous;}};}
test('real input adapter isolates canvas wheel/keys and releases capture on cancel, pause, resize, blur and disposal',()=>{
 const s=setup();try{
  const {host,canvas,c}=s;
  assert.equal(fire(canvas,'wheel',{deltaY:-100,deltaMode:0,clientX:250,clientY:175}).defaultPrevented,true);assert.ok(c.inspect().cameraZoom>1);
  const before=c.inspect().cameraZoom;fire(host,'wheel',{deltaY:-100,deltaMode:0,clientX:250,clientY:175});assert.equal(c.inspect().cameraZoom,before);
  assert.equal(fire(host,'keydown',{key:'=',ctrlKey:true}).defaultPrevented,false);assert.equal(c.inspect().cameraZoom,before);
  assert.equal(fire(host,'keydown',{key:'ArrowRight'}).defaultPrevented,true);assert.notEqual(c.inspect().cameraPanX,0);
  for(const reason of ['pointercancel','lostpointercapture','pause','resize','blur']){
    fire(canvas,'pointerdown',{pointerId:12,button:0,clientX:200,clientY:160});assert.equal(c.inspect().cameraPointers,1);
    if(reason==='pause'){c.setEnabled(false);c.setEnabled(true);}else if(reason==='resize')c.resize(350,500);else if(reason==='blur')window.dispatchEvent(new Event('blur'));else fire(canvas,reason,{pointerId:12});
    assert.equal(c.inspect().cameraPointers,0);assert.equal(canvas.captured.size,0);
  }
  fire(host,'keydown',{key:'Home'});assert.equal(c.inspect().cameraZoom,1);
  c.dispose();c.dispose();fire(canvas,'wheel',{deltaY:-100,deltaMode:0,clientX:250,clientY:175});fire(host,'keydown',{key:'='});assert.equal(c.inspect().cameraZoom,1);assert.equal(c.inspect().cameraControlsDisposed,true);assert.equal(host.dataset.cameraZoom,undefined);
 }finally{s.finish();}
});
test('actual orthographic view-center ray stays on the ground map at zoom/pan bounds and after orientation changes',()=>{
 const s=setup();try{
  for(const [width,height] of [[504,350],[270,250],[285,250],[496,350]]){
    s.c.resize(width,height);s.c.command('zoom-in');s.c.command('zoom-in');s.c.command('zoom-in');s.c.command('zoom-in');s.c.command('zoom-in');
    for(const key of ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'])for(let i=0;i<30;i++){
      fire(s.host,'keydown',{key,shiftKey:true});
      const ray=new Raycaster();ray.setFromCamera(new Vector2(0,0),s.camera);const p=ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());
      assert.ok(p&&Math.abs(p.x)<6&&Math.abs(p.z)<5,JSON.stringify(p));
    }
  }
 }finally{s.finish();}
});

test('keyboard center inspection/cancel callbacks work without repeats,modifiers or disposed input',()=>{
 const taps=[];let cancelled=0;const s=setup(p=>taps.push(p),()=>cancelled++);
 try{assert.equal(fire(s.host,'keydown',{key:'Enter'}).defaultPrevented,true);assert.deepEqual(taps,[{id:0,x:250,y:175}]);fire(s.host,'keydown',{key:' ',repeat:true});assert.equal(taps.length,1);fire(s.host,'keydown',{key:' '});assert.equal(taps.length,2);fire(s.host,'keydown',{key:'Escape'});assert.equal(cancelled,1);fire(s.host,'keydown',{key:'Enter',ctrlKey:true});assert.equal(taps.length,2);s.c.dispose();fire(s.host,'keydown',{key:'Enter'});assert.equal(taps.length,2);}finally{s.finish();}
});


test('eight camera azimuths fit every world corner at overview for desktop, portrait and landscape; full reset restores the original view',()=>{
 const s=setup();try{
  const bounds=new Box3(new Vector3(-6,-.4,-5),new Vector3(6,2.4,5));
  for(const [width,height]of [[1366,768],[360,780],[780,360]]){
   s.c.command('reset');s.c.resize(width,height);const original=s.camera.position.clone();
   for(let turn=0;turn<8;turn++){
    assert.equal(s.c.inspect().cameraAzimuth,turn*45);assert.equal(s.host.dataset.cameraAzimuth,String(turn*45));
    for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){
     const p=new Vector3(x,y,z).project(s.camera);assert.ok(Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&Math.abs(p.z)<=1,JSON.stringify({turn,width,height,p}));
    }
    s.c.command('rotate-right');
   }
   assert.equal(s.c.inspect().cameraAzimuth,0);assert.ok(s.camera.position.distanceTo(original)<1e-8);
   s.c.command('rotate-left');s.c.command('zoom-in');fire(s.host,'keydown',{key:'ArrowUp'});s.c.command('reset');
   assert.equal(s.c.inspect().cameraAzimuth,0);assert.equal(s.c.inspect().cameraZoom,1);assert.equal(s.c.inspect().cameraPanX,0);assert.equal(s.c.inspect().cameraPanZ,0);assert.ok(s.camera.position.distanceTo(original)<1e-8);
  }
 }finally{s.finish();}
});

test('rotating preserves the focused ground point at zoom and world pan directions/bounds remain correct at every angle',()=>{
 const s=setup();try{
  s.c.focus({x:0,z:0});const focus=s.c.inspect();
  for(let i=0;i<8;i++){s.c.command('rotate-right');close(s.c.inspect().cameraFocusX,focus.cameraFocusX);close(s.c.inspect().cameraFocusZ,focus.cameraFocusZ);}
  for(let turn=0;turn<8;turn++){
   s.c.command('zoom-in');
   for(const key of ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'])for(let i=0;i<20;i++){
    fire(s.host,'keydown',{key,shiftKey:true});const ray=new Raycaster();ray.setFromCamera(new Vector2(0,0),s.camera);const p=ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());assert.ok(p&&Math.abs(p.x)<6&&Math.abs(p.z)<5);
   }
   s.c.resize(350,500);const angle=s.c.inspect().cameraAzimuth;s.c.resize(500,350);assert.equal(s.c.inspect().cameraAzimuth,angle);s.c.command('rotate-right');
  }
 }finally{s.finish();}
});

test('rotation cancels held mouse/touch gestures, never selects, and keyboard Q/E respect repeat, modifiers, paused and disposed ownership',()=>{
 const s=setup(()=>assert.fail('camera control must not pick'));try{
  fire(s.canvas,'pointerdown',{pointerId:1,button:0,clientX:200,clientY:150});s.c.command('rotate-left');assert.equal(s.c.inspect().cameraPointers,0);assert.equal(s.canvas.captured.size,0);fire(s.canvas,'pointerup',{pointerId:1,clientX:200,clientY:150});assert.equal(s.c.inspect().cameraAzimuth,315);
  fire(s.host,'keydown',{key:'e',repeat:true});fire(s.host,'keydown',{key:'q',ctrlKey:true});assert.equal(s.c.inspect().cameraAzimuth,315);
  fire(s.host,'keydown',{key:'E'});assert.equal(s.c.inspect().cameraAzimuth,0);fire(s.host,'keydown',{key:'q'});fire(s.host,'keydown',{key:'Home'});assert.equal(s.c.inspect().cameraAzimuth,0);
  s.c.setEnabled(false);s.c.command('rotate-right');fire(s.host,'keydown',{key:'e'});assert.equal(s.c.inspect().cameraAzimuth,0);s.c.setEnabled(true);s.c.command('rotate-right');s.c.dispose();s.c.command('reset');fire(s.host,'keydown',{key:'q'});assert.equal(s.c.inspect().cameraAzimuth,45);assert.equal(s.host.dataset.cameraAzimuth,undefined);
 }finally{s.finish();}
});

test('actual raycast and habitat ghost identify the same world tile after orbit, zoom, pan and resize; rotation/cancel never changes world state',()=>{
 const previous=globalThis.window;globalThis.window=new EventTarget();const state=createInitialState(),before=JSON.stringify(state),world=createTropicalDiorama(state.world),host=new Element(),canvas=new Element(),camera=new OrthographicCamera(),controls=mountCameraControls(host,canvas,camera,world.bounds,{width:12,height:10});let rect={left:0,top:0,width:500,height:350};
 const preview=createPlacementPreview(()=>state.world,world.catalog,camera,()=>rect,()=>{});
 try{
  for(const [width,height]of [[500,350],[270,250],[496,250]])for(const zoomed of[false,true]){
   rect={left:0,top:0,width,height};canvas.box=rect;controls.resize(width,height);controls.command('reset');if(zoomed){controls.focus({x:-.5,z:.5});controls.command('zoom-in');}
   for(let turn=0;turn<8;turn++){
    const p=new Vector3(-.5,.022,.5).project(camera),point={x:(p.x+1)*width/2,y:(1-p.y)*height/2};
    assert.equal(raycastScene(world.catalog,camera,point,rect)?.id,'tile-5-5');preview.command('begin');preview.pick(point);assert.equal(preview.inspect().placementValid,true);assert.equal(preview.inspect().placementGhostVisible,true);
    const ghost=preview.group.children[0].position.clone();controls.command('rotate-right');assert.ok(preview.group.children[0].position.equals(ghost));preview.command('cancel');assert.equal(preview.inspect().placementGhostVisible,false);assert.equal(JSON.stringify(state),before);
   }
  }
 }finally{preview.dispose();controls.dispose();for(const g of[...world.geometries,...preview.geometries])g.dispose();for(const m of[...world.materials,...preview.materials])m.dispose();globalThis.window=previous;}
});

test('navigation-only contract ignores orbit commands and invalid camera angles cannot poison matrices',()=>{const n=make(),before=n.inspect();n.command('rotate-left');n.command('rotate-right');assert.deepEqual(n.inspect(),before);const camera=new OrthographicCamera(),bounds=new Box3(new Vector3(-6,0,-5),new Vector3(6,2,5));fitIsometricCamera(camera,bounds,1);const matrix=camera.matrixWorld.clone();assert.throws(()=>fitIsometricCamera(camera,bounds,1,NaN),RangeError);assert.ok(camera.matrixWorld.equals(matrix));});

test('touch and desktop left drag rotate while Shift at mouse-down selects pan',()=>{
 const s=setup(()=>assert.fail('drag must never tap'));try{
  assert.equal(s.host.dataset.cameraDragMode,'rotate');assert.equal(s.c.inspect().cameraRotateDrag,true);
  fire(s.canvas,'pointerdown',{pointerId:1,button:0,pointerType:'touch',clientX:200,clientY:150});
  fire(s.canvas,'pointermove',{pointerId:1,pointerType:'touch',clientX:237,clientY:154});const turn=s.c.inspect();close(turn.cameraAzimuth,346.68);close(turn.cameraTilt,4/350*90);assert.equal(turn.cameraPointers,1);assert.equal(turn.cameraZoom,1);
  for(const x of[-6,6])for(const y of[-.4,2.4])for(const z of[-5,5]){const p=new Vector3(x,y,z).project(s.camera);assert.ok(Math.abs(p.x)<.92&&Math.abs(p.y)<.92);}
  fire(s.canvas,'pointerup',{pointerId:1,pointerType:'touch',clientX:237,clientY:154});assert.equal(s.c.inspect().cameraPointers,0);
  s.c.command('zoom-in');
  const before=s.c.inspect();
  const mouse=(id,x,y,shiftKey)=>({pointerId:id,button:0,buttons:1,pointerType:'mouse',clientX:x,clientY:y,shiftKey});
  fire(s.canvas,'pointerdown',mouse(2,200,150,false));fire(s.canvas,'pointermove',mouse(2,250,180,true));fire(s.canvas,'pointerup',mouse(2,250,180,true));
  const rotated=s.c.inspect();assert.notEqual(rotated.cameraAzimuth,before.cameraAzimuth);assert.notEqual(rotated.cameraTilt,before.cameraTilt);
  close(rotated.cameraFocusX,before.cameraFocusX);close(rotated.cameraFocusZ,before.cameraFocusZ);
  fire(s.canvas,'pointerdown',mouse(3,200,150,true));fire(s.canvas,'pointermove',mouse(3,250,180,false));fire(s.canvas,'pointerup',mouse(3,250,180,false));
  const panned=s.c.inspect();close(panned.cameraAzimuth,rotated.cameraAzimuth);close(panned.cameraTilt,rotated.cameraTilt);assert.ok(Math.hypot(panned.cameraPanX-rotated.cameraPanX,panned.cameraPanZ-rotated.cameraPanZ)>0);
  s.c.command('reset');assert.equal(s.c.inspect().cameraAzimuth,0);assert.equal(s.c.inspect().cameraTilt,0);assert.equal(s.c.inspect().cameraZoom,1);
 }finally{s.finish();}
});

test('two-finger pan and pinch never rotate, including a tilted pair, angle seam and collapsed pair',()=>{
 const turns=[],target={panPixels(){},zoomBy(){},rotateBy:d=>turns.push(d)},g=createCameraGestures(target,()=>({left:0,top:0,width:500,height:350}),()=>assert.fail('multitouch tap'));
 const p=angle=>({id:2,x:200+100*Math.cos(angle*Math.PI/180),y:150+100*Math.sin(angle*Math.PI/180)});
 g.down({id:1,x:200,y:150,pointerType:'touch'});g.down({...p(179),pointerType:'touch'});g.move(p(-178));g.move(p(-175));g.move(p(-172));
 g.move({id:2,x:201,y:150});g.move({id:2,x:199,y:150});assert.deepEqual(turns,[]);g.cancelAll();assert.equal(g.inspect().pointers,0);
});

test('two touch pointers pan and pinch without rotation in either mouse mode; lifting cannot select',()=>{
 for(const mode of['drag-pan','drag-rotate']){const s=setup(()=>assert.fail('multitouch must not select'));try{
  s.c.command(mode);const touch=(id,x,y)=>({pointerId:id,button:0,pointerType:'touch',clientX:x,clientY:y});
  fire(s.canvas,'pointerdown',touch(1,180,175));fire(s.canvas,'pointerdown',touch(2,320,175));fire(s.canvas,'pointermove',touch(1,160,140));fire(s.canvas,'pointermove',touch(2,350,215));
  const v=s.c.inspect();assert.ok(v.cameraZoom>1.4);assert.equal(v.cameraAzimuth,0);assert.equal(v.cameraTilt,0);assert.ok(Math.hypot(v.cameraPanX,v.cameraPanZ)>0);assert.equal(v.cameraPinching,true);
  fire(s.canvas,'pointerup',touch(2,350,215));const before=s.c.inspect();fire(s.canvas,'pointermove',touch(1,160,140));assert.deepEqual(s.c.inspect(),before);fire(s.canvas,'pointerup',touch(1,160,140));assert.equal(s.c.inspect().cameraPointers,0);assert.equal(s.canvas.captured.size,0);
 }finally{s.finish();}}
});

test('thumb mode changes, pause, resize, blur, habitat focus and disposal release capture and invalidate late touches',()=>{
 for(const reason of['mode','pause','resize','blur','focus','pointercancel','lostpointercapture','dispose']){const s=setup(()=>assert.fail('cancelled touch must not select'));try{
  s.c.command('drag-rotate');fire(s.canvas,'pointerdown',{pointerId:1,button:0,pointerType:'touch',clientX:200,clientY:150});
  if(reason==='mode')s.c.command('drag-pan');else if(reason==='pause'){s.c.setEnabled(false);s.c.command('drag-pan');assert.equal(s.c.inspect().cameraRotateDrag,true);s.c.setEnabled(true);}else if(reason==='resize')s.c.resize(350,500);else if(reason==='blur')window.dispatchEvent(new Event('blur'));else if(reason==='focus')s.c.focusArea({x:-1,z:-1,width:2,depth:2});else if(reason==='dispose')s.c.dispose();else fire(s.canvas,reason,{pointerId:1});
  const before=s.c.inspect();fire(s.canvas,'pointermove',{pointerId:1,pointerType:'touch',clientX:300,clientY:150});fire(s.canvas,'pointerup',{pointerId:1,pointerType:'touch',clientX:300,clientY:150});assert.deepEqual(s.c.inspect(),before);assert.equal(before.cameraPointers,0);assert.equal(s.canvas.captured.size,0);
 }finally{s.finish();}}
});

test('habitat exit restores the zoo rotation, tilt, zoom and focus',()=>{
 const s=setup();try{
  s.c.command('zoom-in');fire(s.canvas,'pointerdown',{pointerId:1,button:0,pointerType:'touch',clientX:200,clientY:150});fire(s.canvas,'pointerup',{pointerId:1,pointerType:'touch',clientX:273,clientY:192});const before=s.c.inspect();
  s.c.setHabitatView({bounds:new Box3(new Vector3(-2,0,-2),new Vector3(2,3,2)),area:{x:-2,z:-2,width:4,depth:4}});assert.equal(s.c.inspect().cameraAzimuth,0);assert.equal(s.c.inspect().cameraTilt,0);assert.equal(s.c.inspect().cameraRotateDrag,true);
  fire(s.canvas,'pointerdown',{pointerId:2,button:0,pointerType:'touch',clientX:200,clientY:150});fire(s.canvas,'pointerup',{pointerId:2,pointerType:'touch',clientX:150,clientY:118});s.c.setHabitatView(null);
  for(const key of ['cameraAzimuth','cameraTilt','cameraZoom','cameraFocusX','cameraFocusZ'])close(s.c.inspect()[key],before[key]);
  assert.equal(s.c.inspect().cameraRotateDrag,true);
 }finally{s.finish();}
});

test('vertical drags tilt the real zoomed habitat camera with mouse or touch and stop above the ground',()=>{
 const s=setup(()=>assert.fail('orbit must not select'));try{
  window.innerWidth=1366;
  const bounds=new Box3(new Vector3(-2,0,-2),new Vector3(2,3,2));
  s.c.setHabitatView({bounds,area:{x:-2,z:-2,width:4,depth:4}});
  for(const pointerType of ['mouse','touch']){
   s.c.command('reset');
   const point=(clientX,clientY,shiftKey=false)=>({pointerId:1,button:0,buttons:1,pointerType,clientX,clientY,shiftKey});
   const drag=(dx,dy,shiftKey=false)=>{
    fire(s.canvas,'pointerdown',point(200,150,shiftKey));
    fire(s.canvas,'pointermove',point(200+dx,150+dy,shiftKey));
    fire(s.canvas,'pointerup',point(200+dx,150+dy,shiftKey));
   };
   const base=s.camera.quaternion.clone();
   drag(0,80);
   close(s.c.inspect().cameraTilt,80/350*90);
   assert.equal(s.c.inspect().cameraAzimuth,0);
   assert.ok(base.angleTo(s.camera.quaternion)>.2);
   for(const x of [-2,2])for(const y of [0,3])for(const z of [-2,2]){
    const p=new Vector3(x,y,z).project(s.camera);
    assert.ok(Math.abs(p.x)<.93&&Math.abs(p.y)<.93);
   }
   drag(40,0);
   close(s.c.inspect().cameraAzimuth,345.6);
   close(s.c.inspect().cameraTilt,80/350*90);
   drag(0,700);
   assert.equal(s.c.inspect().cameraTilt,35);
   drag(0,-700);
   assert.equal(s.c.inspect().cameraTilt,-10);
   const direction=s.camera.getWorldDirection(new Vector3());
   assert.ok(direction.y<-.3);
   s.c.command('zoom-in');
   const before=s.c.inspect();
   drag(20,45,pointerType==='mouse');
   const after=s.c.inspect();
   if(pointerType==='mouse'){
    assert.equal(after.cameraTilt,before.cameraTilt);
    assert.equal(after.cameraAzimuth,before.cameraAzimuth);
    assert.ok(Math.hypot(after.cameraPanX-before.cameraPanX,after.cameraPanZ-before.cameraPanZ)>.01);
   }else{
    assert.ok(after.cameraTilt>before.cameraTilt);
    assert.notEqual(after.cameraAzimuth,before.cameraAzimuth);
   }
   assert.equal(s.host.dataset.cameraTilt,String(after.cameraTilt));
  }
 }finally{s.finish();}
});

test('unmodified drags rotate the whole zoo across phone, landscape, and desktop layouts',()=>{
 const s=setup(()=>assert.fail('drag must not select'));try{
  s.c.command('zoom-in');
  for(const width of[360,780,1366,360]){
   window.innerWidth=width;s.c.resize(width,350);const before=s.c.inspect();
   fire(s.canvas,'pointerdown',{pointerId:1,button:0,pointerType:'mouse',clientX:200,clientY:150});fire(s.canvas,'pointermove',{pointerId:1,pointerType:'mouse',buttons:1,clientX:236,clientY:160});fire(s.canvas,'pointerup',{pointerId:1,pointerType:'mouse',clientX:236,clientY:160});
   const after=s.c.inspect();assert.equal(after.cameraRotateDrag,true);assert.equal(s.host.dataset.cameraDragMode,'rotate');
   assert.notEqual(after.cameraAzimuth,before.cameraAzimuth);
   assert.equal(after.cameraPointers,0);assert.equal(s.canvas.captured.size,0);
  }
 }finally{s.finish();}
});

test('a small touch remains one tap, but a thumb drag followed by two-finger pan and one-finger rotation never taps',()=>{
 let taps=0;const s=setup(()=>taps++);try{
  const touch=(id,x,y)=>({pointerId:id,button:0,pointerType:'touch',clientX:x,clientY:y});
  fire(s.canvas,'pointerdown',touch(1,200,150));fire(s.canvas,'pointerup',touch(1,203,151));assert.equal(taps,1);assert.equal(s.c.inspect().cameraAzimuth,0);
  fire(s.canvas,'pointerdown',touch(1,180,150));fire(s.canvas,'pointermove',touch(1,200,150));const rotated=s.c.inspect().cameraAzimuth;
  fire(s.canvas,'pointerdown',touch(2,320,150));fire(s.canvas,'pointermove',touch(1,175,155));fire(s.canvas,'pointermove',touch(2,345,175));assert.equal(s.c.inspect().cameraAzimuth,rotated);assert.ok(s.c.inspect().cameraZoom>1);
  fire(s.canvas,'pointerup',touch(2,345,175));const lifted=s.c.inspect();fire(s.canvas,'pointermove',touch(1,175,155));assert.deepEqual(s.c.inspect(),lifted);fire(s.canvas,'pointermove',touch(1,195,155));assert.notEqual(s.c.inspect().cameraAzimuth,rotated);fire(s.canvas,'pointerup',touch(1,195,155));assert.equal(taps,1);assert.equal(s.c.inspect().cameraPointers,0);
 }finally{s.finish();}
});
