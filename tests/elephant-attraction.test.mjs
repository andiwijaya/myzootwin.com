import test from 'node:test';
import assert from 'node:assert/strict';
import {twoHabitatSimulation,ELEPHANT_CONNECTOR} from './fixtures/elephant-two-habitats.mjs';
import {attractionView,ATTRACTION_RULES} from '../src/game/visitors/attraction.ts';
import {newExperience,observeHabitat,completeFeedback} from '../src/game/visitors/satisfaction.ts';
import {admitTicket,ticketView} from '../src/game/economy/tickets.ts';
import {compactFinance} from '../src/game/economy/journal.ts';
import {parseSaveV2,serializeSaveV2,validateSaveV2} from '../src/game/persistence/save-v2.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {presentVisitorFeedback} from '../src/game-entry/visitor-feedback.ts';
import {entryMessages} from '../src/game-entry/locale.ts';
const until=(sim,predicate,max=5000)=>{for(let i=0;i<max;i++){if(predicate(sim.snapshot()))return;sim.advance(100);}assert.fail('Actual visitor condition timed out');};
const valid=s=>assert.ok(validateSaveV2(s).ok,JSON.stringify(validateSaveV2(s)));

test('attraction averages reachable occupied habitats equally, preserves the bounded V1 curve, and is a read-only view',()=>{
 const sim=twoHabitatSimulation();sim.visitors(true);const state=sim.snapshot();sim.dispose();
 for(const [macaw,elephant]of[[100,0],[0,100],[20,60],[80,100],[0,0],[100,100]]){
  state.animals.forEach(a=>a.welfare=a.speciesId==='elephas-maximus'?elephant:macaw);const before=serializeSaveV2(state),view=attractionView(state),score=Math.round((macaw+elephant)/2);
  assert.equal(view.welfare,score);assert.equal(view.intervalTicks,Math.round(45+855*(1-score/100)**2));assert.equal(view.habitats.length,2);for(const h of view.habitats)assert.equal(h.welfare,h.kind==='elephant-grove'?elephant:macaw);assert.ok(view.intervalTicks>=45&&view.intervalTicks<=900);assert.equal(serializeSaveV2(state),before);
 }
 assert.equal(ATTRACTION_RULES.minIntervalTicks,45);assert.equal(ATTRACTION_RULES.maxIntervalTicks,900);
 // Species counts must not amplify a habitat's attraction weight.
 const extra=structuredClone(state.animals.find(a=>a.speciesId==='ara-ararauna'));extra.id='test-only-count-weight';extra.welfare=100;state.animals.filter(a=>a.speciesId==='ara-ararauna').forEach(a=>a.welfare=100);state.animals.filter(a=>a.speciesId==='elephas-maximus').forEach(a=>a.welfare=0);state.animals.push(extra);assert.equal(attractionView(state).welfare,50);
});

test('an unreachable grove or a real empty alternative cannot lower or inflate attraction; the remaining habitat stays playable',()=>{
 const sim=twoHabitatSimulation();sim.visitors(true);const state=sim.snapshot();sim.dispose();state.animals.forEach(a=>a.welfare=a.speciesId==='elephas-maximus'?0:100);
 const bridge=state.world.tiles.find(t=>t.cell.x===ELEPHANT_CONNECTOR[0].x&&t.cell.z===ELEPHANT_CONNECTOR[0].z);bridge.path=false;assert.equal(attractionView(state).welfare,100);assert.equal(attractionView(state).intervalTicks,45);assert.equal(attractionView(state).habitats,undefined);
 bridge.path=true;state.animals.filter(a=>a.speciesId==='ara-ararauna').forEach(a=>{a.habitatId=null;a.position=null;});assert.equal(attractionView(state).welfare,0);assert.equal(attractionView(state).habitats.length,1);assert.equal(attractionView(state).habitats[0].kind,'elephant-grove');assert.equal(attractionView(state).ready,true);
 state.visitorFlow.open=false;assert.equal(attractionView(state).reason,'closed');
});

test('each actual completed view contains exactly the welfare sampled in that habitat on those canonical ticks, never the attraction average',()=>{
 const sim=twoHabitatSimulation();sim.visitors(true);let previous=sim.snapshot(),completed=0;const sums=new Map(),habitats=new Set();
 for(let i=0;i<4000&&completed<4;i++){
  sim.advance(100);const s=sim.snapshot();for(const v of s.visitors){const old=previous.visitors.find(p=>p.id===v.id),samples=v.experience?.samples??0;if(samples>(old?.experience?.samples??0)){
   assert.equal(samples-(old?.experience?.samples??0),1);const residents=s.animals.filter(a=>a.habitatId===v.journey.habitatId&&a.position!==null),sum=(sums.get(v.id)??0)+Math.round(residents.reduce((n,a)=>n+a.welfare,0)/residents.length*100);sums.set(v.id,sum);assert.equal(v.experience.welfareHundredths,sum);
  }
  if(v.experience?.feedback&&!old?.experience?.feedback&&v.experience.feedback.samples===30){const f=v.experience.feedback;assert.equal(f.habitatId,v.journey.habitatId);assert.equal(f.welfareHundredths,sums.get(v.id));assert.equal(f.score,Math.round(sums.get(v.id)/3000));assert.equal(f.occupiedSamples,30);habitats.add(f.habitatId);completed++;}}
  previous=s;
 }
 assert.equal(completed,4);assert.equal(habitats.size,2);valid(sim.snapshot());sim.dispose();
});

