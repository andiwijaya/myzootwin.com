import type {Animal,Habitat,ZooSaveV1,WorldState,Point} from '../core/state.ts';
import {cancelFood,type FoodAction,type FoodReason,type FoodView} from './feeding.ts';
/** Tunable game balance per 100ms tick, not real animal husbandry advice. */
export const WATER_RULES=Object.freeze({capacity:8,startingThirst:45,thirstPerTick:.15,seekAt:35,reliefPerPortion:35,drinkTicks:20,seekTimeout:120,groundSpeed:.035});
export const waterAnchor=(h:Habitat)=>({x:Math.min(...h.cells.map(c=>c.x))+1,z:Math.min(...h.cells.map(c=>c.z))});
export const waterPort=(h:Habitat,slot:number)=>({x:waterAnchor(h).x-1+(slot===0?.55:1.45),z:waterAnchor(h).z+.85});
export const waterHeading=(slot:number)=>slot===0?-Math.PI/2:Math.PI/2;
const home=(h:Habitat,slot:number)=>({x:waterAnchor(h).x-.5+slot,z:waterAnchor(h).z+1.25});
export const WATER_PHASES=['seek-water','drink','water-back','water-hop','leave-water','water-home','water-abort'] as const;
export const isWaterPhase=(a:Animal)=> (WATER_PHASES as readonly string[]).includes(a.motion.phase);
export function reachableWater(w:WorldState,h:Habitat){const p=waterAnchor(h);return w.resources.find(r=>r.kind==='water'&&r.habitatId===h.id&&r.cell.x===p.x&&r.cell.z===p.z);}
export function waterClear(s:ZooSaveV1,h:Habitat){return s.animals.every(a=>a.habitatId!==h.id||!a.position||a.motion.elevation>0||a.position.z>=home(h,0).z-.00001);}
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function turn(a:Animal,to:number){a.motion.heading+=Math.max(-.24,Math.min(.24,angle(a.motion.heading,to)));a.motion.heading=Math.atan2(Math.sin(a.motion.heading),Math.cos(a.motion.heading));return Math.abs(angle(a.motion.heading,to))<.25;}
function move(a:Animal,to:Point,speed:number=WATER_RULES.groundSpeed){const p=a.position!,dx=to.x-p.x,dz=to.z-p.z,d=Math.hypot(dx,dz);if(d<=speed){a.position={...to};return true;}p.x+=dx/d*speed;p.z+=dz/d*speed;return false;}
function set(a:Animal,phase:Animal['motion']['phase'],target:Point,ticks=120){a.motion.phase=phase;a.motion.ticksLeft=ticks;a.target={...target};a.currentBehavior=phase==='seek-water'||phase==='drink'?phase:'wander';}
/** Back away, then side-hop clear of the roost before turning. The simulation owns the hop. */
function depart(a:Animal,h:Habitat,slot:number){a.targetResourceId=null;const p=waterPort(h,slot);set(a,'water-back',{x:p.x+(slot===0?.04:-.04),z:p.z},2);}
export function cancelWater(a:Animal,h:Habitat,slot:number){a.targetResourceId=null;if(a.motion.phase==='drink')depart(a,h,slot);else if(a.motion.phase==='seek-water')set(a,'water-abort',home(h,slot));}
export function stepWater(s:ZooSaveV1,a:Animal,h:Habitat,slot:number,allowSeek=true):{handled:boolean;drank:string|null}{
 const m=a.motion,p=a.position!,r=reachableWater(s.world,h),port=waterPort(h,slot),ground=home(h,slot);
 if(m.phase==='water-back'){move(a,a.target!,.02);if(--m.ticksLeft===0)set(a,'water-hop',{x:a.position!.x,z:ground.z-.15},8);return {handled:true,drank:null};}
 if(m.phase==='water-hop'){move(a,a.target!,.03125);const t=(9-m.ticksLeft)/8;m.elevation=Math.max(0,.04*Math.sin(Math.PI*t));if(--m.ticksLeft===0){m.elevation=0;set(a,'leave-water',{x:a.position!.x,z:ground.z});}return {handled:true,drank:null};}
 if(m.phase==='leave-water'||m.phase==='water-home'){const target=a.target!,dx=target.x-p.x,dz=target.z-p.z,heading=Math.hypot(dx,dz)>.001?Math.atan2(dx,dz):m.heading;if(turn(a,heading)&&move(a,target)){if(m.phase==='leave-water')set(a,'water-home',ground);else cancelFood(a);}else if(--m.ticksLeft<=0){set(a,'water-abort',ground);}return {handled:true,drank:null};}
 if(m.phase==='water-abort'){if(move(a,ground)){m.elevation=0;cancelFood(a);}return {handled:true,drank:null};}
 const active=m.phase==='seek-water'||m.phase==='drink';
 if(active&&(!r||!r.portions||r.portions[slot]<=0||a.targetResourceId!==r.id)){cancelWater(a,h,slot);return {handled:true,drank:null};}
 if(!active){if(!allowSeek||!r||!r.portions||r.portions[slot]<=0||a.thirst<WATER_RULES.seekAt)return {handled:false,drank:null};if(['ascend','descend','perch'].includes(m.phase)){if(m.phase==='perch')m.ticksLeft=Math.min(m.ticksLeft,1);return {handled:false,drank:null};}set(a,'seek-water',port);a.targetResourceId=r.id;}
 if(m.phase==='seek-water'){const dx=port.x-p.x,dz=port.z-p.z,d=Math.hypot(dx,dz);if(d>.001){if(turn(a,Math.atan2(dx,dz)))move(a,port);}else if(turn(a,waterHeading(slot))){a.position={...port};m.heading=waterHeading(slot);set(a,'drink',port,WATER_RULES.drinkTicks);}if(m.phase==='seek-water'&&--m.ticksLeft<=0)cancelWater(a,h,slot);return {handled:true,drank:null};}
 if(--m.ticksLeft===0){r!.stock--;r!.portions![slot]--;a.thirst=Math.max(0,a.thirst-WATER_RULES.reliefPerPortion);a.waterDrunk++;const id=r!.id;depart(a,h,slot);return {handled:true,drank:id};}return {handled:true,drank:null};
}
export function waterTransaction(s:ZooSaveV1,action:FoodAction,revision:number,generation=0):FoodReason|'ok'{
 const h=s.world.habitats[0];if(!h||h.cells.length!==4)return 'missing';const p=waterAnchor(h);if(![0,1].every(dx=>[0,1].every(dz=>h.cells.some(c=>c.x===p.x-1+dx&&c.z===p.z+dz))))return 'invalid';
 const resources=s.world.resources.filter(r=>r.habitatId===h.id),r=resources.find(r=>r.kind==='water');
 if(action==='place'){if(resources.some(r=>r.kind==='water'))return 'exists';if(!waterClear(s,h))return 'busy';if(!s.world.tiles.some(t=>t.occupantId===h.id&&t.cell.x===p.x&&t.cell.z===p.z))return 'invalid';s.world.resources.push({id:`water-${p.x}-${p.z}`,kind:'water',habitatId:h.id,cell:p,stock:0,capacity:WATER_RULES.capacity,revision:generation,portions:[0,0]});return 'ok';}
 if(!r)return 'missing';if(revision!==r.revision)return 'stale';if(action==='refill'){if(r.stock>=r.capacity)return 'full';r.stock=r.capacity;r.portions=[Math.ceil(r.capacity/2),Math.floor(r.capacity/2)];r.revision++;return 'ok';}
 if(action==='remove'){s.world.resources=s.world.resources.filter(p=>p.id!==r.id);for(const [slot,a]of [...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).entries())if(a.targetResourceId===r.id)cancelWater(a,h,slot);return 'ok';}return 'invalid';
}
export function waterView(s:ZooSaveV1):FoodView{const h=s.world.habitats[0],r=h?s.world.resources.find(r=>r.kind==='water'&&r.habitatId===h.id):undefined;return {canPlace:Boolean(h&&waterClear(s,h)),habitat:Boolean(h),exists:Boolean(r),reachable:Boolean(h&&reachableWater(s.world,h)),stock:r?.stock??0,capacity:r?.capacity??WATER_RULES.capacity,revision:r?.revision??0,portions:r?.portions?[...r.portions]:[0,0],preview:false,reason:null};}
