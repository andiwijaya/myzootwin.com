import {createZebraIndexedDbBackend} from '../../../src/game/persistence/zebra-backend.ts';
import {parseSaveV5} from '../../../src/game/persistence/save-v5.ts';
/** Open only a named, previously created QA construction DB. No seed, reset, grant or owner DB. */
export async function loadZebraProductFixture(){
 const url=new URL(location.href),database=url.searchParams.get('buildDb');if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||!database||!/^myzootwin-zebra-build-[a-f0-9-]{36}$/.test(database))throw Error('A named loopback Zebra construction QA database is required');
 // A mistyped QA UUID must not create or upgrade a database during read-only lookup.
 const q=indexedDB.open(database);q.onupgradeneeded=()=>q.transaction?.abort();const existing=await new Promise<IDBDatabase>((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('Existing QA database required'));});const version=existing.version;existing.close();if(version!==5)throw Error('Existing version5 QA database required');
 const backend=createZebraIndexedDbBackend(indexedDB,database);try{const record=await backend.read();if(!record||JSON.parse(record.payload).schemaVersion!==5)throw Error('Missing existing strict V5 QA checkpoint');const checked=parseSaveV5(record.payload);if(!checked.ok)throw Error('Invalid V5 fixture '+checked.path);return{database,state:checked.value,revision:record.revision,caseMetadata:{id:'existing-zebra-build-qa',scope:'Previously created isolated validation-only claimed-grant construction fixture. Product UI/path proof only; not a Zebra grant/behavior acceptance fixture.'},close:()=>backend.close()};}catch(e){backend.close();throw e;}
}
