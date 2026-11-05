import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3} from 'three';
import {migrateSaveV1,validateSaveV2,serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {prepareElephantConstruction,elephantHabitatView} from '../src/game/economy/elephant-construction.ts';
import {createPlacementPlanner} from '../src/game/world/placement-preview.ts';
import {validateSpeciesHabitatPlacement} from '../src/game/world/species-habitat.ts';
import {createElephantHabitatScene} from '../src/game/render3d/elephant-habitat-scene.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {createPathScene} from '../src/game/render3d/path-scene.ts';
import {presentSelection} from '../src/game-entry/selection-presentation.ts';
import {visitTarget,visitTargetForState} from '../src/game/visitors/graph.ts';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries;
const source=()=>migrateSaveV1(fixtures.q04Claimed.state).value,anchor={x:3,z:11};

test('paid grove is one pure validated 650 ZC transaction preserving the old world, residents, missions and grant',()=>{
 const s=source(),before=structuredClone(s),r=prepareElephantConstruction(s,anchor,'habitat-paid-grove',s.economy.nextCommand);
 assert.equal(r.ok,true);assert.deepEqual(s,before);assert.equal(r.state.currency,s.currency-650);assert.equal(r.state.economy.nextCommand,s.economy.nextCommand+1);assert.equal(r.state.ledger.at(-1).amount,-650);assert.equal(r.state.ledger.at(-1).relatedId,r.habitatId);
 assert.equal(r.state.world.tiles.filter(t=>t.occupantId===r.habitatId).length,36);assert.equal(r.state.world.habitats.length,2);assert.equal(r.state.animals.length,2);assert.deepEqual(r.state.world.tiles.slice(0,120),s.world.tiles.slice(0,120));assert.deepEqual(r.state.animals,s.animals);assert.deepEqual(r.state.missions,s.missions);assert.deepEqual(r.state.elephantGrove,s.elephantGrove);assert.equal(validateSaveV2(r.state).ok,true);
});

test('Q04 ready cannot build until its reward is claimed, and V1 or stale commands cannot bypass the gate',()=>{
 const ready=migrateSaveV1(fixtures.q04Ready.state).value;
 assert.equal(elephantHabitatView(ready).reason,'locked');assert.equal(prepareElephantConstruction(ready,anchor,'habitat-locked',ready.economy.nextCommand).reason,'locked');assert.equal(prepareElephantConstruction(fixtures.q04Claimed.state,anchor,'habitat-v1',0).reason,'locked');
 const s=createSimulation(ready);assert.equal(s.claimMission({id:'Q04',command:s.commandRevision()}).ok,true);assert.equal(s.elephantHabitatView().canBuild,true);const before=serializeSaveV2(s.snapshot());assert.equal(s.buildElephantHabitat(anchor,'habitat-stale',s.commandRevision()-1).ok,false);assert.equal(serializeSaveV2(s.snapshot()),before);s.dispose();
});

test('duplicate and changed-position confirms cannot debit twice; caps are independent and cold reload is exact',()=>{
 const s=createSimulation(source()),command=s.commandRevision();assert.equal(s.buildElephantHabitat(anchor,'habitat-once',command).ok,true);const built=s.snapshot(),exact=serializeSaveV2(built);
 assert.equal(s.buildElephantHabitat(anchor,'habitat-once',command).ok,false);assert.equal(s.buildElephantHabitat(anchor,'habitat-once',s.commandRevision()).duplicate,true);assert.equal(s.buildElephantHabitat({x:2,z:11},'habitat-once',s.commandRevision()).ok,false);assert.equal(s.buildElephantHabitat({x:0,z:10},'habitat-second',s.commandRevision()).ok,false);assert.equal(serializeSaveV2(s.snapshot()),exact);assert.equal(s.elephantHabitatView().reason,'limit');
 const loaded=createSimulation(parseSaveV2(exact).value);assert.deepEqual(loaded.snapshot(),built);assert.equal(loaded.inspect().birdCount,2);assert.equal(loaded.inspect().occupiedTiles,40);assert.equal(loaded.macawAccess().habitats,1);assert.equal(loaded.inspect().habitatCount,2);loaded.dispose();s.dispose();
});

test('insufficient funds rejects the complete transaction without changing occupancy, command or ledger',()=>{
 const s=createSimulation(source());for(const tile of s.worldSnapshot().tiles.filter(t=>t.cell.z>=10&&(t.cell.x<3||t.cell.x>8))){if(s.inspect().currency<650)break;s.buildPath(tile.cell,s.commandRevision());}
 assert.ok(s.inspect().currency<650);assert.equal(s.elephantHabitatView().reason,'funds');const before=serializeSaveV2(s.snapshot());assert.equal(s.buildElephantHabitat(anchor,'habitat-poor',s.commandRevision()).reason,'funds');assert.equal(serializeSaveV2(s.snapshot()),before);s.dispose();
});

test('south-zone authority rejects an otherwise clear footprint crossing the legacy boundary',()=>{
 const s=source();s.world.habitats=[];s.world.resources=[];for(const tile of s.world.tiles){tile.terrain='land';tile.path=false;tile.occupantId=null;}
 // No scenery at x0,z9: the footprint is clear but its first row is still in legacy terrain.
 const result=validateSpeciesHabitatPlacement(s.world,{x:0,z:9},'elephant-grove');assert.equal(result.reason,'zone');assert.equal(result.proposal.cells.length,36);
});

test('actual paid planner Cancel, revalidation and stale/double Confirm preserve money atomically',()=>{
 const s=createSimulation(source()),before=serializeSaveV2(s.snapshot());let command=s.commandRevision(),commits=0;
 const planner=createPlacementPlanner(()=>s.worldSnapshot(),new Set(),()=>{},{validate:(w,a)=>validateSpeciesHabitatPlacement(w,a,'elephant-grove'),operationId:()=> 'habitat-planner-paid',commit:(p,id)=>{commits++;return s.buildElephantHabitat(p.anchor,id,command).ok;}});
 planner.begin();planner.choose(anchor);planner.cancel();assert.equal(serializeSaveV2(s.snapshot()),before);assert.equal(commits,0);
 planner.begin();planner.choose(anchor);const stale=planner.snapshot().revision;assert.equal(planner.confirm(stale-1),false);s.buildPath({x:0,z:17},s.commandRevision());assert.equal(planner.confirm(stale),false);assert.equal(s.inspect().habitatCount,1);command=s.commandRevision();planner.choose(anchor);const current=planner.snapshot().revision;assert.equal(planner.confirm(current),true);assert.equal(planner.confirm(current),false);assert.equal(s.inspect().currency,source().currency-15-650);assert.equal(s.inspect().habitatCount,2);planner.dispose();s.dispose();
});

test('pause and disposal reject construction while the original save remains exact',()=>{
 const s=createSimulation(source()),before=serializeSaveV2(s.snapshot());s.setPaused(true);assert.equal(s.buildElephantHabitat(anchor,'habitat-paused',s.commandRevision()).ok,false);assert.equal(serializeSaveV2(s.snapshot()),before);s.dispose();assert.equal(s.buildElephantHabitat(anchor,'habitat-closed',s.commandRevision()).ok,false);
});

test('an empty paid grove uses the existing removal/Undo proof without changing the aviary or granting free coins',()=>{
 const s=createSimulation(source());assert.equal(s.buildElephantHabitat(anchor,'habitat-empty-edit',s.commandRevision()).ok,true);const built=s.snapshot(),balance=built.currency,quote=s.quoteRemoval({kind:'habitat',id:'habitat-empty-edit'});assert.equal(quote.ok,true);assert.equal(quote.quote.refund,650);
 assert.equal(s.remove(quote.quote,'edit-000000000000000000000000000000ab').ok,true);assert.equal(s.inspect().currency,balance+650);assert.equal(s.inspect().occupiedTiles,4);assert.equal(s.undo('edit-000000000000000000000000000000ac',s.commandRevision()).ok,true);assert.equal(s.inspect().currency,balance);assert.deepEqual(s.worldSnapshot(),built.world);assert.deepEqual(s.snapshot().animals,built.animals);assert.deepEqual(s.snapshot().missions,built.missions);assert.equal(validateSaveV2(s.snapshot()).ok,true);s.dispose();
});

test('a closer empty grove cannot divert old aviary visitors or disable its attraction',()=>{
 const s=createSimulation(source());assert.equal(s.buildElephantHabitat({x:0,z:10},'habitat-empty',s.commandRevision()).ok,true);assert.equal(s.buildPath({x:1,z:9},s.commandRevision()).ok,true);const state=s.snapshot();assert.equal(visitTarget(state.world).habitatId,'habitat-empty');assert.equal(visitTargetForState(state).habitatId,state.world.habitats[0].id);assert.equal(s.visitorView().attraction.ready,true);for(let i=0;i<150;i++)s.advance(100);assert.equal(s.snapshot().visitors.every(v=>v.journey?.habitatId!=='habitat-empty'),true);assert.equal(validateSaveV2(s.snapshot()).ok,true);s.dispose();
});

test('original selectable enclosure uses one bounded reusable batch and exact anchored 6x6 bounds in both languages',()=>{
 const s=prepareElephantConstruction(source(),anchor,'habitat-rendered',source().economy.nextCommand).state,diorama=createTropicalDiorama(s.world),kit=createElephantHabitatScene(diorama.catalog),paths=createPathScene(diorama.catalog);
 try{kit.sync(s.world);paths.sync(s.world);assert.equal(kit.inspect().elephantHabitatMeshes,1);assert.ok(kit.inspect().elephantHabitatTriangles<1200);const box=new Box3().setFromObject(kit.group);assert.ok(Math.abs(box.min.x+3)<.001);assert.ok(Math.abs(box.max.x-3)<.001);assert.ok(Math.abs(box.min.z-6)<.001);assert.ok(Math.abs(box.max.z-12)<.001);
  const identity=diorama.catalog.identities.get('habitat-rendered');assert.equal(presentSelection(identity,'en').title,'Elephant Grove');assert.equal(presentSelection(identity,'id').title,'Kawasan Gajah');const geometries=kit.group.children.map(m=>m.geometry),materials=kit.group.children.map(m=>m.material);for(let i=0;i<30;i++)kit.sync(s.world);assert.deepEqual(kit.group.children.map(m=>m.geometry),geometries);assert.deepEqual(kit.group.children.map(m=>m.material),materials);
  kit.dispose();assert.equal(kit.inspect().elephantHabitatMeshes,0);assert.equal(diorama.catalog.identities.has('habitat-rendered'),false);
 }finally{kit.dispose();paths.dispose();kit.geometry.dispose();kit.material.dispose();paths.geometry.dispose();paths.material.dispose();for(const g of diorama.geometries)g.dispose();for(const m of diorama.materials)m.dispose();}
});
