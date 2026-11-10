// Run from any directory: node <repo>/docs/qa/zebra/r7-03/verify.mjs
// Verifies preserved artifacts/native invariants; does not rerun tests or access a browser/save.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const base=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(base,'../../../..');
const read=n=>JSON.parse(fs.readFileSync(path.join(base,n),'utf8').replace(/^\uFEFF/,'')),assert=(v,m)=>{if(!v)throw Error(m);},hash=b=>crypto.createHash('sha256').update(b).digest('hex'),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const proof=read('verification.json'),index=read('receipt-files.json');
assert(proof.status==='PASS_R7_03_STORAGE_FAULT_RECOVERY'&&proof.verified===47&&proof.noPushOrDeploy,'Acceptance status');
for(const r of index.receipts){const target=path.resolve(repo,r.path),relative=path.relative(base,target);assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Receipt outside gate');const bytes=fs.readFileSync(target);assert(bytes.length===r.bytes&&hash(bytes)===r.sha256,'Changed artifact '+r.path);}
for(const a of proof.archives){const bytes=zlib.brotliDecompressSync(fs.readFileSync(path.resolve(repo,a.path)));assert(bytes.length===a.original.bytes&&hash(bytes)===a.original.sha256,'Archive roundtrip '+a.path);}
const unpack=n=>zlib.brotliDecompressSync(fs.readFileSync(path.join(base,n))).toString(),rows=unpack('native3.jsonl.br').trim().split('\n').map(JSON.parse);
assert(rows.length===23&&rows.every(x=>x.report.source===proof.source&&x.report.input===proof.input&&x.report.errors.length===0&&x.report.physicalDevice===false&&x.report.presentedFps===null),'Native source/errors');
const receipt=(label,id)=>{const r=rows.find(x=>x.label===label)?.report.receipts.filter(x=>x.id===id).at(-1);assert(r,'Missing '+label+'/'+id);return r;};
const a=receipt('v3-race-a','mission-race'),b=receipt('v3-race-b','mission-race'),pair=[a,b],winner=pair.find(x=>x.accepted),loser=pair.find(x=>!x.accepted);
assert(winner&&loser&&a.database===b.database&&a.stored===b.stored&&winner.beforeCash===3595&&winner.afterCash===3745&&loser.afterCash===3595&&loser.beforeHash===loser.memoryHash&&loser.phase==='conflict','CAS/reward/loser memory');
assert(winner.rewards.filter(x=>x.missionId==='ZQ02').length===1&&receipt('v3-cold-page-ticket-replay','cold-ticket-replay').stateHash===winner.memoryHash,'Cold exact reward');
const ui=receipt('v3-original-ui-ready','recovery-ui-ready'),cancel=receipt('v3-ui-cancel-no-write','recovery-ui-inspected'),quota=receipt('v3-ui-quota-refused','recovery-ui-inspected'),restored=receipt('v3-ui-retry-confirmed','recovery-ui-inspected');
assert(ui.damaged===cancel.rows&&cancel.rows===quota.rows&&quota.save.fault==='quota'&&!quota.preserved,'Cancel/quota atomicity');assert(restored.payload===ui.originalPayload&&restored.preservedPrimary===quota.primary&&restored.save.phase==='available'&&restored.preserved,'Recovery payload/preserved original');for(const x of[cancel,quota,restored])assert(equal(x.backupHashes,ui.backupHashes),'Historical backup drift');
const pending=receipt('v3-pending-close','pending-candidate-close');assert(pending.close.phase==='saved'&&pending.close.disposed&&!pending.close.dirty&&!pending.close.inflight&&pending.cashAfter===pending.cashBefore+150,'Closing drain');
assert(receipt('v3-first-post-quota-abort','atomic').cases.length===4&&receipt('v3-missing-corrupt-backups','provenance').cases.length===4&&receipt('v3-corrupt-future-branches','corruption').cases.length===5,'Fault matrix');
for(const label of['v3-a-close','v3-b-close','v3-ui-final-close']){const report=rows.find(x=>x.label===label).report,c=report.receipts.at(-1);assert(report.owners===0&&report.raceTimers===0&&c.status==='PASS','Owner closure');for(const s of[c.save,c.uiSave].filter(Boolean))assert(s.disposed&&!s.dirty&&!s.inflight&&!s.pendingTimer,'Save drain cleanup');}
const full=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(base,'full-suite.json.gz')))),tap=unpack('full-suite.tap.br');assert(full.status==='PASS'&&full.source===proof.source&&full.fullOutput&&full.inputUnchanged&&full.process.exitCode===0&&!full.process.timedOut&&!full.process.overflow&&full.inputs.id===proof.input&&full.inputsAfter.id===proof.input,'Full suite/source bounds');
for(const k of['tests','pass','fail','cancelled','skipped','todo']){const m=[...tap.matchAll(new RegExp('^# '+k+' (\\d+)\\r?$','gm'))];assert(m.length===1&&Number(m[0][1])===full.counts[k],'Complete TAP summary '+k);}assert(full.counts.tests===full.counts.pass&&['fail','cancelled','skipped','todo'].every(k=>full.counts[k]===0),'Successful tests');
assert(proof.resources.activeOwnedTestBuildBrowserServers===0&&proof.resources.browser.remainingTabs.length===0&&proof.resources.tests.remainingOwnPids.length===0&&proof.resources.tests.remainingOwnedTestWorkers.length===0,'Resource closure');
const fixture=JSON.parse(unpack('source-causal-fixture.json.br'));assert(fixture.metadata.stateHash===proof.fixture.state&&fixture.metadata.candidateHash===winner.memoryHash&&fixture.metadata.ticks===787,'Causal fixture');
assert(read('acceptance-matrix.json').cases.length===18&&read('product-comparison.json').foundationImportNormalized.equal,'Scope/build matrix');
console.log(JSON.stringify({status:'PASS_R7_03_ARTIFACT_AND_NATIVE_INVARIANTS',receiptHashes:index.receipts.length,losslessArchives:proof.archives.length,fullTests:full.counts.tests,nativeSnapshots:rows.length,scope:'Preserved evidence verification only; no current test/browser/save execution and no grant/public-release acceptance.'}));