test('asymmetric macaw and elephant observation is separate, immutable, and cannot credit another ticket when feedback completes or is retried',()=>{
 const sim=twoHabitatSimulation();sim.visitors(true);until(sim,s=>s.visitors.some(v=>v.entry?.status==='paid'));const state=sim.snapshot();sim.dispose();const actual=state.visitors.find(v=>v.entry?.status==='paid'),beforeCash=state.currency,beforeTickets=ticketView(state).revenue;
 for(const kind of ['macaw-aviary','elephant-grove']){
  const h=state.world.habitats.find(h=>h.kind===kind),v=structuredClone(actual);v.journey.habitatId=h.id;v.experience=newExperience();state.animals.forEach(a=>a.welfare=a.speciesId==='elephas-maximus'?20:100);
  for(let i=0;i<30;i++)observeHabitat(state,v);assert.ok(completeFeedback(state,v));assert.equal(v.experience.feedback.score,kind==='elephant-grove'?20:100);assert.equal(completeFeedback(state,v),false);assert.equal(v.experience.feedback.habitatId,h.id);
  state.animals.forEach(a=>a.welfare=0);observeHabitat(state,v);assert.equal(v.experience.feedback.score,kind==='elephant-grove'?20:100);
 }
 assert.equal(state.currency,beforeCash);assert.equal(ticketView(state).revenue,beforeTickets);
});

test('an actual paid grove admission remains one10ZC receipt across cold storage, forced compaction and repeated ticket callbacks',()=>{
 const sim=twoHabitatSimulation();sim.visitors(true);until(sim,s=>s.visitors.some(v=>v.entry?.status==='paid'&&s.world.habitats.some(h=>h.kind==='elephant-grove'&&h.id===v.journey?.habitatId)));let state=sim.snapshot();sim.dispose();const paid=state.visitors.find(v=>v.entry?.status==='paid'&&state.world.habitats.some(h=>h.kind==='elephant-grove'&&h.id===v.journey?.habitatId)),id=paid.id,cash=state.currency,view=ticketView(state),entries=state.ledger.length;
 assert.equal(state.admissions.filter(a=>a.visitorId===id).length,1);assert.equal(view.price,10);
 for(let pass=0;pass<3;pass++){state=parseSaveV2(serializeSaveV2(state)).value;if(pass===1)assert.ok(compactFinance(state,[],true));else if(pass===2){const before=serializeSaveV2(state);compactFinance(state,[],true);assert.equal(serializeSaveV2(state),before);}const v=state.visitors.find(v=>v.id===id);for(let n=0;n<10;n++)assert.deepEqual(admitTicket(state,v,v.position,v.position),{ok:true,duplicate:true,paid:true});assert.equal(state.currency,cash);assert.equal(ticketView(state).revenue,view.revenue);assert.equal(ticketView(state).admissions,view.admissions);valid(state);}
 assert.ok(state.ledger.length<=entries);const cold=createSimulation(state);cold.visitors(false);until(cold,s=>s.visitors.length===0);assert.equal(cold.visitorView().tickets.revenue,view.revenue);valid(cold.snapshot());cold.dispose();
});

test('cold partial grove observations keep their target, exact sample sums and final feedback while attraction updates deterministically',()=>{
 const sim=twoHabitatSimulation();sim.visitors(true);until(sim,s=>s.visitors.some(v=>v.experience?.samples>=7&&v.experience.samples<30&&s.world.habitats.some(h=>h.kind==='elephant-grove'&&h.id===v.journey?.habitatId)));const mid=sim.snapshot(),cold=createSimulation(parseSaveV2(serializeSaveV2(mid)).value);assert.deepEqual(cold.visitorView(),sim.visitorView());cold.setPaused(true);const frozen=serializeSaveV2(cold.snapshot());cold.advance(100000);assert.equal(serializeSaveV2(cold.snapshot()),frozen);cold.setPaused(false);cold.setSpeed(10);for(let i=0;i<1000;i++){sim.advance(100);cold.advance(10);}const a=sim.snapshot(),b=cold.snapshot();b.preferences.speed=1;assert.deepEqual(a,b);assert.ok(a.visitorFlow.feedback.recent.some(f=>f.samples===30));valid(a);sim.dispose();cold.dispose();
});

test('bilingual habitat feedback identifies the actual saved destination and score without raw IDs or mutating the immutable outcome',()=>{
 const sim=twoHabitatSimulation();sim.visitors(true);until(sim,s=>s.visitorFlow.feedback.recent.some(f=>f.samples===30));const state=sim.snapshot(),f=state.visitorFlow.feedback.recent.find(f=>f.samples===30),before=JSON.stringify(f);sim.dispose();for(const locale of ['en','id'])for(const kind of ['macaw-aviary','elephant-grove']){const text=presentVisitorFeedback(f,locale,kind);assert.ok(text.includes(entryMessages[locale][kind==='elephant-grove'?'visitorTargetElephant':'visitorTargetMacaw']));assert.ok(text.includes(String(f.score)));assert.ok(!text.includes(f.habitatId)&&!text.includes('{')&&!text.includes('undefined'));}assert.equal(JSON.stringify(f),before);
});
