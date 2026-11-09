import{cancelZebraSocial,prepareZebraSocial,stepZebraSocial,zebraSocialPhase,zebraSocialHealthy}from'./social.ts';
import{prepareZebraHerd,stepZebraHerd}from'./herd.ts';
import type {RuntimeState} from '../../core/runtime-state.ts';
import {zebras,type ZebraAnimal,type ZebraHabitat,type ZebraResource} from '../../core/zebra-state.ts';
import {ZEBRA_NEEDS as N,ZEBRA_GROUND as G,ZEBRA_HERD as H,ZEBRA_SOCIAL as S} from './rules.ts';
import {zebraDistance as distance,zebraGroundRoute} from './ground.ts';
import {zebraBodySweepAllowed} from './body.ts';
import {stepZebraMovement,walkZebraGround,zebraIdle,zebraAngle} from './movement.ts';
type CareEvent={type:'zebra-grazed'|'zebra-drank'|'zebra-rested'|'zebra-enriched';animalId:string;resourceId:string;eventId:string};
type Kind='zebra-graze'|'zebra-water'|'zebra-shade'|'zebra-enrichment';
const phases={'zebra-graze':['seek-graze','graze',N.grazeTicks],'zebra-water':['seek-water','drink',N.drinkTicks],'zebra-shade':['seek-shade','rest',N.restTicks],'zebra-enrichment':['seek-enrichment','enrich',N.enrichTicks]}as const;
const home=(s:RuntimeState,a:ZebraAnimal)=>s.world.habitats.find((h):h is ZebraHabitat=>h.kind==='zebra-grasslands'&&h.id===a.habitatId);
const isContact=(a:ZebraAnimal)=>['graze','drink','rest','enrich'].includes(a.currentBehavior);
const isCare=(a:ZebraAnimal)=>isContact(a)||['seek-graze','seek-water','seek-shade','seek-enrichment'].includes(a.currentBehavior);
function chooseResource(s:RuntimeState,a:ZebraAnimal,slot:number,herd:ZebraAnimal[],kind:Kind){
 const h=home(s,a);if(!h)return false;const others=herd.filter(b=>b!==a),resources=s.world.resources.filter((r):r is ZebraResource=>r.kind===kind&&r.habitatId===h.id&&r.stock>0);
 for(let i=0;i<resources.length;i++){const r=resources[(slot+a.grazes+a.waterDrunk+a.motion.sequence+i)%resources.length]!;
  for(const p of [...r.approaches].sort((p,q)=>distance(a.position,p)-distance(a.position,q)||p.z-q.z||p.x-q.x)){
   if(distance(p,{x:r.cell.x+.5,z:r.cell.z+.5})>N.maxFeedApproach)continue;
   if(others.some(b=>distance(b.position,p)<G.separation||b.target&&distance(b.target,p)<G.separation))continue;
   const route=zebraGroundRoute(s.world,h,a.position,p,others.map(b=>b.position));if(!route)continue;
   a.target={...p};a.targetResourceId=r.id;a.currentBehavior=phases[kind][0];
   a.motion={...a.motion,phase:a.currentBehavior,ticksLeft:G.seekTimeout,sequence:a.motion.sequence+1,waypoints:route,waypointIndex:0,partnerId:null,herdLeaderId:null,blockedTicks:0};return true;
  }
 }return false;
}
/** One canonical100ms step. Only completed true contact consumes one real portion.
 * No rendering, wall-time, extra random draw, automatic refill or mission credit. */
