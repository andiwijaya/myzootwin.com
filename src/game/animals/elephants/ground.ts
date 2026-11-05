import {elephantBodyMoveAllowed,elephantBodyTurnAllowed,type GroundBody} from './body-clearance.ts';
import type {Point} from '../../core/state.ts';
import type {ZooHabitat,ZooWorld} from '../../core/species.ts';
export const ELEPHANT_GROUND=Object.freeze({margin:1.1,propClearance:1.35,separation:1.55,speed:.04,turn:.18,seekTimeout:500});
export const groundDistance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const key=(p:Point)=>`${p.x},${p.z}`;
export function groundBounds(h:ZooHabitat){const x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z));return {x,z,maxX:x+6,maxZ:z+6};}
/** Collision belongs to authoritative state, including when the renderer is absent. */
export function groundPointAllowed(world:ZooWorld,h:ZooHabitat,p:Point,others:readonly Point[]=[]){
 if(h.kind!=='elephant-grove'||h.cells.length!==36)return false;
 const b=groundBounds(h),r=ELEPHANT_GROUND;return Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=b.x+r.margin&&p.x<=b.maxX-r.margin&&p.z>=b.z+r.margin&&p.z<=b.maxZ-r.margin&&world.resources.every(q=>q.habitatId!==h.id||groundDistance(p,{x:q.cell.x+.5,z:q.cell.z+.5})>=r.propClearance)&&others.every(q=>groundDistance(p,q)>=r.separation-1e-8);
}
export function groundCenters(world:ZooWorld,h:ZooHabitat,others:readonly Point[]=[]){
 const b=groundBounds(h),result:Point[]=[];for(let z=1;z<5;z++)for(let x=1;x<5;x++){const p={x:b.x+x+.5,z:b.z+z+.5};if(groundPointAllowed(world,h,p,others))result.push(p);}return result;
}
export function groundSegmentAllowed(world:ZooWorld,h:ZooHabitat,from:Point,to:Point,others:readonly Point[]=[]){
 if(!groundPointAllowed(world,h,from,others)||!groundPointAllowed(world,h,to,others))return false;
 const dx=to.x-from.x,dz=to.z-from.z,length=dx*dx+dz*dz;
 const separation=(p:Point)=>{const t=length?Math.max(0,Math.min(1,((p.x-from.x)*dx+(p.z-from.z)*dz)/length)):0;return groundDistance(p,{x:from.x+dx*t,z:from.z+dz*t});};
 return world.resources.every(r=>r.habitatId!==h.id||separation({x:r.cell.x+.5,z:r.cell.z+.5})>=ELEPHANT_GROUND.propClearance-1e-8)&&others.every(p=>separation(p)>=ELEPHANT_GROUND.separation-1e-8);
}
/** Bounded four-neighbor search over at most16 interior cells. No diagonal corner cutting or teleport. */
export function elephantGroundRoute(world:ZooWorld,h:ZooHabitat,from:Point,to:Point,others:readonly Point[]=[]):Point[]|null{
 if(!groundPointAllowed(world,h,from,others)||!groundPointAllowed(world,h,to,others))return null;
 if(groundDistance(from,to)<1e-6)return [{...to}];
 const points=groundCenters(world,h,others),nodes=new Map(points.map(p=>[key(p),p])),end=key(to);if(!nodes.has(end))return null;
 const starts=points.filter(p=>groundSegmentAllowed(world,h,from,p,others)).sort((a,b)=>groundDistance(from,a)-groundDistance(from,b)||a.z-b.z||a.x-b.x);
 for(const start of starts){
  const queue=[start],parents=new Map<string,string|null>([[key(start),null]]);
  for(let i=0;i<queue.length&&!parents.has(end);i++){const p=queue[i]!;for(const q of [{x:p.x,z:p.z-1},{x:p.x-1,z:p.z},{x:p.x+1,z:p.z},{x:p.x,z:p.z+1}]){const k=key(q);if(!nodes.has(k)||parents.has(k)||!groundSegmentAllowed(world,h,p,q,others))continue;parents.set(k,key(p));queue.push(q);}}
  if(!parents.has(end))continue;const route:Point[]=[];let k:string|null=end;while(k!==null){route.unshift({...nodes.get(k)!});k=parents.get(k)??null;}if(groundDistance(from,route[0]!)>.001)route.unshift({...from});return route;
 }
 return null;
}


/** At most49 half-cell navigation nodes; placement/welfare still use the original16 coarse cells. */
export function elephantBodyRoute(world:ZooWorld,h:ZooHabitat,from:Point,to:Point,heading:number,others:readonly GroundBody[],goalHeading?:number):Point[]|null{
 const points=others.map(b=>b.position);if(!groundPointAllowed(world,h,from,points)||!groundPointAllowed(world,h,to,points))return null;
 if(groundDistance(from,to)<1e-6)return goalHeading===undefined||elephantBodyTurnAllowed(from,heading,goalHeading,others)?[{...to}]:null;
 const bounds=groundBounds(h),nodes=new Map<string,Point>();for(let z=1.5;z<=4.5;z+=.5)for(let x=1.5;x<=4.5;x+=.5){const p={x:bounds.x+x,z:bounds.z+z};if(groundPointAllowed(world,h,p,points))nodes.set(key(p),p);}if(!nodes.has(key(to)))return null;
 type Node={p:Point;heading:number;parent:number};const queue:Node[]=[],visited=new Set<string>(),starts=[...nodes.values()].sort((a,b)=>groundDistance(from,a)-groundDistance(from,b)||a.z-b.z||a.x-b.x);
 for(const p of starts){const d=groundDistance(from,p),a=d<1e-6?heading:Math.atan2(p.x-from.x,p.z-from.z);if(!groundSegmentAllowed(world,h,from,p,points)||!elephantBodyTurnAllowed(from,heading,a,others)||!elephantBodyMoveAllowed(from,p,a,others)&&d>1e-6)continue;queue.push({p,heading:a,parent:-1});visited.add(key(p)+':start');}
 for(let i=0;i<queue.length;i++){const node=queue[i]!,p=node.p;if(key(p)===key(to)&&(goalHeading===undefined||elephantBodyTurnAllowed(p,node.heading,goalHeading,others))){const route:Point[]=[];let index=i;while(index>=0){route.unshift({...queue[index]!.p});index=queue[index]!.parent;}if(groundDistance(from,route[0]!)>1e-6)route.unshift({...from});return route;}
  for(const [dx,dz]of [[0,-.5],[-.5,0],[.5,0],[0,.5]]){const q={x:p.x+dx!,z:p.z+dz!},a=Math.atan2(dx!,dz!),id=key(q)+':'+a;if(!nodes.has(key(q))||visited.has(id)||!groundSegmentAllowed(world,h,p,q,points)||!elephantBodyTurnAllowed(p,node.heading,a,others)||!elephantBodyMoveAllowed(p,q,a,others))continue;visited.add(id);queue.push({p:q,heading:a,parent:i});}
 }
 return null;
}
