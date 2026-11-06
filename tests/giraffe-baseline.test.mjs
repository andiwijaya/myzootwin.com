import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateSave,serializeSave} from '../src/game/persistence/save-v1.ts';
import {validateSaveV2,serializeSaveV2} from '../src/game/persistence/save-v2.ts';
import {validateSaveV3,serializeSaveV3} from '../src/game/persistence/save-v3.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {sceneOrigin,toScene,sceneToCell} from '../src/game/world/scene-coordinates.ts';
const read=name=>JSON.parse(readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8'));
const v1=read('elephant-legacy-v1.json').entries,v2=read('lion-v2-golden.json'),v3=read('giraffe-v3-golden.json');
test('frozen synthetic V1/V2/V3 saves retain exact source hashes and distinct earned namespaces',()=>{
 for(const [name,{state}] of Object.entries(v1))assert.ok(validateSave(state).ok,name);
 assert.ok(validateSaveV2(v2.state).ok);assert.ok(validateSaveV3(v3.state).ok);
 for(const [golden,serialize] of [[v2,serializeSaveV2],[v3,serializeSaveV3]])assert.equal(createHash('sha256').update(serialize(golden.state)).digest('hex'),golden.sha256);
 assert.equal(v3.sha256,'9204b1e7fd02ed5cf3c091a652b81d7baa2d2590cf75844fa58a2fa32efd5105');
 assert.deepEqual(v3.state.missions.completedIds,['Q01','Q02','Q03','Q04']);assert.equal(v3.state.elephantGrove.missions.completedIds.length,4);assert.equal(v3.state.lionSavanna.missions.completedIds.length,4);
 assert.deepEqual(v3.state.animals.map(a=>a.id),['macaw-1','macaw-2','elephant-ayu','elephant-nara','lion-raka','lion-sena','lion-tala']);
});
test('all frozen versions cold-load without changes, pause adds no offline progress, and 1x/10x share authoritative outcomes',()=>{
 const sources=[...Object.values(v1).map(x=>[x.state,serializeSave]),[v2.state,serializeSaveV2],[v3.state,serializeSaveV3]];
 for(const [state,serialize] of sources){const a=createSimulation(state),b=createSimulation(JSON.parse(serialize(state)));try{
  assert.equal(serialize(a.snapshot()),serialize(state));a.setPaused(true);a.advance(86400000);assert.equal(serialize(a.snapshot()),serialize(state));a.setPaused(false);
  a.setSpeed(1);b.setSpeed(10);for(let i=0;i<50;i++){a.advance(100);b.advance(10);}const fast=b.snapshot();fast.preferences.speed=1;assert.deepEqual(a.snapshot(),fast);
 }finally{a.dispose();b.dispose();}}
});
test('frozen V3 coordinate and scene-space identities cover every cell and previous movable entity',()=>{
 const s=v3.state;assert.equal(s.world.tiles.length,312);assert.deepEqual(sceneOrigin(s.world),{x:6,z:5});
 for(const [i,t] of s.world.tiles.entries()){assert.deepEqual(t.cell,{x:i%12,z:Math.floor(i/12)});assert.deepEqual(toScene(t.cell,s.world),{x:t.cell.x-5.5,z:t.cell.z-4.5});assert.deepEqual(sceneToCell(toScene(t.cell,s.world),s.world),t.cell);}
 const points=[s.world.gate,...s.world.resources.map(r=>r.cell),...s.world.habitats.flatMap(h=>h.cells),...s.animals.map(a=>a.position).filter(Boolean),...s.visitors.flatMap(v=>[v.position,...v.route])];
 for(const p of points)assert.deepEqual(toScene(p,s.world,0),{x:p.x-6,z:p.z-5});
});
