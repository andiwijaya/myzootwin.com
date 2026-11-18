import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,BoxGeometry,Group,Mesh,MeshBasicMaterial,OrthographicCamera,Vector3,SkinnedMesh,Bone,Skeleton,Sphere,Float32BufferAttribute,Uint16BufferAttribute} from 'three';
import {raycastScene,resolveSceneTap,createScenePicker} from '../src/game/render3d/scene-picking.ts';
import {createCameraGestures} from '../src/game/render3d/camera-gestures.ts';

function setup(){
 const camera=new OrthographicCamera(-4,4,3.125,-3.125,.1,100);camera.position.set(0,0,12);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const rect={left:127,top:93,width:320,height:250},catalog={identities:new Map(),bounds:new Map(),batches:[]},owned=[];
 function add(id,kind,x=0,y=0,z=0,size=[.3,1.4,.3]){const geometry=new BoxGeometry(...size),material=new MeshBasicMaterial(),mesh=new Mesh(geometry,material);mesh.position.set(x,y,z);mesh.updateMatrixWorld(true);catalog.identities.set(id,{id,kind,category:'object',ordinal:1,cell:{x:1,z:1}});catalog.bounds.set(id,new Box3().setFromObject(mesh));catalog.batches.push({mesh,ranges:[{first:0,count:geometry.index.count/3,id}]});owned.push({geometry,material});return mesh;}
 const project=(position)=>{const p=position.clone().project(camera);return{x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};};
 const dispose=()=>{for(const item of owned){item.geometry.dispose();item.material.dispose();}};
 return {camera,rect,catalog,add,project,dispose};
}
const touch=(s,p)=>resolveSceneTap(s.catalog,s.camera,{...p,pointerType:'touch'},s.rect);

test('touch allowance follows actual animal silhouettes in CSS pixels after rotation, translation, zoom and viewport offsets',()=>{
 const s=setup();try{const mesh=s.add('giraffe-1','giraffe');
  for(const angle of [0,.65,2.2,4.8])for(const zoom of [1,1.8,3]){
   s.camera.position.set(Math.sin(angle)*12+.1,.15,Math.cos(angle)*12);s.camera.lookAt(.1,.15,0);s.camera.zoom=zoom;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld(true);
   const positions=mesh.geometry.getAttribute('position'),screen=[];for(let i=0;i<positions.count;i++)screen.push(s.project(new Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld)));
   const edge=screen.reduce((a,b)=>a.x>b.x?a:b),center=s.project(mesh.position),p={x:edge.x+7,y:center.y};
   assert.equal(raycastScene(s.catalog,s.camera,p,s.rect),null,'exact ray is a true near miss');
   assert.equal(touch(s,p)?.id,'giraffe-1',JSON.stringify({angle,zoom,p}));
   assert.equal(resolveSceneTap(s.catalog,s.camera,{...p,pointerType:'mouse'},s.rect),null,'mouse remains precise');
   assert.equal(touch(s,{x:edge.x+13,y:center.y}),null,'allowance stays bounded in screen pixels');
  }
 }finally{s.dispose();}
});

test('exact animal and facility hits take precedence; farther or occluded animals are never substituted',()=>{
 const s=setup();try{s.add('lion-1','lion',-.2);s.add('giraffe-1','giraffe',.2,0,-1);const p=s.project(new Vector3(-.2,0,0));assert.equal(touch(s,p)?.id,'lion-1');
  s.add('water-1','lion-facility',-.2,0,2,[.7,1.8,.4]);assert.equal(touch(s,p)?.id,'water-1');
  const blocked=s.project(new Vector3(.1,0,0));assert.notEqual(touch(s,blocked)?.id,'giraffe-1');
 }finally{s.dispose();}
});

test('hidden ancestors, clipping filters, empty space and invalid or outside taps do not snap to animals',()=>{
 const s=setup();try{const mesh=s.add('zebra-1','zebra'),parent=new Group();parent.add(mesh);parent.visible=false;
  const p=s.project(new Vector3());assert.equal(raycastScene(s.catalog,s.camera,p,s.rect),null);assert.equal(touch(s,p),null);
  parent.visible=true;assert.equal(resolveSceneTap(s.catalog,s.camera,{...p,pointerType:'touch'},s.rect,undefined,()=>false),null);
  for(const p of [{x:NaN,y:100},{x:Infinity,y:100},{x:126,y:200},{x:300,y:90},{x:130,y:96}])assert.equal(touch(s,p),null);
 }finally{s.dispose();}
});

test('equally close animal silhouettes are ambiguous and do not guess an identity',()=>{
 const s=setup();try{s.add('lion-a','lion',-.3,0,0,[.2,1,.2]);s.add('lion-b','lion',.3,0,0,[.2,1,.2]);const p=s.project(new Vector3());assert.equal(touch(s,p),null);
  assert.equal(touch(s,{...p,x:p.x-2})?.id,'lion-a');
 }finally{s.dispose();}
});

