import test from 'node:test';
import assert from 'node:assert/strict';
import {pagePrivacy} from '../src/site-policy.ts';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {parseSave,serializeSave} from '../src/game/persistence/save-v1.ts';
import {inspectCheckpoint} from '../src/game/persistence/checkpoint.ts';
import {createAutosave} from '../src/game/persistence/autosave.ts';

test('analytics eligibility never opts the game in; all external font loading is disabled',()=>{
 for(const configured of [true,false]){
  for(const path of ['/play','/play/']){const p=pagePrivacy(path,configured);assert.equal(p.analytics,false);assert.equal(p.remoteFonts,false);assert.equal(p.referrer,'no-referrer');}
  for(const path of ['/','/animals/','/wildlife/','/pets/','/learn/','/adventures/','/gear/','/about/','/playground/']){const p=pagePrivacy(path,configured);assert.equal(p.analytics,configured);assert.equal(p.remoteFonts,false);assert.equal(p.csp,null);}
 }
});
test('game CSP restricts active script, connection, font, form and object boundaries while retaining needed inline styles',()=>{
 const p=new Map(pagePrivacy('/play/',true).csp.split(';').map(x=>x.trim().split(/\s+/)).map(([key,...value])=>[key,value]));
 for(const key of ['default-src','script-src','connect-src','font-src'])assert.deepEqual(p.get(key),["'self'"]);
 assert.deepEqual(p.get('object-src'),["'none'"]);assert.deepEqual(p.get('form-action'),["'none'"]);
 assert.ok(p.get('style-src').includes("'unsafe-inline'"));assert.ok(!p.get('script-src').includes("'unsafe-inline'"));assert.ok(!pagePrivacy('/play',true).csp.includes('unsafe-eval'));
});
test('stored attacker-controlled markup, URLs and prototype keys are rejected as data without mutating the original or polluting prototypes',()=>{
 const valid=serializeSave(createInitialState()),mutations=[x=>x.__protoCanary='<img src=x onerror=alert(1)>',x=>x.preferences.remoteEndpoint='https://example.invalid/canary',x=>x.animals[0].speciesId='<script>canary</script>',x=>Object.defineProperty(x,'__proto__',{value:{myzooSecurityCanary:true},enumerable:true})];
 for(const mutate of mutations){const data=JSON.parse(valid);mutate(data);const encoded=JSON.stringify(data),result=parseSave(encoded);assert.equal(result.ok,false);assert.equal(JSON.stringify(data),encoded);assert.equal({}.myzooSecurityCanary,undefined);}
 const envelope=JSON.parse('{"format":2,"generation":"safe","revision":1,"writtenAt":1,"writer":"safe","payload":"x","__proto__":{"myzooSecurityCanary":true}}');assert.equal(inspectCheckpoint(envelope).problem,'invalid-envelope');assert.equal({}.myzooSecurityCanary,undefined);
});
test('raw backend exception secrets never enter observable autosave state on read or write failure',async()=>{
 for(const mode of ['read','write']){
  const canary='QA-PRIVATE-ERROR-CANARY-<script>do-not-render</script>',views=[];
  const backend={async read(){if(mode==='read')throw Error(canary);return null;},async commit(){throw Error(canary);},close(){}};
  const save=createAutosave(backend,{writer:'security-test',schedule:()=>1,cancel:()=>{},changed:v=>views.push(v)});
  await save.load();if(mode==='write'){assert.ok(save.startNew('en'));await save.flush();}
  assert.ok(['unavailable','error'].includes(save.view().phase));assert.ok(!JSON.stringify([save.inspect(),...views]).includes(canary));assert.ok(['unavailable','write'].includes(save.view().fault));save.dispose();await new Promise(r=>setImmediate(r));
 }
});
