import v3 from '../../../tests/fixtures/giraffe-v3-golden.json';
import v4 from '../../../tests/fixtures/giraffe-v4-golden.json';
import {createGiraffeIndexedDbBackend} from '../../../src/game/persistence/giraffe-backend.ts';
import {serializeSaveV4,validateSaveV4,GIRAFFE_CHECKPOINT_CODEC} from '../../../src/game/persistence/save-v4.ts';
import {stateFromCheckpoint} from '../../../src/game/persistence/checkpoint.ts';
import type {ZooSaveV4} from '../../../src/game/core/giraffe-state.ts';
import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {selectPhaseRecord,phaseGeneration,type PhaseIndex} from './phase-contract.ts';
declare const __VIS3D_PHASE_INDEX__:PhaseIndex;
async function textHash(text:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');}

/** QA origin + UUID database only. Real production backend preserves original V3 atomically. */
export async function loadVisualFixture(){
 const url=new URL(location.href);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('Asset Lab fixture is loopback-only');const phase=selectPhaseRecord(__VIS3D_PHASE_INDEX__,url.searchParams.get('case')),generation=phaseGeneration(phase?.id??null);let seeded:ZooSaveV4=v4.state as unknown as ZooSaveV4;if(phase){const response=await fetch('/fixtures/'+phase.id+'.json');if(!response.ok)throw Error('Missing immutable phase fixture');const text=await response.text();if(await textHash(text)!==phase.fileHash)throw Error('Phase fixture content hash mismatch');const payload=JSON.parse(text)as{metadata:{id:string};state:unknown},checked=validateSaveV4(payload.state);if(payload.metadata.id!==phase.id||!checked.ok||checked.value.tick!==phase.tick||phase.species&&!checked.value.animals.some(a=>a.speciesId===phase.species&&a.motion.phase===phase.phase))throw Error('Invalid actual phase fixture');seeded=checked.value;}let name=url.searchParams.get('fixtureDb');const fresh=name===null;
 if(fresh){name='myzootwin-visual3d-'+crypto.randomUUID();url.searchParams.set('fixtureDb',name);history.replaceState(null,'',url);}
 if(!name||!/^myzootwin-visual3d-[a-f0-9-]{36}$/.test(name))throw Error('Refusing non-QA database');
 const database=name;
 if(fresh){
  const request=indexedDB.open(database,3);request.onupgradeneeded=()=>request.result.createObjectStore('checkpoints');
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{const tx=db.transaction('checkpoints','readwrite'),store=tx.objectStore('checkpoints');store.add({format:2,generation,revision:1,writtenAt:1,writer:'visual3d-qa-seed',payload:JSON.stringify(v3.state)},'primary');await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
 }
 const backend=createGiraffeIndexedDbBackend(indexedDB,database);
 try{
  let checkpoint=await backend.read();if(!checkpoint)throw Error('Missing QA fixture');
  if(fresh){await backend.commit(checkpoint.revision,serializeSaveV4(seeded),phase?'visual3d-phase-'+phase.id:'visual3d-frozen-v4',Date.now());checkpoint=await backend.read();}
  if(!checkpoint)throw Error('Missing QA V4 checkpoint');if(checkpoint.generation!==generation)throw Error('QA fixture lineage mismatch; open a fresh UUID for another case');const state=stateFromCheckpoint(checkpoint,GIRAFFE_CHECKPOINT_CODEC),checked=validateSaveV4(state);if(!checked.ok)throw Error('Invalid QA V4 fixture');
  let revision=checkpoint.revision;
  return {database,caseMetadata:phase??{id:'frozen-earned-v4',mode:'original-fixture-or-explicit-QA-checkpoint',recipe:'Original UI-earned V4, actual backend/cold save only'},state:checked.value,get revision(){return revision;},async saveSnapshot(input:ZooSave){const checked=validateSaveV4(input);if(!checked.ok)throw Error('Refusing invalid QA snapshot');const committed=await backend.commit(revision,serializeSaveV4(checked.value),'visual3d-explicit-cold-snapshot',Date.now());revision=committed.revision;return {revision,state:stateFromCheckpoint(committed,GIRAFFE_CHECKPOINT_CODEC)};},close:()=>backend.close()};
 }catch(error){backend.close();throw error;}
}
