import type{RuntimeState}from'../../core/runtime-state.ts';import{zebras,type ZebraAnimal,type ZebraHabitat}from'../../core/zebra-state.ts';import{ZEBRA_GROUND as G,ZEBRA_HERD as H,ZEBRA_NEEDS as N}from'./rules.ts';import{zebraDistance as distance,zebraGroundRoute,zebraPointAllowed}from'./ground.ts';import{walkZebraGround,zebraIdle}from'./movement.ts';
export type ZebraTrotEvent={type:'zebra-trotted';animalId:string;eventId:string;distance:number};
const healthy=(a:ZebraAnimal)=>a.hunger<N.seekAt&&a.thirst<N.seekAt&&a.energy>H.minEnergy&&a.shadeRest>=55&&a.enrichment>=35;
const home=(s:RuntimeState,a:ZebraAnimal)=>s.world.habitats.find((h):h is ZebraHabitat=>h.kind==='zebra-grasslands'&&h.id===a.habitatId);
const leaderAllowed=(a:ZebraAnimal)=>a.motion.herdLeaderId===null&&!a.targetResourceId&&['idle','wander','trot'].includes(a.currentBehavior)&&healthy(a);
function trail(s:RuntimeState,a:ZebraAnimal,leader:ZebraAnimal,slot:number,herd:ZebraAnimal[]){const h=home(s,a);if(!h)return null;const heading=leader.motion.heading,side=slot%2?H.side:-H.side,target={x:leader.position.x-Math.sin(heading)*H.gap+Math.cos(heading)*side,z:leader.position.z-Math.cos(heading)*H.gap-Math.sin(heading)*side},others=herd.filter(b=>b!==a),obstacles=others.flatMap(b=>b.targetResourceId&&b.target&&distance(a.position,b.target)>=G.separation?[b.position,b.target]:[b.position]);if(!zebraPointAllowed(s.world,h,target,obstacles))return null;const route=zebraGroundRoute(s.world,h,a.position,target,obstacles);return route?{target,route}:null;}
/** Select optional episodes before the sole movement pass. Never move twice/tick. */
export function prepareZebraHerd(s:RuntimeState){const herd=zebras(s.animals);for(const a of herd)if(a.currentBehavior==='follow-herd'){const leader=herd.find(b=>b.id===a.motion.herdLeaderId);if(!leader||leader.habitatId!==a.habitatId||!leaderAllowed(leader)||!healthy(a)||distance(a.position,leader.position)>H.maxGap)zebraIdle(a,4);}
 if(!herd.length||s.tick%H.checkEvery!==0||herd.some(a=>a.currentBehavior==='follow-herd'||a.currentBehavior==='trot'))return;
 const offset=Math.floor(s.tick/H.checkEvery)%herd.length,ordered=Array.from({length:herd.length},(_,i)=>herd[(i+offset)%herd.length]!);
 for(const leader of ordered){if(leader.currentBehavior!=='wander'||!leader.target||!leader.motion.waypoints.length||!leaderAllowed(leader)||distance(leader.position,leader.target)<.8)continue;let followers=0;
  for(const a of ordered){if(a===leader||a.habitatId!==leader.habitatId||!['idle','wander'].includes(a.currentBehavior)||!healthy(a)||a.targetResourceId||distance(a.position,leader.position)>H.maxGap)continue;const plan=trail(s,a,leader,followers,herd);if(!plan||distance(a.position,plan.target)<.4)continue;a.target={...plan.target};a.targetResourceId=null;a.currentBehavior='follow-herd';a.motion={...a.motion,phase:'follow-herd',ticksLeft:H.followTicks,sequence:a.motion.sequence+1,waypoints:plan.route,waypointIndex:0,partnerId:null,herdLeaderId:leader.id,blockedTicks:0};followers++;if(followers===H.followers)break;
  }
  if(!followers)continue;
  if(leader.energy>=H.trotEnergy&&leader.trotCooldownTicks===0){leader.currentBehavior=leader.motion.phase='trot';leader.motion.ticksLeft=H.trotTicks;leader.motion.sequence++;leader.motion.trotDistance=0;leader.trotCooldownTicks=H.trotCooldown;}
  return;
 }
}
function recordTrotStep(a:ZebraAnimal){const step=Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z);if(a.motion.lastStep.x*Math.sin(a.motion.heading)+a.motion.lastStep.z*Math.cos(a.motion.heading)<=1e-8)return;a.motion.trotDistance=(a.motion.trotDistance??0)+step;a.energy=Math.max(0,a.energy-H.trotEnergyPerMovingTick*step/G.trotSpeed);}
function finishTrot(a:ZebraAnimal,events:ZebraTrotEvent[]){const traveled=a.motion.trotDistance??0;if(traveled+1e-8>=H.minTrotTravel){a.trots++;events.push({type:'zebra-trotted',animalId:a.id,eventId:a.id+':trot:'+a.trots,distance:traveled});}delete a.motion.trotDistance;}
/** Real bounded ground steps after original idle/wander movement. No cosmetic credit. */
export function stepZebraHerd(s:RuntimeState){const herd=zebras(s.animals),events:ZebraTrotEvent[]=[],offset=herd.length?s.tick%herd.length:0,ordered=Array.from({length:herd.length},(_,i)=>herd[(i+offset)%herd.length]!);
 for(const a of ordered){if(a.currentBehavior!=='trot')continue;const h=home(s,a);if(!h||!healthy(a)||a.motion.herdLeaderId!==null){zebraIdle(a,4);continue;}a.motion.trotDistance??=0;const moving=walkZebraGround(s,a,h,herd.filter(b=>b!==a),G.trotSpeed);recordTrotStep(a);if(moving)continue;finishTrot(a,events);zebraIdle(a,8);}
 for(const a of ordered){if(a.currentBehavior!=='follow-herd')continue;const leader=herd.find(b=>b.id===a.motion.herdLeaderId),h=home(s,a);if(!leader||!h||!leaderAllowed(leader)||!healthy(a)||distance(a.position,leader.position)>H.maxGap){zebraIdle(a,4);continue;}const fast=leader.currentBehavior==='trot'&&(a.motion.trotDistance!==undefined||a.trotCooldownTicks===0);if(fast&&a.motion.trotDistance===undefined){a.motion.trotDistance=0;a.trotCooldownTicks=H.trotCooldown;}else if(!fast)finishTrot(a,events);if(a.motion.ticksLeft<=1){finishTrot(a,events);zebraIdle(a,8);continue;}
  const followers=herd.filter(b=>b.motion.herdLeaderId===leader.id),slot=followers.indexOf(a);if(!a.motion.waypoints.length||s.tick%H.repathEvery===slot%H.repathEvery){const plan=trail(s,a,leader,slot,herd);if(plan){a.target={...plan.target};a.motion.waypoints=plan.route;a.motion.waypointIndex=0;}}
  if(distance(a.position,leader.position)<H.gap-.15||!a.motion.waypoints.length){a.motion.ticksLeft--;continue;}
  const moving=walkZebraGround(s,a,h,herd.filter(b=>b!==a),fast?G.trotSpeed:G.speed);if(fast)recordTrotStep(a);if(moving)continue;if(a.target&&distance(a.position,a.target)<.001){a.motion.waypoints=[];a.motion.waypointIndex=0;}else{finishTrot(a,events);zebraIdle(a,6);}
 }
 return events;
}
