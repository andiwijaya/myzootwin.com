import test from 'node:test';
import assert from 'node:assert/strict';
import {preparedZebraCare} from './helpers/zebra-care-play.mjs';
import {createSimulation} from '../src/game/core/simulation.ts';
import {serializeSaveV5,parseSaveV5} from '../src/game/persistence/save-v5.ts';
import {createZebraResidentsScene,zebraPose} from '../src/game/render3d/zebra/residents-scene.ts';

const gameplay=s=>{const {preferences,...rest}=s;return rest;};
test('all V5 visual/mute combinations roundtrip all five habitats and14 actors without commands, grants, missions or ledger mutations',()=>{
 const sim=preparedZebraCare();sim.setPaused(true);const before=sim.snapshot();
 try{assert.equal(before.world.habitats.length,5);assert.equal(before.animals.length,14);
  for(const graphics of ['auto','low','high'])for(const reducedMotion of [false,true])for(const muted of [true,false]){
   sim.setVisualSettings({graphics,reducedMotion});sim.setMuted(muted);
   assert.deepEqual(gameplay(sim.snapshot()),gameplay(before));
   const cold=parseSaveV5(serializeSaveV5(sim.snapshot()));assert.equal(cold.ok,true);assert.deepEqual(cold.value,sim.snapshot());
  }
  const bytes=serializeSaveV5(sim.snapshot());for(const invalid of [{graphics:'ultra',reducedMotion:false},{graphics:'low',reducedMotion:true,currency:9999},{graphics:'high',reducedMotion:'true'}]){assert.equal(sim.setVisualSettings(invalid),false);assert.equal(serializeSaveV5(sim.snapshot()),bytes);}
  sim.advance(86400000);assert.equal(serializeSaveV5(sim.snapshot()),bytes);
 }finally{sim.dispose();}
});

test('five-species V5 causal state remains identical across high/unmuted and low/reduced/muted visual policies for300 canonical ticks',()=>{
 const source=preparedZebraCare(),initial=source.snapshot();source.dispose();const a=createSimulation(initial),b=createSimulation(initial);
 try{a.setVisualSettings({graphics:'high',reducedMotion:false});a.setMuted(false);b.setVisualSettings({graphics:'low',reducedMotion:true});b.setMuted(true);
  for(let tick=0;tick<300;tick++){a.advance(100);b.advance(100);if(tick%50===0)assert.deepEqual(gameplay(a.snapshot()),gameplay(b.snapshot()));}
  assert.deepEqual(gameplay(a.snapshot()),gameplay(b.snapshot()));assert.ok(a.snapshot().animals.some((v,i)=>v.position.x!==initial.animals[i].position.x||v.position.z!==initial.animals[i].position.z));
  assert.equal(parseSaveV5(serializeSaveV5(a.snapshot())).ok,true);assert.equal(parseSaveV5(serializeSaveV5(b.snapshot())).ok,true);
 }finally{a.dispose();b.dispose();}
});

test('original four Zebra rigs retain causal displacement and gait in low/reduced mode while decorative tail/ears stop and ownership releases',()=>{
 const sim=preparedZebraCare();let previous,current,moving;
 try{for(let tick=0;tick<100;tick++){previous=sim.zebraSnapshot();sim.advance(100);current=sim.zebraSnapshot();moving=current.animals.find(a=>{const p=previous.animals.find(p=>p.id===a.id);return Math.hypot(a.position.x-p.position.x,a.position.z-p.position.z)>.01;});if(moving)break;}
  assert.ok(moving);const bytes=serializeSaveV5(sim.snapshot()),p=previous.animals.find(p=>p.id===moving.id),delta={x:moving.position.x-p.position.x,z:moving.position.z-p.position.z};
  const reduced=zebraPose(p,moving,1,sim.snapshot().gameTimeMs,true),ordinary=zebraPose(p,moving,1,sim.snapshot().gameTimeMs,false);assert.deepEqual(reduced.legs,ordinary.legs);assert.deepEqual(reduced.knees,ordinary.knees);assert.ok(reduced.legs.some(n=>Math.abs(n)>.001));for(const k of ['tail','earLeft','earRight'])assert.equal(reduced[k],0);
  for(const low of [false,true]){const catalog={identities:new Map(),bounds:new Map(),batches:[]},scene=createZebraResidentsScene(catalog);
   try{scene.sync(current.animals,current.width,current.height,low,previous.animals);scene.update(0,sim.snapshot().gameTimeMs,true);const mesh=scene.group.getObjectByName(moving.id),start=mesh.position.clone();scene.update(1,sim.snapshot().gameTimeMs,true);assert.ok(Math.abs(mesh.position.x-start.x-delta.x)<1e-8);assert.ok(Math.abs(mesh.position.z-start.z-delta.z)<1e-8);assert.equal(scene.inspect().liveZebraModels,4);assert.equal(scene.inspect().zebraMaterials,4);assert.ok(scene.inspect().zebraBones>0);assert.equal(mesh.isSkinnedMesh,true);assert.equal(serializeSaveV5(sim.snapshot()),bytes);
   }finally{scene.dispose();scene.dispose();}assert.equal(scene.inspect().liveZebraModels,0);assert.equal(scene.inspect().zebraGeometries,0);assert.equal(scene.inspect().zebraMaterials,0);assert.equal(catalog.batches.length,0);assert.equal(catalog.identities.size,0);
  }
 }finally{sim.dispose();}
});
