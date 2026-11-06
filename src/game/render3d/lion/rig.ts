import {Bone,Box3,BufferGeometry,CylinderGeometry,Float32BufferAttribute,MeshStandardMaterial,Skeleton,SkinnedMesh,Sphere,SphereGeometry,Uint16BufferAttribute,Vector3} from 'three';
import {Batch} from '../tropical-diorama.ts';
type V=[number,number,number];
export const LION_LEGS=['foreLeft','foreRight','hindLeft','hindRight'] as const;
const joints:{name:string;parent:string|null;at:V}[]=[{name:'root',parent:null,at:[0,0,0]},{name:'body',parent:'root',at:[0,.4,0]},{name:'head',parent:'body',at:[0,.59,.24]},{name:'jaw',parent:'head',at:[0,.5,.37]},{name:'tail',parent:'body',at:[0,.4,-.3]}];
for(const [i,name] of LION_LEGS.entries()){const x=i%2?-.13:.13,z=i<2?.19:-.21;joints.push({name,parent:'root',at:[x,.38,z]},{name:name+'Knee',parent:name,at:[x,.2,z]},{name:name+'Paw',parent:name+'Knee',at:[x,.055,z+.025]});}
/** Original topology, shared by the two female residents. No external model, texture or audio. */
export function createLionGeometry(male:boolean){
 const batch=new Batch(),indices:number[]=[],weights:number[]=[],parts:Record<string,number>={};
 const add=(name:string,source:BufferGeometry,color:string,at:V,scale:V,joint='body')=>{const start=batch.positions.length/3;batch.add(source,color,at,scale);const count=batch.positions.length/3-start,index=joints.findIndex(j=>j.name===joint);for(let i=0;i<count;i++){indices.push(index,0,0,0);weights.push(1,0,0,0);}parts[name]=(parts[name]??0)+count/3;};
 const oval=(name:string,color:string,at:V,size:V,joint='body',segments=10,rings=6)=>add(name,new SphereGeometry(1,segments,rings),color,at,size,joint);
 const coat=male?'#c89650':'#ddbb7e',light='#f1d4a0',dark='#443022';
 oval('muscular torso',coat,[0,.41,-.04],[.19,.21,.31]);oval('shoulders',coat,[0,.46,.16],[.205,.215,.18]);oval('haunches',coat,[0,.4,-.23],[.18,.19,.16]);
 if(male){for(let i=0;i<12;i++){const angle=i*Math.PI/6;oval('faceted mane',i%2?'#80522e':'#986335',[Math.sin(angle)*.15,.56+Math.cos(angle)*.15,.225],[.105,.13,.12],'head',7,5);}oval('mane chest','#89572f',[0,.4,.26],[.18,.22,.115],'head',9,6);}
 oval('skull',coat,[0,.61,.275],[.145,.15,.145],'head',12,8);oval('brow',coat,[0,.66,.33],[.15,.065,.09],'head');
 for(const sign of [-1,1]){oval('rounded ears',coat,[sign*.142,.735,.23],[.066,.071,.033],'head',8,5);oval('ear centers','#8d6444',[sign*.145,.74,.258],[.038,.043,.013],'head',8,5);oval('muzzle',light,[sign*.059,.54,.408],[.07,.054,.083],'head',10,6);oval('eyes',dark,[sign*.098,.641,.387],[.025,.022,.014],'head',8,5);oval('eye glint','#fff5d9',[sign*.102,.648,.398],[.006,.006,.005],'head',6,4);}
 oval('nose','#392820',[0,.566,.475],[.046,.025,.024],'head',8,5);oval('lower jaw',light,[0,.495,.409],[.081,.031,.065],'jaw',10,5);oval('mouth','#62402b',[0,.515,.447],[.068,.008,.022],'jaw',8,4);
 for(const [i,name] of LION_LEGS.entries()){const x=i%2?-.13:.13,z=i<2?.19:-.21;oval('limb muscles',coat,[x,.33,z],[.07,.115,.077],name,8,6);add('lower limbs',new CylinderGeometry(.045,.052,.18,7),coat,[x,.14,z+.005],[1,1,1],name+'Knee');oval('broad paws',light,[x,.045,z+.035],[.067,.044,.09],name+'Paw',8,5);for(const off of [-.025,0,.025])oval('toe seams','#b49365',[x+off,.04,z+.11],[.003,.018,.007],name+'Paw',5,3);}
 add('tail',new CylinderGeometry(.014,.013,.33,6).rotateX(Math.PI/2),coat,[0,.38,-.45],[1,1,1],'tail');oval('tail tuft','#704727',[0,.36,-.63],[.034,.038,.066],'tail',8,5);
 const geometry=batch.geometry();geometry.setAttribute('skinIndex',new Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));geometry.name=male?'Original male lion':'Shared original lioness';geometry.userData={provenance:'Original procedural mesh, no external assets',species:'Panthera leo',sex:male?'male':'female',parts};return {geometry,parts,triangles:batch.positions.length/9};
}
export interface LionPose {headPitch?:number;headYaw?:number;jaw?:number;tail?:number;bodyDrop?:number;bodyBreath?:number;legs?:number[];knees?:number[];}
/** Borrows geometry/material; owns only its skeleton. Scene disposes each shared asset once. */
export function createLionRig(geometry:BufferGeometry,material:MeshStandardMaterial){
 const mesh=new SkinnedMesh(geometry,material),bones=new Map<string,Bone>();let disposed=false;
 for(const j of joints){const bone=new Bone();bone.name=j.name;bone.position.set(...j.at);if(j.parent){const parent=joints.find(p=>p.name===j.parent)!;bone.position.sub(new Vector3(...parent.at));bones.get(j.parent)!.add(bone);}else mesh.add(bone);bones.set(j.name,bone);}
 mesh.updateMatrixWorld(true);const skeleton=new Skeleton([...bones.values()]);mesh.bind(skeleton);mesh.normalizeSkinWeights();mesh.castShadow=true;mesh.receiveShadow=true;mesh.boundingBox=new Box3(new Vector3(-.34,0,-.72),new Vector3(.34,.86,.58));mesh.boundingSphere=mesh.boundingBox.getBoundingSphere(new Sphere());
 const apply=(pose:LionPose={})=>{if(disposed)return;for(const bone of bones.values())bone.rotation.set(0,0,0);const drop=pose.bodyDrop??0;bones.get('body')!.position.y=.4+drop;bones.get('body')!.scale.set(1+(pose.bodyBreath??0),1+(pose.bodyBreath??0),1);bones.get('head')!.rotation.set(pose.headPitch??0,pose.headYaw??0,0);bones.get('jaw')!.rotation.x=pose.jaw??0;bones.get('tail')!.rotation.y=pose.tail??0;for(const [i,name] of LION_LEGS.entries()){bones.get(name)!.position.y=.38+drop;bones.get(name)!.rotation.x=pose.legs?.[i]??0;bones.get(name+'Knee')!.rotation.x=pose.knees?.[i]??0;}mesh.updateMatrixWorld(true);skeleton.update();};apply();
 return {mesh,bones,skeleton,apply,dispose(){if(disposed)return;disposed=true;skeleton.dispose();mesh.clear();},inspect:()=>({bones:bones.size,disposed})};
}
