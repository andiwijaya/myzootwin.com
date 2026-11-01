import {SATISFACTION_RULES,observeHabitat,resetObservation,completeFeedback,interruptedFeedback} from './satisfaction.ts';
import type {Point,Visitor,WorldState,ZooSaveV1} from '../core/state.ts';
import {habitatBlockerKeys} from '../world/build-habitat.ts';
import {cellKey} from '../world/placement-preview.ts';

/** One excursion owns the narrow corridor; two side bays wait FIFO at the entrance.
 * Positions and headings are simulation data. Rendering never advances navigation. */
export const VISIT_RULES=Object.freeze({speed:.05,turn:.22,viewTicks:SATISFACTION_RULES.observationTicks,maxQueueTicks:6000,maxJourneyTicks:2400,footprint:.16});
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
export const ownsCorridor=(v:Visitor)=>v.journey?.startedTick!==null&&v.journey?.startedTick!==undefined;
function setRoute(v:Visitor,route:Point[],phase:Visitor['phase']){v.route=route;v.routeIndex=0;v.phase=phase;}
function returnHome(s:ZooSaveV1,v:Visitor){const route=visitorRoute(s.world,visitorCell(v),s.world.gate);if(route.length)setRoute(v,route,'leaving');}
/** Run on a cloned transaction before validation, without changing positions or money. */
export function reconcileJourneys(s:ZooSaveV1):ZooSaveV1{
 const target=visitTarget(s.world);
 for(const v of s.visitors){const j=v.journey;if(!j||!ownsCorridor(v)||v.phase==='exiting')continue;
  if(v.phase==='leaving'){returnHome(s,v);continue;}
  if(!s.visitorFlow.open||!target||target.habitatId!==j.habitatId){interruptedFeedback(s,v,!s.visitorFlow.open?'closed':s.world.habitats.some(h=>h.id===j.habitatId)?'access-lost':'habitat-removed');returnHome(s,v);continue;}
  const route=visitorRoute(s.world,visitorCell(v),target.cell);if(!route.length){interruptedFeedback(s,v,'access-lost');returnHome(s,v);continue;}
  if(v.phase==='viewing'&&same(visitorCell(v),target.cell))continue;
  setRoute(v,route,'entering');j.dwellTicks=0;resetObservation(v);
 }return s;
}
export function visitorRemovalReason(s:ZooSaveV1,world:WorldState,cell:Point):'visitor-route'|'visitor-occupied'|'in-use'|null{
 for(const v of s.visitors){if(!v.arrival){if(v.route.some(p=>same(p,cell)))return 'in-use';continue;}
  const p=v.position,r=VISIT_RULES.footprint;
  if(p.x+r>cell.x&&p.x-r<cell.x+1&&p.z+r>cell.z&&p.z-r<cell.z+1)return 'visitor-occupied';
  if(ownsCorridor(v)&&!visitorRoute(world,visitorCell(v),world.gate).length)return 'visitor-route';
 }return null;
}
const center=(p:Point)=>({x:p.x+.5,z:p.z+.5});
function move(v:Visitor,to:Point):boolean{
 const j=v.journey!,dx=to.x-v.position.x,dz=to.z-v.position.z,d=Math.hypot(dx,dz);if(d<1e-9)return true;
 const desired=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(desired-j.heading),Math.cos(desired-j.heading));
 j.heading=Math.atan2(Math.sin(j.heading+Math.max(-VISIT_RULES.turn,Math.min(VISIT_RULES.turn,delta))),Math.cos(j.heading+Math.max(-VISIT_RULES.turn,Math.min(VISIT_RULES.turn,delta))));
 if(Math.abs(delta)>.1)return false;
 const amount=Math.min(d,VISIT_RULES.speed);v.position={x:v.position.x+dx/d*amount,z:v.position.z+dz/d*amount};
 if(d<=VISIT_RULES.speed+1e-9){v.position={...to};return true;}return false;
}
export function stepJourneys(s:ZooSaveV1):Array<{visitorId:string;habitatId:string}>{
 const viewed:Array<{visitorId:string;habitatId:string}>=[],target=visitTarget(s.world),remove=new Set<string>();
 for(const v of s.visitors){const j=v.journey;if(!j)continue;
  if(v.phase==='queued'){
   j.queuedTicks++;
   if(!s.visitorFlow.open||!target||j.queuedTicks>=VISIT_RULES.maxQueueTicks){interruptedFeedback(s,v,!s.visitorFlow.open?'closed':!target?s.world.habitats.length?'access-lost':'habitat-removed':'time-limit');v.phase='exiting';}
  }
  if(ownsCorridor(v)&&(v.phase==='entering'||v.phase==='viewing')&&(!s.visitorFlow.open||!target||target.habitatId!==j.habitatId||s.tick-j.startedTick!>=VISIT_RULES.maxJourneyTicks)){interruptedFeedback(s,v,!s.visitorFlow.open?'closed':!s.world.habitats.some(h=>h.id===j.habitatId)?'habitat-removed':!target?'access-lost':'time-limit');returnHome(s,v);}
  if(v.phase==='entering'||v.phase==='leaving'){
   const p=v.route[v.routeIndex];if(!p)continue;
   if(move(v,center(p))){if(v.routeIndex<v.route.length-1)v.routeIndex++;else if(v.phase==='entering'){v.phase='viewing';j.dwellTicks=0;resetObservation(v);}else v.phase='exiting';}
  }else if(v.phase==='viewing'){
   const habitat=s.world.habitats.find(h=>h.id===j.habitatId);if(!habitat){interruptedFeedback(s,v,'habitat-removed');returnHome(s,v);continue;}
   const mid=habitat.cells.reduce((p,c)=>({x:p.x+c.x+.5,z:p.z+c.z+.5}),{x:0,z:0}),desired=Math.atan2(mid.x/habitat.cells.length-v.position.x,mid.z/habitat.cells.length-v.position.z),delta=Math.atan2(Math.sin(desired-j.heading),Math.cos(desired-j.heading));
   j.heading=Math.atan2(Math.sin(j.heading+Math.max(-VISIT_RULES.turn,Math.min(VISIT_RULES.turn,delta))),Math.cos(j.heading+Math.max(-VISIT_RULES.turn,Math.min(VISIT_RULES.turn,delta))));
   if(Math.abs(delta)>.1)continue;
   j.dwellTicks++;observeHabitat(s,v);
   if(j.dwellTicks>=VISIT_RULES.viewTicks){if(!j.viewed&&j.habitatId){j.viewed=true;completeFeedback(s,v);s.visitorFlow.viewedTotal++;viewed.push({visitorId:v.id,habitatId:j.habitatId});}returnHome(s,v);}
  }else if(v.phase==='exiting'){
   const x=s.world.gate.x+(ownsCorridor(v)?.5:.19+v.arrival!.slot*.31);
   if(move(v,{x,z:s.world.gate.z+.88}))remove.add(v.id);
  }
 }
 s.visitors=s.visitors.filter(v=>!remove.has(v.id));
 // The center bay must clear first when a connected habitat is added to a full gate.
 if(s.visitorFlow.open&&target&&!s.visitors.some(ownsCorridor)){
  const centerGuest=s.visitors.find(v=>v.arrival?.slot===1&&!v.journey),eligible=s.visitors.filter(v=>v.phase==='queued').sort((a,b)=>a.arrival!.serial-b.arrival!.serial);
  const chosen=centerGuest?undefined:eligible.find(v=>v.arrival!.slot===1)??eligible[0];
  if(chosen){chosen.journey!.habitatId=target.habitatId;chosen.journey!.startedTick=s.tick;setRoute(chosen,target.route.map(p=>({...p})),'entering');}
 }
 return viewed;
}
