import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {appendLionZone} from '../src/game/world/lion-expansion.ts';
import {parseSaveV2,serializeSaveV2} from '../src/game/persistence/save-v2.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {sceneOrigin,toScene,sceneToCell} from '../src/game/world/scene-coordinates.ts';
import {habitatSpecies,resourceSpecies,isLion,isElephant,SPECIES} from '../src/game/core/species.ts';
import {LION_LIMITS,LION_PRICES} from '../src/game/animals/lions/rules.ts';
import {prepareSpeciesHabitat,validateSpeciesHabitatPlacement} from '../src/game/world/species-habitat.ts';
import {visitorRoute,visitTargets} from '../src/game/visitors/graph.ts';
import {Box3,OrthographicCamera,Vector3} from 'three';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
const golden=JSON.parse(readFileSync(new URL('./fixtures/lion-v2-golden.json',import.meta.url),'utf8'));
test('frozen earned V2 baseline has exact codec, funds, Q/EH, resident, clock, journal and cold-pause equality',()=>{
 const text=serializeSaveV2(golden.state);assert.equal(createHash('sha256').update(text).digest('hex'),golden.sha256);
 assert.equal(golden.state.elephantGrove.missions.completedIds.length,4);assert.equal(golden.state.missions.completedIds.length,4);assert.equal(golden.state.animals.length,4);
 const loaded=parseSaveV2(text);assert.ok(loaded.ok);const sim=createSimulation(loaded.value);sim.setPaused(true);sim.advance(86400000);assert.equal(serializeSaveV2(sim.snapshot()),text);sim.dispose();
});
test('lion ownership is a distinct discriminant and capacity is derived from one bounded species config',()=>{
 assert.equal(SPECIES['panthera-leo'].footprint,7);assert.equal(SPECIES['panthera-leo'].residents,LION_LIMITS.residents);
 assert.equal(habitatSpecies('lion-savanna'),'panthera-leo');for(const k of ['lion-meat','lion-water','lion-den','lion-kopje','lion-scent','lion-scratch'])assert.equal(resourceSpecies(k),'panthera-leo');
 assert.equal(isLion(golden.state.animals[0]),false);assert.equal(isElephant({speciesId:'panthera-leo'}),false);
});
test('append-only V3 design preserves every one of 216 cells, old coordinates and fixed scene anchor',()=>{
 const before=structuredClone(golden.state.world),next=appendLionZone(before);assert.equal(next.tiles.length,312);assert.deepEqual(next.tiles.slice(0,216),before.tiles);assert.deepEqual(next.gate,before.gate);assert.deepEqual(sceneOrigin(next),sceneOrigin(before));
 for(const t of before.tiles){assert.deepEqual(toScene(t.cell,next),toScene(t.cell,before));assert.deepEqual(sceneToCell(toScene(t.cell,next),next),t.cell);}assert.deepEqual(appendLionZone(next),next);assert.deepEqual(golden.state.world,before);
 for(const change of [w=>w.height=25,w=>w.tiles.pop(),w=>w.tiles[1].cell.x=0]){const w=structuredClone(before);change(w);assert.throws(()=>appendLionZone(w));}
});
test('grant supports all priced fixtures, a twelve-path connector and paid first service with reserve',()=>{
 const total=LION_PRICES.habitat+2*LION_PRICES['lion-meat']+LION_PRICES['lion-water']+LION_PRICES['lion-den']+LION_PRICES['lion-kopje']+LION_PRICES['lion-scent']+LION_PRICES['lion-scratch']+12*15+2*LION_PRICES.foodRefill+LION_PRICES.waterRefill+2*LION_PRICES.enrichmentRefill+6;
 assert.ok(LION_PRICES.grant-total>=200);assert.equal(LION_LIMITS.habitatCells,7*7);
});
test('design footprint has outside connected viewing, physical corridor and no old scenery/path collision; broken route cannot teleport',()=>{
 let w=appendLionZone(golden.state.world);assert.equal(validateSpeciesHabitatPlacement(w,{x:3,z:18},'lion-savanna').reason,'ready');
 const result=prepareSpeciesHabitat(w,{x:3,z:18},'habitat-lion-design','lion-savanna');assert.ok(result.ok);w=result.world;assert.equal(w.habitats.at(-1).cells.length,49);
 for(let z=9;z<=21;z++)w.tiles.find(t=>t.cell.x===1&&t.cell.z===z).path=true;
 w.tiles.find(t=>t.cell.x===2&&t.cell.z===21).path=true;const route=visitorRoute(w,w.gate,{x:2,z:21});assert.ok(route.length>1);
 assert.ok(visitTargets(w).some(t=>t.habitatId==='habitat-lion-design'));assert.ok(route.every(c=>!w.habitats.at(-1).cells.some(p=>p.x===c.x&&p.z===c.z)));
 w.tiles.find(t=>t.cell.x===1&&t.cell.z===18).path=false;assert.deepEqual(visitorRoute(w,w.gate,{x:2,z:21}),[]);
 for(const p of [{x:3,z:17},{x:6,z:18},{x:-1,z:18},{x:3,z:20}])assert.notEqual(validateSpeciesHabitatPlacement(appendLionZone(golden.state.world),p,'lion-savanna').reason,'ready');
 const blocked=appendLionZone(golden.state.world);blocked.tiles.find(t=>t.cell.x===4&&t.cell.z===20).path=true;assert.equal(validateSpeciesHabitatPlacement(blocked,{x:3,z:18},'lion-savanna').reason,'path');
});
test('expanded fixed-anchor bounds fit at all three viewport shapes and 45-degree camera rotations',()=>{
 const bounds=new Box3(new Vector3(-6,-.4,-5),new Vector3(6,3.4,21));
 for(const [width,height] of [[1366,768],[360,780],[780,360]])for(const angle of [0,Math.PI/4,-Math.PI/4]){
  const camera=new OrthographicCamera();fitIsometricCamera(camera,bounds,width/height,angle);
  for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z])for(const y of [bounds.min.y,bounds.max.y]){const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1);}
 }
});
