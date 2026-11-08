import v3 from '../../../tests/fixtures/giraffe-v3-golden.json';
import v4 from '../../../tests/fixtures/giraffe-v4-golden.json';
import {createGiraffeIndexedDbBackend} from '../../../src/game/persistence/giraffe-backend.ts';
import {serializeSaveV4,validateSaveV4,GIRAFFE_CHECKPOINT_CODEC} from '../../../src/game/persistence/save-v4.ts';
import {stateFromCheckpoint} from '../../../src/game/persistence/checkpoint.ts';
import type {ZooSaveV4} from '../../../src/game/core/giraffe-state.ts';
import type {ZooSave} from '../../../src/game/core/zoo-state.ts';

/** QA origin + UUID database only. Real production backend preserves original V3 atomically. */
export async function loadVisualFixture(){
 const url=new URL(location.href);let name=url.searchParams.get('fixtureDb');const fresh=name===null;
 if(fresh){name='myzootwin-visual3d-'+crypto.randomUUID();url.searchParams.set('fixtureDb',name);history.replaceState(null,'',url);}
 if(!name||!/^myzootwin-visual3d-[a-f0-9-]{36}$/.test(name))throw Error('Refusing non-QA database');
 const database=name;
 if(fresh){
  const request=indexedDB.open(database,3);request.onupgradeneeded=()=>request.result.createObjectStore('checkpoints');
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{const tx=db.transaction('checkpoints','readwrite'),store=tx.objectStore('checkpoints');store.add({format:2,generation:'visual3d-synthetic-fixture',revision:1,writtenAt:1,writer:'visual3d-qa-seed',payload:JSON.stringify(v3.state)},'primary');await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
 }
 const backend=createGiraffeIndexedDbBackend(indexedDB,database);
 try{
  let checkpoint=await backend.read();if(!checkpoint)throw Error('Missing QA fixture');
  if(fresh){await backend.commit(checkpoint.revision,serializeSaveV4(v4.state as unknown as ZooSaveV4),'visual3d-frozen-v4',Date.now());checkpoint=await backend.read();}
  if(!checkpoint)throw Error('Missing QA V4 checkpoint');const state=stateFromCheckpoint(checkpoint,GIRAFFE_CHECKPOINT_CODEC),checked=validateSaveV4(state);if(!checked.ok)throw Error('Invalid QA V4 fixture');
  let revision=checkpoint.revision;
  return {database,state:checked.value,get revision(){return revision;},async saveSnapshot(input:ZooSave){const checked=validateSaveV4(input);if(!checked.ok)throw Error('Refusing invalid QA snapshot');const committed=await backend.commit(revision,serializeSaveV4(checked.value),'visual3d-explicit-cold-snapshot',Date.now());revision=committed.revision;return {revision,state:stateFromCheckpoint(committed,GIRAFFE_CHECKPOINT_CODEC)};},close:()=>backend.close()};
 }catch(error){backend.close();throw error;}
}
