import {Box3,CylinderGeometry,Group,Mesh,MeshStandardMaterial,SphereGeometry,type BufferGeometry} from 'three';
import type {ElephantAnimal} from '../core/species.ts';
import type {SceneCatalog} from './scene-selection.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import {Batch} from './tropical-diorama.ts';

/** Original bounded standing models for the internal resident slice; the articulated rig is EH3-01. */
function standingModel(name:string){
 const b=new Batch(),skin=name==='Ayu'?'#969086':'#8c9395',dark=name==='Ayu'?'#7e786f':'#737d80';
 const oval=(color:string,p:number[],scale:number[],detail=8)=>b.add(new SphereGeometry(1,detail,6),color,p,scale);
 oval(skin,[0,1.02,0],[.49,.51,.77],12);oval(skin,[0,1.30,.64],[.39,.40,.43],12);
 for(const side of [-1,1]){oval(skin,[side*.15,1.53,.72],[.21,.20,.25]);oval(dark,[side*.40,1.25,.44],[.10,.32,.25]);oval(skin,[side*.43,1.27,.47],[.075,.29,.23]);
  oval('#253135',[side*.29,1.38,.93],[.038,.031,.028]);oval('#e6e7dc',[side*.30,1.39,.95],[.009,.009,.007]);}
 for(const x of [-.29,.29])for(const z of [-.46,.43]){
  b.add(new CylinderGeometry(.15,.17,.72,8),skin,[x,.49,z]);oval(skin,[x,.13,z+.015],[.18,.13,.21]);for(const dx of [-.065,.065])oval('#bcb9a9',[x+dx,.105,z+.19],[.041,.034,.022],6);
 }
 for(let i=0;i<8;i++){const r=.12-i*.009;oval(skin,[0,1.19-i*.13,1.02+Math.sin(i*.24)*.15],[r,.12,r]);}
 oval(skin,[0,.19,1.19],[.038,.068,.032],6);
 b.add(new CylinderGeometry(.018,.022,.48,6).rotateX(.35),skin,[0,.70,-.83]);oval(dark,[0,.47,-.91],[.045,.075,.045],6);
 return {geometry:b.geometry(),triangles:b.positions.length/9};
}

/** Actual persisted entity transforms. Two stable picking batches, no timers, RAF, RNG or rewards. */
export function createElephantResidentsScene(catalog:SceneCatalog){
 const group=new Group();group.name='Ayu and Nara residents';let disposed=false,material:MeshStandardMaterial|undefined,originX=6,originZ=5;
 const models=new Map<string,{mesh:Mesh;geometry:BufferGeometry;triangles:number;previous:ElephantAnimal;current:ElephantAnimal;entry:SceneCatalog['batches'][number]}>();
 function remove(id:string){const m=models.get(id);if(!m)return;catalog.batches=catalog.batches.filter(b=>b!==m.entry);catalog.identities.delete(id);catalog.bounds.delete(id);m.geometry.dispose();group.remove(m.mesh);models.delete(id);}
 return {group,sync(animals:ElephantAnimal[],width:number,height:number){
  if(disposed)return;const active=animals.slice(0,2);for(const id of models.keys())if(!active.some(a=>a.id===id))remove(id);
  if(active.length&&!material)material=new MeshStandardMaterial({vertexColors:true,roughness:1});
  const origin=sceneOrigin({width,height});originX=origin.x;originZ=origin.z;
  for(const [ordinal,a]of active.entries()){
   let m=models.get(a.id);if(!m){const shape=standingModel(a.name),mesh=new Mesh(shape.geometry,material);mesh.name=a.id;mesh.castShadow=true;mesh.receiveShadow=true;const entry={mesh,ranges:[{first:0,count:shape.triangles,id:a.id}]};m={...shape,mesh,entry,previous:structuredClone(a),current:structuredClone(a)};models.set(a.id,m);catalog.batches.push(entry);group.add(mesh);}
   m.previous=m.current;m.current=structuredClone(a);
   m.mesh.position.set(a.position.x-origin.x,.079,a.position.z-origin.z);m.mesh.rotation.y=a.motion.heading;m.mesh.scale.setScalar(a.name==='Nara'?.94:1);m.mesh.updateMatrixWorld(true);
   catalog.identities.set(a.id,{id:a.id,category:'object',kind:'elephant',residentName:a.name,ordinal:ordinal+1,cell:{x:Math.floor(a.position.x),z:Math.floor(a.position.z)}});catalog.bounds.set(a.id,new Box3().setFromObject(m.mesh));
  }
  if(!models.size&&material){material.dispose();material=undefined;}
 },update(alpha:number){if(disposed)return;const t=Math.max(0,Math.min(1,alpha));for(const m of models.values()){const a=m.current,p=m.previous,origin={x:originX,z:originZ};m.mesh.position.set(p.position.x+(a.position.x-p.position.x)*t-origin.x,.079,p.position.z+(a.position.z-p.position.z)*t-origin.z);m.mesh.rotation.y=p.motion.heading+Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))*t;m.mesh.updateMatrixWorld(true);catalog.bounds.set(a.id,new Box3().setFromObject(m.mesh));}},dispose(){if(disposed)return;disposed=true;for(const id of [...models.keys()])remove(id);material?.dispose();material=undefined;group.clear();},inspect:()=>({liveElephantModels:models.size,elephantResidentGeometries:models.size,elephantResidentMaterials:material?1:0,elephantResidentTriangles:[...models.values()].reduce((n,m)=>n+m.triangles,0),elephantResidentsSceneDisposed:disposed})};
}
