import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve} from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {build} from 'vite';
const testPath='tests/giraffe-storage-v4.test.mjs',original=await readFile(testPath,'utf8'),source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),testSha=createHash('sha256').update(original).digest('hex');
let body=original.replace(/^import test from 'node:test';.*\r?\n/,'').replace(/^import \{IDBFactory,IDBObjectStore\} from 'fake-indexeddb';\r?\n/,'').replace(/^const v3=.*\r?\n/m,"const v3=fixture3.state,v2=fixture2.state,v1=fixture1.entries.q04Claimed.state;\n").replaceAll("from '../src/","from '../../src/");
if(body.includes('node:')||body.includes('fake-indexeddb')||body.includes('readFileSync'))throw Error('Native scenarios still contain emulated/Node dependencies');
body=body.replace('this.transaction.db.name===name&&key',"this.transaction.db.name.startsWith('giraffe-native-')&&this.transaction.db.name.endsWith('-'+name)&&key");
const adapter=String.raw`
import fixture3 from '../../tests/fixtures/giraffe-v3-golden.json';
import fixture2 from '../../tests/fixtures/lion-v2-golden.json';
import fixture1 from '../../tests/fixtures/elephant-legacy-v1.json';
const scenarios=[],owned=new Set(),connections=new Set();
function test(id,run){scenarios.push({id,run});}
const assert=Object.assign((ok,message)=>{if(!ok)throw Error(message??'Assertion failed');},{ok(ok,message){if(!ok)throw Error(message??'Assertion failed');},equal(a,b){if(!Object.is(a,b))throw Error('Equality failed: '+JSON.stringify(a)+' vs '+JSON.stringify(b));},deepEqual(a,b){if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Exact JSON equality failed');},async rejects(promise,validate){let error;try{await promise;}catch(e){error=e;}if(!error||validate&&!validate(error))throw Error('Expected guarded rejection');}});
// Namespace-only adapter. Every request/transaction is native window.indexedDB;
// no data/ordering/CAS/quota behavior is emulated or replaced.
const IDBFactory=class {
 constructor(){this.prefix='giraffe-native-'+crypto.randomUUID()+'-';}
 open(name,version){const real=this.prefix+name;owned.add(real);const req=version===undefined?indexedDB.open(real):indexedDB.open(real,version);req.addEventListener('success',()=>connections.add(req.result));return req;}
 deleteDatabase(name){return indexedDB.deleteDatabase(this.prefix+name);}
 cmp(a,b){return indexedDB.cmp(a,b);}
 async databases(){return (await indexedDB.databases()).filter(d=>d.name?.startsWith(this.prefix)).map(d=>({...d,name:d.name.slice(this.prefix.length)}));}
};
`;
const runner=String.raw`
const button=document.querySelector('#run'),output=document.querySelector('#result');
button.addEventListener('click',async()=>{
 button.disabled=true;const rows=[],startedAt=new Date().toISOString(),started=performance.now();let cleanupErrors=[];
 const paint=status=>{output.textContent=JSON.stringify({status,source:__GIRAFFE_QA_SOURCE__,testSourceSha256:__GIRAFFE_TEST_SHA__,method:'Same source scenario bodies; namespace-only adapter to actual native IndexedDB. Not fake-indexeddb, physical-device or two-tab UI proof.',startedAt,cases:rows,ownedDatabases:owned.size},null,2);};paint('RUNNING');
 try{for(const scenario of scenarios){let timer;try{await Promise.race([scenario.run(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native case exceeded20s')),20000);})]);rows.push({id:scenario.id.replace('IDB emulation: ','native: '),pass:true});}catch(e){rows.push({id:scenario.id,pass:false,error:e instanceof Error?e.message:String(e)});break;}finally{clearTimeout(timer);}paint('RUNNING');}}
 finally{for(const db of connections)try{db.close();}catch{}let cleaned=0;for(const name of owned){try{await new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(name);req.onsuccess=resolve;req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Owned cleanup blocked'));});cleaned++;}catch(e){cleanupErrors.push(String(e));}}const status=rows.length===scenarios.length&&rows.every(r=>r.pass)&&cleaned===owned.size?'PASS':'FAIL';output.textContent=JSON.stringify({status,source:__GIRAFFE_QA_SOURCE__,testSourceSha256:__GIRAFFE_TEST_SHA__,method:'Actual native IndexedDB via namespace-only adapter; synthetic fixtures only. Independent connections, not two-tab UI/full-game proof.',native:true,physicalDevice:false,userAgent:navigator.userAgent,startedAt,finishedAt:new Date().toISOString(),elapsedMs:performance.now()-started,cases:rows,ownedDatabases:owned.size,cleaned,cleanupErrors},null,2);button.disabled=false;}
});
`;
await mkdir('.qa/giraffe-storage-input',{recursive:true});await writeFile('.qa/giraffe-storage-input/native.mjs',adapter+'\n'+body+'\n'+runner);
await build({root:resolve('.'),configFile:false,base:'./',publicDir:false,define:{__GIRAFFE_QA_SOURCE__:JSON.stringify(source),__GIRAFFE_TEST_SHA__:JSON.stringify(testSha)},build:{outDir:'.qa/giraffe-storage',emptyOutDir:true,rollupOptions:{input:resolve('tests/browser/giraffe-storage-harness.html')}}});
