import test from 'node:test';
import assert from 'node:assert/strict';
import {OrthographicCamera,Vector3} from 'three';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {prepareHabitat,habitatBlockerKeys,validateHabitatPlacement} from '../src/game/world/build-habitat.ts';
import {createPlacementPlanner} from '../src/game/world/placement-preview.ts';
import {sanctuarySessionFor} from '../src/game/core/session-state.ts';
import {validateSave,serializeSave,parseSave} from '../src/game/persistence/save-v1.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {createHabitatScene} from '../src/game/render3d/habitat-scene.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
import {raycastScene} from '../src/game/render3d/scene-picking.ts';
import {presentSelection} from '../src/game-entry/selection-presentation.ts';
import {releaseLiveContext} from '../src/game/render3d/webgl-cleanup.ts';
const anchor={x:5,z:5};
test('habitat preparation atomically clones four occupancy cells without modifying source or unrelated tiles',()=>{
 const world=createInitialState().world,before=JSON.stringify(world),r=prepareHabitat(world,anchor,'habitat-one');assert.equal(r.ok,true);assert.equal(r.duplicate,false);assert.equal(JSON.stringify(world),before);assert.equal(r.world.habitats.length,1);assert.equal(r.world.habitats[0].viewingCell,null);assert.equal(r.world.tiles.filter(t=>t.occupantId==='habitat-one').length,4);assert.deepEqual(r.world.habitats[0].cells,[{x:5,z:5},{x:6,z:5},{x:5,z:6},{x:6,z:6}]);for(let i=0;i<world.tiles.length;i++)if(!r.world.tiles[i].occupantId)assert.deepEqual(r.world.tiles[i],world.tiles[i]);
});
test('authoritative command rejects out-of-bounds, creek, entrance, scenery, malformed IDs and excess habitat with no partial writes',()=>{
 const sim=createSimulation(),before=JSON.stringify(sim.snapshot());for(const [p,id,reason]of [[{x:-1,z:3},'habitat-edge','outside'],[{x:11,z:4},'habitat-edge','outside'],[{x:8,z:2},'habitat-water','creek'],[{x:1,z:7},'habitat-gate','path'],[{x:0,z:0},'habitat-tree','scenery'],[anchor,'bad id','command']]){assert.deepEqual(sim.buildHabitat(p,id),{ok:false,reason});assert.equal(JSON.stringify(sim.snapshot()),before);}assert.equal(sim.buildHabitat(anchor,'habitat-one').ok,true);const built=JSON.stringify(sim.snapshot());assert.equal(sim.buildHabitat({x:3,z:4},'habitat-two').reason,'limit');assert.equal(sim.buildHabitat(anchor,'habitat-two').reason,'occupied');assert.equal(JSON.stringify(sim.snapshot()),built);sim.dispose();
});
test('duplicate operation IDs are exactly-once across a real save-codec roundtrip and conflicting reuse is rejected',()=>{
 const sim=createSimulation();sim.buildHabitat(anchor,'habitat-one');const saved=serializeSave(sim.snapshot()),parsed=parseSave(saved);assert.equal(parsed.ok,true);const restored=createSimulation(parsed.value);assert.deepEqual(restored.buildHabitat(anchor,'habitat-one'),{ok:true,habitatId:'habitat-one',duplicate:true});assert.equal(serializeSave(restored.snapshot()),saved);assert.deepEqual(restored.buildHabitat({x:4,z:4},'habitat-one'),{ok:false,reason:'command'});assert.equal(serializeSave(restored.snapshot()),saved);sim.dispose();restored.dispose();
});
test('building changes only habitat/occupancy, debits300 ZC and leaves missions birds RNG and time intact and emits after valid commit',()=>{
 const sim=createSimulation(),before=sim.snapshot(),events=[];sim.subscribe(e=>{events.push(e);assert.equal(validateSave(sim.snapshot()).ok,true);assert.equal(sim.snapshot().world.tiles.filter(t=>t.occupantId).length,4);});sim.buildHabitat(anchor,'habitat-one');sim.buildHabitat(anchor,'habitat-one');const after=sim.snapshot();for(const field of Object.keys(before))if(!['world','currency','ledger'].includes(field))assert.deepEqual(after[field],before[field],field);assert.equal(after.currency,before.currency-300);assert.equal(after.ledger.length,before.ledger.length+1);assert.equal(after.ledger.at(-1).amount,-300);assert.equal(events.length,1);assert.equal(events[0].type,'habitat-built');assert.equal(events[0].habitatId,'habitat-one');assert.equal(sim.inspect().listenerErrors,0);sim.dispose();
});
test('paused/disposed command rejects construction and mutable returned snapshots cannot change occupancy',()=>{
 const sim=createSimulation();sim.setPaused(true);const before=JSON.stringify(sim.snapshot());assert.equal(sim.buildHabitat(anchor,'habitat-one').ok,false);assert.equal(JSON.stringify(sim.snapshot()),before);sim.setPaused(false);sim.buildHabitat(anchor,'habitat-one');const copy=sim.snapshot();copy.world.tiles.find(t=>t.occupantId).occupantId=null;copy.world.habitats.length=0;assert.equal(sim.inspect().occupiedTiles,4);assert.equal(sim.inspect().habitatCount,1);sim.dispose();assert.equal(sim.buildHabitat(anchor,'habitat-two').ok,false);
});
test('preview Cancel and invalid/repeated/stale confirmation cannot issue a habitat transaction',()=>{
 const sim=createSimulation(),world=()=>sim.snapshot().world;let operations=0;const p=createPlacementPlanner(world,habitatBlockerKeys(),()=>{},{validate:validateHabitatPlacement,operationId:()=> 'habitat-one',commit:(proposal,id)=>{operations++;return sim.buildHabitat(proposal.anchor,id).ok;}});p.begin();p.choose(anchor);p.cancel();assert.equal(operations,0);assert.equal(sim.inspect().occupiedTiles,0);p.begin();p.choose({x:9,z:2});assert.equal(p.confirm(p.snapshot().revision),false);p.choose(anchor);const revision=p.snapshot().revision;assert.equal(p.confirm(revision-1),false);assert.equal(p.confirm(revision),true);assert.equal(p.confirm(revision),false);assert.equal(operations,1);assert.equal(sim.inspect().occupiedTiles,4);p.dispose();sim.dispose();
});
test('in-tab memento owns cloned serializable state, survives owner remount and keeps unrelated owners isolated',()=>{
 const owner={},store=sanctuarySessionFor(owner),other=sanctuarySessionFor({}),sim=createSimulation();assert.equal(store.read(),undefined);sim.buildHabitat(anchor,'habitat-one');store.write(sim.snapshot());sim.dispose();assert.equal(sanctuarySessionFor(owner),store);assert.equal(other.read(),undefined);const read=store.read();read.world.habitats.length=0;assert.equal(store.read().world.habitats.length,1);const resumed=createSimulation(store.read());assert.equal(resumed.inspect().occupiedTiles,4);assert.equal(validateSave(resumed.snapshot()).ok,true);resumed.dispose();
});
function visual(){const sim=createSimulation(),world=createTropicalDiorama(sim.snapshot().world),owned=[];const habitats=createHabitatScene(world.catalog,(g,m)=>owned.push({g,m}));return {sim,world,owned,habitats,dispose(){habitats.dispose();for(const o of owned){o.g.dispose();o.m.dispose();}world.geometries.forEach(g=>g.dispose());world.materials.forEach(m=>m.dispose());sim.dispose();}};}
test('pure scenery exclusion mask exactly matches current rendered bounds; caller copies cannot alter authoritative rules',()=>{
 const s=visual();try{const w=s.sim.snapshot().world,keys=new Set();for(const i of s.world.catalog.identities.values())if(i.category==='object'){const b=s.world.catalog.bounds.get(i.id);for(const t of w.tiles){const x=t.cell.x-w.width/2,z=t.cell.z-w.height/2;if(x+1>b.min.x+.03&&x<b.max.x-.03&&z+1>b.min.z+.03&&z<b.max.z-.03)keys.add(`${t.cell.x},${t.cell.z}`);}}assert.equal(keys.size,77);assert.deepEqual([...keys].sort(),[...habitatBlockerKeys()].sort());habitatBlockerKeys().clear();assert.equal(validateHabitatPlacement(w,{x:0,z:0}).reason,'scenery');}finally{s.dispose();}
});
test('built aviary mesh is bounded, roof/closed wall wires exist, catalog occupancy and repeated sync remain coherent',()=>{
 const s=visual();try{s.sim.buildHabitat(anchor,'habitat-one');const w=s.sim.snapshot().world;s.habitats.sync(w);s.habitats.sync(w);assert.equal(s.habitats.inspect().habitatMeshes,1);assert.equal(s.owned.length,2);assert.equal(s.world.catalog.identities.size,143);const bounds=s.world.catalog.bounds.get('habitat-one');assert.equal(bounds.min.x,-1);assert.equal(bounds.max.x,1);assert.equal(bounds.min.z,0);assert.ok(bounds.max.z<=2);for(const c of w.habitats[0].cells)assert.equal(s.world.catalog.identities.get(`tile-${c.x}-${c.z}`).kind,'habitat');const wire=s.habitats.group.children.find(m=>m.isLineSegments).geometry.getAttribute('position');let roof=0;for(let i=0;i<wire.count;i++)if(Math.abs(wire.getY(i)-1.12)<1e-6)roof++;assert.ok(roof>=36);assert.ok(wire.count>100);assert.equal(s.world.catalog.batches.filter(b=>b.mesh.name==='habitat-one').length,1);}finally{s.dispose();}assert.equal(s.habitats.inspect().habitatMeshes,0);assert.equal(s.world.catalog.identities.has('habitat-one'),false);
});
test('actual habitat triangles are pickable and bilingual at all target canvas aspects',()=>{
 const s=visual();try{s.sim.buildHabitat(anchor,'habitat-one');s.habitats.sync(s.sim.snapshot().world);for(const [width,height]of [[504,350],[270,250],[285,250]]){const camera=new OrthographicCamera(),rect={left:20,top:30,width,height};fitIsometricCamera(camera,s.world.bounds,width/height);const p=new Vector3(0,.079,1).project(camera),hit=raycastScene(s.world.catalog,camera,{x:rect.left+(p.x+1)*width/2,y:rect.top+(1-p.y)*height/2},rect);assert.equal(hit?.id,'habitat-one');assert.equal(hit.kind,'habitat');assert.equal(presentSelection(hit,'en').title,'Macaw habitat 1');assert.equal(presentSelection(hit,'id').title,'Habitat makaw 1');}}finally{s.dispose();}
});
test('context cleanup skips already-lost/null contexts and releases only a live context without querying extensions',()=>{
 let calls=0;releaseLiveContext(null,()=>calls++);releaseLiveContext({isContextLost:()=>true},()=>calls++);assert.equal(calls,0);releaseLiveContext({isContextLost:()=>false},()=>calls++);assert.equal(calls,1);
});
