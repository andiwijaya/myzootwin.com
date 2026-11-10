import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {relative,resolve} from 'node:path';
import sharp from 'sharp';
import {sha256} from '../tooling.mjs';

const dir='docs/qa/zebra/hp6-03',source='5e9baca9108ba4eca52e5abcfcf24b8571736720';
const root='.qa/visual3d/h1-03-zebra-homepromo2/product',old='.qa/visual3d/h1-03-zebra-homecards1/product';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const receipt=async path=>{const b=await readFile(path);return{path,bytes:b.length,sha256:sha256(b)};};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const previous=await json('docs/qa/zebra/hp6-02/checkpoint.json');
assert.equal(previous.verified,40);assert.equal(previous.pendingUnit,'HP6-02');
const buildPath='.qa/visual3d/h1-03-zebra-homepromo2/source.json',build=await json(buildPath);
assert.equal(build.source,source);assert.equal(build.productionExclusion.status,'PASS');
assert.equal(build.product.entries.filter(e=>e.path.endsWith('.html')).length,10);
for(const e of [...build.inputs.entries,...build.lab.entries,...build.product.entries])assert.equal(sha256(await readFile(e.path)),e.sha256,e.path);
const astroSource=git('rev-parse','eec27a8'),typesSource=git('rev-parse','8f97ace');
assert.equal(git('diff',astroSource,source,'--','src'),'');
assert.equal(git('diff',typesSource,astroSource,'--','*.ts'),'');
assert.equal((await readFile('.qa/zebra-audit/hp6-03-types.log','utf8')).trim(),'');
assert.match(await readFile('.qa/zebra-audit/hp6-03-check.log','utf8'),/594 files[\s\S]*0 errors[\s\S]*0 warnings[\s\S]*0 hints/);
assert.match(await readFile('.qa/zebra-audit/hp6-03-build-final.log','utf8'),/"productionExclusion":"PASS"/);
assert.deepEqual(git('diff','--name-only','43c2af5',source,'--','src','public','package.json','package-lock.json','astro.config.mjs').split(/\r?\n/),['src/components/ZebraHomePreview.astro','src/components/ZooHome.astro']);
assert.equal(git('diff','43c2af5',source,'--','src/game','src/game-entry','public','package.json','package-lock.json','astro.config.mjs'),'');
const unchanged=[];
for(const e of build.product.entries){
 const path=relative(resolve(root),resolve(e.path)).replaceAll('\\','/');
 if(path.endsWith('.html')&&!['index.html','en/index.html'].includes(path)||path.endsWith('.js')||path.startsWith('images/')||['robots.txt','sitemap-0.xml','sitemap-index.xml'].includes(path)){
  assert.equal(e.sha256,sha256(await readFile(old+'/'+path)),path);unchanged.push({path,sha256:e.sha256});
 }
}
assert.equal(unchanged.filter(e=>e.path.endsWith('.html')).length,8);
const metadata=s=>[...s.matchAll(/<meta\b[^>]*>|<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>|<title>[\s\S]*?<\/title>|<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi)].map(m=>m[0]);
for(const path of ['index.html','en/index.html']){
 const current=await readFile(root+'/'+path,'utf8'),before=await readFile(old+'/'+path,'utf8');
 assert.deepEqual(metadata(current),metadata(before));assert.equal((current.match(/data-zebra-home-preview/g)||[]).length,1);
 assert.equal((current.match(/data-home-habitat=/g)||[]).length,5);assert.equal((current.match(/data-availability="preview"/g)||[]).length,2);
 assert.equal((current.match(/<h1\b/g)||[]).length,1);assert.ok(!/inertPlay|serve-homepage|scripts\/qa|__VIS3D_SOURCE__|suppressedPlayScripts/.test(current));
}
const rawPaths=['.qa/zebra-audit/hp6-03-browser.json','.qa/zebra-audit/hp6-03-browser-logs.json','.qa/zebra-audit/hp6-03-server.json'];
const [ui,logs,server]=await Promise.all(rawPaths.map(json));
assert.equal(ui.length,22);assert.deepEqual(logs,[]);assert.equal(server.inertPlay,true);assert.equal(server.pid,30240);
assert.equal(resolve(server.root),resolve(root));assert.equal(server.suppressedPlayScripts.length,2);
const homes=ui.filter(r=>r.promo),destinations=ui.filter(r=>!r.promo);
assert.equal(homes.length,19);assert.equal(destinations.length,3);
for(const r of ui){assert.equal(r.source,source);assert.equal(r.canvas,0);assert.deepEqual(r.refs,[]);assert.equal(r.overflow,false);assert.equal(r.h1.length,1);}
for(const r of homes){
 const p=r.promo;assert.equal(p.availability,'preview');assert.equal(p.labelledby,'zebra-preview-title');assert.equal(p.images,0);assert.equal(p.features.length,3);
 assert.match(p.status,r.lang==='id'?/^Pratinjau versi berikutnya$/:/^Preview of a future version$/);
 assert.match(p.note,r.lang==='id'?/belum dapat dimainkan di versi publik.*empat habitat/:/not playable in the public version yet.*four habitats/);
 for(const name of ['Zaki','Zuri','Mira','Kira'])assert.ok(p.intro.includes(name));
 assert.match(p.features[0].title,r.lang==='id'?/merumput dan minum/:/graze and drink/);
 assert.match(p.features[0].text,r.lang==='id'?/bukan langsung memenuhi kebutuhan/:/rather than immediately satisfying needs/);
 assert.match(p.features[2].text,r.lang==='id'?/dua Zebra yang bertemu/:/two Zebras meeting/);
 assert.deepEqual(p.links.map(l=>l.href),['/play/','#habitats']);assert.equal(p.links[0].describedby,'zebra-preview-availability');
 assert.ok(p.links.every(l=>l.rect.height>=44&&l.rect.width>=44&&l.rect.left>=0&&l.rect.right<=r.viewport.width));
 assert.ok(p.rect.left>=0&&p.rect.right<=r.viewport.width);
 assert.deepEqual(r.cards.map(c=>c.id),['macaw','elephant','lion','giraffe','zebra']);
 assert.deepEqual(r.cards.map(c=>c.availability),['start','progression','progression','progression','preview']);
 assert.equal(r.scriptSrc.length,1);assert.ok(r.scriptSrc[0].includes('BaseLayout'));
}
for(const r of destinations){assert.equal(new URL(r.url).pathname,'/play/');assert.deepEqual(r.scriptSrc,[]);assert.equal(r.lang,'id');}
for(const lang of ['id','en'])for(const width of [1280,780,360])assert.ok(homes.some(r=>r.lang===lang&&r.viewport.width===width),lang+width);
const get=label=>{const r=ui.find(r=>r.label===label);assert.ok(r,label);return r;};
for(const lang of ['id','en']){
 for(const label of ['tab-promo-primary','shift-tab-promo-primary'])assert.match(get(lang+'-'+label).focus,/class="button" href="\/play\/"[^>]*aria-describedby="zebra-preview-availability"/);
 assert.match(get(lang+'-tab-promo-secondary').focus,/class="preview-link" href="#habitats"/);
 assert.equal(new URL(get(lang+'-promo-card-anchor').url).hash,'#habitats');assert.equal(get(lang+'-play-back-promo').cards.length,5);
}
assert.equal(get('language-back-en-landscape').lang,'en');assert.equal(get('language-forward-id-landscape').lang,'id');
const screenshots=[];
for(const name of ['id-desktop-preview','en-mobile-preview-heading','en-mobile-preview-cta']){
 const path=dir+'/'+name+'.jpg',m=await sharp(path).metadata();
 if(name.startsWith('en-mobile'))assert.ok(m.width>=330&&m.width<=360&&m.height>=740&&m.height<=800);
 else assert.ok(m.width>=1250&&m.width<=1280&&m.height>=860&&m.height<=900);
 screenshots.push({...await receipt(path),width:m.width,height:m.height});
}
const oldProof=await json('docs/qa/zebra/hp6-02/verification.json');
for(const r of oldProof.native.rawReceipts)assert.equal((await receipt(r.path)).sha256,r.sha256,r.path);
const at='2026-11-10T00:05:36.000Z';
assert.ok(ui.every(r=>r.at<'2026-11-10T01:00:00.000Z'),'Native observations must precede the hard stop.');
const resources={at,activeOwnedBrowserServerBuildTestsRenderer:0,browser:{kind:'internal IAB',symbolic:'iab',ownTab:'50',closed:true,viewportReset:true,remainingTabs:0},server:{port:52907,pid:30240,session:34432,exit:0,inertPlay:true},completed:{strictTypes:81610,astro:64472,build:73748,allExit:0},retiredInitialServer:{session:92333,pid:29064,exit:0,browserQa:false},engineLaunched:false,defaultGameDatabaseOpened:false,scope:'Actual homepage scripts. Play navigation uses built markup with all scripts suppressed only in the QA HTTP response. Path/back-forward proof, not game-start or locale-handoff acceptance; generic Play markup remains ID in both paths. Product files unchanged.',farm:'Browser/heavy slot released; wait for coordination',stopDeadline:'2026-11-10T01:00:00Z (08:00 WIB)'};
const blockers=previous.blockers;
const proof={status:'PASS_HP6_03_PREVIEW',at,verified:41,total:54,source,applicationChecksSource:astroSource,strictTypesSource:typesSource,applicationChecksScope:'Two Astro copy strings changed after standalone TS checks; all TS sources identical. Final Astro check covers eec27a8. Only QA server bookkeeping/docs changed from eec27a8 to final5e9baca build.',sourceFingerprint:build.inputs.id,change:'SSR-only bilingual preview promotion and ZooHome insertion. Grounded four-resident herd/care teaser, explicit future/public availability and benefit-led generic Play CTA. No game/engine/save/asset/dependency change.',acceptance:'HP6-03 explicitly permits preview/coming-soon before release. Its verified count increases by1; HP6-02 five-playable acceptance remains OPEN and uncounted.',checks:{strictTypes:'PASS noEmit/noUnused',astro:'PASS594 files,0 errors/warnings/hints',build:'PASS10 pages and production QA exclusion; existing large-chunk advisory only',logs:await Promise.all(['types','check','build-final'].map(k=>receipt('.qa/zebra-audit/hp6-03-'+k+'.log'))),unitTests:'No new unit tests for static SSR copy/CSS. Source/output invariance and actual browser layout/navigation are the relevant regressions.'},build:{receipt:await receipt(buildPath),lab:build.lab.id,product:build.product.id,unchanged},native:{rawReceipts:await Promise.all(rawPaths.map(receipt)),observations:22,homeObservations:19,inertPlayDestinations:3,viewports:[{width:1280,height:900},{width:780,height:460},{width:360,height:800}],method:'Internal browser native Tab/Shift+Tab/Enter, fragment navigation, CTA/back/forward and language switch/back/forward. Viewport overrides are not physical devices.',cases:ui.map(r=>({label:r.label,url:r.url,lang:r.lang,viewport:r.viewport,preview:r.promo?.availability??null,links:r.promo?.links??[],focus:r.focus,refIssues:r.refs.length,overflow:r.overflow,canvas:r.canvas,scriptSrc:r.scriptSrc})),logs:[]},screenshots,historicalReceiptIntegrity:{status:'PASS',receipts:oldProof.native.rawReceipts,note:'First HP6-03 server startup initially reused HP6-02 receipt path. Archived separately and original restored byte-exact before browser QA. Explicit per-unit receipt path added to QA server; final build repeated. Old evidence hashes remain exact.'},resources,blockers,noPushOrDeploy:true};
await writeFile(dir+'/verification.json',JSON.stringify(proof,null,2)+'\n');
await writeFile(dir+'/checkpoint.json',JSON.stringify({status:proof.status,at,verified:41,total:54,completedUnit:'HP6-03',pendingUnit:'HP6-02',candidateSource:source,build:{runId:build.runId,product:build.product.id},previousGameplayCheckpoint:'../z5-05/checkpoint.json',qaResume:previous.qaResume,responsiveResume:previous.responsiveResume,saveScope:'Carried original main827/secondary87 checkpoints; no game/save opened in HP6-03.',resources,blockers,next:'HP6-04 source-bound original V5 hero/Zebra media after browser/heavy slot coordination and only with enough time before hard stop. Keep HP6-02 five-playable gate open. No push/deploy.',open:previous.open,noPushOrDeploy:true},null,2)+'\n');
console.log(JSON.stringify({status:proof.status,verified:'41/54',source,types:'PASS',astro:'PASS594',build:'PASS10',unchangedHtml:8,homeObservations:19,ctaDestinations:3,viewports:3,availability:'4_AVAILABLE_1_PREVIEW',historicalReceiptIntegrity:'PASS',resources:'CLOSED_SLOT_AVAILABLE',noPushOrDeploy:true}));
