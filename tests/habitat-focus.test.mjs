import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, OrthographicCamera, Plane, Raycaster, Vector2, Vector3} from 'three';
import {zebraCodecFixture} from './helpers/zebra-v5-fixture.mjs';
import {habitatForSelection,habitatFocusArea,habitatFocusBounds,createHabitatRenderMask,habitatUndoAllowed} from '../src/game/render3d/habitat-focus.ts';
import {mountCameraControls} from '../src/game/render3d/camera-controls.ts';
import {raycastScene,createScenePicker} from '../src/game/render3d/scene-picking.ts';

const world=zebraCodecFixture().world;
const emptyCatalog=()=>({identities:new Map(),bounds:new Map(),batches:[]});
class Element extends EventTarget {style={};dataset={};getBoundingClientRect(){return {left:0,top:0,width:500,height:350};}focus(){}hasPointerCapture(){return false;}}
for(const home of world.habitats)for(const [width,height]of [[1366,768],[360,780],[780,360]]){
  test(`habitat camera fits ${home.kind} at ${width}x${height}, bounds navigation and restores zoo view`,()=>{
    const beforeWindow=globalThis.window;globalThis.window=new EventTarget();
    const host=new Element(),canvas=new Element(),camera=new OrthographicCamera(),catalog=emptyCatalog();
    const controls=mountCameraControls(host,canvas,camera,new Box3(new Vector3(-6,-.4,-5),new Vector3(18,4.2,21)),world);
    try{
      controls.resize(width,height);controls.command('zoom-in');controls.command('rotate-right');const before=controls.inspect();
      const bounds=habitatFocusBounds(home,world,catalog),area=habitatFocusArea(home,world);
      controls.setHabitatView({bounds,area});
      for(let turn=0;turn<8;turn++){
        controls.command('reset');for(let i=0;i<turn;i++)controls.command('rotate-right');
        for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
          const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=1&&Math.abs(p.y)<=1,JSON.stringify({turn,p}));
        }
        for(let i=0;i<6;i++)controls.command('zoom-in');
        for(const key of ['ArrowLeft','ArrowDown','ArrowRight','ArrowUp']){
          const event=new Event('keydown',{cancelable:true});Object.assign(event,{key,shiftKey:true});for(let i=0;i<20;i++)host.dispatchEvent(event);
          const ray=new Raycaster();ray.setFromCamera(new Vector2(0,0),camera);const point=ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());
          assert.ok(point&&point.x>=area.x&&point.x<=area.x+area.width&&point.z>=area.z&&point.z<=area.z+area.depth,JSON.stringify({turn,point,area}));
        }
      }
      controls.resize(height,width);controls.setHabitatView(null);const after=controls.inspect();
      for(const key of ['cameraZoom','cameraAzimuth','cameraFocusX','cameraFocusZ'])assert.ok(Math.abs(before[key]-after[key])<1e-8,key);
    }finally{controls.dispose();globalThis.window=beforeWindow;}
  });
}

test('selection resolves actual habitat, facility and occupied tile without assuming fixed anchors',()=>{
  for(const home of world.habitats){
    const cell=home.cells[0],identity={id:home.id,kind:'habitat',cell};assert.equal(habitatForSelection(world,identity)?.id,home.id);
    assert.equal(habitatForSelection(world,{...identity,id:`tile-${cell.x}-${cell.z}`})?.id,home.id);
    for(const resource of world.resources.filter(r=>r.habitatId===home.id))assert.equal(habitatForSelection(world,{...identity,id:resource.id,cell:resource.cell})?.id,home.id);
  }
  assert.equal(habitatForSelection(world,null),undefined);assert.equal(habitatForSelection(world,{id:'gate',cell:world.gate}),undefined);
});

