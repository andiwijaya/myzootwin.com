import {OrthographicCamera,Vector3} from 'three';
import {createElephantCarePreview} from '../src/game/render3d/elephant-care-preview.ts';
import {createElephantCareScene} from '../src/game/render3d/elephant-care-scene.ts';
import {createElephantResidentsScene} from '../src/game/render3d/elephant-residents-scene.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
import {sceneOrigin} from '../src/game/world/scene-coordinates.ts';
import {presentSelection} from '../src/game-entry/selection-presentation.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {stepElephantCare} from '../src/game/animals/elephants/care-simulation.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateSaveV1,validateSaveV2,serializeSaveV2} from '../src/game/persistence/save-v2.ts';
import {prepareConservationGrant} from '../src/game/economy/conservation-grant.ts';
import {prepareElephantConstruction} from '../src/game/economy/elephant-construction.ts';
import {prepareElephantWelcome} from '../src/game/animals/elephants/residents.ts';
import {defaultElephantCareCell,prepareElephantCarePlacement,prepareElephantCareRefill,validateElephantCarePlacement} from '../src/game/animals/elephants/care-resources.ts';
import {ELEPHANT_GROUND,elephantGroundRoute,groundDistance,groundPointAllowed,groundSegmentAllowed} from '../src/game/animals/elephants/ground.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries;
function home(withGrant=true){let s=migrateSaveV1(frozen.q04Claimed.state).value;if(withGrant)s=prepareConservationGrant(s,{command:s.economy.nextCommand}).state;s=prepareElephantConstruction(s,{x:3,z:11},'habitat-real-care',s.economy.nextCommand).state;return prepareElephantWelcome(s,s.economy.nextCommand).state;}
function place(s,kind,cell=defaultElephantCareCell(s,kind)){const r=prepareElephantCarePlacement(s,{command:s.economy.nextCommand,kind,cell});assert.equal(r.ok,true,JSON.stringify(r));return r.state;}

test('two actual paid browse feeders and one trough preserve the legacy world and create empty bounded stock with real separated water ports',()=>{
 const original=home(),before=structuredClone(original);let s=place(original,'elephant-browse');s=place(s,'elephant-browse');s=place(s,'elephant-water');assert.deepEqual(original,before);
 const props=s.world.resources.filter(r=>r.kind.startsWith('elephant-'));assert.deepEqual(props.map(r=>r.kind),['elephant-browse','elephant-browse','elephant-water']);assert.equal(s.currency,original.currency-250);assert.equal(s.economy.nextCommand,original.economy.nextCommand+3);assert.deepEqual(s.world.tiles,original.world.tiles);assert.deepEqual(s.world.habitats,original.world.habitats);assert.deepEqual(s.animals.filter(a=>a.speciesId!=='elephas-maximus'),original.animals.filter(a=>a.speciesId!=='elephas-maximus'));for(const a of s.animals.filter(a=>a.speciesId==='elephas-maximus')){const before=original.animals.find(b=>b.id===a.id);assert.deepEqual({...a,habitatFit:before.habitatFit,welfare:before.welfare},before);assert.ok(a.habitatFit<before.habitatFit);assert.ok(a.welfare<before.welfare);}assert.deepEqual(s.missions,original.missions);assert.deepEqual(s.elephantGrove,original.elephantGrove);
 for(const r of props){assert.equal(r.stock,0);assert.equal(r.capacity,8);assert.ok(r.approaches.length>=(r.kind==='elephant-water'?2:1));assert.equal(s.ledger.find(e=>e.relatedId===r.id).amount,r.kind==='elephant-browse'?-80:-90);}const water=props.at(-1);assert.ok(groundDistance(...water.approaches)>=ELEPHANT_GROUND.separation);assert.equal(validateSaveV2(s).ok,true);
});

