import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {contract} from '../art/animals/v01/mammals.mjs';
import {stabilizeFeet,boneContact} from '../src/game/render3d/glb/articulation.ts';

test('GLB mammal stance compensates actual root travel including heading, with fixed sole heights',()=>{
 for(const species of ['zebra','giraffe','elephant','lion']){const c=contract(species),suffix=species==='elephant'?'Foot':species==='lion'?'Paw':'Hoof',height={zebra:.045,giraffe:.07,elephant:.17,lion:.055}[species],observations=[];try{for(const distance of [0,.035,.07,.105]){c.rig.mesh.position.set(Math.sin(.7)*distance,.079,Math.cos(.7)*distance);c.rig.mesh.rotation.y=.7;c.rig.apply({});stabilizeFeet(species,c.rig.mesh,c.rig.bones,{distance,moving:true});const point=c.rig.bones.get('foreLeft'+suffix).getWorldPosition(new Vector3());assert.ok(Math.abs(point.y-(.079+height))<1e-6,species+' foot height');observations.push(point);}for(const p of observations)assert.ok(p.distanceTo(observations[0])<1e-6,species+' stance sliding');}finally{c.dispose();}}
});

test('new muzzle anchors reach source simulation service and social targets',()=>{
 for(const [species,poses]of [['zebra',[{mouth:{y:.20,z:.70},bodyDrop:-.05},{mouth:{y:.188,z:.70},bodyDrop:-.05},{mouth:{x:.62,y:1.18,z:.74}}]],['giraffe',[{mouth:{y:2.55,z:.80}},{mouth:{y:.24,z:.80},headPitch:1.2,bodyDrop:-.08,spread:.16}]]]){const c=contract(species);try{for(const p of poses){c.rig.apply(p);const target=new Vector3(p.mouth.x??0,p.mouth.y,p.mouth.z);assert.ok(boneContact(c.rig.mesh,c.rig.bones,species).distanceTo(target)<1e-6,species+' muzzle target');}}finally{c.dispose();}}
});

test('lion lying pose keeps all four paws on the ground and poses remain independent',()=>{
 const a=contract('lion'),b=contract('lion',1);try{const before=[...b.rig.bones.values()].map(v=>[...v.position.toArray(),...v.quaternion.toArray()]);a.rig.apply({bodyDrop:-.17});for(const name of ['foreLeft','foreRight','hindLeft','hindRight'])assert.ok(Math.abs(a.rig.bones.get(name+'Paw').getWorldPosition(new Vector3()).y-.055)<1e-6);assert.deepEqual([...b.rig.bones.values()].map(v=>[...v.position.toArray(),...v.quaternion.toArray()]),before);}finally{a.dispose();b.dispose();}
});
