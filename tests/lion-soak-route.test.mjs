import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createSimulation} from '../src/game/core/simulation.ts';import {validateSaveV4,serializeSaveV4,parseSaveV4} from '../src/game/persistence/save-v4.ts';
import {lionMotionSegmentAllowed,lionSegmentAllowed,lionGroundRoute} from '../src/game/animals/lions/ground.ts';
const before=JSON.parse(readFileSync(new URL('./fixtures/lion-soak-route-before.json',import.meta.url))).state;
test('native soak21253 ramp-side route remains loadable but future movement replans without teleport, invalid checkpoint or erased rewards',()=>{
 assert.ok(validateSaveV4(before).ok);const lion=before.animals.find(a=>a.id==='lion-sena'),home=before.world.habitats.find(h=>h.kind==='lion-savanna'),goal=lion.motion.waypoints[lion.motion.waypointIndex];
 assert.equal(lionSegmentAllowed(before.world,home,lion.position,goal),true);assert.equal(lionMotionSegmentAllowed(before.world,home,lion.position,goal),false);
 const route=lionGroundRoute(before.world,home,lion.position,goal);assert.ok(route?.length);let p=lion.position;for(const q of route){assert.ok(lionMotionSegmentAllowed(before.world,home,p,q));p=q;}
 const sim=createSimulation(before);sim.setSpeed(1);for(let i=0;i<100;i++){const old=sim.snapshot();sim.advance(100);const s=sim.snapshot();const checked=validateSaveV4(s);assert.ok(checked.ok,JSON.stringify(checked));for(const a of s.animals.filter(a=>a.speciesId==='panthera-leo')){const prev=old.animals.find(x=>x.id===a.id);assert.ok(Math.hypot(a.position.x-prev.position.x,a.position.z-prev.position.z)<=.055000001);}}
 const after=sim.snapshot();assert.deepEqual(after.giraffePlains.missions.completedIds,before.giraffePlains.missions.completedIds);assert.deepEqual(after.lionSavanna.missions.rewards,before.lionSavanna.missions.rewards);assert.ok(parseSaveV4(serializeSaveV4(after)).ok);sim.dispose();
});
