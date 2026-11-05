import type {RuntimeState} from '../core/runtime-state.ts';
import type {Point,Visitor,RuntimeWorld} from '../core/state.ts';
import {habitatBlockerKeys} from '../world/build-habitat.ts';
import {cellKey} from '../world/placement-preview.ts';
export const VISITOR_STEP=.05;
const blockers=habitatBlockerKeys();
const same=(a:Point,b:Point)=>a.x===b.x&&a.z===b.z;
export const visitorCell=(v:Visitor):Point=>({x:Math.floor(v.position.x),z:Math.floor(v.position.z)});
export function visitorPaths(w:RuntimeWorld):Map<string,Point>{return new Map(w.tiles.filter(t=>t.path&&t.terrain==='land'&&t.occupantId===null&&(same(t.cell,w.gate)||!blockers.has(cellKey(t.cell)))).map(t=>[cellKey(t.cell),t.cell]));}
export function visitorRoute(w:RuntimeWorld,from:Point,to:Point):Point[]{
 const paths=visitorPaths(w),start=cellKey(from),end=cellKey(to);if(!paths.has(start)||!paths.has(end))return [];
 const queue=[from],parents=new Map<string,string|null>([[start,null]]);
 for(let i=0;i<queue.length&&!parents.has(end);i++){const c=queue[i];for(const n of [{x:c.x,z:c.z-1},{x:c.x-1,z:c.z},{x:c.x+1,z:c.z},{x:c.x,z:c.z+1}]){const k=cellKey(n);if(!paths.has(k)||parents.has(k))continue;
 // Gate columns occupy east/west approaches; use the actual open north/south lane.
 if((same(c,w.gate)||same(n,w.gate))&&n.x!==c.x)continue;
 parents.set(k,cellKey(c));queue.push(n);}}
 if(!parents.has(end))return [];const result:Point[]=[];let k:string|null=end;while(k!==null){result.unshift({...paths.get(k)!});k=parents.get(k)??null;}return result;
}
export interface VisitTarget {habitatId:string;cell:Point;route:Point[];}
/** Nearest real outside-path approach per habitat, preserving the legacy route/tie order. */
export function visitTargets(w:RuntimeWorld):VisitTarget[]{
 const candidates:VisitTarget[]=[],paths=visitorPaths(w);
 for(const h of w.habitats)for(const c of h.cells)for(const n of [{x:c.x,z:c.z-1},{x:c.x-1,z:c.z},{x:c.x+1,z:c.z},{x:c.x,z:c.z+1}]){
  if(!paths.has(cellKey(n)))continue;const route=visitorRoute(w,w.gate,n);if(route.length>1)candidates.push({habitatId:h.id,cell:n,route});
 }
 candidates.sort((a,b)=>a.route.length-b.route.length||a.cell.z-b.cell.z||a.cell.x-b.cell.x||a.habitatId.localeCompare(b.habitatId));const seen=new Set<string>();return candidates.filter(target=>{if(seen.has(target.habitatId))return false;seen.add(target.habitatId);return true;});
}
export function visitTarget(w:RuntimeWorld):VisitTarget|null{return visitTargets(w)[0]??null;}
const populated=(s:RuntimeState,id:string)=>s.animals.some(a=>a.habitatId===id&&a.position!==null);
/** Empty new groves never divert legacy visitors. A populated reachable habitat takes priority over an empty alternative. */
export function visitTargetsForState(s:RuntimeState):VisitTarget[]{
 const visible={...s.world,habitats:s.world.habitats.filter(h=>!('kind'in h&&h.kind==='elephant-grove'&&!populated(s,h.id)))},targets=visitTargets(visible),occupied=targets.filter(t=>populated(s,t.habitatId));return s.world.habitats.length>1&&occupied.length?occupied:targets;
}
/** Explicit targets pin existing journeys; selecting a new destination never retargets a visitor in flight. */
export function visitTargetForState(s:RuntimeState,habitatId?:string):VisitTarget|null{
 if(!habitatId)return visitTargetsForState(s)[0]??null;
 return visitTarget({...s.world,habitats:s.world.habitats.filter(h=>h.id===habitatId&&!('kind'in h&&h.kind==='elephant-grove'&&!populated(s,h.id)))});
}
/** Round robin follows the last actual paid gate receipt, retained through compaction and cold saves. No counter/RNG mutation. */
export function selectVisitTarget(s:RuntimeState):VisitTarget|null{
 const targets=visitTargetsForState(s);if(targets.length<2)return targets[0]??null;
 const receipts=[...s.admissions,...(s.economy.checkpoint.lastTicket?[s.economy.checkpoint.lastTicket.admission]:[])],latest=receipts.reduce<(typeof receipts)[number]|null>((last,a)=>!last||a.tick>last.tick||a.tick===last.tick&&a.id.localeCompare(last.id)>0?a:last,null),index=targets.findIndex(t=>t.habitatId===latest?.entry?.habitatId);return targets[(index+1)%targets.length]!;
}
