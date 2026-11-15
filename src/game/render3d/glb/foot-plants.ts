import {Quaternion,Vector3,type SkinnedMesh} from 'three';
import {sampleFootTargets,type AnimalSpecies,type Gait} from './articulation.ts';
type Plant={point:Vector3;rotation:Quaternion;stance:boolean;cycle:number};
/** Cosmetic world anchors prevent stance drift during curved paths and reverse steps. */
export function createFootPlants(species:Exclude<AnimalSpecies,'macaw'>){
 const plants:Array<Plant|undefined>=[];let lastDistance:number|undefined;
 function clear(){plants.length=0;lastDistance=undefined;}
 function update(mesh:SkinnedMesh,gait:Gait){
  mesh.updateMatrixWorld(true);const samples=sampleFootTargets(species,gait),rotation=mesh.getWorldQuaternion(new Quaternion()),inverse=rotation.clone().invert(),scale=mesh.getWorldScale(new Vector3()).y,targets:Vector3[]=[],footRotations:Quaternion[]=[];
  const up=new Vector3(0,1,0).applyQuaternion(rotation);
  function grounded(point:Vector3,footY:number){if(!gait.groundHeight)return{point,rotation:rotation.clone()};const sole=point.clone().addScaledVector(up,-footY*scale),e=.025,height=gait.groundHeight(sole.x,sole.z),normal=new Vector3(-(gait.groundHeight(sole.x+e,sole.z)-gait.groundHeight(sole.x-e,sole.z))/(2*e),1,-(gait.groundHeight(sole.x,sole.z+e)-gait.groundHeight(sole.x,sole.z-e))/(2*e)).normalize();sole.y=height;return{point:sole.addScaledVector(normal,footY*scale),rotation:new Quaternion().setFromUnitVectors(up,normal).multiply(rotation)};}
  if(!gait.moving||lastDistance!==undefined&&Math.abs((gait.distance??0)-lastDistance)>samples[0]!.duration*1.5)plants.length=0;
  for(const [i,sample]of samples.entries()){
   const ideal=grounded(mesh.localToWorld(sample.point.clone()),sample.footY);let plant=plants[i];
   if(!plant||sample.stance&&(!plant.stance||plant.cycle!==sample.cycle)){const start=sample.point.clone();if(!sample.stance){start.y=sample.footY;start.z=sample.baseZ-sample.forwardPlant-(sample.phase-sample.duty)*sample.duration*(gait.reverse?-1:1)*(gait.strength??1);}const first=sample.stance?ideal:grounded(mesh.localToWorld(start),sample.footY);plant={point:first.point.clone(),rotation:first.rotation,stance:sample.stance,cycle:sample.cycle};plants[i]=plant;}
   let worldPoint:Vector3,worldRotation:Quaternion;
   if(sample.stance){worldPoint=plant.point.clone();worldRotation=plant.rotation.clone();}
   else{
    const t=Math.min(1,sample.swingMix),smooth=t*t*(3-2*t),remaining=(1-sample.phase)*sample.duration*(gait.reverse?-1:1)*(gait.strength??1),landing=sample.point.clone();landing.y=sample.footY;landing.z=sample.baseZ+sample.forwardPlant+remaining;
    const end=grounded(mesh.localToWorld(landing),sample.footY);worldPoint=plant.point.clone().lerp(end.point,smooth);worldPoint.y+=Math.sin(Math.PI*t)*sample.lift*scale;worldRotation=plant.rotation.clone().slerp(end.rotation,smooth);
   }
   plant.stance=sample.stance;plant.cycle=sample.cycle;targets.push(mesh.worldToLocal(worldPoint));footRotations.push(inverse.clone().multiply(worldRotation));
  }
  lastDistance=gait.distance??0;return{targets,footRotations};
 }
 function capture(){return{lastDistance,plants:plants.map(p=>p?{...p,point:p.point.clone(),rotation:p.rotation.clone()}:undefined)};}
 function restore(state:ReturnType<typeof capture>){clear();lastDistance=state.lastDistance;for(const p of state.plants)plants.push(p?{...p,point:p.point.clone(),rotation:p.rotation.clone()}:undefined);}
 return{update,clear,capture,restore};
}
