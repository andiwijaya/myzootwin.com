import type {Animal,AnimalMotion,Habitat,Point,ZooSaveV1} from '../core/state.ts';
export const BIRD_PERCH_HEIGHT=.42*.62;
export const emptyMotion=():AnimalMotion=>({phase:'idle',ticksLeft:0,sequence:0,heading:0,elevation:0});
/** Separate lanes keep the two macaws and their folded tails apart; all waypoints are interior. */
export function birdHome(h:Habitat,slot:number){const x=Math.min(...h.cells.map(c=>c.x))+.5+slot,z=Math.min(...h.cells.map(c=>c.z));return {ground:{x,z:z+1.25},perch:{x,z:z+.5}};}
export function supportsBirds(h:Habitat){const x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z));return h.cells.length===4&&[0,1].every(dx=>[0,1].every(dz=>h.cells.some(c=>c.x===x+dx&&c.z===z+dz)));}
function sample(seed:number,sequence:number,slot:number){let v=(seed^Math.imul(sequence+1,0x45d9f3b)^Math.imul(slot+1,0x27d4eb2d))>>>0;v=Math.imul(v^(v>>>16),0x45d9f3b)>>>0;return (v^(v>>>16))>>>0;}
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function reserveBird(a:Animal){a.habitatId=null;a.position=null;a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion=emptyMotion();}
export function welcomeBirds(s:ZooSaveV1){const h=s.world.habitats[0];if(!h||!supportsBirds(h)||s.world.resources.some(r=>r.habitatId===h.id))return false;if(s.animals.some(a=>a.habitatId!==null))return false;for(const [slot,a]of [...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).entries()){a.habitatId=h.id;a.position=birdHome(h,slot).ground;a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion={...emptyMotion(),ticksLeft:15+sample(s.randomSeed,0,slot)%35};}return true;}
function phase(a:Animal,value:AnimalMotion['phase'],ticks:number,target:Point|null){a.motion.phase=value;a.motion.ticksLeft=ticks;a.target=target;a.currentBehavior=value==='idle'||value==='look'?'idle':value==='walk-out'||value==='walk-home'?'wander':'perch';}
/** Only fixed ticks change authoritative location. Animation never supplies movement or timing. */
export function stepAnimals(s:ZooSaveV1){const birds=[...s.animals].sort((a,b)=>a.id.localeCompare(b.id));for(const [slot,a]of birds.entries()){
 if(!a.habitatId)continue;const h=s.world.habitats.find(h=>h.id===a.habitatId);if(!h||!supportsBirds(h)||!a.position){reserveBird(a);continue;}
 const home=birdHome(h,slot),m=a.motion,p=a.position;
 // Future facilities need a reachability plan before sharing these lanes. A safe reserve is preferable to clipping.
 if(s.world.resources.some(r=>r.habitatId===h.id)){reserveBird(a);continue;}
 if(m.phase==='walk-out'||m.phase==='walk-home'){
  const t=a.target??home.ground,dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz),desired=d>.001?Math.atan2(dx,dz):m.heading;
  m.heading+=Math.max(-.24,Math.min(.24,angle(m.heading,desired)));
  if(Math.abs(angle(m.heading,desired))<.25&&d>.001){const step=Math.min(.035,d);p.x+=dx/d*step;p.z+=dz/d*step;}
  if(m.ticksLeft<=1&&d>.035){phase(a,'idle',25,null);continue;}
  if(d<=.035){a.position={...t};if(m.phase==='walk-out')phase(a,'look',12+sample(s.randomSeed,m.sequence,slot)%18,null);else phase(a,'ascend',24,{...home.perch});}else m.ticksLeft--;
 }else if(m.phase==='ascend'||m.phase==='descend'){
  const progress=(25-m.ticksLeft)/24,up=m.phase==='ascend';
  // Rise before approaching a branch; leave the branch before lowering onto the floor.
  const travel=up?Math.max(0,(progress-.5)*2):Math.min(1,progress*2);
  a.position={x:home.ground.x,z:up?mix(home.ground.z,home.perch.z,travel):mix(home.perch.z,home.ground.z,travel)};
  m.elevation=BIRD_PERCH_HEIGHT*(up?Math.min(1,progress*2):Math.min(1,(1-progress)*2));
  const desired=up?Math.PI:0;m.heading+=Math.max(-.24,Math.min(.24,angle(m.heading,desired)));
  if(--m.ticksLeft===0){if(up){a.position={...home.perch};m.elevation=BIRD_PERCH_HEIGHT;m.heading=Math.PI;phase(a,'perch',40+sample(s.randomSeed,m.sequence,slot)%60,null);}else{a.position={...home.ground};m.elevation=0;m.heading=0;m.sequence++;phase(a,'idle',22+sample(s.randomSeed,m.sequence,slot)%45,null);}}
 }else if(--m.ticksLeft<=0){
  if(m.phase==='idle'){const n=sample(s.randomSeed,m.sequence,slot),z=Math.min(...h.cells.map(c=>c.z))+(n%2?1.48:.98);phase(a,'walk-out',120,{x:home.ground.x,z});}
  else if(m.phase==='look')phase(a,'walk-home',120,{...home.ground});
  else phase(a,'descend',24,{...home.ground});
 }
}}
export type BirdCommand='welcome'|'reserve';
export interface BirdsView {habitat:boolean;placed:number;birds:Array<{id:string;behavior:'idle'|'wander'|'perch'}>;}
export function birdsView(s:ZooSaveV1):BirdsView{return {habitat:s.world.habitats.some(supportsBirds),placed:s.animals.filter(a=>a.habitatId!==null).length,birds:s.animals.map(a=>({id:a.id,behavior:a.currentBehavior==='wander'?'wander':a.currentBehavior==='perch'?'perch':'idle'}))};}
