import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAutosave} from '../src/game/persistence/autosave.ts';
import {SaveFault} from '../src/game/persistence/checkpoint.ts';
import {migrateToV3,LION_CHECKPOINT_CODEC,serializeSaveV3} from '../src/game/persistence/save-v3.ts';
import {prepareLionGrant} from '../src/game/economy/lion-grant.ts';
import {IDBFactory} from 'fake-indexeddb';
import {createZebraIndexedDbBackend} from '../src/game/persistence/zebra-backend.ts';
import {SAVE_STORE,ELEPHANT_V1_BACKUP,LION_V2_BACKUP,GIRAFFE_V3_BACKUP,ZEBRA_V4_BACKUP} from '../src/game/persistence/durable-backend.ts';
import {migrateToV5,serializeSaveV5} from '../src/game/persistence/save-v5.ts';
import {readBaselineStates} from '../scripts/qa/zebra/baseline-fixtures.mjs';

test('a reward candidate joins a follow-up autosave started by another already-running drain before using its revision',async()=>{
 const state=migrateToV3(JSON.parse(readFileSync(new URL('./fixtures/lion-v2-golden.json',import.meta.url),'utf8')).state).value;
 let stored={format:2,generation:'overlapping-drain',revision:1,writtenAt:1,writer:'seed',payload:serializeSaveV3(state)},calls=0,serial=Promise.resolve(),releaseFirst,releaseSecond,enterFirst,enterSecond;
 const firstGate=new Promise(resolve=>releaseFirst=resolve),secondGate=new Promise(resolve=>releaseSecond=resolve),firstStarted=new Promise(resolve=>enterFirst=resolve),secondStarted=new Promise(resolve=>enterSecond=resolve);
 const backend={codec:LION_CHECKPOINT_CODEC,async read(){return structuredClone(stored);},commit(expected,payload,writer,writtenAt){
  const call=++calls;const work=serial.then(async()=>{if(call===1){enterFirst();await firstGate;}if(call===2){enterSecond();await secondGate;}if(expected!==stored.revision)throw new SaveFault('conflict');stored={...stored,revision:expected+1,payload,writer,writtenAt};return structuredClone(stored);});serial=work.catch(()=>{});return work;
 },close(){}};
 const save=createAutosave(backend,{writer:'single-actual-tab'});await save.load();await save.continueSaved();
 save.session.checkpoint(()=>state,true);const existingDrain=save.flush();await firstStarted;
 save.session.checkpoint(()=>state,true);const quote={command:state.economy.nextCommand},candidate=prepareLionGrant(state,quote);assert.ok(candidate.ok);
 const claim=save.session.commitCandidate(candidate.state,{tick:state.tick,command:quote.command});releaseFirst();await secondStarted;
 for(let step=0;step<8;step++)await Promise.resolve();const callsBeforeFollowUpCompleted=calls;
 releaseSecond();const [accepted]=await Promise.all([claim,existingDrain]);save.dispose();
 assert.equal(callsBeforeFollowUpCompleted,2,'The candidate must not submit a competing write while the second autosave owns the transaction queue');
 assert.ok(accepted);assert.equal(accepted.currency,state.currency+1800);assert.equal(save.view().phase,'saved');
 assert.equal(JSON.parse(stored.payload).ledger.filter(entry=>entry.id==='lion-savanna-grant-v1').length,1);
});

test('late public and session flushes join disposal while a real V5 candidate and final preference write settle',async()=>{
 const f=new IDBFactory(),name='zebra-closing-drain-regression',states=readBaselineStates(),v4=states.find(x=>x.state.schemaVersion===4).state;
 const request=q=>new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);}),done=t=>new Promise((resolve,reject)=>{t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(t.error);});
 const q=f.open(name,4);q.onupgradeneeded=()=>q.result.createObjectStore(SAVE_STORE);const db=await request(q),tx=db.transaction(SAVE_STORE,'readwrite'),store=tx.objectStore(SAVE_STORE),original={format:2,generation:'closing-drain-regression',revision:1,writtenAt:1,writer:'original-v4',payload:JSON.stringify(v4)};
 store.put(original,'primary');for(const[v,key]of[[1,ELEPHANT_V1_BACKUP],[2,LION_V2_BACKUP],[3,GIRAFFE_V3_BACKUP]])store.put({...original,payload:JSON.stringify(states.find(s=>s.state.schemaVersion===v).state)},key);await done(tx);db.close();
 const seed=createZebraIndexedDbBackend(f,name);await seed.read();await seed.commit(1,serializeSaveV5(migrateToV5(v4).value),'v5-migration',2);seed.close();
 const backend=createZebraIndexedDbBackend(f,name),commit=backend.commit.bind(backend),close=backend.close.bind(backend);let release,entered,held=true,closes=0,writes=0;
 const gate=new Promise(r=>release=r),started=new Promise(r=>entered=r);backend.commit=async(...args)=>{writes++;if(held){held=false;entered();await gate;}return commit(...args);};backend.close=()=>{closes++;close();};
 const save=createAutosave(backend,{writer:'closing-v5-writer',schedule:()=>0,cancel:()=>{}});await save.load();await save.continueSaved();const before=save.session.read(),candidate=structuredClone(before);candidate.economy.nextCommand++;
 const pending=save.session.commitCandidate(candidate,{tick:before.tick,command:before.economy.nextCommand});await started;assert.equal(save.session.read().economy.nextCommand,before.economy.nextCommand);
 const latest=structuredClone(before);latest.preferences.muted=!latest.preferences.muted;save.session.checkpoint(()=>structuredClone(latest),true);save.dispose();save.session.flush();const lateA=save.flush(),lateB=save.flush();release();assert.ok(await pending);await Promise.all([lateA,lateB]);
 assert.equal(save.inspect().disposed,true);assert.equal(save.inspect().phase,'saved');assert.equal(save.inspect().dirty,false);assert.equal(save.inspect().inflight,false);assert.equal(writes,2);assert.equal(closes,1);
 const cold=createZebraIndexedDbBackend(f,name),record=await cold.read(),stored=JSON.parse(record.payload);cold.close();assert.equal(stored.economy.nextCommand,candidate.economy.nextCommand);assert.equal(stored.currency,before.currency);assert.equal(stored.preferences.muted,latest.preferences.muted);
 const raw=await request(f.open(name)),t=raw.transaction(SAVE_STORE),backup=await request(t.objectStore(SAVE_STORE).get(ZEBRA_V4_BACKUP));await done(t);raw.close();assert.deepEqual(backup,original);
});
