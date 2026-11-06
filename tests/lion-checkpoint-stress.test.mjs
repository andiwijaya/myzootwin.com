import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {lionHome} from './fixtures/lion-home.mjs';
import {createSimulation} from '../src/game/core/simulation.ts';
import {validateSaveV3} from '../src/game/persistence/save-v3.ts';
import {missingConnection} from '../src/game/economy/elephant-recovery.ts';
import {serviceRealSupplies} from './fixtures/elephant-economy.ts';
for(const seed of [1,42,12345])test('every actual tick remains checkpoint-valid across three occupied habitats, paid viewers and all lion phases; seed '+seed,()=>{
 const source=lionHome({pride:true,enrichment:true}),initial=source.snapshot();source.dispose();initial.randomState=seed;const sim=createSimulation(initial),h=initial.world.habitats.find(h=>h.kind==='lion-savanna');
 for(let i=0;i<20;i++){const p=missingConnection(sim.snapshot(),h.id);if(!p)break;assert.ok(sim.buildPath(p.cell,sim.commandRevision()).ok);}sim.visitors(true);
 for(let i=0;i<5000;i++){
  if(i%50===0){serviceRealSupplies(sim);for(const r of sim.lionCareView().resources)if(r.refillPrice>0&&r.stock<r.capacity/2&&sim.inspect().currency>=r.refillPrice)sim.refillLionCare({command:sim.commandRevision(),id:r.id,revision:r.revision});}
  sim.advance(100);const state=sim.snapshot(),check=validateSaveV3(state);if(!check.ok){mkdirSync('.qa',{recursive:true});writeFileSync('.qa/lion-first-invalid-'+seed+'.json',JSON.stringify({step:i,check,state},null,2));assert.fail(JSON.stringify({step:i,check}));}
  const ready=sim.lionMissionView().rows.find(r=>r.status==='ready');if(ready){const quote={id:ready.id,command:sim.commandRevision()},candidate=sim.prepareLionMission(quote);assert.ok(candidate.ok,JSON.stringify(candidate));assert.ok(sim.acceptCommittedLionMission(candidate.state,quote));}
 }
 sim.dispose();
});
