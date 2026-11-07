import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{createSimulation}from'../src/game/core/simulation.ts';import{validateSaveV4}from'../src/game/persistence/save-v4.ts';
import{giraffeSegmentAllowed}from'../src/game/animals/giraffes/ground.ts';
test('a sampled route grazing a browse prop never publishes an invalid remaining segment while taking smaller steps',()=>{
 const s=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v4-golden.json',import.meta.url))).state,a=s.animals.find(a=>a.id==='giraffe-dira'),r=s.world.resources.find(r=>r.kind==='giraffe-browse'),h=s.world.habitats.find(h=>h.kind==='giraffe-plains'),x=r.cell.x+.5+.7599;
 const from={x,z:r.cell.z+.5-.51},to={x,z:r.cell.z+.5+.51};a.position=from;a.target=to;a.targetResourceId=null;a.currentBehavior='wander';Object.assign(a.motion,{phase:'wander',heading:0,ticksLeft:600,waypoints:[to],waypointIndex:0,partnerId:null,lastStep:{x:0,z:0}});
 assert.ok(giraffeSegmentAllowed(s.world,h,from,to));assert.ok(validateSaveV4(s).ok);const sim=createSimulation(s);sim.setSpeed(1);for(let i=0;i<100;i++){sim.advance(100);const checked=validateSaveV4(sim.snapshot());assert.ok(checked.ok,JSON.stringify({i,checked}));}sim.dispose();
});
