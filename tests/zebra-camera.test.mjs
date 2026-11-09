import test from 'node:test';
import assert from 'node:assert/strict';
import {OrthographicCamera} from 'three';
import {preparedZebraCare} from './helpers/zebra-care-play.mjs';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {createZebraWorldScene} from '../src/game/render3d/zebra/world-scene.ts';
import {createZebraCareScene} from '../src/game/render3d/zebra/care-scene.ts';
import {mountCameraControls} from '../src/game/render3d/camera-controls.ts';
import {createZebraCarePreview} from '../src/game/render3d/zebra/care-preview.ts';
import {serializeSaveV5,parseSaveV5} from '../src/game/persistence/save-v5.ts';
import {raycastScene} from '../src/game/render3d/scene-picking.ts';
import {interactionTargets} from '../scripts/qa/visual3d/interaction-targets.ts';
import {cameraEnvelopes} from '../scripts/qa/visual3d/camera-envelopes.ts';

class Element extends EventTarget{style={};dataset={};captured=new Set();box={left:7,top:11,width:500,height:350};getBoundingClientRect(){return this.box;}focus(){}setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);}}
function fire(target,type,data){const event=new Event(type,{cancelable:true});Object.assign(event,data);target.dispatchEvent(event);return event;}
function setup(options={}){const previous=globalThis.window;globalThis.window=new EventTarget();const sim=preparedZebraCare(options),state=sim.snapshot(),world=createTropicalDiorama(state.world),home=createZebraWorldScene(world.catalog),care=createZebraCareScene(world.catalog),host=new Element(),canvas=new Element(),camera=new OrthographicCamera();home.sync(state.world);care.sync(state.world);world.group.add(home.group,care.group);world.group.updateMatrixWorld(true);return{sim,state,world,host,canvas,camera,finish(){home.dispose();care.dispose();for(const g of world.geometries)g.dispose();for(const m of world.materials)m.dispose();sim.dispose();globalThis.window=previous;}};}

for(const [width,height]of [[360,780],[780,360],[1366,768],[1920,1080]])test(`actual24x26 V5 camera focuses five paid footprints and picks original visible triangles at eight angles ${width}x${height}`,()=>{
 const s=setup(),before=serializeSaveV5(s.state),c=mountCameraControls(s.host,s.canvas,s.camera,s.world.bounds,s.state.world);let focuses=0,picks=0;
 try{assert.equal(s.state.world.width,24);assert.equal(s.state.world.height,26);assert.equal(s.state.world.habitats.length,5);s.canvas.box={left:7,top:11,width,height};c.resize(width,height);
  for(let angle=0;angle<8;angle++){
   assert.equal(c.inspect().cameraAzimuth,angle*45);
   for(const h of cameraEnvelopes(s.state.world,s.camera)){c.focusArea(h.area);const projected=cameraEnvelopes(s.state.world,s.camera).find(x=>x.id===h.id);assert.equal(projected.inside,true,JSON.stringify({width,height,angle,kind:h.kind,projected}));assert.ok(c.inspect().cameraZoom>=1&&c.inspect().cameraZoom<=3);focuses++;}
   const targets=interactionTargets(s.world.catalog,s.camera,s.canvas.box,true).filter(t=>t.kind==='zebra-facility'&&t.point);assert.ok(targets.length>0,`visible original facility at angle${angle}`);
   for(const t of targets){assert.equal(raycastScene(s.world.catalog,s.camera,t.point,s.canvas.box)?.id,t.id);
    // Actual native mouse inputs round CSS coordinates after a page scroll.
    for(const shift of [{x:0,y:0},{x:.260416984558104,y:-307.3333282470703},{x:-3.6,y:44.8}]){
     const box={...s.canvas.box,left:s.canvas.box.left+shift.x,top:s.canvas.box.top+shift.y};
     const native={x:Math.round(t.point.x+shift.x),y:Math.round(t.point.y+shift.y)};
     assert.equal(raycastScene(s.world.catalog,s.camera,native,box)?.id,t.id,JSON.stringify({angle,width,height,id:t.id,native,box}));
    }picks++;}
   c.command('rotate-right');assert.equal(serializeSaveV5(s.sim.snapshot()),before);
  }
  c.command('reset');assert.equal(c.inspect().cameraAzimuth,0);assert.equal(c.inspect().cameraZoom,1);assert.equal(c.inspect().cameraPanX,0);assert.equal(c.inspect().cameraPanZ,0);assert.deepEqual(parseSaveV5(before).value,s.sim.snapshot());
  console.log(JSON.stringify({case:'five-habitat-camera',width,height,focuses,angles:8,picks,scope:'Actual world/meshes/source adapter; camera3.4height contract envelope, not full posed-mesh/native-device proof'}));
 }finally{c.dispose();s.finish();}
});

