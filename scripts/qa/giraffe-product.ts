import {mountGameEntry} from '../../src/game-entry/game-entry.ts';
import {mountFoundationScene} from '../../src/game/render3d/foundation-scene.ts';
import {createGiraffeIndexedDbBackend} from '../../src/game/persistence/giraffe-backend.ts';
import {GIRAFFE_CHECKPOINT_CODEC,validateSaveV4} from '../../src/game/persistence/save-v4.ts';
import {stateFromCheckpoint} from '../../src/game/persistence/checkpoint.ts';
import type {ZooSave} from '../../src/game/core/zoo-state.ts';
import type {SanctuarySessionState} from '../../src/game/core/session-state.ts';
import fixture from '../../tests/fixtures/giraffe-v3-golden.json';
declare const __GIRAFFE_QA_SOURCE__:string,__GIRAFFE_QA_RENDER_HASH__:string;
const url=new URL(location.href);let database=url.searchParams.get('db');const firstLoad=!database;
if(!database){database='giraffe-product-'+crypto.randomUUID();url.searchParams.set('db',database);history.replaceState(null,'',url);}
if(!/^giraffe-product-[a-f0-9-]{36}$/.test(database))throw Error('Invalid synthetic database');
const name=database,request=firstLoad?indexedDB.open(name,3):indexedDB.open(name);request.onupgradeneeded=()=>request.result.createObjectStore('checkpoints');
const db=await new Promise<IDBDatabase>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const tx=db.transaction('checkpoints','readwrite'),store=tx.objectStore('checkpoints'),read=store.get('primary');
read.onsuccess=()=>{if(read.result===undefined)store.put({format:2,generation:'giraffe-synthetic-fixture',revision:1,writtenAt:1,writer:'giraffe-qa-seed',payload:JSON.stringify(fixture.state)},'primary');};
await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
const root=document.querySelector<HTMLElement>('[data-play-entry]')!,host=root.querySelector<HTMLElement>('[data-preview-stage]')!,out=document.querySelector<HTMLElement>('#giraffe-qa-result')!,backend=createGiraffeIndexedDbBackend(indexedDB,name);
let observed:ZooSave|undefined,session:SanctuarySessionState<ZooSave>|undefined,owners=0,maxOwners=0;const retired:unknown[]=[],invalid:unknown[]=[];
const observe=(s:ZooSave)=>{observed=structuredClone(s);const result=validateSaveV4(s);if(!result.ok&&invalid.length<3)invalid.push(result);return s;};
const handle=mountGameEntry(root,{backend,broadcast:false,allowRecoveryDownload:false,preferenceStorage:null,browserLanguage:'id',loadRenderer:async stateStore=>{session=stateStore;return failure=>{
 owners++;maxOwners=Math.max(maxOwners,owners);const scene=mountFoundationScene(host,failure,{stateStore:{...stateStore,write(s){observe(s);stateStore.write(s);},checkpoint(read,critical){stateStore.checkpoint?.(()=>observe(read()),critical);}}});let done=false;
 return {...scene,dispose(){if(done)return;done=true;scene.dispose();owners--;retired.push(scene.inspect?.());}};
};}});
async function report(){const inspector=createGiraffeIndexedDbBackend(indexedDB,name);try{const checkpoint=await inspector.read(),state=observed??session?.read()??(checkpoint?stateFromCheckpoint(checkpoint,GIRAFFE_CHECKPOINT_CODEC):undefined);out.textContent=JSON.stringify({at:new Date().toISOString(),source:__GIRAFFE_QA_SOURCE__,rendererSourceHash:__GIRAFFE_QA_RENDER_HASH__,database:name,scope:'Actual compiled product seeded only with frozen synthetic earned V3; no simulation-time injection or owner data',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},validation:state?validateSaveV4(state):null,invalid,rawState:state,stored:checkpoint?JSON.parse(checkpoint.payload):null,revision:checkpoint?.revision,save:handle.inspect(),renderer:handle.inspectRenderer(),owners,maxOwners,retired},null,2);}catch(error){out.textContent=JSON.stringify({at:new Date().toISOString(),source:__GIRAFFE_QA_SOURCE__,database:name,scope:'QA inspector only; backend refused checkpoint without mutation',checkpointRead:'blocked',reason:error instanceof Error?error.message:'unavailable',owners,maxOwners,retired},null,2);}finally{inspector.close();}}
document.querySelector('#giraffe-qa-inspect')!.addEventListener('click',()=>{void report();});
document.querySelector('#giraffe-qa-close')!.addEventListener('click',()=>{handle.dispose();void report();});
document.querySelector('#giraffe-qa-loss')!.addEventListener('click',()=>{const canvas=host.querySelector('canvas'),gl=canvas?.getContext('webgl2'),extension=gl?.getExtension('WEBGL_lose_context');if(extension)extension.loseContext();else out.textContent=JSON.stringify({fault:'WEBGL_lose_context unavailable; no loss injected'});});
document.querySelector('#giraffe-qa-corrupt')!.addEventListener('click',async()=>{handle.dispose();const req=indexedDB.open(name);req.onupgradeneeded=()=>req.transaction?.abort();const db=await new Promise<IDBDatabase>((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});try{const tx=db.transaction('checkpoints','readwrite');tx.objectStore('checkpoints').put('INTENTIONALLY CORRUPT DISPOSABLE QA PRIMARY','primary');await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});out.textContent=JSON.stringify({scope:'Disposable UUID database only; all recovery and migration backups untouched',status:'QA_PRIMARY_CORRUPTED',database:name});}finally{db.close();}});
window.addEventListener('pagehide',()=>handle.dispose(),{once:true});void report();
