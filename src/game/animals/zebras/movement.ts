import {zebraBodySweepAllowed} from './body.ts';
import type{RuntimeState}from'../../core/runtime-state.ts';import{zebras,type ZebraAnimal,type ZebraHabitat}from'../../core/zebra-state.ts';import{ZEBRA_GROUND as G}from'./rules.ts';import{zebraDistance as distance,zebraGroundNodes,zebraGroundRoute,zebraSegmentAllowed}from'./ground.ts';
export const zebraAngle=(from:number,to:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export function zebraIdle(a:ZebraAnimal,ticks=8){a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion={...a.motion,phase:'idle',ticksLeft:ticks,sequence:a.motion.sequence+1,waypoints:[],waypointIndex:0,partnerId:null,herdLeaderId:null,blockedTicks:0};delete a.motion.trotDistance;}
export function walkZebraGround(s:RuntimeState,a:ZebraAnimal,h:ZebraHabitat,others:ZebraAnimal[],speed:number=G.speed){
 // Back away along the current heading when a safe turn is blocked by a companion.
 // This is a bounded canonical translation, tested against the same ground/body guards.
 const blocked=(allowReverse=false)=>{
  a.motion.blockedTicks++;
  if(allowReverse&&a.motion.blockedTicks>=6&&a.motion.blockedTicks<18){
   const step=G.speed*.5,back={x:-Math.sin(a.motion.heading),z:-Math.cos(a.motion.heading)};
   // A diagonal retreat can be blocked by the outer fence or a neighbour while
   // another short retreat or side step is clear. Try bounded translations without turning,
   // preserving the same ground, root-separation, body/head and prop sweep guards.
   const axes=[{x:Math.sign(back.x),z:0},{x:0,z:Math.sign(back.z)}].sort((p,q)=>Math.abs(q.x*back.x+q.z*back.z)-Math.abs(p.x*back.x+p.z*back.z));
   const sideSteps=[{x:0,z:-1},{x:-1,z:0},{x:1,z:0},{x:0,z:1}].sort((p,q)=>distance({x:a.position.x+p.x*step,z:a.position.z+p.z*step},goal)-distance({x:a.position.x+q.x*step,z:a.position.z+q.z*step},goal));
   for(const v of [back,...axes,...sideSteps]){
    if(Math.hypot(v.x,v.z)<1e-8)continue;
    const p={x:a.position.x+v.x*step,z:a.position.z+v.z*step};
    if(!zebraSegmentAllowed(s.world,h,a.position,p,avoided)||!zebraSegmentAllowed(s.world,h,p,goal)||!zebraBodySweepAllowed(a,p,a.motion.heading,others,posts))continue;
    a.motion.lastStep={x:p.x-a.position.x,z:p.z-a.position.z};a.motion.distanceWalked+=Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z);a.position=p;return true;
   }
  }
  return a.motion.blockedTicks<18;
 };
 const avoided=others.flatMap(b=>a.currentBehavior==='wander'&&b.targetResourceId&&b.target?[b.position,b.target]:[b.position]);
 const posts=s.world.resources.filter(r=>r.kind==='zebra-shade'&&r.habitatId===h.id).map(r=>({x:r.cell.x+.5,z:r.cell.z+.5}));if(--a.motion.ticksLeft<=0||!a.target||!a.motion.waypoints.length)return false;const goal=a.motion.waypoints[a.motion.waypointIndex]!,d=distance(a.position,goal),heading=d<1e-7?a.motion.heading:Math.atan2(goal.x-a.position.x,goal.z-a.position.z),delta=zebraAngle(a.motion.heading,heading);const nextHeading=zebraAngle(0,a.motion.heading+Math.max(-G.turn,Math.min(G.turn,delta)));if(!zebraBodySweepAllowed(a,a.position,nextHeading,others,posts)){return blocked(true);}a.motion.heading=nextHeading;if(Math.abs(delta)>.18)return true;
 if(d>1e-7){const step=Math.min(speed,d),p={x:a.position.x+(goal.x-a.position.x)/d*step,z:a.position.z+(goal.z-a.position.z)/d*step};if(!zebraSegmentAllowed(s.world,h,a.position,p,others.map(b=>b.position))||!zebraBodySweepAllowed(a,p,a.motion.heading,others,posts)){return blocked();}const nextIndex=distance(p,goal)<1e-7?a.motion.waypointIndex+1:a.motion.waypointIndex,next=a.motion.waypoints[nextIndex];if(next&&!zebraSegmentAllowed(s.world,h,p,next))return false;a.motion.lastStep={x:p.x-a.position.x,z:p.z-a.position.z};a.motion.distanceWalked+=Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z);a.position=p;a.motion.blockedTicks=0;}
 if(distance(a.position,goal)<1e-7){if(a.motion.waypointIndex+1<a.motion.waypoints.length)a.motion.waypointIndex++;else return false;}return true;
}
/** One canonical fixed tick. No extra RNG consumption, clock, render or care credit. */
export function stepZebraMovement(s:RuntimeState){const herd=zebras(s.animals);const offset=herd.length?s.tick%herd.length:0;for(let n=0;n<herd.length;n++){const a=herd[(n+offset)%herd.length]!;a.motion.lastStep={x:0,z:0};const h=s.world.habitats.find((h):h is ZebraHabitat=>h.kind==='zebra-grasslands'&&h.id===a.habitatId);if(!h)continue;const others=herd.filter(b=>b!==a);if(a.motion.phase==='wander'){if(!walkZebraGround(s,a,h,others))zebraIdle(a,8);continue;}if(a.motion.phase!=='idle')continue;if(a.motion.ticksLeft>0){a.motion.ticksLeft--;continue;}const obstacles=others.flatMap(b=>b.targetResourceId&&b.target?[b.position,b.target]:[b.position]),nodes=zebraGroundNodes(s.world,h,obstacles);let found=false;for(let i=0;i<Math.min(16,nodes.length);i++){const p=nodes[(s.randomState+a.motion.sequence*37+i)%nodes.length]!;if(distance(a.position,p)<.8)continue;const route=zebraGroundRoute(s.world,h,a.position,p,obstacles);if(!route)continue;a.target={...p};a.targetResourceId=null;a.currentBehavior='wander';a.motion={...a.motion,phase:'wander',ticksLeft:G.seekTimeout,sequence:a.motion.sequence+1,waypoints:route,waypointIndex:0,partnerId:null,herdLeaderId:null,blockedTicks:0};found=true;break;}if(!found)zebraIdle(a,12);}}
