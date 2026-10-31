import test from 'node:test';
import assert from 'node:assert/strict';
import { OrthographicCamera,Vector3 } from 'three';
import { createInitialState } from '../src/game/core/initial-state.ts';
import { createTropicalDiorama } from '../src/game/render3d/tropical-diorama.ts';
import { fitIsometricCamera } from '../src/game/render3d/isometric-camera.ts';
import { raycastScene,createScenePicker } from '../src/game/render3d/scene-picking.ts';
import { createCameraGestures } from '../src/game/render3d/camera-gestures.ts';
import { createPreviewController } from '../src/game/render3d/preview-controller.ts';
import { presentSelection } from '../src/game-entry/selection-presentation.ts';
function setup(){const state=createInitialState(),world=createTropicalDiorama(state.world),camera=new OrthographicCamera();let rect={left:120,top:80,width:504,height:350};fitIsometricCamera(camera,world.bounds,rect.width/rect.height);const changes=[];const picker=createScenePicker(world.catalog,camera,()=>rect,s=>changes.push(s));return {state,world,camera,changes,picker,get rect(){return rect;},resize(width,height){rect={...rect,width,height};fitIsometricCamera(camera,world.bounds,width/height);},dispose(){picker.dispose();for(const g of [...world.geometries,...picker.geometries])g.dispose();for(const m of [...world.materials,...picker.materials])m.dispose();}};}
function point(s,xyz){const p=new Vector3(...xyz).project(s.camera);return {x:s.rect.left+(p.x+1)*s.rect.width/2,y:s.rect.top+(1-p.y)*s.rect.height/2};}

