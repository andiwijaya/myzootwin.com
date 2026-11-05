import type {ElephantAnimal} from '../../core/species.ts';
import type {ElephantPose} from './elephant-rig.ts';
import {ELEPHANT_GROUND} from '../../animals/elephants/ground.ts';

const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Planar two-link IK keeps the broad foot level while the knee bends independently. */
export function elephantLegPose(step:number,lift:number,drop:number){
 const upper=.45,lower=Math.hypot(.36,.025),rest=Math.atan2(.025,.36),z=.025+step,down=.81+drop-lift,d=Math.hypot(z,down);
 const knee=Math.acos(clamp((d*d-upper*upper-lower*lower)/(2*upper*lower),-1,1));
 const hip=Math.atan2(z,down)-Math.acos(clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1));
 return {upper:-hip,lower:rest-knee,foot:hip+knee-rest};
}
/** A four-beat stylized walk: three quarters stance, one quarter swinging forward. */
export function elephantFootStep(phase:number,strength:number){
 const p=((phase%1)+1)%1;
 return p<.75?{step:(.08-.16*p/.75)*strength,lift:0}:{step:(-.08+.16*(p-.75)/.25)*strength,lift:Math.sin(Math.PI*(p-.75)/.25)*.065*strength};
}
/** Read actual saved tick displacement. No animation clock, RNG, simulation writes or invented walking. */
export function elephantLocomotionPose(previous:ElephantAnimal,current:ElephantAnimal,alpha:number,companionDistance=Infinity,reducedMotion=false):ElephantPose{
 const t=Number.isFinite(alpha)?clamp(alpha):0,delta={x:current.position.x-previous.position.x,z:current.position.z-previous.position.z,heading:angle(previous.motion.heading,current.motion.heading)};
 const now=current.motion.lastStep??delta,before=previous.motion.lastStep??delta;
 const speed=Math.hypot(now.x,now.z),priorSpeed=Math.hypot(before.x,before.z),walk=clamp(mix(priorSpeed,speed,t)/ELEPHANT_GROUND.speed),pivot=clamp(Math.abs(mix(before.heading,now.heading,t))/ELEPHANT_GROUND.turn)*.25;
 const strength=reducedMotion?0:Math.max(walk,pivot),x=mix(previous.position.x,current.position.x,t),z=mix(previous.position.z,current.position.z,t);
 const direction=speed>1e-8?now:before,length=Math.hypot(direction.x,direction.z);
 const phase=length>1e-8?(x*direction.x+z*direction.z)/length/(.16/.75):(previous.motion.heading+delta.heading*t)/.5;
 const drop=strength?-.014*strength:0,legs=[0,.5,.25,.75].map(offset=>{const step=elephantFootStep(phase+offset,strength);return elephantLegPose(step.step,step.lift,drop);});
 const tuck=Math.max(walk,clamp((3.3-companionDistance)/.5));
 return {bodyDrop:drop,upperLegs:legs.map(p=>p.upper),lowerLegs:legs.map(p=>p.lower),feet:legs.map(p=>p.foot),trunk:[.20,.10,.10,.20,.26,.28,.28,.20].map(v=>v*tuck),tailPitch:-.4*tuck};
}
