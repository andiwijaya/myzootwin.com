import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {preparedZebraCare} from './helpers/zebra-care-play.mjs';
import {createSimulation} from '../src/game/core/simulation.ts';
import {evaluateZebraMissions,zebraMissionView,prepareZebraMission} from '../src/game/missions/zebra-missions.ts';
import {zebraAccessView} from '../src/game/world/zebra-access.ts';
import {serializeSaveV5,parseSaveV5,validateSaveV5} from '../src/game/persistence/save-v5.ts';
import {ledgerProof,compactFinance,admissionProofs,totals} from '../src/game/economy/journal.ts';
import {readBaselineStates} from '../scripts/qa/zebra/baseline-fixtures.mjs';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {createZebraIndexedDbBackend} from '../src/game/persistence/zebra-backend.ts';
import {SAVE_STORE,ELEPHANT_V1_BACKUP,LION_V2_BACKUP,GIRAFFE_V3_BACKUP,ZEBRA_V4_BACKUP} from '../src/game/persistence/durable-backend.ts';
import {zebraMissionCopy} from '../src/game-entry/zebra-mission-panel.ts';
const valid=s=>assert.equal(validateSaveV5(s).ok,true,JSON.stringify(validateSaveV5(s)));
const oldProofs=s=>Object.fromEntries(['missions','elephantGrove','lionSavanna','giraffePlains'].map(k=>{const a=k==='missions'?s[k]:s[k].missions;return[k,{completed:a.completedIds,rewards:a.rewards,grant:s[k].grant,grantReceipt:s[k].grant?ledgerProof(s,s[k].grant.ledgerEntryId):null,receipts:a.rewards.flatMap(r=>r.ledgerEntryId?[ledgerProof(s,r.ledgerEntryId)]:[])}];}));
function connect(sim){for(let i=0;i<5&&!zebraAccessView(sim.snapshot()).connected;i++){const a=zebraAccessView(sim.snapshot());assert.equal(sim.buildPath(a.path.cell,sim.commandRevision()).ok,true);}assert.equal(zebraAccessView(sim.snapshot()).connected,true);}
function claim(sim,id){const before=sim.snapshot(),q={id,command:sim.commandRevision()},p=sim.prepareZebraMission(q);assert.equal(p.ok,true,JSON.stringify(p));assert.deepEqual(sim.snapshot(),before);assert.equal(sim.acceptCommittedZebraMission(p.state,q),true);const after=sim.snapshot();assert.equal(sim.acceptCommittedZebraMission(p.state,q),false);assert.deepEqual(sim.snapshot(),after);assert.deepEqual(oldProofs(after),oldProofs(before));valid(after);return after;}
let cached;
function played(){
 if(cached)return structuredClone(cached);
 const sim=preparedZebraCare(),before=sim.snapshot(),events=[],claims=[];connect(sim);sim.subscribe(e=>{if(e.type.startsWith('zebra-')||e.type==='visitor-viewed')events.push(e);});
 assert.equal(sim.zebraMissionView().rows[0].status,'ready');claim(sim,'ZQ01');sim.visitors(true);
 let q2,q4,ticks=0;
 for(;ticks<22000&&sim.zebraMissionView().completed<4;ticks++){
  sim.advance(100);
  if(ticks%100===0){for(const r of sim.zebraCareView().resources)if(r.refillPrice&&r.stock===0){const q={id:r.id,revision:r.revision,command:sim.commandRevision()},p=sim.prepareZebraRefill(q);assert.equal(p.ok,true,JSON.stringify(p));assert.equal(sim.acceptCommittedZebraCare(p.state,q),true);}valid(sim.snapshot());}
  const v=sim.zebraMissionView();if(!q2&&v.currentId==='ZQ02'&&v.objectives.fedIds.length===4&&v.objectives.wateredIds.length===4)q2=sim.snapshot();if(!q4&&v.currentId==='ZQ04')q4=sim.snapshot();
  for(const row of v.rows)if(row.status==='ready'){const state=claim(sim,row.id);claims.push({id:row.id,tick:state.tick,cash:state.currency,command:state.economy.nextCommand,reward:state.zebraGrasslands.missions.rewards.at(-1)});}
 }
 const end=sim.snapshot();assert.equal(sim.zebraMissionView().completed,4,JSON.stringify(sim.zebraMissionView()));valid(end);
 assert.ok(q2&&q4);assert.deepEqual(oldProofs(end),oldProofs(before));
 assert.ok(events.some(e=>e.type==='zebra-groomed'));assert.ok(events.some(e=>e.type==='zebra-rested'||e.type==='zebra-enriched'));
 assert.equal(end.zebraGrasslands.missions.objectives.viewedVisitorIds.length,3);
 for(const id of end.zebraGrasslands.missions.objectives.viewedVisitorIds){const a=admissionProofs(end).find(a=>a.visitorId===id);assert.ok(a&&a.entry.habitatId==='habitat-zebra-codec');assert.equal(ledgerProof(end,a.ledgerEntryId).amount,10);assert.ok(events.some(e=>e.type==='visitor-viewed'&&e.visitorId===id&&e.habitatId==='habitat-zebra-codec'));}
 sim.dispose();cached={before,end,q2,q4,ticks,events,claims};return structuredClone(cached);
}
test('four ordered Zebra quests are earned by actual meals/drinks/groom/rest and three paid completed Zebra views; claims preserve all old reward proofs',t=>{
 const p=played(),m=p.end.zebraGrasslands.missions;assert.deepEqual(m.completedIds,['ZQ01','ZQ02','ZQ03','ZQ04']);assert.equal(m.currentId,null);assert.equal(m.objectives.comfortableTicks,50);assert.equal(m.objectives.thrivingTicks,100);assert.ok(m.objectives.groomings>0);assert.equal(m.objectives.fedIds.length,4);assert.equal(m.objectives.wateredIds.length,4);
 assert.deepEqual(m.rewards.map(r=>r.award),['grassland-founder',null,'striped-meadow','zebra-keeper']);for(const[id,amount]of[['mission-zq02',150],['mission-zq04',200]])assert.equal(ledgerProof(p.end,id).amount,amount);
 t.diagnostic(JSON.stringify({canonicalTicks:p.ticks,claims:[{id:'ZQ01',reward:m.rewards[0]},...p.claims],objectives:m.objectives,sourceEvents:{grazed:p.events.filter(e=>e.type==='zebra-grazed').length,drank:p.events.filter(e=>e.type==='zebra-drank').length,groomed:p.events.filter(e=>e.type==='zebra-groomed').length,rested:p.events.filter(e=>e.type==='zebra-rested').length,enriched:p.events.filter(e=>e.type==='zebra-enriched').length},viewed:m.objectives.viewedVisitorIds.map(id=>({id,admission:admissionProofs(p.end).find(a=>a.visitorId===id)}))}));
});
test('continuous windows reset below exact thresholds; ordinary event evaluation cannot add ticks and claimed progress stays latched',()=>{
 const p=played(),s=structuredClone(p.q2);s.zebraGrasslands.missions.objectives.comfortableTicks=0;for(const a of s.animals.filter(a=>a.speciesId==='equus-quagga'))a.welfare=60;
 for(let i=0;i<49;i++)evaluateZebraMissions(s,true);assert.equal(s.zebraGrasslands.missions.objectives.comfortableTicks,49);for(let i=0;i<10;i++)evaluateZebraMissions(s);assert.equal(s.zebraGrasslands.missions.objectives.comfortableTicks,49);
 const a=s.animals.find(a=>a.speciesId==='equus-quagga');a.welfare=59;evaluateZebraMissions(s,true);assert.equal(s.zebraGrasslands.missions.objectives.comfortableTicks,0);a.welfare=60;for(let i=0;i<50;i++)evaluateZebraMissions(s,true);assert.equal(s.zebraGrasslands.missions.objectives.comfortableTicks,50);
 const q=structuredClone(p.q4);q.zebraGrasslands.missions.objectives.thrivingTicks=0;for(const a of q.animals.filter(a=>a.speciesId==='equus-quagga'))a.welfare=70;for(let i=0;i<99;i++)evaluateZebraMissions(q,true);assert.equal(q.zebraGrasslands.missions.objectives.thrivingTicks,99);const b=q.animals.find(a=>a.speciesId==='equus-quagga');b.welfare=69;evaluateZebraMissions(q,true);assert.equal(q.zebraGrasslands.missions.objectives.thrivingTicks,0);
 const end=structuredClone(p.end);for(const a of end.animals.filter(a=>a.speciesId==='equus-quagga'))a.welfare=0;evaluateZebraMissions(end,true);assert.equal(end.zebraGrasslands.missions.objectives.thrivingTicks,100);assert.equal(end.zebraGrasslands.missions.objectives.comfortableTicks,50);
});
test('read-only views and pure incomplete/stale/out-of-order quotes cannot fabricate rewards, unearned cash, clocks or source mutation',()=>{
 const sim=preparedZebraCare(),s=sim.snapshot();assert.equal(sim.prepareZebraMission({id:'ZQ01',command:sim.commandRevision()}).reason,'incomplete');connect(sim);const ready=sim.snapshot(),q={id:'ZQ01',command:sim.commandRevision()},p=sim.prepareZebraMission(q);assert.equal(p.ok,true);assert.deepEqual(sim.snapshot(),ready);
 for(const request of[{...q,id:'ZQ02'},{...q,id:'GQ01'},{...q,command:q.command-1},{...q,command:NaN}])assert.equal(sim.prepareZebraMission(request).ok,false);
 const forged=structuredClone(p.state);forged.currency++;assert.equal(sim.acceptCommittedZebraMission(forged,q),false);assert.deepEqual(sim.snapshot(),ready);
 sim.setPaused(true);assert.equal(sim.prepareZebraMission(q).ok,false);sim.advance(86400000);assert.deepEqual(sim.snapshot(),ready);sim.setPaused(false);assert.equal(sim.acceptCommittedZebraMission(p.state,q),true);
 const after=sim.snapshot();for(let i=0;i<10;i++)zebraMissionView(after);assert.deepEqual(after,sim.snapshot());assert.equal(prepareZebraMission(after,{id:'ZQ01',command:after.economy.nextCommand}).reason,'claimed');sim.dispose();assert.equal(sim.acceptCommittedZebraMission(p.state,q),false);assert.deepEqual(s.zebraGrasslands.missions.completedIds,[]);
});
test('cold final state, pinned viewer receipts and historical connection survive compaction and real path removal/Undo without revoking earned achievements',()=>{
 const s=played().end,original=structuredClone(s.zebraGrasslands.missions);assert.equal(compactFinance(s,[],true),true);valid(s);for(const id of original.objectives.viewedVisitorIds)assert.ok(admissionProofs(s).some(a=>a.visitorId===id));const sim=createSimulation(parseSaveV5(serializeSaveV5(s)).value);assert.deepEqual(sim.snapshot(),s);sim.setPaused(true);sim.advance(86400000);assert.deepEqual(sim.snapshot(),s);sim.setPaused(false);
 sim.visitors(false);for(let i=0;i<800&&sim.visitorView().active;i++)sim.advance(100);assert.equal(sim.visitorView().active,0);const earned=sim.snapshot().zebraGrasslands.missions;assert.deepEqual(earned.rewards,original.rewards);const q=sim.quoteRemoval({kind:'path',cell:{x:14,z:11}});assert.equal(q.ok,true,JSON.stringify(q));assert.equal(sim.remove(q.quote,'edit-'+'a'.repeat(32)).ok,true);assert.equal(zebraAccessView(sim.snapshot()).connected,false);assert.deepEqual(sim.snapshot().zebraGrasslands.missions,earned);valid(sim.snapshot());assert.equal(sim.undo('edit-'+'b'.repeat(32),sim.commandRevision()).ok,true);valid(sim.snapshot());assert.deepEqual(sim.snapshot().zebraGrasslands.missions,earned);sim.dispose();
});
test('cosmetic, unpaid, interrupted, other-habitat and partial-view feedback cannot count as Zebra viewers; duplicate true feedback counts once',()=>{
 const s=played().end;s.zebraGrasslands.missions.objectives.viewedVisitorIds=[];const trueId=played().end.zebraGrasslands.missions.objectives.viewedVisitorIds[0],admission=admissionProofs(s).find(a=>a.visitorId===trueId),base={visitorId:trueId,habitatId:admission.entry.habitatId,tick:s.tick,outcome:'comfortable',reason:'none',score:80,observedWelfare:80,samples:30,occupiedSamples:30,welfareHundredths:240000};
 s.visitors=[];s.visitorFlow.feedback.recent=[{...base,visitorId:'cosmetic'},{...base,samples:29},{...base,occupiedSamples:29},{...base,outcome:'interrupted'},{...base,habitatId:'habitat-care-mission'}];evaluateZebraMissions(s);assert.equal(s.zebraGrasslands.missions.objectives.viewedVisitorIds.length,0);s.visitorFlow.feedback.recent=[base,base];evaluateZebraMissions(s);assert.deepEqual(s.zebraGrasslands.missions.objectives.viewedVisitorIds,[trueId]);
});
const request=q=>new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);}),done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
test('IDB emulation: mission race has one CAS winner, quota leaves exact primary/backup and failed owner; retry and cold load award once',async()=>{
 const f=new IDBFactory(),name='zebra-mission-isolated-qa',v4=JSON.parse(readFileSync(new URL('fixtures/giraffe-v4-golden.json',import.meta.url),'utf8')).state,open=f.open(name,4);open.onupgradeneeded=()=>open.result.createObjectStore(SAVE_STORE);const db=await request(open),tx=db.transaction(SAVE_STORE,'readwrite'),original={format:2,generation:'zebra-mission-qa',revision:1,writtenAt:1,writer:'original-v4',payload:JSON.stringify(v4)};tx.objectStore(SAVE_STORE).put(original,'primary');for(const[v,key]of[[1,ELEPHANT_V1_BACKUP],[2,LION_V2_BACKUP],[3,GIRAFFE_V3_BACKUP]])tx.objectStore(SAVE_STORE).put({...original,payload:JSON.stringify(readBaselineStates().find(s=>s.state.schemaVersion===v).state)},key);await done(tx);db.close();
 const backend=createZebraIndexedDbBackend(f,name);await backend.read();const sim=preparedZebraCare();connect(sim);const base=sim.snapshot();await backend.commit(1,serializeSaveV5(base),'setup',2);const other=createZebraIndexedDbBackend(f,name);await other.read();const q={id:'ZQ01',command:sim.commandRevision()},p=sim.prepareZebraMission(q);assert.equal(p.ok,true);
 const result=await Promise.allSettled([backend.commit(2,serializeSaveV5(p.state),'claim-a',3),other.commit(2,serializeSaveV5(p.state),'claim-b',3)]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.deepEqual(sim.snapshot(),base);assert.equal(sim.acceptCommittedZebraMission(p.state,q),true);assert.equal(sim.acceptCommittedZebraMission(p.state,q),false);backend.close();other.close();
 const read=async key=>{const db=await request(f.open(name)),tx=db.transaction(SAVE_STORE),value=await request(tx.objectStore(SAVE_STORE).get(key));await done(tx);db.close();return value;};assert.deepEqual(await read(ZEBRA_V4_BACKUP),original);
 const accepted=await read('primary'),next=createZebraIndexedDbBackend(f,name);await next.read();const realPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(key==='primary')throw new DOMException('QA quota','QuotaExceededError');return realPut.call(this,value,key);};
 try{await assert.rejects(next.commit(accepted.revision,serializeSaveV5(played().end),'quota',4));}finally{IDBObjectStore.prototype.put=realPut;}assert.deepEqual(await read('primary'),accepted);assert.deepEqual(await read(ZEBRA_V4_BACKUP),original);assert.equal(sim.zebraMissionView().completed,1);
 const saved=await next.commit(accepted.revision,serializeSaveV5(played().end),'retry',5);next.close();const cold=createSimulation(parseSaveV5(saved.payload).value);assert.equal(cold.zebraMissionView().completed,4);assert.equal(totals(cold.snapshot()).amounts.reward,totals(played().end).amounts.reward);assert.deepEqual(cold.snapshot().zebraGrasslands,played().end.zebraGrasslands);assert.equal(cold.prepareZebraMission({id:'ZQ04',command:cold.commandRevision()}).reason,'claimed');cold.dispose();sim.dispose();
});
test('ID/EN quest copy has all four names, concrete requirements and honest storage status; namespaces and awards remain distinct',()=>{
 for(const locale of['id','en']){const c=zebraMissionCopy[locale];assert.equal(c.names.length,4);assert.equal(c.hints.length,4);assert.equal(c.awards.length,3);assert.ok(c.storage.length>50);assert.ok(!/undefined|\{\w+\}/.test(JSON.stringify(c)));}
 const sim=preparedZebraCare(),before=sim.snapshot();assert.deepEqual(sim.zebraMissionView().rows.map(r=>r.id),['ZQ01','ZQ02','ZQ03','ZQ04']);assert.deepEqual(sim.snapshot(),before);sim.dispose();
});
test('claimed connection proof is mandatory, bounded, orthogonal, outside the fence and exclusive to ZQ01; reward/claim IDs and amounts cannot be forged',()=>{
 for(const mutate of[s=>delete s.zebraGrasslands.missions.rewards[0].connection,s=>s.zebraGrasslands.missions.rewards[0].connection.route.pop(),s=>s.zebraGrasslands.missions.rewards[0].connection.route[1]={x:20,z:10},s=>s.zebraGrasslands.missions.rewards[0].connection.viewingCell={x:14,z:12},s=>s.zebraGrasslands.missions.rewards[1].connection=s.zebraGrasslands.missions.rewards[0].connection,s=>s.ledger.find(e=>e.id==='mission-zq04').amount++,s=>s.zebraGrasslands.missions.rewards[3].ledgerEntryId='mission-gq04']){const s=played().end;mutate(s);assert.equal(validateSaveV5(s).ok,false,mutate.toString());}
});
