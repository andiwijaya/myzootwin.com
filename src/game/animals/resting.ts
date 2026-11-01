import type {Animal,Habitat,WorldState,ZooSaveV1} from '../core/state.ts';
import {cancelFood} from './feeding.ts';
/** Tunable game-only balance, never real animal husbandry advice. */
export const REST_RULES=Object.freeze({startingEnergy:55,energyPerTick:.08,seekEnergy:60,recoverPerTick:.8,recoveredEnergy:85,maxRestTicks:80,minRestTicks:20,enrichmentPerTick:.03,enrichGainPerTick:1.5,enrichBelow:60,enrichTicks:30,urgentCare:80});
export const BIRD_PERCH_HEIGHT=.42*.62;
export const perchAnchor=(h:Habitat)=>({x:Math.min(...h.cells.map(c=>c.x)),z:Math.min(...h.cells.map(c=>c.z))});
export const restPort=(h:Habitat,slot:number)=>({x:perchAnchor(h).x+.5+slot,z:perchAnchor(h).z+.5});
export const restGround=(h:Habitat,slot:number)=>({x:restPort(h,slot).x,z:perchAnchor(h).z+1.25});
export function reachablePerch(w:WorldState,h:Habitat){const p=perchAnchor(h);return w.resources.find(r=>r.kind==='perch'&&r.habitatId===h.id&&r.cell.x===p.x&&r.cell.z===p.z);}
export function perchClear(s:ZooSaveV1,h:Habitat){return s.animals.every(a=>a.habitatId!==h.id||!a.position||a.motion.phase==='perch'||a.motion.elevation===0&&a.position.z>=perchAnchor(h).z+1.2);}
export function growActivityNeeds(a:Animal){if(a.motion.phase!=='rest')a.energy=Math.max(0,Math.round((a.energy-REST_RULES.energyPerTick)*100)/100);if(a.motion.phase!=='enrich')a.enrichment=Math.max(0,Math.round((a.enrichment-REST_RULES.enrichmentPerTick)*100)/100);}
export function wantsPerch(a:Animal,otherNeed:number){if(otherNeed>=REST_RULES.urgentCare)return false;if(a.energy<=REST_RULES.seekEnergy)return 100-a.energy>otherNeed;return a.enrichment<REST_RULES.enrichBelow&&otherNeed<50;}
export function leavePerch(a:Animal,h:Habitat,slot:number){a.targetResourceId=null;if(a.motion.phase==='rest'||a.motion.phase==='enrich'){a.motion.phase='descend';a.motion.ticksLeft=24;a.target=restGround(h,slot);a.currentBehavior='perch';}else if(a.motion.phase==='seek-rest')cancelFood(a);}
function enter(a:Animal,id:string){a.target=null;a.targetResourceId=id;a.currentBehavior=a.energy<=REST_RULES.seekEnergy?'rest':'enrich';a.motion.phase=a.currentBehavior;a.motion.ticksLeft=a.currentBehavior==='rest'?REST_RULES.maxRestTicks:REST_RULES.enrichTicks;}
/** Landing support remains present on removal. Only a reachable placed kit permits benefits. */
export function finishRestAscent(s:ZooSaveV1,a:Animal,h:Habitat,slot:number,urgent:number){const r=reachablePerch(s.world,h);if(r&&slot<r.capacity&&a.targetResourceId===r.id&&urgent<REST_RULES.urgentCare){enter(a,r.id);return true;}a.targetResourceId=null;return false;}
export function stepRest(s:ZooSaveV1,a:Animal,h:Habitat,slot:number,urgent:number,allowStart=true){
 const r=reachablePerch(s.world,h),m=a.motion,active=m.phase==='rest'||m.phase==='enrich'||m.phase==='seek-rest';
 if(active&&(!r||slot>=r.capacity||a.targetResourceId!==r.id)){leavePerch(a,h,slot);return true;}
 if(m.phase==='rest'||m.phase==='enrich'){
  const resting=m.phase==='rest',elapsed=(resting?REST_RULES.maxRestTicks:REST_RULES.enrichTicks)-m.ticksLeft+1;
  if(resting){a.energy=Math.min(100,Math.round((a.energy+REST_RULES.recoverPerTick)*100)/100);a.restedTicks++;}else{a.enrichment=Math.min(100,Math.round((a.enrichment+REST_RULES.enrichGainPerTick)*100)/100);a.enrichedTicks++;}
  const interrupt=resting?urgent>=REST_RULES.urgentCare&&(elapsed>=REST_RULES.minRestTicks||urgent>=95):urgent>=90&&elapsed>=5;
  if(--m.ticksLeft<=0||interrupt||resting&&elapsed>=REST_RULES.minRestTicks&&a.energy>=REST_RULES.recoveredEnergy){a.targetResourceId=null;a.target=null;a.currentBehavior='perch';m.phase='perch';m.ticksLeft=1;}
  return true;
 }
 if(m.phase==='seek-rest'){
  if(urgent>=REST_RULES.urgentCare){cancelFood(a);return true;}
  const p=a.position!,g=restGround(h,slot),dx=g.x-p.x,dz=g.z-p.z,d=Math.hypot(dx,dz),heading=d>.001?Math.atan2(dx,dz):m.heading,turn=Math.atan2(Math.sin(heading-m.heading),Math.cos(heading-m.heading));m.heading+=Math.max(-.24,Math.min(.24,turn));
  if(d>.001&&Math.abs(turn)<.25){const step=Math.min(.035,d);p.x+=dx/d*step;p.z+=dz/d*step;}
  if(d<=.035){a.position={...g};m.phase='ascend';m.ticksLeft=24;a.target=restPort(h,slot);a.currentBehavior='perch';}else if(--m.ticksLeft<=0)cancelFood(a);return true;
 }
 if(!allowStart||!r||slot>=r.capacity||m.phase==='ascend'||m.phase==='descend')return false;
 if(m.phase==='perch'){enter(a,r.id);return true;}
 m.phase='seek-rest';m.ticksLeft=120;a.currentBehavior='seek-rest';a.target=restGround(h,slot);a.targetResourceId=r.id;return true;
}
export type PerchAction='place'|'remove';
export type PerchCommand='preview'|'confirm'|'cancel'|'remove';
export type PerchReason='missing'|'exists'|'stale'|'invalid'|'busy'|'funds'|'capacity'|null;
export function perchTransaction(s:ZooSaveV1,action:PerchAction,revision:number,generation=0):PerchReason|'ok'{
 const h=s.world.habitats[0];if(!h||h.cells.length!==4)return 'missing';const p=perchAnchor(h);if(![0,1].every(dx=>[0,1].every(dz=>h.cells.some(c=>c.x===p.x+dx&&c.z===p.z+dz))))return 'invalid';const r=s.world.resources.find(r=>r.kind==='perch'&&r.habitatId===h.id);
 if(action==='place'){if(r)return 'exists';if(!perchClear(s,h))return 'busy';if(s.world.resources.some(r=>r.cell.x===p.x&&r.cell.z===p.z))return 'invalid';s.world.resources.push({id:`rest-${p.x}-${p.z}`,kind:'perch',habitatId:h.id,cell:p,stock:0,capacity:2,revision:generation,portions:null});return 'ok';}
 if(!r)return 'missing';if(r.revision!==revision)return 'stale';if(action!=='remove')return 'invalid';s.world.resources=s.world.resources.filter(p=>p.id!==r.id);for(const [slot,a]of [...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).entries())if(a.targetResourceId===r.id)leavePerch(a,h,slot);return 'ok';
}
export interface PerchView {canPlace:boolean;habitat:boolean;exists:boolean;reachable:boolean;capacity:number;revision:number;preview:boolean;reason:PerchReason;resting:number;exploring:number;}
export function perchView(s:ZooSaveV1):PerchView{const h=s.world.habitats[0],r=h?s.world.resources.find(r=>r.kind==='perch'&&r.habitatId===h.id):undefined;return {canPlace:Boolean(h&&perchClear(s,h)),habitat:Boolean(h),exists:Boolean(r),reachable:Boolean(h&&reachablePerch(s.world,h)),capacity:Math.min(2,r?.capacity??2),revision:r?.revision??0,preview:false,reason:null,resting:s.animals.filter(a=>a.targetResourceId===r?.id&&a.motion.phase==='rest').length,exploring:s.animals.filter(a=>a.targetResourceId===r?.id&&a.motion.phase==='enrich').length};}
