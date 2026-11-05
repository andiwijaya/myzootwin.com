import {visitTargetForState} from './graph.ts';
import {attractionView,type AttractionView} from './attraction.ts';
import {ledgerProof,admissionProofs} from '../economy/journal.ts';
import {ticketView,ticketLimit,type TicketView} from '../economy/tickets.ts';
import {newExperience,finishFeedback,interruptedFeedback} from './satisfaction.ts';
import type {VisitorFeedback,VisitorFeedbackSummary} from '../core/state.ts';
import {MAX_TICK,type Point,type Visitor,type RuntimeState} from '../core/state.ts';
import {stepJourneys,ownsCorridor} from './navigation.ts';
import {analyzePaths} from '../world/paths.ts';

/** Bounded entrance queue and deterministic excursions; per-visit satisfaction and actual eligible gate admission. */
export const ARRIVAL_RULES=Object.freeze({capacity:3,intervalTicks:30,lifetimeTicks:120,approachTicks:20,leaveAt:80,radius:.09});
export interface ArrivalView {open:boolean;active:number;capacity:number;ready:boolean;total:number;reason:'closed'|'departing'|'path'|'habitat'|'limit'|'ready';ids:string[];people:Array<{id:string;phase:Visitor['phase'];feedback:VisitorFeedback|null;entry:'pending'|'paid'|'free';ticketAmount:number|null}>;queued:number;walking:number;viewing:number;returning:number;viewedTotal:number;feedback:VisitorFeedbackSummary;tickets:TicketView;attraction:AttractionView;}
export function entranceReady(s:RuntimeState):boolean {
 const w=s.world,g=w.gate,t=w.tiles.find(t=>t.cell.x===g.x&&t.cell.z===g.z);
 return Boolean(t?.path&&t.terrain==='land'&&t.occupantId===null&&analyzePaths(w).reachable.length>1);
}
export function arrivalPosition(gate:Point,slot:number,age:number):Point {
 const t=Math.min(ARRIVAL_RULES.lifetimeTicks,Math.max(0,age));
 const z=t<20?.88-.30*t/20:t<80?.58:.58+.30*(t-80)/40;
 return {x:gate.x+.19+slot*.31,z:gate.z+z};
}
export function arrivalAge(v:Visitor,tick:number):number{return v.arrival?tick-v.arrival.spawnTick:0;}
export function stepArrivals(s:RuntimeState):Array<{visitorId:string;habitatId:string}> {
 const target=visitTargetForState(s);
 for(const v of s.visitors)if(v.phase==='arrival'&&v.arrival&&!v.experience?.feedback&&target&&s.visitorFlow.open&&arrivalAge(v,s.tick)>=20&&arrivalAge(v,s.tick)<80){v.phase='queued';v.position=arrivalPosition(s.world.gate,v.arrival.slot,20);v.journey={habitatId:null,heading:Math.PI,dwellTicks:0,queuedTicks:0,viewed:false,startedTick:null};}
 const viewed=stepJourneys(s);
 for(const v of s.visitors)if(v.phase==='arrival'&&v.arrival&&!v.experience?.feedback){if(!s.visitorFlow.open)interruptedFeedback(s,v,'closed');else if(arrivalAge(v,s.tick)>=ARRIVAL_RULES.leaveAt){if(target)interruptedFeedback(s,v,'time-limit');else finishFeedback(s,v,s.world.habitats.length?'unreachable':'no-habitat');}}
 s.visitors=s.visitors.filter(v=>v.phase!=='arrival'||arrivalAge(v,s.tick)<ARRIVAL_RULES.lifetimeTicks);
 for(const v of s.visitors)if(v.phase==='arrival'&&v.arrival)v.position=arrivalPosition(s.world.gate,v.arrival.slot,arrivalAge(v,s.tick));
 const f=s.visitorFlow;
 const attraction=attractionView(s);
 if(!attraction.ready||f.nextSerial>=MAX_TICK||ticketLimit(s)!==null){f.cooldownTicks=0;return viewed;}
 f.cooldownTicks=Math.min(f.cooldownTicks,attraction.intervalTicks);
 if(f.cooldownTicks>0)f.cooldownTicks--;
 if(f.cooldownTicks>0||s.visitors.length>=ARRIVAL_RULES.capacity)return viewed;
 if(target&&s.visitors.some(v=>ownsCorridor(v)&&v.position.z>s.world.gate.z-.16))return viewed;
 const used=new Set(s.visitors.flatMap(v=>v.arrival&&!ownsCorridor(v)?[v.arrival.slot]:[]));
 const slots=target?(s.visitors.some(ownsCorridor)?[0,2]:[1,0,2]):[0,1,2];
 const slot=slots.find(i=>!used.has(i));if(slot===undefined)return viewed;
 const serial=f.nextSerial++;
 s.visitors.push({id:`arrival-${serial}`,phase:'arrival',position:arrivalPosition(s.world.gate,slot,0),route:[{...s.world.gate}],routeIndex:0,satisfaction:null,experience:newExperience(),entry:{status:'pending',tick:null,reason:'none'},admissionId:null,arrival:{serial,slot,spawnTick:s.tick},journey:null});
 f.cooldownTicks=attraction.intervalTicks;return viewed;
}
export function arrivalsView(s:RuntimeState):ArrivalView {
 const ready=entranceReady(s),f=s.visitorFlow;
 return {open:f.open,active:s.visitors.length,capacity:ARRIVAL_RULES.capacity,ready,total:f.nextSerial-1,reason:!f.open?s.visitors.length?'departing':'closed':!ready?'path':!visitTargetForState(s)?'habitat':f.nextSerial>=MAX_TICK?'limit':'ready',ids:s.visitors.map(v=>v.id),people:s.visitors.map(v=>({id:v.id,phase:v.phase,feedback:structuredClone(v.experience?.feedback??null),entry:v.entry?.status??'paid',ticketAmount:v.admissionId?(()=>{const a=admissionProofs(s).find(a=>a.id===v.admissionId);return a?ledgerProof(s,a.ledgerEntryId)?.amount??null:null;})():null})),queued:s.visitors.filter(v=>v.phase==='queued').length,walking:s.visitors.filter(v=>v.phase==='entering').length,viewing:s.visitors.filter(v=>v.phase==='viewing').length,returning:s.visitors.filter(v=>v.phase==='leaving'||v.phase==='exiting').length,viewedTotal:f.viewedTotal,feedback:structuredClone(f.feedback),tickets:ticketView(s),attraction:attractionView(s)};
}
