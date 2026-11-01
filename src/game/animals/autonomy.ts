import {welfareParts,careAlerts,type CareAlert} from './welfare.ts';
import {growActivityNeeds,reachablePerch,wantsPerch,stepRest,finishRestAscent,BIRD_PERCH_HEIGHT} from './resting.ts';
export {BIRD_PERCH_HEIGHT} from './resting.ts';
import {stepWater,reachableWater,WATER_RULES,isWaterPhase} from './watering.ts';
import {stepFood,reachableFood,FOOD_RULES} from './feeding.ts';
import type {Animal,AnimalMotion,Habitat,Point,ZooSaveV1} from '../core/state.ts';
export const emptyMotion=():AnimalMotion=>({phase:'idle',ticksLeft:0,sequence:0,heading:0,elevation:0});
/** Separate lanes keep the two macaws and their folded tails apart; all waypoints are interior. */
export function birdHome(h:Habitat,slot:number){const x=Math.min(...h.cells.map(c=>c.x))+.5+slot,z=Math.min(...h.cells.map(c=>c.z));return {ground:{x,z:z+1.25},perch:{x,z:z+.5}};}
export function supportsBirds(h:Habitat){const x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z));return h.cells.length===4&&[0,1].every(dx=>[0,1].every(dz=>h.cells.some(c=>c.x===x+dx&&c.z===z+dz)));}
function sample(seed:number,sequence:number,slot:number){let v=(seed^Math.imul(sequence+1,0x45d9f3b)^Math.imul(slot+1,0x27d4eb2d))>>>0;v=Math.imul(v^(v>>>16),0x45d9f3b)>>>0;return (v^(v>>>16))>>>0;}
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function reserveBird(a:Animal){a.habitatId=null;a.position=null;a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion=emptyMotion();}
export function welcomeBirds(s:ZooSaveV1){const h=s.world.habitats[0];if(!h||!supportsBirds(h)||s.world.resources.some(r=>r.habitatId===h.id&&!['food','water','perch'].includes(r.kind)))return false;if(s.animals.some(a=>a.habitatId!==null))return false;for(const [slot,a]of [...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).entries()){a.habitatId=h.id;a.position=birdHome(h,slot).ground;a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion={...emptyMotion(),ticksLeft:15+sample(s.randomSeed,0,slot)%35};}return true;}
function phase(a:Animal,value:AnimalMotion['phase'],ticks:number,target:Point|null){a.motion.phase=value;a.motion.ticksLeft=ticks;a.target=target;a.currentBehavior=value==='idle'||value==='look'?'idle':value==='walk-out'||value==='walk-home'?'wander':'perch';}
/** Only fixed ticks change authoritative location. Animation never supplies movement or timing. */
export function stepAnimals(s:ZooSaveV1){const fed:Array<{animalId:string;resourceId:string}>=[],watered:Array<{animalId:string;resourceId:string}>=[];const birds=[...s.animals].sort((a,b)=>a.id.localeCompare(b.id));for(const [slot,a]of birds.entries()){
 if(!a.habitatId)continue;const h=s.world.habitats.find(h=>h.id===a.habitatId);if(!h||!supportsBirds(h)||!a.position){reserveBird(a);continue;}
 const home=birdHome(h,slot),m=a.motion,p=a.position;
 // Food uses verified front-row ports; unsupported future facilities still fail safe.
 if(s.world.resources.some(r=>r.habitatId===h.id&&!['food','water','perch'].includes(r.kind))){reserveBird(a);continue;}
 growActivityNeeds(a);
 a.hunger=Math.min(100,Math.round((a.hunger+FOOD_RULES.hungerPerTick)*100)/100);a.thirst=Math.min(100,Math.round((a.thirst+WATER_RULES.thirstPerTick)*100)/100);
 const f=reachableFood(s.world,h),w=reachableWater(s.world,h),r=reachablePerch(s.world,h),foodNeed=f?.portions?.[slot]&&a.hunger>=FOOD_RULES.seekAt?a.hunger:-1,waterNeed=w?.portions?.[slot]&&a.thirst>=WATER_RULES.seekAt?a.thirst:-1,urgent=Math.max(foodNeed,waterNeed),wantRest=Boolean(r&&slot<r.capacity&&wantsPerch(a,urgent)),wantWater=!wantRest&&waterNeed>=0&&waterNeed>=foodNeed;
 if(['seek-rest','rest','enrich'].includes(m.phase)){stepRest(s,a,h,slot,urgent);continue;}
 if(isWaterPhase(a)){const result=stepWater(s,a,h,slot);if(result.drank)watered.push({animalId:a.id,resourceId:result.drank});continue;}
 const feeding=stepFood(s,a,h,slot,!wantWater&&!wantRest);if(feeding.ate)fed.push({animalId:a.id,resourceId:feeding.ate});if(feeding.handled)continue;
 if(wantWater&&stepWater(s,a,h,slot).handled)continue;
 if(wantRest&&stepRest(s,a,h,slot,urgent))continue;
 if(m.phase==='walk-out'||m.phase==='walk-home'){
  if(a.target){if(w)a.target.z=home.ground.z;else if(f)a.target.z=Math.min(a.target.z,home.ground.z);}
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
  if(--m.ticksLeft===0){if(up){a.position={...home.perch};m.elevation=BIRD_PERCH_HEIGHT;m.heading=Math.PI;if(!finishRestAscent(s,a,h,slot,urgent))phase(a,'perch',40+sample(s.randomSeed,m.sequence,slot)%60,null);}else{a.position={...home.ground};m.elevation=0;m.heading=0;m.sequence++;phase(a,'idle',22+sample(s.randomSeed,m.sequence,slot)%45,null);}}
 }else if(--m.ticksLeft<=0){
  if(m.phase==='idle'){const n=sample(s.randomSeed,m.sequence,slot),z=Math.min(...h.cells.map(c=>c.z))+(n%2?(s.world.resources.some(r=>r.kind==='food'&&r.habitatId===h.id)?1.15:1.48):.98);phase(a,'walk-out',120,w?{x:home.ground.x+(slot===0?1:-1)*(n%2?.02:.04),z:home.ground.z}:{x:home.ground.x,z});}
  else if(m.phase==='look')phase(a,'walk-home',120,{...home.ground});
  else phase(a,'descend',24,{...home.ground});
 }
}return {fed,watered};}
export type BirdCommand='welcome'|'reserve';
export interface BirdInfo {id:string;ordinal:number;welfare:number;habitatFit:number;foodScore:number;waterScore:number;enrichmentScore:number;foodAccess:boolean;waterAccess:boolean;low:boolean;alerts:CareAlert[];behavior:Animal['currentBehavior'];energy:number;enrichment:number;restSeconds:number;enrichSeconds:number;hunger:number;foodEaten:number;thirst:number;waterDrunk:number;}
export interface BirdsView {tick:number;habitat:boolean;placed:number;birds:BirdInfo[];}
export function birdsView(s:ZooSaveV1):BirdsView{return {tick:s.tick,habitat:s.world.habitats.some(supportsBirds),placed:s.animals.filter(a=>a.habitatId!==null).length,birds:[...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).map((a,i)=>{const parts=welfareParts(s,a);return {id:a.id,ordinal:a.id==='macaw-1'?1:a.id==='macaw-2'?2:i+1,welfare:a.welfare,habitatFit:a.habitatFit,foodScore:parts.foodScore,waterScore:parts.waterScore,enrichmentScore:parts.enrichmentScore,foodAccess:parts.foodAccess,waterAccess:parts.waterAccess,low:a.care.low,alerts:careAlerts(s,a),energy:Math.round(a.energy),enrichment:Math.round(a.enrichment),restSeconds:Math.floor(a.restedTicks/10),enrichSeconds:Math.floor(a.enrichedTicks/10),behavior:a.currentBehavior==='rest'?'rest':a.currentBehavior==='enrich'?'enrich':a.currentBehavior==='seek-rest'?'seek-rest':a.currentBehavior==='seek-water'?'seek-water':a.currentBehavior==='drink'?'drink':a.currentBehavior==='wander'?'wander':a.currentBehavior==='perch'?'perch':a.currentBehavior==='seek-food'?'seek-food':a.currentBehavior==='eat'?'eat':'idle',hunger:Math.round(a.hunger),foodEaten:a.foodEaten,thirst:Math.round(a.thirst),waterDrunk:a.waterDrunk};})};}