test('preview and invalid/stale/capped placement never charge; zero-cost evaluation cannot mutate input',()=>{
 const original=home(),exact=serializeSaveV2(original),cell=defaultElephantCareCell(original,'elephant-browse'),command=original.economy.nextCommand;assert.equal(validateElephantCarePlacement(original,'elephant-browse',cell).reason,'ready');assert.equal(serializeSaveV2(original),exact);
 for(const bad of [null,{x:3.1,z:12},{x:2,z:12},{x:3,z:18}])assert.equal(prepareElephantCarePlacement(original,{command,kind:'elephant-browse',cell:bad}).ok,false);assert.equal(prepareElephantCarePlacement(original,{command:command-1,kind:'elephant-browse',cell}).reason,'stale');assert.equal(serializeSaveV2(original),exact);
 const first=place(original,'elephant-browse');assert.equal(prepareElephantCarePlacement(first,{command,kind:'elephant-browse',cell}).reason,'stale');assert.equal(validateElephantCarePlacement(first,'elephant-browse',cell).reason,'occupied');const second=place(first,'elephant-browse');assert.equal(validateElephantCarePlacement(second,'elephant-browse',{x:3,z:14}).reason,'limit');
 const water=place(second,'elephant-water'),saved=serializeSaveV2(water);assert.equal(validateElephantCarePlacement(water,'elephant-water',{x:8,z:15}).reason,'limit');assert.equal(serializeSaveV2(water),saved);
});

test('missing or unclaimed home and placement through an elephant or without usable approaches are refused',()=>{
 for(const s of [frozen.q04Claimed.state,migrateSaveV1(frozen.q04Ready.state).value,migrateSaveV1(frozen.q04Claimed.state).value])assert.equal(prepareElephantCarePlacement(s,{command:s.economy.nextCommand,kind:'elephant-browse',cell:{x:3,z:12}}).ok,false);
 const s=home();assert.equal(validateElephantCarePlacement(s,'elephant-browse',{x:4,z:13}).reason,'busy');assert.equal(validateElephantCarePlacement(s,'elephant-browse',{x:3,z:11}).reason,'ready');assert.equal(validateElephantCarePlacement(s,'elephant-water',{x:3,z:12}).reason,'space');
});

test('fixed-price refill changes actual stock, revision and supplies ledger once, with full/stale/duplicate refusal',()=>{
 let s=place(home(),'elephant-browse');s=place(s,'elephant-water');for(const kind of ['elephant-browse','elephant-water']){const r=s.world.resources.find(r=>r.kind===kind),before=structuredClone(s),q={command:s.economy.nextCommand,id:r.id,revision:r.revision},filled=prepareElephantCareRefill(s,q);assert.equal(filled.ok,true);assert.deepEqual(s,before);s=filled.state;const after=s.world.resources.find(x=>x.id===r.id);assert.equal(after.stock,8);assert.equal(after.revision,r.revision+1);assert.equal(s.currency,before.currency-(kind==='elephant-browse'?8:4));assert.equal(s.ledger.at(-1).kind,'supplies');assert.equal(s.ledger.at(-1).relatedId,r.id);const exact=serializeSaveV2(s);assert.equal(prepareElephantCareRefill(s,q).reason,'stale');assert.equal(prepareElephantCareRefill(s,{command:s.economy.nextCommand,id:r.id,revision:after.revision}).reason,'full');assert.equal(serializeSaveV2(s),exact);}
 assert.equal(validateSaveV2(s).ok,true);
});

test('bounded ground routing goes around the other resident and every continuous segment respects real clearances',()=>{
 const s=home(),h=s.world.habitats.find(h=>h.kind==='elephant-grove'),from={x:4.5,z:13.5},to={x:7.5,z:15.5},other={x:7.5,z:13.5},before=structuredClone(s.world),route=elephantGroundRoute(s.world,h,from,to,[other]);assert.ok(route);assert.ok(route.length<=18);assert.deepEqual(route.at(-1),to);assert.deepEqual(s.world,before);
 for(let i=0;i<route.length;i++){assert.equal(groundPointAllowed(s.world,h,route[i],[other]),true);if(i)assert.equal(groundSegmentAllowed(s.world,h,route[i-1],route[i],[other]),true);}assert.equal(groundSegmentAllowed(s.world,h,from,other,[other]),false);assert.equal(elephantGroundRoute(s.world,h,from,{x:3.5,z:11.5}),null);assert.equal(elephantGroundRoute(s.world,h,from,to,[from]),null);
});

