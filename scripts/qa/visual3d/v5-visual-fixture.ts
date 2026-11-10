import {stateFingerprint} from './state-fingerprint.ts';
import type {ZooSaveV3} from '../../../src/game/core/zoo-state.ts';
import type {ZooSaveV4} from '../../../src/game/core/giraffe-state.ts';
import type {ZooSaveV5} from '../../../src/game/core/zebra-state.ts';
import {createGiraffeIndexedDbBackend} from '../../../src/game/persistence/giraffe-backend.ts';
import {createZebraIndexedDbBackend} from '../../../src/game/persistence/zebra-backend.ts';
import {serializeSaveV4} from '../../../src/game/persistence/save-v4.ts';
import {validateSaveV5,serializeSaveV5,parseSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {SAVE_STORE} from '../../../src/game/persistence/durable-backend.ts';
import {phaseGeneration,type PhaseRecord} from './phase-contract.ts';

export async function validateV5VisualPayload(payload:unknown,record:PhaseRecord){
 if(!/^[a-z0-9-]{1,40}$/.test(record.id)||record.schema!==5||!payload||typeof payload!=='object')throw Error('Explicit V5 visual case required');
 const p=payload as {metadata?:{id?:unknown;schema?:unknown;stateHash?:unknown};state?:unknown},checked=validateSaveV5(p.state);
 if(p.metadata?.id!==record.id||p.metadata.schema!==5||p.metadata.stateHash!==record.stateHash||!checked.ok||checked.value.tick!==record.tick||record.species&&!checked.value.animals.some(a=>a.speciesId===record.species&&a.motion.phase===record.phase))throw Error('Invalid strict V5 visual case/phase identity');
 const {preferences,...gameplay}=checked.value;if(await stateFingerprint(checked.value)!==record.stateHash||await stateFingerprint(gameplay)!==record.gameplayHash)throw Error('V5 visual state/gameplay content hash mismatch');
 return checked.value;
}
const request=<T>(q:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
const done=(tx:IDBTransaction)=>new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});
/** QA-only native backend adapter. An existing UUID is inspected WITHOUT a
 * requested version first, so mistyped V4 lineage cannot be upgraded by lookup. */
export async function openV5VisualFixture(options:{factory:IDBFactory;database:string;fresh:boolean;record:PhaseRecord;state:ZooSaveV5;v3:ZooSaveV3;v4:ZooSaveV4;allowSavedChanges?:boolean}){
 const {factory,database,fresh,record,state,v3,v4}=options,generation=phaseGeneration(record.id);
 if(!/^myzootwin-visual3d-[a-f0-9-]{36}$/.test(database)||record.schema!==5||!validateSaveV5(state).ok)throw Error('Refusing non-QA V5 fixture');
 if(fresh){
  const q=factory.open(database,3);q.onupgradeneeded=()=>q.result.createObjectStore(SAVE_STORE);const db=await request(q);
  try{const tx=db.transaction(SAVE_STORE,'readwrite');tx.objectStore(SAVE_STORE).add({format:2,generation,revision:1,writtenAt:1,writer:'visual3d-r7-original-v3',payload:JSON.stringify(v3)},'primary');await done(tx);}finally{db.close();}
  const old=createGiraffeIndexedDbBackend(factory,database);try{await old.read();await old.commit(1,serializeSaveV4(v4),'visual3d-r7-original-v4',2);}finally{old.close();}
  const next=createZebraIndexedDbBackend(factory,database);try{await next.read();await next.commit(2,serializeSaveV5(state),'visual3d-r7-causal-v5-case',3);}finally{next.close();}
 }else{
  const q=factory.open(database);q.onupgradeneeded=()=>q.transaction?.abort();const db=await request(q);
  try{if(db.version!==5||!db.objectStoreNames.contains(SAVE_STORE))throw Error('Existing V5 QA lineage required without upgrade');const tx=db.transaction(SAVE_STORE,'readonly'),value=await request(tx.objectStore(SAVE_STORE).get('primary'));await done(tx);if(value?.generation!==generation)throw Error('QA fixture lineage mismatch');}finally{db.close();}
 }
 const backend=createZebraIndexedDbBackend(factory,database);
 try{const checkpoint=await backend.read();if(!checkpoint||checkpoint.generation!==generation)throw Error('Missing V5 visual checkpoint lineage');const checked=parseSaveV5(checkpoint.payload);if(!checked.ok)throw Error('Invalid V5 visual checkpoint');if(!options.allowSavedChanges&&serializeSaveV5(checked.value)!==serializeSaveV5(state))throw Error('Frozen visual case differs from immutable seed');
  return{database,caseMetadata:record,state:checked.value,revision:checkpoint.revision,async saveSnapshot(){throw Error('Immutable V5 phase cases are read-only; use a fresh product QA case for durable actions');},close:()=>backend.close()};
 }catch(e){backend.close();throw e;}
}
