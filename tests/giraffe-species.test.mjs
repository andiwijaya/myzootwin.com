import test from 'node:test';import assert from 'node:assert/strict';
import {GIRAFFE_SPECIES,GIRAFFE_RESOURCE_KINDS,GIRAFFE_BEHAVIORS,isGiraffe,giraffes,giraffeResources,initialGiraffeProgress,GQ_IDS} from '../src/game/core/giraffe-state.ts';
import {GIRAFFE_LIMITS,GIRAFFE_WELFARE} from '../src/game/animals/giraffes/rules.ts';
test('giraffe V4 discriminants select only giraffes and never old species or care',()=>{
 assert.deepEqual(GIRAFFE_SPECIES,{id:'giraffa-sp',habitatKind:'giraffe-plains',footprint:7,residents:3,movement:'giraffe-ground'});
 const animals=['ara-ararauna','elephas-maximus','panthera-leo','giraffa-sp'].map(speciesId=>({speciesId}));assert.equal(giraffes(animals).length,1);assert.equal(isGiraffe(animals[0]),false);
 assert.deepEqual(giraffeResources([...GIRAFFE_RESOURCE_KINDS,'food','lion-meat','elephant-browse'].map(kind=>({kind}))).map(r=>r.kind),GIRAFFE_RESOURCE_KINDS);
 for(const phase of ['roar','fly','spray','climb-ramp'])assert.equal(GIRAFFE_BEHAVIORS.includes(phase),false);
 assert.equal(GIRAFFE_LIMITS.tiles,624);assert.equal(GIRAFFE_LIMITS.habitatCells,49);assert.equal(Object.values(GIRAFFE_WELFARE).reduce((n,x)=>n+x,0),1);
});
test('giraffe progress starts without grant, resources, completion or old quest pollution',()=>{
 const a=initialGiraffeProgress(),b=initialGiraffeProgress();assert.equal(a.grant,null);assert.deepEqual(GQ_IDS,['GQ01','GQ02','GQ03','GQ04']);assert.equal(a.missions.currentId,'GQ01');assert.equal(a.missions.completedIds.length,0);a.missions.objectives.fedIds.push('synthetic');assert.equal(b.missions.objectives.fedIds.length,0);
});