test('a solid care-prop barrier cannot be crossed by path search or a continuous movement segment',()=>{
 const s=home(),h=s.world.habitats.find(h=>h.kind==='elephant-grove');s.world.resources=s.world.resources.filter(r=>r.habitatId!==h.id);for(let x=4;x<8;x++)s.world.resources.push({id:`qa-barrier-${x}`,kind:'elephant-log',habitatId:h.id,cell:{x,z:13},stock:0,capacity:1,revision:0,approaches:[]});const from={x:4.5,z:12.5},to={x:4.5,z:15.5};assert.equal(groundSegmentAllowed(s.world,h,from,to),false);assert.equal(elephantGroundRoute(s.world,h,from,to),null);
});

function supplied(){let s=place(home(),'elephant-browse');s=place(s,'elephant-browse');s=place(s,'elephant-water');for(const r of s.world.resources.filter(r=>r.kind==='elephant-browse'||r.kind==='elephant-water')){const q={command:s.economy.nextCommand,id:r.id,revision:r.revision},filled=prepareElephantCareRefill(s,q);assert.equal(filled.ok,true);s=filled.state;}return s;}
function careTick(s){s.tick++;s.gameTimeMs=s.tick*100;return stepElephantCare(s);}

test('both elephants physically reach stocked care, complete actions, consume once per event and improve actual hunger/thirst',()=>{
 const s=supplied(),start=s.animals.filter(a=>a.speciesId==='elephas-maximus').map(a=>structuredClone(a));let fed=0,drank=0,moved=new Set();
 for(let i=0;i<600;i++){const before=s.animals.filter(a=>a.speciesId==='elephas-maximus').map(a=>structuredClone(a)),events=careTick(s),herd=s.animals.filter(a=>a.speciesId==='elephas-maximus');fed+=events.fed.length;drank+=events.watered.length;
  for(let j=0;j<herd.length;j++){assert.ok(groundDistance(before[j].position,herd[j].position)<=ELEPHANT_GROUND.speed+1e-8);if(groundDistance(start[j].position,herd[j].position)>.2)moved.add(herd[j].id);}assert.ok(groundDistance(herd[0].position,herd[1].position)>=ELEPHANT_GROUND.separation-1e-8);
  for(const e of [...events.fed,...events.watered]){const a=herd.find(a=>a.id===e.animalId),r=s.world.resources.find(r=>r.id===e.resourceId);assert.ok(r.approaches.some(p=>groundDistance(a.position,p)<.06));}if(i%25===0)assert.equal(validateSaveV2(s).ok,true,JSON.stringify(validateSaveV2(s)));
 }
 const herd=s.animals.filter(a=>a.speciesId==='elephas-maximus');assert.equal(moved.size,2);assert.ok(herd.every(a=>a.foodEaten>0&&a.waterDrunk>0));assert.equal(fed,herd.reduce((n,a)=>n+a.foodEaten,0));assert.equal(drank,herd.reduce((n,a)=>n+a.waterDrunk,0));assert.equal(s.world.resources.filter(r=>r.kind==='elephant-browse').reduce((n,r)=>n+r.stock,0),16-fed);assert.equal(s.world.resources.find(r=>r.kind==='elephant-water').stock,8-drank);assert.ok(herd.every(a=>a.hunger<start[0].hunger+600*.06&&a.thirst<start[0].thirst+600*.08));assert.equal(validateSaveV2(s).ok,true);
});

