import type {LedgerEntry,ZooSaveV1} from '../core/state.ts';
/** Refunds are traceable to real build debits. Undo repays that exact refund. */
export function validRefunds(ledger:LedgerEntry[]):boolean {
  const seen=new Map<string,LedgerEntry>(),refunded=new Map<string,number>(),restored=new Map<string,number>();
  for(const e of ledger){
    if(e.kind==='refund'){
      const paid=e.relatedId?seen.get(e.relatedId):undefined;
      if(!paid||paid.kind!=='build'||paid.amount>=0)return false;
      const total=(refunded.get(paid.id)??0)+e.amount;
      if(total<0||total>-paid.amount)return false;
      refunded.set(paid.id,total);
    }else if(e.kind==='restore'){
      const refund=e.relatedId?seen.get(e.relatedId):undefined;
      if(!refund||refund.kind!=='refund'||!refund.relatedId||e.amount>=0)return false;
      const total=(restored.get(refund.id)??0)-e.amount;
      if(total>refund.amount)return false;
      restored.set(refund.id,total);refunded.set(refund.relatedId,(refunded.get(refund.relatedId)??0)+e.amount);
    }
    seen.set(e.id,e);
  }
  return true;
}
export function refundable(state:ZooSaveV1,targetId:string){
  return state.ledger.filter(e=>e.kind==='build'&&e.relatedId===targetId).map(paid=>{
    const refunds=state.ledger.filter(e=>e.kind==='refund'&&e.relatedId===paid.id);
    const active=refunds.reduce((sum,e)=>sum+e.amount+state.ledger.filter(r=>r.kind==='restore'&&r.relatedId===e.id).reduce((n,r)=>n+r.amount,0),0);
    return {paidId:paid.id,amount:-paid.amount-active};
  }).filter(e=>e.amount>0);
}
export function editLedger(state:ZooSaveV1,operationId:string,items:Array<{kind:'refund'|'restore';relatedId:string;amount:number}>){
  if(!/^edit-[a-f0-9]{32}$/.test(operationId)||state.ledger.length+items.length>8192)return null;
  let balance=state.currency;
  const entries:LedgerEntry[]=[];
  for(const [index,item]of items.entries()){
    balance+=item.amount;const id=`${operationId}-${index}`;
    if(!Number.isSafeInteger(balance)||balance<0||state.ledger.some(e=>e.id===id||e.operationId===id))return null;
    entries.push({id,operationId:id,...item,balanceAfter:balance,tick:state.tick});
  }
  const ledger=[...state.ledger,...entries];
  return validRefunds(ledger)?{currency:balance,ledger,entries}:null;
}
