import {Box3,Group} from 'three';
import type {ZebraAnimal} from '../../core/zebra-state.ts';
import type {GiraffeAnimal} from '../../core/giraffe-state.ts';
import type {LionAnimal} from '../../core/species.ts';
import type {LionHabitat,LionResource} from '../../core/species.ts';
import type {RuntimeWorld} from '../../core/state.ts';
import {lionGroundHeight} from '../../animals/lions/ground.ts';
import {ZEBRA_GROUND} from '../../animals/zebras/rules.ts';
import {sceneOrigin} from '../../world/scene-coordinates.ts';
import type {SceneCatalog,SceneIdentity} from '../scene-selection.ts';
import {zebraPose} from '../zebra/residents-scene.ts';
import {giraffePose} from '../giraffe/residents-scene.ts';
import {lionPose} from '../lion/residents-scene.ts';
import type {AnimalLibrary} from './animal-library.ts';
import {createGLBResidentRig,type GLBResidentRig} from './resident-rig.ts';

type Species='zebra'|'giraffe'|'lion';
type Animal=ZebraAnimal|GiraffeAnimal|LionAnimal;
function createResidents(species:Species,limit:number,catalog:SceneCatalog,library:AnimalLibrary){
 const group=new Group();group.name=species+' retained GLB residents';
 const models=new Map<string,{rig:GLBResidentRig;current:Animal;previous:Animal;pivot:number;previousPivot:number;entry:SceneCatalog['batches'][number]}>();let disposed=false,origin={x:6,z:5},terrain:{resources:LionResource[];habitat:LionHabitat}|undefined;
 const groundHeight=(x:number,z:number)=>terrain?.habitat?.kind==='lion-savanna'?.079+lionGroundHeight({resources:terrain.resources},terrain.habitat,{x:x+origin.x,z:z+origin.z}):.079;
 function remove(id:string){const old=models.get(id);if(!old)return;catalog.batches=catalog.batches.filter(b=>b!==old.entry);catalog.identities.delete(id);catalog.bounds.delete(id);group.remove(old.rig.mesh);old.rig.dispose();models.delete(id);}
 function syncCommon(animals:readonly Animal[],width:number,height:number,low=false,previous?:readonly Animal[],world?:RuntimeWorld){
  if(disposed)return;origin=sceneOrigin({width,height});if(world&&species==='lion'){const habitat=world.habitats.find((h):h is LionHabitat=>h.kind==='lion-savanna');terrain=habitat?{habitat,resources:world.resources.filter((r):r is LionResource=>r.kind.startsWith('lion-'))}:undefined;}for(const id of models.keys())if(!animals.some(a=>a.id===id))remove(id);
  for(const [ordinal,a]of animals.slice(0,limit).entries()){
   const variant=a.id.slice(species.length+1),wanted=library.modelId(species,variant,low);let m=models.get(a.id);
   let carried:typeof m,visual:ReturnType<GLBResidentRig['captureState']>|undefined;if(m&&m.rig.sourceId!==wanted&&library.ensure(wanted)){carried=m;visual=m.rig.captureState();remove(a.id);m=undefined;}
   if(!m){const rig=createGLBResidentRig(library,species,variant,a.id,low);if(!rig)continue;if(visual)rig.restoreState(visual);const entry={mesh:rig.mesh,ranges:[{first:0,count:rig.triangles,id:a.id}]};m={rig,entry,previous:structuredClone(carried?.previous??a),current:structuredClone(carried?.current??a),pivot:carried?.pivot??0,previousPivot:carried?.previousPivot??0};models.set(a.id,m);catalog.batches.push(entry);group.add(rig.mesh);}
   m.previousPivot=m.pivot;const step=Math.hypot(a.position.x-m.current.position.x,a.position.z-m.current.position.z),turn=Math.abs(Math.atan2(Math.sin(a.motion.heading-m.current.motion.heading),Math.cos(a.motion.heading-m.current.motion.heading)));if(step<1e-8)m.pivot+=turn;
   m.previous=structuredClone(previous?.find(p=>p.id===a.id)??m.current);m.current=structuredClone(a);
   const identity:SceneIdentity={id:a.id,category:'object',kind:species,residentName:a.name,ordinal:ordinal+1,cell:{x:Math.floor(a.position.x),z:Math.floor(a.position.z)}};
   if(species!=='zebra')identity.residentNeeds={hunger:Math.round(a.hunger),thirst:Math.round(a.thirst),welfare:a.welfare,energy:Math.round(a.energy),enrichment:Math.round(a.enrichment),socialComfort:Math.round(a.socialComfort),behavior:a.currentBehavior as NonNullable<SceneIdentity['residentNeeds']>['behavior'],backing:false};
   catalog.identities.set(a.id,identity);
  }
 }
 function update(alpha:number,timeMs=0,reduced=false){if(disposed)return;const t=Math.max(0,Math.min(1,Number.isFinite(alpha)?alpha:0));for(const [id,m]of models){
  const a=m.current,p=m.previous,mesh=m.rig.mesh,elevation=species==='lion'?(p as LionAnimal).motion.elevation+((a as LionAnimal).motion.elevation-(p as LionAnimal).motion.elevation)*t:0;
  mesh.position.set(p.position.x+(a.position.x-p.position.x)*t-origin.x,.079+elevation,p.position.z+(a.position.z-p.position.z)*t-origin.z);mesh.rotation.y=p.motion.heading+Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))*t;
  if(species==='lion'&&terrain){const x=mesh.position.x,z=mesh.position.z,dx=Math.sin(mesh.rotation.y)*.1,dz=Math.cos(mesh.rotation.y)*.1,grade=Math.max(-.4,Math.min(.4,(groundHeight(x+dx,z+dz)-groundHeight(x-dx,z-dz))/.2));mesh.rotation.set(-Math.atan(grade),mesh.rotation.y,0,'YXZ');}
  const step=Math.hypot(a.position.x-p.position.x,a.position.z-p.position.z),turn=Math.abs(Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))),linear=step>1e-8||Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z)>1e-8,moving=linear||turn>1e-8,trot=species==='zebra'&&(a.currentBehavior==='trot'||a.currentBehavior==='follow-herd'&&Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z)>ZEBRA_GROUND.speed+.005),distance=p.motion.distanceWalked+(a.motion.distanceWalked-p.motion.distanceWalked)*t+m.previousPivot+(m.pivot-m.previousPivot)*t;
  m.rig.setFrame({behavior:a.currentBehavior,timeMs,reduced,moving,trot,distance,strength:linear?1:.35,groundHeight:species==='lion'&&terrain?groundHeight:undefined,reverse:(a.position.x-p.position.x)*Math.sin(mesh.rotation.y)+(a.position.z-p.position.z)*Math.cos(mesh.rotation.y)<-1e-8});
  m.rig.apply(species==='zebra'?zebraPose(p as ZebraAnimal,a as ZebraAnimal,t,timeMs,reduced):species==='giraffe'?giraffePose(p as GiraffeAnimal,a as GiraffeAnimal,t,timeMs,reduced):lionPose(p as LionAnimal,a as LionAnimal,t,timeMs,reduced));
  catalog.bounds.set(id,new Box3().copy(mesh.boundingBox!).applyMatrix4(mesh.matrixWorld));
 }}
 function dispose(){if(disposed)return;disposed=true;terrain=undefined;for(const id of [...models.keys()])remove(id);group.clear();}
 function stats(){const rigs=[...models.values()].map(m=>m.rig);return{count:rigs.length,geometries:new Set(rigs.map(r=>r.geometry)).size,materials:new Set(rigs.map(r=>r.material)).size,bones:rigs.reduce((n,r)=>n+r.bones.size,0),triangles:rigs.reduce((n,r)=>n+r.triangles,0),disposed};}
 return{group,syncCommon,update,dispose,stats};
}

