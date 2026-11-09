import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {sha256} from '../tooling.mjs';

const dir='docs/qa/zebra/z5-01',rawPath='.qa/zebra-audit/z5-01-browser-raw.json',buildPath='.qa/visual3d/h1-03-zebra-language1/source.json';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const receipt=async path=>{const bytes=await readFile(path);return{path,bytes:bytes.length,sha256:sha256(bytes)};};
const source='ca47b497bdd8157041932551d40a8fb5ed757302',fingerprint='21bfa2d8261d1a894dd64bd05437a72a355c0f8e51872f97e68132e62e4926fd';
const build=await read(buildPath),raw=await read(rawPath),dialogs=await read('.qa/zebra-audit/z5-01-help-dialogs.json');
assert.equal(build.source,source);assert.equal(build.inputs.id,fingerprint);assert.equal(build.productionExclusion.status,'PASS');
assert.equal(build.product.entries.filter(e=>e.path.endsWith('.html')).length,10);
for(const e of [...build.lab.entries,...build.product.entries])assert.equal(sha256(await readFile(e.path)),e.sha256,e.path);
for(const e of build.inputs.entries.filter(e=>/^(src|public|tests)\//.test(e.path)))assert.equal(sha256(await readFile(e.path)),e.sha256,e.path);
assert.equal(execFileSync('git',['diff','--name-only','143ef22','--','src/game','public','package.json','package-lock.json'],{encoding:'utf8'}).trim(),'','Gameplay, codecs, world, assets and dependencies unchanged');
const html=await readFile(build.product.entries.find(e=>e.path.endsWith('/play/index.html')).path,'utf8');
assert.match(html,/<html lang="id">/);assert.match(html,/<title>Main Zoo/);assert.match(html,/<meta name="description" content="Bangun habitat/);assert.match(html,/<link rel="canonical" href="https:\/\/myzootwin.com\/play\/">/);
const get=label=>{const r=raw.find(r=>r.label===label);assert.ok(r,label);return r;};
const same=(a,b)=>assert.equal(get(a).state.sha256,get(b).state.sha256);
assert.equal(raw.length,21);assert.equal(dialogs.length,4);
for(const r of raw){
  assert.equal(r.source,source);assert.equal(r.sourceFingerprint,fingerprint);assert.equal(r.runner,'internal-browser');assert.equal(r.physicalDevice,false);assert.equal(r.presentedFps,null);
  assert.equal(r.state.valid,true);assert.deepEqual(r.errors,[]);assert.deepEqual(r.failures,[]);assert.ok(r.maxOwners<=1);assert.match(r.database,/^myzootwin-zebra-build-[a-f\d-]{36}$/);
  assert.equal(r.frames.nativeDeliveries,0);assert.equal(r.frames.nativePending,0);assert.equal(r.frames.manualTime,0);assert.ok(r.frames.pending<=1);
  assert.equal(r.ui.lang,r.ui.rootLang);assert.ok(r.ui.documentWidth<=r.ui.width);
  for(const g of r.ui.guides){assert.equal(g.lang,r.ui.lang);assert.doesNotMatch(g.text,/undefined|\{\w+\}|1[.,]?700/);}
  for(const p of r.ui.panels){assert.doesNotMatch(p.text,/undefined|\{\w+\}|zebra-(?:zaki|zuri|mira|kira)/);if(r.ui.lang==='id')assert.doesNotMatch(p.text,/\bticks?\b|\btrot\b|menu Satwa/i);}
}
const baseline=get('main-cold-id-baseline');
assert.equal(baseline.state.sha256,'e70827160d1c40e22b0bf3b63cdc8a4ec3a327ea76b5ab19e3cc0489b62921ed');
for(const r of raw.filter(r=>r.label.startsWith('main-'))){
  assert.equal(r.state.tick,27849);assert.equal(r.state.cash,3581);assert.equal(r.state.gameplayHash,'af3d25c59917fd06c0238907999034cdc85f76993b22d7a3f4bf20862d69421d');
  assert.deepEqual(r.zebraActors,baseline.zebraActors);assert.deepEqual(r.zebraMissions,baseline.zebraMissions);assert.deepEqual(r.state.actors,baseline.state.actors);
  if(r.renderer?.session)assert.equal(r.renderer.session.commandRevision,143);
  assert.equal(r.ui.lang,r.state.preferences.locale);
}
same('main-refill-refused-id','main-cold-id-baseline');same('main-en-paused-before-cold','main-en-cold-exact');same('main-id-final-paused','main-id-cold-exact');same('main-cold-id-baseline','main-id-cold-exact');
assert.equal(get('main-en-cold-exact').state.sha256,'da7a5c17eda6ff1d497dbb503d46a1dfbd68e32e37e0f37726f9f27746550f89');
for(const label of ['main-guide-id-desktop','main-refill-refused-en-and-guide-retained'])assert.equal(get(label).ui.guides.find(g=>g.kind==='care').open,true);
assert.match(get('main-refill-refused-id').ui.panels.find(p=>p.name==='care').text,/Tindakan belum disimpan/);
assert.match(get('main-refill-refused-en-and-guide-retained').ui.panels.find(p=>p.name==='care').text,/not saved/i);
for(const [label,word]of [['main-missions-en','s'],['main-missions-id-landscape','dtk']]){
  const r=get(label),text=r.ui.panels.find(p=>p.name==='missions').text;assert.ok(text.includes('5 '+word+'/5 '+word));assert.ok(text.includes('10 '+word));
  for(const [quest,amount]of [['ZQ02',150],['ZQ04',200]])assert.ok(r.ui.actions.some(a=>a.label.includes(quest)&&a.label.includes(amount+' ZC')));
  for(const amount of [12,6,4])assert.ok(r.ui.actions.some(a=>a.label.includes(amount+' ZC')&&a.label.length>a.text.length));
}
for(const d of dialogs){
  assert.equal(d.source,source);assert.equal(d.dialogOpen,true);assert.equal(d.paused,'true');assert.equal(d.pauseReasons,'dialog');assert.equal(d.guideCount,1);
  assert.equal(d.documentLang,d.rootLang);assert.equal(d.guideLang,d.rootLang);assert.equal(d.rootLang,d.label.includes('-en-')?'en':'id');
  assert.ok(d.documentWidth<=d.width);assert.ok(d.scrollWidth<=d.clientWidth);assert.ok(d.rect.left>=0&&d.rect.right<=d.width&&d.rect.top>=0&&d.rect.bottom<=d.height);
  for(const amount of [15,90,75,65,12,6,4,2])assert.ok(d.guideText.includes(amount+' ZC'));
  assert.match(d.guideText,/ZQ01–ZQ04/);assert.match(d.guideText,/≥60/);assert.match(d.guideText,/≥70/);assert.doesNotMatch(d.guideText,/undefined|\{\w+\}|1[.,]?700/);
}
const empty=get('fresh-empty-id-default'),fresh=get('fresh-new-id-started'),freshCold=get('fresh-en-cold-exact');
assert.equal(empty.fixture.id,'fresh-empty-entry');assert.equal(empty.seedRevision,0);assert.equal(empty.save.phase,'empty');assert.equal(empty.save.hasSave,false);assert.equal(empty.owners,0);assert.equal(empty.ui.lang,'id');
assert.equal(empty.state.preferences.locale,'en','Unsaved observer baseline is not a stored language preference');
assert.equal(fresh.save.phase,'saved');assert.equal(fresh.save.hasSave,true);assert.equal(fresh.owners,1);assert.equal(fresh.state.preferences.locale,'id');
assert.equal(fresh.state.sha256,'541bad44d61631936e2e91b99210b0ee4efbef05504c2b258a4ddc0a5ef34bca');
for(const r of raw.filter(r=>r.label.startsWith('fresh-'))){assert.equal(r.state.tick,0);assert.equal(r.state.cash,1500);assert.equal(r.zebraActors.length,0);assert.equal(r.zebraAccess.exists,false);assert.equal(r.state.gameplayHash,'d5d09f2464e730d5ab40ff5430eec0a58bdb1e8be57100d7a596c57a7fc7c4aa');for(const g of r.ui.guides)assert.equal(g.hidden,true);}
same('fresh-en-paused','fresh-en-cold-exact');assert.equal(freshCold.state.preferences.locale,'en');assert.equal(freshCold.state.sha256,'82c1041af17036c98d49e4d353cf6e044a34d3f5b2de4143c6a48c313c985820');
let ownersDisposed=0;
for(const r of raw.filter(r=>r.label.includes('disposed'))){assert.equal(r.owners,0);assert.equal(r.frames.pending,0);for(const s of r.retired){ownersDisposed++;for(const key of ['geometries','textures','ownedMaterialsLive','cleanupErrors','simulationSubscribers'])assert.equal(s[key],0);assert.equal(s.simulationDisposed,true);}}
assert.equal(ownersDisposed,5);
const archives=[];
for(const [name,label]of [['main','main-id-cold-exact'],['fresh','fresh-en-cold-exact']]){
  const path='.qa/zebra-audit/z5-01-'+name+'-archive.json',a=await read(path);assert.equal(a.source,source);assert.equal(a.sourceFingerprint,fingerprint);assert.equal(a.owners,0);assert.deepEqual(a.errors,[]);assert.equal(a.durable.hash,get(label).state.sha256);assert.equal(a.durable.version,5);assert.equal(a.durable.backupSchema,4);
  assert.equal(a.durable.backupHash,name==='main'?'f68c6602412a4401fe4955d5ff357147e22d8f732d0ab5cd69fc1991df71eeaf':'f47b9467d20e0eb7edd26d02f2cd19b1494a64f0d03f6eb4d1e5d9231bd0827e');
  archives.push({database:a.database,durable:a.durable,receipt:await receipt(path),scope:name==='main'?'Original carried V4 archive unchanged':'Fresh game migration intermediate V4 archive; not the historical populated predecessor'});
}
const logs=[];
for(const [name,count]of [['z5-01-accepted-tests.log',29],['z5-01-mission-copy.log',1],['z5-01-types-final.log',null],['z5-01-check.log',null],['z5-01-build.log',null]]){
  const path='.qa/zebra-audit/'+name,s=await readFile(path,'utf8');logs.push(await receipt(path));if(count){assert.match(s,new RegExp('\\btests '+count+'\\r?$','m'));assert.match(s,new RegExp('\\bpass '+count+'\\r?$','m'));assert.match(s,/\bfail 0\r?$/m);}if(name.includes('types'))assert.equal(s.trim(),'');if(name.includes('check'))for(const value of ['570 files','0 errors','0 warnings','0 hints'])assert.ok(s.includes(value));
}
const screenshots=[];for(const name of ['guide-desktop-id.png','help-desktop-en.png','help-portrait-en.png','help-portrait-id.png','help-landscape-id.png'])screenshots.push({...await receipt(dir+'/'+name),review:'Original internal-browser capture visually reviewed; readable localized text, wrapping and vertical scroll; no image edits'});
const keys=['disposed','simulationDisposed','simulationPaused','simulationTick','simulationSpeed','simulationSubscribers','simulationDroppedWallMs','simulationDroppedSimMs','geometries','textures','ownedMaterialsLive','cleanupErrors','commandRevision','currency','economyGrants','economySpent','economyRefunds','ticketRevenue','ticketAdmissions'];
const session=s=>s&&Object.fromEntries(keys.filter(k=>k in s).map(k=>[k,s[k]]));
const records=raw.map(r=>({label:r.label,at:r.at,source:r.source,database:r.database,fixture:r.fixture,seedRevision:r.seedRevision,lifecycle:r.lifecycle,state:r.state,zebraActors:r.zebraActors,zebraMissions:r.zebraMissions,ui:r.ui,owners:r.owners,maxOwners:r.maxOwners,frames:{...r.frames,cpuFrame:undefined},save:r.save,session:session(r.renderer?.session),retired:r.retired.map(session),errors:r.errors,failures:r.failures}));
const resources={ownersDisposed,tabsClosed:[15,16,17,18,19,20],finalIabInventory:[],viewportReset:true,server:{session:5189,pid:16280,port:52907,exit:0},activeBuildOrTests:0,farm:'Browser and heavy resource slot available for mobile-pointer investigation; no Zebra build/soak/benchmark until explicit release'};
const open=['Z2-06 proposed1700ZC grant budget/exactly-once and public V5 adoption; production bootstrap still V4','Z5-02 onward: full touch/keyboard/build/select/camera/focus matrix','HP6 five-habitat homepage and remaining R7 regression/release gates','Native10x render/control latency, true host background and15-minute active soak unresolved; presented FPS unmeasured','Original Library materialization BLOCKED_WINDOWS_XATTR; complete official text reads retained historically','R7-08 explicit Zebra push/deploy authorization absent; no publish'];
const result={status:'PASS_Z5_01_BILINGUAL_PRESENTATION',at:'2026-11-09T16:23:47.000Z',verified:35,total:54,source,sourceFingerprint:fingerprint,scope:'ID default and complete Zebra action/mission/welfare/recovery/help copy. Native product entry with canonical V5 QA backend; no gameplay/engine/codec/save schema/mission rules or ledger changes.',tests:{uniquePassing:30,method:'29 final distinct copy/preference/navigation/old-species/fixture cases plus1 distinct existing quest-copy test. Earlier21-case pack had1 test-only false positive matching the template key {refund}; corrected assertion strips keys and final rendered content checks pass. Repeated packs not added to total.',types:'PASS strict noEmit/noUnused',astroCheck:'570 files;0 errors/warnings/hints',logs},build:{receipt:await receipt(buildPath),lab:build.lab.id,production:build.product.id,pages:10,productionExclusion:build.productionExclusion,warning:'Existing large chunk warning remains'},browser:{raw:await receipt(rawPath),records:21,staleInspector:0,runner:'internal-browser',physicalDevice:false,presentedFps:null,recordsData:records,helpDialogs:{receipt:await receipt('.qa/zebra-audit/z5-01-help-dialogs.json'),records:dialogs},archives,scope:'Original native UI handlers; deterministic manual renderer at0ms/native callbacks0. UI/layout and exact durable language proof only, no timing/performance/native device claim. QA preferenceStorage:null avoids owner localStorage; entry namespace persistence tested at source. Fresh empty backend has no save or grant before actual new-game click; its unsaved observer seed remains EN.'},screenshots,resources,open};
await writeFile(dir+'/verification.json',JSON.stringify(result,null,2)+'\n');
const resume=label=>{const r=get(label),a=archives.find(a=>a.database===r.database);return{database:r.database,tick:r.state.tick,cash:r.state.cash,command:r.renderer.session.commandRevision,revision:a.durable.revision,generation:r.save.generation,hash:r.state.sha256,preferences:r.state.preferences,zebraMissions:r.zebraMissions,zebraActors:r.zebraActors,backupHash:a.durable.backupHash};};
await writeFile(dir+'/checkpoint.json',JSON.stringify({status:'SAFE_FARM_SLOT_Z5_01_VERIFIED',at:result.at,verified:35,total:54,candidateSource:source,sourceFingerprint:fingerprint,qaResume:resume('main-id-cold-exact'),freshEntryResume:resume('fresh-en-cold-exact'),resources,next:'After explicit Farm slot release: Z5-02 mobile/desktop build/select/refill/camera and44px keyboard/touch UX.',open,noPushOrDeploy:true},null,2)+'\n');
console.log(JSON.stringify({status:result.status,verified:'35/54',source,uniqueTests:30,browserRecords:21,nativeHelpObservations:4,ownersDisposed,resources:'CLOSED_FARM_SLOT_AVAILABLE'}));
