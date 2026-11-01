import type {Animal,Habitat,WorldState,ZooSaveV1} from '../core/state.ts';
/** Starting game balance, not a scientific diet/husbandry model. Units are per 100ms simulation tick. */
export const FOOD_RULES=Object.freeze({capacity:8,startingHunger:45,hungerPerTick:.12,seekAt:35,reliefPerPortion:30,eatTicks:20,seekTimeout:120,groundSpeed:.035});
export const feederAnchor=(h:Habitat)=>({x:Math.min(...h.cells.map(c=>c.x)),z:Math.min(...h.cells.map(c=>c.z))+1});
export const foodPort=(h:Habitat,slot:number)=>({x:Math.min(...h.cells.map(c=>c.x))+.5+slot,z:Math.min(...h.cells.map(c=>c.z))+1.4});
export function reachableFood(w:WorldState,h:Habitat){const p=feederAnchor(h);return w.resources.find(r=>r.kind==='food'&&r.habitatId===h.id&&r.cell.x===p.x&&r.cell.z===p.z);}
export function feederClear(s:ZooSaveV1,h:Habitat){const z=feederAnchor(h).z+.30;return s.animals.every(a=>a.habitatId!==h.id||!a.position||a.position.z<=z||Math.abs(Math.atan2(Math.sin(a.motion.heading),Math.cos(a.motion.heading)))<.10);}
function leaveFood(a:Animal,h:Habitat,slot:number){a.currentBehavior='wander';a.motion.phase='leave-food';a.motion.ticksLeft=120;a.motion.heading=0;a.target={x:foodPort(h,slot).x,z:feederAnchor(h).z+.25};a.targetResourceId=null;}
export function cancelFood(a:Animal){a.target=null;a.targetResourceId=null;a.currentBehavior='idle';a.motion.phase='idle';a.motion.ticksLeft=25;a.motion.elevation=0;}
export function stepFood(s:ZooSaveV1,a:Animal,h:Habitat,slot:number,allowSeek=true):{handled:boolean;ate:string|null}{
 const r=reachableFood(s.world,h),m=a.motion,port=foodPort(h,slot),foodPhase=m.phase==='seek-food'||m.phase==='eat';
 if(m.phase==='leave-food'){const p=a.position!,z=feederAnchor(h).z+.25;if(p.z<=z){cancelFood(a);return {handled:true,ate:null};}p.z=Math.max(z,p.z-FOOD_RULES.groundSpeed);if(p.z===z||--m.ticksLeft<=0)cancelFood(a);return {handled:true,ate:null};}
 if(!foodPhase&&r&&a.position!.z>feederAnchor(h).z+.30&&Math.abs(Math.atan2(Math.sin(m.heading),Math.cos(m.heading)))<.10){leaveFood(a,h,slot);return {handled:true,ate:null};}
 if(foodPhase&&(!r||r.stock<=0||!r.portions||r.portions[slot]<=0||a.targetResourceId!==r.id)){if(r&&a.position!.z>feederAnchor(h).z+.25)leaveFood(a,h,slot);else cancelFood(a);return {handled:true,ate:null};}
 if(!foodPhase){if(!allowSeek||!r||r.stock<=0||!r.portions||r.portions[slot]<=0||a.hunger<FOOD_RULES.seekAt)return {handled:false,ate:null};if(['ascend','descend','perch'].includes(m.phase)){if(m.phase==='perch')m.ticksLeft=Math.min(m.ticksLeft,1);return {handled:false,ate:null};}m.phase='seek-food';m.ticksLeft=FOOD_RULES.seekTimeout;a.currentBehavior='seek-food';a.target={...port};a.targetResourceId=r.id;}
 if(m.phase==='seek-food'){
  const p=a.position!,dx=port.x-p.x,dz=port.z-p.z,d=Math.hypot(dx,dz),desired=d>.001?Math.atan2(dx,dz):0;
  const turn=Math.atan2(Math.sin(desired-m.heading),Math.cos(desired-m.heading));m.heading+=Math.max(-.24,Math.min(.24,turn));
  if(d>.001&&Math.abs(turn)<.25){const step=Math.min(FOOD_RULES.groundSpeed,d);p.x+=dx/d*step;p.z+=dz/d*step;}
  if(d<=.035&&Math.abs(Math.atan2(Math.sin(m.heading),Math.cos(m.heading)))<.25){a.position={...port};m.heading=0;m.phase='eat';m.ticksLeft=FOOD_RULES.eatTicks;a.currentBehavior='eat';}
  else if(--m.ticksLeft<=0)cancelFood(a);
  return {handled:true,ate:null};
 }
 if(--m.ticksLeft<=0){const id=r!.id;r!.stock--;r!.portions![slot]--;a.hunger=Math.max(0,a.hunger-FOOD_RULES.reliefPerPortion);a.foodEaten++;leaveFood(a,h,slot);return {handled:true,ate:id};}
 return {handled:true,ate:null};
}
export type FoodAction='place'|'refill'|'remove';
export type FoodCommand='preview'|'confirm'|'cancel'|'refill'|'remove';
export type FoodReason='missing'|'exists'|'stale'|'full'|'invalid'|'busy'|null;
export function foodTransaction(s:ZooSaveV1,action:FoodAction,revision:number,generation=0):FoodReason|'ok'{
 const h=s.world.habitats[0];if(!h||h.cells.length!==4)return 'missing';const anchor0=feederAnchor(h);if(![0,1].every(dx=>[0,1].every(dz=>h.cells.some(c=>c.x===anchor0.x+dx&&c.z===anchor0.z-1+dz))))return 'invalid';const resources=s.world.resources.filter(r=>r.habitatId===h.id),r=resources.find(r=>r.kind==='food');
 if(action==='place'){if(resources.some(r=>r.kind!=='water'))return 'exists';if(!feederClear(s,h))return 'busy';const anchor=feederAnchor(h);if(!s.world.tiles.some(t=>t.cell.x===anchor.x&&t.cell.z===anchor.z&&t.occupantId===h.id))return 'invalid';s.world.resources.push({id:`feeder-${anchor.x}-${anchor.z}`,kind:'food',habitatId:h.id,cell:anchor,stock:0,capacity:FOOD_RULES.capacity,revision:generation,portions:[0,0]});return 'ok';}
 if(!r)return 'missing';if(revision!==r.revision)return 'stale';
 if(action==='refill'){if(r.stock>=r.capacity)return 'full';r.stock=r.capacity;r.portions=[Math.ceil(r.capacity/2),Math.floor(r.capacity/2)];r.revision++;return 'ok';}
 if(action==='remove'){s.world.resources=s.world.resources.filter(p=>p.id!==r.id);for(const a of s.animals)if(a.targetResourceId===r.id)cancelFood(a);return 'ok';}return 'invalid';
}
export interface FoodView {canPlace:boolean;habitat:boolean;exists:boolean;reachable:boolean;stock:number;capacity:number;revision:number;portions:[number,number];preview:boolean;reason:FoodReason;}
export function foodView(s:ZooSaveV1):FoodView{const h=s.world.habitats[0],r=h?s.world.resources.find(r=>r.kind==='food'&&r.habitatId===h.id):undefined;return {canPlace:Boolean(h&&feederClear(s,h)),habitat:Boolean(h),exists:Boolean(r),reachable:Boolean(h&&reachableFood(s.world,h)),stock:r?.stock??0,capacity:r?.capacity??FOOD_RULES.capacity,revision:r?.revision??0,portions:r?.portions?[...r.portions]:[0,0],preview:false,reason:null};}
