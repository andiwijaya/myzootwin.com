import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {initialElephantMissions} from '../src/game/core/zoo-state.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {parseSave,validateSave} from '../src/game/persistence/save-v1.ts';
import {migrateSaveV1,parseSaveV2,validateSaveV2,serializeSaveV2,legacySimulationState,ELEPHANT_CHECKPOINT_CODEC} from '../src/game/persistence/save-v2.ts';
import {checkedCheckpoint,stateFromCheckpoint,encodeCheckpointState,inspectCheckpoint} from '../src/game/persistence/checkpoint.ts';
import {createAutosave} from '../src/game/persistence/autosave.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));
const projection=v=>{const s=legacySimulationState(v);s.world.height=10;s.world.tiles=s.world.tiles.slice(0,120);return s;};

test('all nine frozen V1 saves migrate losslessly: every legacy field, RNG, tick, ledger, mission, preference and tile hash retained',()=>{
  for(const [id,{state,sha256}] of Object.entries(frozen.entries)){
    const before=structuredClone(state),r=migrateSaveV1(state);assert.equal(r.ok,true,id);assert.equal(r.value.schemaVersion,2);assert.equal(r.value.world.tiles.length,216);assert.deepEqual(r.value.elephantGrove,{grant:null,missions:initialElephantMissions()});
    assert.deepEqual(projection(r.value),before,id);assert.equal(createHash('sha256').update(JSON.stringify(projection(r.value))).digest('hex'),sha256,id);
    assert.ok(r.value.world.habitats.every(h=>h.kind==='macaw-aviary'));assert.deepEqual(state,before);
    assert.deepEqual(parseSaveV2(serializeSaveV2(r.value)).value,r.value);
  }
});

test('repeated V2 codec/legacy simulator handoff is exact and never duplicates grant, animals, rewards or extension cells',()=>{
  for(const {state} of Object.values(frozen.entries)){
    const expected=migrateSaveV1(state).value;let payload=serializeSaveV2(expected);
    for(let i=0;i<8;i++){const loaded=ELEPHANT_CHECKPOINT_CODEC.parse(payload);assert.equal(loaded.ok,true);payload=ELEPHANT_CHECKPOINT_CODEC.serialize(loaded.value);assert.deepEqual(parseSaveV2(payload).value,expected);}
    assert.equal(parseSave(payload).code,'unsupported-schema','original V1 contract remains strict');
  }
});

test('migrated simulation preserves old time/RNG/care/mission/finance outcomes and pause/speed semantics',()=>{
  for(const id of ['midQ02','midVisitor','q04Claimed','longLedger']){
    const state=frozen.entries[id].state,a=createSimulation(state),b=createSimulation(legacySimulationState(migrateSaveV1(state).value));
    a.setPaused(true);b.setPaused(true);a.advance(999999);b.advance(999999);assert.equal(a.inspect().tick,state.tick);assert.equal(b.inspect().tick,state.tick);a.setPaused(false);b.setPaused(false);
    for(let i=0;i<30;i++){a.advance(100);b.advance(100);}
    const next=b.snapshot();next.world.height=10;next.world.tiles=next.world.tiles.slice(0,120);assert.deepEqual(next,a.snapshot(),id);a.dispose();b.dispose();
  }
});

test('corrupt unsupported oversize unknown and unimplemented future content rejects without repair or input mutation',()=>{
  const source=migrateSaveV1(frozen.entries.q04Claimed.state).value;
  for(const change of [s=>s.schemaVersion=3,s=>s.currency++,s=>s.world.tiles.pop(),s=>s.world.habitats[0].kind='elephant-grove',s=>s.elephantGrove.grant={amount:1400},s=>s.animals.push({...s.animals[0],id:'elephant-ayu',speciesId:'elephas-maximus'}),s=>s.future={},s=>s.world.habitats.extra=true,s=>s.missions.completedIds.pop()]){
    const bad=structuredClone(source);change(bad);const before=structuredClone(bad);assert.equal(validateSaveV2(bad).ok,false);assert.deepEqual(bad,before);assert.throws(()=>serializeSaveV2(bad));
  }
  assert.equal(parseSaveV2('{broken').code,'invalid-json');assert.equal(parseSaveV2(' '.repeat(1000001)).code,'too-large');
  assert.equal(ELEPHANT_CHECKPOINT_CODEC.parse(JSON.stringify({...frozen.entries.new.state,currency:-1})).ok,false);
});