export function stepZebraCare(s:RuntimeState){
 const herd=zebras(s.animals),fed:{animalId:string;resourceId:string}[]=[],watered:{animalId:string;resourceId:string}[]=[],events:CareEvent[]=[],offset=herd.length?s.tick%herd.length:0;
 for(let n=0;n<herd.length;n++){const a=herd[(n+offset)%herd.length]!;a.hunger=Math.min(100,a.hunger+N.hungerPerTick);a.thirst=Math.min(100,a.thirst+N.thirstPerTick);a.energy=Math.max(0,a.energy-N.energyPerTick);a.shadeRest=Math.max(0,a.shadeRest-N.shadePerTick);a.enrichment=Math.max(0,a.enrichment-N.enrichmentPerTick);a.enrichmentCooldownTicks=Math.max(0,a.enrichmentCooldownTicks-1);a.trotCooldownTicks=Math.max(0,a.trotCooldownTicks-1);a.groomCooldownTicks=Math.max(0,a.groomCooldownTicks-1);a.socialComfort=Math.max(0,a.socialComfort-S.perTick);
  if(zebraSocialPhase(a)&&!zebraSocialHealthy(a))cancelZebraSocial(s,a);
  if(['follow-herd','trot'].includes(a.currentBehavior)&&(a.hunger>=N.seekAt||a.thirst>=N.seekAt||a.energy<H.minEnergy||a.shadeRest<55||a.enrichment<35))zebraIdle(a,0);
  if(['seek-shade','rest','seek-enrichment','enrich'].includes(a.currentBehavior)&&(a.hunger>=75||a.thirst>=75))zebraIdle(a,0);
 }
 // Food/water and deficient shade/energy preempt via the healthy predicate.
 // An adequately cared-for adult may choose company before optional enrichment.
 prepareZebraSocial(s);
 for(let n=0;n<herd.length;n++){const a=herd[(n+offset)%herd.length]!;
  if(!['idle','wander'].includes(a.currentBehavior))continue;
  const thirsty=a.thirst>=N.seekAt,hungry=a.hunger>=N.seekAt;
  if(thirsty&&a.thirst>=70&&a.hunger<85&&chooseResource(s,a,n,herd,'zebra-water'))continue;
  if(hungry&&chooseResource(s,a,n,herd,'zebra-graze'))continue;
  if(thirsty&&chooseResource(s,a,n,herd,'zebra-water'))continue;
  if(hungry||thirsty)continue;
  if((a.energy<N.restAt||a.shadeRest<55)&&chooseResource(s,a,n,herd,'zebra-shade'))continue;
  if(a.enrichment<N.enrichAt&&a.enrichmentCooldownTicks===0)chooseResource(s,a,n,herd,'zebra-enrichment');
 }prepareZebraHerd(s);stepZebraMovement(s);const herdEvents=stepZebraHerd(s),socialEvents=stepZebraSocial(s);
 for(let n=0;n<herd.length;n++){const a=herd[(n+offset)%herd.length]!;if(!isCare(a))continue;
  const kind=(Object.keys(phases)as Kind[]).find(k=>(phases[k]as readonly string[]).includes(a.currentBehavior))!,drinking=kind==='zebra-water',resting=kind==='zebra-shade',enriching=kind==='zebra-enrichment',r=s.world.resources.find((r):r is ZebraResource=>r.kind===kind&&r.id===a.targetResourceId&&r.habitatId===a.habitatId),h=home(s,a);
  if(!r||r.stock<=0||!h||!a.target||distance(a.target,{x:r.cell.x+.5,z:r.cell.z+.5})>N.maxFeedApproach){zebraIdle(a,0);continue;}
  if(!isContact(a)){
   if(walkZebraGround(s,a,h,herd.filter(b=>b!==a)))continue;
   if(distance(a.position,a.target)>.001){zebraIdle(a,6);continue;}
   const facing=Math.atan2(r.cell.x+.5-a.position.x,r.cell.z+.5-a.position.z),heading=facing,delta=zebraAngle(a.motion.heading,heading),next=zebraAngle(0,a.motion.heading+Math.max(-G.turn,Math.min(G.turn,delta))),posts=s.world.resources.filter(r=>r.kind==='zebra-shade'&&r.habitatId===h.id).map(r=>({x:r.cell.x+.5,z:r.cell.z+.5}));
   if(!zebraBodySweepAllowed(a,a.position,next,herd.filter(b=>b!==a),posts)){zebraIdle(a,6);continue;}
   a.motion.heading=next;if(Math.abs(delta)>.12)continue;a.currentBehavior=a.motion.phase=phases[kind][1];a.motion.ticksLeft=phases[kind][2];a.motion.sequence++;a.motion.waypoints=[];a.motion.waypointIndex=0;a.motion.lastStep={x:0,z:0};continue;
  }
  if(distance(a.position,a.target)>.001||!r.approaches.some(p=>distance(p,a.position)<.001)){zebraIdle(a,0);continue;}
  if(--a.motion.ticksLeft>0)continue;
  if(!resting){r.stock--;r.revision++;}
  if(resting){a.energy=Math.min(100,a.energy+N.restEnergy);a.shadeRest=Math.min(100,a.shadeRest+N.shadeRelief);a.restedTicks+=N.restTicks;events.push({type:'zebra-rested',animalId:a.id,resourceId:r.id,eventId:a.id+':rest:'+a.restedTicks});}
  else if(enriching){a.enrichment=Math.min(100,a.enrichment+N.enrichRelief);a.enrichedTicks+=N.enrichTicks;a.enrichmentCooldownTicks=N.enrichCooldown;events.push({type:'zebra-enriched',animalId:a.id,resourceId:r.id,eventId:a.id+':enrich:'+a.enrichedTicks});}
  else if(drinking){a.thirst=Math.max(0,a.thirst-N.waterRelief);a.waterDrunk++;watered.push({animalId:a.id,resourceId:r.id});events.push({type:'zebra-drank',animalId:a.id,resourceId:r.id,eventId:a.id+':drink:'+a.waterDrunk});}
  else{a.hunger=Math.max(0,a.hunger-N.foodRelief);a.foodEaten++;a.grazes++;fed.push({animalId:a.id,resourceId:r.id});events.push({type:'zebra-grazed',animalId:a.id,resourceId:r.id,eventId:a.id+':graze:'+a.grazes});}zebraIdle(a,0);
 }
 // Another resident may consume the last portion later in this same atomic tick.
 for(const a of herd)if(isCare(a)&&!s.world.resources.some(r=>r.id===a.targetResourceId&&r.stock>0))zebraIdle(a,0);
 return{fed,watered,events,herdEvents,socialEvents};
}
