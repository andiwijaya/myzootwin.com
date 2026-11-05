import {Box3,Group,MeshStandardMaterial,Vector3} from 'three';
import type {ElephantAnimal,ElephantResource} from '../core/species.ts';
import type {SceneCatalog} from './scene-selection.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import {createElephantRig} from './elephant/elephant-rig.ts';
import {ELEPHANT_ART} from './elephant/elephant-geometry.ts';
import {elephantEnrichmentPose} from './elephant/elephant-enrichment.ts';
import {elephantSocialPose} from './elephant/elephant-social.ts';
import {elephantBathFrame} from './elephant/elephant-bathing.ts';
import {createElephantSpray,type ElephantSpraySource} from './elephant/elephant-spray.ts';
import {createElephantConsumptionAnimator} from './elephant/elephant-consumption.ts';
import {elephantLocomotionPose} from './elephant/elephant-locomotion.ts';

/** Ambient rig movement reads existing simulation time; it never advances care or rewards. */
export function elephantAmbientPose(timeMs:number,name:string,reducedMotion=false){
 if(reducedMotion||!Number.isFinite(timeMs))return {};
 const t=timeMs/1000,offset=name==='Ayu'?0:1.7;
 return {breath:Math.sin(t*.9+offset)*.006,headYaw:Math.sin(t*.31+offset)*.014,earLeft:Math.sin(t*.72+offset)*.035,earRight:-Math.sin(t*.72+offset+.5)*.035,tail:Math.sin(t*.51+offset)*.04};
}

/** Two original skinned residents in the one world renderer; no timer, RAF, RNG or save mutation. */
export function createElephantResidentsScene(catalog:SceneCatalog){
 const group=new Group();group.name='Ayu and Nara residents';let disposed=false,material:MeshStandardMaterial|undefined,originX=6,originZ=5;const consumption=createElephantConsumptionAnimator();let careResources:ElephantResource[]=[];let spray:ReturnType<typeof createElephantSpray>|undefined;
 const models=new Map<string,{rig:ReturnType<typeof createElephantRig>;previous:ElephantAnimal;current:ElephantAnimal;entry:SceneCatalog['batches'][number]}>();
 function bounds(id:string){const m=models.get(id);if(m)catalog.bounds.set(id,new Box3().copy(m.rig.mesh.boundingBox!).applyMatrix4(m.rig.mesh.matrixWorld));}
 function remove(id:string){const m=models.get(id);if(!m)return;catalog.batches=catalog.batches.filter(b=>b!==m.entry);catalog.identities.delete(id);catalog.bounds.delete(id);group.remove(m.rig.mesh);m.rig.dispose();models.delete(id);}
 return {group,sync(animals:ElephantAnimal[],width:number,height:number,resources:readonly ElephantResource[]=[]){
  if(disposed)return;careResources=structuredClone([...resources]);const active=animals.slice(0,ELEPHANT_ART.maxResidents);for(const id of models.keys())if(!active.some(a=>a.id===id))remove(id);
  if(active.length&&!material)material=new MeshStandardMaterial({vertexColors:true,roughness:.97});
  const origin=sceneOrigin({width,height});originX=origin.x;originZ=origin.z;
  for(const [ordinal,a]of active.entries()){
   let m=models.get(a.id);if(!m){const rig=createElephantRig(a.name,material!);rig.mesh.name=a.id;rig.mesh.scale.setScalar(a.name==='Nara'?ELEPHANT_ART.scaleNara:ELEPHANT_ART.scaleAyu);const entry={mesh:rig.mesh,ranges:[{first:0,count:rig.triangles,id:a.id}]};m={rig,entry,previous:structuredClone(a),current:structuredClone(a)};models.set(a.id,m);catalog.batches.push(entry);group.add(rig.mesh);}
   m.previous=m.current;m.current=structuredClone(a);const mesh=m.rig.mesh;mesh.position.set(a.position.x-origin.x,.079,a.position.z-origin.z);mesh.rotation.y=a.motion.heading;mesh.updateMatrixWorld(true);m.rig.skeleton.update();
   catalog.identities.set(a.id,{id:a.id,category:'object',kind:'elephant',residentName:a.name,ordinal:ordinal+1,cell:{x:Math.floor(a.position.x),z:Math.floor(a.position.z)}});bounds(a.id);
  }
  if(!models.size&&spray){group.remove(spray.mesh);spray.dispose();spray=undefined;}if(!models.size&&material){material.dispose();material=undefined;}
 },update(alpha:number,timeMs=0,reducedMotion=true,low=false){
  if(disposed)return;const t=Number.isFinite(alpha)?Math.max(0,Math.min(1,alpha)):0;
  const sources:ElephantSpraySource[]=[];for(const [id,m]of models){const a=m.current,p=m.previous,mesh=m.rig.mesh,x=p.position.x+(a.position.x-p.position.x)*t,z=p.position.z+(a.position.z-p.position.z)*t;mesh.position.set(x-originX,.079,z-originZ);mesh.rotation.y=p.motion.heading+Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))*t;const companion=Math.min(Infinity,...[...models.values()].filter(other=>other!==m).map(other=>Math.hypot(x-other.previous.position.x-(other.current.position.x-other.previous.position.x)*t,z-other.previous.position.z-(other.current.position.z-other.previous.position.z)*t)));const base={...elephantAmbientPose(timeMs,a.name,reducedMotion),...elephantLocomotionPose(p,a,t,companion,reducedMotion)};const bath=elephantBathFrame(p,a,careResources,t,base,consumption.target);m.rig.apply({...base,...consumption.pose(p,a,careResources,t,base,reducedMotion),...bath?.pose,...elephantEnrichmentPose(p,a,careResources,t,consumption.target),...elephantSocialPose(p,a,models.get(a.motion.partnerId??'')?.previous,models.get(a.motion.partnerId??'')?.current,t,base,consumption.target)});if(bath?.sprayProgress!==null&&bath?.sprayProgress!==undefined){const tip=group.worldToLocal(m.rig.bones.get('trunk7')!.localToWorld(new Vector3(0,.015,.06)));sources.push({tip,body:mesh.position.clone(),heading:mesh.rotation.y,progress:bath.sprayProgress});}bounds(id);}
  if(sources.length&&!reducedMotion&&!low&&!spray){spray=createElephantSpray();group.add(spray.mesh);}spray?.update(sources,reducedMotion||low);
 },dispose(){if(disposed)return;disposed=true;if(spray){group.remove(spray.mesh);spray.dispose();spray=undefined;}consumption.dispose();careResources=[];for(const id of [...models.keys()])remove(id);material?.dispose();material=undefined;group.clear();},inspect:()=>({...consumption.inspect(),elephantSprayCount:spray?.inspect().elephantSprayCount??0,elephantSprayGeometries:spray?.inspect().elephantSprayGeometries??0,elephantSprayMaterials:spray?.inspect().elephantSprayMaterials??0,liveElephantModels:models.size,elephantResidentGeometries:models.size,elephantResidentMaterials:material?1:0,elephantResidentTriangles:[...models.values()].reduce((n,m)=>n+m.rig.triangles,0),elephantResidentBones:[...models.values()].reduce((n,m)=>n+m.rig.inspect().elephantRigBones,0),elephantResidentSkinnedDraws:models.size,elephantResidentBoneTextures:[...models.values()].filter(m=>m.rig.skeleton.boneTexture).length,elephantResidentsSceneDisposed:disposed})};
}
