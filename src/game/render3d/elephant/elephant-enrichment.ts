import type {ElephantAnimal,ElephantResource} from '../../core/species.ts';
import type {ElephantPose} from './elephant-rig.ts';
import type {createElephantConsumptionAnimator} from './elephant-consumption.ts';
import {ELEPHANT_ENRICHMENT as E} from '../../animals/elephants/care-rules.ts';
import {ELEPHANT_ART,ELEPHANT_TRUNK} from './elephant-geometry.ts';
/** Saved physical action only. No prop = no fake rub/rest; rendering never grants comfort. */
export function elephantEnrichmentPose(previous:ElephantAnimal,a:ElephantAnimal,resources:readonly ElephantResource[],alpha:number,target:ReturnType<typeof createElephantConsumptionAnimator>['target']):ElephantPose|null{
 if(a.motion.phase!=='rest'&&a.motion.phase!=='enrich')return null;const rest=a.motion.phase==='rest',r=resources.find(r=>r.id===a.targetResourceId&&r.kind===(rest?'elephant-shade':'elephant-log')&&r.habitatId===a.habitatId&&r.stock>0);
 if(!r||!a.target||Math.hypot(a.position.x-a.target.x,a.position.z-a.target.z)>.06||!r.approaches.some(p=>Math.hypot(p.x-a.target!.x,p.z-a.target!.z)<1e-6))return null;
 const duration=rest?E.restTicks:E.logTicks,t=Math.max(0,Math.min(1,alpha)),left=previous.motion.phase===a.motion.phase?previous.motion.ticksLeft+(a.motion.ticksLeft-previous.motion.ticksLeft)*t:a.motion.ticksLeft,progress=Math.max(0,Math.min(1,1-left/duration)),ease=Math.sin(Math.PI*progress),pose:ElephantPose={headPitch:.045*ease,earLeft:.035*ease,earRight:-.035*ease};
 if(rest)return {...pose,trunk:[.14,.09,.10,.14,.18,.18,.15,.10]};
 const scale=a.name==='Nara'?ELEPHANT_ART.scaleNara:ELEPHANT_ART.scaleAyu,dx=r.cell.x+.5-a.position.x,dz=r.cell.z+.5-a.position.z,distance=Math.hypot(dx,dz),yaw=Math.atan2(Math.sin(Math.atan2(dx,dz)-a.motion.heading),Math.cos(Math.atan2(dx,dz)-a.motion.heading)),reach=(distance-.24)/scale;
 const x=Math.sin(yaw)*reach,z=Math.cos(yaw)*reach,rootZ=ELEPHANT_TRUNK[0]!.z,trunkYaw=Math.atan2(x,z-rootZ);const trunk=target({y:(.38+.015*Math.sin(progress*Math.PI*4))/scale,z:rootZ+Math.hypot(x,z-rootZ)});return {...pose,headPitch:0,headYaw:0,breath:0,trunk,trunkYaw};
}
