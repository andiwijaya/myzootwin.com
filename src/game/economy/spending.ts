import {totals,ledgerProof} from './journal.ts';
import {refundable} from './refunds.ts';
import {PRICES,MONEY_RULES} from './prices.ts';
export {PRICES,MONEY_RULES} from './prices.ts';
import type {LedgerEntry,RuntimeState} from '../core/state.ts';
export type MoneyReason='funds'|'capacity';
export function moneyReason(s:RuntimeState,amount:number):MoneyReason|null {
 return !Number.isSafeInteger(amount)||amount<0||s.currency<amount?'funds':null;
}
/** Mutates a caller-owned transaction clone only; the simulation validates and publishes the complete operation. */
export function debit(s:RuntimeState,amount:number,kind:'build'|'supplies'|'maintenance',operationId:string,relatedId:string|null):MoneyReason|'duplicate'|null{
 if(kind!=='maintenance')operationId=`cmd-${s.economy.nextCommand}`;
 const old=s.ledger.find(e=>e.operationId===operationId);if(old)return old.kind===kind&&old.amount===-amount&&old.relatedId===relatedId?'duplicate':'capacity';
 const reason=moneyReason(s,amount);if(reason)return reason;
 if(!Number.isSafeInteger(amount)||amount<=0||!/^[a-z][a-z0-9-]{0,47}$/.test(operationId))return 'funds';
 const entry:LedgerEntry={id:operationId,operationId,kind,amount:-amount,balanceAfter:s.currency-amount,tick:s.tick,relatedId};
 s.currency=entry.balanceAfter;s.ledger.push(entry);return null;
}
export function maintenanceDue(s:RuntimeState){return Math.max(0,Math.floor(s.tick/MONEY_RULES.maintenanceTicks)-s.economy.maintenancePeriod)*s.world.habitats.length*PRICES.maintenance;}
export function settleMaintenance(s:RuntimeState):boolean{
 const period=Math.floor(s.tick/MONEY_RULES.maintenanceTicks);if(period<=s.economy.maintenancePeriod)return false;
 const amount=maintenanceDue(s);if(amount&&debit(s,amount,'maintenance',`maintenance-${period}`,null)!==null)return false;
 s.economy.maintenancePeriod=period;return true;
}
export function economyView(s:RuntimeState){const due=maintenanceDue(s),t=totals(s),a=t.amounts,conservationGrant=s.elephantGrove?.grant?ledgerProof(s,s.elephantGrove.grant.ledgerEntryId)?.amount??0:0,savannaGrant=s.lionSavanna?.grant?ledgerProof(s,s.lionSavanna.grant.ledgerEntryId)?.amount??0:0,giraffeGrant=s.giraffePlains?.grant?ledgerProof(s,s.giraffePlains.grant.ledgerEntryId)?.amount??0:0,zebraGrant=s.zebraGrasslands?.grant?ledgerProof(s,s.zebraGrasslands.grant.ledgerEntryId)?.amount??0:0;return{...(s.elephantGrove?.grant?{conservationGrant,missionRewards:a.reward-conservationGrant-savannaGrant-giraffeGrant-zebraGrant}:{}),...(s.lionSavanna?.grant?{savannaGrant,missionRewards:a.reward-conservationGrant-savannaGrant-giraffeGrant-zebraGrant}:{}),...(s.giraffePlains?.grant?{giraffeGrant,missionRewards:a.reward-conservationGrant-savannaGrant-giraffeGrant-zebraGrant}:{}),...(s.zebraGrasslands?.grant?{zebraGrant,missionRewards:a.reward-conservationGrant-savannaGrant-giraffeGrant-zebraGrant}:{}),resourceRefunds:Object.fromEntries((['food','water','perch']as const).map(kind=>{const r=s.world.resources.find(r=>r.kind===kind);return[kind,r?refundable(s,r.id).reduce((n,e)=>n+e.amount,0):0];}))as Record<'food'|'water'|'perch',number>,grants:a.starter+a.reward,balance:s.currency,prices:PRICES,journalRetained:s.ledger.length,journalCompactions:s.economy.checkpoint.compactions,transactions:t.entries,maintenanceDue:due,maintenanceReason:due?moneyReason(s,due):null,maintenancePeriod:s.economy.maintenancePeriod,spent:-a.build-a.supplies-a.maintenance-a.restore,refunds:a.refund,construction:0-a.build,supplies:0-a.supplies,upkeep:0-a.maintenance,undo:0-a.restore,ticketIncome:a.ticket,rewards:a.reward,net:a.ticket+a.reward+a.refund+a.build+a.supplies+a.maintenance+a.restore,operatingNet:a.ticket+a.supplies+a.maintenance};}
export type EconomyView=ReturnType<typeof economyView>;
