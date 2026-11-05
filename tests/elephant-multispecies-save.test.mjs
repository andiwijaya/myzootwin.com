import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {syntheticElephantSave} from './fixtures/elephant-v2-world.ts';
import {validateSaveV2,serializeSaveV2,parseSaveV2,ZOO_CHECKPOINT_CODEC,ELEPHANT_CHECKPOINT_CODEC,legacySimulationState} from '../src/game/persistence/save-v2.ts';
import {createAutosave} from '../src/game/persistence/autosave.ts';
import {inspectCheckpoint,stateFromCheckpoint,summarize} from '../src/game/persistence/checkpoint.ts';
import {compactFinance,coherentMoney,ledgerProof} from '../src/game/economy/journal.ts';
import {validateSave} from '../src/game/persistence/save-v1.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));
const fixture=()=>syntheticElephantSave(frozen.entries.q04Claimed.state);

test('full V2 persists two species, two habitats, all elephant facilities and names without a lossy legacy projection',()=>{
  const s=fixture(),before=structuredClone(s);assert.equal(s.animals.length,4);assert.equal(s.world.habitats.length,2);assert.equal(s.world.resources.length,9);assert.deepEqual(s.animals.slice(2).map(a=>a.name),['Ayu','Nara']);
  let payload=serializeSaveV2(s);for(let i=0;i<10;i++){const decoded=ZOO_CHECKPOINT_CODEC.parse(payload);assert.equal(decoded.ok,true);assert.deepEqual(decoded.value,s);payload=ZOO_CHECKPOINT_CODEC.serialize(decoded.value);}
  assert.deepEqual(s,before);assert.throws(()=>legacySimulationState(s));assert.equal(ELEPHANT_CHECKPOINT_CODEC.parse(payload).code,'unsupported-schema');
  const raw={format:2,generation:'mixed-species',revision:5,writtenAt:1,writer:'qa-v2',payload};assert.deepEqual(stateFromCheckpoint(raw,ZOO_CHECKPOINT_CODEC),s);assert.equal(summarize(raw,ZOO_CHECKPOINT_CODEC).birds,2);
});

test('strict multispecies boundary rejects wrong ownership, duplicate IDs, malformed footprints, flying, off-map motion and orphan resources',()=>{
  const source=fixture();
  for(const change of [s=>s.animals[2].habitatId=s.world.habitats[0].id,s=>s.animals[0].habitatId=s.world.habitats[1].id,s=>s.world.resources.at(-1).habitatId=s.world.habitats[0].id,s=>s.animals[2].id=s.animals[0].id,s=>s.animals.pop(),s=>s.animals.push(structuredClone(s.animals[2])),s=>s.world.habitats[1].cells.pop(),s=>s.animals[2].motion.elevation=2,s=>s.animals[2].position.x=100,s=>s.animals[2].motion.waypoints=[{x:1,z:1}],s=>s.animals[2].motion.waypointIndex=2,s=>s.world.resources.at(-1).approaches=[{x:1,z:1}],s=>s.animals[2].currentBehavior='eat',s=>s.world.tiles.reverse(),s=>s.world.tiles.find(t=>t.occupantId==='habitat-qa-v2').occupantId=null]){
    const bad=structuredClone(source);change(bad);const before=structuredClone(bad);assert.equal(validateSaveV2(bad).ok,false);assert.throws(()=>serializeSaveV2(bad));assert.deepEqual(bad,before);
  }
});

test('conservation grant and EH reward proofs must match the one cash ledger and cannot forge Q04 eligibility or duplicate claims',()=>{
  const source=fixture();for(const change of [s=>s.elephantGrove.grant=null,s=>s.elephantGrove.grant.command=s.economy.nextCommand,s=>s.elephantGrove.grant.ledgerEntryId='missing',s=>s.elephantGrove.grant.tick++,s=>s.elephantGrove.missions.completedIds.push('EH01'),s=>s.elephantGrove.missions.rewards[0].award='gentle-giants',s=>s.elephantGrove.missions.completedIds.push('EH02'),s=>s.currency++]){const bad=structuredClone(source);change(bad);assert.equal(validateSaveV2(bad).ok,false);}
  const locked=structuredClone(source);locked.missions=frozen.entries.q04Ready.state.missions;assert.equal(validateSaveV2(locked).ok,false);
});

test('generic autosave Continue, flush and repeated cold Continue retain the complete V2 population and proofs',async()=>{
  const s=fixture();let record={format:2,generation:'mixed-autosave',revision:1,writtenAt:1,writer:'qa-v2',payload:serializeSaveV2(s)};
  const backend={codec:ZOO_CHECKPOINT_CODEC,async read(){return structuredClone(record);},async commit(expected,payload,writer,writtenAt){assert.equal(expected,record.revision);record={...record,revision:expected+1,payload,writer,writtenAt};return structuredClone(record);},close(){}};
  for(let i=0;i<3;i++){const save=createAutosave(backend,{writer:`qa-cold-${i}`});await save.load();assert.equal(save.view().savedBirds,2);assert.equal(await save.continueSaved(),true);assert.deepEqual(save.session.read(),s);save.session.checkpoint(()=>s,true);await save.flush();save.dispose();assert.deepEqual(parseSaveV2(record.payload).value,s);}
});

