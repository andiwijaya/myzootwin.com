import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {relative,resolve} from 'node:path';
import sharp from 'sharp';
import {sha256} from '../tooling.mjs';

const dir='docs/qa/zebra/hp6-04',source='bef8579022d1a67c3f19ad9d651c923234230999',captureSource='5e9baca9108ba4eca52e5abcfcf24b8571736720';
const root='.qa/visual3d/h1-03-zebra-homemedia1/product',old='.qa/visual3d/h1-03-zebra-homepromo2/product';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const receipt=async path=>{const b=await readFile(path);return{path,bytes:b.length,sha256:sha256(b)};};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const previous=await json('docs/qa/zebra/hp6-03/checkpoint.json');assert.equal(previous.verified,41);
const buildPath='.qa/visual3d/h1-03-zebra-homemedia1/source.json',build=await json(buildPath);
assert.equal(build.source,source);assert.equal(build.productionExclusion.status,'PASS');assert.equal(build.product.entries.filter(e=>e.path.endsWith('.html')).length,10);
for(const e of [...build.inputs.entries,...build.lab.entries,...build.product.entries])assert.equal(sha256(await readFile(e.path)),e.sha256,e.path);
assert.deepEqual(git('diff','--name-only','854602b',source,'--','src').split(/\r?\n/),['src/components/ZebraHomePreview.astro','src/components/ZooHome.astro']);
assert.equal(git('diff',captureSource,source,'--','src/game','src/game-entry','package.json','package-lock.json','astro.config.mjs'),'');
assert.equal((await readFile('.qa/zebra-audit/hp6-04-types.log','utf8')).trim(),'');
assert.match(await readFile('.qa/zebra-audit/hp6-04-check.log','utf8'),/596 files[\s\S]*0 errors[\s\S]*0 warnings[\s\S]*0 hints/);
assert.match(await readFile('.qa/zebra-audit/hp6-04-build.log','utf8'),/"productionExclusion":"PASS"/);
const provenancePath=dir+'/image-provenance.json',provenance=await json(provenancePath);assert.equal(provenance.source,captureSource);
for(const r of [...provenance.sources,...provenance.transforms])assert.equal((await receipt(r.path)).sha256,r.sha256,r.path);
assert.equal((await receipt(provenance.captureReceipt.path)).sha256,provenance.captureReceipt.sha256);
const captureBuild=await json(provenance.sourceBuild);assert.equal(captureBuild.source,captureSource);
for(const e of captureBuild.lab.entries)assert.equal(sha256(await readFile(e.path)),e.sha256,e.path);
const capture=await json(provenance.captureReceipt.path);assert.equal(capture.length,6);
for(const r of capture){assert.equal(r.source,captureSource);assert.equal(r.state.sha256,previous.qaResume.hash);assert.equal(r.state.gameplayHash,'af3d25c59917fd06c0238907999034cdc85f76993b22d7a3f4bf20862d69421d');assert.equal(r.state.tick,27849);assert.equal(r.state.cash,3581);assert.equal(r.state.actors.length,14);assert.equal(r.state.valid,true);assert.equal(r.frames.nativeDeliveries,0);assert.equal(r.frames.manualTime,0);assert.deepEqual(r.errors,[]);assert.deepEqual(r.failures,[]);assert.ok(r.maxOwners<=1);}
const closed=capture.find(r=>r.label==='capture-owner-closed'),cold=capture.find(r=>r.label==='cold-payload-no-engine');
assert.equal(closed.owners,0);assert.equal(closed.frames.pending,0);assert.equal(closed.frames.disposed,true);assert.equal(closed.canonicalOwner.present,false);
const retired=closed.retired.at(-1);assert.equal(retired.disposed,true);
for(const key of ['geometries','textures','ownedMaterialsLive','simulationSubscribers','pendingFrames','cleanupErrors'])assert.equal(retired[key],0,key);
assert.equal(cold.owners,0);assert.equal(cold.save.revision,830);assert.equal(cold.frames.pending,0);
assert.equal(capture.at(-1).frames.disposed,true);assert.deepEqual(await json('.qa/zebra-audit/hp6-04-capture-logs.json'),[]);
for(const t of provenance.transforms){
 const pose=provenance.poses.find(p=>p.label===(t.source.includes('overview')?'overview-original-low':'zebra-original-low'));assert.ok(pose);
 assert.ok(t.crop.left>=pose.canvas.left&&t.crop.left+t.crop.width<=pose.canvas.right&&t.crop.top>=pose.canvas.top&&t.crop.top+t.crop.height<=pose.canvas.bottom);
 const m=await sharp(t.path).metadata();assert.equal(m.width,t.width);assert.equal(m.height,t.height);assert.ok(t.bytes<(t.path.endsWith('.webp')?30000:45000));
}
const unchanged=[],addedImages=[];
for(const e of build.product.entries){
 const path=relative(resolve(root),resolve(e.path)).replaceAll('\\','/');
 if(path.startsWith('images/home/v5-')){addedImages.push({path,sha256:e.sha256});continue;}
 if(path.endsWith('.html')&&!['index.html','en/index.html'].includes(path)||path.endsWith('.js')||path.startsWith('images/')||['robots.txt','sitemap-0.xml','sitemap-index.xml'].includes(path)){
  assert.equal(e.sha256,sha256(await readFile(old+'/'+path)),path);unchanged.push({path,sha256:e.sha256});
 }
}
assert.equal(unchanged.filter(e=>e.path.endsWith('.html')).length,8);assert.equal(addedImages.length,5);
const head=s=>[...s.matchAll(/<meta\b[^>]*>|<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>|<title>[\s\S]*?<\/title>/gi)].map(m=>m[0]).filter(s=>!/(?:property|name)="(?:og:image(?::alt)?|twitter:image(?::alt)?)"/.test(s));
const data=s=>JSON.parse(s.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)[1]);
for(const path of ['index.html','en/index.html']){
 const html=await readFile(root+'/'+path,'utf8'),before=await readFile(old+'/'+path,'utf8');assert.deepEqual(head(html),head(before));
 const now=data(html),was=data(before);assert.equal(now.image,'https://myzootwin.com/images/home/v5-zoo-social.jpg');now.image=was.image;assert.deepEqual(now,was);assert.ok(!now.aggregateRating);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/data-home-habitat=/g)||[]).length,5);assert.ok(!/scripts\/qa|matrix-result|__VIS3D_SOURCE__|inertPlay/.test(html));
}
const rawPaths=['.qa/zebra-audit/hp6-04-home-browser.json','.qa/zebra-audit/hp6-04-home-logs.json','.qa/zebra-audit/hp6-04-home-server.json','.qa/zebra-audit/hp6-04-capture-browser.json','.qa/zebra-audit/hp6-04-capture-logs.json','.qa/zebra-audit/hp6-04-capture-server.json'];
const ui=await json(rawPaths[0]),homes=ui.filter(r=>r.hero),destinations=ui.filter(r=>!r.hero),server=await json(rawPaths[2]);
assert.equal(ui.length,29);assert.equal(homes.length,27);assert.equal(destinations.length,2);assert.deepEqual(await json(rawPaths[1]),[]);assert.equal(server.pid,28572);assert.equal(server.inertPlay,true);assert.equal(server.suppressedPlayScripts.length,2);
for(const r of ui){assert.equal(r.source,source);assert.equal(r.canvas,0);assert.equal(r.overflow,false);assert.deepEqual(r.refs,[]);assert.equal(r.h1.length,1);assert.ok(r.at<'2026-11-10T01:00:00.000Z');}
for(const r of homes){
 assert.equal(r.preview,'preview');assert.equal(r.scriptSrc.length,1);assert.ok(r.scriptSrc[0].includes('BaseLayout'));assert.equal(r.hero.priority,'high');assert.equal(r.hero.loading,null);assert.equal(r.zebra.loading,'lazy');
 for(const [kind,img]of [['zoo',r.hero],['zebra',r.zebra]]){
  if(kind==='zoo'||img.rect.top<r.viewport.height&&img.rect.bottom>0)assert.ok(img.complete&&img.natural>0);
  assert.match(img.alt,r.lang==='id'?/Pratinjau.*Zebra belum tersedia di versi publik/:/preview.*Zebras are not in the public version yet/);
  assert.match(img.caption,r.lang==='id'?/V5.*Zebra belum tersedia di versi publik/:/V5.*Zebras are not in the public version yet/);
  assert.equal(img.srcset.split(',').length,2);assert.ok(img.sizes.includes('vw'));assert.ok(img.src.includes('/images/home/v5-'+kind+'-'));if(img.currentSrc)assert.ok(img.currentSrc.includes('/images/home/v5-'+kind+'-'));assert.ok(img.rect.left>=0&&img.rect.right<=r.viewport.width);
 }
 assert.deepEqual(r.cta.map(c=>c.href),['/play/','#habitats','/play/','#habitats']);assert.ok(r.cta.every(c=>c.rect.height>=44&&c.rect.width>=44&&c.rect.left>=0&&c.rect.right<=r.viewport.width));
 const social=Object.fromEntries(r.social.map(m=>[m.key,m.content]));assert.equal(social['og:image'],social['twitter:image']);assert.equal(social['og:image'],'https://myzootwin.com/images/home/v5-zoo-social.jpg');assert.equal(social['og:image:alt'],r.hero.alt);assert.equal(social['twitter:image:alt'],r.hero.alt);assert.equal(social['og:image:width'],'1200');assert.equal(social['og:image:height'],'630');
}
for(const r of destinations){assert.equal(new URL(r.url).pathname,'/play/');assert.deepEqual(r.scriptSrc,[]);}
const lazyPending=homes.filter(r=>!r.zebra.complete||!r.zebra.natural);assert.deepEqual(lazyPending.map(r=>r.label),['language-id-mobile']);assert.ok(lazyPending[0].zebra.rect.top>lazyPending[0].viewport.height);
for(const lang of ['id','en'])for(const width of [1280,780,360])assert.ok(homes.some(r=>r.lang===lang&&r.viewport.width===width&&r.zebra.complete&&r.zebra.natural>0),lang+width);
const get=label=>{const r=ui.find(r=>r.label===label);assert.ok(r,label);return r;};
for(const lang of ['id','en']){
 for(const k of ['tab-promo-primary','shift-tab-promo-primary'])assert.match(get(lang+'-'+k).focus,/class="button" href="\/play\/"/);
 assert.match(get(lang+'-tab-promo-secondary').focus,/class="preview-link" href="#habitats"/);assert.ok(get(lang+'-play-back-promo').hero);
 assert.ok(get(lang+'-mobile-hero').hero.currentSrc.endsWith('v5-zoo-480.webp'));assert.ok(get(lang+'-mobile-zebra').zebra.currentSrc.endsWith('v5-zebra-440.webp'));
}
assert.equal(new URL(get('en-promo-card-anchor').url).hash,'#habitats');assert.equal(get('language-back-en-mobile').lang,'en');assert.equal(get('language-forward-id-mobile').lang,'id');
const screenshots=[];for(const name of ['id-desktop-home','id-desktop-zebra','en-mobile-hero','en-mobile-zebra']){const path=dir+'/'+name+'.jpg',m=await sharp(path).metadata();if(name.startsWith('en-mobile'))assert.ok(m.width>=330&&m.width<=360&&m.height>=740&&m.height<=800);else assert.ok(m.width>=1250&&m.width<=1280&&m.height>=860&&m.height<=900);screenshots.push({...await receipt(path),width:m.width,height:m.height});}
const at='2026-11-10T00:28:37.000Z',resources={at:'2026-11-10T00:25:41.000Z',activeOwnedBrowserServerBuildTestsRenderer:0,browser:{kind:'internal IAB',symbolic:'iab',ownTabs:['51','52'],closed:true,viewportReset:true,remainingTabs:0},servers:[{scope:'capture',port:52907,pid:32808,session:83418,exit:0},{scope:'homepage',port:52907,pid:28572,session:48865,exit:0,inertPlay:true}],completed:{strictTypes:41562,astro:18836,build:3476,allExit:0},renderer:{owners:0,canonicalOwner:false,retiredGeometries:0,retiredTextures:0,retiredOwnedMaterials:0,retiredSubscribers:0,retiredCallbacks:0},defaultGameDatabaseOpened:false,farm:'Slot released; coordinate before next browser/heavy work',stopDeadline:'2026-11-10T01:00:00Z (08:00 WIB)'};
const blockers=previous.blockers,qaResume={...previous.qaResume,revision:830,scope:'Actual HP6-04 frozen camera capture and cold read preserve full payload e708271 and gameplay af3d25c at tick27849/cash3581/command143. Revision830 observed after drained close. Original V4 backup hash carried from Z5-05, not reread here.'};
const proof={status:'PASS_HP6_04',at,verified:42,total:54,source,captureSource,sourceFingerprint:build.inputs.id,scope:'Original actual V5 renderer/assets, camera-only frozen QA checkpoint. SSR homepage preview media with responsive WebP and social derivative. No engine/save/gameplay/dependency changes; default player saves unopened.',checks:{types:'PASS strict noEmit/noUnused',astro:'PASS596 files,0 errors/warnings/hints',build:'PASS10 pages and production QA exclusion; existing large-chunk advisory only',lazyImageScope:'One route-switch observation (language-id-mobile) has the Zebra image pending below the viewport. Initial verifier incorrectly required every lazy image eagerly complete; corrected to visible images plus successful ID/EN samples at all3 sizes. All other samples load both media; no application defect implied.',logs:await Promise.all(['types','check','build'].map(k=>receipt('.qa/zebra-audit/hp6-04-'+k+'.log'))),unitTests:'No new unit tests for image/copy/CSS. Exact game/other-page output invariance, native camera/cold-state and actual media/navigation assertions cover this change.'},provenance:await receipt(provenancePath),media:provenance.transforms,build:{receipt:await receipt(buildPath),lab:build.lab.id,product:build.product.id,unchanged,addedImages},capture:{raw:await receipt(provenance.captureReceipt.path),observations:6,hash:qaResume.hash,gameplayHash:cold.state.gameplayHash,revision:830,tick:27849,cash:3581,actors:14,pausedCanonicalTicksAdvanced:0,nativeRafCallbacks:0,ownedRendererCycles:1,closedOwnedResources:true,poseScope:'Native overview and Zebra camera focus, low quality, actual saved poses. No native FPS/active-time/physical-device or grant-budget claim.',initialCaptureNote:'Oversized DOM viewport raster and an over-scrolled overview were rejected during framing. Accepted final native rasters1385x865 have all derivative crops inside visible canvas. Disabled Home at original overview was observed; no source defect or repeated click claimed.'},native:{rawReceipts:await Promise.all(rawPaths.map(receipt)),observations:29,homeObservations:27,inertPlayDestinations:2,viewports:[{width:1280,height:900},{width:780,height:460},{width:360,height:800}],cases:ui.map(r=>({label:r.label,at:r.at,url:r.url,lang:r.lang,viewport:r.viewport,hero:r.hero?{currentSrc:r.hero.currentSrc,rect:r.hero.rect,caption:r.hero.caption}:null,zebra:r.zebra?{currentSrc:r.zebra.currentSrc,rect:r.zebra.rect,caption:r.zebra.caption}:null,focus:r.focus,overflow:r.overflow,canvas:r.canvas,refs:r.refs})),logs:[],scope:'Actual ID/EN viewport layout/image selection and native Tab/Shift+Tab/Enter, fragment/CTA/language/back-forward. Inert Play proves navigation only; no game-start/language-handoff acceptance.'},screenshots,resources,blockers,noPushOrDeploy:true};
await writeFile(dir+'/verification.json',JSON.stringify(proof,null,2)+'\n');
await writeFile(dir+'/checkpoint.json',JSON.stringify({status:proof.status,at,verified:42,total:54,completedUnit:'HP6-04',pendingUnit:'HP6-02',candidateSource:source,build:{runId:build.runId,product:build.product.id},qaResume,responsiveResume:previous.responsiveResume,previousGameplayCheckpoint:'../z5-05/checkpoint.json',resources,blockers,open:previous.open,next:'HP6-05 truthful SEO/FAQ/internal links after resource coordination, only if a safe checkpoint fits before01:00UTC. Keep HP6-02 five-playable and Z2-06 publicV5/grant gates open. No push/deploy.',noPushOrDeploy:true},null,2)+'\n');
console.log(JSON.stringify({status:proof.status,verified:'42/54',source,captureSource,types:'PASS',astro:'PASS596',build:'PASS10',unchangedHtml:8,mediaBytes:provenance.transforms.map(t=>t.bytes),nativeHome:27,inertPlay:2,coldRevision:830,hash:qaResume.hash,resources:'CLOSED_SLOT_AVAILABLE',noPushOrDeploy:true}));
