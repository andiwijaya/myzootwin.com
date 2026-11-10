import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {sourceFingerprint,sha256,runNode} from '../tooling.mjs';
const run=process.argv[2];if(!/^r7-03-[a-z0-9-]{1,30}$/.test(run??''))throw Error('Fresh bounded run ID required');
const dir=resolve('.qa/zebra-audit/r7-03',run);try{await access(dir);throw Error('Immutable run exists');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(dir,{recursive:true});
const prepared=JSON.parse(await readFile('docs/qa/zebra/r7-03/preparation.json','utf8')),args=prepared.execution.testArgs;
assert.equal(args[3],'--test-concurrency=1');for(const p of prepared.testFiles)assert.equal(sha256(await readFile(p.path)),p.sha256,'Prepared source test changed: '+p.path);
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),before=await sourceFingerprint(process.cwd()),startedAt=new Date().toISOString();
await writeFile(dir+'/start.json',JSON.stringify({source,before,args,runnerPid:process.pid,startedAt,timeoutSeconds:900,scope:'Complete prepared14-file fault pack, serial worker,2MB complete output cap. No native browser/save/GPU.'},null,2)+'\n');
console.log(JSON.stringify({status:'RUNNING',run,source,runnerPid:process.pid,files:prepared.testFiles.length}));
const result=await runNode(args,{cwd:process.cwd(),timeoutMs:900000,limit:2000000}),after=await sourceFingerprint(process.cwd());
await writeFile(dir+'/stdout.tap',result.stdout);await writeFile(dir+'/stderr.log',result.stderr);
const counts={};for(const key of['tests','pass','fail','cancelled','skipped','todo']){const matches=[...result.stdout.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];if(matches.length===1)counts[key]=Number(matches[0][1]);}
const plans=[...result.stdout.matchAll(/^1\.\.(\d+)\r?$/gm)],finished=[...result.stdout.matchAll(/^(?:ok|not ok) \d+ /gm)],full=result.stdout.startsWith('TAP version 13')&&plans.length===1&&Number(plans[0][1])===finished.length&&/^# duration_ms /m.test(result.stdout);
const pass=result.exitCode===0&&!result.signal&&!result.overflow&&!result.timedOut&&before.id===after.id&&full&&counts.tests===prepared.declaredTitles&&counts.pass===counts.tests&&['fail','cancelled','skipped','todo'].every(k=>counts[k]===0);
const logs=[];for(const name of['stdout.tap','stderr.log']){const p=dir+'/'+name,b=await readFile(p);logs.push({path:p,bytes:b.length,sha256:sha256(b)});}
await writeFile(dir+'/result.json',JSON.stringify({status:pass?'PASS':'FAIL',source,startedAt,finishedAt:new Date().toISOString(),before,after,unchanged:before.id===after.id,args,counts,fullOutput:full,process:{exitCode:result.exitCode,signal:result.signal,overflow:result.overflow,timedOut:result.timedOut},logs},null,2)+'\n');console.log(JSON.stringify({status:pass?'PASS':'FAIL',run,counts,fullOutput:full,sourceUnchanged:before.id===after.id,exit:result.exitCode}));if(!pass)process.exitCode=1;
