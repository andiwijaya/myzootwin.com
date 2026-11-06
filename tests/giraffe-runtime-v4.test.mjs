import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSimulation} from '../src/game/core/simulation.ts';
import {migrateToV4,projectUnstartedV4,validateSaveV4,serializeSaveV4,parseSaveV4} from '../src/game/persistence/save-v4.ts';
import {validateZooSave,serializeZooSave} from '../src/game/persistence/save.ts';
import {validateSpeciesHabitatPlacement} from '../src/game/world/species-habitat.ts';
import {validateHabitatPlacement} from '../src/game/world/build-habitat.ts';
const golden=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v3-golden.json',import.meta.url),'utf8')).state;
const v4=()=>{const checked=migrateToV4(golden);assert.ok(checked.ok);return checked.value;};

test('canonical V4 preserves all seven old agents, one clock and economy at both rates and cold continuation',()=>{
 for(const speed of [1,10]){
  let old=createSimulation(golden),current=createSimulation(v4());old.setSpeed(speed);current.setSpeed(speed);
  for(let i=0;i<120;i++){old.advance(100);current.advance(100);if(i%20===0){const state=current.snapshot();assert.ok(validateSaveV4(state).ok,JSON.stringify(validateSaveV4(state)));assert.deepEqual(projectUnstartedV4(state),old.snapshot());}}
  const before=current.snapshot();assert.ok(before.animals.filter(a=>a.speciesId==='panthera-leo').some(a=>a.motion.sequence>golden.animals.find(g=>g.id===a.id).motion.sequence));
  current.dispose();current=createSimulation(parseSaveV4(serializeSaveV4(before)).value);assert.deepEqual(current.snapshot(),before);
  for(let i=0;i<30;i++){old.advance(100);current.advance(100);}assert.deepEqual(projectUnstartedV4(current.snapshot()),old.snapshot());old.dispose();current.dispose();
 }
});
test('existing paid care commands retain V4 and exact old behavior rather than downgrade or lock lions',()=>{
 const a=createSimulation(golden),b=createSimulation(v4());
 for(const kind of ['elephant','lion']){const view=kind==='lion'?a.lionCareView():a.elephantCareView();const r=(view.resources??[...view.feeders,view.water,view.pond,view.shade,view.log].filter(Boolean)).find(r=>r.stock<r.capacity&&r.refillPrice>0);assert.ok(r,kind);const q={command:a.snapshot().economy.nextCommand,id:r.id,revision:r.revision};const left=kind==='lion'?a.refillLionCare(q):a.refillElephantCare(q),right=kind==='lion'?b.refillLionCare(q):b.refillElephantCare(q);assert.deepEqual(right,left);assert.ok(left.ok,JSON.stringify(left));assert.deepEqual(projectUnstartedV4(b.snapshot()),a.snapshot());}
 assert.equal(validateZooSave(b.snapshot()).ok,true);assert.equal(JSON.parse(serializeZooSave(b.snapshot())).schemaVersion,4);a.dispose();b.dispose();
});
test('V4 lateral construction keeps old habitat catalog in original columns and new 7x7 plot in its corridor',()=>{
 const s=v4();s.world.habitats=[];for(const t of s.world.tiles)t.occupantId=null;
 for(const kind of ['macaw-aviary','elephant-grove','lion-savanna'])assert.equal(validateSpeciesHabitatPlacement(s.world,{x:14,z:kind==='lion-savanna'?18:10},kind).reason,'zone');
 assert.equal(validateHabitatPlacement(s.world,{x:14,z:3}).reason,'zone');
 assert.equal(validateSpeciesHabitatPlacement(s.world,{x:13,z:2},'giraffe-plains').reason,'ready');
 assert.equal(validateSpeciesHabitatPlacement(s.world,{x:12,z:2},'giraffe-plains').reason,'zone');
});
