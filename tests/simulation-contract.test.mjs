import { createFrameLoop } from '../src/game/render3d/frame-loop.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/core/initial-state.ts';
import { createSimulation } from '../src/game/core/simulation.ts';
import { createEventBus } from '../src/game/core/events.ts';
import { createFixedClock, MAX_FRAME_MS, MAX_STEPS_PER_FRAME } from '../src/game/core/fixed-clock.ts';
import { nextRandom } from '../src/game/core/random.ts';
import { TICK_MS } from '../src/game/core/state.ts';
import { parseSave, serializeSave, validateSave, MAX_SAVE_CHARS } from '../src/game/persistence/save-v1.ts';

import { populated } from './fixtures/populated-zoo-v1.mjs';

test('initial state has two reserve macaws, concrete bounded grid, reconciled starter ledger and no fake gameplay',()=>{
  const state=createInitialState();assert.equal(validateSave(state).ok,true);
  assert.equal(state.animals.length,2);assert.equal(state.world.tiles.length,120);
  assert.ok(state.animals.every(a=>a.habitatId===null&&a.position===null));
  assert.equal(state.visitors.length,0);assert.deepEqual(state.missions.completedIds,[]);
});
test('initial and populated version-1 save roundtrip preserve every reference without sharing mutable data',()=>{
  for(const original of [createInitialState(),populated()]) {
    const text=serializeSave(original),loaded=parseSave(text);
    assert.equal(loaded.ok,true);assert.deepEqual(loaded.value,original);
    loaded.value.animals[0].energy=0;assert.equal(original.animals[0].energy,100);
  }
});
test('seeded RNG has a known uint32 vector, reproducibility and valid fraction range',()=>{
  let state=1;const values=[];
  for(let i=0;i<5;i++){const result=nextRandom(state);state=result.state;values.push(state);assert.ok(result.value>=0&&result.value<1);}
  assert.deepEqual(values,[270369,67634689,2647435461,307599695,2398689233]);
  for(const bad of [0,-1,1.5,NaN,0x100000000])assert.throws(()=>nextRandom(bad),RangeError);
});
test('same accepted time produces byte-identical state under integer and fractional frame partitions',()=>{
  const partitions=[Array(20).fill(100),Array(125).fill(16),Array(120).fill(2000/120),[250,50,170,130,200,100,240,60,250,50,250,250]];
  const snapshots=partitions.map(parts=>{const sim=createSimulation(createInitialState(42));parts.forEach(ms=>sim.advance(ms));return serializeSave(sim.snapshot());});
  assert.ok(snapshots.every(text=>text===snapshots[0]));assert.equal(JSON.parse(snapshots[0]).tick,20);
});
test('frame adapter ignores first frame and repeated timestamps; simulation is independent of render calls',()=>{
  const sim=createSimulation();let ticks=0;sim.subscribe(e=>{if(e.type==='tick')ticks++;});
  [10,10,60,110,110].forEach(t=>sim.frame(t));assert.equal(ticks,1);assert.equal(sim.inspect().gameTimeMs,TICK_MS);
  sim.frame(50);sim.frame(210);assert.equal(ticks,2);
});
test('bounded catch-up drops long gaps instead of granting unlimited offline progress',()=>{
  const sim=createSimulation();assert.ok(sim.advance(60000)<=MAX_STEPS_PER_FRAME);
  assert.equal(sim.inspect().tick,2);assert.equal(sim.inspect().droppedMs,60000-MAX_FRAME_MS);
  assert.ok(sim.inspect().accumulatorMs<TICK_MS);
});
test('pause resets fractional catch-up, ignores hidden elapsed time and resumes from a fresh anchor',()=>{
  const sim=createSimulation();sim.frame(0);sim.frame(50);sim.setPaused(true);sim.frame(60000);sim.advance(1000);
  assert.equal(sim.inspect().tick,0);sim.setPaused(false);sim.frame(60000);sim.frame(60050);assert.equal(sim.inspect().tick,0);
  sim.setPaused(false);sim.frame(60100);assert.equal(sim.inspect().tick,1);
});
test('snapshot and reload continue deterministic RNG/time without storing RAF timestamps or accumulator',()=>{
  const first=createSimulation(createInitialState(19));for(let i=0;i<10;i++)first.advance(100);
  const loaded=parseSave(serializeSave(first.snapshot()));assert.equal(loaded.ok,true);
  const second=createSimulation(loaded.value);for(let i=0;i<10;i++){first.advance(100);second.advance(100);}
  assert.deepEqual(first.snapshot(),second.snapshot());assert.equal('accumulatorMs' in loaded.value,false);
});
test('restart preserves one subscriber, emits baseline reset time and cannot revive disposed simulation',()=>{
  const baseline=createInitialState();baseline.tick=2;baseline.gameTimeMs=200;
  const sim=createSimulation(baseline);const events=[];sim.subscribe(e=>events.push(e));
  for(let i=0;i<3;i++){sim.advance(100);sim.reset();assert.equal(sim.inspect().subscribers,1);assert.equal(sim.inspect().tick,2);}
  assert.equal(events.filter(e=>e.type==='tick').length,3);assert.equal(events.filter(e=>e.type==='reset').length,3);
  assert.equal(events.at(-1).gameTimeMs,200);sim.dispose();sim.dispose();sim.advance(200);sim.frame(10000);sim.reset();
  assert.equal(events.length,6);assert.equal(sim.inspect().subscribers,0);
});
test('event unsubscribe during dispatch, throwing listener and bus disposal are safe and observable',()=>{
  const bus=createEventBus();const received=[];let unsubscribe;
  bus.subscribe(()=>unsubscribe());unsubscribe=bus.subscribe(()=>received.push('removed'));
  bus.subscribe(()=>{throw Error('isolated subscriber');});const off=bus.subscribe(e=>received.push(e));
  bus.emit('a');off();off();bus.emit('b');assert.deepEqual(received,['a']);assert.equal(bus.inspect().listenerErrors,2);
  bus.dispose();bus.subscribe(()=>assert.fail());bus.emit('c');assert.equal(bus.inspect().subscribers,0);
});
test('invalid deltas/timestamps are rejected and paused/disposed clocks never step',()=>{
  const sim=createSimulation();for(const bad of [-1,NaN,Infinity]){assert.throws(()=>sim.advance(bad),RangeError);assert.throws(()=>sim.frame(bad),RangeError);}
  const clock=createFixedClock(()=>assert.fail());clock.setPaused(true);clock.advance(100);clock.dispose();clock.setPaused(false);clock.reset();clock.advance(100);
});
test('schema rejection is explicit for malformed JSON, future schema, oversize and non-data objects',()=>{
  assert.equal(parseSave('{broken').code,'invalid-json');assert.equal(parseSave(' '.repeat(MAX_SAVE_CHARS+1)).code,'too-large');
  const future=createInitialState();future.schemaVersion=2;assert.equal(validateSave(future).code,'unsupported-schema');
  const custom=Object.assign(new Date(),createInitialState());assert.equal(validateSave(custom).ok,false);
  const extra=createInitialState();extra.mesh={};assert.equal(validateSave(extra).ok,false);
  const missing=createInitialState();delete missing.preferences;assert.equal(validateSave(missing).ok,false);
  const sparse=createInitialState();sparse.missions.objectives.birdsFedIds=new Array(1);assert.equal(validateSave(sparse).ok,false);
  const decorated=createInitialState();decorated.missions.objectives.birdsFedIds.extra='unexpected';assert.equal(validateSave(decorated).ok,false);
});
test('range/reference/invariant corruptions are rejected without mutating their source',()=>{
  const mutations=[s=>s.animals[0].welfare=101,s=>s.animals[0].hunger=NaN,s=>s.randomState=0,s=>s.tick=.5,s=>s.gameTimeMs=1,
    s=>s.animals[1].id=s.animals[0].id,s=>s.animals.pop(),s=>s.world.tiles.pop(),s=>s.world.tiles[0].cell=s.world.tiles[1].cell,
    s=>s.world.tiles[0].occupantId='missing',s=>s.world.tiles.find(t=>t.terrain==='creek').path=true,s=>s.world.habitats[0].cells.push({x:11,z:1}),
    s=>s.world.resources[0].stock=11,s=>s.world.resources[0].habitatId='missing',s=>s.animals[0].target={x:10,z:9},
    s=>s.animals[0].targetResourceId='missing',s=>s.world.resources[0].kind='water',s=>s.currency=-1,s=>s.currency=0,s=>s.ledger[1].operationId=s.ledger[0].operationId,
    s=>s.admissions.push({...s.admissions[0],id:'admission-2'}),s=>s.admissions[0].ledgerEntryId='ledger-starter',
    s=>s.visitors[0].routeIndex=99,s=>s.visitors[0].route=[{x:1,z:8},{x:2,z:3}],s=>s.visitors[0].admissionId='missing',
    s=>s.missions.completedIds=['Q03'],s=>s.missions.rewards.push({...s.missions.rewards[0]}),s=>s.missions.objectives.birdsFedIds=['missing'],s=>s.missions.objectives.thrivingTicks=1];
  for(const mutate of mutations){const s=populated();mutate(s);const before=structuredClone(s);assert.equal(validateSave(s).ok,false,mutate.toString());assert.deepEqual(s,before);assert.throws(()=>serializeSave(s));}
});
test('simulation ownership rejects invalid input and snapshots cannot change authoritative currency/needs',()=>{
  const invalid=createInitialState();invalid.currency=-1;assert.throws(()=>createSimulation(invalid));
  const initial=createInitialState();const sim=createSimulation(initial);initial.currency=0;const view=sim.snapshot();view.animals[0].energy=0;
  sim.advance(100);assert.equal(sim.snapshot().currency,1500);assert.equal(sim.snapshot().animals[0].energy,100);
  assert.equal(sim.snapshot().ledger.length,1);assert.equal(sim.snapshot().visitors.length,0);assert.deepEqual(sim.snapshot().missions.completedIds,[]);
});


test('existing RAF owner drives fixed steps through pause/restart without a second loop or late updates',()=>{
  const pending=new Map();let next=0,maxPending=0;
  const frames={request(fn){const id=++next;pending.set(id,fn);maxPending=Math.max(maxPending,pending.size);return id;},cancel(id){pending.delete(id);}};
  const fire=time=>{const [id,fn]=[...pending][0];pending.delete(id);fn(time);};
  const sim=createSimulation();const events=[];const off=sim.subscribe(event=>events.push(event));
  const loop=createFrameLoop(frames,time=>sim.frame(time),()=>assert.fail('unexpected RAF error'));
  loop.start();loop.start();fire(0);fire(100);assert.equal(sim.inspect().tick,1);
  const stale=[...pending.values()][0];loop.stop();sim.setPaused(true);sim.reset();
  sim.setPaused(false);loop.start();stale(40000);fire(50000);fire(50100);
  assert.equal(sim.inspect().tick,1);assert.equal(sim.inspect().subscribers,1);assert.equal(maxPending,1);
  const late=[...pending.values()][0];loop.dispose();off();sim.dispose();const count=events.length;late(60000);
  assert.equal(events.length,count);assert.equal(pending.size,0);assert.equal(sim.inspect().subscribers,0);
});
