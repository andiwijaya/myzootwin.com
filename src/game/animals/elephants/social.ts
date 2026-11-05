import type {ZooSaveV2} from '../../core/zoo-state.ts';
import {elephants,type ElephantAnimal} from '../../core/species.ts';
import {elephantBodyRoute,groundCenters,groundDistance} from './ground.ts';
import {elephantBodyClearance} from './body-clearance.ts';
import {ELEPHANT_NEEDS as N,ELEPHANT_SOCIAL as S} from './care-rules.ts';
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const social=(a:ElephantAnimal)=>a.motion.phase==='approach-companion'||a.motion.phase==='trunk-touch';
type Hooks={idle:(a:ElephantAnimal,ticks?:number)=>void;walk:(a:ElephantAnimal)=>boolean;turn:(a:ElephantAnimal,heading:number)=>boolean};
const facing=(a:ElephantAnimal,b:ElephantAnimal)=>Math.abs(angle(a.motion.heading,Math.atan2(b.position.x-a.position.x,b.position.z-a.position.z)))<.2;
function abort(pair:ElephantAnimal[],hooks:Hooks){for(const a of pair){hooks.idle(a,0);a.socialCooldownTicks=Math.max(a.socialCooldownTicks,S.retryTicks);}}
function prerequisites(s:ZooSaveV2,a:ElephantAnimal){
 if(a.foodEaten===0||a.waterDrunk===0||a.hunger>=N.seekAt||a.thirst>=N.seekAt||a.socialCooldownTicks>0)return false;
 // Prioritize an available first care experience before asking both residents to wait for a greeting.
 return !s.world.resources.some(r=>r.habitatId===a.habitatId&&r.stock>0&&(r.kind==='elephant-pond'&&a.baths===0||r.kind==='elephant-shade'&&a.restedTicks===0||r.kind==='elephant-log'&&a.enrichedTicks===0));
}
/** Deterministic, bounded meeting search. Each planned ground route avoids the real companion body. */
export function prepareElephantSocial(s:ZooSaveV2,hooks:Hooks){
 const herd=elephants(s.animals).sort((a,b)=>a.id.localeCompare(b.id));
 for(const a of herd.filter(social)){const b=herd.find(b=>b.id===a.motion.partnerId);if(!a.target||!b?.target||!b||b.motion.partnerId!==a.id||!social(b)||b.motion.phase!==a.motion.phase||b.habitatId!==a.habitatId||a.hunger>=N.criticalAt||a.thirst>=N.criticalAt||b.hunger>=N.criticalAt||b.thirst>=N.criticalAt)abort([a,...(b&&b.motion.partnerId===a.id?[b]:[])],hooks);}
 if(s.tick%S.attemptEveryTicks!==0||herd.length!==2||herd.some(a=>a.motion.phase!=='idle'||!prerequisites(s,a))||herd.every(a=>a.socialComfort>=S.seekBelow))return;
 const [a,b]=herd as [ElephantAnimal,ElephantAnimal],h=s.world.habitats.find(h=>h.id===a.habitatId&&h.id===b.habitatId&&h.kind==='elephant-grove');if(!h)return;
 const nodes=groundCenters(s.world,h),options=[];
 for(const p of nodes)for(const q of nodes){const d=groundDistance(p,q);if(d<S.minDistance||d>S.maxDistance)continue;const ha=Math.atan2(q.x-p.x,q.z-p.z),hb=Math.atan2(p.x-q.x,p.z-q.z);if(elephantBodyClearance({position:p,heading:ha},{position:q,heading:hb})<.05)continue;options.push({p,q,ha,hb,cost:groundDistance(a.position,p)+groundDistance(b.position,q)});}
 options.sort((x,y)=>x.cost-y.cost||x.p.z-y.p.z||x.p.x-y.p.x||x.q.z-y.q.z||x.q.x-y.q.x);
 for(const option of options){const ra=elephantBodyRoute(s.world,h,a.position,option.p,a.motion.heading,[{position:b.position,heading:b.motion.heading}],option.ha);if(!ra)continue;const rb=elephantBodyRoute(s.world,h,b.position,option.q,b.motion.heading,[{position:a.position,heading:a.motion.heading}],option.hb);if(!rb)continue;for(const [actor,partner,target,route]of [[a,b,option.p,ra],[b,a,option.q,rb]]as const){actor.currentBehavior='approach-companion';actor.target={...target};actor.targetResourceId=null;actor.motion={...actor.motion,partnerId:partner.id,phase:'approach-companion',ticksLeft:S.approachTicks,sequence:actor.motion.sequence+1,waypoints:route,waypointIndex:0};}return;}
}
/** Shared movement callbacks retain all existing body/prop/fence/frame checks. */
export function stepElephantSocial(s:ZooSaveV2,a:ElephantAnimal,hooks:Hooks){
 if(!social(a))return false;const b=elephants(s.animals).find(b=>b.id===a.motion.partnerId);if(!b||b.motion.partnerId!==a.id||!social(b)){abort([a],hooks);return true;}
 if(a.motion.phase==='approach-companion'){if(hooks.walk(a))hooks.turn(a,Math.atan2(b.target!.x-a.position.x,b.target!.z-a.position.z));return true;}
 if(!a.target||!b.target||groundDistance(a.position,a.target)>.06||groundDistance(b.position,b.target)>.06||!facing(a,b)||!facing(b,a)||groundDistance(a.position,b.position)<S.minDistance||groundDistance(a.position,b.position)>S.maxDistance){abort([a,b],hooks);return true;}
 a.motion.ticksLeft--;return true;
}
/** Pair transition/credit happens once, after both real actors have advanced this tick. */
export function finishElephantSocial(s:ZooSaveV2,hooks:Hooks){
 const herd=elephants(s.animals).sort((a,b)=>a.id.localeCompare(b.id)),events:{animalId:string;companionId:string;socialCount:number;eventId:string}[]=[];if(herd.length!==2)return events;const [a,b]=herd as [ElephantAnimal,ElephantAnimal];if(!social(a)||!social(b)||a.motion.partnerId!==b.id||b.motion.partnerId!==a.id||a.motion.phase!==b.motion.phase)return events;
 if(a.motion.phase==='approach-companion'){if(a.target&&b.target&&groundDistance(a.position,a.target)<.06&&groundDistance(b.position,b.target)<.06&&facing(a,b)&&facing(b,a)){for(const actor of herd){actor.currentBehavior='trunk-touch';actor.motion={...actor.motion,phase:'trunk-touch',ticksLeft:S.touchTicks,sequence:actor.motion.sequence+1,waypoints:[],waypointIndex:0};}}return events;}
 if(a.motion.ticksLeft>0||b.motion.ticksLeft>0)return events;
 for(const [actor,partner]of [[a,b],[b,a]]){actor.socialComfort=Math.min(100,actor.socialComfort+S.comfort);actor.socialInteractions++;actor.socialCooldownTicks=S.cooldownTicks;events.push({animalId:actor.id,companionId:partner.id,socialCount:actor.socialInteractions,eventId:`${actor.id}:social:${actor.socialInteractions}`});hooks.idle(actor);}
 return events;
}
