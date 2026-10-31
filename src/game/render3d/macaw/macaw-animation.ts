export const MACAW_CLIPS=['perch','walk','hop','fly','eat','drink','rest'] as const;
export type MacawClip=typeof MACAW_CLIPS[number];
export interface MacawPose {bodyPitch:number;bob:number;headPitch:number;headYaw:number;jaw:number;tailPitch:number;wingLeft:number;wingRight:number;elbowLeft:number;elbowRight:number;leftStep:number;rightStep:number;leftLift:number;rightLift:number;footPitch:number;grip:number;lift:number;eyesClosed:number;}
export const isMacawClip=(value:unknown):value is MacawClip=>MACAW_CLIPS.includes(value as MacawClip);
/** Deterministic articulation only. No needs, resource consumption, RNG or world XZ position. */
export function sampleMacawPose(clip:MacawClip,timeMs:number):MacawPose{
 if(!isMacawClip(clip)||!Number.isFinite(timeMs)||timeMs<0)throw new RangeError('Invalid macaw animation sample');
 const t=timeMs/1000,p:MacawPose={bodyPitch:0,bob:0,headPitch:0,headYaw:.12*Math.sin(t*1.3),jaw:0,tailPitch:0,wingLeft:1.4,wingRight:-1.4,elbowLeft:-.35,elbowRight:.35,leftStep:0,rightStep:0,leftLift:0,rightLift:0,footPitch:0,grip:1,lift:0,eyesClosed:t%5>4.83?1:0};
 if(clip==='perch'){p.headPitch=.025*Math.sin(t*1.8);p.bob=.002*Math.sin(t*2);}
 if(clip==='walk'){const phase=t*Math.PI*2/0.8;p.grip=0;p.bodyPitch=.10;p.tailPitch=1.15;p.headPitch=-.1;p.headYaw=.025*Math.sin(phase);p.bob=.012*(1-Math.cos(phase*2));p.leftStep=.052*Math.cos(phase);p.rightStep=-p.leftStep;p.leftLift=.06*Math.max(0,Math.sin(phase));p.rightLift=.06*Math.max(0,-Math.sin(phase));}
 if(clip==='hop'){const air=Math.max(0,Math.sin(t*Math.PI*2/1.4));p.grip=0;p.bodyPitch=.13;p.tailPitch=1.15;p.lift=.15*air;p.footPitch=.22*air;p.headPitch=-.08;}
 if(clip==='fly'){const flap=Math.sin(t*Math.PI*2*2.8);p.grip=0;p.bodyPitch=.75;p.headPitch=-.5;p.headYaw=0;p.tailPitch=1.15;p.lift=.54+.028*Math.sin(t*4);p.wingLeft=-.57*flap;p.wingRight=.57*flap;p.elbowLeft=-.10-.08*Math.sin(t*Math.PI*2*2.8+.5);p.elbowRight=-p.elbowLeft;p.leftLift=p.rightLift=.15;p.footPitch=.9;}
 if(clip==='eat'||clip==='drink'){const dip=Math.sin(t*Math.PI*2/(clip==='eat'?1.1:1.8));p.grip=0;p.bodyPitch=(clip==='eat'?.76:.86)+.035*dip;p.headPitch=.12+.06*dip;p.headYaw=.025*Math.sin(t*2);p.tailPitch=1.15;p.jaw=clip==='eat'?.19*Math.max(0,Math.sin(t*13)):.025;}
 if(clip==='rest'){p.headPitch=.25;p.headYaw=-.52;p.eyesClosed=1;}
 return p;
}
export function blendMacawPose(a:MacawPose,b:MacawPose,mix:number):MacawPose{if(!Number.isFinite(mix))throw new RangeError('Invalid pose blend');const t=Math.max(0,Math.min(1,mix));return Object.fromEntries(Object.keys(a).map(key=>[key,a[key as keyof MacawPose]+(b[key as keyof MacawPose]-a[key as keyof MacawPose])*t]))as unknown as MacawPose;}
/** Explicit clock caller; no timer/RAF. Captures current pose to prevent interrupted-transition snapping. */
export function createMacawAnimator(initial:MacawClip='perch'){
 let clip=initial,time=0,changed=0,from=sampleMacawPose(clip,0),disposed=false;
 const pose=()=>blendMacawPose(from,sampleMacawPose(clip,time-changed),Math.min(1,(time-changed)/280));
 return {setClip(value:MacawClip,snap=false){if(disposed||!isMacawClip(value)||value===clip)return;from=snap?sampleMacawPose(value,0):pose();changed=time;clip=value;},advance(delta:number){if(!Number.isFinite(delta)||delta<0)throw new RangeError('Invalid animation delta');if(!disposed)time+=Math.min(delta,250);},pose:()=>structuredClone(pose()),dispose(){disposed=true;},inspect:()=>({clip,timeMs:time,transitioning:time-changed<280,disposed})};
}
