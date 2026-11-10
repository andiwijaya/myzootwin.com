import type{Point}from'../../core/state.ts';import type{ZebraAnimal}from'../../core/zebra-state.ts';
import{ZEBRA_SOCIAL as S}from'./rules.ts';
/** Conservative original rig XZ capsule: encloses muzzle, barrel, tail and walking
 * hooves. This is an additional movement guard; historical V5's1.3 root minimum
 * remains readable. No renderer dependency enters canonical simulation. */
export const ZEBRA_BODY=Object.freeze({front:.55,rear:.35,radius:.27});
const cross=(a:Point,b:Point)=>a.x*b.z-a.z*b.x,sub=(a:Point,b:Point)=>({x:a.x-b.x,z:a.z-b.z});
const pointSegment=(p:Point,a:Point,b:Point)=>{const d=sub(b,a),v=sub(p,a),t=Math.max(0,Math.min(1,(v.x*d.x+v.z*d.z)/(d.x*d.x+d.z*d.z)));return Math.hypot(p.x-a.x-d.x*t,p.z-a.z-d.z*t);};
export function zebraCapsule(position:Point,heading:number){const dx=Math.sin(heading),dz=Math.cos(heading);return{a:{x:position.x-dx*ZEBRA_BODY.rear,z:position.z-dz*ZEBRA_BODY.rear},b:{x:position.x+dx*ZEBRA_BODY.front,z:position.z+dz*ZEBRA_BODY.front}};}
function capsuleDistance(x:{a:Point;b:Point},y:{a:Point;b:Point}){const u=sub(x.b,x.a),v=sub(y.b,y.a),w=sub(y.a,x.a),den=cross(u,v);if(Math.abs(den)>1e-10){const t=cross(w,v)/den,q=cross(w,u)/den;if(t>=0&&t<=1&&q>=0&&q<=1)return 0;}return Math.min(pointSegment(x.a,y.a,y.b),pointSegment(x.b,y.a,y.b),pointSegment(y.a,x.a,x.b),pointSegment(y.b,x.a,x.b));}
export const zebraBodyDistance=(a:Point,ah:number,b:Point,bh:number)=>capsuleDistance(zebraCapsule(a,ah),zebraCapsule(b,bh));
type BodyPose={position:Point;heading:number};
// Runtime-only tick origins: the renderer interpolates both adults from these
// poses together, even though canonical movement is resolved in rotating order.
// Never attach this transient collision context to an animal or serialized save.
const frameOrigins=new WeakMap<ZebraAnimal,BodyPose>();
export function beginZebraBodyFrame(herd:readonly ZebraAnimal[]){for(const a of herd)frameOrigins.set(a,{position:{...a.position},heading:a.motion.heading});return()=>{for(const a of herd)frameOrigins.delete(a);};}
function framePairAllowed(a:ZebraAnimal,to:Point,heading:number,b:ZebraAnimal){
 const x=frameOrigins.get(a),y=frameOrigins.get(b);if(!x||!y)return true;
 // A rotation cannot extend either capsule beyond its farthest axial endpoint.
 // Skip sampling only when the triangle bound proves the entire pair stays apart.
 const travelA=Math.hypot(to.x-x.position.x,to.z-x.position.z),travelB=Math.hypot(b.position.x-y.position.x,b.position.z-y.position.z);
 if(Math.hypot(x.position.x-y.position.x,x.position.z-y.position.z)-travelA-travelB>=2*(Math.max(ZEBRA_BODY.front,ZEBRA_BODY.rear)+ZEBRA_BODY.radius))return true;
 const angle=(from:number,to:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from)),dx=angle(x.heading,heading),dy=angle(y.heading,b.motion.heading);
 const extent=Math.max(travelA,travelB),turn=Math.max(Math.abs(dx),Math.abs(dy));
 // Include quarter-frame poses as well as finer bounded translation/turn samples.
 const steps=Math.ceil(Math.max(4,extent/.015,turn/.02)/4)*4;
 for(let i=0;i<=steps;i++){const t=i/steps,p={x:x.position.x+(to.x-x.position.x)*t,z:x.position.z+(to.z-x.position.z)*t},q={x:y.position.x+(b.position.x-y.position.x)*t,z:y.position.z+(b.position.z-y.position.z)*t};if(zebraBodyDistance(p,x.heading+dx*t,q,y.heading+dy*t)<ZEBRA_BODY.radius*2-1e-8)return false;}
 return true;
}
/** Extra head sweep while mutually grooming. Only the reciprocal partner may
 * enter this contact envelope; third actors and tall shade posts remain clear.
 * Keep one transition tick reserved as the render pose returns to neutral. */
