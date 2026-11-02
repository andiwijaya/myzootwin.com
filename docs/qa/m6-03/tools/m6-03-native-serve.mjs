import{spawn}from'node:child_process';
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{join}from'node:path';
import{sourceFingerprint,files,fingerprint,portFree,stopChild,sha256}from'file:///C:/MyZooTwin/scripts/qa/tooling.mjs';
const root='C:/MyZooTwin',folder='C:/Users/andi_/Documents/Codex/2026-10-31/task/m6-03-blackbox',ports=[4358,4359,4360],run='s20261102T080144Z';
await mkdir(folder,{recursive:true});
const report=JSON.parse(await readFile(root+'/.qa/memory-m6-02/'+run+'/report.json','utf8'));
const source=await sourceFingerprint(root),owner=await fingerprint(root,await files(root+'/dist')),build=await fingerprint(root,await files(root+'/'+report.buildDirectory));
if(source.id!==report.source.id||build.id!==report.build.id)throw Error('Frozen product source/build mismatch');
for(const port of ports)if(!await portFree(port))throw Error('Named black-box QA port occupied; no unowned process changed');
const children=[],logs=ports.map(()=> '');let requested=false,release;const startedAt=new Date().toISOString();
try{
 for(const[at,port]of ports.entries()){
  const child=spawn(process.execPath,[root+'/node_modules/astro/astro.js','preview','--outDir',report.buildDirectory,'--host','127.0.0.1','--port',String(port)],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});children.push(child);
  for(const stream of[child.stdout,child.stderr])stream.on('data',b=>{logs[at]+=b.toString();if(Buffer.byteLength(logs[at])>2_000_000){child.kill();release?.();}});
  child.once('close',()=>release?.());
 }
 for(const port of ports){let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:'+port+'/play/');if(r.status===200&&sha256(await r.text())===sha256(await readFile(join(root,report.buildDirectory,'play/index.html'),'utf8'))){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('Owned black-box preview unavailable');}
 await writeFile(folder+'/serve.json',JSON.stringify({status:'RUNNING',startedAt,sourceId:source.id,buildId:build.id,run,ownerBuildId:owner.id,ports,ownedPids:children.map(c=>c.pid),ownerPreview4345:'Never touched'},null,2));
 console.log('M6-03 exact compiled QA4358/4359/4360 ready. Owner4345 untouched. stop + Enter closes only owned QA.');
 await new Promise(done=>{release=done;process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop'){requested=true;done();}});process.stdin.resume();process.once('SIGINT',()=>{requested=true;done();});});
 if(!requested)throw Error('QA ended unexpectedly');
}finally{
 process.stdin.pause();for(const child of children)await stopChild(child);const free=await Promise.all(ports.map(portFree)),after=await fingerprint(root,await files(root+'/dist'));
 for(let i=0;i<logs.length;i++)await writeFile(folder+'/preview-'+ports[i]+'.log',logs[i]);
 await writeFile(folder+'/serve.json',JSON.stringify({status:free.every(Boolean)?'STOPPED':'FAIL',startedAt,finishedAt:new Date().toISOString(),sourceId:source.id,buildId:build.id,run,ports,portsFree:free,ownerBuildPreserved:owner.id===after.id},null,2));console.log('Owned black-box QA stopped; owner build preserved '+(owner.id===after.id));
}
