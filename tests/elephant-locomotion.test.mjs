import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MeshStandardMaterial,Vector3} from 'three';
import {migrateSaveV1,parseSaveV2,serializeSaveV2,validateSaveV2} from '../src/game/persistence/save-v2.ts';
import {prepareConservationGrant} from '../src/game/economy/conservation-grant.ts';
import {prepareElephantConstruction} from '../src/game/economy/elephant-construction.ts';
import {prepareElephantWelcome} from '../src/game/animals/elephants/residents.ts';
import {defaultElephantCareCell,prepareElephantCarePlacement,prepareElephantCareRefill} from '../src/game/animals/elephants/care-resources.ts';
import {stepElephantCare} from '../src/game/animals/elephants/care-simulation.ts';
import {elephantBodyClearance,elephantBodyMoveAllowed,elephantBodyTurnAllowed,elephantBodyFrameAllowed} from '../src/game/animals/elephants/body-clearance.ts';
import {ELEPHANT_GROUND,groundPointAllowed,groundDistance} from '../src/game/animals/elephants/ground.ts';
import {elephantLegPose,elephantFootStep,elephantLocomotionPose} from '../src/game/render3d/elephant/elephant-locomotion.ts';
import {createElephantRig} from '../src/game/render3d/elephant/elephant-rig.ts';
import {ELEPHANT_LEGS} from '../src/game/render3d/elephant/elephant-geometry.ts';

function home(supplied=false,mirror=false){let s=migrateSaveV1(JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state).value;s=prepareConservationGrant(s,{command:s.economy.nextCommand}).state;s=prepareElephantConstruction(s,{x:3,z:11},'habitat-locomotion',s.economy.nextCommand).state;s=prepareElephantWelcome(s,s.economy.nextCommand).state;if(supplied){for(const kind of ['elephant-browse','elephant-browse','elephant-water']){const q=prepareElephantCarePlacement(s,{command:s.economy.nextCommand,kind,cell:mirror&&kind==='elephant-water'?{x:3,z:14}:defaultElephantCareCell(s,kind)});assert.ok(q.ok);s=q.state;}for(const r of s.world.resources.filter(r=>'approaches'in r)){const q=prepareElephantCareRefill(s,{command:s.economy.nextCommand,id:r.id,revision:r.revision});assert.ok(q.ok);s=q.state;}}return s;}
const herd=s=>s.animals.filter(a=>a.speciesId==='elephas-maximus');
const body=a=>({position:a.position,heading:a.motion.heading});
const lerp=(a,b,t)=>({position:{x:a.position.x+(b.position.x-a.position.x)*t,z:a.position.z+(b.position.z-a.position.z)*t},heading:a.heading+Math.atan2(Math.sin(b.heading-a.heading),Math.cos(b.heading-a.heading))*t});

test('oriented swept bodies reject head-on crossing and unsafe turning while parallel residents retain their existing two-metre spacing',()=>{
 const other={position:{x:0,z:2},heading:Math.PI};assert.ok(groundDistance({x:0,z:0},other.position)>ELEPHANT_GROUND.separation);assert.ok(elephantBodyClearance({position:{x:0,z:0},heading:0},other)<0);
 assert.equal(elephantBodyMoveAllowed({x:0,z:-3},{x:0,z:4},0,[other]),false);
 assert.equal(elephantBodyMoveAllowed({x:0,z:0},{x:0,z:3},0,[{position:{x:2,z:1},heading:0}]),true);
 assert.equal(elephantBodyTurnAllowed({x:0,z:0},0,Math.PI/2,[{position:{x:1.7,z:0},heading:-Math.PI/2}]),false);
 assert.equal(elephantBodyFrameAllowed({position:{x:-2,z:0},heading:Math.PI/2},{position:{x:2,z:0},heading:Math.PI/2},{position:{x:0,z:-2},heading:0},{position:{x:0,z:2},heading:0}),false);
});

test('both real care walks preserve body clearance at every rendered frame, bounded turning, fence/prop bounds and multiple completed goals',()=>{
 const s=home(true),habitat=s.world.habitats.find(h=>h.kind==='elephant-grove'),visited=new Map(herd(s).map(a=>[a.id,new Set()]));let moving=0,turning=0;
 for(let tick=0;tick<650;tick++){const before=structuredClone(herd(s));s.tick++;s.gameTimeMs=s.tick*100;stepElephantCare(s);const after=herd(s);for(let i=0;i<2;i++){const a=after[i],p=before[i],d=groundDistance(a.position,p.position),rotation=Math.abs(Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading)));assert.ok(d<=.04+1e-8);assert.ok(rotation<=.18+1e-8);assert.ok(groundPointAllowed(s.world,habitat,a.position));assert.ok(Math.abs(a.motion.lastStep.x-(a.position.x-p.position.x))<1e-10);if(d>1e-5)moving++;if(rotation>1e-5)turning++;if(a.targetResourceId)visited.get(a.id).add(a.targetResourceId);}
  for(let frame=0;frame<=20;frame++){const t=frame/20;assert.ok(elephantBodyClearance(lerp(body(before[0]),body(after[0]),t),lerp(body(before[1]),body(after[1]),t))>=-1e-7,`Body overlap at tick${tick}, frame${frame}`);}if(tick%100===0)assert.ok(validateSaveV2(s).ok);
 }assert.ok(moving>100&&turning>20);for(const a of herd(s)){assert.ok(a.foodEaten>0&&a.waterDrunk>0);assert.ok(visited.get(a.id).size>=2);}
});

