import {Bone,Box3,BufferGeometry,CylinderGeometry,Float32BufferAttribute,MeshStandardMaterial,Skeleton,SkinnedMesh,Sphere,SphereGeometry,Uint16BufferAttribute,Vector3,IcosahedronGeometry} from 'three';
import {Batch} from '../tropical-diorama.ts';
type V=[number,number,number];
export const GIRAFFE_LEGS=['foreLeft','foreRight','hindLeft','hindRight'] as const;
const joints:{name:string;parent:string|null;at:V}[]=[{name:'root',parent:null,at:[0,0,0]},{name:'body',parent:'root',at:[0,1.3,0]},{name:'neckLower',parent:'body',at:[0,1.5,.25]},{name:'neckUpper',parent:'neckLower',at:[0,2.15,.25]},{name:'head',parent:'neckUpper',at:[0,2.8,.25]},{name:'jaw',parent:'head',at:[0,2.72,.48]},{name:'tail',parent:'body',at:[0,1.3,-.43]}];
for(const [i,name] of GIRAFFE_LEGS.entries()){const x=i%2?-.18:.18,z=i<2?.30:-.34;joints.push({name,parent:'root',at:[x,1.25,z]},{name:name+'Knee',parent:name,at:[x,.62,z]},{name:name+'Hoof',parent:name+'Knee',at:[x,.07,z+.02]});}
/** Original adult Giraffa spp. topology/coat; no downloaded textures, photos or models. */
export function createGiraffeGeometry(){
 const batch=new Batch(),indices:number[]=[],weights:number[]=[],parts:Record<string,number>={};
 const add=(name:string,geometry:BufferGeometry,color:string,at:V,scale:V,joint='body')=>{const start=batch.positions.length/3;batch.add(geometry,color,at,scale);const count=batch.positions.length/3-start,index=joints.findIndex(j=>j.name===joint);for(let i=0;i<count;i++){indices.push(index,0,0,0);weights.push(1,0,0,0);}parts[name]=(parts[name]??0)+count/3;};
 const oval=(name:string,color:string,at:V,size:V,joint='body',segments=8,rings=5)=>add(name,new SphereGeometry(1,segments,rings),color,at,size,joint);
 const coat='#dfbc72',cream='#f1dca3',patch='#95603a',dark='#3e3026';
 oval('sloping torso',coat,[0,1.32,-.03],[.25,.31,.49]);oval('high shoulder',coat,[0,1.48,.24],[.22,.28,.23]);
 add('lower long neck',new CylinderGeometry(.115,.17,.65,9),coat,[0,1.825,.25],[1,1,1],'neckLower');
 add('upper long neck',new CylinderGeometry(.085,.115,.65,9),coat,[0,2.475,.25],[1,1,1],'neckUpper');
 oval('small head',coat,[0,2.8,.28],[.13,.15,.19],'head',10,6);oval('long muzzle',cream,[0,2.75,.47],[.10,.085,.18],'head');oval('lower jaw',cream,[0,2.69,.46],[.085,.035,.16],'jaw');
 for(const sign of [-1,1]){oval('large ears',coat,[sign*.20,2.9,.19],[.13,.045,.075],'head');oval('ear centers',patch,[sign*.205,2.913,.20],[.085,.015,.05],'head');add('paired ossicones',new CylinderGeometry(.018,.025,.18,6),coat,[sign*.065,3.02,.23],[1,1,1],'head');oval('ossicone tips',dark,[sign*.065,3.115,.23],[.028,.035,.028],'head',6,4);oval('eyes',dark,[sign*.112,2.84,.38],[.021,.025,.023],'head',7,4);oval('eye glint','#fff3d7',[sign*.12,2.848,.39],[.006,.008,.007],'head',5,3);oval('nostrils',dark,[sign*.05,2.78,.61],[.018,.012,.012],'head',6,4);}
 // Deterministic original coat islands; deliberately not a subspecies identification.
 for(const sign of [-1,1])for(let i=0;i<16;i++){const z=-.38+(i%5)*.17,y=1.16+Math.floor(i/5)*.14;oval('coat patches',patch,[sign*.238,y,z],[.018,.052+(i%3)*.008,.065], 'body',6,4);}
 for(let i=0;i<10;i++){const upper=i>=5,y=1.55+(i%5)*.12+(upper?.65:0),joint=upper?'neckUpper':'neckLower';for(const sign of [-1,1])oval('neck patches',patch,[sign*(upper?.09:.125),y,.25+(i%2?.035:-.035)],[.018,.045,.055],joint,6,4);add('short mane',new IcosahedronGeometry(.03,0),dark,[0,y,.13],[.5,1.4,.6],joint);}
 for(const [i,name] of GIRAFFE_LEGS.entries()){const x=i%2?-.18:.18,z=i<2?.30:-.34;add('slender upper legs',new CylinderGeometry(.045,.065,.63,7),coat,[x,.935,z],[1,1,1],name);oval('knees',patch,[x,.62,z],[.047,.055,.048],name+'Knee',7,4);add('slender lower legs',new CylinderGeometry(.027,.039,.55,7),cream,[x,.345,z],[1,1,1],name+'Knee');oval('cloven hooves',dark,[x,.065,z+.03],[.055,.06,.08],name+'Hoof',7,4);}
 add('long tail',new CylinderGeometry(.015,.023,.62,6).rotateX(.45),coat,[0,1.05,-.56],[1,1,1],'tail');oval('tail tuft',dark,[0,.77,-.70],[.04,.11,.04],'tail',7,4);
 const geometry=batch.geometry();geometry.setAttribute('skinIndex',new Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));geometry.name='Original shared adult female giraffe';geometry.userData={provenance:'Original procedural geometry and coat; no external assets',species:'Giraffa spp.',sex:'female',parts};return {geometry,parts,triangles:batch.positions.length/9};
}
export interface GiraffePose {mouth?:{y:number;z:number};headPitch?:number;headYaw?:number;jaw?:number;tail?:number;bodyDrop?:number;spread?:number;legs?:number[];knees?:number[];}
/** Two-link neck IK reaches the real service presentation point. Borrows assets, owns skeleton only. */
export function createGiraffeRig(geometry:BufferGeometry,material:MeshStandardMaterial){
 const mesh=new SkinnedMesh(geometry,material),bones=new Map<string,Bone>();let disposed=false;
 for(const j of joints){const bone=new Bone();bone.name=j.name;bone.position.set(...j.at);if(j.parent){const parent=joints.find(p=>p.name===j.parent)!;bone.position.sub(new Vector3(...parent.at));bones.get(j.parent)!.add(bone);}else mesh.add(bone);bones.set(j.name,bone);}
 mesh.updateMatrixWorld(true);const skeleton=new Skeleton([...bones.values()]);mesh.bind(skeleton);mesh.normalizeSkinWeights();mesh.castShadow=true;mesh.receiveShadow=true;mesh.boundingBox=new Box3(new Vector3(-.5,0,-.85),new Vector3(.5,3.2,1.35));mesh.boundingSphere=mesh.boundingBox.getBoundingSphere(new Sphere());
 function apply(p:GiraffePose={}){if(disposed)return;for(const bone of bones.values())bone.rotation.set(0,0,0);const drop=p.bodyDrop??0,headPitch=p.headPitch??0;let lower=0,upper=0;
  if(p.mouth){const muzzleY=-.08*Math.cos(headPitch)-.36*Math.sin(headPitch),muzzleZ=-.08*Math.sin(headPitch)+.36*Math.cos(headPitch),dy=p.mouth.y-muzzleY-(1.5+drop),dz=p.mouth.z-muzzleZ-.25,d=Math.max(.05,Math.min(1.299,Math.hypot(dy,dz))),bend=Math.acos(Math.max(-1,Math.min(1,(d*d-2*.65*.65)/(2*.65*.65))));lower=Math.atan2(dz,dy)-bend/2;upper=bend;}
  bones.get('body')!.position.y=1.3+drop;bones.get('neckLower')!.rotation.x=lower;bones.get('neckUpper')!.rotation.x=upper;bones.get('head')!.rotation.set(headPitch-lower-upper,p.headYaw??0,0);bones.get('jaw')!.rotation.x=p.jaw??0;bones.get('tail')!.rotation.z=p.tail??0;
  for(const [i,name] of GIRAFFE_LEGS.entries()){const leg=bones.get(name)!,spread=i<2?(i%2?-1:1)*(p.spread??0):0;let hip=p.legs?.[i]??0,knee=p.knees?.[i]??0;
   // When the body lowers, flex the limbs while keeping the actual hooves above ground.
   if(drop<0){const down=(1.25+drop-.07)/Math.cos(spread),d=Math.min(1.1799,Math.hypot(down,.02));knee=Math.acos(Math.max(-1,Math.min(1,(d*d-.63*.63-.55*.55)/(2*.63*.55))));hip=Math.atan2(-.02,down)-Math.atan2(.55*Math.sin(knee),.63+.55*Math.cos(knee));}
   leg.position.y=1.25+drop;leg.rotation.set(hip,0,spread);bones.get(name+'Knee')!.rotation.x=knee;bones.get(name+'Hoof')!.rotation.set(-hip-knee,0,-spread);
  }
  mesh.updateMatrixWorld(true);skeleton.update();
 }
 apply();return {mesh,bones,skeleton,apply,dispose(){if(disposed)return;disposed=true;skeleton.dispose();mesh.clear();},inspect:()=>({bones:bones.size,disposed})};
}
