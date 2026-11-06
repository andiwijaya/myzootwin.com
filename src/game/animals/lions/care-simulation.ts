import type {RuntimeState} from '../../core/runtime-state.ts';
import type {Point} from '../../core/state.ts';
import {isLion,type LionAnimal,type LionHabitat,type LionResource,type LionResourceKind,type LionBehavior} from '../../core/species.ts';
import {LION_NEEDS as N} from './rules.ts';
import {LION_GROUND as G,lionDistance,lionGroundRoute,lionSegmentAllowed,lionGroundHeight,lionGroundNodes} from './ground.ts';
import {reconcileLionWelfare} from './welfare.ts';
type ActionEvent={type:'lion-roared'|'lion-investigated-scent'|'lion-scratched';animalId:string;resourceId:string;eventId:string}|{type:'lion-socialized';animalId:string;companionId:string;eventId:string};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const habitat=(s:RuntimeState,a:LionAnimal)=>s.world.habitats.find((h):h is LionHabitat=>h.kind==='lion-savanna'&&h.id===a.habitatId)!;
const neighbors=(s:RuntimeState,a:LionAnimal)=>s.animals.filter(isLion).filter(b=>b.id!==a.id).map(b=>b.position);
function idle(a:LionAnimal,ticks=12){a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion={...a.motion,phase:'idle',ticksLeft:ticks,sequence:a.motion.sequence+1,waypoints:[],waypointIndex:0,partnerId:null,blockedTicks:0};}
function travel(a:LionAnimal,phase:LionBehavior,route:Point[],target:Point,resource:string|null){a.currentBehavior=phase;a.target={...target};a.targetResourceId=resource;a.motion={...a.motion,phase,ticksLeft:G.seekTimeout,sequence:a.motion.sequence+1,waypoints:route.map(p=>({...p})),waypointIndex:0,partnerId:null,blockedTicks:0};}
function action(a:LionAnimal,phase:LionBehavior,ticks:number){a.currentBehavior=phase;a.motion={...a.motion,phase,ticksLeft:ticks,sequence:a.motion.sequence+1,waypoints:[],waypointIndex:0};}
function walk(s:RuntimeState,a:LionAnimal):'moving'|'arrived'|'blocked'{
 if(--a.motion.ticksLeft<=0||!a.target)return 'blocked';const h=habitat(s,a),waypoints=a.motion.waypoints;
 if(!waypoints.length)return lionDistance(a.position,a.target)<1e-7?'arrived':'blocked';
 const goal=waypoints[a.motion.waypointIndex]!;const dx=goal.x-a.position.x,dz=goal.z-a.position.z,d=lionDistance(a.position,goal),heading=d<1e-7?a.motion.heading:Math.atan2(dx,dz),error=angle(a.motion.heading,heading);
 a.motion.heading=angle(0,a.motion.heading+Math.max(-G.turn,Math.min(G.turn,error)));if(Math.abs(error)>.2)return 'moving';
 if(d>1e-7){const step=Math.min(G.speed,d),p={x:a.position.x+dx/d*step,z:a.position.z+dz/d*step};if(!lionSegmentAllowed(s.world,h,a.position,p,neighbors(s,a))){a.motion.blockedTicks++;return a.motion.blockedTicks>=18?'blocked':'moving';}a.motion.blockedTicks=0;a.motion.lastStep={x:p.x-a.position.x,z:p.z-a.position.z};a.motion.distanceWalked+=Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z);a.position=p;a.motion.elevation=lionGroundHeight(s.world,h,p);}
 if(lionDistance(a.position,goal)<1e-7){if(a.motion.waypointIndex+1<waypoints.length)a.motion.waypointIndex++;else return 'arrived';}return 'moving';
}
function choose(s:RuntimeState,a:LionAnimal,kind:LionResourceKind,slot:number):boolean{
 const h=habitat(s,a),others=s.animals.filter(isLion).filter(b=>b.id!==a.id),resources=s.world.resources.filter((r):r is LionResource=>r.habitatId===h.id&&r.kind===kind&&r.stock>0);
 for(let offset=0;offset<resources.length;offset++){
  const r=resources[(slot+a.foodEaten+offset)%resources.length]!;const ports=[...r.approaches].sort((p,q)=>lionDistance(a.position,p)-lionDistance(a.position,q)||p.z-q.z||p.x-q.x);
  for(const p of ports){if(others.some(b=>b.target&&lionDistance(b.target,p)<G.separation||lionDistance(b.position,p)<G.separation))continue;const route=lionGroundRoute(s.world,h,a.position,p,others.map(b=>b.position));if(!route)continue;
   const phase=kind==='lion-meat'?'seek-food':kind==='lion-water'?'seek-water':kind==='lion-den'?'seek-shade':kind==='lion-kopje'?'seek-kopje':kind==='lion-scent'?'seek-scent':'seek-log';travel(a,phase,route,p,r.id);return true;
  }
 }
 return false;
}
function depart(s:RuntimeState,a:LionAnimal,r:LionResource){
 const h=habitat(s,a),others=neighbors(s,a),nodes=lionGroundNodes(s.world,h,others).filter(p=>lionDistance(p,{x:r.cell.x+.5,z:r.cell.z+.5})>1.7&&lionDistance(p,a.position)>.8).sort((p,q)=>lionDistance(a.position,p)-lionDistance(a.position,q)||p.z-q.z||p.x-q.x);
 for(const p of nodes){const route=lionGroundRoute(s.world,h,a.position,p,others);if(route){travel(a,'wander',route,p,null);return;}}idle(a,5);
}
function escape(s:RuntimeState,a:LionAnimal,slot:number){const h=habitat(s,a),others=neighbors(s,a),closest=[...others].sort((p,q)=>lionDistance(a.position,p)-lionDistance(a.position,q))[0],nodes=lionGroundNodes(s.world,h,others).filter(p=>lionDistance(p,a.position)>.6&&lionDistance(p,a.position)<1.8).sort((p,q)=>(closest?lionDistance(q,closest)-lionDistance(p,closest):0)||lionDistance(p,a.position)-lionDistance(q,a.position)||p.z-q.z||p.x-q.x);for(const p of nodes){const route=lionGroundRoute(s.world,h,a.position,p,others);if(route){travel(a,'wander',route,p,null);return;}}idle(a,5+slot*3);}
function wander(s:RuntimeState,a:LionAnimal,slot:number){const h=habitat(s,a),others=neighbors(s,a),nodes=lionGroundNodes(s.world,h,others);for(let i=0;i<Math.min(12,nodes.length);i++){const p=nodes[(s.randomState+a.motion.sequence*13+slot*7+i)%nodes.length]!;if(lionDistance(a.position,p)<.8)continue;const route=lionGroundRoute(s.world,h,a.position,p,others);if(route){travel(a,'wander',route,p,null);return;}}idle(a,10);}
function stepSocial(s:RuntimeState,pride:LionAnimal[],events:ActionEvent[]):Set<string>{
 const occupied=new Set<string>();
 for(const a of pride){const b=pride.find(b=>b.id===a.motion.partnerId);if(!b||occupied.has(a.id))continue;occupied.add(a.id);occupied.add(b.id);
  const cancel=()=>{idle(a,5);idle(b,5);a.socialCooldownTicks=80;b.socialCooldownTicks=80;};
  if(b.motion.partnerId!==a.id||a.hunger>=45||a.thirst>=45||b.hunger>=45||b.thirst>=45){cancel();continue;}
  if(a.currentBehavior==='nuzzle'){a.motion.ticksLeft--;b.motion.ticksLeft--;if(a.motion.ticksLeft<=0){a.socialInteractions++;b.socialInteractions++;a.socialComfort=clamp(a.socialComfort+24);b.socialComfort=clamp(b.socialComfort+24);events.push({type:'lion-socialized',animalId:a.id,companionId:b.id,eventId:`${a.id}:social:${a.socialInteractions}`});idle(a,12);idle(b,18);a.socialCooldownTicks=700;b.socialCooldownTicks=700;}continue;}
  const x=walk(s,a),y=walk(s,b);if(x==='blocked'||y==='blocked'){cancel();continue;}
  if(x==='arrived'&&y==='arrived'){const d=lionDistance(a.position,b.position);if(d<.9-1e-7||d>1.15){cancel();continue;}const facing=(actor:LionAnimal,other:LionAnimal)=>{const heading=Math.atan2(other.position.x-actor.position.x,other.position.z-actor.position.z),delta=angle(actor.motion.heading,heading);actor.motion.heading=angle(0,actor.motion.heading+Math.max(-G.turn,Math.min(G.turn,delta)));return Math.abs(delta)<.2;};const readyA=facing(a,b),readyB=facing(b,a);if(readyA&&readyB){action(a,'nuzzle',24);action(b,'nuzzle',24);}}
 }
 if(s.tick%40!==0)return occupied;
 const free=pride.filter(a=>!occupied.has(a.id)&&!a.motion.partnerId&&['idle','wander'].includes(a.currentBehavior)&&a.hunger<30&&a.thirst<30&&a.energy>55&&a.enrichment>55&&a.socialCooldownTicks===0);
 for(const a of free){if(occupied.has(a.id))continue;for(const b of free){if(a===b||occupied.has(b.id)||a.habitatId!==b.habitatId)continue;const h=habitat(s,a),other=pride.filter(p=>p!==a).map(p=>p.position),goals=[{x:b.position.x-1,z:b.position.z},{x:b.position.x+1,z:b.position.z},{x:b.position.x,z:b.position.z-1},{x:b.position.x,z:b.position.z+1}];let paired=false;
   for(const goal of goals){const route=lionGroundRoute(s.world,h,a.position,goal,other);if(!route)continue;travel(a,'approach-companion',route,goal,null);travel(b,'approach-companion',[{...b.position}],b.position,null);a.motion.partnerId=b.id;b.motion.partnerId=a.id;occupied.add(a.id);occupied.add(b.id);paired=true;break;}if(paired)break;
  }}return occupied;
}
/** One canonical fixed tick. Renderer/audio are never consulted for needs, stock or event proof. */
export function stepLionCare(s:RuntimeState){
 const pride=s.animals.filter(isLion),fed:{animalId:string;resourceId:string}[]=[],watered:{animalId:string;resourceId:string}[]=[],events:ActionEvent[]=[];
 for(const a of pride){a.motion.lastStep={x:0,z:0};a.hunger=clamp(a.hunger+N.hungerPerTick);a.thirst=clamp(a.thirst+N.thirstPerTick);a.energy=clamp(a.energy-N.energyPerTick);a.enrichment=clamp(a.enrichment-N.enrichmentPerTick);a.shadeRest=clamp(a.shadeRest-.015);a.socialComfort=clamp(a.socialComfort-.004);for(const key of ['roarCooldownTicks','scentCooldownTicks','scratchCooldownTicks','socialCooldownTicks'] as const)if(a[key]>0)a[key]--;}
 const social=stepSocial(s,pride,events);
 const offset=pride.length?Math.floor(s.tick/40)%pride.length:0;
 for(let n=0;n<pride.length;n++){
  const slot=(n+offset)%pride.length,a=pride[slot]!,phase=a.motion.phase;if(social.has(a.id))continue;
  if(phase==='wander'||phase==='descend'){
   const status=walk(s,a);if(status==='blocked')escape(s,a,slot);else if(status==='arrived')idle(a,5);continue;
  }
  if(a.targetResourceId){
   const r=s.world.resources.find((r):r is LionResource=>r.id===a.targetResourceId&&r.kind.startsWith('lion-'));
   if(!r||r.stock<=0||!a.target||r.habitatId!==a.habitatId||(a.hunger>=N.criticalAt||a.thirst>=N.criticalAt)&&!['seek-food','eat','seek-water','drink'].includes(phase)){idle(a,0);continue;}
   if(phase.startsWith('seek-')||phase==='climb-ramp'){
    const status=walk(s,a);if(status==='blocked'){escape(s,a,slot);continue;}if(status==='arrived'){if(r.kind!=='lion-kopje'&&r.kind!=='lion-den'){const face=Math.atan2(r.cell.x+.5-a.position.x,r.cell.z+.5-a.position.z),error=angle(a.motion.heading,face);a.motion.heading=angle(0,a.motion.heading+Math.max(-G.turn,Math.min(G.turn,error)));if(Math.abs(error)>.16)continue;}const next=phase==='seek-food'?'eat':phase==='seek-water'?'drink':phase==='seek-shade'?'rest':phase==='seek-scent'?'sniff':phase==='seek-log'?'scratch':'lookout';action(a,next,next==='rest'?N.restTicks:next==='lookout'?35:N.actionTicks);}else if(r.kind==='lion-kopje'&&a.motion.elevation>0&&phase!=='climb-ramp'){a.currentBehavior='climb-ramp';a.motion.phase='climb-ramp';}continue;
   }
   if(lionDistance(a.position,a.target)>.001){idle(a,0);continue;}if(--a.motion.ticksLeft>0)continue;
   if(phase==='eat'){r.stock--;a.hunger=clamp(a.hunger-N.foodRelief);a.foodEaten++;fed.push({animalId:a.id,resourceId:r.id});}
   else if(phase==='drink'){r.stock--;a.thirst=clamp(a.thirst-N.waterRelief);a.waterDrunk++;watered.push({animalId:a.id,resourceId:r.id});}
   else if(phase==='rest'){a.energy=clamp(a.energy+N.restEnergy);a.shadeRest=clamp(a.shadeRest+N.shadeRelief);a.restedTicks+=N.restTicks;}
   else if(phase==='sniff'){r.stock--;a.enrichment=clamp(a.enrichment+35);a.scentInvestigations++;a.enrichedTicks+=N.actionTicks;a.scentCooldownTicks=450;events.push({type:'lion-investigated-scent',animalId:a.id,resourceId:r.id,eventId:`${a.id}:scent:${a.scentInvestigations}`});}
   else if(phase==='scratch'){r.stock--;a.enrichment=clamp(a.enrichment+25);a.scratches++;a.enrichedTicks+=N.actionTicks;a.scratchCooldownTicks=500;events.push({type:'lion-scratched',animalId:a.id,resourceId:r.id,eventId:`${a.id}:scratch:${a.scratches}`});}
   else if(phase==='lookout'){if(a.roarCooldownTicks===0&&Math.abs(a.motion.elevation-.65)<1e-7){action(a,'roar',30);continue;}depart(s,a,r);continue;}
   else if(phase==='roar'){
    if(a.roarCooldownTicks===0&&r.kind==='lion-kopje'&&Math.abs(a.motion.elevation-.65)<1e-7&&lionDistance(a.position,r.approaches[0]!)<.001){a.roars++;a.roarCooldownTicks=1200;events.push({type:'lion-roared',animalId:a.id,resourceId:r.id,eventId:`${a.id}:roar:${a.roars}`});}
    const foot={x:r.cell.x+.5,z:r.cell.z+2.5},route=lionGroundRoute(s.world,habitat(s,a),a.position,foot,neighbors(s,a));if(route){travel(a,'descend',route,foot,r.id);continue;}
   }
   depart(s,a,r);continue;
  }
  if(a.motion.ticksLeft>0){a.motion.ticksLeft--;continue;}
  const needs=a.thirst>a.hunger?['lion-water','lion-meat'] as const:['lion-meat','lion-water'] as const;let started=false;
  for(const kind of needs)if((kind==='lion-water'?a.thirst:a.hunger)>=N.seekAt&&choose(s,a,kind,slot)){started=true;break;}if(started)continue;
  if((a.energy<55||a.shadeRest<50)&&choose(s,a,'lion-den',slot))continue;
  if(a.enrichment<80&&a.scentCooldownTicks===0&&choose(s,a,'lion-scent',slot))continue;
  if(a.enrichment<85&&a.scratchCooldownTicks===0&&choose(s,a,'lion-scratch',slot))continue;
  if(a.roarCooldownTicks===0&&a.hunger<65&&a.thirst<65&&choose(s,a,'lion-kopje',slot))continue;
  if(a.energy<80&&choose(s,a,'lion-den',slot))continue;
  wander(s,a,slot);
 }
 reconcileLionWelfare(s);return {fed,watered,events};
}
