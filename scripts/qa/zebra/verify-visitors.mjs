import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { sha256 } from '../tooling.mjs';

const dir = 'docs/qa/zebra/z4-04';
const rawPath = '.qa/zebra-audit/z4-04-browser-full.json';
const raw = await readFile(rawPath), data = JSON.parse(raw);
const buildPath = '.qa/visual3d/h1-03-zebra-visitors-b5aa901/source.json';
const build = JSON.parse(await readFile(buildPath, 'utf8'));
const c = label => { const value = data.cases.find(c => c.label === label); assert.ok(value, label); return value; };
const r = label => c(label).report;
const actor = label => r(label).visitorActors.find(v => v.id === 'arrival-55');
const first = r('cold-before-visitors'), final = r('final-paused-feedback');
const mid = r('paused-zebra-midview'), complete = r('actual-zebra-completed-feedback');
const home = first.zebraAccess.habitatId;
assert.equal(build.source, 'b5aa901810e616b3ab3d64c62ba69e0bda8fb227');
assert.equal(build.inputs.id, 'fc0e43717530b510c076bd0f8de510b1c320a36ae3dbd89b83cd3d0b2e17fcc2');
assert.equal(build.productionExclusion.status, 'PASS');
assert.equal(data.cases.length, 22);
assert.equal(new Set(data.cases.map(c => c.label)).size, 22);
for (const { label, report: q, ui } of data.cases) {
  assert.equal(q.source, build.source); assert.equal(q.sourceFingerprint, build.inputs.id);
  assert.equal(q.database, first.database); assert.equal(q.state.valid, true);
  assert.equal(q.physicalDevice, false); assert.equal(q.presentedFps, null);
  assert.deepEqual(q.errors, []); assert.deepEqual(q.failures, []); assert.ok(q.maxOwners <= 1);
  assert.ok(ui.documentWidth <= ui.width, label);
  if (q.zebraCare) assert.equal(q.zebraCare.command, 142);
  if (q.owners) {
    assert.equal(q.meshAudit.counts.errors, 0); assert.equal(q.renderer.session.liveZebraModels, 4);
    assert.equal(q.renderer.session.zebraBones, 80); assert.equal(q.renderer.session.commandRevision, 142);
    const attraction = q.visitorView.attraction;
    assert.equal(attraction.habitats.length, 5);
    assert.equal(attraction.welfare, Math.round(attraction.habitats.reduce((n, h) => n + h.welfare, 0) / 5));
  } else {
    assert.equal(q.frames.pending, 0); assert.equal(q.frames.nativePending, 0);
    assert.ok(Object.values(q.resourceOwners.counts).every(n => n === 0));
  }
  for (const retired of q.retired) {
    assert.equal(retired.disposed, true); assert.equal(retired.geometries, 0);
    assert.equal(retired.textures, 0); assert.equal(retired.ownedMaterialsLive, 0);
    assert.equal(retired.cleanupErrors, 0);
  }
}
for (const locale of ['id', 'en']) {
  const ui = c(locale + '-five-habitat-labels').ui;
  for (const text of locale === 'id'
    ? ['Kawasan Gajah', 'Habitat makaw', 'Savana Singa', 'Padang Jerapah', 'Zebra Grasslands']
    : ['Elephant Grove', 'Macaw aviary', 'Lion Savanna', 'Giraffe Plains', 'Zebra Grasslands']) assert.ok(ui.attraction.includes(text));
  assert.equal(r(locale + '-five-habitat-labels').state.gameplayHash, first.state.gameplayHash);
}
assert.equal(actor('pending-zebra-gate-crossing').entry.status, 'pending');
assert.equal(actor('actual-paid-zebra-walk').entry.status, 'paid');
assert.equal(actor('actual-paid-zebra-walk').entry.tick, 23386);
assert.equal(r('actual-paid-zebra-walk').state.cash, r('pending-zebra-gate-crossing').state.cash + 10);
assert.equal(r('actual-paid-zebra-walk').visitorView.tickets.admissions, 53);
assert.equal(r('pending-zebra-gate-crossing').visitorView.tickets.admissions, 52);
assert.match(c('pending-zebra-gate-crossing').ui.list, /belum membayar tiket/);
assert.equal(actor('paused-zebra-midview').experience.samples, 6);
assert.equal(actor('paused-zebra-midview').phase, 'viewing');
for (const label of ['midview-owner-disposed', 'cold-midview-before-open', 'cold-midview-after-open']) {
  assert.equal(r(label).state.sha256, mid.state.sha256);
  assert.deepEqual(r(label).visitorActors, mid.visitorActors);
}
const native = r('native-second-paused-29samples');
assert.equal(native.state.tick - mid.state.tick, 23);
assert.equal(native.frames.nativeDeliveries, 18);
assert.equal(native.renderer.session.simulationSpeed, 1);
assert.equal(actor('native-second-paused-29samples').experience.samples, 29);
assert.equal(native.renderer.session.simulationDroppedWallMs, 6050.499999999993);
assert.equal(complete.state.tick - native.state.tick, 1);
const visitor = actor('actual-zebra-completed-feedback'), feedback = visitor.experience.feedback;
assert.equal(visitor.phase, 'leaving'); assert.equal(visitor.journey.viewed, true);
assert.equal(feedback.habitatId, home); assert.equal(feedback.outcome, 'comfortable');
assert.equal(feedback.samples, 30); assert.equal(feedback.occupiedSamples, 30);
assert.equal(feedback.welfareHundredths, 200600);
assert.equal(feedback.score, Math.round(feedback.welfareHundredths / 30 / 100));
assert.equal(feedback.score, 67); assert.equal(feedback.observedWelfare, 67);
const tickets = complete.admissions.filter(a => a.visitorId === visitor.id);
assert.equal(tickets.length, 1); assert.equal(tickets[0].tick, 23386);
assert.equal(tickets[0].entry.habitatId, home); assert.equal(tickets[0].entry.price, 10);
assert.equal(complete.visitorView.tickets.admissions, 53);
assert.equal(complete.visitorView.tickets.revenue, 530);
assert.deepEqual(complete.visitorView.feedback.recent[0], feedback);
for (const label of ['desktop-id-feedback', 'desktop-en-feedback', 'portrait-en-feedback', 'portrait-en-readable', 'landscape-id-feedback']) {
  const q = c(label); assert.equal(q.report.state.gameplayHash, complete.state.gameplayHash);
  assert.deepEqual(actor(label).experience.feedback, feedback);
  assert.ok(q.ui.list.includes('Zebra Grasslands')); assert.ok(q.ui.list.includes('67/100'));
  assert.equal(q.report.visitorView.tickets.revenue, 530);
}
assert.match(c('desktop-id-feedback').ui.list, /Habitat yang diamati: Zebra Grasslands/);
assert.match(c('desktop-en-feedback').ui.list, /Observed habitat: Zebra Grasslands/);
for (const [label, width, locale] of [['desktop-id-feedback',1366,'id'], ['portrait-en-readable',360,'en'], ['landscape-id-feedback',780,'id']]) {
  assert.equal(c(label).ui.width, width); assert.equal(c(label).ui.lang, locale);
}
assert.equal(final.state.tick, 23743); assert.equal(final.state.cash, 3581);
assert.equal(final.state.sha256, '5d140b57cc8a52bd1a81d62c5b2e0505061086dde47d60e3c736fa90a0b4e2f9');
for (const label of ['final-owner-disposed', 'final-cold-without-renderer']) assert.equal(r(label).state.sha256, final.state.sha256);
assert.deepEqual(data.logs, []); assert.equal(data.archive.owners, 0); assert.equal(data.archive.callbacks, 0);
assert.equal(data.archive.durable.hash, final.state.sha256); assert.equal(data.archive.durable.revision, 596);
assert.equal(data.archive.durable.backupSchema, 4);
assert.equal(data.archive.durable.backupHash, 'f68c6602412a4401fe4955d5ff357147e22d8f732d0ab5cd69fc1991df71eeaf');

