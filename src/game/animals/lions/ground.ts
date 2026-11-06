import type {Point} from '../../core/state.ts';
import type {LionHabitat,LionResource,ZooWorld} from '../../core/species.ts';
export const LION_GROUND=Object.freeze({margin:.65,propClearance:.72,separation:.9,speed:.055,turn:.16,rampHeight:.65,rampLength:2,seekTimeout:600});
export const lionDistance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const key=(p:Point)=>`${p.x},${p.z}`;
export const lionBounds=(h:LionHabitat)=>({x:Math.min(...h.cells.map(c=>c.x)),z:Math.min(...h.cells.map(c=>c.z))});
const center=(r:LionResource)=>({x:r.cell.x+.5,z:r.cell.z+.5});
/** Build one local geometric context per query; no persistent cache can hide edited or untrusted geometry. */
function groundContext(world:Pick<ZooWorld,'resources'>,h:LionHabitat){
 const bounds=lionBounds(h),r=LION_GROUND,obstacles=world.resources.filter(q=>q.habitatId===h.id&&q.kind!=='lion-kopje').map(q=>({x:q.cell.x+.5,z:q.cell.z+.5})),rock=world.resources.find((q):q is LionResource=>q.habitatId===h.id&&q.kind==='lion-kopje'),c=rock?center(rock):null;
 return {allowed(p:Point,others:readonly Point[]=[]){return h.cells.length===49&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=bounds.x+r.margin&&p.x<=bounds.x+7-r.margin&&p.z>=bounds.z+r.margin&&p.z<=bounds.z+7-r.margin&&obstacles.every(q=>lionDistance(p,q)>=r.propClearance-1e-8)&&others.every(q=>lionDistance(p,q)>=r.separation-1e-8);},height(p:Point){if(!c||Math.abs(p.x-c.x)>.5||p.z<c.z-.5||p.z>c.z+2)return 0;return r.rampHeight*Math.max(0,Math.min(1,(c.z+2-p.z)/2));},bounds};
}
type GroundContext=ReturnType<typeof groundContext>;
/** Kopje has a level northern crown and a two-tile south ramp. */
export function lionGroundHeight(world:Pick<ZooWorld,'resources'>,h:LionHabitat,p:Point):number{return groundContext(world,h).height(p);}
export function lionPointAllowed(world:Pick<ZooWorld,'resources'>,h:LionHabitat,p:Point,others:readonly Point[]=[]):boolean{return groundContext(world,h).allowed(p,others);}
function segmentAllowed(context:GroundContext,from:Point,to:Point,others:readonly Point[]):boolean{
 if(!context.allowed(from,others)||!context.allowed(to,others))return false;
 const d=lionDistance(from,to),steps=Math.max(1,Math.ceil(d/.08));let prior=from,priorY=context.height(from);
 for(let i=1;i<=steps;i++){const p={x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps},y=context.height(p);if(!context.allowed(p,others)||Math.abs(y-priorY)>lionDistance(prior,p)*.5+1e-7)return false;prior=p;priorY=y;}
 return true;
}
export function lionSegmentAllowed(world:Pick<ZooWorld,'resources'>,h:LionHabitat,from:Point,to:Point,others:readonly Point[]=[]):boolean{return segmentAllowed(groundContext(world,h),from,to,others);}
function groundNodes(context:GroundContext,others:readonly Point[]):Point[]{const b=context.bounds,points:Point[]=[];for(let z=1;z<=6;z+=.5)for(let x=1;x<=6;x+=.5){const p={x:b.x+x,z:b.z+z};if(context.allowed(p,others))points.push(p);}return points;}
export function lionGroundNodes(world:Pick<ZooWorld,'resources'>,h:LionHabitat,others:readonly Point[]=[]):Point[]{return groundNodes(groundContext(world,h),others);}
/** Deterministic bounded 121-node BFS; every segment checks fence, props, neighbors and ramp slope. */
export function lionGroundRoute(world:Pick<ZooWorld,'resources'>,h:LionHabitat,from:Point,to:Point,others:readonly Point[]=[]):Point[]|null{
 const context=groundContext(world,h),segment=(a:Point,b:Point)=>segmentAllowed(context,a,b,others);
 if(!context.allowed(from,others)||!context.allowed(to,others))return null;
 if(segment(from,to))return [{...to}];
 const points=groundNodes(context,others),nodes=new Map(points.map(p=>[key(p),p]));
 const starts=points.filter(p=>lionDistance(from,p)<=.76&&segment(from,p)).sort((a,b)=>lionDistance(from,a)-lionDistance(from,b)||a.z-b.z||a.x-b.x);
 const queue=[...starts],parents=new Map(starts.map(p=>[key(p),null as string|null]));let end:string|null=null;
 for(let i=0;i<queue.length;i++){
  const p=queue[i]!;if(lionDistance(p,to)<=.76&&segment(p,to)){end=key(p);break;}
  for(const q of [{x:p.x,z:p.z-.5},{x:p.x-.5,z:p.z},{x:p.x+.5,z:p.z},{x:p.x,z:p.z+.5}])if(nodes.has(key(q))&&!parents.has(key(q))&&segment(p,q)){parents.set(key(q),key(p));queue.push(q);}
 }
 if(end===null)return null;const route:Point[]=[{...to}];for(let cursor:string|null=end;cursor!==null;cursor=parents.get(cursor)??null)route.unshift({...nodes.get(cursor)!});return route;
}
