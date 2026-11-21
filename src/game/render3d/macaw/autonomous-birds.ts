import {sceneOrigin} from '../../world/scene-coordinates.ts';
import {CylinderGeometry,Group,Mesh,MeshStandardMaterial} from 'three';
import type {Animal,Habitat} from '../../core/state.ts';
import {BIRD_PERCH_HEIGHT,birdHome} from '../../animals/autonomy.ts';
import {FOOD_RULES} from '../../animals/feeding.ts';
import {createMacawAssets,MACAW_SCALE} from './macaw-geometry.ts';
import {createMacawRig} from './macaw-rig.ts';
import {sampleMacawPose,blendMacawPose,type MacawPose} from './macaw-animation.ts';
import type {AnimalLibrary} from '../glb/animal-library.ts';
import {createGLBResidentRig,type GLBResidentRig} from '../glb/resident-rig.ts';
function ease(from: number, to: number, position: number) {
 const t = Math.max(0, Math.min(1, (position - from) / (to - from)));
 return t * t * (3 - 2 * t);
}

/** The two contacts align the GLB's upper beak with the authored feeder's lower and upper fruit rows. */
export function macawFeedingPose(ticksLeft: number, fraction: number, portions: number, reduced: boolean): MacawPose {
 const progress = (FOOD_RULES.eatTicks - ticksLeft + fraction) / FOOD_RULES.eatTicks;
 const pose = sampleMacawPose('eat', Math.max(0, progress) * FOOD_RULES.eatTicks * 100);
 const inspect = ease(0, .20, progress);
 const sip = reduced ? 0 : ease(.25, .42, progress) * (1 - ease(.50, .64, progress));
 const reach = Math.max(sip, ease(.58, .82, progress));
 const bodyContact = portions > 2 ? .820451 : .856576;
 const headContact = portions > 2 ? -.107150 : -.071914;
 const uprightBody = .10 + inspect * .18, uprightHead = -.12 + inspect * .24;
 pose.bodyPitch = uprightBody + (bodyContact - uprightBody) * reach;
 pose.headPitch = uprightHead + (headContact - uprightHead) * reach;
 pose.headYaw = reduced ? 0 : .055 * Math.sin(progress * 14) * (1 - reach);
 pose.jaw = reduced ? .04 * reach : .10 * reach * (.5 + .5 * Math.sin(progress * 35));
 return pose;
}

