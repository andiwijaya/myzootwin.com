import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {careMissionView,evaluateMissions} from '../src/game/missions/engine.ts';
import {thrivingCondition} from '../src/game/missions/thriving-objective.ts';
import {parseSave,serializeSave} from '../src/game/persistence/save-v1.ts';
import {SPECIES,MACAW_SPECIES_ID,ELEPHANT_SPECIES_ID,isMacaw,isElephant,macaws,elephants,compatibleHabitat,compatibleResource} from '../src/game/core/species.ts';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));

test('species narrowing keeps original birds separate from ground elephants without reordering or mutating entities',()=>{
  const birds=createInitialState().animals,herd=[{id:'ayu',speciesId:ELEPHANT_SPECIES_ID},{id:'nara',speciesId:ELEPHANT_SPECIES_ID}],mixed=[herd[0],birds[0],herd[1],birds[1]],before=structuredClone(mixed);
  assert.deepEqual(macaws(mixed),birds);assert.deepEqual(elephants(mixed),herd);assert.equal(macaws(mixed)[0],birds[0]);
  assert.equal(isMacaw(herd[0]),false);assert.equal(isElephant(birds[0]),false);assert.deepEqual(mixed,before);
  assert.deepEqual(SPECIES[MACAW_SPECIES_ID],{habitatKind:'macaw-aviary',footprint:2,residents:2,movement:'avian'});
  assert.deepEqual(SPECIES[ELEPHANT_SPECIES_ID],{habitatKind:'elephant-grove',footprint:6,residents:2,movement:'ground'});
  assert.ok(Object.isFrozen(SPECIES)&&Object.values(SPECIES).every(Object.isFrozen));
});

test('cross-species habitat and resource ownership rejects matching ID with wrong kind and wrong parent',()=>{
  const bird=createInitialState().animals[0],elephant={speciesId:ELEPHANT_SPECIES_ID},aviary={id:'bird-home',kind:'macaw-aviary'},grove={id:'elephant-home',kind:'elephant-grove'};
  assert.equal(compatibleHabitat(bird,aviary),true);assert.equal(compatibleHabitat(elephant,grove),true);
  assert.equal(compatibleHabitat(bird,grove),false);assert.equal(compatibleHabitat(elephant,aviary),false);
  for(const kind of ['food','water','perch']){assert.equal(compatibleResource({kind,habitatId:aviary.id},aviary),true);assert.equal(compatibleResource({kind,habitatId:grove.id},grove),false);}
  for(const kind of ['elephant-browse','elephant-water','elephant-pond','elephant-shade','elephant-log']){assert.equal(compatibleResource({kind,habitatId:grove.id},grove),true);assert.equal(compatibleResource({kind,habitatId:aviary.id},aviary),false);assert.equal(compatibleResource({kind,habitatId:'other'},grove),false);}
  assert.equal(compatibleResource({kind:'unrecognized',habitatId:grove.id},grove),false);
  assert.equal(compatibleHabitat(elephant,{kind:'unrecognized'}),false);
});

test('legacy Q02 care and consumed-bird evidence exclude elephant counters at the mixed-state seam',()=>{
  const s=structuredClone(baseline.entries.midQ02.state),before=careMissionView(s),thriving=thrivingCondition(s);
  // Deliberately bypass V1 codec only at this pure evaluator seam; not a valid V1 save.
  s.animals.push({...s.animals[0],id:'a-elephant',speciesId:ELEPHANT_SPECIES_ID,foodEaten:999,waterDrunk:999});
  assert.deepEqual(careMissionView(s),before);assert.deepEqual(thrivingCondition(s),thriving);evaluateMissions(s);
  assert.deepEqual(s.missions.objectives.birdsFedIds,['macaw-1','macaw-2']);assert.deepEqual(s.missions.objectives.birdsWateredIds,['macaw-1','macaw-2']);
  assert.equal(parseSave(JSON.stringify(s)).ok,false,'V1 codec must not silently accept new species');
});

test('all frozen legacy states still use the exact V1 codec contract after introducing shared species types',()=>{
  for(const {state} of Object.values(baseline.entries))assert.deepEqual(parseSave(serializeSave(state)).value,state);
});
