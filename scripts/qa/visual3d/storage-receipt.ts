import {SAVE_STORE,ELEPHANT_V1_BACKUP,LION_V2_BACKUP,GIRAFFE_V3_BACKUP,ZEBRA_V4_BACKUP} from '../../../src/game/persistence/durable-backend.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {stateFingerprint} from './state-fingerprint.ts';
const request=<T>(q:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
/** Existing UUID only, never enumerates databases or creates/upgrades a store. */
export async function readVisualStorage(factory:IDBFactory,database:string,generation:string){
 if(!/^myzootwin-visual3d-[a-f0-9-]{36}$/.test(database)||!generation.startsWith('visual3d-synthetic-v5-'))throw Error('Explicit visual QA lineage required');
 const q=factory.open(database);q.onupgradeneeded=()=>q.transaction?.abort();const db=await request(q);
 try{
  if(db.version!==5||!db.objectStoreNames.contains(SAVE_STORE))throw Error('Existing strict V5 store required');
  const keys=['primary','previous',ELEPHANT_V1_BACKUP,LION_V2_BACKUP,GIRAFFE_V3_BACKUP,ZEBRA_V4_BACKUP,'preserved','restart'];
  const tx=db.transaction(SAVE_STORE,'readonly'),complete=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);}),values=await Promise.all(keys.map(k=>request(tx.objectStore(SAVE_STORE).get(k))));await complete;
  if(values[0]?.generation!==generation)throw Error('QA lineage mismatch');
  const rows=await Promise.all(values.map(async(value,i)=>{if(value===undefined)return{key:keys[i],present:false};const parsed=typeof value.payload==='string'?JSON.parse(value.payload):null;return{key:keys[i],present:true,envelopeHash:await stateFingerprint(value),payloadHash:typeof value.payload==='string'?[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value.payload)))].map(b=>b.toString(16).padStart(2,'0')).join(''):null,stateHash:parsed?await stateFingerprint(parsed):null,revision:value.revision,generation:value.generation,schema:parsed?.schemaVersion,tick:parsed?.tick,cash:parsed?.currency,strictV5:parsed?.schemaVersion===5?validateSaveV5(parsed).ok:null};}));
  return{at:new Date().toISOString(),database,generation,mode:'readonly',scope:'Explicit existing source-bound visual QA UUID only; no owner enumeration, upgrade, repair or write',rows};
 }finally{db.close();}
}
