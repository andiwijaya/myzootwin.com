import test from 'node:test';
import assert from 'node:assert/strict';
import { OrthographicCamera, Vector3 } from 'three';
import { createInitialState } from '../src/game/core/initial-state.ts';
import { createTropicalDiorama } from '../src/game/render3d/tropical-diorama.ts';
import { fitIsometricCamera } from '../src/game/render3d/isometric-camera.ts';

function dispose(world) { world.geometries.forEach(g=>g.dispose()); world.materials.forEach(m=>m.dispose()); }
test('scenery follows terrain and gate without mutating placement, animals, economy or missions',()=>{
  const state=createInitialState(), before=JSON.stringify(state), world=createTropicalDiorama(state.world);
  assert.equal(JSON.stringify(state),before);
  assert.equal(world.inspect().terrainTiles,120); assert.equal(world.inspect().creekTiles,8);
  assert.equal(world.inspect().entranceGates,1); assert.equal(world.inspect().palmTrees,6);
  assert.equal(world.group.children.length,6); assert.equal(world.materials.length,6);
  assert.ok(world.group.getObjectByName('creek water')); assert.ok(world.group.getObjectByName('gate and rocks'));
  for(const g of world.geometries) {
    assert.ok(g.getAttribute('position').count>0);
    for(const kind of ['position','normal','color']) assert.ok([...g.getAttribute(kind).array].every(Number.isFinite));
    assert.equal(g.getAttribute('position').count%3,0);
  }
  const triangles=world.geometries.reduce((n,g)=>n+g.getAttribute('position').count/3,0);
  assert.ok(triangles>1000 && triangles<10000); dispose(world);
});
test('fixed isometric framing contains the entire original world at all target aspect ratios',()=>{
  const world=createTropicalDiorama(createInitialState().world), camera=new OrthographicCamera();
  for(const [width,height] of [[504,350],[270,250],[285,250],[496,350],[180,400]]) {
    fitIsometricCamera(camera,world.bounds,width/height);
    for(const x of [world.bounds.min.x,world.bounds.max.x]) for(const y of [world.bounds.min.y,world.bounds.max.y]) for(const z of [world.bounds.min.z,world.bounds.max.z]) {
      const p=new Vector3(x,y,z).project(camera);
      assert.ok(Math.abs(p.x)<1 && Math.abs(p.y)<1 && Math.abs(p.z)<1,JSON.stringify({width,height,p}));
    }
  }
  dispose(world);
});
test('scenery is reproducible and its ambient water reads fixed simulation time; reduced motion freezes the effect',()=>{
  const a=createTropicalDiorama(createInitialState().world), b=createTropicalDiorama(createInitialState().world);
  a.geometries.forEach((g,i)=>assert.deepEqual(g.getAttribute('position').array,b.geometries[i].getAttribute('position').array));
  a.update(1200,false);b.update(1200,false);assert.deepEqual(a.inspect(),b.inspect());
  assert.ok(a.inspect().waterFlowOffset>0 && a.inspect().waterFlowOffset<.06);
  a.update(1400,true);assert.equal(a.inspect().waterFlowOffset,0);assert.equal(a.inspect().visualGameTimeMs,1400);
  assert.equal(a.group.getObjectByName('water glints').position.z,0);dispose(a);dispose(b);
});

test('quality toggles reuse owned material and retain geometry, catalog and authoritative world',()=>{
  const state=createInitialState(), before=JSON.stringify(state), world=createTropicalDiorama(state.world);
  const geometries=[...world.geometries], materials=[...world.materials], catalog=JSON.stringify(world.catalog);
  for(let i=0;i<12;i++) {
    world.setLowGraphics(true); assert.equal(world.inspect().sceneryGlintsVisible,false); assert.equal(world.inspect().sceneryShadeVisible,true); assert.equal(world.inspect().scenerySimpleLighting,false);
    assert.notEqual(world.group.getObjectByName('tropical canopy and reeds').material,world.group.getObjectByName('water glints').material);
    world.setLowGraphics(false); assert.equal(world.inspect().sceneryGlintsVisible,true); assert.equal(world.inspect().sceneryShadeVisible,true); assert.equal(world.inspect().scenerySimpleLighting,false);
  }
  assert.deepEqual(world.geometries,geometries); assert.deepEqual(world.materials,materials); assert.equal(materials.length,6); assert.equal(JSON.stringify(world.catalog),catalog); assert.equal(JSON.stringify(state),before);dispose(world);
});

// River and understory polish is presentation-only: no new placement obstacles or water outside real creek cells.
test('faceted creek stays inside authoritative creek cells with upward faces and a small original texture-free scenery budget',()=>{
 const state=createInitialState(),before=JSON.stringify(state),scene=createTropicalDiorama(state.world),water=scene.group.getObjectByName('creek water'),p=water.geometry.getAttribute('position'),n=water.geometry.getAttribute('normal');
 for(let i=0;i<p.count;i++){
  assert.ok(n.getY(i)>.99,'water face must remain visible from above');
  assert.ok(state.world.tiles.some(t=>t.terrain==='creek'&&Math.abs(p.getX(i)-(t.cell.x+.5-state.world.width/2))<=.501&&Math.abs(p.getZ(i)-(t.cell.z+.5-state.world.height/2))<=.501),'water escaped creek tile');
 }
 assert.equal(scene.inspect().understoryClumps,10);assert.equal(scene.inspect().riverbankSegments,8);assert.equal(scene.group.children.length,6);assert.ok(scene.materials.every(m=>!m.map));assert.equal(JSON.stringify(state),before);dispose(scene);
});
