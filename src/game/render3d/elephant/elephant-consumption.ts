import type {ElephantAnimal,ElephantResource} from '../../core/species.ts';
import {ELEPHANT_NEEDS} from '../../animals/elephants/care-rules.ts';
import {ELEPHANT_TRUNK} from './elephant-geometry.ts';
import type {ElephantPose} from './elephant-rig.ts';

type YZ={y:number;z:number};
type ConsumptionActor=Pick<ElephantAnimal,'name'|'currentBehavior'|'target'|'targetResourceId'|'habitatId'|'position'|'foodEaten'|'waterDrunk'>&{motion:Pick<ElephantAnimal['motion'],'ticksLeft'|'heading'>};
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a:number,b:number,t:number)=>t<=0?a:t>=1?b:a+(b-a)*t;
const finger={y:.195,z:1.310};
/** Forward kinematics matches the actual bone rest offsets and visible single-finger center. */
export function elephantTrunkPoints(angles:readonly number[]):YZ[]{
 const points:YZ[]=[{y:ELEPHANT_TRUNK[0]!.y,z:ELEPHANT_TRUNK[0]!.z}];let rotation=0;
 for(let i=0;i<8;i++){rotation+=angles[i]??0;const from=ELEPHANT_TRUNK[i]!,to=i===7?finger:ELEPHANT_TRUNK[i+1]!,y=to.y-from.y,z=to.z-from.z,p=points[i]!;points.push({y:p.y+y*Math.cos(rotation)-z*Math.sin(rotation),z:p.z+y*Math.sin(rotation)+z*Math.cos(rotation)});}
 return points;
}
/** Bounded eight-joint planar CCD. Rendering only; never moves the animal or consumes stock. */
export function solveElephantTrunk(target:YZ){
 let best:number[]=[],score=Infinity;const ceiling=Math.max(1.43,target.y+.02);
 for(const seed of [Array<number>(8).fill(0),[0,0,0,-.4,-.8,-1.3,-1.3,-1.3],Array<number>(8).fill(-.65)]){const angles=[...seed];
  for(let iteration=0;iteration<32;iteration++)for(let joint=7;joint>=0;joint--){const points=elephantTrunkPoints(angles),p=points[joint]!,tip=points[8]!,ay=tip.y-p.y,az=tip.z-p.z,by=target.y-p.y,bz=target.z-p.z,old=angles[joint]!;angles[joint]=clamp(old+Math.atan2(ay*bz-az*by,ay*by+az*bz),joint===0?-.65:-1.3,joint===0?.65:1.3);if(elephantTrunkPoints(angles).some(p=>p.z<.95||p.y<.08||p.y>ceiling))angles[joint]=old;}
  const tip=elephantTrunkPoints(angles)[8]!,distance=Math.hypot(tip.y-target.y,tip.z-target.z),energy=angles.reduce((v,a,i)=>v+a*a+(i?(a-angles[i-1]!)**2:0),0),value=distance>.025?1000+distance:energy;
  if(value<score){score=value;best=angles;}
 }
 return best;
}
function action(a:ConsumptionActor){return a.currentBehavior==='eat'?'elephant-browse':a.currentBehavior==='drink'?'elephant-water':null;}
/** A real saved action reaches the real stocked fixture, lifts, then retracts on actual completion. */
export function elephantConsumptionPose(previous:ConsumptionActor,current:ConsumptionActor,resources:readonly ElephantResource[],alpha:number,base:ElephantPose={},_reducedMotion=false,solve:(target:YZ)=>readonly number[]=solveElephantTrunk):ElephantPose|null{
 const t=Number.isFinite(alpha)?clamp(alpha):0,kind=action(current),oldKind=action(previous),completed=!kind&&oldKind&&(oldKind==='elephant-browse'?current.foodEaten===previous.foodEaten+1:current.waterDrunk===previous.waterDrunk+1),actor=kind?current:completed?previous:null,required=kind??(completed?oldKind:null);
 if(!actor||!required||!actor.target||!actor.targetResourceId)return null;
 const r=resources.find(r=>r.id===actor.targetResourceId&&r.kind===required&&r.habitatId===actor.habitatId);
 if(!r||(!completed&&r.stock<=0)||!r.approaches.some(p=>Math.hypot(p.x-actor.position.x,p.z-actor.position.z)<.06))return null;
 const dx=r.cell.x+.5-actor.position.x,dz=r.cell.z+.5-actor.position.z,distance=Math.hypot(dx,dz),error=Math.atan2(Math.sin(Math.atan2(dx,dz)-actor.motion.heading),Math.cos(Math.atan2(dx,dz)-actor.motion.heading));
 if(distance>1.6||distance<.25||Math.abs(error)>.201)return null;
 const scale=actor.name==='Nara'?.94:1,drop=base.bodyDrop??0,level=required==='elephant-browse'?.54:.15+.12*r.stock/r.capacity+.013;
 // Separate near-rim contacts for the two trough approaches, rather than intersecting tips at its center.
 const reachDistance=(distance-.22)/scale,contactX=Math.sin(error)*reachDistance,contactZ=Math.cos(error)*reachDistance,root=ELEPHANT_TRUNK[0]!,yaw=Math.atan2(contactX,contactZ-root.z);
 const contact={y:level/scale-drop,z:root.z+Math.hypot(contactX,contactZ-root.z)},mouth={y:1.10-drop,z:1.00};
 const left=kind&&oldKind===kind?mix(previous.motion.ticksLeft,current.motion.ticksLeft,t):actor.motion.ticksLeft,progress=completed?1:clamp((ELEPHANT_NEEDS.actionTicks-left)/ELEPHANT_NEEDS.actionTicks),visualProgress=progress,reach=clamp(visualProgress/.30),lift=clamp((visualProgress-.45)/.35),smooth=(x:number)=>x*x*(3-2*x),contactAngles=solve(contact),mouthAngles=solve(mouth);
 const trunk=contactAngles.map((v,i)=>mix(base.trunk?.[i]??0,mix(v,mouthAngles[i]!,smooth(lift)),smooth(reach)));
 if(completed)for(let i=0;i<8;i++)trunk[i]=mix(trunk[i]!,base.trunk?.[i]??0,t);
 return {trunk,trunkYaw:yaw*(1-smooth(lift))*(completed?1-t:1),headYaw:0,headPitch:0,breath:0};
}


/** Scene-owned bounded memoization; repeated frames do not re-solve unchanged care targets. */
export function createElephantConsumptionAnimator(){
 const cache=new Map<string,readonly number[]>();let disposed=false;
 const solve=(target:YZ)=>{if(disposed)return Object.freeze(Array<number>(8).fill(0));const key=target.y.toFixed(5)+','+target.z.toFixed(5),found=cache.get(key);if(found)return found;const angles=Object.freeze(solveElephantTrunk({y:Number(target.y.toFixed(5)),z:Number(target.z.toFixed(5))}));if(cache.size>=24)cache.delete(cache.keys().next().value!);cache.set(key,angles);return angles;};
 return {target:solve,pose:(p:ConsumptionActor,a:ConsumptionActor,r:readonly ElephantResource[],t:number,base:ElephantPose,reducedMotion=false)=>disposed?null:elephantConsumptionPose(p,a,r,t,base,reducedMotion,solve),inspect:()=>({cachedTrunkTargets:cache.size,consumptionAnimatorDisposed:disposed}),dispose(){disposed=true;cache.clear();}};
}
