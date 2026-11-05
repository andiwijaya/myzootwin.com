import test from 'node:test';
import assert from 'node:assert/strict';
import {MeshStandardMaterial,Vector3} from 'three';
import {elephantHome,elephantHerd,elephantProps} from './fixtures/elephant-home.mjs';
import {stepElephantCare} from '../src/game/animals/elephants/care-simulation.ts';
import {serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {createElephantRig} from '../src/game/render3d/elephant/elephant-rig.ts';
import {createElephantConsumptionAnimator} from '../src/game/render3d/elephant/elephant-consumption.ts';
import {elephantSocialPose} from '../src/game/render3d/elephant/elephant-social.ts';
import {elephantLocomotionPose} from '../src/game/render3d/elephant/elephant-locomotion.ts';
import {createElephantResidentsScene} from '../src/game/render3d/elephant-residents-scene.ts';
const catalog=()=>({identities:new Map(),bounds:new Map(),batches:[]});
function actual(){const s=elephantHome();for(let i=0;i<1600;i++){s.tick++;s.gameTimeMs=s.tick*100;stepElephantCare(s);if(elephantHerd(s).every(a=>a.motion.phase==='trunk-touch'))return s;}assert.fail('No real touch phase');}

test('the two original scaled skinned trunk tips meet at the shared real midpoint during a genuine reciprocal greeting without foot sinking',()=>{
 const s=actual(),herd=elephantHerd(s),exact=serializeSaveV2(s),material=new MeshStandardMaterial(),animator=createElephantConsumptionAnimator(),rigs=herd.map(a=>createElephantRig(a.name,material));try{for(let frame=0;frame<=24;frame++){const actors=herd.map(a=>{const c=structuredClone(a);c.motion.ticksLeft=24-frame;return c;}),tips=[];for(let i=0;i<2;i++){const a=actors[i],b=actors[1-i],rig=rigs[i],base=elephantLocomotionPose(a,a,1,Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z)),pose=elephantSocialPose(a,a,b,b,1,base,animator.target);assert.ok(pose);rig.mesh.scale.setScalar(a.name==='Nara'?.94:1);rig.mesh.position.set(a.position.x,.079,a.position.z);rig.mesh.rotation.y=a.motion.heading;rig.apply({...base,...pose});tips.push(rig.bones.get('trunk7').localToWorld(new Vector3(0,.015,.06)));for(let v=0;v<rig.geometry.getAttribute('position').count;v++){const p=rig.mesh.getVertexPosition(v,new Vector3());assert.ok(p.y>=-.001&&p.y<=2.28&&p.z>=-1.12&&p.z<=2.10);}}if(frame>=6&&frame<=18)assert.ok(tips[0].distanceTo(tips[1])<.055,'Actual tips must touch, not merely face each other');}assert.equal(serializeSaveV2(s),exact);}finally{rigs.forEach(r=>r.dispose());material.dispose();animator.dispose();}
});

test('missing/wrong/unreciprocated/distant/turned companions never produce a fake greeting pose',()=>{
 const s=actual(),[a,b]=elephantHerd(s),animator=createElephantConsumptionAnimator();try{for(const fault of ['missing','phase','link','far','turn']){const x=structuredClone(a),y=structuredClone(b);if(fault==='phase')y.motion.phase='idle';if(fault==='link')delete y.motion.partnerId;if(fault==='far')y.position.x+=1;if(fault==='turn')x.motion.heading+=.5;assert.equal(elephantSocialPose(x,x,y,fault==='missing'?undefined:y,.5,{},animator.target),null,fault);}}finally{animator.dispose();}
});

test('a cold actual paired pose freezes exactly across quality modes and reuses the existing bounded rigs/cache without state writes',()=>{
 const s=actual(),exact=serializeSaveV2(s),cold=parseSaveV2(exact).value,a=createElephantResidentsScene(catalog()),b=createElephantResidentsScene(catalog());try{a.sync(elephantHerd(s),12,18,elephantProps(s));b.sync(elephantHerd(cold),12,18,elephantProps(cold));a.update(1,0,true,true);b.update(1,0,true,true);const left=a.group.children.filter(m=>m.isSkinnedMesh),right=b.group.children.filter(m=>m.isSkinnedMesh);for(let i=0;i<2;i++)assert.deepEqual([...left[i].skeleton.boneMatrices],[...right[i].skeleton.boneMatrices]);for(let i=0;i<100;i++)a.update(1,0,true,true);assert.equal(a.inspect().liveElephantModels,2);assert.equal(a.inspect().elephantResidentGeometries,2);assert.ok(a.inspect().cachedTrunkTargets<=24);assert.equal(serializeSaveV2(s),exact);}finally{a.dispose();b.dispose();assert.equal(a.inspect().cachedTrunkTargets,0);}
});
