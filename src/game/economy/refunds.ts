import {purchaseBook} from './journal.ts';
import type {FinanceCheckpoint,LedgerEntry,ZooSaveV1} from '../core/state.ts';
/** Refunds are traceable to real build debits. Undo repays that exact refund. */
export function validRefunds(ledger:LedgerEntry[],base?:Pick<FinanceCheckpoint,'purchases'|'refunds'>):boolean {return purchaseBook(ledger,base)!==null;}
export function refundable(state:ZooSaveV1,targetId:string){const book=purchaseBook(state.ledger,state.economy.checkpoint);return book?[...book.purchases.values()].filter(p=>p.entry.relatedId===targetId&&-p.entry.amount>p.refunded).map(p=>({paidId:p.entry.id,amount:-p.entry.amount-p.refunded})):[];}
export function editLedger(state:ZooSaveV1,operationId:string,items:Array<{kind:'refund'|'restore';relatedId:string;amount:number}>){
  if(!/^(edit-[a-f0-9]{32}|care-remove-(food|water|perch)-[0-9]+)$/.test(operationId))return null;
  let balance=state.currency;
  const entries:LedgerEntry[]=[];
  for(const [index,item]of items.entries()){
    balance+=item.amount;const id=`cmd-${state.economy.nextCommand}-${index}`;
    if(!Number.isSafeInteger(balance)||balance<0||state.ledger.some(e=>e.id===id||e.operationId===id))return null;
    entries.push({id,operationId:id,...item,balanceAfter:balance,tick:state.tick});
  }
  const ledger=[...state.ledger,...entries];
  return validRefunds(ledger,state.economy.checkpoint)?{currency:balance,ledger,entries}:null;
}