test('empty or missing care never produces fake consumption and refilling restarts the actual seek loop',()=>{
 let s=place(home(),'elephant-browse');s=place(s,'elephant-water');for(let i=0;i<150;i++){const events=careTick(s);assert.deepEqual(events,{fed:[],watered:[]});}assert.ok(s.animals.filter(a=>a.speciesId==='elephas-maximus').every(a=>a.foodEaten===0&&a.waterDrunk===0));
 for(const r of s.world.resources.filter(r=>r.kind==='elephant-browse'||r.kind==='elephant-water'))s=prepareElephantCareRefill(s,{command:s.economy.nextCommand,id:r.id,revision:r.revision}).state;
 for(let i=0;i<600;i++)careTick(s);assert.ok(s.animals.filter(a=>a.speciesId==='elephas-maximus').every(a=>a.foodEaten>0&&a.waterDrunk>0));assert.equal(validateSaveV2(s).ok,true);
});

test('stock exhaustion or resource removal during seek/eat aborts without teleport, fake relief or negative stock',()=>{
 const s=supplied();let active;for(let i=0;i<300&&!active;i++){careTick(s);active=s.animals.find(a=>a.speciesId==='elephas-maximus'&&['eat','drink'].includes(a.currentBehavior));}assert.ok(active);const id=active.targetResourceId,r=s.world.resources.find(r=>r.id===id),before={p:{...active.position},food:active.foodEaten,water:active.waterDrunk};r.stock=0;careTick(s);assert.equal(active.foodEaten,before.food);assert.equal(active.waterDrunk,before.water);assert.deepEqual(active.position,before.p);assert.equal(active.targetResourceId,null);assert.equal(r.stock,0);
 let seeking;for(let i=0;i<300&&!seeking;i++){careTick(s);seeking=s.animals.find(a=>a.speciesId==='elephas-maximus'&&['seek-food','seek-water'].includes(a.currentBehavior));}assert.ok(seeking);const resourceId=seeking.targetResourceId,position={...seeking.position};s.world.resources=s.world.resources.filter(r=>r.id!==resourceId);careTick(s);assert.deepEqual(seeking.position,position);assert.equal(seeking.targetResourceId,null);assert.equal(validateSaveV2(s).ok,true,JSON.stringify(validateSaveV2(s)));
});

test('canonical fixed tick completes both food/water loops within60 simulation seconds at1x/10x identically while pause freezes needs, motion, stock, cash and proofs',()=>{
 const source=supplied(),a=createSimulation(source),b=createSimulation(source);b.setSpeed(10);let fed=0,drank=0;a.subscribe(e=>{if(e.type==='animal-fed'&&e.animalId.startsWith('elephant-'))fed++;if(e.type==='animal-drank'&&e.animalId.startsWith('elephant-'))drank++;});for(let i=0;i<600;i++){a.advance(100);b.advance(10);}const left=a.snapshot(),right=b.snapshot();right.preferences.speed=1;assert.deepEqual(right,left);assert.ok(left.animals.filter(a=>a.speciesId==='elephas-maximus').every(a=>a.foodEaten>0&&a.waterDrunk>0));assert.ok(fed>=2&&drank>=2);b.setPaused(true);const exact=serializeSaveV2(b.snapshot());b.advance(86400000);assert.equal(serializeSaveV2(b.snapshot()),exact);assert.equal(b.inspect().tick,source.tick+600);assert.equal(validateSaveV2(left).ok,true);a.dispose();b.dispose();
});

test('mid-seek and action checkpoints resume the same canonical care/visitor/money result without resetting resources or counters',()=>{
 const live=createSimulation(supplied());for(let i=0;i<30;i++)live.advance(100);assert.ok(live.elephantSnapshot().animals.some(a=>['seek-food','seek-water','eat','drink'].includes(a.currentBehavior)));const saved=serializeSaveV2(live.snapshot()),cold=createSimulation(parseSaveV2(saved).value);assert.equal(serializeSaveV2(cold.snapshot()),saved);for(let i=0;i<450;i++){live.advance(100);cold.advance(100);}assert.deepEqual(cold.snapshot(),live.snapshot());assert.equal(cold.elephantSnapshot().animals.length,2);assert.equal(cold.birdSnapshot().animals.length,2);live.dispose();cold.dispose();
});