test('unknown future V2 content stays unsupported and the unpublished migration-only payload normalizes without resetting legacy progress',()=>{
  const s=fixture();for(const change of [v=>v.elephantGrove.future={},v=>v.elephantGrove={grant:{amount:1400}},v=>v.animals[2].futureMotion={},v=>v.world.resources.at(-1).kind='future-resource']){const v=structuredClone(s);change(v);const payload=JSON.stringify(v),raw={format:2,generation:'future-v2',revision:1,writtenAt:1,writer:'qa-future',payload};assert.equal(inspectCheckpoint(raw,ZOO_CHECKPOINT_CODEC).problem,'unsupported-schema');assert.equal(raw.payload,payload);}
  const migrated=ZOO_CHECKPOINT_CODEC.parse(JSON.stringify(frozen.entries.q04Claimed.state)).value;const prototype={...migrated,elephantGrove:{grant:null}};const decoded=parseSaveV2(JSON.stringify(prototype));assert.equal(decoded.ok,true);assert.deepEqual(decoded.value,migrated);assert.equal(prototype.elephantGrove.missions,undefined);
});

test('finance compaction retains conservation and EH cash proofs together with legacy rewards and one balanced ledger',()=>{
  const s=fixture(),herd=s.animals.filter(a=>a.speciesId==='elephas-maximus'),m=s.elephantGrove.missions;
  for(const a of herd){a.foodEaten=1;a.waterDrunk=1;}
  m.objectives.fedIds=herd.map(a=>a.id);m.objectives.wateredIds=herd.map(a=>a.id);m.objectives.comfortableTicks=50;
  const command=s.economy.nextCommand++;s.currency+=150;s.ledger.push({id:'mission-eh02',operationId:'claim-eh02',kind:'reward',amount:150,balanceAfter:s.currency,tick:s.tick,relatedId:'eh02'});
  m.completedIds.push('EH02');m.currentId='EH03';m.rewards.push({missionId:'EH02',tick:s.tick,command,ledgerEntryId:'mission-eh02',award:null});
  assert.equal(validateSaveV2(s).ok,true);const coins=s.currency,proof=structuredClone(s.elephantGrove);
  assert.equal(compactFinance(s,[],true),true);assert.equal(s.ledger.length,0);assert.equal(coherentMoney(s),true);assert.equal(validateSaveV2(s).ok,true);
  assert.equal(ledgerProof(s,'elephant-expansion-grant-v1').amount,1400);assert.equal(ledgerProof(s,'mission-eh02').amount,150);assert.deepEqual(s.elephantGrove,proof);assert.equal(s.currency,coins);
  assert.deepEqual(parseSaveV2(serializeSaveV2(s)).value,s);const missing=structuredClone(s);missing.economy.checkpoint.rewards=missing.economy.checkpoint.rewards.filter(e=>e.id!=='mission-eh02');assert.equal(validateSaveV2(missing).ok,false);
});

test('locked and migrated metadata validate by values independent of JSON object insertion order',()=>{
  const s=ZOO_CHECKPOINT_CODEC.parse(JSON.stringify(frozen.entries.new.state)).value,m=s.elephantGrove.missions;
  m.objectives=Object.fromEntries(Object.entries(m.objectives).reverse());s.elephantGrove.missions=Object.fromEntries(Object.entries(m).reverse());
  assert.equal(validateSaveV2(s).ok,true);assert.equal(legacySimulationState(s).currency,1500);
});

test('new habitat and facilities require their own exact unrefunded construction proof, not an unrelated balanced debit',()=>{
  for(const id of ['habitat-qa-v2','qa-elephant-resource-0']){
    const s=fixture(),payment=s.ledger.find(e=>e.kind==='build'&&e.relatedId===id);payment.relatedId='unrelated-purchase';assert.equal(coherentMoney(s),true);assert.equal(validateSaveV2(s).ok,false);
    const cheap=fixture(),entry=cheap.ledger.find(e=>e.kind==='build'&&e.relatedId===id);entry.amount=-1;let balance=cheap.economy.checkpoint.balance;for(const e of cheap.ledger){balance+=e.amount;e.balanceAfter=balance;}cheap.currency=balance;assert.equal(coherentMoney(cheap),true);assert.equal(validateSaveV2(cheap).ok,false);
  }
});

test('resource revision is an operation counter, not elapsed ticks: otherwise valid legacy saves retain it losslessly',()=>{
  const source=structuredClone(frozen.entries.q04Claimed.state);source.world.resources[0].revision=source.tick+500;assert.equal(validateSave(source).ok,true);
  const migrated=ZOO_CHECKPOINT_CODEC.parse(JSON.stringify(source));assert.equal(migrated.ok,true);assert.equal(migrated.value.world.resources[0].revision,source.world.resources[0].revision);assert.deepEqual(legacySimulationState(migrated.value).world.resources,source.world.resources);
});
