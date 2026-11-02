import{readFile,writeFile}from'node:fs/promises';import{pathToFileURL}from'node:url';
const root='C:/MyZooTwin',out='C:/Users/andi_/Documents/Codex/2026-10-31/task/m6-07';
const{astroCli,runNode,assessRun,pageMetadata}=await import(pathToFileURL(root+'/scripts/qa/tooling.mjs'));
const{runId}=JSON.parse(await readFile(root+'/.qa/integration-m6-07/latest.json','utf8'));
const target='.qa/integration-m6-07/configured-ga-output',result=await runNode([await astroCli(root),'build','--outDir',target],{cwd:root,environment:{PUBLIC_GA4_ID:'G-QASITE000',MYZOO_QA_ANALYZE:'0'}});
await writeFile(out+'/configured-ga-build.log',result.stdout+result.stderr);assessRun(result,'build');
const rows=[];for(const path of['','animals','wildlife','pets','learn','adventures','gear','about','play']){
 const html=await readFile(root+'/'+target+'/'+path+'/index.html','utf8'),current=await readFile(root+'/.qa/builds/'+runId+'/'+path+'/index.html','utf8'),game=path==='play';
 const row={path:'/'+(path?path+'/':''),ga:html.includes('G-QASITE000'),remoteFonts:html.includes('fonts.googleapis.com'),metadataUnchanged:JSON.stringify(pageMetadata(html))===JSON.stringify(pageMetadata(current)),playCsp:game?html.includes('Content-Security-Policy'):null};
 row.pass=row.ga===!game&&row.remoteFonts===!game&&row.metadataUnchanged&&(!game||row.playCsp);rows.push(row);
}
await writeFile(out+'/configured-ga.json',JSON.stringify({at:new Date().toISOString(),runId,status:rows.every(x=>x.pass)?'PASS':'FAIL',method:'Unserved synthetic-ID build; no analytics event/network delivery or consent assertion',rows},null,2));if(!rows.every(x=>x.pass))throw Error('GA isolation regression');console.log('Synthetic configured-GA build:9 policy/metadata checks PASS; never served.');
