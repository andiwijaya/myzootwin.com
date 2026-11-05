// Run once on the audited V1 baseline. Never regenerate fixtures to make a regression pass.
import {existsSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createInitialState} from '../../src/game/core/initial-state.ts';
import {createSimulation} from '../../src/game/core/simulation.ts';
import {serializeSave} from '../../src/game/persistence/save-v1.ts';
import {careMissionFixture} from '../../tests/browser/care-mission-dom-scenarios.mjs';
import {visitorMissionFixture} from '../../tests/browser/visitor-mission-dom-scenarios.mjs';
import {recoveryFixture} from '../../tests/browser/recovery-dom-scenarios.mjs';
const destination='tests/fixtures/elephant-legacy-v1.json';
if(existsSync(destination))throw Error('Frozen baseline already exists; refusing overwrite');
const saves={new:createInitialState(),q01:careMissionFixture('uncared'),midQ02:careMissionFixture('partial'),midVisitor:visitorMissionFixture('one-live'),longLedger:visitorMissionFixture('claimed-archive'),zeroCash:recoveryFixture('funded')};
// Deliberate, labelled synthetic zero-cash input, balanced by a matching QA maintenance debit.
saves.zeroCash.ledger.push({id:'qa-elephant-budget',operationId:'qa-elephant-budget',kind:'maintenance',amount:-1500,balanceAfter:0,tick:0,relatedId:null});saves.zeroCash.currency=0;
const sim=createSimulation(visitorMissionFixture('ready'));
assert.equal(sim.claimMission({id:'Q03',command:sim.commandRevision()}).ok,true);
sim.visitors(true);
for(let i=0;i<12000&&!sim.missionView().thriving.qualified;i++){
  for(const kind of ['food','water'])if(sim[kind+'View']().stock<=2)assert.equal(sim[kind]('refill',sim[kind+'View']().revision,sim.commandRevision()).ok,true);
  sim.advance(100);
}
assert.equal(sim.missionView().thriving.qualified,true);
saves.q04Ready=sim.snapshot();
assert.equal(sim.claimMission({id:'Q04',command:sim.commandRevision()}).ok,true);
saves.q04Claimed=sim.snapshot();sim.dispose();
saves.indonesian=structuredClone(saves.q04Claimed);saves.indonesian.preferences={speed:10,locale:'id',graphics:'low',muted:false,reducedMotion:true};
const hash=value=>createHash('sha256').update(value).digest('hex');
const entries=Object.fromEntries(Object.entries(saves).map(([id,state])=>{const text=serializeSave(state);return[id,{sha256:hash(text),state}];}));
writeFileSync(destination,JSON.stringify({baseline:'63ce52a9c535b47e44417213e88649355979abdd',provenance:'Synthetic engine-generated fixtures; zeroCash deliberately balanced QA input; no owner data',entries}));
console.log(JSON.stringify(Object.fromEntries(Object.entries(entries).map(([id,e])=>[id,{sha256:e.sha256,bytes:Buffer.byteLength(JSON.stringify(e.state)),tick:e.state.tick,currency:e.state.currency,missions:e.state.missions.completedIds}]))));