test('four-beat inverse kinematics plants each actual broad foot level without sinking, while independent swing feet lift',()=>{
 const material=new MeshStandardMaterial(),r=createElephantRig('Ayu',material),skin=r.geometry.getAttribute('skinIndex');try{let lifted=0;for(let frame=0;frame<40;frame++){const phase=frame/40,legs=[0,.5,.25,.75].map(o=>{const p=elephantFootStep(phase+o,1);return {...elephantLegPose(p.step,p.lift,-.014),lift:p.lift};});r.apply({bodyDrop:-.014,upperLegs:legs.map(p=>p.upper),lowerLegs:legs.map(p=>p.lower),feet:legs.map(p=>p.foot)});for(const [leg,name]of ELEPHANT_LEGS.entries()){const id=r.skeleton.bones.findIndex(b=>b.name===name+'Foot');let min=Infinity;for(let i=0;i<skin.count;i++)if(skin.getX(i)===id)min=Math.min(min,r.mesh.getVertexPosition(i,new Vector3()).y);assert.ok(min>=.009-1e-5,`Foot sank ${min}`);assert.ok(Math.abs(min-(.01+legs[leg].lift))<1e-5,`Foot not grounded: ${min}, lift ${legs[leg].lift}`);if(legs[leg].lift>.02)lifted++;}}assert.ok(lifted>10);}finally{r.dispose();material.dispose();}
});

test('locomotion is driven by actual displacement, freezes at the same state/alpha, settles at rest and restores the exact saved end pose',()=>{
 const s=home(),a=herd(s)[0],p=structuredClone(a);a.position.z+=.04;a.motion.lastStep={x:0,z:.04,heading:0};p.motion.lastStep={...a.motion.lastStep};const exact=serializeSaveV2(s),pose=elephantLocomotionPose(p,a,1,2);assert.deepEqual(pose,elephantLocomotionPose(a,a,1,2));assert.deepEqual(pose,elephantLocomotionPose(p,a,1,2));assert.ok(pose.lowerLegs.some(v=>Math.abs(v)>.1));assert.equal(serializeSaveV2(s),exact);const stopped=structuredClone(a);stopped.motion.lastStep={x:0,z:0,heading:0};const neutral=elephantLocomotionPose(stopped,stopped,1,Infinity);assert.ok(neutral.upperLegs.every(v=>Math.abs(v)<1e-6));assert.equal(neutral.bodyDrop,0);const reduced=elephantLocomotionPose(p,a,.5,2,true);assert.deepEqual(reduced,elephantLocomotionPose(p,a,.5,2,false));
});

test('optional motion proof preserves old V2 exactly and rejects forged deltas or unknown motion records without data normalization',()=>{
 const s=home(),old=serializeSaveV2(s);assert.equal(serializeSaveV2(parseSaveV2(old).value),old);assert.ok(herd(s).every(a=>!Object.hasOwn(a.motion,'lastStep')));herd(s)[0].motion.lastStep={x:.024,z:.032,heading:.18};const modern=serializeSaveV2(s);assert.equal(serializeSaveV2(parseSaveV2(modern).value),modern);for(const bad of [{x:.04,z:.04,heading:0},{x:0,z:0,heading:.181},null,{x:0,z:0,heading:0,clock:1}]){const copy=structuredClone(s);herd(copy)[0].motion.lastStep=bad;assert.equal(validateSaveV2(copy).ok,false);}
});

test('the actual walking mesh including feet, tucked trunk and tail fits the authoritative oriented body envelope',()=>{
 const s=home(),a=herd(s)[0],p=structuredClone(a),material=new MeshStandardMaterial(),r=createElephantRig('Ayu',material);try{for(let frame=0;frame<32;frame++){a.position.z=13.5+frame*.04;p.position.z=a.position.z-.04;a.motion.lastStep=p.motion.lastStep={x:0,z:.04,heading:0};r.apply(elephantLocomotionPose(p,a,1,2));for(let i=0;i<r.geometry.getAttribute('position').count;i++){const point=r.mesh.getVertexPosition(i,new Vector3()),z=Math.max(-.30,Math.min(.43,point.z));assert.ok(Math.hypot(point.x,point.z-z)<=.70+1e-6,'A real walking vertex escapes its navigation envelope');}}}finally{r.dispose();material.dispose();}
});


test('a legally mirrored water layout also serves both residents without relying on the default east-side goal',()=>{
 const s=home(true,true);for(let tick=0;tick<900;tick++){s.tick++;s.gameTimeMs=s.tick*100;stepElephantCare(s);}assert.ok(herd(s).every(a=>a.foodEaten>0&&a.waterDrunk>0));assert.ok(validateSaveV2(s).ok);
});
