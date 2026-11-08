import {validateSaveV4,migrateToV4} from '../src/game/persistence/save-v4.ts';
import {migrateToV5,projectUnstartedV5} from '../src/game/persistence/save-v5.ts';
import {prepareZebraConstruction} from '../src/game/economy/zebra-construction.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {ZEBRA_SPECIES_ID,ZEBRA_SPECIES,ZEBRA_RESIDENTS,ZEBRA_RESOURCE_KINDS,ZEBRA_BEHAVIORS,ZQ_IDS,initialZebraProgress,zebras,zebraResources} from '../src/game/core/zebra-state.ts';
import {SPECIES,habitatSpecies,resourceSpecies,compatibleHabitat,compatibleResource,macaws,elephants,lions} from '../src/game/core/species.ts';
import {giraffes,giraffeResources} from '../src/game/core/giraffe-state.ts';
import {validateSpeciesHabitatPlacement,prepareSpeciesHabitat} from '../src/game/world/species-habitat.ts';
import {validateZooSave} from '../src/game/persistence/save.ts';
import {readBaselineStates,canonical} from '../scripts/qa/zebra/baseline-fixtures.mjs';
test('the fifth registry entry owns exact Zebra resources and never enters old species selection',()=>{
 assert.equal(ZEBRA_SPECIES_ID,'equus-quagga');assert.equal(SPECIES[ZEBRA_SPECIES_ID],ZEBRA_SPECIES);assert.deepEqual(ZEBRA_SPECIES,{id:'equus-quagga',habitatKind:'zebra-grasslands',footprint:8,residents:4,movement:'zebra-ground'});
 const all=Object.keys(SPECIES).map(speciesId=>({speciesId}));assert.deepEqual([macaws(all).length,elephants(all).length,lions(all).length,giraffes(all).length,zebras(all).length],[1,1,1,1,1]);
 const resources=[...ZEBRA_RESOURCE_KINDS,'food','water','perch','elephant-browse','lion-meat','giraffe-browse'].map(kind=>({kind}));assert.deepEqual(zebraResources(resources).map(r=>r.kind),ZEBRA_RESOURCE_KINDS);assert.deepEqual(giraffeResources(resources).map(r=>r.kind),['giraffe-browse']);for(const kind of ZEBRA_RESOURCE_KINDS)assert.equal(resourceSpecies(kind),ZEBRA_SPECIES_ID);assert.equal(habitatSpecies('zebra-grasslands'),ZEBRA_SPECIES_ID);
 const habitat={id:'zebra-home',kind:'zebra-grasslands'};assert.equal(compatibleHabitat({speciesId:ZEBRA_SPECIES_ID},habitat),true);for(const a of all.filter(a=>a.speciesId!==ZEBRA_SPECIES_ID))assert.equal(compatibleHabitat(a,habitat),false);assert.equal(compatibleResource({kind:'zebra-graze',habitatId:habitat.id},habitat),true);assert.equal(compatibleResource({kind:'zebra-graze',habitatId:'different'},habitat),false);assert.equal(compatibleResource({kind:'food',habitatId:habitat.id},habitat),false);
 for(const phase of ['ascend','perch','spray','roar','browse','nuzzle','trunk-touch'])assert.equal(ZEBRA_BEHAVIORS.includes(phase),false);for(const phase of ['graze','drink','follow-herd','trot','groom','rest'])assert.equal(ZEBRA_BEHAVIORS.includes(phase),true);
});
test('stable four adult identities and ZQ progress round trip as plain independent data without rewards',()=>{
 assert.deepEqual(ZEBRA_RESIDENTS.map(r=>[r.id,r.name,r.sex]),[['zebra-zaki','Zaki','male'],['zebra-zuri','Zuri','female'],['zebra-mira','Mira','female'],['zebra-kira','Kira','female']]);assert.equal(new Set(ZEBRA_RESIDENTS.map(r=>r.id)).size,4);assert.ok(Object.isFrozen(ZEBRA_RESIDENTS)&&ZEBRA_RESIDENTS.every(Object.isFrozen));
 const a=initialZebraProgress(),b=initialZebraProgress();assert.deepEqual(ZQ_IDS,['ZQ01','ZQ02','ZQ03','ZQ04']);assert.deepEqual(JSON.parse(JSON.stringify(a)),a);assert.equal(a.unlock,null);assert.equal(a.grant,null);assert.equal(a.missions.currentId,'ZQ01');assert.deepEqual(a.missions.rewards,[]);assert.deepEqual(a.missions.completedIds,[]);a.missions.objectives.fedIds.push('zebra-zaki');a.missions.objectives.viewedVisitorIds.push('qa-visitor');assert.deepEqual(b.missions.objectives.fedIds,[]);assert.deepEqual(b.missions.objectives.viewedVisitorIds,[]);
});
test('V5 canonical dispatch is strict while historical codecs stay closed and unclaimed registry data cannot buy Zebra',()=>{
 for(const {id,state}of readBaselineStates()){const before=canonical(state),checked=validateZooSave(state);assert.equal(checked.ok,true,id);assert.equal(canonical(checked.value),before,id);const v5=migrateToV5(state);assert.equal(v5.ok,true);assert.equal(validateZooSave(v5.value).ok,true);assert.equal(validateSaveV4(v5.value).code,'unsupported-schema');assert.deepEqual(projectUnstartedV5(v5.value),migrateToV4(state).value);assert.equal(validateZooSave({...v5.value,schemaVersion:6}).ok,false);assert.equal(canonical(state),before,id+' input unchanged');}
 const state=readBaselineStates().find(x=>x.state.schemaVersion===4).state,before=canonical(state);assert.equal(validateSpeciesHabitatPlacement(state.world,{x:14,z:12},'zebra-grasslands').proposal.cells.length,64);assert.equal(prepareSpeciesHabitat(state.world,{x:14,z:12},'habitat-zebra-qa','zebra-grasslands').ok,true,'Pure geographic candidate only');const v5=migrateToV5(state).value;assert.equal(prepareZebraConstruction(v5,{x:14,z:12},'habitat-zebra-qa',v5.economy.nextCommand).reason,'locked');assert.equal(canonical(state),before);
});