test('real low-balance path spending rejects unaffordable second feeder and refill without losing cash, stock or commands',()=>{
 const sim=createSimulation(place(home(false),'elephant-browse'));sim.visitors(false);const cells=sim.worldSnapshot().tiles.filter(t=>t.cell.z>=10&&t.cell.x<3).map(t=>t.cell);let i=0;while(sim.inspect().currency>=80){assert.equal(sim.buildPath(cells[i++],sim.commandRevision()).ok,true);}assert.equal(sim.inspect().currency,75);const before=serializeSaveV2(sim.snapshot()),q={command:sim.commandRevision(),kind:'elephant-browse',cell:sim.defaultElephantCareCell('elephant-browse')};assert.equal(sim.placeElephantCare(q).reason,'funds');assert.equal(serializeSaveV2(sim.snapshot()),before);
 while(sim.inspect().currency>=15){assert.equal(sim.buildPath(cells[i++],sim.commandRevision()).ok,true);}assert.equal(sim.inspect().currency,0);const r=sim.snapshot().world.resources.find(r=>r.kind==='elephant-browse'),exact=serializeSaveV2(sim.snapshot());assert.equal(sim.refillElephantCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).reason,'funds');assert.equal(serializeSaveV2(sim.snapshot()),exact);sim.dispose();
});

test('partially consumed browse refills at the displayed fixed8 ZC service fee, retaining actual eating counters',()=>{
 const sim=createSimulation(supplied());for(let i=0;i<600;i++)sim.advance(100);const before=sim.snapshot(),r=before.world.resources.find(r=>r.kind==='elephant-browse'&&r.stock<r.capacity);assert.ok(r&&r.stock>0);const counters=before.animals.filter(a=>a.speciesId==='elephas-maximus').map(a=>[a.foodEaten,a.waterDrunk,a.hunger,a.thirst]);assert.equal(sim.refillElephantCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok,true);const after=sim.snapshot();assert.equal(after.currency,before.currency-8);assert.equal(after.world.resources.find(x=>x.id===r.id).stock,8);assert.deepEqual(after.animals.filter(a=>a.speciesId==='elephas-maximus').map(a=>[a.foodEaten,a.waterDrunk,a.hunger,a.thirst]),counters);assert.equal(validateSaveV2(after).ok,true);sim.dispose();
});

test('actual care planner cancels free, uses ground-cell picking inside the6x6 habitat, rejects stale input and commits once',()=>{
 const sim=createSimulation(home()),before=serializeSaveV2(sim.snapshot()),diorama=createTropicalDiorama(sim.worldSnapshot()),camera=new OrthographicCamera();fitIsometricCamera(camera,diorama.bounds,1000/800);const planner=createElephantCarePreview(()=>sim.worldSnapshot(),camera,()=>({left:0,top:0,width:1000,height:800}),{command:()=>sim.commandRevision(),defaultCell:kind=>sim.defaultElephantCareCell(kind),validate:(kind,cell)=>sim.elephantCarePlacementView(kind,cell),commit:q=>sim.placeElephantCare(q)},()=>{});
 try{planner.begin('elephant-browse');assert.equal(planner.view().reason,'ready');planner.command('left');assert.equal(planner.view().reason,'outside');assert.equal(planner.command('confirm',planner.view().revision),false);planner.command('right');planner.command('cancel');assert.equal(serializeSaveV2(sim.snapshot()),before);
  planner.begin('elephant-water');const origin=sceneOrigin(sim.worldSnapshot()),point=new Vector3(7.5-origin.x,0,14.5-origin.z).project(camera);planner.pick({x:(point.x+1)*500,y:(1-point.y)*400});assert.deepEqual(planner.view().cell,{x:7,z:14});sim.buildPath({x:0,z:17},sim.commandRevision());assert.equal(planner.view().reason,'stale');assert.equal(planner.command('confirm',planner.view().revision),false);planner.cancel();planner.begin('elephant-water');const q=planner.view();assert.equal(q.reason,'ready');assert.equal(planner.command('confirm',q.revision),true);assert.equal(planner.command('confirm',q.revision),false);assert.equal(sim.snapshot().world.resources.filter(r=>r.kind==='elephant-water').length,1);assert.equal(sim.inspect().currency,JSON.parse(before).currency-15-90);planner.dispose();planner.begin('elephant-browse');assert.equal(planner.view().active,false);
 }finally{planner.dispose();sim.dispose();for(const g of diorama.geometries)g.dispose();for(const m of diorama.materials)m.dispose();}
});

