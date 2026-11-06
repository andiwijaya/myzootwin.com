import type {Point} from '../../core/state.ts';
import type {LionHabitat,LionResource,ZooWorld} from '../../core/species.ts';
export const LION_GROUND=Object.freeze({margin:.65,propClearance:.72,separation:.9,speed:.055,turn:.16,rampHeight:.65,rampLength:2,seekTimeout:600});
export const lionDistance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const key=(p:Point)=>`${p.x},${p.z}`;
export const lionBounds=(h:LionHabitat)=>({x:Math.min(...h.cells.map(c=>c.x)),z:Math.min(...h.cells.map(c=>c.z))});
const center=(r:LionResource)=>({x:r.cell.x+.5,z:r.cell.z+.5});
/** Kopje has a level northern crown and a two-tile south ramp; geometry consumes this function too. */
export function lionGroundHeight(world:ZooWorld,h:LionHabitat,p:Point):number {
 const rock=world.resources.find((r):r is LionResource=>r.habitatId===h.id&&r.kind==='lion-kopje');if(!rock)return 0;
 const c=center(rock);if(Math.abs(p.x-c.x)>.5||p.z<c.z-.5||p.z>c.z+2)return 0;
 return LION_GROUND.rampHeight*Math.max(0,Math.min(1,(c.z+2-p.z)/2));
}
export function lionPointAllowed(world:ZooWorld,h:LionHabitat,p:Point,others:readonly Point[]=[]):boolean{
 const b=lionBounds(h),r=LION_GROUND;
 return h.cells.length===49&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=b.x+r.margin&&p.x<=b.x+7-r.margin&&p.z>=b.z+r.margin&&p.z<=b.z+7-r.margin&&world.resources.every(q=>q.habitatId!==h.id||q.kind==='lion-kopje'||lionDistance(p,{x:q.cell.x+.5,z:q.cell.z+.5})>=r.propClearance-1e-8)&&others.every(q=>lionDistance(p,q)>=r.separation-1e-8);
}
export function lionSegmentAllowed(world:ZooWorld,h:LionHabitat,from:Point,to:Point,others:readonly Point[]=[]):boolean{
 if(!lionPointAllowed(world,h,from,others)||!lionPointAllowed(world,h,to,others))return false;
 const d=lionDistance(from,to),steps=Math.max(1,Math.ceil(d/.08));let prior=from,priorY=lionGroundHeight(world,h,from);
 for(let i=1;i<=steps;i++){
  const p={x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps},y=lionGroundHeight(world,h,p);
  if(!lionPointAllowed(world,h,p,others)||Math.abs(y-priorY)>lionDistance(prior,p)*.5+1e-7)return false;
  prior=p;priorY=y;
 }
 return true;
}
export function lionGroundNodes(world:ZooWorld,h:LionHabitat,others:readonly Point[]=[]):Point[]{
 const b=lionBounds(h),points:Point[]=[];
 for(let z=1;z<=6;z+=.5)for(let x=1;x<=6;x+=.5){const p={x:b.x+x,z:b.z+z};if(lionPointAllowed(world,h,p,others))points.push(p);}return points;
}
/** Deterministic bounded 121-node BFS; every segment checks fence, props, neighbors and ramp slope. */
export function lionGroundRoute(world:ZooWorld,h:LionHabitat,from:Point,to:Point,others:readonly Point[]=[]):Point[]|null{
 if(!lionPointAllowed(world,h,from,others)||!lionPointAllowed(world,h,to,others))return null;
 if(lionSegmentAllowed(world,h,from,to,others))return [{...to}];
 const points=lionGroundNodes(world,h,others),nodes=new Map(points.map(p=>[key(p),p]));
 const starts=points.filter(p=>lionDistance(from,p)<=.76&&lionSegmentAllowed(world,h,from,p,others)).sort((a,b)=>lionDistance(from,a)-lionDistance(from,b)||a.z-b.z||a.x-b.x);
 const queue=[...starts],parents=new Map(starts.map(p=>[key(p),null as string|null]));let end:string|null=null;
 for(let i=0;i<queue.length;i++){
  const p=queue[i]!;if(lionDistance(p,to)<=.76&&lionSegmentAllowed(world,h,p,to,others)){end=key(p);break;}
  for(const q of [{x:p.x,z:p.z-.5},{x:p.x-.5,z:p.z},{x:p.x+.5,z:p.z},{x:p.x,z:p.z+.5}])if(nodes.has(key(q))&&!parents.has(key(q))&&lionSegmentAllowed(world,h,p,q,others)){parents.set(key(q),key(p));queue.push(q);}
 }
 if(end===null)return null;const route:Point[]=[{...to}];for(let cursor:string|null=end;cursor!==null;cursor=parents.get(cursor)??null)route.unshift({...nodes.get(cursor)!});return route;
}
