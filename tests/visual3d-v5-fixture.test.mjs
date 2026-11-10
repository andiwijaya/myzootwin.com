import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDBFactory} from 'fake-indexeddb';
import {preparedZebraCare} from './helpers/zebra-care-play.mjs';
import {zebraAccessView} from '../src/game/world/zebra-access.ts';
import {validateV5VisualPayload,openV5VisualFixture} from '../scripts/qa/visual3d/v5-visual-fixture.ts';
import {describeWorldFixture} from '../scripts/qa/visual3d/world-fixture.ts';
import {auditSpatialState} from '../scripts/qa/visual3d/spatial-state.ts';
import {stateFingerprint} from '../scripts/qa/visual3d/state-fingerprint.ts';
import {createZebraIndexedDbBackend} from '../src/game/persistence/zebra-backend.ts';
import {SAVE_STORE,ZEBRA_V4_BACKUP} from '../src/game/persistence/durable-backend.ts';
import {serializeSaveV4} from '../src/game/persistence/save-v4.ts';
import {serializeSaveV5} from '../src/game/persistence/save-v5.ts';
const v3=JSON.parse(readFileSync('tests/fixtures/giraffe-v3-golden.json')).state,v4=JSON.parse(readFileSync('tests/fixtures/giraffe-v4-golden.json')).state;
const request=q=>new Promise((r,j)=>{q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);}),done=t=>new Promise((r,j)=>{t.oncomplete=r;t.onabort=()=>j(t.error);});
async function fixture(){const sim=preparedZebraCare();for(let i=0;i<8&&!zebraAccessView(sim.snapshot()).connected;i++){const q=zebraAccessView(sim.snapshot());assert.equal(sim.buildPath(q.path.cell,sim.commandRevision()).ok,true);}const state=sim.snapshot();sim.dispose();const {preferences,...gameplay}=state;const record={id:'v5-zoo-baseline',schema:5,tick:state.tick,species:null,phase:null,stateHash:await stateFingerprint(state),gameplayHash:await stateFingerprint(gameplay)};return{state,record,payload:{metadata:{id:record.id,schema:5,stateHash:record.stateHash},state}};}
async function rows(f,name){const db=await request(f.open(name)),t=db.transaction(SAVE_STORE),primary=t.objectStore(SAVE_STORE).get('primary'),backup=t.objectStore(SAVE_STORE).get(ZEBRA_V4_BACKUP);await done(t);const result={version:db.version,primary:primary.result,backup:backup.result};db.close();return result;}
const name='myzootwin-visual3d-00000000-0000-4000-8000-000000000001';

test('strict V5 visual case validates actual content/phase identity before any database access; corrupt hashes and future metadata cannot masquerade as a phase',async()=>{
 const {state,record,payload}=await fixture(),before=JSON.stringify(state);assert.deepEqual(await validateV5VisualPayload(payload,record),state);
 for(const mutate of [p=>p.metadata.id='other',p=>p.metadata.schema=4,p=>p.metadata.stateHash='0'.repeat(64),p=>p.state.preferences.locale='en',p=>p.state.schemaVersion=6]){const p=structuredClone(payload);mutate(p);await assert.rejects(validateV5VisualPayload(p,record));}
 await assert.rejects(validateV5VisualPayload(payload,{...record,species:'equus-quagga',phase:'groom'}));await assert.rejects(validateV5VisualPayload(payload,{...record,id:'../owner'}));assert.equal(JSON.stringify(state),before);
});

test('fresh V5 visual UUID uses original V3-to-V4-to-V5 backends, preserves exact V4 backup and cold state, and refuses durable phase mutation',async()=>{
 const factory=new IDBFactory(),{state,record}=await fixture(),options={factory,database:name,fresh:true,state,record,v3,v4},first=await openV5VisualFixture(options);assert.deepEqual(first.state,state);assert.equal(first.revision,3);await assert.rejects(first.saveSnapshot(state),/read-only/);first.close();const stored=await rows(factory,name);assert.equal(stored.version,5);assert.equal(stored.backup.payload,serializeSaveV4(v4));assert.equal(stored.backup.revision,2);const cold=await openV5VisualFixture({...options,fresh:false});assert.deepEqual(cold.state,state);cold.close();assert.deepEqual(await rows(factory,name),stored);await assert.rejects(openV5VisualFixture({...options,fresh:false,record:{...record,id:'v5-zebra-walk'}}),/lineage/);assert.deepEqual(await rows(factory,name),stored);
});

test('existing missing/wrong-version/default database lookups refuse without creating or upgrading a V4 checkpoint',async()=>{
 const factory=new IDBFactory(),{state,record}=await fixture(),options={factory,database:name,fresh:false,state,record,v3,v4};await assert.rejects(openV5VisualFixture({...options,database:'myzootwin-save'}));assert.deepEqual(await factory.databases(),[]);await assert.rejects(openV5VisualFixture(options));assert.deepEqual(await factory.databases(),[]);
 const q=factory.open(name,4);q.onupgradeneeded=()=>q.result.createObjectStore(SAVE_STORE);const db=await request(q),t=db.transaction(SAVE_STORE,'readwrite');t.objectStore(SAVE_STORE).put({format:2,generation:'other-v4-qa',revision:1,payload:serializeSaveV4(v4)},'primary');await done(t);db.close();const before=await rows(factory,name);await assert.rejects(openV5VisualFixture(options),/without upgrade/);assert.deepEqual(await rows(factory,name),before);assert.equal((await rows(factory,name)).version,4);
});

test('frozen Asset Lab refuses drift while a separately labelled product case cold-loads actual saved preferences without replacing V4 history',async()=>{
 const factory=new IDBFactory(),{state,record}=await fixture(),options={factory,database:name,fresh:true,state,record,v3,v4},first=await openV5VisualFixture(options);first.close();const before=await rows(factory,name),backend=createZebraIndexedDbBackend(factory,name),current=await backend.read(),changed=structuredClone(state);changed.preferences.locale='en';await backend.commit(current.revision,serializeSaveV5(changed),'actual-product-preference',4);backend.close();await assert.rejects(openV5VisualFixture({...options,fresh:false}),/immutable seed/);const product=await openV5VisualFixture({...options,fresh:false,allowSavedChanges:true});assert.deepEqual(product.state,changed);product.close();assert.deepEqual((await rows(factory,name)).backup,before.backup);
});

test('V5 Full Zoo description and spatial queries use all five actual habitats, source Zebra bodies/ports and paid routes without mutating a save',async()=>{
 const {state}=await fixture(),before=JSON.stringify(state),world=describeWorldFixture(state),spatial=auditSpatialState(state);assert.equal(world.schema,5);assert.equal(world.habitats.length,5);assert.equal(world.habitats.flatMap(h=>h.residents).length,14);assert.equal(world.zebraReserve.spawnedZebras,4);assert.equal(world.zebraReserve.freeInThisFixture,false);assert.equal(world.habitats.find(h=>h.kind==='zebra-grasslands').cells.length,64);assert.ok(world.habitats.every(h=>h.connected));assert.deepEqual(spatial.errors,[]);assert.equal(spatial.targets.length,5);assert.equal(spatial.zebraBodyPairs.length,6);assert.equal(JSON.stringify(state),before);
 const bad=structuredClone(state),a=bad.animals.filter(a=>a.speciesId==='equus-quagga');a[1].position={...a[0].position};assert.ok(auditSpatialState(bad).errors.some(e=>e.code==='ZEBRA_CAPSULE'));assert.throws(()=>describeWorldFixture(bad),/strict-valid V5/);
});
