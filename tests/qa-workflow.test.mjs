import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { assessRun, parseTap, childPath, within, runNode, browserVerdict, BROWSER_CASES, pageMetadata, fixtureIdentityMatches } from '../scripts/qa/tooling.mjs';

const tap='TAP version 13\n'+Array.from({length:36},(_,i)=>`ok ${i+1} - example`).join('\n')+'\n1..36\n# tests 36\n# pass 36\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
test('QA cannot pass from failed process, truncated/capped TAP, duplicate summary or skipped tests',()=>{
  assert.equal(parseTap(tap).tests,36);
  for(const result of [{exitCode:1,stdout:tap},{exitCode:0,stdout:tap,overflow:true},{exitCode:0,stdout:tap,timedOut:true},{exitCode:0,stdout:tap.slice(0,-15)},{exitCode:0,stdout:tap+'# pass 36\n'},{exitCode:0,stdout:tap.replace('# skipped 0','# skipped 1')}])assert.throws(()=>assessRun(result,'unit'));
});
test('QA requires completed check/build receipts; successful compile text alone is insufficient',()=>{
  assert.throws(()=>assessRun({exitCode:0,stdout:'built in 10ms'},'build'));
  assert.throws(()=>assessRun({exitCode:0,stdout:'0 errors\n0 warnings'},'check'));
  assert.throws(()=>assessRun({exitCode:2,stdout:'9 page(s) built\n[build] Complete!'},'build'));
});
test('QA capture actually marks overflowing or timed-out child output as failure',async()=>{
  const overflow=await runNode(['-e',"process.stdout.write('x'.repeat(65536))"],{limit:1000});assert.equal(overflow.overflow,true);assert.throws(()=>assessRun(overflow,'fixture'));
  const timeout=await runNode(['-e','setInterval(()=>{},1000)'],{timeoutMs:80});assert.equal(timeout.timedOut,true);assert.throws(()=>assessRun(timeout,'fixture'));
});
test('QA paths cannot escape a named output directory or point to its root',()=>{
  const root=resolve(tmpdir(),'myzootwin-qa-test-root');assert.equal(within(root,join(root,'run','shot.jpg')),true);
  for(const path of ['..',join('..','outside'),root])assert.throws(()=>childPath(root,path));
});
function records() {
  const time=new Date().toISOString(),report={runId:'run-1',build:{id:'build-1'},source:{id:'source-1'},startedAt:time,entryScript:'/_astro/entry.js'};
  const receipt={runId:'run-1',buildId:'build-1',sourceId:'source-1',method:'approved-cua-isolated-browser',physicalDevice:false,startedAt:time,finishedAt:time,ownedTabsClosed:true,viewportReset:true,console:{entries:[],limit:200,capped:false},cases:BROWSER_CASES.map(id=>({id,status:'UNRUN',observedAt:time}))};
  return {time,report,receipt};
}
test('browser checks remain UNRUN until all six approved-runtime cases are recorded',()=>{
  const {report,receipt}=records();assert.equal(browserVerdict(null,report).status,'UNRUN');assert.equal(browserVerdict(receipt,report).status,'UNRUN');
});
test('stale identity/time, capped console and missing cleanup can never produce browser PASS',()=>{
  for(const mutate of [r=>r.buildId='old',r=>r.sourceId='old',r=>r.startedAt='2000-01-01',r=>r.console.capped=true,r=>r.console.limit=undefined,r=>r.ownedTabsClosed=false,r=>r.physicalDevice=true]) {
    const {report,receipt}=records();mutate(receipt);assert.equal(browserVerdict(receipt,report).status,'FAIL');
  }
});
test('a claimed mobile PASS must match the measured viewport, rendered canvas and built script',()=>{
  const {report,receipt,time}=records();const row=receipt.cases.find(x=>x.id==='portrait-native-id');
  row.status='PASS';row.screenshot='screens/portrait-native-id.jpg';row.observedAt=time;
  row.data={width:1366,height:768,documentWidth:1366,state:'ready',canvas:1,visualReviewed:true,lang:'id',entryScript:report.entryScript};
  assert.equal(browserVerdict(receipt,report).status,'FAIL');
});

test('route comparison decodes actual journal HTML entities before checking the browser baseline',()=>{
  const html='<title>Field notes &amp; adventures — MyZooTwin</title><link rel="canonical" href="https://myzootwin.com/adventures/"><h1>Field notes &amp; <span>adventures</span></h1>';
  assert.equal(pageMetadata(html).title,'Field notes & adventures — MyZooTwin');
  assert.equal(pageMetadata(html).h1,'Field notes & adventures');
  assert.throws(()=>pageMetadata('<h1>incomplete fallback</h1>'));
});

test('generated fixture must carry exact visible run/build/source IDs before browser work starts',()=>{
  const report={runId:'run-1',build:{id:'build-1'},source:{id:'source-1'}};
  const html='<code id="qa-run-id">run-1</code><code id="qa-build-id">build-1</code><code id="qa-source-id">source-1</code>';
  assert.equal(fixtureIdentityMatches(html,report),true);
  assert.equal(fixtureIdentityMatches('<strong>LOCAL QA</strong>',report),false);
  assert.equal(fixtureIdentityMatches(html.replace('source-1','old-source'),report),false);
});
