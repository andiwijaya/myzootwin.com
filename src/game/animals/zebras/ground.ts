import type {Point} from '../../core/state.ts';
import type {V5ZooWorld,ZebraHabitat,ZebraResource} from '../../core/zebra-state.ts';
import {ZEBRA_GROUND as G} from './rules.ts';
export const zebraDistance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export const zebraBounds=(h:ZebraHabitat)=>({x:Math.min(...h.cells.map(c=>c.x)),z:Math.min(...h.cells.map(c=>c.z))});
const key=(p:Point)=>`${p.x},${p.z}`;
function context(world:Pick<V5ZooWorld,'resources'>,h:ZebraHabitat){
 const bounds=zebraBounds(h),props=world.resources.filter((r):r is ZebraResource=>r.habitatId===h.id&&r.kind.startsWith('zebra-')).map(r=>({x:r.cell.x+.5,z:r.cell.z+.5}));
 return {bounds,allowed(p:Point,others:readonly Point[]=[]){return h.cells.length===64&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=bounds.x+G.margin&&p.x<=bounds.x+8-G.margin&&p.z>=bounds.z+G.margin&&p.z<=bounds.z+8-G.margin&&props.every(q=>zebraDistance(p,q)>=G.propClearance-1e-8)&&others.every(q=>zebraDistance(p,q)>=G.separation-1e-8);}};
}
type Context=ReturnType<typeof context>;
function segment(c:Context,from:Point,to:Point,others:readonly Point[]=[]){const steps=Math.max(1,Math.ceil(zebraDistance(from,to)/.08));for(let i=0;i<=steps;i++)if(!c.allowed({x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps},others))return false;return true;}
export const zebraPointAllowed=(world:Pick<V5ZooWorld,'resources'>,h:ZebraHabitat,p:Point,others:readonly Point[]=[])=>context(world,h).allowed(p,others);
export const zebraSegmentAllowed=(world:Pick<V5ZooWorld,'resources'>,h:ZebraHabitat,from:Point,to:Point,others:readonly Point[]=[])=>segment(context(world,h),from,to,others);
function nodes(c:Context,others:readonly Point[]=[]){const out:Point[]=[];for(let z=1;z<=7;z+=.5)for(let x=1;x<=7;x+=.5){const p={x:c.bounds.x+x,z:c.bounds.z+z};if(c.allowed(p,others))out.push(p);}return out;}
export const zebraGroundNodes=(world:Pick<V5ZooWorld,'resources'>,h:ZebraHabitat,others:readonly Point[]=[])=>nodes(context(world,h),others);
/** Bounded169-node four-neighbour BFS, same canonical world coordinates; no RNG, wall clock or state write. */
export function zebraGroundRoute(world:Pick<V5ZooWorld,'resources'>,h:ZebraHabitat,from:Point,to:Point,others:readonly Point[]=[]):Point[]|null{
 const c=context(world,h);if(!c.allowed(from,others)||!c.allowed(to,others))return null;if(segment(c,from,to,others))return [{...to}];
 const available=nodes(c,others),map=new Map(available.map(p=>[key(p),p])),start=available.filter(p=>zebraDistance(from,p)<=.76&&segment(c,from,p,others)).sort((a,b)=>zebraDistance(from,a)-zebraDistance(from,b)||a.z-b.z||a.x-b.x),queue=[...start],parents=new Map(start.map(p=>[key(p),null as string|null]));let end:string|null=null;
 for(let i=0;i<queue.length;i++){const p=queue[i]!;if(zebraDistance(p,to)<=.76&&segment(c,p,to,others)){end=key(p);break;}for(const q of [{x:p.x,z:p.z-.5},{x:p.x-.5,z:p.z},{x:p.x+.5,z:p.z},{x:p.x,z:p.z+.5}])if(map.has(key(q))&&!parents.has(key(q))&&segment(c,p,q,others)){parents.set(key(q),key(p));queue.push(q);}}
 if(end===null)return null;const route=[{...to}];for(let cursor:string|null=end;cursor!==null;cursor=parents.get(cursor)??null)route.unshift({...map.get(cursor)!});return route;
}
/** Read-only welfare access uses the exact original route graph, without temporary
 * actor reservations. Cache only geometry; stocks and animal needs remain live. */
const accessCache=new WeakMap<object,{signature:string;value:ReturnType<typeof makeAccess>}>();
function makeAccess(world:Pick<V5ZooWorld,'resources'>,h:ZebraHabitat){
 const c=context(world,h),available=nodes(c),map=new Map(available.map((p,i)=>[key(p),i])),groups=new Map<number,number>();let group=0;
 for(let i=0;i<available.length;i++){if(groups.has(i))continue;const queue=[i];groups.set(i,group);for(let j=0;j<queue.length;j++){const p=available[queue[j]!]!;for(const q of[{x:p.x,z:p.z-.5},{x:p.x-.5,z:p.z},{x:p.x+.5,z:p.z},{x:p.x,z:p.z+.5}]){const n=map.get(key(q));if(n!==undefined&&!groups.has(n)&&segment(c,p,q)){groups.set(n,group);queue.push(n);}}}group++;}
 const ports=new Map<string,Set<number>>(),connections=(p:Point)=>new Set(available.flatMap((q,i)=>zebraDistance(p,q)<=.76&&segment(c,p,q)?[groups.get(i)!]:[]));
 return{nodes:available.length,allowed:(p:Point)=>c.allowed(p),from(p:Point){const own=connections(p);return(to:Point)=>{if(!c.allowed(p)||!c.allowed(to))return false;let target=ports.get(key(to));if(!target){target=connections(to);ports.set(key(to),target);}return [...own].some(g=>target!.has(g))||segment(c,p,to);};}};
}
export function zebraGroundAccess(world:Pick<V5ZooWorld,'resources'>,h:ZebraHabitat){const signature=JSON.stringify([h.cells,world.resources.filter(r=>r.habitatId===h.id&&r.kind.startsWith('zebra-')).map(r=>r.cell)]),prior=accessCache.get(world);if(prior?.signature===signature)return prior.value;const value=makeAccess(world,h);accessCache.set(world,{signature,value});return value;}
