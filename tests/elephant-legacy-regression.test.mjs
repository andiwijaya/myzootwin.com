import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runLegacyQuestTwin,runMixedLegacyTrace} from './fixtures/elephant-legacy-regression.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {validateSaveV2,serializeSaveV2,parseSaveV2,legacySimulationState} from '../src/game/persistence/save-v2.ts';
import {compactFinance,ledgerProof,totals} from '../src/game/economy/journal.ts';
const file=new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),bytes=readFileSync(file),frozen=JSON.parse(bytes),hash=b=>createHash('sha256').update(b).digest('hex');

test('actual Q01-Q04 first-run construction, care, admissions and original60ZCrewards stay exactly identical to V1 through two partial cold loads and1x10x',()=>{
 const source=structuredClone(frozen.entries.new.state),before=JSON.stringify(source),result=runLegacyQuestTwin(source);assert.deepEqual(result.claims.map(r=>r.id),['Q01','Q02','Q03','Q04']);assert.equal(result.coldCare,true);assert.equal(result.coldVisitor,true);assert.equal(result.coldLoads.length,2);assert.ok(result.coldLoads.some(p=>p.care)&&result.coldLoads.some(p=>p.visitor));assert.ok(result.comparisons>=50);assert.deepEqual(result.legacy.missions,result.expanded.missions);assert.equal(result.expanded.elephantGrove.grant,null);assert.equal(result.expanded.animals.length,2);assert.equal(result.expanded.missions.rewards.length,4);assert.equal(totals(result.legacy).amounts.reward,60);assert.equal(totals(result.expanded).amounts.reward,60);assert.equal(JSON.stringify(source),before);assert.equal(hash(readFileSync(file)),hash(bytes));
});

test('6000mixed-species ticks preserve every macaw FSM/position/need/counter and real original resource stock, one clock/RNG and claimed Qproof against a V1reference',()=>{
 const r=runMixedLegacyTrace(frozen.entries.q04Claimed.state,6000);assert.ok(r.comparisons>=6000);assert.equal(r.coldLoads,1);assert.deepEqual(r.legacy.animals,r.mixed.animals.filter(a=>a.speciesId==='ara-ararauna'));assert.deepEqual(r.mixed.missions,frozen.entries.q04Claimed.state.missions);assert.equal(r.mixed.tick,r.legacy.tick);assert.equal(r.mixed.randomState,r.legacy.randomState);assert.ok(r.admitted.length>=15);assert.equal(new Set(r.admitted.map(a=>a.id)).size,r.admitted.length);assert.ok(r.admitted.every(a=>a.amount===10));assert.equal(new Set(r.viewed.map(v=>v.habitat)).size,2);assert.deepEqual(r.mixed.elephantGrove.missions.completedIds,['EH01','EH02','EH03','EH04']);assert.ok(validateSaveV2(r.mixed).ok);assert.throws(()=>legacySimulationState(r.mixed),/multispecies runtime/);
});

test('old quests cannot be reactivated, reclaimed or replaced while real elephants and EHawards remain; paused/repeated claims never credit legacy cash',()=>{
 const r=runMixedLegacyTrace(frozen.entries.q04Claimed.state,1800),sim=createSimulation(r.mixed),before=serializeSaveV2(sim.snapshot());for(let n=0;n<20;n++)for(const id of ['Q01','Q02','Q03','Q04'])assert.equal(sim.claimMission({id,command:sim.commandRevision()}).reason,'claimed');assert.equal(serializeSaveV2(sim.snapshot()),before);sim.setPaused(true);for(const id of ['Q01','Q02','Q03','Q04'])assert.equal(sim.claimMission({id,command:sim.commandRevision()}).reason,'stale');assert.equal(serializeSaveV2(sim.snapshot()),before);sim.dispose();
 for(const mutate of [s=>s.missions.currentId='Q01',s=>{s.missions.currentId='Q04';s.missions.completedIds.pop();s.missions.rewards=s.missions.rewards.filter(r=>r.missionId!=='Q04');},s=>s.elephantGrove.missions.rewards[0].award='thriving-sanctuary']){const bad=structuredClone(r.mixed);mutate(bad);const encoded=JSON.stringify(bad);assert.equal(validateSaveV2(bad).ok,false);assert.equal(JSON.stringify(bad),encoded);}
});

test('archived mixed finance retains original20/40receipts,1400grant,150/200EHcoins and typed awards in separate displays with bounded one-ticket proof after cold',()=>{
 const r=runMixedLegacyTrace(frozen.entries.q04Claimed.state,1800),s=structuredClone(r.mixed);assert.ok(compactFinance(s,[],true));assert.ok(validateSaveV2(s).ok);const cold=parseSaveV2(serializeSaveV2(s));assert.ok(cold.ok);const sim=createSimulation(cold.value);assert.equal(sim.missionView().rewards,60);assert.equal(sim.elephantMissionView().rewards,350);assert.equal(sim.economyView().conservationGrant,1400);assert.equal(sim.economyView().missionRewards,410);for(const[id,coins]of [['mission-q01',20],['mission-q03',40],['elephant-expansion-grant-v1',1400],['mission-eh02',150],['mission-eh04',200]])assert.equal(ledgerProof(sim.snapshot(),id).amount,coins);assert.equal(sim.visitorView().tickets.revenue,sim.visitorView().tickets.admissions*10);assert.ok(sim.snapshot().ledger.length<128);assert.equal(sim.snapshot().elephantGrove.missions.rewards.length,4);assert.equal(sim.snapshot().missions.rewards.length,4);sim.dispose();
});
