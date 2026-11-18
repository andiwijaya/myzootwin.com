import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,OrthographicCamera,Plane,Raycaster,Vector2,Vector3} from 'three';
import {mountCameraControls} from '../src/game/render3d/camera-controls.ts';
import {createFrameLoop} from '../src/game/render3d/frame-loop.ts';

class Element extends EventTarget{
 style={};dataset={};captured=new Set();box={left:0,top:0,width:500,height:350};
 getBoundingClientRect(){return this.box;}focus(){}setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);}
}
const fire=(target,type,data={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,data);target.dispatchEvent(e);};
const touch=(id,x,y)=>({pointerId:id,button:0,buttons:1,pointerType:'touch',clientX:x,clientY:y});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(){
 const previous=globalThis.window;globalThis.window=new EventTarget();window.innerWidth=360;
 const host=new Element(),canvas=new Element(),camera=new OrthographicCamera(),pending=new Map(),taps=[];let next=0,requests=0,maximum=0,time=1000,draws=0,views=0;
 const frames={request(fn){const id=++next;pending.set(id,fn);requests++;maximum=Math.max(maximum,pending.size);return id;},cancel(id){pending.delete(id);}};
 let controls;const loop=createFrameLoop(frames,()=>{controls.flush();draws++;},()=>assert.fail('frame failed'));
 controls=mountCameraControls(host,canvas,camera,new Box3(new Vector3(-6,-.4,-5),new Vector3(6,2.4,5)),{width:12,height:10},p=>taps.push(p),undefined,{requestFrame:()=>loop.requestFrame(),now:()=>time});controls.resize(500,350);
 host.addEventListener('camera-view-change',()=>views++);
 return {host,canvas,camera,pending,controls,loop,taps,get views(){return views;},get draws(){return draws;},get requests(){return requests;},get maximum(){return maximum;},advance(ms){time+=ms;},frame(){const [id,fn]=pending.entries().next().value??[];assert.ok(fn,'No queued frame');pending.delete(id);time+=16;fn(time);},finish(){controls.dispose();loop.dispose();globalThis.window=previous;}};
}

test('a burst of 100 thumb positions uses the latest position and a single original visual frame',()=>{
 const s=setup();try{
  fire(s.canvas,'pointerdown',touch(1,100,150));
  for(let i=1;i<=100;i++)fire(s.canvas,'pointermove',touch(1,100+i*.75,150));
  assert.equal(s.controls.inspect().cameraAzimuth,0);assert.equal(s.views,0);assert.equal(s.pending.size,1);assert.equal(s.requests,1);assert.equal(s.controls.inspect().cameraPointerMoves,100);assert.equal(s.controls.inspect().cameraGesturePending,true);
  s.frame();close(s.controls.inspect().cameraAzimuth,333);assert.equal(s.views,1);assert.equal(s.controls.inspect().cameraGestureUpdates,1);assert.equal(s.pending.size,0);assert.equal(s.loop.inspect().running,false);
  fire(s.canvas,'pointerup',touch(1,175,150));assert.equal(s.taps.length,0);assert.equal(s.requests,1);assert.equal(s.controls.inspect().cameraPointers,0);assert.equal(s.canvas.captured.size,0);
  s.loop.start();const requests=s.requests;fire(s.canvas,'pointerdown',touch(2,100,150));for(let i=1;i<=64;i++)fire(s.canvas,'pointermove',touch(2,100+i,150));
  assert.equal(s.pending.size,1);assert.equal(s.requests,requests);s.frame();assert.equal(s.pending.size,1);assert.equal(s.maximum,1);assert.equal(s.controls.inspect().cameraGestureUpdates,2);fire(s.canvas,'pointerup',touch(2,164,150));
 }finally{s.finish();}
});

test('two-finger translation keeps zoom exact at both clamps and is independent of event order',()=>{
 for(const zoom of[1,1.25,3]){
  const results=[];
  for(const order of[[1,2],[2,1]]){const s=setup();try{
   if(zoom>1)s.controls.command('zoom-in');if(zoom===3)for(let i=0;i<5;i++)s.controls.command('zoom-in');
   close(s.controls.inspect().cameraZoom,zoom);const before=s.controls.inspect(),views=s.views;
   fire(s.canvas,'pointerdown',touch(1,150,150));fire(s.canvas,'pointerdown',touch(2,350,150));
   for(const id of order)fire(s.canvas,'pointermove',touch(id,(id===1?150:350)+30,180));
   close(s.controls.inspect().cameraZoom,zoom);s.frame();const after=s.controls.inspect();close(after.cameraZoom,zoom);assert.equal(after.cameraAzimuth,0);assert.equal(s.views,views+1);
   if(zoom>1)assert.ok(Math.hypot(after.cameraPanX-before.cameraPanX,after.cameraPanZ-before.cameraPanZ)>0);
   results.push([after.cameraZoom,after.cameraPanX,after.cameraPanZ]);fire(s.canvas,'pointerup',touch(1,180,180));fire(s.canvas,'pointerup',touch(2,380,180));assert.equal(s.taps.length,0);
  }finally{s.finish();}}
  results[0].forEach((v,i)=>close(v,results[1][i]));
 }
});

