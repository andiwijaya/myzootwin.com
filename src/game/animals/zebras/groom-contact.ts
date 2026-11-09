import type{Point}from'../../core/state.ts';
import type{ZebraAnimal}from'../../core/zebra-state.ts';
import{ZEBRA_SOCIAL as S,ZEBRA_NEEDS as N}from'./rules.ts';
const angle=(v:number)=>Math.atan2(Math.sin(v),Math.cos(v));
export function zebraGroomOffset(position:Point,heading:number){return{x:position.x+Math.cos(heading)*S.side+Math.sin(heading)*S.forward,z:position.z-Math.sin(heading)*S.side+Math.cos(heading)*S.forward};}
export function zebraGroomHeading(a:ZebraAnimal,b:ZebraAnimal){if(!a.target||!b.target)return null;return angle(Math.atan2(b.target.x-a.target.x,b.target.z-a.target.z)-Math.atan2(S.side,S.forward));}
/** Both adults stand antiparallel, each muzzle directed at the other's neck.
 * Positions and headings are canonical; a cosmetic animation cannot supply them. */
export function zebraGroomContact(a:ZebraAnimal,b:ZebraAnimal){if(a.habitatId!==b.habitatId||!a.target||!b.target)return false;for(const[who,other]of[[a,b],[b,a]]){const p=zebraGroomOffset(who!.position,who!.motion.heading);if(Math.hypot(p.x-other!.position.x,p.z-other!.position.z)>.002||Math.hypot(who!.position.x-who!.target!.x,who!.position.z-who!.target!.z)>.001)return false;}return true;}

/** Two reciprocal bouts separated by a neutral pause: heads never cross. */
export function zebraGroomAmount(a:ZebraAnimal,alpha=0){if(a.currentBehavior!=='groom'||!a.motion.partnerId)return 0;const first=a.id<a.motion.partnerId,time=S.ticks-a.motion.ticksLeft+Math.max(0,Math.min(1,alpha)),start=first?0:S.secondStart,end=first?S.firstEnd:S.ticks;return Math.max(0,Math.min(1,(time-start)/N.headLowerTicks,(end-time)/N.headLowerTicks));}
