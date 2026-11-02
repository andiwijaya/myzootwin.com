import{readFile,writeFile}from'node:fs/promises';import{pathToFileURL}from'node:url';
const root='C:/MyZooTwin',out='C:/Users/andi_/Documents/Codex/2026-10-31/task/m6-07';
const{files,sha256}=await import(pathToFileURL(root+'/scripts/qa/tooling.mjs'));
const{runId}=JSON.parse(await readFile(root+'/.qa/integration-m6-07/latest.json','utf8')),report=JSON.parse(await readFile(root+'/.qa/integration-m6-07/'+runId+'/report.json','utf8')),base=root+'/'+report.buildDirectory;
const rows=[];for(const file of await files(base)){
 const relative=file.slice(base.length+1).replaceAll('\\','/'),path=relative.endsWith('index.html')?'/'+relative.slice(0,-10):'/'+relative;
 const response=await fetch('http://127.0.0.1:4346'+path),bytes=new Uint8Array(await response.arrayBuffer()),expected=await readFile(file);
 const row={path,status:response.status,type:response.headers.get('content-type'),bytes:bytes.length,sha256:sha256(bytes),bodyExact:sha256(bytes)===sha256(expected)};
 if(row.status!==200||!row.bodyExact)throw Error('Served artifact mismatch '+path);rows.push(row);
}
const image=rows.find(x=>x.path==='/images/tropical-creek-game.jpg');if(!image?.type?.startsWith('image/jpeg'))throw Error('Image MIME mismatch');
const former=await fetch('http://127.0.0.1:4346/images/tropical-creek-game.png');if(former.status!==404)throw Error('Incorrect former unreleased image path fallback');
await writeFile(out+'/http-artifacts.json',JSON.stringify({at:new Date().toISOString(),runId,sourceId:report.source.id,buildId:report.build.id,status:'PASS',rows,formerUnreleasedPngStatus:former.status},null,2));console.log('Exact served artifacts '+rows.length+'; correct JPEG MIME; old unreleased PNG404.');
