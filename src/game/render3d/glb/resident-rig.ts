import {Box3,MeshStandardMaterial,Quaternion,Sphere,Vector3} from 'three';
import {applyAnimalPose,stabilizeFeet,type AnimalSpecies,type Gait} from './articulation.ts';
import type {AnimalLibrary} from './animal-library.ts';
import {createFootPlants} from './foot-plants.ts';
interface Frame extends Gait {behavior:string;timeMs:number;reduced?:boolean;}
const envelopes:Record<AnimalSpecies,[number[],number[]]>={zebra:[[-.85,-.02,-.9],[.85,1.95,1.3]],giraffe:[[-.75,-.02,-1],[.75,3.4,1.9]],elephant:[[-1,-.02,-1.3],[1,2.25,2.2]],lion:[[-.5,-.02,-1.2],[.5,1.1,.95]],macaw:[[-.95,-.55,-.65],[.95,1.6,.9]]};

/** Loaded geometry/materials are borrowed; this resident owns its bones and transition state. */
export function createGLBResidentRig(library:AnimalLibrary,species:AnimalSpecies,variant:string,residentId:string,low:boolean){
 const id=library.modelId(species,variant,low);if(!library.ensure(id))return undefined;
 const instance=library.instantiate(id,residentId),{mesh,bones}=instance,skeleton=mesh.skeleton,geometry=mesh.geometry,triangles=(geometry.index?.count??geometry.getAttribute('position').count)/3;
 if(!(mesh.material instanceof MeshStandardMaterial))throw Error('Unsupported original animal material');const material=mesh.material;
 const bounds=envelopes[species];mesh.boundingBox=new Box3(new Vector3(...bounds[0]),new Vector3(...bounds[1]));mesh.boundingSphere=mesh.boundingBox.getBoundingSphere(new Sphere());mesh.frustumCulled=false;
 let disposed=false,frame:Frame={behavior:'idle',timeMs:0},behavior='',changed=0,seen=false;const plants=species==='macaw'?null:createFootPlants(species),from=new Map<string,{position:Vector3;rotation:Quaternion;scale:Vector3}>();
 function setFrame(value:Frame){if(disposed)return;frame={...value};const token=value.behavior+'|'+Boolean(value.moving)+'|'+Boolean(value.trot);if(token!==behavior){from.clear();if(seen)for(const [name,bone]of bones)from.set(name,{position:bone.position.clone(),rotation:bone.quaternion.clone(),scale:bone.scale.clone()});behavior=token;changed=value.timeMs;}}
 function apply(p:object={}){if(disposed)return;applyAnimalPose(species,mesh,bones,p as Parameters<typeof applyAnimalPose>[3]);if(species!=='macaw'&&frame.moving&&plants)stabilizeFeet(species,mesh,bones,{...frame,...plants.update(mesh,frame)});else plants?.clear();const elapsed=Math.max(0,frame.timeMs-changed),t=Math.min(1,elapsed/280),blend=t*t*(3-2*t);if(from.size&&t<1){for(const [name,before]of from){const bone=bones.get(name)!;bone.position.lerpVectors(before.position,bone.position,blend);bone.quaternion.copy(before.rotation.clone().slerp(bone.quaternion,blend));bone.scale.lerpVectors(before.scale,bone.scale,blend);}}else from.clear();seen=true;mesh.updateMatrixWorld(true);skeleton.update();}
 function dispose(){if(disposed)return;disposed=true;from.clear();plants?.clear();library.release(instance);}
 function captureState(){const clonePose=(values:typeof from)=>new Map([...values].map(([name,p])=>[name,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()}]));return{frame:{...frame},behavior,changed,seen,from:clonePose(from),posed:new Map([...bones].map(([name,b])=>[name,{position:b.position.clone(),rotation:b.quaternion.clone(),scale:b.scale.clone()}])),plants:plants?.capture()};}
 function restoreState(state:ReturnType<typeof captureState>){frame={...state.frame};behavior=state.behavior;changed=state.changed;seen=state.seen;from.clear();for(const[name,p]of state.from)from.set(name,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()});for(const[name,p]of state.posed){const b=bones.get(name);if(b){b.position.copy(p.position);b.quaternion.copy(p.rotation);b.scale.copy(p.scale);}}if(state.plants)plants?.restore(state.plants);mesh.updateMatrixWorld(true);skeleton.update();}
 return{mesh,root:mesh,bones,skeleton,geometry,material,triangles,parts:{} as Record<string,number>,apply,setFrame,dispose,captureState,restoreState,sourceId:id,inspect:()=>({bones:disposed?0:bones.size,disposed,glbTransitioning:from.size>0,elephantRigDisposed:disposed,elephantRigBones:disposed?0:bones.size,elephantRigTriangles:triangles,elephantRigSkinnedDraws:disposed?0:1,elephantRigBoneTexture:Boolean(skeleton.boneTexture),elephantRigMaterialBorrowed:true})};
}
export type GLBResidentRig=NonNullable<ReturnType<typeof createGLBResidentRig>>;
