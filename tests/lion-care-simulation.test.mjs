import test from 'node:test';import assert from 'node:assert/strict';
import {lionHome} from './fixtures/lion-home.mjs';import {validateSaveV3,serializeSaveV3,parseSaveV3} from '../src/game/persistence/save-v3.ts';import {createSimulation} from '../src/game/core/simulation.ts';
import {lionDistance,lionSegmentAllowed} from '../src/game/animals/lions/ground.ts';
import {totals} from '../src/game/economy/journal.ts';
const pride=sim=>sim.snapshot().animals.filter(a=>a.speciesId==='panthera-leo');
const service=sim=>{for(const r of sim.lionCareView().resources)if(r.stock<r.capacity/2&&sim.inspect().currency>=r.refillPrice)sim.refillLionCare({command:sim.commandRevision(),id:r.id,revision:r.revision});};
test('private first-male vertical slice really walks to stocked food/water, consumes stock and resumes identical fixed-tick care after cold save',()=>{
 const a=lionHome(),before=a.snapshot(),events=[];a.subscribe(e=>{if(['animal-fed','animal-drank'].includes(e.type)&&e.animalId==='lion-raka')events.push(e);});
 for(let i=0;i<1200;i++){a.advance(100);if(i%50===0)assert.ok(validateSaveV3(a.snapshot()).ok,JSON.stringify(validateSaveV3(a.snapshot())));if(pride(a)[0].foodEaten>0&&pride(a)[0].waterDrunk>0)break;}
 const male=pride(a)[0];assert.ok(male.foodEaten>0&&male.waterDrunk>0,JSON.stringify(male));assert.equal(events.length,male.foodEaten+male.waterDrunk);const resources=a.lionCareView().resources;assert.equal(resources.filter(r=>r.kind==='lion-meat').reduce((n,r)=>n+r.stock,0),24-male.foodEaten);assert.equal(resources.find(r=>r.kind==='lion-water').stock,12-male.waterDrunk);const earlier=totals(before).amounts,later=totals(a.snapshot()).amounts;assert.equal(a.snapshot().currency-before.currency,later.ticket-earlier.ticket+later.maintenance-earlier.maintenance);assert.notDeepEqual(male.position,before.animals.at(-1).position);
 const b=createSimulation(parseSaveV3(serializeSaveV3(a.snapshot())).value);b.setSpeed(10);for(let i=0;i<300;i++){a.advance(100);b.advance(10);}const x=a.snapshot(),y=b.snapshot();y.preferences.speed=1;assert.deepEqual(x,y);a.dispose();b.dispose();
});
test('three lions get fair independent turns, bounded physical motion and real rest, scent, scratch and ramp roar events',()=>{
 const sim=lionHome({pride:true,enrichment:true}),events=[],start=sim.snapshot(),home=start.world.habitats.find(h=>h.kind==='lion-savanna');sim.subscribe(e=>{if(e.type.startsWith('lion-'))events.push(e);});let previous=pride(sim),highest=0;
 for(let i=0;i<5000;i++){
  if(i%50===0)service(sim);sim.advance(100);const state=sim.snapshot(),actors=state.animals.filter(a=>a.speciesId==='panthera-leo');
  for(const a of actors){const old=previous.find(b=>b.id===a.id);assert.ok(lionDistance(a.position,old.position)<=.0550001);assert.ok(lionSegmentAllowed(state.world,home,old.position,a.position));highest=Math.max(highest,a.motion.elevation);}
  for(let j=0;j<actors.length;j++)for(let k=j+1;k<actors.length;k++)assert.ok(lionDistance(actors[j].position,actors[k].position)>=.9-1e-7);
  if(i%100===0)assert.ok(validateSaveV3(state).ok,JSON.stringify(validateSaveV3(state)));previous=actors;
  if(actors.every(a=>a.foodEaten>=2&&a.waterDrunk>=2&&a.restedTicks>0&&a.scentInvestigations>0&&a.scratches>0)&&events.some(e=>e.type==='lion-roared'))break;
 }
 const actors=pride(sim);assert.ok(actors.every(a=>a.foodEaten>=2&&a.waterDrunk>=2),JSON.stringify(actors.map(a=>({id:a.id,food:a.foodEaten,water:a.waterDrunk,phase:a.currentBehavior}))));assert.ok(actors.every(a=>a.restedTicks>0&&a.scentInvestigations>0&&a.scratches>0),JSON.stringify(actors));assert.equal(highest,.65);assert.ok(events.some(e=>e.type==='lion-roared'));assert.equal(new Set(events.map(e=>e.eventId).filter(Boolean)).size,events.map(e=>e.eventId).filter(Boolean).length);assert.ok(validateSaveV3(sim.snapshot()).ok);sim.dispose();
});
test('empty sources never produce phantom meals or drinks; actual paid refills precede recovery and pause cannot age lions',()=>{
 const sim=lionHome({filled:false}),before=sim.snapshot();for(let i=0;i<350;i++)sim.advance(100);let male=pride(sim)[0];assert.equal(male.foodEaten,0);assert.equal(male.waterDrunk,0);assert.ok(male.hunger>before.animals.at(-1).hunger);const poor=male.welfare;
 for(const r of sim.lionCareView().resources)assert.ok(sim.refillLionCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok);assert.equal(pride(sim)[0].foodEaten,0);for(let i=0;i<1500;i++){sim.advance(100);if(pride(sim)[0].foodEaten>0&&pride(sim)[0].waterDrunk>0)break;}male=pride(sim)[0];assert.ok(male.foodEaten>0&&male.waterDrunk>0);assert.ok(male.welfare>poor);sim.setPaused(true);const saved=serializeSaveV3(sim.snapshot());sim.advance(600000);assert.equal(serializeSaveV3(sim.snapshot()),saved);sim.dispose();
});
