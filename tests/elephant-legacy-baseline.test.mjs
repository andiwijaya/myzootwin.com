import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createSimulation} from '../src/game/core/simulation.ts';
import {parseSave,serializeSave} from '../src/game/persistence/save-v1.ts';
import {totals} from '../src/game/economy/journal.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));

test('frozen V1 fixtures preserve exact baseline bytes and every legacy field without owner data',()=>{
  assert.equal(Object.keys(frozen.entries).length,9);
  for(const [id,{sha256,state}] of Object.entries(frozen.entries)){
    const before=structuredClone(state),text=serializeSave(state);
    assert.equal(createHash('sha256').update(text).digest('hex'),sha256,id);
    const loaded=parseSave(text);assert.equal(loaded.ok,true,id);assert.deepEqual(loaded.value,before,id);
    assert.equal(state.world.tiles.length,120);assert.deepEqual(state.world.gate,{x:1,z:8});
    assert.deepEqual(state.animals.map(a=>[a.id,a.speciesId]),[['macaw-1','ara-ararauna'],['macaw-2','ara-ararauna']]);
    assert.equal(Object.values(totals(state).amounts).reduce((a,b)=>a+b,0),state.currency,id);
    assert.deepEqual(state,before,id);
  }
});

test('ready Q04 is distinct from claimed Q04; claimed and compacted rewards cannot replay',()=>{
  assert.equal(frozen.entries.q04Ready.state.missions.completedIds.includes('Q04'),false);
  assert.equal(frozen.entries.q04Claimed.state.missions.completedIds.includes('Q04'),true);
  assert.ok(frozen.entries.longLedger.state.economy.checkpoint.compactions>0);
  for(const id of ['q04Claimed','indonesian']){
    const sim=createSimulation(frozen.entries[id].state),before=sim.snapshot();
    for(const mission of ['Q01','Q02','Q03','Q04'])assert.equal(sim.claimMission({id:mission,command:sim.commandRevision()}).ok,false);
    assert.deepEqual(sim.snapshot(),before);sim.dispose();
  }
});

test('every frozen save resumes deterministically and pause causes no offline advancement or duplicate revenue',()=>{
  for(const {state} of Object.values(frozen.entries)){
    const a=createSimulation(state),b=createSimulation(parseSave(serializeSave(state)).value);
    a.setPaused(true);const before=a.snapshot();a.advance(60000);assert.deepEqual(a.snapshot(),before);a.setPaused(false);
    for(let i=0;i<30;i++){a.advance(100);for(const delta of [17,23,60])b.advance(delta);}
    assert.deepEqual(a.snapshot(),b.snapshot());assert.equal(parseSave(serializeSave(a.snapshot())).ok,true);a.dispose();b.dispose();
  }
});

test('corrupted and unsupported frozen saves reject without repairing or mutating the input',()=>{
  const original=frozen.entries.q04Claimed.state;
  for(const change of [s=>s.schemaVersion=999,s=>s.animals[0].id=s.animals[1].id,s=>s.currency++,s=>s.world.tiles.pop(),s=>s.missions.completedIds.pop()]){
    const bad=structuredClone(original);change(bad);const before=JSON.stringify(bad);
    assert.equal(parseSave(before).ok,false);assert.equal(JSON.stringify(bad),before);
  }
  assert.equal(parseSave('{broken').code,'invalid-json');
});