export function zebraGroomHead(a:ZebraAnimal,p=a.position,heading=a.motion.heading){if(a.currentBehavior!=='groom'&&!(a.groomings>0&&a.groomCooldownTicks>=S.cooldown-1))return null;const sin=Math.sin(heading),cos=Math.cos(heading);return{a:{x:p.x+sin*.15,z:p.z+cos*.15},b:{x:p.x+cos*S.mouthX+sin*S.mouthZ,z:p.z-sin*S.mouthX+cos*S.mouthZ},c:{x:p.x+sin*S.neutralHeadZ,z:p.z+cos*S.neutralHeadZ}};}
// Reserve the contact reach and the neutral-to-contact sweep. A final-pose ray
// alone leaves the intermediate sideways muzzle outside the collision guard.
const headSegments=(h:NonNullable<ReturnType<typeof zebraGroomHead>>)=>[{a:h.a,b:h.b},{a:h.c,b:h.b}];
export function zebraGroomHeadInside(a:ZebraAnimal,bounds:Point){const head=zebraGroomHead(a);return !head||[head.a,head.b,head.c].every(p=>p.x-S.headRadius>=bounds.x+.05&&p.x+S.headRadius<=bounds.x+7.95&&p.z-S.headRadius>=bounds.z+.05&&p.z+S.headRadius<=bounds.z+7.95);}
/** Sample every small canonical translation/turn so a clear endpoint cannot hide
 * a nose sweeping through a companion between two100ms states. */
export function zebraBodySweepAllowed(a:ZebraAnimal,to:Point,heading:number,others:readonly ZebraAnimal[],posts:readonly Point[]=[]){if(others.some(b=>!framePairAllowed(a,to,heading,b)))return false;const delta=Math.atan2(Math.sin(heading-a.motion.heading),Math.cos(heading-a.motion.heading)),steps=Math.max(1,Math.ceil(Math.hypot(to.x-a.position.x,to.z-a.position.z)/.03),Math.ceil(Math.abs(delta)/.04));for(let i=0;i<=steps;i++){const t=i/steps,p={x:a.position.x+(to.x-a.position.x)*t,z:a.position.z+(to.z-a.position.z)*t},angle=a.motion.heading+delta*t,capsule=zebraCapsule(p,angle),head=zebraGroomHead(a,p,angle);for(const post of posts)if(pointSegment(post,capsule.a,capsule.b)<ZEBRA_BODY.radius+.10-1e-8||head&&headSegments(head).some(edge=>pointSegment(post,edge.a,edge.b)<S.headRadius+.10-1e-8))return false;for(const b of others){const other=zebraCapsule(b.position,b.motion.heading);if(capsuleDistance(capsule,other)<ZEBRA_BODY.radius*2-1e-8)return false;if(a.motion.partnerId===b.id&&b.motion.partnerId===a.id)continue;const otherHead=zebraGroomHead(b);if(head&&headSegments(head).some(edge=>capsuleDistance(edge,other)<S.headRadius+ZEBRA_BODY.radius-1e-8)||otherHead&&headSegments(otherHead).some(edge=>capsuleDistance(capsule,edge)<S.headRadius+ZEBRA_BODY.radius-1e-8)||head&&otherHead&&headSegments(head).some(edge=>headSegments(otherHead).some(otherEdge=>capsuleDistance(edge,otherEdge)<S.headRadius*2-1e-8)))return false;}}return true;}