const logs = [];
for (const [name, count] of [['z4-04-tests-first.log',29], ['z4-04-tests-final.log',6], ['z4-04-types.log',null], ['z4-04-check-final.log',null], ['z4-04-build.log',null]]) {
  const path = '.qa/zebra-audit/' + name, bytes = await readFile(path), text = bytes.toString();
  if (count) { assert.match(text, new RegExp('\\btests ' + count + '\\r?$', 'm')); assert.match(text, new RegExp('\\bpass ' + count + '\\r?$', 'm')); assert.match(text, /\bfail 0\r?$/m); }
  if (name === 'z4-04-types.log') assert.equal(text.trim(), '');
  if (name === 'z4-04-check-final.log') for (const part of ['552 files', '0 errors', '0 warnings', '0 hints']) assert.ok(text.includes(part));
  if (name === 'z4-04-build.log') { assert.match(text, /"productionExclusion":"PASS"/); assert.ok(text.includes(build.source)); }
  logs.push({path,bytes:bytes.length,sha256:sha256(bytes)});
}
const testText = (await readFile('.qa/zebra-audit/z4-04-tests-final.log')).toString();
const diagnostics = testText.split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line.slice(line.indexOf('{')))]; } catch { return []; } });
const flow = diagnostics.find(x => x.completed === 10);
assert.ok(flow); assert.equal(flow.canonicalTicks, 5206); assert.equal(flow.paid, 10); assert.equal(flow.revenue, 100);
assert.equal(new Set(flow.sequence.map(e => e.habitat)).size, 5);
assert.equal(flow.viewProofs.length, 10); assert.equal(flow.zebraFeedback.length, 2);
for (const f of flow.zebraFeedback) { assert.equal(f.samples, 30); assert.equal(f.occupiedSamples, 30); }
await writeFile(dir + '/tests.json', JSON.stringify({status:'PASS',uniquePassing:29,deduplication:'23 existing elephant/visitor-satisfaction/baseline regressions plus six new Zebra cases. The final six-case pack repeats and strengthens Zebra receipt capture at actual completed views, independent of later journal retirement.',source:build.source,strictTypes:'PASS',astroCheck:'552 files;0 errors/warnings/hints',logs,sourceFlow:flow,coverage:['Two complete real round-robin cycles,10 paid views/100ZC, all five populated reachable habitats. Actual route speed/no teleport/outside-adjacent viewing and immutable target.','Original old mission/grant objects and ledger receipts remain exact, Zebra quest namespace unchanged. Per-tick four-resident Zebra feedback independently recomputed.','Equal habitat weights, not14-animal weights; empty/disconnected Zebra excluded. Actual four paid path additions preserve an old pinned visitor unchanged.','Mid-walk/view strict cold pause1x10x equality and archived-ticket fairness, actual access loss/Undo without retarget/second ticket/feedback rewrite.','All10 ID/EN labels preserve old names, actual Zebra prefix corrected; original unlabelledV1 feedback and input objects unchanged.']},null,2)+'\n');
const cleanup = {tabs:'Own Z4-04 tabs28,29,30,31 CLOSED',server:'Own pid28236/session74216/52907 STOPPED via stdin; exit0',rendererOwners:0,callbacks:0,ownedResources:0,viewport:'RESET',soakOrBenchmark:'NONE',farm:'Exclusive10-15minute slot available; do not start Zebra browser/build/soak until released'};
const timing = {totalTicks:final.state.tick-first.state.tick,explicitSourceTicks:641,nativeTicks:23,nativeCallbacks:18,nativeSpeed:1,nativeDroppedWallMs:native.renderer.session.simulationDroppedWallMs,nativeDroppedSimMs:native.renderer.session.simulationDroppedSimMs,presentedFps:null,physicalDevice:false,scope:'640 explicit source ticks at10x before cold restart,23 actual native1x ticks during viewing,one final source tick at1x. Not a performance benchmark or soak. Callback cadence is not presented FPS. Cause of dropped time unassigned; OPEN_R7.'};
const browser = {status:'PASS_Z4_04_ACTUAL_PAID_ZEBRA_VIEW',source:build.source,sourceFingerprint:build.inputs.id,raw:{path:rawPath,bytes:raw.length,sha256:sha256(raw)},cases:data.cases.map(({label,report:q,ui})=>({label,at:q.at,state:q.state,visitorActors:q.visitorActors,visitorView:q.visitorView,admissions:q.admissions,owners:q.owners,maxOwners:q.maxOwners,frames:q.frames,save:q.save,resources:q.resourceOwners.counts,retired:q.retired,meshErrors:q.meshAudit?.counts.errors??null,errors:q.errors,failures:q.failures,ui})),search:data.search,logs:data.logs,archive:data.archive.durable,timing,feedback,cleanup,transport:'One batch100tick CDP click timed out; inspection confirmed it had executed to23279. It was not retried. Subsequent10tick single pulses avoided the transport timeout. No renderer/console failure or denial.',limits:['Browser proves one actual paid Zebra visit; ten-view/two-round fairness and independent per-tick sample sums are canonical source tests.','The completed Zebra feedback is visible in its active returning visitor row; recent excludes the still-active visitor. No claim of observing it after complete departure.','Viewport overrides are desktop browser emulation, not physical devices. Portrait tabs measured74.3125x44px by readonlyDOM; full input/accessibility matrix remainsZ5/R7.','Existing validation-only grant is not issuance or budget acceptance. No public V5 adoption, release, FPS or soak acceptance.']};
await writeFile(dir + '/browser.json', JSON.stringify(browser,null,2)+'\n');
const artifacts=[];
for(const name of ['design.md','tests.json','browser.json','desktop-id.png','portrait-en.png','landscape-id.png']) { const path=dir+'/'+name,bytes=await readFile(path);artifacts.push({path,bytes:bytes.length,sha256:sha256(bytes)}); }
const result={status:'PASS_Z4_04_FIVE_HABITAT_VISITORS',verifiedProgress:31,total:54,source:build.source,sourceFingerprint:build.inputs.id,build:{receipt:buildPath,lab:build.lab.id,production:build.product.id,productionExclusion:build.productionExclusion},tests:29,browserCases:22,sourceFlow:{ticks:5206,completed:10,paid:10,income:100,rounds:2,habitats:5,oldRewardAndGrantProofs:'EXACT'},actualBrowser:{timing,entryTick:23386,ticket:10,feedback,coldMidview:mid.state.sha256,final:final.state.sha256,revision:596,backupV4:data.archive.durable.backupHash,command:142,cash:3581},cleanup,open:['Z2-06 proposed1700grant affordability/exactly-once/defaultV5 adoption','Z4-05 four authoritative Zebra quests','Z5 and HP6 full UX/homepage work; fullR7 regression/visual matrix/native active soak/performance','Original Library Windows materialization blocked byos.setxattr; official full reads used without bypass','R7-08 Zebra push/deploy not authorized; none performed'],next:'After Farm release and only before10:00UTC/17:00WIB: Z4-05. Stop all coding/build/testing/server/browser by deadline and wait for new instructions.',artifacts};
await writeFile(dir+'/verification.json',JSON.stringify(result,null,2)+'\n');
await writeFile(dir+'/checkpoint.json',JSON.stringify({status:'VERIFIED_Z4_04_SAFE_FARM_SLOT',at:new Date().toISOString(),verified:31,total:54,runtimeSource:build.source,sourceFingerprint:build.inputs.id,tests:29,browserCases:22,build:result.build,qaResume:{database:first.database,habitat:home,tick:final.state.tick,cash:final.state.cash,command:142,revision:596,hash:final.state.sha256,preferences:final.state.preferences,zebraActors:final.zebraActors,visitor:final.visitorActors.find(v=>v.id==='arrival-55'),backupV4:data.archive.durable.backupHash},resources:cleanup,next:result.next,open:result.open,deadline:'2026-11-09T10:00:00Z =17:00WIB; wait for new instructions after stopping'},null,2)+'\n');
console.log(JSON.stringify({status:result.status,verified:31,source:build.source,tests:29,browserCases:22,timing}));
