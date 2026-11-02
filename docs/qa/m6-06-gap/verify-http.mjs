import{readFile,writeFile}from'node:fs/promises';import{pathToFileURL}from'node:url';
const root='C:/MyZooTwin',out='C:/Users/andi_/Documents/Codex/2026-10-31/task/m6-06-gap';
const{files,sha256}=await import(pathToFileURL(root+'/scripts/qa/tooling.mjs'));
const{runId}=JSON.parse(await readFile(root+'/.qa/privacy-m6-06/latest.json','utf8')),report=JSON.parse(await readFile(root+'/.qa/privacy-m6-06/'+runId+'/report.json','utf8')),base=root+'/'+report.buildDirectory;
const rows=[];for(const file of await files(base)){
 const relative=file.slice(base.length+1).replaceAll('\\','/'),path=relative.endsWith('index.html')?'/'+relative.slice(0,-10):'/'+relative;
 const response=await fetch('http://127.0.0.1:4347'+path),bytes=new Uint8Array(await response.arrayBuffer()),expected=await readFile(file);
 const row={path,status:response.status,bytes:bytes.length,sha256:sha256(bytes),bodyExact:sha256(bytes)===sha256(expected),csp:response.headers.get('content-security-policy'),referrer:response.headers.get('referrer-policy')};
 if(row.status!==200||!row.bodyExact||!row.csp||row.referrer!=='no-referrer')throw Error('Artifact/header mismatch '+path);rows.push(row);
}
const direct=await fetch('http://127.0.0.1:4347/play');if(direct.status!==200||sha256(new Uint8Array(await direct.arrayBuffer()))!==sha256(await readFile(base+'/play/index.html')))throw Error('Direct /play mismatch');
const sitemap=await readFile(base+'/sitemap-0.xml','utf8'),locations=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);if(locations.length!==9)throw Error('Sitemap nine routes required');
await writeFile(out+'/http-artifacts.json',JSON.stringify({at:new Date().toISOString(),status:'PASS',runId,sourceId:report.source.id,buildId:report.build.id,rows,sitemap:locations,directPlay:'PASS',headerScope:'QA-only network lockdown; production hosting headers not configured/verified.'},null,2));console.log(JSON.stringify({status:'PASS',artifacts:rows.length,directPlay:true,sitemap:locations.length}));
