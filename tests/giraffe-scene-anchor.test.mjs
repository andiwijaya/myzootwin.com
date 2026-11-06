import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {OrthographicCamera,Vector3} from 'three';
import {sceneOrigin,toScene,sceneToCell} from '../src/game/world/scene-coordinates.ts';
import {expandGiraffeWorld} from '../src/game/world/giraffe-expansion.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
import {raycastScene} from '../src/game/render3d/scene-picking.ts';
const golden=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v3-golden.json',import.meta.url),'utf8')).state;
const dispose=d=>{d.geometries.forEach(g=>g.dispose());d.materials.forEach(m=>m.dispose());};
test('V4 retains exact legacy origin and all334 old rendered identities/bounds without moving scene geometry',()=>{
 const old=createTropicalDiorama(golden.world),w=expandGiraffeWorld(golden.world),next=createTropicalDiorama(w);
 try{assert.deepEqual(sceneOrigin(w),{x:6,z:5});assert.deepEqual(sceneOrigin({width:24,height:10}),{x:12,z:5});
  for(const [id,identity] of old.catalog.identities){assert.deepEqual(next.catalog.identities.get(id),identity,id);const a=old.catalog.bounds.get(id),b=next.catalog.bounds.get(id);assert.deepEqual(b.min.toArray(),a.min.toArray(),id);assert.deepEqual(b.max.toArray(),a.max.toArray(),id);}
  for(const t of golden.world.tiles){assert.deepEqual(toScene(t.cell,w),toScene(t.cell,golden.world));assert.deepEqual(sceneToCell(toScene(t.cell,w),w),t.cell);}
  assert.equal(next.catalog.identities.size,old.catalog.identities.size+312);assert.equal(next.inspect().terrainTiles,624);assert.equal(next.inspect().palmTrees,old.inspect().palmTrees);
 }finally{dispose(old);dispose(next);}
});
test('all eight camera angles fit lateral bounds and raycast actual old/new geometry at desktop and mobile shapes',()=>{
 const w=expandGiraffeWorld(golden.world),d=createTropicalDiorama(w);try{
  for(const [width,height] of [[1366,768],[360,780],[780,360]])for(let step=0;step<8;step++){
   const camera=new OrthographicCamera();fitIsometricCamera(camera,d.bounds,width/height,step*Math.PI/4);
   for(const x of [d.bounds.min.x,d.bounds.max.x])for(const z of [d.bounds.min.z,d.bounds.max.z])for(const y of [d.bounds.min.y,d.bounds.max.y]){const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1);}
   for(const cell of [{x:4,z:7},{x:22,z:13}]){const p=toScene(cell,w),v=new Vector3(p.x,.022,p.z).project(camera),hit=raycastScene(d.catalog,camera,{x:(v.x+1)*width/2,y:(1-v.y)*height/2},{left:0,top:0,width,height});assert.equal(hit?.id,`tile-${cell.x}-${cell.z}`,JSON.stringify({width,height,step,cell,hit}));}
  }
 }finally{dispose(d);}
});
