import test from 'node:test';
import assert from 'node:assert/strict';
import {OrthographicCamera,Vector3} from 'three';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {createPlacementPlanner,validatePlacement} from '../src/game/world/placement-preview.ts';
import {createPlacementPreview} from '../src/game/render3d/placement-preview.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
import {createPreviewController} from '../src/game/render3d/preview-controller.ts';
import {entryMessages} from '../src/game-entry/locale.ts';
const empty=new Set();
test('footprint validates grid bounds, water, path, occupancy and scenery with precise reasons',()=>{
 const w=createInitialState().world;
 assert.equal(validatePlacement(w,null,empty).reason,'choose');
 for(const anchor of [{x:-1,z:0},{x:11,z:0},{x:0,z:9},{x:NaN,z:0},{x:.5,z:0}])assert.equal(validatePlacement(w,anchor,empty).reason,'outside');
 assert.equal(validatePlacement(w,{x:8,z:2},empty).reason,'creek');
 assert.equal(validatePlacement(w,{x:1,z:7},empty).reason,'path');
 w.tiles.find(t=>t.cell.x===4&&t.cell.z===4).occupantId='future-structure';
 assert.equal(validatePlacement(w,{x:4,z:4},empty).reason,'occupied');
 assert.equal(validatePlacement(w,{x:5,z:4},new Set(['6,5'])).reason,'scenery');
 const valid=validatePlacement(w,{x:5,z:4},empty);assert.equal(valid.reason,'ready');assert.deepEqual(valid.proposal.cells,[{x:5,z:4},{x:6,z:4},{x:5,z:5},{x:6,z:5}]);
});
test('cancel never changes world, save or previously confirmed session plan',()=>{
 const state=createInitialState(),before=JSON.stringify(state),p=createPlacementPlanner(()=>state.world,empty,()=>{});
 p.begin();p.choose({x:4,z:4});p.cancel();assert.equal(JSON.stringify(state),before);assert.equal(p.snapshot().confirmed,null);
 p.begin();p.choose({x:4,z:4});assert.equal(p.confirm(p.snapshot().revision),true);const plan=p.snapshot().confirmed;
 p.begin();p.choose({x:7,z:4});p.cancel();assert.deepEqual(p.snapshot().confirmed,plan);assert.equal(JSON.stringify(state),before);
});
test('confirm revalidates latest world and revision, invalid and repeated calls cannot commit',()=>{
 const w=createInitialState().world,p=createPlacementPlanner(()=>w,empty,()=>{});p.begin();p.choose({x:4,z:4});const revision=p.snapshot().revision;
 assert.equal(p.confirm(revision-1),false);w.tiles.find(t=>t.cell.x===4&&t.cell.z===4).occupantId='new-blocker';assert.equal(p.confirm(revision),false);assert.equal(p.snapshot().confirmed,null);
 w.tiles.find(t=>t.cell.x===4&&t.cell.z===4).occupantId=null;p.choose({x:4,z:4});const fresh=p.snapshot().revision;assert.equal(p.confirm(fresh),true);assert.equal(p.confirm(fresh),false);assert.equal(p.snapshot().confirmations,1);
});
test('paused/disposed planner rejects all mutations and snapshots cannot mutate internal plans',()=>{
 const w=createInitialState().world,p=createPlacementPlanner(()=>w,empty,()=>{});p.begin();p.choose({x:4,z:4});p.setEnabled(false);const before=p.snapshot();p.choose({x:0,z:0});p.cancel();p.move(1,0);assert.equal(p.confirm(before.revision),false);assert.deepEqual(p.snapshot(),before);
 p.setEnabled(true);p.confirm(before.revision);const copy=p.snapshot();copy.confirmed.anchor.x=99;assert.equal(p.snapshot().confirmed.anchor.x,4);p.dispose();const end=p.snapshot();p.begin();p.choose({x:4,z:4});assert.deepEqual(p.snapshot(),end);assert.equal(end.confirmed,null);
});
test('one bounded session plan is replaced without accumulating duplicate objects',()=>{
 const p=createPlacementPlanner(()=>createInitialState().world,empty,()=>{});for(let i=0;i<100;i++){p.begin();p.move(0,0);const v=p.snapshot();assert.equal(v.reason,'ready');assert.equal(p.confirm(v.revision),true);}assert.equal(p.inspect().placementConfirmedCount,1);assert.equal(p.inspect().placementConfirmations,100);
});
function setup(width=504,height=350){const state=createInitialState(),world=createTropicalDiorama(state.world),camera=new OrthographicCamera(),rect={left:20,top:30,width,height};fitIsometricCamera(camera,world.bounds,width/height);let view;const preview=createPlacementPreview(()=>state.world,world.catalog,camera,()=>rect,v=>view=v);return {state,world,camera,rect,preview,get view(){return view;},point(xyz){const p=new Vector3(...xyz).project(camera);return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};},dispose(){preview.dispose();for(const g of [...world.geometries,...preview.geometries])g.dispose();for(const m of [...world.materials,...preview.materials])m.dispose();}};}
test('actual scene ground snaps at desktop/portrait/landscape; ghost valid/invalid and confirmed cue reuse fixed pool',()=>{
 for(const [width,height]of [[504,350],[270,250],[285,250]]){const s=setup(width,height);try{const before=JSON.stringify(s.state);s.preview.command('begin');s.preview.pick(s.point([-.5,.022,.5]));assert.deepEqual(s.view.proposal.anchor,{x:5,z:5});assert.equal(s.view.reason,'ready');assert.equal(s.preview.inspect().placementGhostVisible,true);s.preview.pick(s.point([3.5,.031,-2.5]));assert.equal(s.view.reason,'creek');s.preview.command('confirm',s.view.revision);assert.equal(s.preview.inspect().placementConfirmedCount,0);s.preview.pick(s.point([-.5,.022,.5]));s.preview.command('confirm',s.view.revision);assert.equal(s.preview.inspect().placementConfirmedCount,1);assert.equal(s.preview.inspect().placementGhostVisible,false);assert.equal(s.preview.inspect().placementPlanVisible,true);assert.equal(s.preview.geometries.length,2);assert.equal(s.preview.materials.length,3);assert.equal(JSON.stringify(s.state),before);}finally{s.dispose();}assert.equal(s.preview.inspect().placementPlanVisible,false);}
});
test('scenery and outside-world ray hits yield rejected ghost; stale resize has no cached screen coordinates',()=>{
 const s=setup();try{s.preview.command('begin');s.preview.pick(s.point([-4.5,1.4516,3.82]));assert.ok(['scenery','path'].includes(s.view.reason));s.preview.pick({x:s.rect.left+2,y:s.rect.top+2});assert.equal(s.view.reason,'outside');s.rect.width=270;s.rect.height=250;fitIsometricCamera(s.camera,s.world.bounds,s.rect.width/s.rect.height);s.preview.pick(s.point([-.5,.022,.5]));assert.deepEqual(s.view.proposal.anchor,{x:5,z:5});}finally{s.dispose();}
});
test('controller only forwards placement to live ready unpaused session and old session is released',async()=>{
 const commands=[];const c=createPreviewController(async()=>()=>({dispose(){commands.push('dispose');},placement:(...a)=>commands.push(a)}),()=>{});c.placement('begin');await c.open();c.placement('begin');c.setPaused(true);c.placement('confirm',2);c.setPaused(false);c.placement('confirm',3);c.close();c.placement('cancel');assert.deepEqual(commands,[['begin',undefined],['confirm',3],'dispose']);c.dispose();
});
test('all placement reasons and controls have nonempty ID/EN messages',()=>{
 for(const lang of ['en','id'])for(const suffix of ['Choose','Ready','Outside','Creek','Path','Occupied','Scenery','Start','Title','Hint','Confirm','Cancel','Confirmed','Left','Right','Up','Down','Location'])assert.ok(entryMessages[lang]['placement'+suffix]?.length>5,lang+suffix);
});
