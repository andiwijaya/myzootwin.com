import type{RuntimeState}from'../../core/runtime-state.ts';
import{zebras,type ZebraAnimal,type ZebraHabitat}from'../../core/zebra-state.ts';
import{ZEBRA_GROUND as G,ZEBRA_NEEDS as N,ZEBRA_SOCIAL as S}from'./rules.ts';
import{zebraBodySweepAllowed,zebraGroomHeadInside}from'./body.ts';
import{zebraBounds,zebraDistance as distance,zebraGroundRoute,zebraPointAllowed}from'./ground.ts';
import{zebraGroomContact,zebraGroomHeading,zebraGroomOffset}from'./groom-contact.ts';
import{walkZebraGround,zebraAngle,zebraIdle}from'./movement.ts';
export type ZebraGroomEvent={type:'zebra-groomed';animalIds:[string,string];eventId:string};
export const zebraSocialPhase=(a:ZebraAnimal)=>a.currentBehavior==='approach-companion'||a.currentBehavior==='groom';
export const zebraSocialHealthy=(a:ZebraAnimal)=>a.hunger<N.seekAt&&a.thirst<N.seekAt&&a.energy>=S.minEnergy&&a.shadeRest>=55&&a.enrichment>=35;
const home=(s:RuntimeState,a:ZebraAnimal)=>s.world.habitats.find((h):h is ZebraHabitat=>h.kind==='zebra-grasslands'&&h.id===a.habitatId);
const posts=(s:RuntimeState,a:ZebraAnimal)=>s.world.resources.filter(r=>r.kind==='zebra-shade'&&r.habitatId===a.habitatId).map(r=>({x:r.cell.x+.5,z:r.cell.z+.5}));
/** Release both reservations atomically; an interrupted approach/contact earns no
 * social relief, completed encounter, resource debit, mission or cash credit. */
export function cancelZebraSocial(s:RuntimeState,a:ZebraAnimal){const b=zebras(s.animals).find(b=>b.id===a.motion.partnerId);for(const who of b&&b.motion.partnerId===a.id?[a,b]:[a]){zebraIdle(who,0);who.groomCooldownTicks=S.retry;}}
function finalPair(a:ZebraAnimal,b:ZebraAnimal,heading:number){const x=structuredClone(a),y=structuredClone(b);x.currentBehavior=x.motion.phase=y.currentBehavior=y.motion.phase='groom';x.target={...x.position};y.position=zebraGroomOffset(x.position,heading);y.target={...y.position};x.motion.heading=heading;y.motion.heading=zebraAngle(0,heading+Math.PI);x.motion.partnerId=y.id;y.motion.partnerId=x.id;return[x,y]as const;}
/** Only a healthy available adult seeks company. Choose lowest encounter counts
 * first, with rotating tie order. One bounded pair leaves two adults free. */