test('render isolation clips merged geometry/shadows, restores original visibility/materials, and never mutates world',()=>{
  const original=JSON.stringify(world),root=new Group(),home=world.habitats.at(-1),other=world.habitats[0],catalog=emptyCatalog(),mask=createHabitatRenderMask();
  const material=new MeshBasicMaterial(),geometry=new BoxGeometry(),inside=new Mesh(geometry,material),outside=new Mesh(geometry,material),mixed=new Mesh(geometry,material),alreadyHidden=new Mesh(geometry,material);
  alreadyHidden.visible=false;root.add(inside,outside,mixed,alreadyHidden);
  for(const [mesh,h]of [[inside,home],[outside,other]]){catalog.identities.set(h.id,{id:h.id,kind:'habitat',cell:h.cells[0]});catalog.batches.push({mesh,ranges:[{first:0,count:12,id:h.id}]});}
  catalog.batches.push({mesh:mixed,ranges:[{first:0,count:6,id:null},{first:6,count:6,id:other.id}]});
  const prior=new Plane(new Vector3(0,1,0),10);material.clippingPlanes=[prior];material.clipIntersection=true;
  mask.set(home,world);mask.apply(root,catalog,world,[]);
  assert.equal(inside.visible,true);assert.equal(outside.visible,false);assert.equal(mixed.visible,true);assert.equal(alreadyHidden.visible,false);
  assert.equal(material.clippingPlanes.length,4);assert.equal(material.clipShadows,true);assert.equal(material.clipIntersection,false);
  const a=habitatFocusArea(home,world);assert.ok(material.clippingPlanes.every(p=>p.distanceToPoint(new Vector3(a.x+a.width/2,0,a.z+a.depth/2))>0));
  assert.equal(mask.allows(catalog.identities.get(other.id),world),false);assert.equal(mask.allows(catalog.identities.get(home.id),world,{x:999,z:999}),false);
  mask.restoreVisibility();assert.equal(outside.visible,true);mask.apply(root,catalog,world,[]);mask.set(null,world);
  assert.equal(outside.visible,true);assert.equal(alreadyHidden.visible,false);assert.deepEqual(material.clippingPlanes,[prior]);assert.equal(material.clipIntersection,true);
  assert.equal(JSON.stringify(world),original);mask.dispose();mask.dispose();assert.equal(mask.inspect().habitatFocusMaterials,0);material.dispose();geometry.dispose();
});

test('focused ray picking rejects invisible and clipped outside faces instead of selecting through the mask',()=>{
  const catalog=emptyCatalog(),camera=new OrthographicCamera(-2,2,2,-2,.1,20);camera.position.set(0,4,0);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const geometry=new BoxGeometry(1,.1,1),material=new MeshBasicMaterial(),mesh=new Mesh(geometry,material),identity={id:'allowed',kind:'habitat',cell:{x:1,z:1}};
  mesh.updateMatrixWorld(true);catalog.identities.set(identity.id,identity);catalog.batches.push({mesh,ranges:[{first:0,count:12,id:identity.id}]});
  const rect={left:0,top:0,width:200,height:200},point={x:100,y:100};
  assert.equal(raycastScene(catalog,camera,point,rect,new Raycaster(),()=>false),null);assert.equal(raycastScene(catalog,camera,point,rect,new Raycaster(),()=>true)?.id,'allowed');
  mesh.visible=false;assert.equal(raycastScene(catalog,camera,point,rect,new Raycaster(),()=>true),null);geometry.dispose();material.dispose();
});

test('leaving focus restores the original nearest-unowned-surface picking rule',()=>{
  const catalog=emptyCatalog(),camera=new OrthographicCamera(-2,2,2,-2,.1,20);camera.position.set(0,4,0);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const geometry=new BoxGeometry(1,.1,1),material=new MeshBasicMaterial(),owned=new Mesh(geometry,material),soil=new Mesh(geometry,material);soil.position.y=.2;soil.updateMatrixWorld(true);owned.updateMatrixWorld(true);
  const identity={id:'allowed',kind:'habitat',cell:{x:1,z:1}};catalog.identities.set(identity.id,identity);catalog.bounds.set(identity.id,new Box3(new Vector3(-.5,0,-.5),new Vector3(.5,.1,.5)));
  catalog.batches.push({mesh:owned,ranges:[{first:0,count:12,id:'allowed'}]},{mesh:soil,ranges:[{first:0,count:12,id:null}]});
  const picker=createScenePicker(catalog,camera,()=>({left:0,top:0,width:200,height:200}),()=>{}),point={x:100,y:100};
  picker.pick(point);assert.equal(picker.selection(),null);picker.setFilter(()=>true);picker.pick(point);assert.equal(picker.selection()?.id,'allowed');picker.setFilter();picker.pick(point);assert.equal(picker.selection(),null);
  picker.dispose();for(const g of picker.geometries)g.dispose();for(const m of picker.materials)m.dispose();geometry.dispose();material.dispose();
});

test('a focused habitat cannot undo another habitat facility or a shared path edit',()=>{
  const resource=world.resources[0],after=structuredClone(world);after.resources=after.resources.filter(r=>r.id!==resource.id);
  const editor={revision:1,undo:{before:world,after,refundIds:[resource.id]}};
  assert.equal(habitatUndoAllowed(editor,resource.habitatId),true);assert.equal(habitatUndoAllowed(editor,world.habitats.at(-1).id),false);
  assert.equal(habitatUndoAllowed({revision:2,undo:{before:world,after:world,refundIds:[]}},resource.habitatId),false);assert.equal(habitatUndoAllowed({revision:2,undo:null},resource.habitatId),false);
});
