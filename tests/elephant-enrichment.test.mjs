import test from 'node:test';
import assert from 'node:assert/strict';
import {elephantHome,elephantHerd,elephantProps} from './fixtures/elephant-home.mjs';
import {prepareElephantCarePlacement,prepareElephantCareRefill,defaultElephantCareCell,validateElephantCarePlacement} from '../src/game/animals/elephants/care-resources.ts';
import {stepElephantCare} from '../src/game/animals/elephants/care-simulation.ts';
import {ELEPHANT_ENRICHMENT as E} from '../src/game/animals/elephants/care-rules.ts';
import {elephantBodyClearance} from '../src/game/animals/elephants/body-clearance.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {parseSaveV2,serializeSaveV2,validateSaveV2} from '../src/game/persistence/save-v2.ts';
const tick=s=>{s.tick++;s.gameTimeMs=s.tick*100;return stepElephantCare(s);};
const setup=()=>elephantHome({pond:true,enrichment:true});
function actionSnapshot(phase){const s=setup();for(let i=0;i<1500;i++){tick(s);if(elephantHerd(s).some(a=>a.motion.phase===phase))return s;}assert.fail('Actual action not reached: '+phase);}

test('shade80/log60 use actual paid capped placement and permanent ready props, with no refill or preview debit',()=>{
 let s=elephantHome({pond:true});const initial=s.currency;for(const [kind,cost]of [['elephant-shade',80],['elephant-log',60]]){const before=serializeSaveV2(s),cell=defaultElephantCareCell(s,kind);assert.equal(validateElephantCarePlacement(s,kind,cell).reason,'ready');assert.equal(serializeSaveV2(s),before);const result=prepareElephantCarePlacement(s,{command:s.economy.nextCommand,kind,cell});assert.ok(result.ok);assert.equal(result.state.currency,s.currency-cost);s=result.state;const r=elephantProps(s).find(r=>r.kind===kind);assert.equal(r.stock,1);assert.equal(r.capacity,1);assert.equal(prepareElephantCareRefill(s,{command:s.economy.nextCommand,id:r.id,revision:r.revision}).reason,'full');assert.equal(validateElephantCarePlacement(s,kind,cell).reason,'limit');}assert.equal(s.currency,initial-140);assert.ok(validateSaveV2(s).ok);
});

test('both actual residents walk to shade and log, earn completed causal comfort/welfare, and still bathe/eat/drink with six props',()=>{
 const s=setup(),cash=s.currency,phases=new Map(elephantHerd(s).map(a=>[a.id,new Set()])),events=[];let previous=structuredClone(elephantHerd(s));
 for(let i=0;i<1800;i++){const result=tick(s);events.push(...result.enriched??[]);const herd=elephantHerd(s);for(const a of herd){phases.get(a.id).add(a.motion.phase);const old=previous.find(b=>b.id===a.id);assert.ok(Math.hypot(a.position.x-old.position.x,a.position.z-old.position.z)<=.04+1e-7);if(a.restedTicks>old.restedTicks){assert.equal(a.restedTicks-old.restedTicks,E.restTicks);assert.equal(a.shadeRest,Math.min(100,Math.max(0,old.shadeRest-E.shadeDecay)+E.restShade));assert.ok(a.energy>old.energy);assert.ok(a.welfare>old.welfare);}if(a.enrichedTicks>old.enrichedTicks){assert.equal(a.enrichedTicks-old.enrichedTicks,E.logTicks);assert.equal(a.enrichment,Math.min(100,Math.max(0,old.enrichment-E.enrichmentDecay)+E.logRelief));assert.equal(a.logCooldownTicks,E.logCooldownTicks);} }assert.ok(elephantBodyClearance({position:herd[0].position,heading:herd[0].motion.heading},{position:herd[1].position,heading:herd[1].motion.heading})>=-1e-7);previous=structuredClone(herd);if(i%120===0)assert.ok(validateSaveV2(s).ok);if(herd.every(a=>a.restedTicks>0&&a.enrichedTicks>0&&a.baths>0))break;}
 for(const a of elephantHerd(s)){assert.ok(a.restedTicks>0&&a.enrichedTicks>0&&a.baths>0&&a.foodEaten>0&&a.waterDrunk>0,a.name);for(const phase of ['seek-shade','rest','seek-log','enrich'])assert.ok(phases.get(a.id).has(phase));}assert.equal(s.currency,cash);assert.equal(new Set(events.map(e=>e.eventId)).size,events.length);assert.ok(events.length>=2);for(const r of elephantProps(s).filter(r=>r.capacity===1))assert.equal(r.stock,1);
});

