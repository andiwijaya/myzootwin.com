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
export function zebraBodySweepAllowed(a:ZebraAnimal,to:Point,heading:number,others:readonly ZebraAnimal[],posts:readonly Point[]=[]){const delta=Math.atan2(Math.sin(heading-a.motion.heading),Math.cos(heading-a.motion.heading)),steps=Math.max(1,Math.ceil(Math.hypot(to.x-a.position.x,to.z-a.position.z)/.03),Math.ceil(Math.abs(delta)/.04));for(let i=0;i<=steps;i++){const t=i/steps,p={x:a.position.x+(to.x-a.position.x)*t,z:a.position.z+(to.z-a.position.z)*t},angle=a.motion.heading+delta*t,capsule=zebraCapsule(p,angle),head=zebraGroomHead(a,p,angle);for(const post of posts)if(pointSegment(post,capsule.a,capsule.b)<ZEBRA_BODY.radius+.10-1e-8||head&&headSegments(head).some(edge=>pointSegment(post,edge.a,edge.b)<S.headRadius+.10-1e-8))return false;for(const b of others){const other=zebraCapsule(b.position,b.motion.heading);if(capsuleDistance(capsule,other)<ZEBRA_BODY.radius*2-1e-8)return false;if(a.motion.partnerId===b.id&&b.motion.partnerId===a.id)continue;const otherHead=zebraGroomHead(b);if(head&&headSegments(head).some(edge=>capsuleDistance(edge,other)<S.headRadius+ZEBRA_BODY.radius-1e-8)||otherHead&&headSegments(otherHead).some(edge=>capsuleDistance(capsule,edge)<S.headRadius+ZEBRA_BODY.radius-1e-8)||head&&otherHead&&headSegments(head).some(edge=>headSegments(otherHead).some(otherEdge=>capsuleDistance(edge,otherEdge)<S.headRadius*2-1e-8)))return false;}}return true;}
