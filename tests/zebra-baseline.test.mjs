import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBaselineManifest,readBaselineStates,projections,canonical} from '../scripts/qa/zebra/baseline-fixtures.mjs';
import {createSimulation} from '../src/game/core/simulation.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/zebra-v1-v4-baseline.json',import.meta.url),'utf8'));
test('Zebra baseline freezes all original V1–V4 bytes, actors, world, mission, admission, ledger, clock and preference projections',()=>{
 assert.deepEqual(createBaselineManifest(),frozen);
 assert.deepEqual([...new Set(frozen.fixtures.map(f=>f.schemaVersion))],[1,2,3,4]);
 const full=frozen.fixtures.find(f=>f.schemaVersion===4);assert.deepEqual(full.map,{width:24,height:26,origin:{x:6,z:5}});assert.equal(full.habitats.length,4);assert.equal(full.residentIds.length,10);
});
test('baseline cold reads/pause are exact and canonical clock partitions retain all old species and financial proofs',()=>{
 for(const {state,id} of readBaselineStates()){
  const before=canonical(state),a=createSimulation(state),b=createSimulation(structuredClone(state));
  try{assert.deepEqual(projections(a.snapshot()),projections(state),id);a.setPaused(true);a.advance(86400000);assert.equal(canonical(a.snapshot()),before,id+' paused');a.setPaused(false);a.setSpeed(1);b.setSpeed(10);for(let i=0;i<20;i++){a.advance(100);b.advance(10);}const fast=b.snapshot();fast.preferences.speed=1;assert.deepEqual(a.snapshot(),fast,id+' speed equivalence');assert.equal(canonical(state),before,id+' source untouched');}
  finally{a.dispose();b.dispose();assert.equal(a.inspect().subscribers,0);assert.equal(b.inspect().subscribers,0);}
 }
});
