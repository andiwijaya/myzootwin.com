import {visitTargetForState} from '../visitors/graph.ts';
import {coherentMoney,admissionProofs,ledgerProof,totals} from './journal.ts';
import type {Admission,LedgerEntry,Point,Visitor,RuntimeState} from '../core/state.ts';
import {VISITOR_STEP,visitorRoute,visitorPaths} from '../visitors/graph.ts';

/** Fictional Zoo Coins only. Starting price, not final economy balancing. */
export const TICKET_RULES=Object.freeze({price:10});
const key=(p:Point)=>`${p.x},${p.z}`,cell=(p:Point)=>({x:Math.floor(p.x),z:Math.floor(p.z)});
export function ticketLimit(s:RuntimeState):'balance'|null{return !Number.isSafeInteger(s.currency+TICKET_RULES.price)?'balance':null;}
/** Internal simulation transaction. A committed receipt is never repaired/recredited from a partial restore. */
export function admitTicket(s:RuntimeState,v:Visitor,from:Point,next:Point):{ok:true;duplicate:boolean;paid:boolean}|{ok:false;reason:'ineligible'|'inconsistent'|'capacity'|'balance'}{
 if(!v.arrival||!v.entry||v.id!==`arrival-${v.arrival.serial}`||v.arrival.serial>=s.visitorFlow.nextSerial||v.arrival.spawnTick>s.tick||s.visitors.find(p=>p.id===v.id)!==v||!coherentMoney(s))return {ok:false,reason:'inconsistent'};
 if(v.arrival.serial<=s.economy.checkpoint.visitorThrough&&!s.economy.checkpoint.openSerials.includes(v.arrival.serial))return {ok:false,reason:'inconsistent'};
 const old=admissionProofs(s).find(a=>a.visitorId===v.id);
 if(v.entry.status==='paid'){
  const e=old?ledgerProof(s,old.ledgerEntryId):null;
  return old&&old.id===v.admissionId&&old.entry!==null&&e?.kind==='ticket'&&e.relatedId===old.id&&e.amount===old.entry.price&&e.tick===old.tick&&v.entry.tick===old.tick?{ok:true,duplicate:true,paid:true}:{ok:false,reason:'inconsistent'};
 }
 if(old||v.admissionId!==null||(v.entry.status==='pending'&&v.entry.tick!==null))return {ok:false,reason:'inconsistent'};
 if(v.entry.status==='free')return {ok:true,duplicate:true,paid:false};
 const w=s.world,g=w.gate,at=cell(from),to=cell(next),j=v.journey,h=w.habitats.find(h=>h.id===j?.habitatId),last=v.route.at(-1);
 if(!s.visitorFlow.open||v.phase!=='entering'||!j||j.startedTick===null||!v.experience||v.experience.feedback||!h||!last||v.routeIndex!==1||key(v.route[0])!==key(g)||key(v.route[1])!==key(to)||key(at)!==key(g)||key(to)===key(g)||to.x!==g.x||Math.abs(to.z-g.z)!==1||!visitorPaths(w).has(key(to))||!visitorRoute(w,g,last).length||!h.cells.some(p=>Math.abs(p.x-last.x)+Math.abs(p.z-last.z)===1)||Math.hypot(next.x-from.x,next.z-from.z)>VISITOR_STEP+1e-8||Math.abs(v.position.x-from.x)>1e-8||Math.abs(v.position.z-from.z)>1e-8)return {ok:false,reason:'ineligible'};
 if(!s.animals.some(a=>a.habitatId===h.id&&a.position!==null)){v.entry={status:'free',tick:s.tick,reason:'no-animals'};v.position={...next};return {ok:true,duplicate:false,paid:false};}
 const limit=ticketLimit(s);if(limit)return {ok:false,reason:limit};
 const serial=v.arrival.serial,admissionId=`admission-arrival-${serial}`,ledgerId=`ticket-arrival-${serial}`,operationId=`admit-arrival-${serial}`;
 if(s.admissions.some(a=>a.id===admissionId)||s.ledger.some(e=>e.id===ledgerId||e.operationId===operationId))return {ok:false,reason:'inconsistent'};
 const balance=s.currency+TICKET_RULES.price;
 const receipt:Admission={id:admissionId,visitorId:v.id,tick:s.tick,ledgerEntryId:ledgerId,entry:{habitatId:h.id,gate:{...g},cell:to,price:TICKET_RULES.price}};
 const entry:LedgerEntry={id:ledgerId,operationId,kind:'ticket',amount:TICKET_RULES.price,balanceAfter:balance,tick:s.tick,relatedId:admissionId};
 // All validation/preparation precedes these synchronous assignments. No callbacks/frames interleave.
 s.currency=balance;s.ledger=[...s.ledger,entry];s.admissions=[...s.admissions,receipt];v.admissionId=admissionId;v.entry={status:'paid',tick:s.tick,reason:'none'};v.position={...next};
 return {ok:true,duplicate:false,paid:true};
}
export interface TicketView {balance:number;price:number;admissions:number;revenue:number;reason:'closed'|'habitat'|'animals'|'capacity'|'balance'|'ready';last:{visitorId:string;amount:number;tick:number}|null;}
export function ticketView(s:RuntimeState):TicketView{
 const target=visitTargetForState(s),last=s.admissions.at(-1)??s.economy.checkpoint.lastTicket?.admission,e=last?(ledgerProof(s,last.ledgerEntryId)??s.economy.checkpoint.lastTicket?.entry):null,t=totals(s);
 return {balance:s.currency,price:TICKET_RULES.price,admissions:t.counts.ticket,revenue:t.amounts.ticket,reason:ticketLimit(s)??(!s.visitorFlow.open?'closed':!target?'habitat':!s.animals.some(a=>a.habitatId===target.habitatId&&a.position!==null)?'animals':'ready'),last:last&&e?{visitorId:last.visitorId,amount:e.amount,tick:last.tick}:null};
}