test('otherwise valid custom legacy layouts refuse this expansion while leaving their original V1 data valid',()=>{
  const s=createInitialState();s.world.height=11;for(let x=0;x<12;x++)s.world.tiles.push({cell:{x,z:10},terrain:'land',occupantId:null,path:false});
  assert.equal(validateSave(s).ok,true);const before=structuredClone(s),r=migrateSaveV1(s);assert.equal(r.ok,false);assert.equal(r.code,'unsupported-schema');assert.equal(r.path,'$.world.unsupported-layout');assert.deepEqual(s,before);assert.equal(validateSave(s).ok,true);
});

test('future EH proof metadata and elephant resources block recovery as unsupported rather than recoverable corruption',()=>{
  const source=migrateSaveV1(frozen.entries.q04Claimed.state).value;
  for(const change of [s=>s.elephantGrove.futureMissions={completedIds:['EH01']},s=>s.world.resources[0].kind='elephant-feeder']){
    const newer=structuredClone(source);change(newer);const payload=JSON.stringify(newer),raw={format:2,generation:'newer-content',revision:9,writtenAt:1,writer:'future-code',payload};
    assert.equal(validateSaveV2(newer).code,'unsupported-schema');assert.equal(inspectCheckpoint(raw,ELEPHANT_CHECKPOINT_CODEC).problem,'unsupported-schema');assert.equal(raw.payload,payload);assert.throws(()=>serializeSaveV2(newer));
  }
});

test('checkpoint codec is explicitly opt-in; default legacy reader rejects V2 rather than downgrading it',()=>{
  const original=frozen.entries.q04Claimed.state,payload=encodeCheckpointState(original,ELEPHANT_CHECKPOINT_CODEC),raw={format:2,generation:'v2-test',revision:1,writtenAt:1,writer:'v2-test',payload};
  assert.equal(JSON.parse(payload).schemaVersion,2);assert.throws(()=>checkedCheckpoint(raw));assert.equal(checkedCheckpoint(raw,ELEPHANT_CHECKPOINT_CODEC).payload,payload);
  assert.deepEqual(stateFromCheckpoint(raw,ELEPHANT_CHECKPOINT_CODEC),legacySimulationState(migrateSaveV1(original).value));
});

test('actual autosave boundary restores legacy progress, writes only V2, and cold Continue preserves the migrated snapshot',async()=>{
  const source=frozen.entries.q04Claimed.state;let record={format:2,generation:'v2-autosave',revision:7,writtenAt:1,writer:'old-test',payload:JSON.stringify(source)},writes=0;
  const backend={codec:ELEPHANT_CHECKPOINT_CODEC,async read(){return structuredClone(record);},async commit(expected,payload,writer,writtenAt){assert.equal(expected,record.revision);assert.equal(JSON.parse(payload).schemaVersion,2);writes++;record={...record,revision:expected+1,payload,writer,writtenAt};return structuredClone(record);},close(){}};
  let save=createAutosave(backend,{writer:'new-test'});await save.load();assert.equal(writes,0);assert.equal(await save.continueSaved(),true);const expected=save.session.read();assert.equal(expected.world.height,18);assert.deepEqual(projection(migrateSaveV1(expected).value),source);
  save.session.checkpoint(()=>expected,true);await save.flush();assert.ok(writes>=1);const committed=record.payload;save.dispose();
  save=createAutosave(backend,{writer:'cold-test'});await save.load();assert.equal(await save.continueSaved(),true);assert.deepEqual(save.session.read(),expected);assert.equal(record.payload,committed);save.dispose();
});
