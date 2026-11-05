import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Box3,OrthographicCamera,Vector3} from 'three';
import {appendElephantZone} from '../src/game/world/elephant-expansion.ts';
import {sceneOrigin,toScene,sceneToCell} from '../src/game/world/scene-coordinates.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
import {raycastScene} from '../src/game/render3d/scene-picking.ts';
import {createPlacementPreview} from '../src/game/render3d/placement-preview.ts';
import {mountCameraControls} from '../src/game/render3d/camera-controls.ts';
import {createHabitatScene} from '../src/game/render3d/habitat-scene.ts';
import {createPathScene} from '../src/game/render3d/path-scene.ts';
import {createFeederScene} from '../src/game/render3d/feeder-scene.ts';
import {createWaterScene} from '../src/game/render3d/water-scene.ts';
import {createPerchScene} from '../src/game/render3d/perch-scene.ts';
import {createRewardDecoration} from '../src/game/render3d/reward-decoration.ts';
import {createThrivingBanner} from '../src/game/render3d/thriving-banner.ts';
import {createAutonomousBirds} from '../src/game/render3d/macaw/autonomous-birds.ts';
import {createVisitorScene} from '../src/game/render3d/visitor-scene.ts';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state;
const originalScene=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-scene.json',import.meta.url),'utf8'));
const dispose=scene=>{scene.geometries.forEach(g=>g.dispose());scene.materials.forEach(m=>m.dispose());};
const bounds=g=>{g.updateMatrixWorld(true);const b=new Box3().setFromObject(g);return [b.min.toArray(),b.max.toArray()];};

