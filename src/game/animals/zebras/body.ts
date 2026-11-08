import type{Point}from'../../core/state.ts';import type{ZebraAnimal}from'../../core/zebra-state.ts';
/** Conservative original rig XZ capsule: encloses muzzle, barrel, tail and walking
 * hooves. This is an additional movement guard; historical V5's1.3 root minimum
 * remains readable. No renderer dependency enters canonical simulation. */
export const ZEBRA_BODY=Object.freeze({front:.55,rear:.35,radius:.27});
const cross=(a:Point,b:Point)=>a.x*b.z-a.z*b.x,sub=(a:Point,b:Point)=>({x:a.x-b.x,z:a.z-b.z});
const pointSegment=(p:Point,a:Point,b:Point)=>{const d=sub(b,a),v=sub(p,a),t=Math.max(0,Math.min(1,(v.x*d.x+v.z*d.z)/(d.x*d.x+d.z*d.z)));return Math.hypot(p.x-a.x-d.x*t,p.z-a.z-d.z*t);};
export function zebraCapsule(position:Point,heading:number){const dx=Math.sin(heading),dz=Math.cos(heading);return{a:{x:position.x-dx*ZEBRA_BODY.rear,z:position.z-dz*ZEBRA_BODY.rear},b:{x:position.x+dx*ZEBRA_BODY.front,z:position.z+dz*ZEBRA_BODY.front}};}
export function zebraBodyDistance(a:Point,ah:number,b:Point,bh:number){const x=zebraCapsule(a,ah),y=zebraCapsule(b,bh),u=sub(x.b,x.a),v=sub(y.b,y.a),w=sub(y.a,x.a),den=cross(u,v);if(Math.abs(den)>1e-10){const t=cross(w,v)/den,q=cross(w,u)/den;if(t>=0&&t<=1&&q>=0&&q<=1)return 0;}return Math.min(pointSegment(x.a,y.a,y.b),pointSegment(x.b,y.a,y.b),pointSegment(y.a,x.a,x.b),pointSegment(y.b,x.a,x.b));}
/** Sample every small canonical translation/turn so a clear endpoint cannot hide
 * a nose sweeping through a companion between two100ms states. */
export function zebraBodySweepAllowed(a:ZebraAnimal,to:Point,heading:number,others:readonly ZebraAnimal[]){const delta=Math.atan2(Math.sin(heading-a.motion.heading),Math.cos(heading-a.motion.heading)),steps=Math.max(1,Math.ceil(Math.hypot(to.x-a.position.x,to.z-a.position.z)/.03),Math.ceil(Math.abs(delta)/.04));for(let i=0;i<=steps;i++){const t=i/steps,p={x:a.position.x+(to.x-a.position.x)*t,z:a.position.z+(to.z-a.position.z)*t},angle=a.motion.heading+delta*t;for(const b of others)if(zebraBodyDistance(p,angle,b.position,b.motion.heading)<ZEBRA_BODY.radius*2-1e-8)return false;}return true;}
