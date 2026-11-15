import {createGLBResidentRig,type GLBResidentRig} from './glb/resident-rig.ts';
import type {AnimalLibrary} from './glb/animal-library.ts';
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
export function createElephantResidentsScene(catalog:SceneCatalog,library?:AnimalLibrary){
 const group=new Group();group.name='Ayu and Nara residents';let disposed=false,material:MeshStandardMaterial|undefined,originX=6,originZ=5;const consumption=createElephantConsumptionAnimator();let careResources:ElephantResource[]=[];let spray:ReturnType<typeof createElephantSpray>|undefined;
 const models=new Map<string,{rig:ReturnType<typeof createElephantRig>|GLBResidentRig;distance:number;previousDistance:number;previous:ElephantAnimal;current:ElephantAnimal;entry:SceneCatalog['batches'][number]}>();
 function bounds(id:string){const m=models.get(id);if(m)catalog.bounds.set(id,new Box3().copy(m.rig.mesh.boundingBox!).applyMatrix4(m.rig.mesh.matrixWorld));}
 function remove(id:string){const m=models.get(id);if(!m)return;catalog.batches=catalog.batches.filter(b=>b!==m.entry);catalog.identities.delete(id);catalog.bounds.delete(id);group.remove(m.rig.mesh);m.rig.dispose();models.delete(id);}
 return {group,sync(animals:ElephantAnimal[],width:number,height:number,resources:readonly ElephantResource[]=[],low=false){
  if(disposed)return;careResources=structuredClone([...resources]);const active=animals.slice(0,ELEPHANT_ART.maxResidents);for(const id of models.keys())if(!active.some(a=>a.id===id))remove(id);
  if(!library&&active.length&&!material)material=new MeshStandardMaterial({vertexColors:true,roughness:.97});
  const origin=sceneOrigin({width,height});originX=origin.x;originZ=origin.z;
  for(const [ordinal,a]of active.entries()){
   let m=models.get(a.id),carried:typeof m,visual:ReturnType<GLBResidentRig['captureState']>|undefined;const variant=a.id.slice('elephant-'.length),wanted=library?.modelId('elephant',variant,low);if(library&&m&&'sourceId'in m.rig&&m.rig.sourceId!==wanted&&library.ensure(wanted!)){carried=m;visual=m.rig.captureState();remove(a.id);m=undefined;}if(!m){const rig=library?createGLBResidentRig(library,'elephant',variant,a.id,low):createElephantRig(a.name,material!);if(!rig)continue;if(visual&&'restoreState'in rig)rig.restoreState(visual);rig.mesh.name=a.id;rig.mesh.scale.setScalar(a.name==='Nara'?ELEPHANT_ART.scaleNara:ELEPHANT_ART.scaleAyu);const entry={mesh:rig.mesh,ranges:[{first:0,count:rig.triangles,id:a.id}]};m={rig,entry,distance:carried?.distance??0,previousDistance:carried?.previousDistance??0,previous:structuredClone(carried?.previous??a),current:structuredClone(carried?.current??a)};models.set(a.id,m);catalog.batches.push(entry);group.add(rig.mesh);}
   const step=Math.hypot(a.position.x-m.current.position.x,a.position.z-m.current.position.z),turn=Math.abs(Math.atan2(Math.sin(a.motion.heading-m.current.motion.heading),Math.cos(a.motion.heading-m.current.motion.heading)));m.previousDistance=m.distance;m.distance+=step+(step<1e-8?turn:0);m.previous=m.current;m.current=structuredClone(a);const mesh=m.rig.mesh;mesh.position.set(a.position.x-origin.x,.079,a.position.z-origin.z);mesh.rotation.y=a.motion.heading;mesh.updateMatrixWorld(true);m.rig.skeleton.update();
   catalog.identities.set(a.id,{id:a.id,category:'object',kind:'elephant',residentName:a.name,residentNeeds:{hunger:Math.round(a.hunger),thirst:Math.round(a.thirst),welfare:a.welfare,energy:Math.round(a.energy),enrichment:Math.round(a.enrichment),socialComfort:Math.round(a.socialComfort),behavior:a.currentBehavior,backing:Boolean(a.motion.backing)},ordinal:ordinal+1,cell:{x:Math.floor(a.position.x),z:Math.floor(a.position.z)}});bounds(a.id);
  }
  if(!models.size&&spray){group.remove(spray.mesh);spray.dispose();spray=undefined;}if(!models.size&&material){material.dispose();material=undefined;}
 },update(alpha:number,timeMs=0,reducedMotion=true,low=false){
  if(disposed)return;const t=Number.isFinite(alpha)?Math.max(0,Math.min(1,alpha)):0;
  const sources:ElephantSpraySource[]=[];for(const [id,m]of models){const a=m.current,p=m.previous,mesh=m.rig.mesh,x=p.position.x+(a.position.x-p.position.x)*t,z=p.position.z+(a.position.z-p.position.z)*t;mesh.position.set(x-originX,.079,z-originZ);mesh.rotation.y=p.motion.heading+Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))*t;const companion=Math.min(Infinity,...[...models.values()].filter(other=>other!==m).map(other=>Math.hypot(x-other.previous.position.x-(other.current.position.x-other.previous.position.x)*t,z-other.previous.position.z-(other.current.position.z-other.previous.position.z)*t)));const base={...elephantAmbientPose(timeMs,a.name,reducedMotion),...elephantLocomotionPose(p,a,t,companion,reducedMotion)};const bath=elephantBathFrame(p,a,careResources,t,base,consumption.target);if('setFrame'in m.rig){const linear=Math.hypot(a.position.x-p.position.x,a.position.z-p.position.z)>1e-8||Math.hypot(a.motion.lastStep?.x??0,a.motion.lastStep?.z??0)>1e-8,turn=Math.abs(Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading)));m.rig.setFrame({behavior:a.currentBehavior,timeMs,reduced:reducedMotion,distance:m.previousDistance+(m.distance-m.previousDistance)*t,moving:linear||turn>1e-8,strength:linear?1:.35,reverse:Boolean(a.motion.backing)});}m.rig.apply({...base,...consumption.pose(p,a,careResources,t,base,reducedMotion),...bath?.pose,...elephantEnrichmentPose(p,a,careResources,t,consumption.target),...elephantSocialPose(p,a,models.get(a.motion.partnerId??'')?.previous,models.get(a.motion.partnerId??'')?.current,t,base,consumption.target)});if(bath?.sprayProgress!==null&&bath?.sprayProgress!==undefined){const tip=group.worldToLocal(m.rig.bones.get('trunk7')!.localToWorld(new Vector3(0,.015,.06)));sources.push({tip,body:mesh.position.clone(),heading:mesh.rotation.y,progress:bath.sprayProgress});}bounds(id);}
  if(sources.length&&!reducedMotion&&!low&&!spray){spray=createElephantSpray();group.add(spray.mesh);}spray?.update(sources,reducedMotion||low);
 },dispose(){if(disposed)return;disposed=true;if(spray){group.remove(spray.mesh);spray.dispose();spray=undefined;}consumption.dispose();careResources=[];for(const id of [...models.keys()])remove(id);material?.dispose();material=undefined;group.clear();},inspect:()=>({...consumption.inspect(),elephantSprayCount:spray?.inspect().elephantSprayCount??0,elephantSprayGeometries:spray?.inspect().elephantSprayGeometries??0,elephantSprayMaterials:spray?.inspect().elephantSprayMaterials??0,liveElephantModels:models.size,elephantResidentGeometries:models.size,elephantResidentMaterials:library?new Set([...models.values()].map(m=>m.rig.mesh.material)).size:material?1:0,elephantResidentTriangles:[...models.values()].reduce((n,m)=>n+m.rig.triangles,0),elephantResidentBones:[...models.values()].reduce((n,m)=>n+m.rig.inspect().elephantRigBones,0),elephantResidentSkinnedDraws:models.size,elephantResidentBoneTextures:[...models.values()].filter(m=>m.rig.skeleton.boneTexture).length,elephantResidentsSceneDisposed:disposed})};
}
