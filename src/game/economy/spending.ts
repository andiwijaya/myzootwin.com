import {refundable} from './refunds.ts';
import {PRICES,MONEY_RULES} from './prices.ts';
export {PRICES,MONEY_RULES} from './prices.ts';
import type {LedgerEntry,ZooSaveV1} from '../core/state.ts';
export type MoneyReason='funds'|'capacity';
export function moneyReason(s:ZooSaveV1,amount:number,correction=false):MoneyReason|null {
 if(s.ledger.length>=(correction?MONEY_RULES.historyLimit:MONEY_RULES.normalLimit))return 'capacity';
 return !Number.isSafeInteger(amount)||amount<0||s.currency<amount?'funds':null;
}
/** Mutates a caller-owned transaction clone only; the simulation validates and publishes the complete operation. */
export function debit(s:ZooSaveV1,amount:number,kind:'build'|'supplies'|'maintenance',operationId:string,relatedId:string|null):MoneyReason|'duplicate'|null{
 const old=s.ledger.find(e=>e.operationId===operationId);if(old)return old.kind===kind&&old.amount===-amount&&old.relatedId===relatedId?'duplicate':'capacity';
 const reason=moneyReason(s,amount);if(reason)return reason;
 if(!Number.isSafeInteger(amount)||amount<=0||!/^[a-z][a-z0-9-]{0,47}$/.test(operationId))return 'funds';
 const entry:LedgerEntry={id:operationId,operationId,kind,amount:-amount,balanceAfter:s.currency-amount,tick:s.tick,relatedId};
 s.currency=entry.balanceAfter;s.ledger.push(entry);return null;
}
export function maintenanceDue(s:ZooSaveV1){return Math.max(0,Math.floor(s.tick/MONEY_RULES.maintenanceTicks)-s.economy.maintenancePeriod)*s.world.habitats.length*PRICES.maintenance;}
export function settleMaintenance(s:ZooSaveV1):boolean{
 const period=Math.floor(s.tick/MONEY_RULES.maintenanceTicks);if(period<=s.economy.maintenancePeriod)return false;
 const amount=maintenanceDue(s);if(amount&&debit(s,amount,'maintenance',`maintenance-${period}`,null)!==null)return false;
 s.economy.maintenancePeriod=period;return true;
}
export function economyView(s:ZooSaveV1){const due=maintenanceDue(s);return{resourceRefunds:Object.fromEntries((['food','water','perch']as const).map(kind=>{const r=s.world.resources.find(r=>r.kind===kind);return[kind,r?refundable(s,r.id).reduce((n,e)=>n+e.amount,0):0];}))as Record<'food'|'water'|'perch',number>,grants:s.ledger.filter(e=>e.kind==='starter'||e.kind==='reward').reduce((n,e)=>n+e.amount,0),balance:s.currency,prices:PRICES,remaining:Math.max(0,MONEY_RULES.normalLimit-s.ledger.length),correctionRemaining:Math.max(0,MONEY_RULES.historyLimit-s.ledger.length),warning:s.ledger.length>=MONEY_RULES.warningAt,blocked:s.ledger.length>=MONEY_RULES.normalLimit,maintenanceDue:due,maintenanceReason:due?moneyReason(s,due):null,maintenancePeriod:s.economy.maintenancePeriod,spent:s.ledger.filter(e=>['build','supplies','maintenance','restore'].includes(e.kind)).reduce((n,e)=>n-e.amount,0),refunds:s.ledger.filter(e=>e.kind==='refund').reduce((n,e)=>n+e.amount,0)};}
export type EconomyView=ReturnType<typeof economyView>;
