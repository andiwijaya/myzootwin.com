import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSimulation} from '../src/game/core/simulation.ts';
import {migrateSaveV1,validateSaveV2,serializeSaveV2,parseSaveV2,legacySimulationState} from '../src/game/persistence/save-v2.ts';
import {syntheticElephantSave} from './fixtures/elephant-v2-world.ts';
import {createPlacementPlanner} from '../src/game/world/placement-preview.ts';
import {habitatBlockerKeys} from '../src/game/world/build-habitat.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));
const fixture=()=>syntheticElephantSave(frozen.entries.q04Claimed.state);
const foreign=s=>({animals:s.animals.filter(a=>a.speciesId==='elephas-maximus'),habitats:s.world.habitats.filter(h=>h.kind==='elephant-grove'),resources:s.world.resources.filter(r=>r.kind.startsWith('elephant-')),proof:s.elephantGrove});

test('one canonical V2 clock retains all dormant elephant records/proofs while original macaws and visitors advance',()=>{
  const source=fixture(),before=foreign(source),s=createSimulation(source);let ticks=0;s.subscribe(e=>{if(e.type==='tick')ticks++;});
  for(let i=0;i<100;i++)s.advance(100);const save=s.snapshot();assert.equal(save.schemaVersion,2);assert.equal(save.tick,source.tick+100);assert.equal(ticks,100);assert.equal(s.inspect().birdCount,2);assert.equal(s.birdSnapshot().animals.length,2);assert.deepEqual(foreign(save),before);assert.equal(validateSaveV2(save).ok,true);assert.deepEqual(parseSaveV2(serializeSaveV2(save)).value,save);s.dispose();assert.equal(s.inspect().subscribers,0);
});

test('macaw reserve and resource remove/rebuild/refill transactions never replace the other species in the canonical world',()=>{
  const s=createSimulation(fixture()),before=foreign(s.snapshot());assert.equal(s.birds('reserve'),true);assert.deepEqual(foreign(s.snapshot()),before);assert.equal(s.birdSnapshot().animals.every(a=>a.habitatId===null),true);
  assert.equal(s.food('remove',s.foodView().revision,s.commandRevision()).ok,true);assert.deepEqual(foreign(s.snapshot()),before);assert.equal(s.food('place',0,s.commandRevision()).ok,true);assert.equal(s.food('refill',s.foodView().revision,s.commandRevision()).ok,true);assert.equal(s.birds('welcome'),true);assert.deepEqual(foreign(s.snapshot()),before);assert.equal(s.snapshot().animals.length,4);assert.equal(validateSaveV2(s.snapshot()).ok,true);s.dispose();
});

test('shared path removal/Undo preserves the full mixed-species world and ledger with stale/double-command safety',()=>{
  const s=createSimulation(fixture()),before=foreign(s.snapshot()),cell={x:0,z:17};assert.equal(s.buildPath(cell,s.commandRevision()).ok,true);const quote=s.quoteRemoval({kind:'path',cell});assert.equal(quote.ok,true);assert.equal(s.remove(quote.quote,'edit-0000000000000000000000000000eeee').ok,true);assert.equal(s.undo('edit-0000000000000000000000000000eeef',s.commandRevision()).ok,true);assert.deepEqual(foreign(s.snapshot()),before);assert.equal(validateSaveV2(s.snapshot()).ok,true);const frozen=serializeSaveV2(s.snapshot());assert.equal(s.remove(quote.quote,'edit-0000000000000000000000000000eef0').ok,false);assert.equal(serializeSaveV2(s.snapshot()),frozen);s.dispose();
});

test('new V2 still builds and claims the original aviary mission with a tagged macaw habitat and no automatic grove/grant',()=>{
  const m=migrateSaveV1(frozen.entries.new.state);assert.equal(m.ok,true);const s=createSimulation(m.value);assert.equal(s.buildHabitat({x:4,z:4},'habitat-runtime-macaw',s.commandRevision()).ok,true);for(const [x,z]of[[1,7],[2,7],[3,7],[3,6],[3,5]])assert.equal(s.buildPath({x,z},s.commandRevision()).ok,true);assert.equal(s.claimMission({id:'Q01',command:s.commandRevision()}).ok,true);const save=s.snapshot();assert.equal(save.world.habitats[0].kind,'macaw-aviary');assert.equal(save.elephantGrove.grant,null);assert.equal(save.animals.length,2);assert.deepEqual(save.missions.completedIds,['Q01']);assert.equal(validateSaveV2(save).ok,true);s.dispose();
});

test('canonical V2 and original V1 tick partitions preserve identical macaw/visitor/RNG/cash results and pause freezes all records',()=>{
  const source=frozen.entries.q04Claimed.state,a=createSimulation(source),b=createSimulation(migrateSaveV1(source).value);a.setSpeed(10);b.setSpeed(10);for(let i=0;i<300;i++){a.advance(10);for(const delta of [1.7,2.3,6])b.advance(delta);}const projected=legacySimulationState(b.snapshot());projected.world.height=10;projected.world.tiles=projected.world.tiles.slice(0,120);assert.deepEqual(projected,a.snapshot());b.setPaused(true);const before=serializeSaveV2(b.snapshot());b.advance(86400000);assert.equal(serializeSaveV2(b.snapshot()),before);a.dispose();b.dispose();
});

test('expansion keeps the original starter preview anchor rather than moving a new aviary into south-side scenery',()=>{
  const world=migrateSaveV1(frozen.entries.new.state).value.world;let view;const planner=createPlacementPlanner(()=>world,habitatBlockerKeys(),next=>{view=next;});planner.begin();planner.move(0,0);assert.deepEqual(view.proposal.anchor,{x:5,z:4});assert.equal(view.reason,'ready');planner.dispose();
});
