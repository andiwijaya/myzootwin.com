import test from 'node:test';
import assert from 'node:assert/strict';
import {Color,Vector3} from 'three';
import {createGiraffeWorldScene} from '../src/game/render3d/giraffe/world-scene.ts';
import {createGiraffeResidentsScene} from '../src/game/render3d/giraffe/residents-scene.ts';
import {preparedGiraffeZoo} from './fixtures/giraffe-play.mjs';

test('shade foliage clears the actual skinned adult heads in both LODs during standing, rest and rumination',()=>{
 const sim=preparedGiraffeZoo(),world=sim.worldSnapshot(),shade=world.resources.find(r=>r.kind==='giraffe-shade');
 const catalog={identities:new Map(),bounds:new Map(),batches:[]},scenery=createGiraffeWorldScene(catalog),residents=createGiraffeResidentsScene(catalog);
 try{
  scenery.sync(world);
  const mesh=catalog.batches.find(b=>b.ranges.some(range=>range.id===shade.id)).mesh,positions=mesh.geometry.getAttribute('position'),colors=mesh.geometry.getAttribute('color');
  // Crown colors distinguish foliage from the trunk and floor in the emitted, shared world mesh.
  const foliage=[new Color('#819b5c'),new Color('#91a968')];let crownMin=Infinity,leafVertices=0;
  for(let i=0;i<positions.count;i++)if(foliage.some(c=>Math.abs(colors.getX(i)-c.r)<1e-6&&Math.abs(colors.getY(i)-c.g)<1e-6&&Math.abs(colors.getZ(i)-c.b)<1e-6)){crownMin=Math.min(crownMin,positions.getY(i));leafVertices++;}
  assert.ok(leafVertices>0);
  for(const low of [false,true])for(const phase of /** @type {const} */ (['idle','rest','ruminate']))for(const time of [0,3300]){
   const actors=sim.giraffeSnapshot().animals.map(a=>({...structuredClone(a),currentBehavior:phase,motion:{...structuredClone(a.motion),phase,lastStep:{x:0,z:0},ticksLeft:20}}));
   residents.sync(actors,world.width,world.height,low);residents.update(1,time);
   let adultMax=-Infinity;
   for(const actor of actors){const rig=catalog.batches.find(b=>b.ranges.some(range=>range.id===actor.id)).mesh;
    for(let i=0;i<rig.geometry.getAttribute('position').count;i++){const p=rig.getVertexPosition(i,new Vector3()).applyMatrix4(rig.matrixWorld);adultMax=Math.max(adultMax,p.y);}}
   assert.ok(crownMin>=adultMax+.20,JSON.stringify({low,phase,time,crownMin,adultMax,requiredClearance:.20}));
  }
 }finally{residents.dispose();scenery.dispose();sim.dispose();}
});