test('batched triangle ownership covers actual geometry,120 tiles and22 distinct scenery objects without changing state',()=>{
 const s=setup();try{
  assert.equal(JSON.stringify(s.state),JSON.stringify(createInitialState()));assert.equal(s.world.catalog.identities.size,142);assert.equal(s.world.catalog.batches.length,4);
  for(const b of s.world.catalog.batches){let next=0;for(const r of b.ranges){assert.equal(r.first,next);assert.ok(r.count>0&&Number.isInteger(r.count));if(r.id)assert.ok(s.world.catalog.identities.has(r.id));next+=r.count;}assert.equal(next,b.mesh.geometry.getAttribute('position').count/3);}
  for(const [id,bounds] of s.world.catalog.bounds){assert.ok(!bounds.isEmpty(),id);assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));}
  for(const [kind,count] of [['palm',6],['tree',4],['rock',7],['reeds',4],['gate',1]])assert.equal([...s.world.catalog.identities.values()].filter(i=>i.kind===kind&&i.category==='object').length,count);
 }finally{s.dispose();}
});
test('actual visible triangles resolve exact grass,water,gate,palm,tree,rock and reed identities at all viewport sizes',()=>{
 const s=setup();try{
  const samples=[['tile-5-5',[-.5,.022,.5]],['tile-4-4',[-1.5,.022,-.5]],['tile-9-2',[3.5,.031,-2.5]],['gate-1',[-4.5,1.4516,3.82]],['palm-6',[-5.03,.9,.432]],['tree-4',[1.7,1.25,4]],['rock-5',[4.2,.12,3.7]],['reeds-4',[4.25,.26,2.39]]];
  for(const [width,height] of [[504,350],[270,250],[285,250],[496,350]]){s.resize(width,height);for(const [id,xyz] of samples){const hit=raycastScene(s.world.catalog,s.camera,point(s,xyz),s.rect);assert.equal(hit?.id,id,JSON.stringify({width,height,id,hit}));}}
 }finally{s.dispose();}
});
test('nearest unowned soil and empty/outside/invalid coordinates do not select hidden tiles',()=>{
 const s=setup();try{
  assert.equal(raycastScene(s.world.catalog,s.camera,point(s,[0,-.35,5]),s.rect),null);
  for(const p of [{x:s.rect.left+1,y:s.rect.top+1},{x:-1,y:-1},{x:NaN,y:0},{x:Infinity,y:0}])assert.equal(raycastScene(s.world.catalog,s.camera,p,s.rect),null);
  assert.equal(raycastScene(s.world.catalog,s.camera,{x:200,y:100},{...s.rect,width:0}),null);
 }finally{s.dispose();}
});
test('mouse/touch tap path selects once,while camera drag,pinch,cancel and late events never select',()=>{
 const s=setup();try{
  const p=point(s,[-.5,.022,.5]);const g=createCameraGestures({panPixels(){},zoomBy(){}},()=>s.rect,location=>s.picker.pick(location));
  g.down({id:1,...p});g.up({id:1,...p});assert.equal(s.changes.at(-1).id,'tile-5-5');const revision=s.picker.inspect().selectionRevision;
  g.down({id:2,...p});g.up({id:2,...p});assert.equal(s.picker.inspect().selectionRevision,revision);
  s.picker.clear();g.down({id:3,...p});g.move({id:3,x:p.x+20,y:p.y});g.up({id:3,x:p.x+20,y:p.y});assert.equal(s.picker.inspect().selectionActive,false);
  g.down({id:4,...p});g.down({id:5,x:p.x+40,y:p.y});g.move({id:5,x:p.x+80,y:p.y});g.up({id:4,...p});g.up({id:5,x:p.x+80,y:p.y});assert.equal(s.picker.inspect().selectionActive,false);
  g.down({id:6,...p});g.cancel(6);g.up({id:6,...p});assert.equal(s.picker.inspect().selectionActive,false);
 }finally{s.dispose();}
});
test('selection marker/data remain coherent across camera movement/resize,clear,pausing and disposal with bounded resources',()=>{
 const s=setup();try{
  s.picker.pick(point(s,[-.5,.022,.5]));const box=s.picker.group.children[1].box.clone();const resources=[...s.picker.geometries,...s.picker.materials];
  s.camera.position.add(new Vector3(1,0,-1));s.camera.zoom=2;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld(true);assert.ok(s.picker.inspect().selectionActive);assert.ok(s.picker.group.children[1].box.equals(box));
  s.resize(270,250);s.camera.zoom=1;s.camera.updateProjectionMatrix();s.picker.pick(point(s,[-.5,.022,.5]));assert.equal(s.changes.filter(Boolean).length,1);
  const clone=s.changes[0];clone.cell.x=99;assert.equal(s.world.catalog.identities.get(clone.id).cell.x,5);
  s.picker.setEnabled(false);s.picker.pick({x:-1,y:-1});assert.ok(s.picker.inspect().selectionActive);s.picker.setEnabled(true);s.picker.pick({x:s.rect.left+1,y:s.rect.top+1});assert.equal(s.picker.inspect().selectionActive,false);
  for(let i=0;i<100;i++){s.picker.pick(point(s,[-.5,.022,.5]));s.picker.clear();}assert.deepEqual([...s.picker.geometries,...s.picker.materials],resources);assert.equal(s.picker.group.children.length,2);
  s.picker.pick(point(s,[-.5,.022,.5]));s.picker.dispose();const revision=s.picker.inspect().selectionRevision;s.picker.pick(point(s,[3.5,.031,-2.5]));assert.equal(s.picker.inspect().selectionRevision,revision);assert.equal(s.picker.inspect().selectionActive,false);assert.equal(s.picker.inspect().selectionDisposed,true);
 }finally{s.dispose();}
});
test('every actual scene identity has complete bilingual presentation with1-based locations and no unresolved keys',()=>{
 const s=setup();try{
  for(const identity of s.world.catalog.identities.values())for(const locale of ['id','en']){const view=presentSelection(identity,locale);assert.ok(Object.values(view).every(v=>typeof v==='string'&&v.length>0&&!/[{}]|undefined/.test(v)));}
  assert.equal(presentSelection(s.world.catalog.identities.get('palm-1'),'en').title,'Palm 1');assert.equal(presentSelection(s.world.catalog.identities.get('palm-1'),'id').title,'Palem 1');
  assert.equal(presentSelection(s.world.catalog.identities.get('tile-5-5'),'en').title,'Tile 6, 6');assert.equal(presentSelection(s.world.catalog.identities.get('tile-5-5'),'id').title,'Petak 6, 6');
 }finally{s.dispose();}
});
test('UI dismissal forwards only to a live unpaused renderer and never a stale or closed session',async()=>{
 let cleared=0;const c=createPreviewController(async()=>()=>({dispose(){},clearSelection(){cleared++;}}),()=>{});
 c.clearSelection();assert.equal(cleared,0);await c.open();c.clearSelection();assert.equal(cleared,1);c.setPaused(true);c.clearSelection();assert.equal(cleared,1);c.setPaused(false);c.clearSelection();assert.equal(cleared,2);c.close();c.clearSelection();assert.equal(cleared,2);c.dispose();
});
