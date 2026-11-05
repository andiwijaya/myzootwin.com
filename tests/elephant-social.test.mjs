import test from 'node:test';
import assert from 'node:assert/strict';
import {elephantHome,elephantHerd} from './fixtures/elephant-home.mjs';
import {stepElephantCare} from '../src/game/animals/elephants/care-simulation.ts';
import {ELEPHANT_SOCIAL as S} from '../src/game/animals/elephants/care-rules.ts';
import {elephantBodyClearance,elephantBodyFrameAllowed} from '../src/game/animals/elephants/body-clearance.ts';
import {groundPointAllowed} from '../src/game/animals/elephants/ground.ts';
import {serializeSaveV2,parseSaveV2,validateSaveV2} from '../src/game/persistence/save-v2.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
const tick=s=>{s.tick++;s.gameTimeMs=s.tick*100;return stepElephantCare(s);};
export function socialPhase(phase){const s=elephantHome();for(let i=0;i<1800;i++){tick(s);if(elephantHerd(s).every(a=>a.motion.phase===phase))return s;}assert.fail('No actual social '+phase);}

test('actual fed and watered companions walk, face and greet once with bounded body/frame spacing and causal social welfare',()=>{
 const s=elephantHome(),cash=s.currency,phases=new Set(),events=[];let before=structuredClone(elephantHerd(s));for(let i=0;i<1600;i++){const result=tick(s),herd=elephantHerd(s);events.push(...result.socialized??[]);for(const a of herd){phases.add(a.motion.phase);const old=before.find(b=>b.id===a.id);assert.ok(Math.hypot(a.position.x-old.position.x,a.position.z-old.position.z)<=.04+1e-7);const habitat=s.world.habitats.find(h=>h.id===a.habitatId);assert.ok(groundPointAllowed(s.world,habitat,a.position));if(a.socialInteractions>old.socialInteractions){assert.equal(a.socialInteractions,old.socialInteractions+1);assert.equal(a.socialComfort,Math.min(100,old.socialComfort-S.decay+S.comfort));assert.equal(a.socialCooldownTicks,S.cooldownTicks);assert.ok(a.welfare>old.welfare);assert.equal(a.motion.partnerId,undefined);}}
 const asBody=a=>({position:a.position,heading:a.motion.heading});assert.ok(elephantBodyClearance(asBody(herd[0]),asBody(herd[1]))>=-1e-7);assert.ok(elephantBodyFrameAllowed(asBody(before[0]),asBody(herd[0]),asBody(before[1]),asBody(herd[1])));before=structuredClone(herd);if(i%80===0)assert.ok(validateSaveV2(s).ok,JSON.stringify(validateSaveV2(s)));if(events.length)break;}
 assert.ok(phases.has('approach-companion')&&phases.has('trunk-touch'));assert.equal(events.length,2);assert.equal(new Set(events.map(e=>e.eventId)).size,2);assert.ok(elephantHerd(s).every(a=>a.socialInteractions===1&&a.foodEaten>0&&a.waterDrunk>0));assert.equal(s.currency,cash);assert.ok(validateSaveV2(s).ok);
});

test('critical needs, absent companion, broken reciprocal link and expired route abort both actors without social credit',()=>{
 for(const phase of ['approach-companion','trunk-touch'])for(const fault of ['hunger','thirst','missing','reciprocal','timeout']){const s=socialPhase(phase),herd=elephantHerd(s),before=herd.map(a=>({id:a.id,count:a.socialInteractions,comfort:a.socialComfort}));if(fault==='hunger'||fault==='thirst')herd[0][fault]=80;else if(fault==='missing')s.animals=s.animals.filter(a=>a.id!==herd[1].id);else if(fault==='reciprocal')delete herd[1].motion.partnerId;else for(const a of herd)a.motion.ticksLeft=1;const result=tick(s);if(fault==='timeout'&&phase==='trunk-touch'){assert.equal(result.socialized.length,2);continue;}assert.equal(result.socialized,undefined);for(const a of elephantHerd(s)){assert.ok(!['approach-companion','trunk-touch'].includes(a.motion.phase));assert.equal(a.motion.partnerId,undefined);assert.equal(a.socialInteractions,before.find(x=>x.id===a.id).count);assert.ok(a.socialComfort<=before.find(x=>x.id===a.id).comfort);}}
});

