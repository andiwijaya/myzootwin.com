import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3} from 'three';
import {migrateSaveV1,validateSaveV2,serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {prepareElephantWelcome,elephantResidentsView,elephantSpawnPair} from '../src/game/animals/elephants/residents.ts';
import {createElephantResidentsScene} from '../src/game/render3d/elephant-residents-scene.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {presentSelection} from '../src/game-entry/selection-presentation.ts';
import {visitTargetForState} from '../src/game/visitors/graph.ts';
import {isElephant,isMacaw} from '../src/game/core/species.ts';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries;
const source=()=>migrateSaveV1(fixtures.q04Claimed.state).value;
const built=(anchor={x:3,z:11})=>{const s=createSimulation(source());assert.equal(s.buildElephantHabitat(anchor,'habitat-residents',s.commandRevision()).ok,true);const result=s.snapshot();s.dispose();return result;};

test('welcome is a pure zero-cost addition of Ayu and Nara with stable identity, species, sex and valid separate interior homes',()=>{
 const s=built(),before=structuredClone(s),result=prepareElephantWelcome(s,s.economy.nextCommand);assert.equal(result.ok,true);assert.deepEqual(s,before);const next=result.state,herd=next.animals.filter(isElephant);
 assert.equal(herd.length,2);assert.deepEqual(herd.map(a=>[a.id,a.name,a.speciesId,a.sex]),[['elephant-ayu','Ayu','elephas-maximus','female'],['elephant-nara','Nara','elephas-maximus','female']]);assert.deepEqual(next.animals.filter(isMacaw),s.animals);assert.deepEqual(next.ledger,s.ledger);assert.deepEqual(next.economy,{...s.economy,nextCommand:s.economy.nextCommand+1});assert.equal(next.currency,s.currency);assert.equal(next.tick,s.tick);assert.equal(next.randomState,s.randomState);assert.deepEqual(next.world,s.world);assert.deepEqual(next.missions,s.missions);assert.deepEqual(next.elephantGrove,s.elephantGrove);assert.ok(Math.hypot(herd[0].position.x-herd[1].position.x,herd[0].position.z-herd[1].position.z)>=2.4);assert.equal(validateSaveV2(next).ok,true);
 for(const a of herd){assert.equal(a.habitatId,'habitat-residents');assert.equal(a.motion.phase,'idle');assert.equal('elevation'in a.motion,false);assert.equal(a.foodEaten,0);assert.equal(a.waterDrunk,0);}
});

test('welcome refuses V1, unclaimed Q04, missing home and stale command without mutating either source',()=>{
 for(const s of [fixtures.q04Claimed.state,migrateSaveV1(fixtures.q04Ready.state).value,source()]){const before=structuredClone(s);assert.equal(prepareElephantWelcome(s,s.economy.nextCommand).ok,false);assert.deepEqual(s,before);}
 const s=built(),before=serializeSaveV2(s);assert.equal(prepareElephantWelcome(s,s.economy.nextCommand-1).reason,'command');assert.equal(serializeSaveV2(s),before);
});

test('repeated welcome, stale input and cold Continue never create a third elephant or replace the original macaws',()=>{
 const s=createSimulation(built()),command=s.commandRevision();let events=0;s.subscribe(e=>{if(e.type==='elephants-welcomed')events++;});assert.equal(s.welcomeElephants(command).ok,true);const exact=serializeSaveV2(s.snapshot());
 for(let i=0;i<20;i++){assert.equal(s.welcomeElephants(command).ok,false);assert.equal(s.welcomeElephants(s.commandRevision()).ok,false);}assert.equal(events,1);assert.equal(serializeSaveV2(s.snapshot()),exact);assert.equal(s.elephantResidentsView().reason,'present');assert.equal(s.elephantSnapshot().animals.length,2);assert.equal(s.birdSnapshot().animals.length,2);
 for(let i=0;i<4;i++){const cold=createSimulation(parseSaveV2(exact).value);assert.equal(serializeSaveV2(cold.snapshot()),exact);assert.equal(cold.welcomeElephants(cold.commandRevision()).ok,false);cold.dispose();}s.dispose();
});

test('spawn planner deterministically avoids a blocked preferred arrival and refuses when no separate pair fits',()=>{
 const s=built(),original=elephantSpawnPair(s);assert.deepEqual(original,[{x:4.5,z:13.5},{x:7.5,z:13.5}]);s.world.resources.push({id:'qa-spawn-blocker',kind:'elephant-log',habitatId:'habitat-residents',cell:{x:4,z:13},stock:0,capacity:1,revision:0,approaches:[]});const pair=elephantSpawnPair(s);assert.ok(pair);assert.notDeepEqual(pair[0],original[0]);assert.deepEqual(elephantSpawnPair(s),pair);
 for(let z=12;z<16;z++)for(let x=4;x<8;x++)s.world.resources.push({id:`qa-block-${x}-${z}`,kind:'elephant-log',habitatId:'habitat-residents',cell:{x,z},stock:0,capacity:1,revision:0,approaches:[]});assert.equal(elephantSpawnPair(s),null);assert.equal(elephantResidentsView(s).reason,'space');
});

test('pause, disposal and occupied-habitat removal guard protect the actual resident records',()=>{
 const s=createSimulation(built()),before=serializeSaveV2(s.snapshot());s.setPaused(true);assert.equal(s.welcomeElephants(s.commandRevision()).ok,false);assert.equal(serializeSaveV2(s.snapshot()),before);s.setPaused(false);assert.equal(s.welcomeElephants(s.commandRevision()).ok,true);assert.equal(s.quoteRemoval({kind:'habitat',id:'habitat-residents'}).reason,'in-use');const exact=serializeSaveV2(s.snapshot());s.setPaused(true);s.advance(3600000);assert.equal(serializeSaveV2(s.snapshot()),exact);s.dispose();assert.equal(s.welcomeElephants(s.commandRevision()).ok,false);
});

test('populating a closer grove keeps an existing macaw visitor on its original habitat rather than aborting it',()=>{
 const s=createSimulation(built({x:0,z:10}));assert.equal(s.buildPath({x:1,z:9},s.commandRevision()).ok,true);const before=s.snapshot(),travellers=before.visitors.filter(v=>v.journey?.habitatId&&['entering','viewing'].includes(v.phase));assert.ok(travellers.length>0);const oldHome=before.world.habitats.find(h=>h.kind==='macaw-aviary').id;
 assert.equal(visitTargetForState(before).habitatId,oldHome);assert.equal(s.welcomeElephants(s.commandRevision()).ok,true);assert.equal(visitTargetForState(s.snapshot()).habitatId,'habitat-residents');for(const v of travellers){const after=s.snapshot().visitors.find(a=>a.id===v.id);assert.equal(after.journey.habitatId,oldHome);assert.equal(after.phase,v.phase);assert.deepEqual(after.position,v.position);assert.deepEqual(after.route,v.route);}
 for(let i=0;i<20;i++)s.advance(100);for(const v of travellers){const after=s.snapshot().visitors.find(a=>a.id===v.id);if(after)assert.notEqual(after.experience?.feedback?.reason,'access-lost');}assert.equal(validateSaveV2(s.snapshot()).ok,true);s.dispose();
});

test('legacy Q reward display excludes the conservation grant before and after residents, compaction and cold reload',()=>{
 const s=createSimulation(built()),before=s.snapshot().missions,oldCoins=s.missionView().rewards;assert.equal(oldCoins,60);const q={command:s.commandRevision()},grant=s.prepareConservationGrant(q);assert.equal(grant.ok,true);assert.equal(s.acceptCommittedGrant(grant.state,q),true);assert.equal(s.economyView().rewards,1460);assert.equal(s.missionView().rewards,60);assert.equal(s.welcomeElephants(s.commandRevision()).ok,true);
 for(let i=0;i<80;i++){assert.equal(s.buildPath({x:0,z:17},s.commandRevision()).ok,true);const quote=s.quoteRemoval({kind:'path',cell:{x:0,z:17}});assert.equal(quote.ok,true);assert.equal(s.remove(quote.quote,`edit-${(i+1).toString(16).padStart(32,'0')}`).ok,true);}assert.ok(s.inspect().journalCompactions>0);assert.deepEqual(s.snapshot().missions,before);assert.equal(s.missionView().rewards,60);assert.equal(s.economyView().rewards,1460);const cold=createSimulation(parseSaveV2(serializeSaveV2(s.snapshot())).value);assert.equal(cold.missionView().rewards,60);assert.equal(cold.elephantSnapshot().animals.length,2);cold.dispose();s.dispose();
});

test('standing resident models are bounded, original and selectable, with stable shared material/geometry across repeated sync',()=>{
 const state=prepareElephantWelcome(built(),built().economy.nextCommand).state,diorama=createTropicalDiorama(state.world),kit=createElephantResidentsScene(diorama.catalog),herd=state.animals.filter(isElephant);
 try{kit.sync(herd,12,18);assert.equal(kit.inspect().liveElephantModels,2);assert.equal(kit.inspect().elephantResidentGeometries,2);assert.equal(kit.inspect().elephantResidentMaterials,1);assert.ok(kit.inspect().elephantResidentTriangles<12000);const box=new Box3().setFromObject(kit.group);assert.ok(box.min.x>=-3&&box.max.x<=3);assert.ok(box.min.z>=6&&box.max.z<=12);assert.ok(box.min.y>=.078&&box.max.y<2);const ids=[...kit.group.children],geometries=ids.map(m=>m.geometry),material=ids[0].material;
  for(let i=0;i<30;i++)kit.sync(herd,12,18);assert.deepEqual(kit.group.children,ids);assert.deepEqual(ids.map(m=>m.geometry),geometries);assert.equal(ids[1].material,material);assert.equal(presentSelection(diorama.catalog.identities.get('elephant-ayu'),'en').title,'Ayu');assert.match(presentSelection(diorama.catalog.identities.get('elephant-nara'),'id').detail,/gajah Asia betina/);
  let disposed=0;geometries.forEach(g=>g.addEventListener('dispose',()=>disposed++));kit.dispose();kit.dispose();assert.equal(disposed,2);assert.equal(kit.inspect().liveElephantModels,0);assert.equal(kit.inspect().elephantResidentMaterials,0);assert.equal(diorama.catalog.identities.has('elephant-ayu'),false);assert.equal(diorama.catalog.batches.some(b=>ids.includes(b.mesh)),false);
 }finally{kit.dispose();for(const g of diorama.geometries)g.dispose();for(const m of diorama.materials)m.dispose();}
});
