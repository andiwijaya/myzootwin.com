import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {createLionIndexedDbBackend} from '../src/game/persistence/lion-backend.ts';
import {createElephantIndexedDbBackend} from '../src/game/persistence/elephant-backend.ts';
import {ELEPHANT_V1_BACKUP,LION_V2_BACKUP,SAVE_STORE} from '../src/game/persistence/durable-backend.ts';
import {migrateToV3,serializeSaveV3} from '../src/game/persistence/save-v3.ts';
import {createAutosave} from '../src/game/persistence/autosave.ts';
const v2=JSON.parse(readFileSync(new URL('./fixtures/lion-v2-golden.json',import.meta.url),'utf8')).state;
const v1=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state;
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
const seed=async(factory,state=v2)=>{const open=factory.open('lion-test',2);open.onupgradeneeded=()=>open.result.createObjectStore(SAVE_STORE);const db=await request(open),tx=db.transaction(SAVE_STORE,'readwrite'),record={format:2,generation:'lion-fixture',revision:1,writtenAt:1,writer:'lion-qa',payload:JSON.stringify(state)},old={format:2,generation:'v1-fixture',revision:1,writtenAt:0,writer:'lion-qa',payload:JSON.stringify(v1)};tx.objectStore(SAVE_STORE).put(record,'primary');tx.objectStore(SAVE_STORE).put(old,ELEPHANT_V1_BACKUP);await new Promise((r,j)=>{tx.oncomplete=r;tx.onabort=j;});db.close();return {record,old};};
const records=async factory=>{const db=await request(factory.open('lion-test',3)),tx=db.transaction(SAVE_STORE),store=tx.objectStore(SAVE_STORE),rows=await Promise.all(['primary','previous',ELEPHANT_V1_BACKUP,LION_V2_BACKUP].map(k=>request(store.get(k))));db.close();return rows;};
test('IDB emulation: first winning V2-to-V3 CAS atomically preserves original V2 and existing V1 backups; old writer cannot open version 2',async()=>{
 const factory=new IDBFactory(),{record,old}=await seed(factory),backend=createLionIndexedDbBackend(factory,'lion-test');assert.deepEqual(await backend.read(),record);const next=serializeSaveV3(migrateToV3(v2).value);await backend.commit(1,next,'lion-writer',2);backend.close();const [primary,previous,v1Backup,v2Backup]=await records(factory);assert.equal(JSON.parse(primary.payload).schemaVersion,3);assert.deepEqual(previous,record);assert.deepEqual(v1Backup,old);assert.deepEqual(v2Backup,record);
 const legacy=createElephantIndexedDbBackend(factory,'lion-test');await assert.rejects(legacy.read(),e=>e.code==='unreadable');legacy.close();
 const again=createLionIndexedDbBackend(factory,'lion-test');await again.read();await again.commit(2,next,'lion-writer',3);again.close();assert.deepEqual((await records(factory))[3],record);
});
test('IDB emulation: two writers have one transaction winner; losing revision cannot overwrite or duplicate progress',async()=>{
 const factory=new IDBFactory();await seed(factory);const a=createLionIndexedDbBackend(factory,'lion-test'),b=createLionIndexedDbBackend(factory,'lion-test');await Promise.all([a.read(),b.read()]);const payload=serializeSaveV3(migrateToV3(v2).value),results=await Promise.allSettled([a.commit(1,payload,'lion-a',2),b.commit(1,payload,'lion-b',2)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'conflict');a.close();b.close();assert.equal((await records(factory))[0].revision,2);
});
test('IDB emulation: quota/transaction abort preserves primary and both backups, and retry can commit cleanly',async()=>{
 const factory=new IDBFactory(),{record,old}=await seed(factory),backend=createLionIndexedDbBackend(factory,'lion-test');await backend.read();const original=IDBObjectStore.prototype.put;let fail=true;IDBObjectStore.prototype.put=function(value,key){if(key==='primary'&&fail){fail=false;throw new DOMException('Test quota','QuotaExceededError');}return original.call(this,value,key);};
 try{await assert.rejects(backend.commit(1,serializeSaveV3(migrateToV3(v2).value),'lion-fault',2),e=>e.code==='quota');}finally{IDBObjectStore.prototype.put=original;}
 const rows=await records(factory);assert.deepEqual(rows[0],record);assert.deepEqual(rows[2],old);assert.equal(rows[3],undefined);await backend.commit(1,serializeSaveV3(migrateToV3(v2).value),'lion-retry',3);backend.close();assert.deepEqual((await records(factory))[3],record);
});
test('IDB emulation: future content is blocked and never reset, backed up as valid, or downgraded',async()=>{
 const factory=new IDBFactory(),future={...v2,schemaVersion:4},{record}=await seed(factory,future),backend=createLionIndexedDbBackend(factory,'lion-test');await assert.rejects(backend.read(),e=>e.code==='unreadable');assert.equal((await backend.inspectRecovery()).kind,'blocked');await assert.rejects(backend.commit(1,serializeSaveV3(migrateToV3(v2).value),'lion-future',2));backend.close();assert.deepEqual((await records(factory))[0],record);
});
test('IDB emulation: actual autosave Continue, durable migration, reset and Undo reset retain V3 and exactly preserve old fields',async()=>{
 const factory=new IDBFactory();await seed(factory);const save=createAutosave(createLionIndexedDbBackend(factory,'lion-test'),{writer:'lion-session'});await save.load();await save.continueSaved();const state=save.session.read();assert.equal(state.schemaVersion,3);assert.deepEqual(state.missions,v2.missions);assert.deepEqual(state.elephantGrove,v2.elephantGrove);save.session.checkpoint(()=>state,true);await save.flush();save.dispose();
 const backend=createLionIndexedDbBackend(factory,'lion-test');await backend.read();const before=(await records(factory))[0],reset=await backend.inspectRestart('reset');assert.equal(reset.kind,'reset');const fresh=await backend.restart(reset.quote,'lion-reset',3);assert.equal(JSON.parse(fresh.payload).schemaVersion,3);const undo=await backend.inspectRestart('undo-reset');const restored=await backend.restart(undo.quote,'lion-undo',4);assert.equal(restored.payload,before.payload);backend.close();
});