test('V1 scenery exactly matches geometry hashes and all identities frozen from the original Git source',()=>{
  const world=structuredClone(fixture.world);world.habitats=[];world.resources=[];world.tiles.forEach(t=>{t.occupantId=null;t.path=t.cell.x===1&&t.cell.z===8;});const scene=createTropicalDiorama(world);
  try{scene.geometries.forEach((g,i)=>{for(const key of ['position','normal','color']){const a=g.getAttribute(key).array;assert.equal(createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex'),originalScene.geometries[i][key]);}});
    for(const {id,identity,min,max}of originalScene.catalog){assert.deepEqual(scene.catalog.identities.get(id),identity);assert.deepEqual(scene.catalog.bounds.get(id).min.toArray(),min);assert.deepEqual(scene.catalog.bounds.get(id).max.toArray(),max);}
  }finally{dispose(scene);}
});

test('anchored tile conversion is reversible and retains all 120 old centers after south expansion',()=>{
  const old=fixture.world,next=appendElephantZone(old);assert.deepEqual(sceneOrigin(next),{x:6,z:5});
  for(const t of old.tiles){assert.deepEqual(toScene(t.cell,next),toScene(t.cell,old));assert.deepEqual(sceneToCell(toScene(t.cell,next),next),t.cell);}
  assert.deepEqual(toScene({x:3,z:11},next),{x:-2.5,z:6.5});
  assert.deepEqual(sceneOrigin({width:8,height:8}),{x:4,z:4});
});

test('every old selectable identity and object bounds remain exact and original scenery batches are byte-identical',()=>{
  const a=createTropicalDiorama(fixture.world),b=createTropicalDiorama(appendElephantZone(fixture.world));
  try{
    for(const [id,identity] of a.catalog.identities){assert.deepEqual(b.catalog.identities.get(id),identity,id);assert.deepEqual(b.catalog.bounds.get(id),a.catalog.bounds.get(id),id);}
    // Terrain grows; every other original batch, including creek, plants, gate and shadows, stays exact.
    for(let i=1;i<a.geometries.length;i++)for(const attr of ['position','normal','color'])assert.deepEqual(b.geometries[i].getAttribute(attr).array,a.geometries[i].getAttribute(attr).array,`${i}/${attr}`);
    assert.ok(b.bounds.max.z>12.9);assert.equal(b.inspect().terrainTiles,216);assert.equal(b.inspect().creekTiles,8);
  }finally{dispose(a);dispose(b);}
});

test('old aviary paths food water perches rewards macaws and visitors retain exact rendered bounds',()=>{
  const old=fixture.world,next=appendElephantZone(old);
  for(const factory of [createFeederScene,createWaterScene,createPerchScene,createRewardDecoration,createThrivingBanner]){
    const a=factory(),b=factory();try{a.sync(old,true);b.sync(next,true);assert.deepEqual(bounds(b.group),bounds(a.group));}finally{a.dispose();b.dispose();}
  }
  const catalog=()=>({identities:new Map(),bounds:new Map(),batches:[]});
  for(const factory of [c=>createHabitatScene(c,()=>{}),createPathScene]){const a=factory(catalog()),b=factory(catalog());try{a.sync(old);b.sync(next);assert.deepEqual(bounds(b.group),bounds(a.group));}finally{a.dispose();b.dispose();}}
  const a=createAutonomousBirds(),b=createAutonomousBirds();try{a.sync(fixture.animals,old.habitats,12,10,fixture.gameTimeMs);b.sync(fixture.animals,next.habitats,12,18,fixture.gameTimeMs);a.update(1,fixture.gameTimeMs);b.update(1,fixture.gameTimeMs);assert.deepEqual(bounds(b.group),bounds(a.group));}finally{a.dispose();b.dispose();}
  const va=createVisitorScene(),vb=createVisitorScene();try{va.sync(fixture.visitors,12,10,fixture.tick,old.gate);vb.sync(fixture.visitors,12,18,fixture.tick,next.gate);va.update(1,fixture.gameTimeMs);vb.update(1,fixture.gameTimeMs);assert.deepEqual(bounds(vb.group),bounds(va.group));}finally{va.dispose();vb.dispose();}
});

test('all eight camera angles frame both zones and raycast keeps old identities and new grass picks at each viewport',()=>{
  const old=createTropicalDiorama(fixture.world),world=appendElephantZone(fixture.world),scene=createTropicalDiorama(world),camera=new OrthographicCamera(),oldCamera=new OrthographicCamera();
  try{for(const [width,height] of [[1366,768],[360,780],[780,360]])for(let angle=0;angle<8;angle++){
    fitIsometricCamera(camera,scene.bounds,width/height,angle*Math.PI/4);fitIsometricCamera(oldCamera,old.bounds,width/height,angle*Math.PI/4);
    const project=(cell,map,cam)=>{const p=toScene(cell,map),v=new Vector3(p.x,.055,p.z).project(cam);assert.ok(Math.abs(v.x)<1&&Math.abs(v.y)<1);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2};};
    const rect={left:0,top:0,width,height},cell={x:4,z:4};
    const before=raycastScene(old.catalog,oldCamera,project(cell,fixture.world,oldCamera),rect),after=raycastScene(scene.catalog,camera,project(cell,world,camera),rect);
    assert.deepEqual(after,before,`${width}/${height}/${angle}`);
    const newCell={x:5,z:13};assert.equal(raycastScene(scene.catalog,camera,project(newCell,world,camera),rect)?.id,'tile-5-13');
  }}finally{dispose(old);dispose(scene);}
});

class Element extends EventTarget {style={};dataset={};getBoundingClientRect(){return{left:0,top:0,width:500,height:350};}focus(){}hasPointerCapture(){return false;}releasePointerCapture(){} }
test('actual camera controls can focus both regions and clamp adversarial pan inside anchored bounds',()=>{
  const previous=globalThis.window;globalThis.window=new EventTarget();const world=appendElephantZone(fixture.world),scene=createTropicalDiorama(world),host=new Element(),canvas=new Element(),camera=new OrthographicCamera(),controls=mountCameraControls(host,canvas,camera,scene.bounds,world);
  try{for(const [width,height]of [[1366,768],[360,780],[780,360]]){controls.resize(width,height);for(let a=0;a<8;a++){
    for(const cell of [{x:4,z:4},{x:5,z:13}]){const p=toScene(cell,world);controls.focus(p);const v=controls.inspect();assert.ok(Math.abs(v.cameraFocusX-p.x)<1e-6);assert.ok(Math.abs(v.cameraFocusZ-p.z)<1e-6);}
    for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'])for(let i=0;i<100;i++){const event=new Event('keydown',{cancelable:true});Object.assign(event,{key});host.dispatchEvent(event);}
    controls.command('rotate-right');const v=controls.inspect();assert.ok(v.cameraFocusX>=-6&&v.cameraFocusX<=6&&v.cameraFocusZ>=-5&&v.cameraFocusZ<=13);
  }}}finally{controls.dispose();dispose(scene);globalThis.window=previous;}
});

test('real placement ghost and ground picking use the same stable anchor in either zone',()=>{
  const old=fixture.world,world=appendElephantZone(old),scene=createTropicalDiorama(world),camera=new OrthographicCamera(),rect={left:0,top:0,width:1366,height:768};let view;
  fitIsometricCamera(camera,scene.bounds,rect.width/rect.height);const preview=createPlacementPreview(()=>world,scene.catalog,camera,()=>rect,v=>view=v);
  try{preview.guide('habitat',{x:4,z:4});assert.deepEqual(preview.group.children[0].position.toArray(),[-1,.17,0]);
    preview.command('cancel');preview.command('begin');const p=toScene({x:5,z:13},world),v=new Vector3(p.x,.055,p.z).project(camera);preview.pick({x:(v.x+1)*rect.width/2,y:(1-v.y)*rect.height/2});assert.deepEqual(view.proposal.anchor,{x:5,z:13});assert.equal(view.reason,'ready');preview.command('cancel');assert.equal(preview.active(),false);
  }finally{preview.dispose();preview.geometries.forEach(g=>g.dispose());preview.materials.forEach(m=>m.dispose());dispose(scene);}
});