test('old V2 is unchanged on decode; reciprocal partner/meeting/contact/duration metadata strictly validates and cold phase round trips exactly',()=>{
 const old=elephantHome(),oldBytes=serializeSaveV2(old);assert.equal(serializeSaveV2(parseSaveV2(oldBytes).value),oldBytes);for(const phase of ['approach-companion','trunk-touch']){const s=socialPhase(phase),exact=serializeSaveV2(s),loaded=parseSaveV2(exact);assert.ok(loaded.ok);assert.equal(serializeSaveV2(loaded.value),exact);for(const fault of ['self','missing','oneSided','wrongPhase','far','zero','future']){const bad=structuredClone(s),[a,b]=elephantHerd(bad);if(fault==='self')a.motion.partnerId=a.id;if(fault==='missing')a.motion.partnerId='missing';if(fault==='oneSided')delete b.motion.partnerId;if(fault==='wrongPhase')a.currentBehavior=a.motion.phase='idle';if(fault==='far')a.target.x+=2;if(fault==='zero')a.motion.ticksLeft=0;if(fault==='future')a.motion.futurePartner=1;assert.equal(validateSaveV2(bad).ok,false,phase+fault);}}
});

test('mid-approach and mid-touch cold, paused and 1x/10x continuation have exactly the same reciprocal events and final state',()=>{
 for(const phase of ['approach-companion','trunk-touch']){const source=socialPhase(phase),normal=createSimulation(source),fast=createSimulation(parseSaveV2(serializeSaveV2(source)).value),aEvents=[],bEvents=[];normal.subscribe(e=>{if(e.type==='elephant-socialized')aEvents.push(e);});fast.subscribe(e=>{if(e.type==='elephant-socialized')bEvents.push(e);});fast.setPaused(true);const frozen=serializeSaveV2(fast.snapshot());fast.advance(86400000);assert.equal(serializeSaveV2(fast.snapshot()),frozen);fast.setPaused(false);fast.setSpeed(10);for(let i=0;i<200;i++){normal.advance(100);fast.advance(10);}const a=normal.snapshot(),b=fast.snapshot();b.preferences.speed=1;assert.deepEqual(a,b);assert.deepEqual(aEvents,bEvents);assert.equal(aEvents.length,2);assert.ok(elephantHerd(a).every(a=>a.socialInteractions===1));normal.dispose();fast.dispose();}
});

test('cooldown and prior unmet basics prevent repeated or unearned greetings; array order and simulation seed are deterministic',()=>{
 const source=elephantHome(),a=structuredClone(source),b=structuredClone(source);b.animals.reverse();let completed;for(let i=0;i<1500;i++){const x=tick(a),y=tick(b);assert.deepEqual(x,y);if(x.socialized?.length){completed=a.tick;break;}}assert.ok(completed);assert.deepEqual(elephantHerd(a),elephantHerd(b).sort((a,b)=>a.id.localeCompare(b.id)));for(let i=0;i<120;i++){tick(a);assert.ok(elephantHerd(a).every(a=>a.socialInteractions===1));}assert.ok(elephantHerd(a).every(a=>a.socialCooldownTicks>0));const dry=elephantHome({filled:false});for(let i=0;i<1200;i++)tick(dry);assert.ok(elephantHerd(dry).every(a=>a.socialInteractions===0&&a.foodEaten===0&&a.waterDrunk===0));
});

test('social subscribers observe both completed actors and the complete canonical visitor/economy tick',()=>{
 const sim=createSimulation(socialPhase('trunk-touch')),observed=[];sim.subscribe(e=>{if(e.type==='elephant-socialized')observed.push({e,state:sim.snapshot()});});for(let i=0;i<30&&!observed.length;i++)sim.advance(100);assert.equal(observed.length,2);for(const {state,e}of observed){assert.deepEqual(state,sim.snapshot());assert.ok(elephantHerd(state).every(a=>a.socialInteractions===1));assert.equal(e.socialCount,1);assert.ok(validateSaveV2(state).ok);}sim.dispose();
});


test('all six paid care props coexist with an actual paired greeting and continued real care, using paid refills rather than resets',()=>{
 const sim=createSimulation(elephantHome({pond:true,enrichment:true}));sim.visitors(false);const events=[];sim.subscribe(e=>{if(e.type==='elephant-socialized')events.push(e);});let last;
 for(let i=0;i<4000;i++){if(i%500===0)for(const r of sim.elephantCareView().feeders.concat(sim.elephantCareView().water?[sim.elephantCareView().water]:[]))if(r.canRefill)assert.ok(sim.refillElephantCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok);sim.advance(100);last=sim.elephantSnapshot().animals;assert.ok(elephantBodyClearance({position:last[0].position,heading:last[0].motion.heading},{position:last[1].position,heading:last[1].motion.heading})>=-1e-7);if(events.length>=2)break;}
 assert.equal(events.length,2,'Six props must not deadlock the greeting');assert.ok(last.every(a=>a.restedTicks>0&&a.enrichedTicks>0&&a.baths>0&&a.socialInteractions>0));assert.ok(validateSaveV2(sim.snapshot()).ok);assert.ok(sim.inspect().currency>0);sim.dispose();
});
