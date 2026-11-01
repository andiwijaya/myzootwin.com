import {CylinderGeometry,Group,Mesh,MeshStandardMaterial} from 'three';
import type {Animal,Habitat} from '../../core/state.ts';
import {BIRD_PERCH_HEIGHT,birdHome} from '../../animals/autonomy.ts';
import {createMacawAssets,MACAW_SCALE} from './macaw-geometry.ts';
import {createMacawRig} from './macaw-rig.ts';
import {sampleMacawPose,blendMacawPose,type MacawPose} from './macaw-animation.ts';
export function autonomousPose(a:Animal,time:number):MacawPose{
 const m=a.motion,walking=m.phase==='walk-out'||m.phase==='walk-home',flying=m.phase==='ascend'||m.phase==='descend';
 const p=sampleMacawPose(walking?'walk':'perch',time);
 if(m.phase!=='perch'){p.grip=0;p.tailPitch=1.15*(1-m.elevation/BIRD_PERCH_HEIGHT);}
 if(flying){const fly=sampleMacawPose('fly',time),edge=Math.min((24-m.ticksLeft)/4,m.ticksLeft/4,1);for(const key of ['wingLeft','wingRight','elbowLeft','elbowRight']as const)p[key]+=(fly[key]-p[key])*Math.max(0,edge);p.leftStep=p.rightStep=p.leftLift=p.rightLift=0;p.grip=m.elevation===BIRD_PERCH_HEIGHT&&m.ticksLeft<3?1:0;}
 p.lift=0;return p;
}
/** Two transforms share one original palette/geometry set. No timers, physics, RNG, or second RAF. */
export function createAutonomousBirds(){
 const group=new Group();group.name='Two sanctuary macaws';let disposed=false,assets:ReturnType<typeof createMacawAssets>|undefined,branchGeometry:CylinderGeometry|undefined,branchMaterial:MeshStandardMaterial|undefined,layout='';
 type Record={rig:ReturnType<typeof createMacawRig>;previous:Animal;current:Animal;pose:MacawPose;from:MacawPose;changedAt:number;};
 const birds=new Map<string,Record>();
 function clear(){for(const b of birds.values())b.rig.dispose();birds.clear();group.clear();assets?.dispose();assets=undefined;branchGeometry?.dispose();branchGeometry=undefined;branchMaterial?.dispose();branchMaterial=undefined;layout='';}
 function sync(animals:Animal[],habitats:Habitat[],width:number,height:number,time:number){
  if(disposed)return;const placed=animals.filter(a=>a.habitatId&&a.position).sort((a,b)=>a.id.localeCompare(b.id));const next=placed.map(a=>`${a.id}:${a.habitatId}`).join('|');
  if(next!==layout){clear();layout=next;if(placed.length){assets=createMacawAssets();branchGeometry=new CylinderGeometry(1,1,1,8);branchMaterial=new MeshStandardMaterial({color:'#99754e',roughness:1});}}
  for(const [slot,a]of placed.entries()){
   let b=birds.get(a.id);if(!b&&assets){const rig=createMacawRig(assets);rig.root.name=a.id;rig.root.scale.setScalar(MACAW_SCALE);group.add(rig.root);const pose=autonomousPose(a,time);b={rig,previous:structuredClone(a),current:structuredClone(a),pose,from:pose,changedAt:time};birds.set(a.id,b);
    const h=habitats.find(h=>h.id===a.habitatId)!;const p=birdHome(h,slot).perch,x=p.x-width/2,z=p.z-height/2-.025*MACAW_SCALE,y=.079+BIRD_PERCH_HEIGHT-.035*MACAW_SCALE;
    const branch=new Mesh(branchGeometry,branchMaterial);branch.rotation.z=Math.PI/2;branch.scale.set(.035*MACAW_SCALE,.34,.035*MACAW_SCALE);branch.position.set(x,y,z);group.add(branch);
    for(const dx of [-.15,.15]){const post=new Mesh(branchGeometry,branchMaterial);post.scale.set(.014,y-.079,.014);post.position.set(x+dx,.079+(y-.079)/2,z);group.add(post);}
   }
   if(b){if(b.current.motion.phase!==a.motion.phase){b.from={...b.pose};b.changedAt=time;}b.previous=b.current;b.current=structuredClone(a);}
  }
  group.userData.worldWidth=width;group.userData.worldHeight=height;
 }
 function update(alpha:number,time:number){if(disposed)return;const t=Math.max(0,Math.min(1,alpha));for(const b of birds.values()){
  const a=b.current,p=b.previous;if(!a.position||!p.position)continue;
  const heading=p.motion.heading+Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))*t;
  b.rig.root.position.set(p.position.x+(a.position.x-p.position.x)*t-group.userData.worldWidth/2,.079+p.motion.elevation+(a.motion.elevation-p.motion.elevation)*t,p.position.z+(a.position.z-p.position.z)*t-group.userData.worldHeight/2);b.rig.root.rotation.y=heading;
  const sample=autonomousPose(a,time+(a.id==='macaw-1'?0:1300));b.pose=blendMacawPose(b.from,sample,Math.min(1,Math.max(0,time-b.changedAt)/280));b.rig.apply(b.pose);
 }}
 return {group,sync,update,setVisible:(value:boolean)=>{group.visible=value;},dispose(){if(disposed)return;disposed=true;clear();},inspect:()=>({liveBirdModels:birds.size,birdAssetsGeometries:assets?.inspect().macawAssetGeometries??0,birdOwnedMaterials:assets?2:0,birdModelTriangles:assets?(assets.inspect().macawTriangles*birds.size):0,birdPerchTriangles:assets?3*32*birds.size:0,birdSceneDisposed:disposed})};
}
