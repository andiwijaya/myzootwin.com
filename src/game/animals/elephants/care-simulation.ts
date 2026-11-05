import type {ZooSaveV2} from '../../core/zoo-state.ts';
import type {Point} from '../../core/state.ts';
import {isElephant,type ElephantAnimal,type ElephantResource} from '../../core/species.ts';
import {ELEPHANT_GROUND as G,elephantGroundRoute,groundCenters,groundDistance,groundSegmentAllowed} from './ground.ts';
import {ELEPHANT_NEEDS as N} from './care-rules.ts';
import {reconcileElephantWelfare} from './welfare.ts';
type Consumed={animalId:string;resourceId:string};
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function turn(a:ElephantAnimal,heading:number){const delta=angle(a.motion.heading,heading);a.motion.heading+=Math.max(-G.turn,Math.min(G.turn,delta));a.motion.heading=angle(0,a.motion.heading);return Math.abs(angle(a.motion.heading,heading))<.2;}
function idle(a:ElephantAnimal,ticks:number=N.idleTicks){a.currentBehavior='idle';a.target=null;a.targetResourceId=null;a.motion={...a.motion,phase:'idle',ticksLeft:ticks,sequence:a.motion.sequence+1,waypoints:[],waypointIndex:0};}
function choose(s:ZooSaveV2,a:ElephantAnimal,kind:'elephant-browse'|'elephant-water',slot:number){
 const h=s.world.habitats.find(h=>h.id===a.habitatId&&h.kind==='elephant-grove');if(!h)return null;
 const herd=s.animals.filter(isElephant),others=herd.filter(b=>b.id!==a.id),resources=s.world.resources.filter((r):r is ElephantResource=>r.habitatId===h.id&&r.kind===kind&&'approaches'in r&&r.stock>0).sort((a,b)=>a.cell.x-b.cell.x||a.cell.z-b.cell.z||a.id.localeCompare(b.id));
 for(let offset=0;offset<resources.length;offset++){const r=resources[(slot+offset)%resources.length]!;
  const ports=r.approaches.filter(p=>groundDistance(p,{x:r.cell.x+.5,z:r.cell.z+.5})<=1.6).sort((x,y)=>groundDistance(a.position,x)-groundDistance(a.position,y)||x.z-y.z||x.x-y.x);
  for(const p of ports){if(others.some(b=>b.targetResourceId===r.id&&b.target&&groundDistance(b.target,p)<G.separation))continue;const route=elephantGroundRoute(s.world,h,a.position,p,others.map(b=>b.position));if(route)return {resource:r,port:{...p},route};}
 }
 return null;
}
function seek(s:ZooSaveV2,a:ElephantAnimal,slot:number){
 const waterFirst=a.foodEaten===0&&a.waterDrunk===0?a.thirst>=N.criticalAt:a.thirst>=a.hunger,needs=[waterFirst?'elephant-water':'elephant-browse',waterFirst?'elephant-browse':'elephant-water'] as const;
 for(const kind of needs){const need=kind==='elephant-browse'?a.hunger:a.thirst,consumed=kind==='elephant-browse'?a.foodEaten:a.waterDrunk;if(need<N.seekAt&&consumed>0)continue;const selected=choose(s,a,kind,slot);if(!selected)continue;
  const phase=kind==='elephant-browse'?'seek-food':'seek-water';a.currentBehavior=phase;a.target=selected.port;a.targetResourceId=selected.resource.id;a.motion={...a.motion,phase,ticksLeft:G.seekTimeout,sequence:a.motion.sequence+1,waypoints:selected.route,waypointIndex:0};return true;
 }
 return false;
}
function walk(s:ZooSaveV2,a:ElephantAnimal){
 const h=s.world.habitats.find(h=>h.id===a.habitatId&&h.kind==='elephant-grove');if(!h||!a.target||--a.motion.ticksLeft<=0){idle(a);return false;}
 const others=s.animals.filter(isElephant).filter(b=>b.id!==a.id).map(b=>b.position),m=a.motion;let point=m.waypoints[m.waypointIndex];
 if(!point){const route=elephantGroundRoute(s.world,h,a.position,a.target,others);if(!route){idle(a);return false;}m.waypoints=route;m.waypointIndex=0;point=route[0]!;}
 const d=groundDistance(a.position,point);
 if(d>.001){const heading=Math.atan2(point.x-a.position.x,point.z-a.position.z);if(turn(a,heading)){const amount=Math.min(G.speed,d),next:Point={x:a.position.x+(point.x-a.position.x)/d*amount,z:a.position.z+(point.z-a.position.z)/d*amount};if(groundSegmentAllowed(s.world,h,a.position,next,others))a.position=next;else{const route=elephantGroundRoute(s.world,h,a.position,a.target,others);if(route){m.waypoints=route;m.waypointIndex=0;}else idle(a);}}return false;}
 if(m.waypointIndex<m.waypoints.length-1){m.waypointIndex++;return false;}return true;
}
/** Clear a used station instead of idling on its approach and blocking the companion's next meal. */
function depart(s:ZooSaveV2,a:ElephantAnimal,r:ElephantResource){
 const h=s.world.habitats.find(h=>h.id===a.habitatId&&h.kind==='elephant-grove');if(!h){idle(a);return;}
 const others=s.animals.filter(isElephant).filter(b=>b.id!==a.id),blocked=others.flatMap(b=>b.target?[b.position,b.target]:[b.position]),nodes=groundCenters(s.world,h,blocked),clear=nodes.filter(p=>r.approaches.every(q=>groundDistance(p,q)>=G.separation)),fallback=nodes.filter(p=>groundDistance(p,a.position)>=1&&!clear.includes(p));
 for(const pool of [clear,fallback]){pool.sort((p,q)=>groundDistance(a.position,p)-groundDistance(a.position,q)||p.z-q.z||p.x-q.x);for(const p of pool){const route=elephantGroundRoute(s.world,h,a.position,p,blocked);if(!route)continue;a.currentBehavior='wander';a.target={...p};a.targetResourceId=null;a.motion={...a.motion,phase:'wander',ticksLeft:G.seekTimeout,sequence:a.motion.sequence+1,waypoints:route,waypointIndex:0};return;}}
 idle(a);
}
/** Called only by the existing authoritative fixed tick. Actual arrival and action completion consume stock. */
export function stepElephantCare(s:ZooSaveV2){
 const fed:Consumed[]=[],watered:Consumed[]=[],herd=s.animals.filter(isElephant).sort((a,b)=>a.id.localeCompare(b.id));
 for(const [slot,a]of herd.entries()){
  a.hunger=Math.min(100,a.hunger+N.hungerPerTick);a.thirst=Math.min(100,a.thirst+N.thirstPerTick);
  const phase=a.motion.phase,food=phase==='seek-food'||phase==='eat',water=phase==='seek-water'||phase==='drink';
  if(phase==='wander'){if(a.hunger>=N.criticalAt||a.thirst>=N.criticalAt)idle(a,0);else if(walk(s,a))idle(a);continue;}
  if(!food&&!water){if(phase==='idle'&&--a.motion.ticksLeft<=0&&!seek(s,a,slot))a.motion.ticksLeft=N.idleTicks+slot*3;continue;}
  const r=s.world.resources.find((r):r is ElephantResource=>r.id===a.targetResourceId&&'approaches'in r),h=s.world.habitats.find(h=>h.id===a.habitatId&&h.kind==='elephant-grove');
  if(!h||!r||r.habitatId!==h.id||r.kind!==(food?'elephant-browse':'elephant-water')||r.stock<=0||!a.target||groundDistance(a.target,{x:r.cell.x+.5,z:r.cell.z+.5})>1.6||!r.approaches.some(p=>groundDistance(p,a.target!)<1e-6)){idle(a);continue;}
  const opposite=food?a.thirst:a.hunger,current=food?a.hunger:a.thirst;if(opposite>=N.criticalAt&&opposite>current+10&&choose(s,a,food?'elephant-water':'elephant-browse',slot)){idle(a,0);continue;}
  if(phase==='eat'||phase==='drink'){
   if(groundDistance(a.position,a.target)>.06){idle(a);continue;}
   if(--a.motion.ticksLeft<=0){r.stock--;if(food){a.hunger=Math.max(0,a.hunger-N.foodRelief);a.foodEaten++;fed.push({animalId:a.id,resourceId:r.id});}else{a.thirst=Math.max(0,a.thirst-N.waterRelief);a.waterDrunk++;watered.push({animalId:a.id,resourceId:r.id});}depart(s,a,r);}
   continue;
  }
  if(walk(s,a)&&turn(a,Math.atan2(r.cell.x+.5-a.position.x,r.cell.z+.5-a.position.z))){const action=food?'eat':'drink';a.currentBehavior=action;a.motion.phase=action;a.motion.ticksLeft=N.actionTicks;a.motion.sequence++;a.motion.waypoints=[];a.motion.waypointIndex=0;}
 }
 reconcileElephantWelfare(s);return {fed,watered};
}
