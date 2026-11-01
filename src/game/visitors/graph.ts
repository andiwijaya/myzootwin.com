import type {Point,Visitor,WorldState} from '../core/state.ts';
import {habitatBlockerKeys} from '../world/build-habitat.ts';
import {cellKey} from '../world/placement-preview.ts';
export const VISITOR_STEP=.05;
const blockers=habitatBlockerKeys();
const same=(a:Point,b:Point)=>a.x===b.x&&a.z===b.z;
export const visitorCell=(v:Visitor):Point=>({x:Math.floor(v.position.x),z:Math.floor(v.position.z)});
export function visitorPaths(w:WorldState):Map<string,Point>{return new Map(w.tiles.filter(t=>t.path&&t.terrain==='land'&&t.occupantId===null&&(same(t.cell,w.gate)||!blockers.has(cellKey(t.cell)))).map(t=>[cellKey(t.cell),t.cell]));}
export function visitorRoute(w:WorldState,from:Point,to:Point):Point[]{
 const paths=visitorPaths(w),start=cellKey(from),end=cellKey(to);if(!paths.has(start)||!paths.has(end))return [];
 const queue=[from],parents=new Map<string,string|null>([[start,null]]);
 for(let i=0;i<queue.length&&!parents.has(end);i++){const c=queue[i];for(const n of [{x:c.x,z:c.z-1},{x:c.x-1,z:c.z},{x:c.x+1,z:c.z},{x:c.x,z:c.z+1}]){const k=cellKey(n);if(!paths.has(k)||parents.has(k))continue;
 // Gate columns occupy east/west approaches; use the actual open north/south lane.
 if((same(c,w.gate)||same(n,w.gate))&&n.x!==c.x)continue;
 parents.set(k,cellKey(c));queue.push(n);}}
 if(!parents.has(end))return [];const result:Point[]=[];let k:string|null=end;while(k!==null){result.unshift({...paths.get(k)!});k=parents.get(k)??null;}return result;
}
export function visitTarget(w:WorldState):{habitatId:string;cell:Point;route:Point[]}|null{
 const candidates:Array<{habitatId:string;cell:Point;route:Point[]}>=[],paths=visitorPaths(w);
 for(const h of w.habitats)for(const c of h.cells)for(const n of [{x:c.x,z:c.z-1},{x:c.x-1,z:c.z},{x:c.x+1,z:c.z},{x:c.x,z:c.z+1}]){
  if(!paths.has(cellKey(n)))continue;const route=visitorRoute(w,w.gate,n);if(route.length>1)candidates.push({habitatId:h.id,cell:n,route});
 }
 candidates.sort((a,b)=>a.route.length-b.route.length||a.cell.z-b.cell.z||a.cell.x-b.cell.x||a.habitatId.localeCompare(b.habitatId));return candidates[0]??null;
}
