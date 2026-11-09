import test from 'node:test';
import assert from 'node:assert/strict';
import {OrthographicCamera,Box3,Vector3} from 'three';
import {preparedZebraCare} from './helpers/zebra-care-play.mjs';
import {createZebraCareScene} from '../src/game/render3d/zebra/care-scene.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
import {raycastScene} from '../src/game/render3d/scene-picking.ts';
import {interactionTargets} from '../scripts/qa/visual3d/interaction-targets.ts';

for(const [width,height]of [[360,780],[780,360],[1366,768],[1920,1080]])test(`actual purchased Zebra triangle targets remain pickable at ${width}x${height} without state mutation`,()=>{
 const sim=preparedZebraCare(),state=sim.snapshot(),before=JSON.stringify(state),catalog={identities:new Map(),bounds:new Map(),batches:[]},care=createZebraCareScene(catalog),camera=new OrthographicCamera();
 try{
  care.sync(state.world);care.group.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(care.group);bounds.expandByPoint(new Vector3(8,0,7));bounds.expandByPoint(new Vector3(16,2.5,15));
  fitIsometricCamera(camera,bounds,width/height);const rect={left:7,top:11,width,height};
  const targets=interactionTargets(catalog,camera,rect);assert.equal(targets.length,5);assert.ok(targets.some(t=>t.facilityKind==='zebra-water'));
  for(const target of targets){assert.ok(target.point,JSON.stringify(target));assert.ok(target.tries<=27);assert.equal(raycastScene(catalog,camera,target.point,rect)?.id,target.id);}
  assert.equal(JSON.stringify(sim.snapshot()),before);assert.equal(JSON.stringify(state),before);
 }finally{care.dispose();sim.dispose();}
 assert.equal(catalog.batches.length,0);assert.equal(catalog.identities.size,0);assert.equal(care.inspect().zebraCareMaterials,0);
});
