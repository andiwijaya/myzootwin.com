import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {IDBFactory} from 'fake-indexeddb';
import {preparedZebraCare} from './helpers/zebra-care-play.mjs';
import {createSimulation} from '../src/game/core/simulation.ts';import {createFrameLoop} from '../src/game/render3d/frame-loop.ts';
import {createPauseGate} from '../src/game-entry/pause-gate.ts';import {zebraAccessView} from '../src/game/world/zebra-access.ts';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {migrateToV5,parseSaveV5,serializeSaveV5,validateSaveV5} from '../src/game/persistence/save-v5.ts';
import {createZebraIndexedDbBackend} from '../src/game/persistence/zebra-backend.ts';
import {SAVE_STORE,ELEPHANT_V1_BACKUP,LION_V2_BACKUP,GIRAFFE_V3_BACKUP,ZEBRA_V4_BACKUP} from '../src/game/persistence/durable-backend.ts';
import {readBaselineStates} from '../scripts/qa/zebra/baseline-fixtures.mjs';
import {totals} from '../src/game/economy/journal.ts';
const normalize=s=>{const value=s.snapshot();value.preferences.speed=1;return value;};
const valid=s=>{const result=validateSaveV5(s);assert.equal(result.ok,true,JSON.stringify(result));};
function seed(){const s=preparedZebraCare();for(let n=0;n<5&&!zebraAccessView(s.snapshot()).connected;n++){const p=zebraAccessView(s.snapshot()).path;assert.ok(p);assert.equal(s.buildPath(p.cell,s.commandRevision()).ok,true);}assert.equal(zebraAccessView(s.snapshot()).connected,true);const state=s.snapshot();s.dispose();return state;}
function care(s){for(const r of s.zebraCareView().resources){if(r.kind==='zebra-shade'||r.stock>2)continue;const q={id:r.id,revision:r.revision,command:s.commandRevision()},p=s.prepareZebraRefill(q);assert.equal(p.ok,true,JSON.stringify(p));assert.equal(s.acceptCommittedZebraCare(p.state,q),true);}const m=s.zebraMissionView(),row=m.rows.find(r=>r.status==='ready');if(row){const q={id:row.id,command:s.commandRevision()},p=s.prepareZebraMission(q);assert.equal(p.ok,true);assert.equal(s.acceptCommittedZebraMission(p.state,q),true);}}
const digest=s=>createHash('sha256').update(JSON.stringify(s)).digest('hex');