test('missing/disabled prop and critical food/water interrupt real shade/log seeks/actions without completion credit',()=>{
 for(const phase of ['seek-shade','rest','seek-log','enrich']){const original=actionSnapshot(phase);for(const fault of ['missing','dry','hunger','thirst']){const s=structuredClone(original),a=elephantHerd(s).find(a=>a.motion.phase===phase),before=structuredClone(a);if(fault==='missing')s.world.resources=s.world.resources.filter(r=>r.id!==a.targetResourceId);else if(fault==='dry')s.world.resources.find(r=>r.id===a.targetResourceId).stock=0;else a[fault]=80;const result=tick(s);assert.equal(a.motion.phase,'idle');assert.equal(a.enrichedTicks,before.enrichedTicks);assert.equal(a.restedTicks,before.restedTicks);assert.equal((result.enriched??[]).filter(e=>e.animalId===a.id).length,0);assert.ok(a.shadeRest<=before.shadeRest&&a.enrichment<=before.enrichment);}}
});

test('mid-rest and mid-rub cold/pause continuations and 1x/10x remain exact with persisted log cooldown',()=>{
 for(const phase of ['rest','enrich']){const s=actionSnapshot(phase),encoded=serializeSaveV2(s),cold=parseSaveV2(encoded);assert.ok(cold.ok);assert.equal(serializeSaveV2(cold.value),encoded);const a=createSimulation(s),b=createSimulation(cold.value);a.setPaused(true);a.advance(1000);assert.equal(serializeSaveV2(a.snapshot()),encoded);a.setPaused(false);for(let i=0;i<240;i++){a.advance(100);b.advance(100);}assert.deepEqual(a.snapshot(),b.snapshot());a.dispose();b.dispose();}
 const source=setup(),one=createSimulation(source),ten=createSimulation(source);ten.setSpeed(10);for(let i=0;i<120;i++)one.advance(100);for(let i=0;i<120;i++)ten.advance(10);const a=one.snapshot(),b=ten.snapshot();b.preferences.speed=1;assert.deepEqual(a,b);one.dispose();ten.dispose();
});

test('log cooldown forbids a second completed rub before expiry and placement alone never grants needs',()=>{
 const s=setup(),initial=elephantHerd(s).map(a=>[a.shadeRest,a.enrichment,a.restedTicks,a.enrichedTicks]);assert.deepEqual(initial,[[0,30,0,0],[0,30,0,0]]);let actor;for(let i=0;i<1500;i++){tick(s);actor=elephantHerd(s).find(a=>a.enrichedTicks>0);if(actor)break;}assert.ok(actor);const count=actor.enrichedTicks;for(let i=0;i<120;i++){tick(s);assert.equal(actor.enrichedTicks,count);}assert.ok(actor.logCooldownTicks>0);
});

test('enrichment event subscribers see the complete canonical tick and completed resource/counter attribution',()=>{
 const sim=createSimulation(actionSnapshot('enrich'));let observed;sim.subscribe(e=>{if(e.type==='elephant-enriched')observed={event:e,state:sim.snapshot()};});for(let i=0;i<50&&!observed;i++)sim.advance(100);assert.ok(observed);assert.deepEqual(observed.state,sim.snapshot());const a=elephantHerd(observed.state).find(a=>a.id===observed.event.animalId);assert.equal(observed.event.enrichedTicks,a.enrichedTicks);assert.ok(a.logCooldownTicks>0);assert.ok(validateSaveV2(observed.state).ok);sim.dispose();
});
