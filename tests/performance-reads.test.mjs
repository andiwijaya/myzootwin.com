import test from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation} from '../src/game/core/simulation.ts';
import {thrivingMissionFixture} from './browser/thriving-mission-dom-scenarios.mjs';
import {serializeSave} from '../src/game/persistence/save-v1.ts';

test('renderer world copy cannot mutate authoritative occupancy, resources or later reads',()=>{
 const sim=createSimulation(thrivingMissionFixture('ready')),before=serializeSave(sim.snapshot()),copy=sim.worldSnapshot();
 assert.deepEqual(copy,sim.snapshot().world);
 copy.tiles[0].path=!copy.tiles[0].path;
 copy.habitats[0].cells[0].x=999;
 copy.resources.find(r=>r.kind==='food').portions[0]=999;
 assert.equal(serializeSave(sim.snapshot()),before);
 assert.deepEqual(sim.worldSnapshot(),JSON.parse(before).world);
 sim.dispose();
});
test('frequent renderer reads preserve exact seeded simulation, ledger and mission outcomes at both speeds',()=>{
 for(const speed of[1,10]){
  const state=thrivingMissionFixture('ready');state.preferences.speed=speed;
  const observed=createSimulation(state),control=createSimulation(state);
  for(let frame=0;frame<600;frame++){
   observed.frame(frame*16);control.frame(frame*16);
   observed.worldSnapshot();observed.inspect();observed.missionView();observed.economyView();
  }
  assert.equal(serializeSave(observed.snapshot()),serializeSave(control.snapshot()));
  observed.dispose();control.dispose();
 }
});
test('lightened inspector retains complete authoritative finance summaries after actual spending',()=>{
 const sim=createSimulation(thrivingMissionFixture('ready'));
 sim.food('refill',sim.foodView().revision,sim.commandRevision());
 sim.advance(250);
 const info=sim.inspect(),finance=sim.economyView();
 assert.equal(info.currency,finance.balance);
 assert.equal(info.maintenanceDue,finance.maintenanceDue);
 assert.equal(info.economyGrants,finance.grants);
 assert.equal(info.economySpent,finance.spent);
 assert.equal(info.economyRefunds,finance.refunds);
 sim.dispose();
});
