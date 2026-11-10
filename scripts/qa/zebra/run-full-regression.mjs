import assert from 'node:assert/strict';
import {access,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {runNode,sourceFingerprint,sha256} from '../tooling.mjs';

const runId=process.argv[2];if(!runId||!/^r7-01-[a-z0-9-]{1,40}$/.test(runId))throw Error('Pass a fresh bounded R7-01 run ID');
const directory=resolve('.qa/zebra-audit/r7-01',runId);try{await access(directory);throw Error('Preserve immutable run; choose a fresh ID');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(directory,{recursive:true});
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),before=await sourceFingerprint(resolve('.'));
const tests=(await readdir('tests')).filter(p=>p.endsWith('.test.mjs')).sort().map(p=>'tests/'+p);assert.ok(tests.length>=161);
const testFiles=await Promise.all(tests.map(async path=>{const b=await readFile(path);return{path,bytes:b.length,sha256:sha256(b)};}));
const fixtureFiles=(await readdir('tests/fixtures')).filter(p=>p.endsWith('.json')).sort();const fixtures=await Promise.all(fixtureFiles.map(async name=>{const path='tests/fixtures/'+name,b=await readFile(path);return{path,bytes:b.length,sha256:sha256(b)};}));
const args=['--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...tests],startedAt=new Date().toISOString();
const start={runId,source,startedAt,node:process.version,platform:process.platform,arch:process.arch,runnerPid:process.pid,args,testFiles,fixtures,inputs:before,scope:'Complete discovered root suite, one file worker, pure source/fake IndexedDB/real procedural models. No native browser, owner save, GPU or real-time soak.'};
await writeFile(directory+'/start.json',JSON.stringify(start,null,2)+'\n');console.log(JSON.stringify({status:'RUNNING',runId,source,files:tests.length,runnerPid:process.pid,startedAt,concurrency:1}));
const result=await runNode(args,{cwd:resolve('.'),limit:2_000_000,timeoutMs:600_000});
await writeFile(directory+'/stdout.tap',result.stdout);await writeFile(directory+'/stderr.log',result.stderr);
const after=await sourceFingerprint(resolve('.')),counts={};for(const key of ['tests','suites','pass','fail','cancelled','skipped','todo']){const m=[...result.stdout.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];if(m.length===1)counts[key]=Number(m[0][1]);}
const plan=[...result.stdout.matchAll(/^1\.\.(\d+)\r?$/gm)],finished=[...result.stdout.matchAll(/^(?:ok|not ok) \d+ /gm)];
const fullOutput=result.stdout.startsWith('TAP version 13')&&plan.length===1&&Number(plan[0][1])===finished.length&&/^# duration_ms /m.test(result.stdout);
const unchanged=before.id===after.id,passed=result.exitCode===0&&!result.signal&&!result.overflow&&!result.timedOut&&fullOutput&&unchanged&&counts.tests>0&&counts.pass===counts.tests&&['fail','cancelled','skipped','todo'].every(k=>counts[k]===0);
const receipt={...start,finishedAt:new Date().toISOString(),status:passed?'PASS':'FAIL',counts,fullOutput,topLevelPlan:plan.length===1?Number(plan[0][1]):null,topLevelCompleted:finished.length,inputsAfter:after,inputUnchanged:unchanged,process:{exitCode:result.exitCode,signal:result.signal,overflow:result.overflow,timedOut:result.timedOut,durationMs:Date.now()-Date.parse(startedAt)},logs:await Promise.all(['stdout.tap','stderr.log'].map(async name=>{const path=directory+'/'+name,b=await readFile(path);return{path,bytes:b.length,sha256:sha256(b)};})),limits:'600s and2MB combined complete output capture. No skipped/cancelled/todo accepted. Functional source tests do not establish native FPS/soak or grant-release readiness.'};
await writeFile(directory+'/result.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,runId,source,files:tests.length,counts,fullOutput,inputUnchanged:unchanged,exit:result.exitCode,timedOut:result.timedOut,overflow:result.overflow,directory}));if(!passed)process.exitCode=1;
