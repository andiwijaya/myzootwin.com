import test from 'node:test';import assert from 'node:assert/strict';
import {Group} from 'three';
import {contract} from '../art/animals/v01/mammals.mjs';
import {createGLBResidentRig} from '../src/game/render3d/glb/resident-rig.ts';
import {boneContact} from '../src/game/render3d/glb/articulation.ts';
const signature=rig=>[...rig.bones.values()].flatMap(b=>[...b.position.toArray(),...b.quaternion.toArray(),...b.scale.toArray()]);
test('resident behavior transitions start at the shown pose, hold at a paused clock and reach the contact target',()=>{
 const c=contract('zebra'),scene=new Group();scene.add(c.rig.mesh);let releases=0;const library={modelId:()=> 'zebra-zaki-high-v01',ensure:()=>true,instantiate:()=>({scene,mesh:c.rig.mesh,bones:c.rig.bones}),release(){releases++;c.dispose();}},rig=createGLBResidentRig(library,'zebra','zaki','zebra-zaki',false);
 try{rig.setFrame({behavior:'idle',timeMs:0});rig.apply({});const initial=signature(rig),target={mouth:{y:.20,z:.70},bodyDrop:-.05};rig.setFrame({behavior:'graze',timeMs:10});rig.apply(target);assert.deepEqual(signature(rig),initial);rig.setFrame({behavior:'graze',timeMs:150});rig.apply(target);const paused=signature(rig);rig.apply(target);assert.deepEqual(signature(rig),paused);assert.notDeepEqual(paused,initial);rig.setFrame({behavior:'graze',timeMs:290});rig.apply(target);const mouth=boneContact(rig.mesh,rig.bones,'zebra');assert.ok(Math.abs(mouth.y-.20)<1e-6&&Math.abs(mouth.z-.70)<1e-6);rig.dispose();rig.dispose();assert.equal(releases,1);}finally{rig.dispose();}
});
test('a resident waits for its actual GLB and never constructs a procedural fallback',()=>{let instantiated=false;const library={modelId:()=> 'zebra-zaki-high-v01',ensure:()=>false,instantiate(){instantiated=true;}};assert.equal(createGLBResidentRig(library,'zebra','zaki','zebra-zaki',false),undefined);assert.equal(instantiated,false);});
