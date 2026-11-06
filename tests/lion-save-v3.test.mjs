import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {migrateToV3,validateSaveV3,parseSaveV3,serializeSaveV3,projectUnstartedV3,LION_CHECKPOINT_CODEC} from '../src/game/persistence/save-v3.ts';
import {validateSaveV2,migrateSaveV1,serializeSaveV2} from '../src/game/persistence/save-v2.ts';
import {validateSave} from '../src/game/persistence/save-v1.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
const golden=JSON.parse(readFileSync(new URL('./fixtures/lion-v2-golden.json',import.meta.url),'utf8')).state;
const legacy=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries;
test('earned V2 to V3 migration is pure, append-only and lossless over every original field with no automatic money, residents or proof',()=>{
 const before=JSON.stringify(golden),result=migrateToV3(golden);assert.ok(result.ok,JSON.stringify(result));const s=result.value;
 assert.equal(s.schemaVersion,3);assert.equal(s.world.tiles.length,312);assert.deepEqual(projectUnstartedV3(s),golden);assert.equal(JSON.stringify(golden),before);assert.equal(s.lionSavanna.grant,null);assert.equal(s.animals.length,4);assert.equal(serializeSaveV3(s).length<50000,true);assert.deepEqual(parseSaveV3(serializeSaveV3(s)).value,s);assert.deepEqual(migrateToV3(s).value,s);
 assert.equal(validateSaveV2(s).ok,false);assert.equal(validateSave(s).ok,false);
});
test('every genuine frozen V1 input validates through V1 to V2 to V3 with exact legacy field projections',()=>{
 for(const [id,{state}] of Object.entries(legacy)){const v2=migrateSaveV1(state),v3=migrateToV3(state);assert.ok(v2.ok,id);assert.ok(v3.ok,JSON.stringify(v3));assert.deepEqual(projectUnstartedV3(v3.value),v2.value,id);assert.equal(LION_CHECKPOINT_CODEC.parse(JSON.stringify(state)).ok,true);}
});
test('strict V3 preserves malformed/future originals without repairing, filtering or resetting them',()=>{
 const s=migrateToV3(golden).value;
 for(const mutate of [v=>v.currency++,v=>v.world.tiles.pop(),v=>v.world.tiles[217].cell.z=2,v=>v.animals[0].speciesId='panthera-future',v=>v.elephantGrove.missions.rewards[0].award='counterfeit',v=>v.lionSavanna.missions.currentId=null,v=>v.lionSavanna.grant={id:'lion-savanna-grant-v1',ledgerEntryId:'lion-savanna-grant-v1',tick:v.tick,command:2},v=>v.lionSavanna.missions.objectives.roars=1]){const x=structuredClone(s);mutate(x);const before=JSON.stringify(x);assert.equal(validateSaveV3(x).ok,false,before);assert.equal(JSON.stringify(x),before);}
 for(const mutate of [v=>v.schemaVersion=4,v=>v.future={},v=>v.lionSavanna.future=true]){const x=structuredClone(s);mutate(x);assert.equal(LION_CHECKPOINT_CODEC.parse(JSON.stringify(x)).code,'unsupported-schema');}
 assert.equal(parseSaveV3('{bad').code,'invalid-json');assert.equal(parseSaveV3(' '.repeat(1000001)).code,'too-large');assert.equal(migrateToV3({...golden,currency:golden.currency+1}).ok,false);assert.equal(serializeSaveV2(golden).length,36457);
});
test('canonical V3 retains the original elephant and macaw clock, needs, ledger and mission results through cold loads and both speeds',()=>{
 const a=createSimulation(golden),b=createSimulation(migrateToV3(golden).value);b.setSpeed(10);
 for(let i=0;i<300;i++){a.advance(100);b.advance(10);}
 const x=a.snapshot(),y=b.snapshot();y.preferences.speed=1;assert.deepEqual(projectUnstartedV3(y),x);
 b.setPaused(true);const before=b.snapshot();b.advance(60000);assert.deepEqual(b.snapshot(),before);b.setPaused(false);
 const cold=createSimulation(parseSaveV3(serializeSaveV3(b.snapshot())).value);cold.setSpeed(10);for(let i=0;i<150;i++){b.advance(10);cold.advance(10);}assert.deepEqual(b.snapshot(),cold.snapshot());
 const base=serializeSaveV3(migrateToV3(golden).value);b.reset();b.setSpeed(1);assert.equal(serializeSaveV3(b.snapshot()),base);a.dispose();b.dispose();cold.dispose();
});