test('original touch adapter pinch and every cancellation path cannot tap, move a ready Zebra preview, purchase, remove or change a strict save',async()=>{
 const s=setup({enrichment:false}),before=serializeSaveV5(s.state);let taps=0,commits=0;const preview=createZebraCarePreview(()=>s.sim.worldSnapshot(),s.camera,()=>s.canvas.box,{command:()=>s.sim.commandRevision(),defaultCell:kind=>s.sim.defaultZebraCareCell(kind),validate:(kind,cell)=>s.sim.validateZebraCarePlacement(kind,cell),commit:async q=>{commits++;const p=s.sim.prepareZebraCare(q);if(p.ok)s.sim.acceptCommittedZebraCare(p.state,q);return p.ok?{ok:true}:{ok:false,reason:p.reason};}},()=>{}),c=mountCameraControls(s.host,s.canvas,s.camera,s.world.bounds,s.state.world,p=>{taps++;preview.pick(p);},()=>preview.cancel());
 try{c.resize(500,350);preview.begin('zebra-enrichment');assert.equal(preview.view().reason,'ready');const cell=structuredClone(preview.view().cell);
  const event=(id,x,y)=>({pointerId:id,pointerType:'touch',button:0,buttons:1,clientX:x,clientY:y});
  fire(s.canvas,'pointerdown',event(1,200,160));fire(s.canvas,'pointerdown',event(2,300,160));assert.equal(s.canvas.captured.size,2);fire(s.canvas,'pointermove',event(1,150,170));fire(s.canvas,'pointermove',event(2,350,170));assert.ok(c.inspect().cameraZoom>1);fire(s.canvas,'pointerup',event(1,150,170));fire(s.canvas,'pointerup',event(2,350,170));assert.equal(taps,0);assert.equal(s.canvas.captured.size,0);assert.deepEqual(preview.view().cell,cell);
  for(const reason of ['pause','resize','blur','rotate','focus','pointercancel','lostpointercapture','dispose']){
   fire(s.canvas,'pointerdown',event(11,200,160));fire(s.canvas,'pointerdown',event(12,300,160));assert.equal(c.inspect().cameraPointers,2);
   if(reason==='pause'){c.setEnabled(false);c.setEnabled(true);}else if(reason==='resize')c.resize(360,240);else if(reason==='blur')window.dispatchEvent(new Event('blur'));else if(reason==='rotate')c.command('rotate-right');else if(reason==='focus')c.focusArea({x:8,z:7,width:8,depth:8});else if(reason==='dispose')c.dispose();else{fire(s.canvas,reason,event(11,200,160));fire(s.canvas,reason,event(12,300,160));}
   fire(s.canvas,'pointerup',event(11,200,160));fire(s.canvas,'pointerup',event(12,300,160));assert.equal(c.inspect().cameraPointers,0);assert.equal(s.canvas.captured.size,0);assert.equal(taps,0);assert.equal(commits,0);assert.equal(serializeSaveV5(s.sim.snapshot()),before);
  }
  await Promise.resolve();assert.equal(commits,0);assert.deepEqual(preview.view().cell,cell);
 }finally{c.dispose();preview.dispose();s.finish();}
});