export function createGLBZebraResidentsScene(catalog:SceneCatalog,library:AnimalLibrary){const scene=createResidents('zebra',4,catalog,library);return{group:scene.group,sync:(animals:readonly ZebraAnimal[],width:number,height:number,low=false,previous?:readonly ZebraAnimal[])=>scene.syncCommon(animals,width,height,low,previous),update:scene.update,dispose:scene.dispose,inspect(){const s=scene.stats();return{liveZebraModels:s.count,zebraGeometries:s.geometries,zebraMaterials:s.materials,zebraBones:s.bones,zebraTriangles:s.triangles,zebraSceneDisposed:s.disposed};}};}
export function createGLBGiraffeResidentsScene(catalog:SceneCatalog,library:AnimalLibrary){const scene=createResidents('giraffe',3,catalog,library);return{group:scene.group,sync:(animals:readonly GiraffeAnimal[],width:number,height:number,low=false)=>scene.syncCommon(animals,width,height,low),update:scene.update,dispose:scene.dispose,inspect(){const s=scene.stats();return{liveGiraffeModels:s.count,giraffeGeometries:s.geometries,giraffeActiveGeometries:s.geometries,giraffeMaterials:s.materials,giraffeDraws:s.count,giraffeBones:s.bones,giraffeTriangles:s.triangles,giraffeSceneDisposed:s.disposed};}};}
export function createGLBLionResidentsScene(catalog:SceneCatalog,library:AnimalLibrary){const scene=createResidents('lion',3,catalog,library);return{group:scene.group,sync:(animals:readonly LionAnimal[],width:number,height:number,low=false,world?:RuntimeWorld)=>scene.syncCommon(animals,width,height,low,undefined,world),update:scene.update,dispose:scene.dispose,inspect(){const s=scene.stats();return{liveLionModels:s.count,lionGeometries:s.geometries,lionMaterials:s.materials,lionDraws:s.count,lionBones:s.bones,lionTriangles:s.triangles,lionSceneDisposed:s.disposed};}};}