test('an oversized broad-phase box cannot make empty space selectable',()=>{
 const s=setup();try{s.add('giraffe-1','giraffe',0,0,0,[.1,.15,.1]);s.catalog.bounds.set('giraffe-1',new Box3(new Vector3(-3,-3,-3),new Vector3(3,3,3)));
  assert.equal(touch(s,s.project(new Vector3(1,1,0))),null);
 }finally{s.dispose();}
});

test('deformed skinned vertices, rather than the bind pose, define touch ownership',()=>{
 const s=setup();let mesh;try{
  const geometry=new BoxGeometry(.2,.8,.2),count=geometry.getAttribute('position').count,weights=Array.from({length:count},()=>[1,0,0,0]).flat(),indices=Array(count*4).fill(0);
  geometry.setAttribute('skinIndex',new Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));const material=new MeshBasicMaterial();mesh=new SkinnedMesh(geometry,material);const bone=new Bone();mesh.add(bone);mesh.bind(new Skeleton([bone]));bone.position.x=1;mesh.updateMatrixWorld(true);mesh.skeleton.update();mesh.boundingBox=new Box3(new Vector3(-2,-2,-2),new Vector3(2,2,2));mesh.boundingSphere=mesh.boundingBox.getBoundingSphere(new Sphere());
  s.catalog.identities.set('elephant-1',{id:'elephant-1',kind:'elephant',category:'object',ordinal:1,cell:{x:1,z:1}});s.catalog.bounds.set('elephant-1',mesh.boundingBox.clone());s.catalog.batches.push({mesh,ranges:[{first:0,count:geometry.index.count/3,id:'elephant-1'}]});
  const p=s.project(new Vector3(1.1,0,0));p.x+=7;assert.equal(touch(s,p)?.id,'elephant-1');assert.equal(touch(s,s.project(new Vector3())),null);
  geometry.dispose();material.dispose();
 }finally{mesh?.skeleton.dispose();s.dispose();}
});

test('touch tap retains down coordinates and touch type while camera gestures still own their pointers',()=>{
 let started,selected;const gestures=createCameraGestures({panPixels(){},zoomBy(){},rotateBy(){}},()=>({left:0,top:0,width:320,height:250}),p=>{selected=p;},()=> 'rotate',{now:()=>10,onTapStart:p=>{started=p;}});
 gestures.down({id:1,x:100,y:120,pointerType:'touch'});gestures.up({id:1,x:103,y:120,pointerType:'touch'});assert.deepEqual(started,{id:1,x:100,y:120,pointerType:'touch'});assert.deepEqual(selected,started);
 selected=undefined;gestures.down({id:2,x:100,y:120,pointerType:'touch'});gestures.move({id:2,x:104,y:120,pointerType:'touch'});gestures.up({id:2,x:104,y:120,pointerType:'touch'});assert.equal(selected,undefined);
});

test('touch picking uses the presented camera and rejects a view or layout change during the tap',()=>{
 const s=setup(),changes=[],picker=createScenePicker(s.catalog,s.camera,()=>s.rect,p=>changes.push(p));try{s.add('lion-1','lion');picker.captureView();const p={id:7,...s.project(new Vector3()),pointerType:'touch'};
  picker.prepareTap(p);s.camera.position.x+=3;s.camera.updateMatrixWorld(true);picker.pick(p);assert.equal(changes.at(-1)?.id,'lion-1','unpresented camera cannot move the tap ray');
  picker.clear();picker.prepareTap(p);picker.captureView();const revision=picker.inspect().selectionRevision;picker.pick(p);assert.equal(picker.inspect().selectionRevision,revision,'newly presented view during tap cancels selection');
  picker.prepareTap(p);s.rect.left+=8;picker.pick(p);assert.equal(picker.inspect().selectionRevision,revision,'scroll/layout change cancels selection');
  picker.dispose();picker.prepareTap(p);picker.captureView();picker.pick(p);assert.equal(picker.inspect().selectionActive,false);
 }finally{picker.dispose();for(const r of [...picker.geometries,...picker.materials])r.dispose();s.dispose();}
});

test('canvas DOMRect prototype getters are copied explicitly for a stable touch snapshot',()=>{
 const s=setup(),changes=[],prototype={};
 // DOMRect fields are inherited accessors and cannot be copied with object spread.
 for(const key of ['left','top','width','height'])Object.defineProperty(prototype,key,{get(){return s.rect[key];}});const rect=Object.create(prototype);
 assert.deepEqual({...rect},{});const picker=createScenePicker(s.catalog,s.camera,()=>rect,p=>changes.push(p));
 try{s.add('lion-1','lion');picker.captureView();const p={id:11,...s.project(new Vector3()),pointerType:'touch'};picker.prepareTap(p);picker.pick(p);assert.equal(changes.at(-1)?.id,'lion-1');}
 finally{picker.dispose();for(const r of [...picker.geometries,...picker.materials])r.dispose();s.dispose();}
});
