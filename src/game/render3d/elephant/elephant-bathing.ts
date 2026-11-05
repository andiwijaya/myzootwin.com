import type {ElephantAnimal,ElephantResource} from '../../core/species.ts';
import {ELEPHANT_BATH} from '../../animals/elephants/care-rules.ts';
import {ELEPHANT_POND_VISUAL as POND} from './elephant-pond-geometry.ts';
import {solveElephantTrunk} from './elephant-consumption.ts';
import type {ElephantPose} from './elephant-rig.ts';
const clamp=(v:number)=>Math.max(0,Math.min(1,v)),mix=(a:number,b:number,t:number)=>t<=0?a:t>=1?b:a+(b-a)*t,smooth=(v:number)=>v*v*(3-2*v);
/** Wet saved source + physical contact + actual bath phase. No visual can begin or complete a bath. */
export function elephantBathFrame(previous:ElephantAnimal,current:ElephantAnimal,resources:readonly ElephantResource[],alpha:number,base:ElephantPose={},solve:(p:{y:number;z:number})=>readonly number[]=solveElephantTrunk):{pose:ElephantPose;sprayProgress:number|null}|null{
 const t=Number.isFinite(alpha)?clamp(alpha):0,active=current.currentBehavior==='bathe'||current.currentBehavior==='spray',completed=!active&&previous.currentBehavior==='spray'&&current.baths===previous.baths+1,a=active?current:completed?previous:null;
 if(!a||!a.target||!a.targetResourceId)return null;
 const r=resources.find(r=>r.kind==='elephant-pond'&&r.id===a.targetResourceId&&r.habitatId===a.habitatId);if(!r||(!completed&&r.stock<=0)||!r.approaches.some(p=>Math.hypot(p.x-a.position.x,p.z-a.position.z)<.06))return null;
 const dx=r.cell.x+.5-a.position.x,dz=r.cell.z+.5-a.position.z,distance=Math.hypot(dx,dz),error=Math.atan2(Math.sin(Math.atan2(dx,dz)-a.motion.heading),Math.cos(Math.atan2(dx,dz)-a.motion.heading));if(distance>1.6||distance<.25||Math.abs(error)>.201)return null;
 const scale=a.name==='Nara'?.94:1,drop=base.bodyDrop??0,d=(distance-.22)/scale,x=Math.sin(error)*d,z=Math.cos(error)*d,yaw=Math.atan2(x,z-.96),contact=solve({y:(POND.waterBase+POND.waterRise*r.stock/r.capacity)/scale-drop,z:.96+Math.hypot(x,z-.96)}),raised=solve({y:1.95-drop,z:1.15});
 const spray=a.currentBehavior==='spray',duration=spray?ELEPHANT_BATH.sprayTicks:ELEPHANT_BATH.batheTicks,left=active&&previous.currentBehavior===current.currentBehavior?mix(previous.motion.ticksLeft,current.motion.ticksLeft,t):a.motion.ticksLeft,progress=completed?1:clamp((duration-left)/duration),reach=spray?1:smooth(clamp(progress/.3)),lift=spray?smooth(clamp(progress/.25)):0;
 const trunk=contact.map((v,i)=>mix(base.trunk?.[i]??0,mix(v,raised[i]!,lift),reach));if(completed)for(let i=0;i<8;i++)trunk[i]=mix(trunk[i]!,base.trunk?.[i]??0,t);
 return {pose:{trunk,trunkYaw:yaw*(1-lift)*(completed?1-t:1),headYaw:0,headPitch:0,breath:0},sprayProgress:active&&spray&&progress>.25?(progress-.25)/.75:null};
}