export function prepareZebraSocial(s:RuntimeState){const herd=zebras(s.animals);for(const a of herd)if(zebraSocialPhase(a)){const b=herd.find(b=>b.id===a.motion.partnerId);if(!b||b.motion.partnerId!==a.id||b.currentBehavior!==a.currentBehavior||!zebraSocialHealthy(a)||!zebraSocialHealthy(b))cancelZebraSocial(s,a);}
 if(!herd.length||s.tick%S.checkEvery!==0||herd.some(zebraSocialPhase))return;
 const offset=Math.floor(s.tick/S.checkEvery)%herd.length,rotated=Array.from({length:herd.length},(_,i)=>herd[(i+offset)%herd.length]!),available=rotated.filter(a=>['idle','wander'].includes(a.currentBehavior)&&a.groomCooldownTicks===0&&zebraSocialHealthy(a)).sort((a,b)=>a.groomings-b.groomings);
 for(const a of available){if(a.socialComfort>=S.startAt)continue;const h=home(s,a);if(!h)continue;for(const b of available){if(a===b||a.habitatId!==b.habitatId||distance(a.position,b.position)>4.5)continue;const others=herd.filter(c=>c!==a&&c!==b),obstacles=herd.filter(c=>c!==b).flatMap(c=>c.targetResourceId&&c.target?[c.position,c.target]:[c.position]),angles=[0,Math.PI/2,Math.PI,-Math.PI/2].sort((x,y)=>distance(zebraGroomOffset(a.position,x),b.position)-distance(zebraGroomOffset(a.position,y),b.position));
   for(const heading of angles){const[x,y]=finalPair(a,b,heading);if(!zebraPointAllowed(s.world,h,y.position,obstacles)||!zebraGroomHeadInside(x,zebraBounds(h))||!zebraGroomHeadInside(y,zebraBounds(h))||!zebraBodySweepAllowed(x,x.position,x.motion.heading,[y,...others],posts(s,a))||!zebraBodySweepAllowed(y,y.position,y.motion.heading,[x,...others],posts(s,b)))continue;const route=zebraGroundRoute(s.world,h,b.position,y.position,obstacles);if(!route)continue;
    for(const[who,other,target,waypoints]of[[a,b,x.position,[]],[b,a,y.position,route]]as const){zebraIdle(who,0);who.currentBehavior='approach-companion';who.target={...target};who.motion={...who.motion,phase:'approach-companion',ticksLeft:S.approachTimeout,sequence:who.motion.sequence+1,waypoints:waypoints.map(p=>({...p})),waypointIndex:0,partnerId:other.id,herdLeaderId:null,blockedTicks:0};}return;
   }
  }
 }
}
function approach(s:RuntimeState,a:ZebraAnimal,b:ZebraAnimal,herd:ZebraAnimal[]){const h=home(s,a),heading=zebraGroomHeading(a,b);if(!h||!a.target||heading===null)return false;if(distance(a.position,a.target)>.001){const moving=walkZebraGround(s,a,h,herd.filter(c=>c!==a));return moving||a.motion.ticksLeft>0&&distance(a.position,a.target)<.001;}
 if(--a.motion.ticksLeft<=0)return false;const delta=zebraAngle(a.motion.heading,heading),next=zebraAngle(0,a.motion.heading+Math.max(-G.turn,Math.min(G.turn,delta)));if(!zebraBodySweepAllowed(a,a.position,next,herd.filter(c=>c!==a),posts(s,a)))return false;a.motion.heading=next;return true;
}
/** Advance each real adult once, using the sole canonical100ms clock. */
export function stepZebraSocial(s:RuntimeState){const herd=zebras(s.animals),events:ZebraGroomEvent[]=[];for(const a of herd){if(!zebraSocialPhase(a)||!a.motion.partnerId||a.id>a.motion.partnerId)continue;const b=herd.find(b=>b.id===a.motion.partnerId);if(!b||b.motion.partnerId!==a.id||b.currentBehavior!==a.currentBehavior||!zebraSocialHealthy(a)||!zebraSocialHealthy(b)){cancelZebraSocial(s,a);continue;}
  if(a.currentBehavior==='approach-companion'){const pair=s.tick%2?[a,b]:[b,a];let valid=true;for(const who of pair)if(!approach(s,who,who===a?b:a,herd)){valid=false;break;}if(!valid){cancelZebraSocial(s,a);continue;}if(!zebraGroomContact(a,b))continue;const x=structuredClone(a),y=structuredClone(b);x.currentBehavior=y.currentBehavior='groom';if(!zebraBodySweepAllowed(x,x.position,x.motion.heading,herd.map(c=>c===b?y:c).filter(c=>c!==a),posts(s,a))||!zebraBodySweepAllowed(y,y.position,y.motion.heading,herd.map(c=>c===a?x:c).filter(c=>c!==b),posts(s,b))){cancelZebraSocial(s,a);continue;}
   for(const who of[a,b]){who.currentBehavior=who.motion.phase='groom';who.motion.ticksLeft=S.ticks;who.motion.sequence++;who.motion.waypoints=[];who.motion.waypointIndex=0;}continue;
  }
  if(!zebraGroomContact(a,b)||!zebraBodySweepAllowed(a,a.position,a.motion.heading,herd.filter(c=>c!==a),posts(s,a))||!zebraBodySweepAllowed(b,b.position,b.motion.heading,herd.filter(c=>c!==b),posts(s,b))){cancelZebraSocial(s,a);continue;}
  a.motion.ticksLeft--;b.motion.ticksLeft--;if(a.motion.ticksLeft>0&&b.motion.ticksLeft>0)continue;
  for(const who of[a,b]){who.socialComfort=Math.min(100,who.socialComfort+S.relief);who.groomings++;zebraIdle(who,8);who.groomCooldownTicks=S.cooldown;}
  events.push({type:'zebra-groomed',animalIds:[a.id,b.id],eventId:a.id+':'+b.id+':groom:'+a.groomings+':'+b.groomings});
 }
 return events;
}
