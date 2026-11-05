import type {Point} from '../../core/state.ts';
export interface GroundBody {position:Point;heading:number;}
/** Conservative torso/head capsule; narrow trunk/tail tuck visually near a companion. */
export const ELEPHANT_BODY=Object.freeze({radius:.70,rear:-.30,front:.43,turnSample:.025});
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
function pointSegment(p:Point,a:Point,b:Point){const x=b.x-a.x,z=b.z-a.z,l=x*x+z*z,t=l?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/l)):0;return distance(p,{x:a.x+x*t,z:a.z+z*t});}
function intersect(a:Point,b:Point,c:Point,d:Point){const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);if(abC*abD<0&&cdA*cdB<0)return true;return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))<1e-9;}
function segments(a:Point,b:Point,c:Point,d:Point){return intersect(a,b,c,d)?0:Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b));}
export function elephantBodySegment(position:Point,heading:number):[Point,Point]{const x=Math.sin(heading),z=Math.cos(heading);return [ELEPHANT_BODY.rear,ELEPHANT_BODY.front].map(v=>({x:position.x+x*v,z:position.z+z*v}))as[Point,Point];}
export function elephantBodyClearance(a:GroundBody,b:GroundBody){const [x,y]=elephantBodySegment(a.position,a.heading),[u,v]=elephantBodySegment(b.position,b.heading);return segments(x,y,u,v)-ELEPHANT_BODY.radius*2;}
export function elephantBodyPointAllowed(position:Point,heading:number,others:readonly GroundBody[]){return others.every(b=>elephantBodyClearance({position,heading},b)>=-1e-8);}
export function elephantBodyTurnAllowed(position:Point,from:number,to:number,others:readonly GroundBody[]){
 const delta=Math.atan2(Math.sin(to-from),Math.cos(to-from)),steps=Math.max(1,Math.ceil(Math.abs(delta)/ELEPHANT_BODY.turnSample));
 return others.every(b=>{const initial=elephantBodyClearance({position,heading:from},b);let previous=initial;for(let i=1;i<=steps;i++){const value=elephantBodyClearance({position,heading:from+delta*i/steps},b);if(value<Math.min(0,previous)-1e-8)return false;previous=value;}return true;});
}
function polygonDistance(a:Point,b:Point,p:Point[]){
 const area=Math.abs(p.reduce((n,q,i)=>n+q.x*p[(i+1)%p.length]!.z-q.z*p[(i+1)%p.length]!.x,0));
 const inside=(q:Point)=>{const signs=p.map((v,i)=>cross(v,p[(i+1)%p.length]!,q));return area>1e-8&&(signs.every(x=>x>=-1e-9)||signs.every(x=>x<=1e-9));};
 if(inside(a)||inside(b))return 0;return Math.min(...p.map((v,i)=>segments(a,b,v,p[(i+1)%p.length]!)));
}
/** Exact swept capsule for a straight translation; no sample-sized gap to tunnel through. */
export function elephantBodyMoveAllowed(from:Point,to:Point,heading:number,others:readonly GroundBody[]){
 const [a,b]=elephantBodySegment(from,heading),[c,d]=elephantBodySegment(to,heading);
 return others.every(other=>{const [u,v]=elephantBodySegment(other.position,other.heading),before=segments(a,b,u,v)-ELEPHANT_BODY.radius*2,after=segments(c,d,u,v)-ELEPHANT_BODY.radius*2,swept=polygonDistance(u,v,[a,b,d,c])-ELEPHANT_BODY.radius*2;return before<0?after>before+1e-9&&swept>=before-1e-8:swept>=-1e-8;});
}


/** Rendering interpolates both residents together; reserve that same continuous frame before committing. */
export function elephantBodyFrameAllowed(from:GroundBody,to:GroundBody,otherFrom:GroundBody,otherTo:GroundBody){
 const da=Math.atan2(Math.sin(to.heading-from.heading),Math.cos(to.heading-from.heading)),db=Math.atan2(Math.sin(otherTo.heading-otherFrom.heading),Math.cos(otherTo.heading-otherFrom.heading)),initial=elephantBodyClearance(from,otherFrom);let previous=initial;
 for(let i=1;i<=24;i++){const t=i/24,a={position:{x:from.position.x+(to.position.x-from.position.x)*t,z:from.position.z+(to.position.z-from.position.z)*t},heading:from.heading+da*t},b={position:{x:otherFrom.position.x+(otherTo.position.x-otherFrom.position.x)*t,z:otherFrom.position.z+(otherTo.position.z-otherFrom.position.z)*t},heading:otherFrom.heading+db*t},clearance=elephantBodyClearance(a,b);if(clearance<Math.min(0,previous)-1e-8)return false;previous=clearance;}return true;
}
