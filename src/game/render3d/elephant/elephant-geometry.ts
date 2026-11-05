import {BufferGeometry,CatmullRomCurve3,CylinderGeometry,Float32BufferAttribute,SphereGeometry,TubeGeometry,Uint16BufferAttribute,Vector3} from 'three';
import {Batch} from '../tropical-diorama.ts';

type V=[number,number,number];
export interface ElephantJoint {name:string;parent:string|null;at:V;}
const joints:ElephantJoint[]=[{name:'root',parent:null,at:[0,0,0]},{name:'body',parent:'root',at:[0,1.05,0]},{name:'head',parent:'body',at:[0,1.43,.64]}];
for(const [name,sign]of [['earLeft',-1],['earRight',1]]as const)joints.push({name,parent:'head',at:[sign*.35,1.45,.62]});
export const ELEPHANT_LEGS=['foreLeft','foreRight','hindLeft','hindRight']as const;
for(const [i,name]of ELEPHANT_LEGS.entries()){const x=i%2===0?-.35:.35,z=i<2?.43:-.49;joints.push({name,parent:'root',at:[x,.98,z]},{name:name+'Knee',parent:name,at:[x,.53,z]},{name:name+'Foot',parent:name+'Knee',at:[x,.17,z+.025]});}
const trunkCurve=new CatmullRomCurve3([[0,1.41,.96],[0,1.22,1.045],[0,.86,1.09],[0,.57,1.12],[0,.29,1.17],[0,.18,1.25]].map(p=>new Vector3(...p)),false,'centripetal');
export const ELEPHANT_TRUNK=Array.from({length:8},(_,i)=>trunkCurve.getPoint(i/7));
for(const [i,p]of ELEPHANT_TRUNK.entries())joints.push({name:'trunk'+i,parent:i?'trunk'+(i-1):'head',at:p.toArray()as V});
joints.push({name:'tail',parent:'body',at:[0,.98,-.78]},{name:'tailTip',parent:'tail',at:[0,.39,-.99]});
/** Original Asian-elephant topology; anatomical references are facts, never imported assets. */
export const ELEPHANT_JOINTS:readonly ElephantJoint[]=joints;
export const ELEPHANT_ART=Object.freeze({version:'asian-elephant-original-v1',triangleLimit:6000,maxResidents:2,scaleAyu:1,scaleNara:.94,footY:0,boundsMin:[-.88,0,-1.12]as V,boundsMax:[.88,2.28,2.10]as V});
type Weights={a:number;b?:number;blend?:number};

