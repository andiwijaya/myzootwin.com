import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {sha256} from '../tooling.mjs';

const source='b0d17408696fc37ba973f7f09985e12577cd94c2',dir='docs/qa/zebra/z5-05';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const receipt=async path=>{const b=await readFile(path);return{path,bytes:b.length,sha256:sha256(b)};};
const checkpoint=await json(dir+'/checkpoint.json');
const alreadyVerified=checkpoint.verified===39&&checkpoint.verifiedSource===source;
assert.ok(checkpoint.verified===38||alreadyVerified,'Historical acceptance writer must not overwrite newer progress');
const buildPath='.qa/visual3d/h1-03-zebra-accessible4/source.json',build=await json(buildPath);
assert.equal(build.source,source);assert.equal(build.productionExclusion.status,'PASS');
assert.equal(build.product.entries.filter(e=>e.path.endsWith('.html')).length,10);
for(const e of [...build.inputs.entries,...build.lab.entries,...build.product.entries])assert.equal(sha256(await readFile(e.path)),e.sha256,e.path);
const delta=execFileSync('git',['diff','--name-only','61fef6e','--','src','public','package.json','package-lock.json'],{encoding:'utf8'}).trim().split(/\r?\n/);
assert.deepEqual(delta,['src/game-entry/hud-layout.ts','src/game-entry/preview-panel.ts','src/game-entry/zebra-care-panel.ts','src/game-entry/zebra-guide.ts']);
assert.equal(execFileSync('git',['diff','--name-only','61fef6e','--','src/game'],{encoding:'utf8'}).trim(),'');
const tests=await readFile('.qa/zebra-audit/z5-05-options-tests.log','utf8');
for(const s of ['tests 40','pass 40','fail 0'])assert.ok(tests.includes(s));
assert.equal((await readFile('.qa/zebra-audit/z5-05-options-types.log','utf8')).trim(),'');
assert.match(await readFile('.qa/zebra-audit/z5-05-options-check.log','utf8'),/587 files[\s\S]*0 errors[\s\S]*0 warnings[\s\S]*0 hints/);
const rawPaths=['.qa/zebra-audit/z5-05-accepted-ui.json','.qa/zebra-audit/z5-05-accepted-browser.json','.qa/zebra-audit/z5-05-accepted-cold.json'];
const [ui,records,cold]=await Promise.all(rawPaths.map(json));assert.equal(ui.length,79);assert.equal(records.length,9);assert.equal(cold.length,2);
const get=label=>{const r=ui.find(r=>r.label===label);assert.ok(r,label);return r;};
for(const u of ui){assert.equal(u.source,source);assert.deepEqual(u.refs,[],u.label);assert.equal(u.overflow,false,u.label);}
for(const label of ['id-desktop-cold-settled','en-mobile-cold-resume']){assert.match(get(label).focus.html,/data-save-resume-button/);assert.equal(get(label).world.inert,true);}
for(const locale of ['id','en']){
  for(const [suffix,target] of [['right-care','care'],['end-build','build'],['home-missions','missions'],['left-wrap-build','build'],['down-wrap-missions','missions']]){
    const r=get(locale+'-'+suffix);assert.equal(r.focus.id,'hud-tab-'+target);
    assert.equal(r.tabs.filter(t=>t.selected==='true').length,1);assert.equal(r.tabs.filter(t=>t.tabIndex===0).length,1);
    assert.equal(r.panels.find(p=>p.id==='hud-pane-'+target).hidden,false);
  }
  assert.equal(get(locale+'-tab-into-care').focus.id,'hud-pane-care');
  const pages=ui.filter(r=>r.label.startsWith(locale+'-care-'));assert.equal(pages.length,4);
  assert.equal(pages[0].scroller.top,0);assert.ok(pages[1].scroller.top>0);assert.ok(pages[2].scroller.top>=pages[1].scroller.top);assert.equal(pages[3].scroller.top,0);
  const welfare=ui.filter(r=>r.label.startsWith(locale+'-welfare-'));assert.equal(welfare.length,2);
  assert.equal(welfare[0].details.find(d=>d.kind==='zebra-zaki').open,true);assert.equal(welfare[1].details.find(d=>d.kind==='zebra-zaki').open,false);
  const guide=get(locale+'-guide-Enter').details.find(d=>d.kind==='care');assert.equal(guide.open,true);assert.equal(guide.steps,7);assert.equal(guide.lang,locale);
  assert.equal(get(locale+'-guide-Space').details.find(d=>d.kind==='care').open,false);
  assert.equal(get(locale+'-camera-q').world.azimuth,'315');assert.equal(get(locale+'-camera-e').world.azimuth,'0');
  for(const key of ['q','e'])assert.match(get(locale+'-camera-'+key).world.shortcuts,/\bQ E\b/);
  const inside=get(locale+'-options-inside-escape');assert.equal(inside.options,false);assert.equal(inside.focus.tag,'SUMMARY');
  const tabs=ui.filter(r=>r.label===locale+'-help-Tab');assert.equal(tabs.length,3);
  assert.equal(tabs[0].focus.tag,'A');assert.equal(tabs[1].focus.tag,'BUTTON');assert.equal(tabs[2].focus.tag,'A');
  assert.equal(get(locale+'-help-Shift+Tab').focus.tag,'BUTTON');
  const settings=get(locale+'-settings-Escape');assert.deepEqual(settings.dialogs,[]);assert.match(settings.focus.html,/data-open-dialog="play-settings"/);
  assert.equal(get(locale+'-settings-Tab').focus.id,'entry-language');
  const lost=get(locale+'-help-after-loss');assert.deepEqual(lost.dialogs.map(d=>d.id),['play-help']);
  assert.equal(lost.details.find(d=>d.kind==='dialog').hidden,false);assert.equal(lost.details.find(d=>d.kind==='dialog').lang,locale);assert.equal(lost.details.find(d=>d.kind==='care').hidden,true);
}
for(const label of ['id-help-Space','id-help-escape-return','en-help-Escape','en-help-space-close-return','en-loss-help-close-return']){const r=get(label);assert.deepEqual(r.dialogs,[]);assert.match(r.focus.html,/data-open-dialog="play-help"/);}
for(const label of ['id-retry-enter-focus','en-retry-space-focus'])assert.match(get(label).focus.html,/data-pause-toggle/);
for(const prefix of ['en','id-mobile']){
  const plan=get(prefix==='en'?'en-plan-enter-options-open':'id-mobile-plan-options-open');assert.equal(plan.options,true);
  for(const suffix of ['escape-preview-return-plan','space-cancel-return-plan']){const r=get(prefix+'-'+suffix);assert.equal(r.options,false);assert.match(r.focus.html,/data-zebra-plan="zebra-enrichment"/);assert.ok(!r.zebraButtons.some(b=>['Cancel','Batal'].includes(b.text)));}
}
assert.equal(get('en-ready-unpaid-plan').zebraButtons.find(b=>b.text==='Confirm purchase').disabled,false);
assert.ok(get('en-preview-paused-guard').zebraButtons.every(b=>b.disabled));
assert.match(get('en-ready-cancel-return-plan').focus.html,/data-zebra-plan="zebra-enrichment"/);
const main='e70827160d1c40e22b0bf3b63cdc8a4ec3a327ea76b5ab19e3cc0489b62921ed',en='b9749ac5549c583eb383d5a61fb77f0221e7627522b63eabf857f5d1e1b54b6e',backup='f68c6602412a4401fe4955d5ff357147e22d8f732d0ab5cd69fc1991df71eeaf';
const baseline=await json('.qa/zebra-audit/z5-05-browser-discovery.json');
for(const r of records){
  const english=r.database.includes('7cf0dca0'),original=baseline.find(b=>b.database===r.database);
  assert.equal(r.source,source);assert.equal(r.state.valid,true);assert.equal(r.state.actors.length,14);assert.deepEqual(r.state.actors,original.state.actors);assert.equal(r.state.gameplayHash,original.state.gameplayHash);
  assert.equal(r.state.tick,english?13771:27849);assert.equal(r.state.cash,english?3910:3581);
  assert.equal(r.state.sha256,r.label==='id-mobile-preview-locale-only'?'7979b5e56f2dd38282afff329b707fe6ca95448e7f0488790353bcff14fa8d64':english?en:main);
  assert.deepEqual(r.state.preferences,r.label==='id-mobile-preview-locale-only'?{...original.state.preferences,locale:'id'}:original.state.preferences);
  assert.equal(r.maxOwners,1);assert.deepEqual(r.errors,[]);assert.ok(r.failures.every(f=>f==='context-lost'));assert.equal(r.frames.manualTime,0);assert.equal(r.frames.nativeDeliveries,0);assert.equal(r.save.phase,'saved');assert.equal(r.save.inflight,false);
}
const disposed=records.filter(r=>r.label==='id-disposed'||r.label==='en-disposed');assert.equal(disposed.length,2);
for(const r of disposed){assert.equal(r.owners,0);assert.equal(r.save.disposed,true);assert.equal(r.frames.disposed,true);assert.equal(r.frames.pending,0);assert.equal(r.frames.nativePending,0);assert.equal(r.audio.liveContexts,0);assert.equal(r.audio.liveNodes,0);assert.ok(r.contextEvents.some(e=>e.type==='webglcontextlost'&&e.trusted));assert.deepEqual(r.failures,['context-lost']);for(const s of r.retired){assert.equal(s.disposed,true);for(const k of ['geometries','textures','programs','ownedMaterialsLive','pendingFrames','simulationSubscribers','cleanupErrors'])assert.equal(s[k],0,k);}}
for(const c of cold){assert.equal(c.source,source);assert.equal(c.owners,0);assert.equal(c.callbacks,0);assert.deepEqual(c.errors,[]);assert.equal(c.durable.version,5);assert.equal(c.durable.schema,5);assert.equal(c.durable.backupSchema,4);assert.equal(c.durable.backupHash,backup);assert.equal(c.durable.hash,c.database.includes('7cf0dca0')?en:main);}
assert.equal(cold[0].durable.revision,827);assert.equal(cold[1].durable.revision,87);
const at='2026-11-09T22:23:10.000Z';
const resources={at,activeOwnedBuildTestsServerBrowserRenderer:0,server:{port:52907,pid:21576,session:89000,exit:0},browser:{kind:'internal IAB',id:'2',ownedTabs:['45','46'],closed:true,viewportReset:true,remaining:[{id:'44',url:'https://myzootwin.com/',scope:'Pre-existing static production homepage, unmodified and preserved. No QA/game owner.'}],oldErrorTab40:'Absent from current IAB inventory; prior explicit-close limitation is no longer present.'},completedChecks:{tests:46978,types:16883,astro:32533,build:86198,allExit:0},owners:0,audioContexts:0,pendingCallbacks:0,geometries:0,textures:0,programs:0,ownedMaterials:0,simulationSubscribers:0,scope:'Final-source four retired source owners all0. This does not certify heap leaks, physical devices, speakers, screen readers or presented FPS.',farm:'Slot available; no new heavy/browser work until coordinated release',stopDeadline:'2026-11-10T01:00:00Z (08:00 WIB); all owned QA work already stopped at this checkpoint'};
const proof={status:'PASS_Z5_05',at,verified:39,total:54,source,sourceFingerprint:build.inputs.id,scope:'Four UI files only. Q/E ARIA, stable known Zebra Help through renderer loss, unpaid preview Escape/Cancel focus restoration, async keyboard Retry focus and Options Escape ownership. No engine/save/gameplay/assets/dependencies changed.',tests:{passed:40,types:'PASS strict noEmit/noUnused',astro:'PASS587 files,0 errors/warnings/hints',logs:await Promise.all(['tests','types','check','build'].map(k=>receipt('.qa/zebra-audit/z5-05-options-'+k+'.log')))},build:{receipt:await receipt(buildPath),lab:build.lab.id,production:build.product.id,pages:10,qaExclusion:'PASS',warning:'Existing chunk-size advisory; not a new failure.'},native:{rawReceipts:await Promise.all(rawPaths.map(receipt)),uiObservations:ui.length,browserRecords:records.length,coldArchives:cold.length,method:'Actual internal-browser Tab/Shift+Tab/arrows/Home/End/PageDown/Enter/Space/Escape and Q/E. Native WEBGL_lose_context extension requests produced trusted loss events; original product Retry created fresh owners. Manual QA timeline0ms, no benchmark or physical fault claim.',cases:ui.map(r=>({label:r.label,locale:r.locale,focus:r.focus.id||r.focus.text,options:r.options,selected:r.tabs.filter(t=>t.selected==='true').map(t=>t.id),scroller:r.scroller,viewport:r.viewport,refIssues:r.refs.length,overflow:r.overflow})),records:records.map(r=>({label:r.label,source:r.source,database:r.database,state:r.state,revision:r.save.revision,savePhase:r.save.phase,saveInflight:r.save.inflight,saveDisposed:r.save.disposed,owners:r.owners,frames:r.frames,audio:r.audio,events:r.contextEvents,failures:r.failures,errors:r.errors,retired:r.retired.map(s=>({disposed:s.disposed,lost:s.lost,geometry:s.geometries,texture:s.textures,programs:s.programs,materials:s.ownedMaterialsLive,callbacks:s.pendingFrames,subscribers:s.simulationSubscribers,cleanupErrors:s.cleanupErrors}))})),cold:cold.map(c=>({source:c.source,database:c.database,durable:c.durable,owners:c.owners,callbacks:c.callbacks,errors:c.errors})),preferences:'The EN QA save was explicitly switched to ID to test mobile preview cancellation, then restored to EN. Gameplay hash/14 actor poses stayed exact throughout; final full EN payload is identical. No purchases/refills/rewards/clock steps.'},screenshots:await Promise.all(['id-keyboard-accepted.jpg','en-mobile-keyboard-accepted.jpg'].map(p=>receipt(dir+'/'+p))),intermediate:{scope:'Historical discovery/failure evidence, not final acceptance',receipts:await Promise.all(['.qa/zebra-audit/z5-05-3fa-matrix-ui.json','.qa/zebra-audit/z5-05-3fa-matrix-browser.json'].map(receipt))},resources,limitations:['Internal browser viewport and native keyboard/DOM proof only; no physical phone, assistive-reader certification, physical GPU fault, true background, native10x performance, presented FPS or active15-minute soak claim.','Historical grant/home prerequisites remain validation-only. Z2-06 budget/exactly-once/publicV5 adoption and R7 gates remain open.','Explicit Zebra push/deploy permission is absent; R7-08 held.'],noPushOrDeploy:true};
if(!alreadyVerified){
  await writeFile(dir+'/verification.json',JSON.stringify(proof,null,2)+'\n');
  await writeFile(dir+'/checkpoint.json',JSON.stringify({...checkpoint,status:'PASS_Z5_05_SAFE_RESOURCE_RELEASE',at,verified:39,total:54,pendingUnit:null,candidateSource:source,verifiedSource:source,sourceFingerprint:build.inputs.id,build:{runId:build.runId,lab:build.lab.id,productEntry:build.productEntry},qaResume:{...checkpoint.qaResume,revision:827,scope:'Final source full native ID matrix and fresh cold V5 primary/V4 backup exact; all owners disposed.'},responsiveResume:{...checkpoint.responsiveResume,revision:87,scope:'Final source EN/mobile matrix, temporary ID preview tests then original EN preference restored; exact full cold V5 primary/V4 backup.'},resources,pending:[],next:'HP6-01 homepage V5 audit after coordination. Keep Z2-06 and R7 gates explicit; no push/deploy. Respect01:00UTC stop deadline and wait for Farm slot release before heavy/browser work.',open:checkpoint.open.filter(s=>!s.startsWith('Z5-05 '))},null,2)+'\n');
}
console.log(JSON.stringify({status:proof.status,verified:'39/54',source,tests:40,types:'PASS',astro:'PASS587',build:'PASS10',nativeUi:79,records:9,coldArchives:2,resources:'CLOSED_SLOT_AVAILABLE',noPushOrDeploy:true}));