test('simultaneous pan and pinch keep the ground point under the centroid with one matrix/view update',()=>{
 const s=setup();try{
  s.controls.command('zoom-in');s.controls.command('zoom-in');const original=s.controls.inspect().cameraZoom,views=s.views;
  const ground=(x,y)=>{const ray=new Raycaster();ray.setFromCamera(new Vector2(x/500*2-1,1-y/350*2),s.camera);return ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());};
  const before=ground(250,175);fire(s.canvas,'pointerdown',touch(1,170,175));fire(s.canvas,'pointerdown',touch(2,330,175));fire(s.canvas,'pointermove',touch(1,162,183));fire(s.canvas,'pointermove',touch(2,362,183));s.frame();
  const after=ground(262,183);assert.ok(before&&after);close(before.x,after.x);close(before.z,after.z);close(s.controls.inspect().cameraZoom,original*1.25);assert.equal(s.views,views+1);assert.equal(s.controls.inspect().cameraAzimuth,0);
  fire(s.canvas,'pointerup',touch(1,162,183));fire(s.canvas,'pointerup',touch(2,362,183));assert.equal(s.taps.length,0);
 }finally{s.finish();}
});

test('coalesced backtracking, a 4px drag, long holds and multitouch never become object taps',()=>{
 const s=setup();try{
  fire(s.canvas,'pointerdown',touch(1,200,150));s.advance(100);fire(s.canvas,'pointerup',touch(1,202,151));assert.equal(s.taps.length,1);
  fire(s.canvas,'pointerdown',touch(2,200,150));fire(s.canvas,'pointermove',touch(2,204,150));fire(s.canvas,'pointerup',touch(2,204,150));assert.equal(s.taps.length,1);
  fire(s.canvas,'pointerdown',touch(3,200,150));fire(s.canvas,'pointermove',{...touch(3,203,150),getCoalescedEvents:()=>[touch(3,203,150),touch(3,200,150),touch(3,203,150)]});fire(s.canvas,'pointerup',touch(3,203,150));assert.equal(s.taps.length,1);
  fire(s.canvas,'pointerdown',touch(4,200,150));s.advance(301);fire(s.canvas,'pointerup',touch(4,200,150));assert.equal(s.taps.length,1);
  fire(s.canvas,'pointerdown',touch(5,200,150));fire(s.canvas,'pointerdown',touch(6,300,150));fire(s.canvas,'pointerup',touch(5,200,150));fire(s.canvas,'pointerup',touch(6,300,150));assert.equal(s.taps.length,1);assert.equal(s.controls.inspect().cameraTapCount,1);
  if(s.pending.size)s.frame();assert.equal(s.taps.length,1);assert.equal(s.controls.inspect().cameraPointers,0);assert.equal(s.controls.inspect().cameraGesturePending,false);
 }finally{s.finish();}
});

test('cancel, scroll, pause, resize and disposal discard queued camera motion and all late taps',()=>{
 for(const reason of['pointercancel','lostpointercapture','scroll','blur','pause','resize','mode','focus','dispose']){const s=setup();try{
  fire(s.canvas,'pointerdown',touch(1,150,150));fire(s.canvas,'pointerdown',touch(2,350,150));fire(s.canvas,'pointermove',touch(1,120,170));fire(s.canvas,'pointermove',touch(2,380,170));assert.equal(s.pending.size,1);
  if(reason==='pause')s.controls.setEnabled(false);else if(reason==='resize')s.controls.resize(350,500);else if(reason==='mode')s.controls.command('drag-pan');else if(reason==='focus')s.controls.focus({x:0,z:0});else if(reason==='dispose')s.controls.dispose();else if(reason==='blur'||reason==='scroll')window.dispatchEvent(new Event(reason));else{fire(s.canvas,reason,{pointerId:1});fire(s.canvas,reason,{pointerId:2});}
  const before=s.controls.inspect();assert.equal(before.cameraGesturePending,false);const views=s.views;
  if(s.pending.size)s.frame();fire(s.canvas,'pointermove',touch(1,50,50));fire(s.canvas,'pointerup',touch(1,50,50));fire(s.canvas,'pointerup',touch(2,380,170));assert.deepEqual(s.controls.inspect(),before);assert.equal(s.views,views);assert.equal(s.taps.length,0);assert.equal(s.canvas.captured.size,0);assert.equal(s.pending.size,0);
 }finally{s.finish();}}
});
