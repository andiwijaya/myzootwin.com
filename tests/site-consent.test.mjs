import test from 'node:test';import assert from 'node:assert/strict';
import{createConsent,parseConsent,CONSENT_KEY}from'../src/privacy/consent.ts';
import{createGoogleAnalytics,analyticsConfiguration,validMeasurementId}from'../src/privacy/google.ts';
const tick=()=>new Promise(r=>setImmediate(r));
function fixture(raw=null,eligible=true){const data=new Map([['unrelated-save','PROTECTED'],...(raw===null?[]:[[CONSENT_KEY,raw]])]),calls={start:0,stop:[],reload:0,writes:[]};let failing=false;const storage={getItem:k=>data.get(k)??null,setItem(k,v){if(failing)throw Error('QA_PRIVATE_STORAGE_CANARY');calls.writes.push(k);data.set(k,v);}},runtime={start:async()=>{calls.start++;},stop:clear=>calls.stop.push(clear)};return{data,calls,storage,runtime,fail:v=>failing=v,make:extra=>createConsent({storage,eligible,analytics:runtime,reload:()=>calls.reload++,...extra})};}
const allowed=JSON.stringify({version:1,analytics:'allowed'}),denied=JSON.stringify({version:1,analytics:'denied'});
test('consent accepts only the bounded versioned affirmative/denied contract, never extra or attacker fields',()=>{
 assert.equal(parseConsent(allowed),'allowed');assert.equal(parseConsent(denied),'denied');
 for(const raw of [null,'{','{}','true','[]',JSON.stringify({version:2,analytics:'allowed'}),JSON.stringify({version:1,analytics:'allowed',email:'qa@example.invalid'}),'{"version":1,"analytics":"allowed","__proto__":{"enabled":true}}','x'.repeat(257)])assert.equal(parseConsent(raw),'unknown');
});
test('fresh/malformed choices never start analytics, rewrite stored data or affect unrelated progress',async()=>{
 for(const raw of [null,'damaged',JSON.stringify({version:9,analytics:'allowed'})]){const f=fixture(raw),c=f.make();await tick();assert.equal(f.calls.start,0);assert.deepEqual(f.calls.writes,[]);assert.equal(f.data.get(CONSENT_KEY)??null,raw);assert.equal(f.data.get('unrelated-save'),'PROTECTED');c.dispose();}
});
test('affirmative choice is verified before reloading; only a new document with valid stored opt-in starts once',async()=>{
 const f=fixture(),first=f.make();assert.ok(first.choose('allowed'));assert.ok(first.choose('allowed'));await tick();assert.equal(f.calls.reload,1);assert.equal(f.calls.start,0);assert.equal(f.data.get(CONSENT_KEY),allowed);first.dispose();
 const resumed=f.make();await tick();assert.equal(resumed.view().phase,'on');assert.equal(f.calls.start,1);resumed.choose('allowed');resumed.refresh();await tick();assert.equal(f.calls.start,1);assert.equal(f.data.get('unrelated-save'),'PROTECTED');resumed.dispose();
});
test('failed affirmative persistence stays off and exposes only generic error state',async()=>{
 const f=fixture();f.fail(true);const c=f.make();assert.equal(c.choose('allowed'),false);await tick();assert.equal(c.view().phase,'off');assert.equal(f.calls.start,0);assert.equal(f.calls.reload,0);assert.ok(!JSON.stringify(c.view()).includes('QA_PRIVATE'));c.dispose();
});
test('withdrawal stops a pending provider before persistence/reload and late success cannot reactivate it',async()=>{
 const f=fixture(allowed);let resolve;f.runtime.start=()=>{f.calls.start++;return new Promise(r=>resolve=r);};const c=f.make();await tick();assert.equal(f.calls.start,1);assert.ok(c.choose('denied'));assert.ok(c.choose('denied'));assert.deepEqual(f.calls.stop,[true]);assert.equal(f.calls.reload,1);assert.equal(f.data.get(CONSENT_KEY),denied);resolve();await tick();assert.equal(c.view().phase,'off');assert.equal(c.view().choice,'denied');c.dispose();
});
test('withdrawal storage failure still disables this visit and retry persists denial without touching the save',async()=>{
 const f=fixture(allowed),c=f.make();await tick();f.fail(true);assert.equal(c.choose('denied'),false);assert.equal(c.view().phase,'off');assert.equal(c.view().fault,'storage');assert.equal(f.calls.reload,0);assert.deepEqual(f.calls.stop,[true]);assert.equal(f.data.get(CONSENT_KEY),allowed);
 f.fail(false);assert.ok(c.choose('denied'));assert.equal(f.data.get(CONSENT_KEY),denied);assert.equal(f.calls.reload,1);assert.equal(f.data.get('unrelated-save'),'PROTECTED');c.dispose();
});
test('game/ineligible contexts never start or reload for an allowed journal preference',async()=>{
 const f=fixture(allowed,false),c=f.make();await tick();assert.equal(f.calls.start,0);assert.ok(c.choose('denied'));assert.ok(c.choose('allowed'));await tick();assert.equal(f.calls.start,0);assert.equal(f.calls.reload,0);c.dispose();
});
test('cross-tab refresh applies denial/invalid values and requires fresh document for a newly allowed choice',async()=>{
 const f=fixture(),c=f.make();f.data.set(CONSENT_KEY,allowed);c.refresh();assert.equal(f.calls.reload,1);assert.equal(f.calls.start,0);c.dispose();const active=f.make();await tick();assert.equal(f.calls.start,1);f.data.set(CONSENT_KEY,'bad');active.refresh();assert.equal(active.view().choice,'unknown');assert.equal(active.view().phase,'off');assert.equal(f.data.get(CONSENT_KEY),'bad');assert.equal(f.calls.reload,2);active.dispose();
});
test('dispose and reentrant choice handling cannot start a late provider or duplicate reloads',async()=>{
 const f=fixture(allowed),c=f.make();c.dispose();c.dispose();await tick();assert.equal(f.calls.start,0);assert.equal(f.calls.reload,0);
 const x=fixture();let handle;handle=x.make({changed:view=>{if(view.reloading)handle?.choose('allowed');}});handle.choose('allowed');assert.equal(x.calls.reload,1);handle.dispose();
});
test('provider configuration removes query/hash/referrer and disables automatic views and advertising signals',()=>{
 const config=analyticsConfiguration('https://myzootwin.com/learn/?qa-private=x#secret','Learn');assert.equal(config.page_location,'https://myzootwin.com/learn/');assert.equal(config.page_referrer,'');assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);assert.ok(!JSON.stringify(config).includes('secret'));assert.throws(()=>analyticsConfiguration('javascript:alert(1)','x'));
 for(const id of ['G-QACONSENT000','G-ABCDEFG123'])assert.ok(validMeasurementId(id));for(const id of ['', 'G-<script>','UA-1','G-x?private=y'])assert.ok(!validMeasurementId(id));
});
test('real adapter stays blocked for game/query/hash contexts before any script or Google command',async()=>{
 for(const url of ['https://myzootwin.com/play/','https://myzootwin.com/?qa=x','https://myzootwin.com/#journal-start']){let appends=0;const win={location:new URL(url)},doc={title:'QA',createElement(){throw Error('must not create');},head:{append(){appends++;}}};const runtime=createGoogleAnalytics(win,doc,'G-QACONSENT000');await assert.rejects(runtime.start());assert.equal(appends,0);assert.equal(win.dataLayer,undefined);assert.equal(win['ga-disable-G-QACONSENT000'],true);}
});
test('real adapter fake DOM proves basic consent command order and targeted cookie cleanup without network',async()=>{
 const scripts=[],expired=[];const win={location:new URL('https://myzootwin.com/learn/')};const doc={title:'QA Learn',get cookie(){return '_ga=QA; _ga_TEST=QA; sanctuary=PROTECTED';},set cookie(v){expired.push(v);},createElement(){return{dataset:{},remove(){this.removed=true;}};},head:{append(s){scripts.push(s);}}};
 const runtime=createGoogleAnalytics(win,doc,'G-QACONSENT000');assert.equal(scripts.length,0);assert.equal(win.dataLayer,undefined);const ready=runtime.start();assert.equal(scripts.length,1);assert.equal(scripts[0].referrerPolicy,'no-referrer');assert.ok(scripts[0].src.startsWith('https://www.googletagmanager.com/gtag/js?id='));
 const commands=win.dataLayer.map(x=>Array.from(x));assert.equal(commands[0][0],'consent');assert.equal(commands[0][1],'default');assert.equal(commands[0][2].analytics_storage,'denied');assert.equal(commands[1][2].analytics_storage,'granted');assert.equal(commands[1][2].ad_storage,'denied');assert.equal(commands[3][2].send_page_view,false);assert.equal(commands.filter(x=>x[0]==='event').length,1);scripts[0].onload();await ready;runtime.stop(true);assert.equal(win['ga-disable-G-QACONSENT000'],true);assert.ok(scripts[0].removed);assert.ok(expired.length>0);assert.ok(expired.every(x=>x.startsWith('_ga=')||x.startsWith('_ga_TEST=')));assert.ok(!expired.some(x=>x.includes('sanctuary')));await assert.rejects(runtime.start());assert.equal(scripts.length,1);
});