test('populated five-habitat V5:6000 accepted ticks match at1x/10x/fractional frames with30 cold reloads, pauses and real paid care', {timeout:240000},t=>{
 const initial=seed(),sims=[createSimulation(initial),createSimulation(initial),createSimulation(initial)],traces=[createHash('sha256'),createHash('sha256'),createHash('sha256')];let reloads=0,pauses=0;
 const subscribe=(s,i)=>s.subscribe(e=>{if(e.type==='speed-changed'||e.type==='preferences-changed')return;traces[i].update(JSON.stringify(e)+'\n');});sims.forEach(subscribe);
 for(let tick=0;tick<6000;tick++){
  if(tick%100===0)for(const s of sims)care(s);
  const speed=Math.floor(tick/300)%2?1:10;sims[1].setSpeed(10);sims[2].setSpeed(speed);
  assert.equal(sims[0].advance(100),1);assert.equal(sims[1].advance(10),1);
  let count=0;for(const part of [17,23,60])count+=sims[2].advance(part/speed);assert.equal(count,1);
  if((tick+1)%200===0){
   const expected=normalize(sims[0]);for(const s of sims){assert.deepEqual(normalize(s),expected);valid(s.snapshot());}
   for(const s of sims){s.setPaused(true);const before=s.snapshot(),metrics=s.inspect();assert.equal(s.advance(86_400_000),0);assert.equal(s.frame(86_400_000),0);assert.deepEqual(s.snapshot(),before);assert.equal(s.inspect().droppedMs,metrics.droppedMs);s.setPaused(false);assert.equal(s.frame(86_400_000),0);assert.deepEqual(s.snapshot(),before);}pauses++;
   const encoded=serializeSaveV5(sims[2].snapshot()),parsed=parseSaveV5(encoded);assert.ok(parsed.ok);const before=sims[2].snapshot();sims[2].dispose();assert.equal(sims[2].inspect().subscribers,0);sims[2]=createSimulation(parsed.value);subscribe(sims[2],2);assert.deepEqual(sims[2].snapshot(),before);assert.equal(sims[2].frame(172_800_000),0);assert.deepEqual(sims[2].snapshot(),before);reloads++;
  }
 }
 const states=sims.map(normalize);assert.deepEqual(states[0],states[1]);assert.deepEqual(states[0],states[2]);const events=traces.map(h=>h.digest('hex'));assert.equal(events[0],events[1]);assert.equal(events[0],events[2]);const end=states[0];assert.equal(end.tick,initial.tick+6000);assert.equal(end.gameTimeMs,end.tick*100);assert.equal(end.animals.length,14);assert.equal(end.world.habitats.length,5);assert.equal(end.currency,Object.values(totals(end).amounts).reduce((a,b)=>a+b,0));assert.ok(end.animals.filter(a=>a.speciesId==='equus-quagga').every(a=>a.foodEaten>0&&a.waterDrunk>0));assert.ok(totals(end).amounts.supplies<totals(initial).amounts.supplies);assert.equal(totals(end).amounts.starter,totals(initial).amounts.starter);for(const key of ['elephantGrove','lionSavanna','giraffePlains','zebraGrasslands'])assert.deepEqual(end[key].grant,initial[key].grant);
 // Claimed old rewards stay exact; genuine active-time objectives may still grow.
 assert.deepEqual(end.giraffePlains.missions.completedIds,initial.giraffePlains.missions.completedIds);assert.deepEqual(end.giraffePlains.missions.rewards,initial.giraffePlains.missions.rewards);assert.equal(end.giraffePlains.missions.currentId,initial.giraffePlains.missions.currentId);for(const key of ['highBrowses','socialInteractions'])assert.ok(end.giraffePlains.missions.objectives[key]>=initial.giraffePlains.missions.objectives[key]);
 for(const s of sims){assert.equal(s.inspect().droppedMs,0);assert.equal(s.inspect().droppedSimulationMs,0);s.dispose();assert.equal(s.inspect().subscribers,0);}
 t.diagnostic(JSON.stringify({case:'zebra-six-thousand-clock-parity',ticks:6000,simulatedMinutes:10,reloads,pauses,actors:14,habitats:5,cash:end.currency,eventDigest:events[0],normalizedStateDigest:digest(end),scope:'Source simulated time, not a native soak/performance or grant-budget test'}));
});

test('populated V5 frame timestamps, pause owners and speed changes never consume a background gap or award offline care',()=>{
 const s=createSimulation(seed()),gate=createPauseGate(p=>s.setPaused(p));s.frame(100);s.frame(170);const before=s.snapshot();
 gate.hold('background',true);gate.hold('dialog',true);gate.resume();assert.equal(gate.paused(),true);assert.equal(s.frame(9_000_000),0);assert.equal(s.advance(9_000_000),0);assert.deepEqual(s.snapshot(),before);gate.hold('dialog',false);assert.equal(gate.paused(),false);assert.equal(s.frame(9_000_000),0);assert.equal(s.frame(9_000_030),0);assert.equal(s.frame(9_000_100),1);
 s.setSpeed(10);const fast=s.snapshot();assert.equal(s.frame(50_000_000),0);assert.deepEqual(s.snapshot(),fast);assert.equal(s.frame(50_000_010),1);assert.equal(s.setSpeed(10),false);assert.equal(s.frame(50_000_020),1);const end=s.snapshot();assert.equal(s.frame(50_000_000),0);assert.deepEqual(s.snapshot(),end);assert.equal(s.inspect().droppedMs,0);valid(end);s.dispose();
});