export function autonomousPose(a:Animal,time:number,fraction=0,portions=1,reduced=false):MacawPose{
 const m=a.motion,walking=m.phase==='walk-out'||m.phase==='walk-home'||m.phase==='seek-food'||m.phase==='leave-food'||['seek-rest','seek-water','water-back','leave-water','water-home','water-abort'].includes(m.phase),flying=m.phase==='ascend'||m.phase==='descend';
 const sampleTime = m.phase === 'drink' ? (20 - m.ticksLeft) * 100
   : m.phase === 'water-hop' ? (8 - m.ticksLeft) * 100
   : m.phase === 'leave-food' ? 800 - time % 800 : time;
 const p = m.phase === 'eat'
   ? macawFeedingPose(m.ticksLeft, fraction, portions, reduced)
   : sampleMacawPose(m.phase==='rest'?'rest':m.phase==='drink'?'drink':m.phase==='water-hop'?'hop':walking?'walk':'perch',sampleTime);
 if(m.phase==='enrich'){p.headYaw=(a.id==='macaw-1'?-.55:.55)+.10*Math.sin(time/600);p.headPitch=.08*Math.sin(time/700);p.eyesClosed=0;}
 if(!['perch','rest','enrich'].includes(m.phase)){p.grip=0;p.tailPitch=1.15*(1-m.elevation/BIRD_PERCH_HEIGHT);}
 if(flying){const fly=sampleMacawPose('fly',time),edge=Math.min((24-m.ticksLeft)/4,m.ticksLeft/4,1);for(const key of ['wingLeft','wingRight','elbowLeft','elbowRight']as const)p[key]+=(fly[key]-p[key])*Math.max(0,edge);p.leftStep=p.rightStep=p.leftLift=p.rightLift=0;p.grip=m.elevation===BIRD_PERCH_HEIGHT&&m.ticksLeft<3?1:0;}
 p.lift=0;return p;
}
/** Two transforms share one original palette/geometry set. No timers, physics, RNG, or second RAF. */
export function createAutonomousBirds(library?:AnimalLibrary){
 const group=new Group();group.name='Two sanctuary macaws';let disposed=false,assets:ReturnType<typeof createMacawAssets>|undefined,branchGeometry:CylinderGeometry|undefined,branchMaterial:MeshStandardMaterial|undefined,layout='';
 type Record={rig:ReturnType<typeof createMacawRig>|GLBResidentRig;previous:Animal;current:Animal;pose:MacawPose;from:MacawPose;changedAt:number;};
 const birds=new Map<string,Record>();const landingBranches:Mesh[]=[];let perchesVisible=true;
 let foodPortions: readonly number[] = [];
 function clear(){for(const b of birds.values())b.rig.dispose();birds.clear();landingBranches.length=0;group.clear();assets?.dispose();assets=undefined;branchGeometry?.dispose();branchGeometry=undefined;branchMaterial?.dispose();branchMaterial=undefined;layout='';}
 function sync(animals:Animal[],habitats:Habitat[],width:number,height:number,time:number,low=false,portions:readonly number[]=[]){
  foodPortions = portions;
  if(disposed)return;const placed=animals.filter(a=>a.habitatId&&a.position).sort((a,b)=>a.id.localeCompare(b.id));const next=placed.map(a=>`${a.id}:${a.habitatId}`).join('|');
  if(next!==layout){clear();layout=next;if(placed.length){if(!library)assets=createMacawAssets();branchGeometry=new CylinderGeometry(1,1,1,8);branchMaterial=new MeshStandardMaterial({color:'#99754e',roughness:1});}}
  for(const [slot,a]of placed.entries()){
   let b=birds.get(a.id);const variant=a.id==='macaw-1'?'one':'two';if(library&&b&&'sourceId'in b.rig&&b.rig.sourceId!==library.modelId('macaw',variant,low)&&library.ensure(library.modelId('macaw',variant,low))){const replacement=createGLBResidentRig(library,'macaw',variant,a.id,low)!;replacement.root.position.copy(b.rig.root.position);replacement.root.quaternion.copy(b.rig.root.quaternion);replacement.root.scale.copy(b.rig.root.scale);b.rig.dispose();b.rig=replacement;replacement.apply(b.pose);group.add(replacement.root);}
   if(!b&&(assets||library)){const rig=library?createGLBResidentRig(library,'macaw',variant,a.id,low):createMacawRig(assets!);if(!rig)continue;rig.root.name=a.id;rig.root.scale.setScalar(MACAW_SCALE);group.add(rig.root);const pose=autonomousPose(a,time);b={rig,previous:structuredClone(a),current:structuredClone(a),pose,from:pose,changedAt:time};birds.set(a.id,b);
    const h=habitats.find(h=>h.id===a.habitatId)!;const p=birdHome(h,slot).perch,x=p.x-sceneOrigin({width,height}).x,z=p.z-sceneOrigin({width,height}).z-.025*MACAW_SCALE,y=.079+BIRD_PERCH_HEIGHT-.035*MACAW_SCALE;
    const branch=new Mesh(branchGeometry,branchMaterial);branch.rotation.z=Math.PI/2;branch.scale.set(.035*MACAW_SCALE,.34,.035*MACAW_SCALE);branch.position.set(x,y,z);branch.visible=perchesVisible;landingBranches.push(branch);group.add(branch);
    for(const dx of [-.15,.15]){const post=new Mesh(branchGeometry,branchMaterial);post.scale.set(.014,y-.079,.014);post.position.set(x+dx,.079+(y-.079)/2,z);post.visible=perchesVisible;landingBranches.push(post);group.add(post);}
   }
   if(b){if(b.current.motion.phase!==a.motion.phase){b.from={...b.pose};b.changedAt=time;}b.previous=b.current;b.current=structuredClone(a);}
  }
  group.userData.worldOriginX=sceneOrigin({width,height}).x;group.userData.worldOriginZ=sceneOrigin({width,height}).z;
 }
 function update(alpha:number,time:number,reduced=false){if(disposed)return;const t=Math.max(0,Math.min(1,alpha));for(const b of birds.values()){
  const a=b.current,p=b.previous;if(!a.position||!p.position)continue;
  const heading=p.motion.heading+Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))*t;
  b.rig.root.position.set(p.position.x+(a.position.x-p.position.x)*t-group.userData.worldOriginX,.079+p.motion.elevation+(a.motion.elevation-p.motion.elevation)*t,p.position.z+(a.position.z-p.position.z)*t-group.userData.worldOriginZ);b.rig.root.rotation.y=heading;
  const first=a.id==='macaw-1';
  const sample=autonomousPose(a,time+(first?0:1300),t,foodPortions[first?0:1]??1,reduced);
  b.pose=blendMacawPose(b.from,sample,Math.min(1,Math.max(0,time-b.changedAt)/280));b.rig.apply(b.pose);
 }}
 return {group,sync,update,setPerchesVisible(value:boolean){perchesVisible=value;for(const b of landingBranches)b.visible=value;},setVisible:(value:boolean)=>{group.visible=value;},dispose(){if(disposed)return;disposed=true;clear();},inspect:()=>({liveBirdModels:birds.size,birdPerchMaterials:branchMaterial?1:0,birdAssetsGeometries:library?birds.size:assets?.inspect().macawAssetGeometries??0,birdOwnedMaterials:library?new Set([...birds.values()].map(b=>(b.rig as GLBResidentRig).material)).size+(branchMaterial?1:0):assets?2:0,birdModelTriangles:library?[...birds.values()].reduce((n,b)=>n+(b.rig as GLBResidentRig).triangles,0):assets?(assets.inspect().macawTriangles*birds.size):0,birdPerchTriangles:branchGeometry&&perchesVisible?3*32*birds.size:0,birdPerchesVisible:perchesVisible&&birds.size>0,birdSceneDisposed:disposed})};
}
