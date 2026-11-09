import type{ZooSaveV5}from'../../../src/game/core/zebra-state.ts';
import{purchaseBook,PURCHASE_PROOF_LIMIT}from'../../../src/game/economy/journal.ts';
/** Negative data ONLY. Deliberately bypass debit's preflight on a cloned QA
 * snapshot to prove the backend rejects old-style uncompactable live receipts. */
export function oversizedPurchaseCandidate(state:ZooSaveV5){
 const next=structuredClone(state),book=purchaseBook(next.ledger,next.economy.checkpoint);if(!book)throw Error('Invalid source purchase book');
 let live=[...book.purchases.values()].filter(p=>p.refunded<-p.entry.amount).length;
 const needed=PURCHASE_PROOF_LIMIT+1-live;if(needed<1||next.currency<needed)throw Error('Capacity negative fixture needs a funded bounded QA snapshot');
 while(live++<=PURCHASE_PROOF_LIMIT){const id=`cmd-${next.economy.nextCommand}`;next.currency--;next.ledger.push({id,operationId:id,kind:'build',amount:-1,balanceAfter:next.currency,tick:next.tick,relatedId:`qa-capacity-${next.economy.nextCommand}`});next.economy.nextCommand++;}
 return next;
}
