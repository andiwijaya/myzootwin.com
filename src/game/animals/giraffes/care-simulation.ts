import type {RuntimeState} from '../../core/runtime-state.ts';
import type {Point} from '../../core/state.ts';
import {giraffes,type GiraffeAnimal,type GiraffeHabitat,type GiraffeResource,type GiraffeResourceKind,type GiraffeBehavior} from '../../core/giraffe-state.ts';
import {GIRAFFE_NEEDS as N} from './rules.ts';
import {GIRAFFE_GROUND as G,giraffeDistance as distance,giraffeGroundRoute as routeTo,giraffeSegmentAllowed,giraffeGroundNodes as nodesIn} from './ground.ts';
import {reconcileGiraffeWelfare} from './welfare.ts';
type Event={type:'giraffe-browsed'|'giraffe-enriched';animalId:string;resourceId:string;eventId:string}|{type:'giraffe-socialized';animalId:string;companionId:string;eventId:string};
const clamp=(n:number)=>Math.max(0,Math.min(100,n)),angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const home=(s:RuntimeState,a:GiraffeAnimal)=>s.world.habitats.find((h):h is GiraffeHabitat=>h.kind==='giraffe-plains'&&h.id===a.habitatId)!;
const neighbors=(s:RuntimeState,a:GiraffeAnimal)=>giraffes(s.animals).filter(b=>b.id!==a.id).map(b=>b.position);
function idle(a:GiraffeAnimal,ticks=8){a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion={...a.motion,phase:'idle',ticksLeft:ticks,sequence:a.motion.sequence+1,waypoints:[],waypointIndex:0,partnerId:null,blockedTicks:0};}
function travel(a:GiraffeAnimal,phase:GiraffeBehavior,route:Point[],target:Point,resource:string|null){a.currentBehavior=phase;a.target={...target};a.targetResourceId=resource;a.motion={...a.motion,phase,ticksLeft:G.seekTimeout,sequence:a.motion.sequence+1,waypoints:route.map(p=>({...p})),waypointIndex:0,partnerId:null,blockedTicks:0};}
function action(a:GiraffeAnimal,phase:GiraffeBehavior,ticks:number){a.currentBehavior=phase;a.motion={...a.motion,phase,ticksLeft:ticks,sequence:a.motion.sequence+1,waypoints:[],waypointIndex:0};}
function walk(s:RuntimeState,a:GiraffeAnimal):'moving'|'arrived'|'blocked'{
 if(--a.motion.ticksLeft<=0||!a.target)return 'blocked';const h=home(s,a),points=a.motion.waypoints;if(!points.length)return distance(a.position,a.target)<1e-7?'arrived':'blocked';
 const goal=points[a.motion.waypointIndex]!,dx=goal.x-a.position.x,dz=goal.z-a.position.z,d=distance(a.position,goal),heading=d<1e-7?a.motion.heading:Math.atan2(dx,dz),error=angle(a.motion.heading,heading);a.motion.heading=angle(0,a.motion.heading+Math.max(-G.turn,Math.min(G.turn,error)));if(Math.abs(error)>.18)return 'moving';
 if(d>1e-7){const step=Math.min(G.speed,d),p={x:a.position.x+dx/d*step,z:a.position.z+dz/d*step};if(!giraffeSegmentAllowed(s.world,h,a.position,p,neighbors(s,a))){a.motion.blockedTicks++;return a.motion.blockedTicks>=18?'blocked':'moving';}a.motion.blockedTicks=0;a.motion.lastStep={x:p.x-a.position.x,z:p.z-a.position.z};a.motion.distanceWalked+=Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z);a.position=p;}
 if(distance(a.position,goal)<1e-7){if(a.motion.waypointIndex+1<points.length)a.motion.waypointIndex++;else return 'arrived';}return 'moving';
}
function choose(s:RuntimeState,a:GiraffeAnimal,kind:GiraffeResourceKind,slot:number){
 const h=home(s,a),others=giraffes(s.animals).filter(b=>b!==a),resources=s.world.resources.filter((r):r is GiraffeResource=>r.kind===kind&&r.habitatId===h.id&&r.stock>0);
 for(let i=0;i<resources.length;i++){const r=resources[(slot+a.foodEaten+i)%resources.length]!;for(const p of [...r.approaches].sort((p,q)=>distance(a.position,p)-distance(a.position,q)||p.z-q.z||p.x-q.x)){
  if(others.some(b=>b.target&&distance(b.target,p)<G.separation||distance(b.position,p)<G.separation))continue;const route=routeTo(s.world,h,a.position,p,others.map(b=>b.position));if(!route)continue;travel(a,kind==='giraffe-browse'?'seek-browse':kind==='giraffe-water'?'seek-water':kind==='giraffe-shade'?'seek-shade':'seek-enrichment',route,p,r.id);return true;
 }}return false;
}
function depart(s:RuntimeState,a:GiraffeAnimal,r:GiraffeResource){
 const h=home(s,a),others=neighbors(s,a),points=nodesIn(s.world,h,others).filter(p=>distance(p,{x:r.cell.x+.5,z:r.cell.z+.5})>1.7&&distance(p,a.position)>.8).sort((p,q)=>distance(a.position,p)-distance(a.position,q)||p.z-q.z||p.x-q.x);
 for(const p of points){const route=routeTo(s.world,h,a.position,p,others);if(route){travel(a,'wander',route,p,null);return;}}idle(a,5);
}
function wander(s:RuntimeState,a:GiraffeAnimal,slot:number,escape=false){
 const h=home(s,a),others=neighbors(s,a),points=nodesIn(s.world,h,others);if(escape)points.sort((p,q)=>Math.min(...others.map(o=>distance(q,o)),10)-Math.min(...others.map(o=>distance(p,o)),10)||distance(a.position,p)-distance(a.position,q));
 for(let i=0;i<Math.min(16,points.length);i++){const p=points[escape?i:(s.randomState+a.motion.sequence*13+slot*7+i)%points.length]!;if(distance(p,a.position)<.6)continue;const route=routeTo(s.world,h,a.position,p,others);if(route){travel(a,'wander',route,p,null);return;}}idle(a,5+slot*3);
}
function socialStep(s:RuntimeState,herd:GiraffeAnimal[],events:Event[]){
 const occupied=new Set<string>();
 for(const a of herd){const b=herd.find(b=>b.id===a.motion.partnerId);if(!b||occupied.has(a.id))continue;occupied.add(a.id);occupied.add(b.id);const cancel=()=>{idle(a,5);idle(b,5);a.socialCooldownTicks=b.socialCooldownTicks=80;};
  if(b.motion.partnerId!==a.id||a.hunger>=55||a.thirst>=55||b.hunger>=55||b.thirst>=55){cancel();continue;}
  if(a.currentBehavior==='social'){a.motion.ticksLeft--;b.motion.ticksLeft--;if(a.motion.ticksLeft<=0){a.socialInteractions++;b.socialInteractions++;a.socialComfort=clamp(a.socialComfort+20);b.socialComfort=clamp(b.socialComfort+20);events.push({type:'giraffe-socialized',animalId:a.id,companionId:b.id,eventId:`${a.id}:social:${a.socialInteractions}`});idle(a,10);idle(b,14);a.socialCooldownTicks=b.socialCooldownTicks=650;}continue;}
  const x=walk(s,a),y=walk(s,b);if(x==='blocked'||y==='blocked'){cancel();continue;}if(x==='arrived'&&y==='arrived'){const d=distance(a.position,b.position);if(d<1.05-1e-7||d>1.5){cancel();continue;}const face=(actor:GiraffeAnimal,other:GiraffeAnimal)=>{const target=Math.atan2(other.position.x-actor.position.x,other.position.z-actor.position.z),delta=angle(actor.motion.heading,target);actor.motion.heading=angle(0,actor.motion.heading+Math.max(-G.turn,Math.min(G.turn,delta)));return Math.abs(delta)<.2;};const aReady=face(a,b),bReady=face(b,a);if(aReady&&bReady){action(a,'social',30);action(b,'social',30);}}
 }
 if(s.tick%40!==0)return occupied;
 const free=herd.filter(a=>!occupied.has(a.id)&&!a.motion.partnerId&&['idle','wander'].includes(a.currentBehavior)&&a.hunger<40&&a.thirst<40&&a.energy>40&&a.socialCooldownTicks===0);
 for(const a of free){if(occupied.has(a.id))continue;for(const b of free){if(a===b||occupied.has(b.id)||a.habitatId!==b.habitatId)continue;const h=home(s,a),others=herd.filter(p=>p!==a).map(p=>p.position),goals=[{x:b.position.x-1.25,z:b.position.z},{x:b.position.x+1.25,z:b.position.z},{x:b.position.x,z:b.position.z-1.25},{x:b.position.x,z:b.position.z+1.25}];let paired=false;
  for(const goal of goals){const route=routeTo(s.world,h,a.position,goal,others);if(!route)continue;travel(a,'approach-companion',route,goal,null);travel(b,'approach-companion',[{...b.position}],b.position,null);a.motion.partnerId=b.id;b.motion.partnerId=a.id;occupied.add(a.id);occupied.add(b.id);paired=true;break;}if(paired)break;
 }}return occupied;
}
/** Called once by the canonical100ms clock. All contact, portions and outcomes live in saved state. */
export function stepGiraffeCare(s:RuntimeState){
 const herd=giraffes(s.animals),fed:{animalId:string;resourceId:string}[]=[],watered:{animalId:string;resourceId:string}[]=[],events:Event[]=[];
 for(const a of herd){a.motion.lastStep={x:0,z:0};a.hunger=clamp(a.hunger+N.hungerPerTick);a.thirst=clamp(a.thirst+N.thirstPerTick);a.energy=clamp(a.energy-N.energyPerTick);a.enrichment=clamp(a.enrichment-N.enrichmentPerTick);a.shadeRest=clamp(a.shadeRest-.015);a.socialComfort=clamp(a.socialComfort-.004);if(a.socialCooldownTicks>0)a.socialCooldownTicks--;if(a.enrichmentCooldownTicks>0)a.enrichmentCooldownTicks--;}
 const social=socialStep(s,herd,events),offset=herd.length?Math.floor(s.tick/40)%herd.length:0;
 for(let n=0;n<herd.length;n++){const slot=(n+offset)%herd.length,a=herd[slot]!,phase=a.motion.phase;if(social.has(a.id))continue;
  if(phase==='wander'){const status=walk(s,a);if(status==='blocked')wander(s,a,slot,true);else if(status==='arrived')idle(a,5);continue;}
  if(a.targetResourceId){const r=s.world.resources.find((r):r is GiraffeResource=>r.id===a.targetResourceId&&r.kind.startsWith('giraffe-'));
   if(!r||r.stock<=0||!a.target||r.habitatId!==a.habitatId||(a.hunger>=75||a.thirst>=75)&&!['seek-browse','browse','seek-water','drink'].includes(phase)){idle(a,0);continue;}
   if(phase.startsWith('seek-')){const status=walk(s,a);if(status==='blocked'){wander(s,a,slot,true);continue;}if(status==='arrived'){const facing=Math.atan2(r.cell.x+.5-a.position.x,r.cell.z+.5-a.position.z),error=angle(a.motion.heading,facing);a.motion.heading=angle(0,a.motion.heading+Math.max(-G.turn,Math.min(G.turn,error)));if(Math.abs(error)>.16)continue;action(a,phase==='seek-browse'?'browse':phase==='seek-water'?'drink':phase==='seek-shade'?'rest':'enrich',phase==='seek-shade'?N.restTicks:N.actionTicks);}continue;}
   if(distance(a.position,a.target)>.001){idle(a,0);continue;}
   if(--a.motion.ticksLeft>0){if(phase==='rest'&&a.motion.ticksLeft===N.restTicks/2){a.currentBehavior=a.motion.phase='ruminate';}continue;}
   if(phase==='browse'){r.stock--;a.hunger=clamp(a.hunger-N.foodRelief);a.foodEaten++;a.highBrowses++;fed.push({animalId:a.id,resourceId:r.id});events.push({type:'giraffe-browsed',animalId:a.id,resourceId:r.id,eventId:`${a.id}:browse:${a.highBrowses}`});}
   else if(phase==='drink'){r.stock--;a.thirst=clamp(a.thirst-N.waterRelief);a.waterDrunk++;watered.push({animalId:a.id,resourceId:r.id});}
   else if(phase==='rest'||phase==='ruminate'){a.energy=clamp(a.energy+N.restEnergy);a.shadeRest=clamp(a.shadeRest+N.shadeRelief);a.restedTicks+=N.restTicks;}
   else if(phase==='enrich'){r.stock--;a.enrichment=clamp(a.enrichment+35);a.enrichedTicks+=N.actionTicks;a.enrichmentCooldownTicks=450;events.push({type:'giraffe-enriched',animalId:a.id,resourceId:r.id,eventId:`${a.id}:enrich:${a.enrichedTicks}`});}
   depart(s,a,r);continue;
  }
  if(a.motion.ticksLeft>0){a.motion.ticksLeft--;continue;}
  const needs=a.thirst>a.hunger?['giraffe-water','giraffe-browse'] as const:['giraffe-browse','giraffe-water'] as const;let started=false;for(const kind of needs)if((kind==='giraffe-water'?a.thirst:a.hunger)>=N.seekAt&&choose(s,a,kind,slot)){started=true;break;}if(started)continue;
  if((a.energy<60||a.shadeRest<55)&&choose(s,a,'giraffe-shade',slot))continue;
  if(a.enrichment<80&&a.enrichmentCooldownTicks===0&&choose(s,a,'giraffe-enrichment',slot))continue;
  wander(s,a,slot);
 }
 reconcileGiraffeWelfare(s);return {fed,watered,events};
}