test('original facility meshes show only real saved food/water, reuse a bounded shared pool and dispose every owner once',()=>{
 const state=supplied(),resources=state.world.resources.filter(r=>r.kind.startsWith('elephant-')),exact=serializeSaveV2(state),diorama=createTropicalDiorama(state.world),kit=createElephantCareScene(diorama.catalog);
 try{kit.sync(resources,12,18,null);assert.equal(kit.inspect().elephantCareFacilities,3);assert.equal(kit.inspect().elephantCareGeometries,4);assert.equal(kit.inspect().elephantCareMaterials,4);assert.equal(kit.inspect().elephantCareVisibleFoodPortions,16);assert.equal(kit.inspect().elephantCareWaterVisible,true);const geos=new Set(),mats=new Set();kit.group.traverse(o=>{if(o.isMesh){geos.add(o.geometry);mats.add(o.material);}});assert.equal(geos.size,4);assert.equal(mats.size,4);
  const changed=structuredClone(resources);changed[0].stock=3;changed.find(r=>r.kind==='elephant-water').stock=0;for(let i=0;i<20;i++)kit.sync(changed,12,18,{active:i%2===0,kind:i%3?'elephant-browse':'elephant-water',cell:{x:3,z:12},reason:'occupied',revision:i,command:0,price:80});assert.equal(kit.inspect().elephantCareVisibleFoodPortions,11);assert.equal(kit.inspect().elephantCareWaterVisible,false);assert.match(presentSelection(diorama.catalog.identities.get(changed[0].id),'en').detail,/3 \/ 8/);assert.equal(serializeSaveV2(state),exact);
  const afterGeos=new Set(),afterMats=new Set();kit.group.traverse(o=>{if(o.isMesh){afterGeos.add(o.geometry);afterMats.add(o.material);}});assert.deepEqual(afterGeos,geos);assert.deepEqual(afterMats,mats);let gd=0,md=0;geos.forEach(g=>g.addEventListener('dispose',()=>gd++));mats.forEach(m=>m.addEventListener('dispose',()=>md++));kit.dispose();kit.dispose();assert.equal(gd,4);assert.equal(md,4);assert.equal(kit.inspect().elephantCareFacilities,0);assert.equal(kit.inspect().elephantCareGeometries,0);assert.equal(diorama.catalog.identities.has(changed[0].id),false);
 }finally{kit.dispose();for(const g of diorama.geometries)g.dispose();for(const m of diorama.materials)m.dispose();}
});

test('resident motion interpolates authoritative transforms and shortest heading without changing the input state or owning a timer',()=>{
 const state=home(),herd=state.animals.filter(a=>a.speciesId==='elephas-maximus'),before=JSON.stringify(herd),diorama=createTropicalDiorama(state.world),kit=createElephantResidentsScene(diorama.catalog);
 try{kit.sync(herd,12,18);const moved=structuredClone(herd);moved[0].position.x+=.4;moved[0].motion.heading=Math.PI*2-.1;kit.sync(moved,12,18);kit.update(.5);const mesh=kit.group.getObjectByName('elephant-ayu');assert.ok(Math.abs(mesh.position.x+1.3)<1e-6);assert.ok(Math.abs(mesh.rotation.y)<.1);kit.update(99);assert.ok(Math.abs(mesh.position.x+1.1)<1e-6);assert.equal(JSON.stringify(herd),before);assert.equal(moved[0].position.x,4.9);assert.equal(kit.inspect().liveElephantModels,2);
 }finally{kit.dispose();for(const g of diorama.geometries)g.dispose();for(const m of diorama.materials)m.dispose();}
});
