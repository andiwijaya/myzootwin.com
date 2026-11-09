import {createZebraIndexedDbBackend} from '../../../src/game/persistence/zebra-backend.ts';
import {parseSaveV5,ZEBRA_CHECKPOINT_CODEC} from '../../../src/game/persistence/save-v5.ts';
import {createInitialState} from '../../../src/game/core/initial-state.ts';
/** Existing UUID lookup is read-only. Explicit freshEntry creates only an empty
 * randomly named QA database, for actual product default-language/new-game tests. */
export async function loadZebraProductFixture(){
 const url=new URL(location.href),database=url.searchParams.get('buildDb');if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('Loopback QA origin required');
 if(url.searchParams.get('freshEntry')==='1'){
  if(database)throw Error('Fresh entry cannot target an existing database');
  const fresh='myzootwin-zebra-build-'+crypto.randomUUID(),backend=createZebraIndexedDbBackend(indexedDB,fresh);
  try{if(await backend.read())throw Error('Fresh QA database was not empty');return{database:fresh,state:ZEBRA_CHECKPOINT_CODEC.prepare(createInitialState()),revision:0,caseMetadata:{id:'fresh-empty-entry',scope:'Empty isolated QA database. No initial saved game or claimed grant. Use actual product controls to create a new V5 save; public V5 adoption remains gated.'},close:()=>backend.close()};}catch(error){backend.close();throw error;}
 }
 if(!database||!/^myzootwin-zebra-build-[a-f0-9-]{36}$/.test(database))throw Error('A named loopback Zebra construction QA database is required');
 // A mistyped QA UUID must not create or upgrade a database during read-only lookup.
 const q=indexedDB.open(database);q.onupgradeneeded=()=>q.transaction?.abort();const existing=await new Promise<IDBDatabase>((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('Existing QA database required'));});const version=existing.version;existing.close();if(version!==5)throw Error('Existing version5 QA database required');
 const backend=createZebraIndexedDbBackend(indexedDB,database);try{const record=await backend.read();if(!record||JSON.parse(record.payload).schemaVersion!==5)throw Error('Missing existing strict V5 QA checkpoint');const checked=parseSaveV5(record.payload);if(!checked.ok)throw Error('Invalid V5 fixture '+checked.path);return{database,state:checked.value,revision:record.revision,caseMetadata:{id:'existing-zebra-build-qa',scope:'Previously created isolated validation-only claimed-grant construction fixture. Product UI/path proof only; not a Zebra grant/behavior acceptance fixture.'},close:()=>backend.close()};}catch(e){backend.close();throw e;}
}
