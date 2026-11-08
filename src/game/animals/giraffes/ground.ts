import type {Point} from '../../core/state.ts';
import type {GiraffeHabitat,GiraffeResource} from '../../core/giraffe-state.ts';
import type {V5ZooWorld} from '../../core/zebra-state.ts';
export const GIRAFFE_GROUND=Object.freeze({margin:.75,propClearance:.76,separation:1.05,speed:.04,turn:.12,seekTimeout:600});
export const giraffeDistance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export const giraffeBounds=(h:GiraffeHabitat)=>({x:Math.min(...h.cells.map(c=>c.x)),z:Math.min(...h.cells.map(c=>c.z))});
const key=(p:Point)=>`${p.x},${p.z}`;
function context(world:Pick<V5ZooWorld,'resources'>,h:GiraffeHabitat){
 const bounds=giraffeBounds(h),obstacles=world.resources.filter((r):r is GiraffeResource=>r.habitatId===h.id&&r.kind.startsWith('giraffe-')).map(r=>({x:r.cell.x+.5,z:r.cell.z+.5}));
 return {bounds,allowed(p:Point,others:readonly Point[]=[]){return h.cells.length===49&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=bounds.x+.75&&p.x<=bounds.x+6.25&&p.z>=bounds.z+.75&&p.z<=bounds.z+6.25&&obstacles.every(q=>giraffeDistance(p,q)>=.76-1e-8)&&others.every(q=>giraffeDistance(p,q)>=1.05-1e-8);}};
}
type Context=ReturnType<typeof context>;
function segment(c:Context,from:Point,to:Point,others:readonly Point[]=[]){
 const steps=Math.max(1,Math.ceil(giraffeDistance(from,to)/.08));for(let i=0;i<=steps;i++)if(!c.allowed({x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps},others))return false;return true;
}
export const giraffePointAllowed=(world:Pick<V5ZooWorld,'resources'>,h:GiraffeHabitat,p:Point,others:readonly Point[]=[])=>context(world,h).allowed(p,others);
export const giraffeSegmentAllowed=(world:Pick<V5ZooWorld,'resources'>,h:GiraffeHabitat,from:Point,to:Point,others:readonly Point[]=[])=>segment(context(world,h),from,to,others);
function nodes(c:Context,others:readonly Point[]=[]){const out:Point[]=[];for(let z=1;z<=6;z+=.5)for(let x=1;x<=6;x+=.5){const p={x:c.bounds.x+x,z:c.bounds.z+z};if(c.allowed(p,others))out.push(p);}return out;}
export const giraffeGroundNodes=(world:Pick<V5ZooWorld,'resources'>,h:GiraffeHabitat,others:readonly Point[]=[])=>nodes(context(world,h),others);
/** Deterministic bounded121-node ground BFS; no wall time or RNG. */
export function giraffeGroundRoute(world:Pick<V5ZooWorld,'resources'>,h:GiraffeHabitat,from:Point,to:Point,others:readonly Point[]=[]):Point[]|null {
 const c=context(world,h);if(!c.allowed(from,others)||!c.allowed(to,others))return null;if(segment(c,from,to,others))return [{...to}];
 const available=nodes(c,others),map=new Map(available.map(p=>[key(p),p])),start=available.filter(p=>giraffeDistance(from,p)<=.76&&segment(c,from,p,others)).sort((a,b)=>giraffeDistance(from,a)-giraffeDistance(from,b)||a.z-b.z||a.x-b.x),queue=[...start],parents=new Map(start.map(p=>[key(p),null as string|null]));let end:string|null=null;
 for(let i=0;i<queue.length;i++){const p=queue[i]!;if(giraffeDistance(p,to)<=.76&&segment(c,p,to,others)){end=key(p);break;}for(const q of [{x:p.x,z:p.z-.5},{x:p.x-.5,z:p.z},{x:p.x+.5,z:p.z},{x:p.x,z:p.z+.5}])if(map.has(key(q))&&!parents.has(key(q))&&segment(c,p,q,others)){parents.set(key(q),key(p));queue.push(q);}}
 if(end===null)return null;const route=[{...to}];for(let cursor:string|null=end;cursor!==null;cursor=parents.get(cursor)??null)route.unshift({...map.get(cursor)!});return route;
}
