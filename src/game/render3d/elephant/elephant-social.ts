import type {ElephantAnimal} from '../../core/species.ts';
import {ELEPHANT_SOCIAL as S} from '../../animals/elephants/care-rules.ts';
import {ELEPHANT_ART,ELEPHANT_TRUNK} from './elephant-geometry.ts';
import type {ElephantPose} from './elephant-rig.ts';
import type {createElephantConsumptionAnimator} from './elephant-consumption.ts';
const mix=(a:number,b:number,t:number)=>a+(b-a)*t,smooth=(x:number)=>x*x*(3-2*x),clamp=(v:number)=>Math.max(0,Math.min(1,v));
/** A reciprocal saved, physically arrived greeting; shared midpoint is visible contact, never a reward trigger. */
export function elephantSocialPose(p:ElephantAnimal,a:ElephantAnimal,pp:ElephantAnimal|undefined,b:ElephantAnimal|undefined,alpha:number,base:ElephantPose,solve:ReturnType<typeof createElephantConsumptionAnimator>['target']):ElephantPose|null{
 if(a.motion.phase!=='trunk-touch'||!b||b.motion.phase!=='trunk-touch'||a.motion.partnerId!==b.id||b.motion.partnerId!==a.id||!a.target||!b.target||a.habitatId!==b.habitatId||Math.hypot(a.position.x-a.target.x,a.position.z-a.target.z)>.06||Math.hypot(b.position.x-b.target.x,b.position.z-b.target.z)>.06)return null;
 const facing=(a:ElephantAnimal,b:ElephantAnimal)=>Math.abs(Math.atan2(Math.sin(Math.atan2(b.position.x-a.position.x,b.position.z-a.position.z)-a.motion.heading),Math.cos(Math.atan2(b.position.x-a.position.x,b.position.z-a.position.z)-a.motion.heading)))<.201;if(!facing(a,b)||!facing(b,a))return null;
 const t=clamp(Number.isFinite(alpha)?alpha:0),previous=pp??b,ax=mix(p.position.x,a.position.x,t),az=mix(p.position.z,a.position.z,t),bx=mix(previous.position.x,b.position.x,t),bz=mix(previous.position.z,b.position.z,t),distance=Math.hypot(bx-ax,bz-az);if(distance<S.minDistance||distance>S.maxDistance)return null;
 const heading=p.motion.heading+Math.atan2(Math.sin(a.motion.heading-p.motion.heading),Math.cos(a.motion.heading-p.motion.heading))*t,dx=(bx-ax)/2,dz=(bz-az)/2,scale=a.name==='Nara'?ELEPHANT_ART.scaleNara:ELEPHANT_ART.scaleAyu,x=(dx*Math.cos(heading)-dz*Math.sin(heading))/scale,z=(dx*Math.sin(heading)+dz*Math.cos(heading))/scale,root=ELEPHANT_TRUNK[0]!.z;if(z<root)return null;
 const target=solve({y:1.10/scale,z:root+Math.hypot(x,z-root)}),left=p.motion.phase==='trunk-touch'?mix(p.motion.ticksLeft,a.motion.ticksLeft,t):a.motion.ticksLeft,progress=clamp(1-left/S.touchTicks),amount=smooth(Math.min(clamp(progress/.25),clamp((1-progress)/.25)));
 return {trunk:target.map((v,i)=>mix(base.trunk?.[i]??0,v,amount)),trunkYaw:Math.atan2(x,z-root)*amount,headPitch:0,headYaw:0,breath:0};
}
