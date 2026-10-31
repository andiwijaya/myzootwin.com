import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { createCameraNavigation } from '../src/game/render3d/camera-navigation.ts';
import { createCameraGestures } from '../src/game/render3d/camera-gestures.ts';
import { mountCameraControls } from '../src/game/render3d/camera-controls.ts';
const frame={width:500,height:350,halfWidth:10,halfHeight:7,rightX:.75,rightZ:-.66,upX:-.35,upZ:-.4,originX:-1,originZ:-1.2,mapWidth:12,mapHeight:10};
const make=()=>{const n=createCameraNavigation();n.configure(frame);return n;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
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
function setup(){const previous=globalThis.window;globalThis.window=new EventTarget();const host=new Element(),canvas=new Element(),camera=new OrthographicCamera(),bounds=new Box3(new Vector3(-6,-.4,-5),new Vector3(6,2.4,5));const c=mountCameraControls(host,canvas,camera,bounds,{width:12,height:10});c.resize(500,350);return {host,canvas,camera,c,finish(){c.dispose();globalThis.window=previous;}};}
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