export function createElephantGeometry(name:string){
 const warm=name==='Ayu',palette={skin:warm?'#9b958b':'#8d999e',dark:warm?'#77746b':'#6c7d83',ear:warm?'#b09c8e':'#9ba4a4',crease:warm?'#827d72':'#77868b',nail:'#c3c0af',eye:'#182e2e',shine:'#f1eddb'};
 const batch=new Batch(),indices:number[]=[],weights:number[]=[],parts:Record<string,number>={},joint=(key:string)=>{const i=joints.findIndex(j=>j.name===key);if(i<0)throw Error('Unknown elephant joint '+key);return i;};
 function add(part:string,source:BufferGeometry,color:string,position:V=[0,0,0],scale:V=[1,1,1],binding:string|((p:Vector3)=>Weights)='body'){
  const start=batch.positions.length/3;batch.add(source,color,position,scale);const end=batch.positions.length/3;parts[part]=(parts[part]??0)+(end-start)/3;
  for(let i=start;i<end;i++){const w=typeof binding==='string'?{a:joint(binding)}:binding(new Vector3(...batch.positions.slice(i*3,i*3+3))),blend=w.blend??0;indices.push(w.a,w.b??w.a,0,0);weights.push(1-blend,blend,0,0);}
 }
 const oval=(part:string,color:string,p:V,size:V,binding='body',segments=10,rings=6)=>add(part,new SphereGeometry(1,segments,rings),color,p,size,binding);
 const triangle=(part:string,points:V[],color:string,binding:string)=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points.flat(),3));g.computeVertexNormals();add(part,g,color,[0,0,0],[1,1,1],binding);};
 oval('torso',palette.skin,[0,1.07,-.08],[.55,.55,.82],'body',14,9);
 oval('rump',palette.skin,[0,1.06,-.54],[.49,.49,.45],'body',12,7);
 oval('neck',palette.skin,[0,1.25,.46],[.37,.35,.38],'body',10,6);
 // Sculpt both forehead domes into one skull instead of attaching two separate balls.
 const skull=new SphereGeometry(1,20,14),skullPositions=skull.getAttribute('position');for(let i=0;i<skullPositions.count;i++){const u=skullPositions.getX(i),v=skullPositions.getY(i),w=skullPositions.getZ(i),x=u*.385,top=Math.max(0,v)**3,lobes=Math.exp(-(((x-.145)/.15)**2))+Math.exp(-(((x+.145)/.15)**2)),valley=Math.exp(-((x/.095)**2));skullPositions.setXYZ(i,x,1.43+v*.37+top*(lobes*.10-valley*.065),.69+w*.37);}skull.computeVertexNormals();const headStart=batch.positions.length;add('head',skull,palette.skin,[0,0,0],[1,1,1],'head');parts.foreheadDomes=0;for(let i=headStart;i<batch.positions.length;i+=9)if((batch.positions[i+1]!+batch.positions[i+4]!+batch.positions[i+7]!)/3>1.72)parts.foreheadDomes++;

 for(const side of [-1,1]){
  oval('cheeks',palette.skin,[side*.21,1.24,.76],[.145,.17,.15],'head',8,6);
  const bone=side<0?'earLeft':'earRight',outline:V[]=[[0,.19,.025],[.12,.22,-.015],[.255,.15,-.055],[.30,.015,-.075],[.255,-.15,-.045],[.14,-.27,.01],[.035,-.22,.045],[-.015,-.05,.055]],base:V=[side*.35,1.45,.62];
  const points=(depth:number)=>outline.map(([u,v,z])=>[base[0]+side*u,base[1]+v,base[2]+z+depth]as V),front=points(.023),back=points(-.023),c:V=[side*.49,1.43,.635],d:V=[side*.49,1.43,.589];
  for(let i=0;i<outline.length;i++){const k=(i+1)%outline.length,a=front[i]!,b=front[k]!,x=back[i]!,y=back[k]!;
   triangle('ears',side<0?[c,a,b]:[c,b,a],i<2?palette.skin:palette.ear,bone);triangle('ears',side<0?[d,y,x]:[d,x,y],palette.dark,bone);triangle('ears',[a,b,y],palette.skin,bone);triangle('ears',[a,y,x],palette.skin,bone);
  }
  oval('eyes',palette.dark,[side*.292,1.48,.963],[.054,.041,.027],'head',8,5);
  oval('eyes',palette.eye,[side*.303,1.485,.986],[.029,.026,.015],'head',8,5);
  oval('eyes',palette.shine,[side*.310,1.494,.999],[.008,.008,.006],'head',6,4);
  oval('brows',palette.crease,[side*.293,1.536,.966],[.058,.014,.025],'head',8,4);
 }
 oval('mouth',palette.dark,[0,1.10,.954],[.137,.027,.08],'head',10,4);
 for(const [i,name]of ELEPHANT_LEGS.entries()){
  const x=i%2===0?-.35:.35,z=i<2?.43:-.49;
  oval('shoulders',palette.skin,[x,1.04,z],[.19,.22,.205],name,10,6);
  add('upperLegs',new CylinderGeometry(.16,.145,.48,8),palette.skin,[x,.79,z],[1,1,1],name);
  oval('knees',palette.skin,[x,.53,z],[.15,.13,.15],name+'Knee',8,5);
  add('lowerLegs',new CylinderGeometry(.145,.17,.35,8),palette.skin,[x,.355,z+.008],[1,1,1],name+'Knee');
  oval('feet',palette.skin,[x,.115,z+.04],[.195,.105,.225],name+'Foot',10,5);
  for(let n=0;n<4;n++){const angle=(n-1.5)*.36;oval('nails',palette.nail,[x+Math.sin(angle)*.147,.076,z+.04+Math.cos(angle)*.208],[.037,.029,.022],name+'Foot',6,3);}
 }
 const samples=Array.from({length:49},(_,i)=>trunkCurve.getPoint(i/48));
 const trunkBinding=(p:Vector3):Weights=>{let closest=0,distance=Infinity;for(const [i,c]of samples.entries()){const d=c.distanceToSquared(p);if(d<distance){distance=d;closest=i;}}const t=closest/48*7,a=Math.min(6,Math.floor(t));return {a:joint('trunk'+a),b:joint('trunk'+(a+1)),blend:t-a};};
 // One continuous tapered tube; skin weights blend adjacent trunk joints without bead seams.
 const tube=new TubeGeometry(trunkCurve,18,.125,8,false),positions=tube.getAttribute('position');for(let i=0;i<positions.count;i++){const ring=Math.floor(i/9),t=ring/18,center=trunkCurve.getPoint(t),v=new Vector3().fromBufferAttribute(positions,i),scale=1-t*.60;v.sub(center).multiplyScalar(scale).add(center);positions.setXYZ(i,v.x,v.y,v.z);}tube.computeVertexNormals();
 add('trunk',tube,palette.skin,[0,0,0],[1,1,1],trunkBinding);
 oval('trunkTip',palette.skin,[0,.182,1.255],[.052,.053,.057],'trunk7',8,5);
 for(const sign of [-1,1])oval('nostrils',palette.dark,[sign*.018,.159,1.294],[.012,.009,.011],'trunk7',6,3);
 oval('singleTrunkFinger',palette.skin,[0,.195,1.310],[.022,.027,.037],'trunk7',6,4);
 const tailStart=new Vector3(0,.98,-.78),tailEnd=new Vector3(0,.39,-.99),axis=tailEnd.clone().sub(tailStart),tail=new CylinderGeometry(.022,.017,axis.length(),6).rotateX(Math.atan2(axis.z,axis.y));
 add('tail',tail,palette.skin,tailStart.clone().add(tailEnd).multiplyScalar(.5).toArray()as V,[1,1,1],'tail');
 oval('tailTuft',palette.dark,[0,.34,-1.01],[.052,.085,.045],'tailTip',8,5);
 const geometry=batch.geometry();geometry.name=ELEPHANT_ART.version+'-'+name;geometry.setAttribute('skinIndex',new Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));
 const triangles=batch.positions.length/9;if(triangles>ELEPHANT_ART.triangleLimit){geometry.dispose();throw Error('Elephant geometry budget exceeded');}
 geometry.userData={provenance:'Original procedural code; no external mesh, texture or font',species:'Elephas maximus',sex:'female',trunkFingers:1,prominentTusks:0,legs:4,parts};
 return {geometry,triangles,parts};
}
