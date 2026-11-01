import {MAX_TICK,type Point,type Visitor,type ZooSaveV1} from '../core/state.ts';
import {analyzePaths} from '../world/paths.ts';

/** Entrance preview only. No habitat navigation, satisfaction calculation or paid admission. */
export const ARRIVAL_RULES=Object.freeze({capacity:3,intervalTicks:30,lifetimeTicks:120,approachTicks:20,leaveAt:80,radius:.09});
export interface ArrivalView {open:boolean;active:number;capacity:number;ready:boolean;total:number;reason:'closed'|'departing'|'path'|'limit'|'ready';ids:string[];}
export function entranceReady(s:ZooSaveV1):boolean {
 const w=s.world,g=w.gate,t=w.tiles.find(t=>t.cell.x===g.x&&t.cell.z===g.z);
 return Boolean(t?.path&&t.terrain==='land'&&t.occupantId===null&&analyzePaths(w).reachable.length>1);
}
export function arrivalPosition(gate:Point,slot:number,age:number):Point {
 const t=Math.min(ARRIVAL_RULES.lifetimeTicks,Math.max(0,age));
 const z=t<20?.88-.30*t/20:t<80?.58:.58+.30*(t-80)/40;
 return {x:gate.x+.22+slot*.28,z:gate.z+z};
}
export function arrivalAge(v:Visitor,tick:number):number{return v.arrival?tick-v.arrival.spawnTick:0;}
export function stepArrivals(s:ZooSaveV1):void {
 s.visitors=s.visitors.filter(v=>v.phase!=='arrival'||arrivalAge(v,s.tick)<ARRIVAL_RULES.lifetimeTicks);
 for(const v of s.visitors)if(v.phase==='arrival'&&v.arrival)v.position=arrivalPosition(s.world.gate,v.arrival.slot,arrivalAge(v,s.tick));
 const f=s.visitorFlow;
 if(!f.open||!entranceReady(s)||f.nextSerial>=MAX_TICK){f.cooldownTicks=0;return;}
 if(f.cooldownTicks>0)f.cooldownTicks--;
 if(f.cooldownTicks>0||s.visitors.length>=ARRIVAL_RULES.capacity)return;
 const used=new Set(s.visitors.flatMap(v=>v.arrival?[v.arrival.slot]:[]));
 const slot=[0,1,2].find(i=>!used.has(i));if(slot===undefined)return;
 const serial=f.nextSerial++;
 s.visitors.push({id:`arrival-${serial}`,phase:'arrival',position:arrivalPosition(s.world.gate,slot,0),route:[{...s.world.gate}],routeIndex:0,satisfaction:null,admissionId:null,arrival:{serial,slot,spawnTick:s.tick}});
 f.cooldownTicks=ARRIVAL_RULES.intervalTicks;
}
export function arrivalsView(s:ZooSaveV1):ArrivalView {
 const ready=entranceReady(s),f=s.visitorFlow;
 return {open:f.open,active:s.visitors.length,capacity:ARRIVAL_RULES.capacity,ready,total:f.nextSerial-1,reason:!f.open?s.visitors.length?'departing':'closed':!ready?'path':f.nextSerial>=MAX_TICK?'limit':'ready',ids:s.visitors.map(v=>v.id)};
}