test('one real frame-loop owner: repeated V5 remounts reject stale queued callbacks and nested time without duplicate events',()=>{
 const pending=new Map();let serial=0,renders=0,time=0;const driver={request(fn){pending.set(++serial,fn);return serial;},cancel(id){pending.delete(id);}},s=createSimulation(seed());s.setSpeed(10);let ticks=0;const off=s.subscribe(e=>{if(e.type==='tick'){ticks++;assert.equal(s.frame(time+1_000_000),0);assert.equal(s.advance(100),0);}});
 const deliver=t=>{assert.equal(pending.size,1);const [id,fn]=pending.entries().next().value;pending.delete(id);time=t;fn(t);assert.equal(pending.size,1);};
 for(let i=0;i<10;i++){s.setPaused(false);const loop=createFrameLoop(driver,t=>{s.frame(t);renders++;},()=>assert.fail('frame-loop failure'));loop.start();loop.start();assert.equal(pending.size,1);deliver(i*1_000_000);deliver(i*1_000_000+100);const stale=pending.values().next().value;loop.stop();s.setPaused(true);const before=s.snapshot();stale(i*1_000_000+1_000_000);assert.deepEqual(s.snapshot(),before);assert.equal(pending.size,0);loop.dispose();}
 assert.equal(renders,20);assert.equal(ticks,100);assert.equal(s.inspect().listenerErrors,0);valid(s.snapshot());off();s.dispose();assert.equal(s.inspect().subscribers,0);assert.equal(pending.size,0);
});

const request=q=>new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});const done=t=>new Promise((resolve,reject)=>{t.oncomplete=resolve;t.onabort=()=>reject(t.error);});
test('populated V5 actual backend restart/one-time restore keeps all animals/mission/ledger bytes, original V4 and stale-generation guard',async()=>{
 const f=new IDBFactory(),name='myzootwin-zebra-clock-source-isolated',initial=seed(),base=readBaselineStates(),open=f.open(name,4);open.onupgradeneeded=()=>open.result.createObjectStore(SAVE_STORE);const db=await request(open),tx=db.transaction(SAVE_STORE,'readwrite'),store=tx.objectStore(SAVE_STORE),seedRecord=s=>({format:2,generation:'clock-original',revision:1,writtenAt:1,writer:'clock-original',payload:JSON.stringify(s)}),v4=seedRecord(base.find(x=>x.state.schemaVersion===4).state);store.put(v4,'primary');for(const [version,key]of [[1,ELEPHANT_V1_BACKUP],[2,LION_V2_BACKUP],[3,GIRAFFE_V3_BACKUP]])store.put(seedRecord(base.find(x=>x.state.schemaVersion===version).state),key);await done(tx);db.close();
 // A populated V5 fixture cannot be invented as a fresh empty-store predecessor.
 const a=createZebraIndexedDbBackend(f,name);await a.read();const first=await a.commit(1,serializeSaveV5(initial),'clock-first',2);
 const rows=async()=>{const db=await request(f.open(name)),tx=db.transaction(SAVE_STORE),values=await Promise.all(['primary','previous','restart',ZEBRA_V4_BACKUP].map(k=>request(tx.objectStore(SAVE_STORE).get(k))));await done(tx);db.close();return values;};
 const old=await rows(),stale=createZebraIndexedDbBackend(f,name);await stale.read();const review=await a.inspectRestart('reset');assert.ok(review.quote);assert.deepEqual(await rows(),old);const fresh=await a.restart(review.quote,'clock-reset',2),state=JSON.parse(fresh.payload);assert.equal(state.schemaVersion,5);assert.equal(state.preferences.speed,1);assert.equal(state.tick,0);assert.equal(state.currency,1500);const expected=migrateToV5(createInitialState()).value;expected.preferences={...initial.preferences,speed:1};assert.deepEqual(state,expected);assert.equal(state.zebraGrasslands.grant,null);assert.notEqual(fresh.generation,first.generation);assert.deepEqual((await rows())[3],old[3]);await assert.rejects(stale.commit(fresh.revision,first.payload,'stale',3),e=>e.code==='conflict');
 const restore=await a.inspectRestart('undo-reset');assert.ok(restore.quote);const restored=await a.restart(restore.quote,'clock-restore',4);assert.equal(restored.payload,first.payload);assert.deepEqual((await rows())[3],old[3]);assert.equal((await a.inspectRestart('undo-reset')).quote,null);a.close();stale.close();const cold=createZebraIndexedDbBackend(f,name),record=await cold.read();assert.equal(record.payload,first.payload);const sim=createSimulation(parseSaveV5(record.payload).value);assert.deepEqual(sim.snapshot(),initial);sim.setPaused(true);assert.equal(sim.advance(86_400_000),0);assert.equal(sim.frame(86_400_000),0);assert.deepEqual(sim.snapshot(),initial);sim.dispose();cold.close();
});
