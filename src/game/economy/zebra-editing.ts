import type{ZooSave}from'../core/zoo-state.ts';
import{quoteRemoval,removedWorld,elephantResourceUndoWorld,zebraRestorationBlocked,zebraResourceUndo,type EditorState,type RemovalQuote,type EditReason}from'../world/editing.ts';
import{editLedger,refundable}from'./refunds.ts';import{ledgerProof,compactFinance}from'./journal.ts';import{MONEY_RULES}from'./prices.ts';
import{validateSaveV5}from'../persistence/save-v5.ts';import{reconcileZebraWelfare}from'../animals/zebras/welfare.ts';
export type ZebraEditRequest={action:'remove';quote:RemovalQuote}|{action:'undo';command:number;revision:number};
const operation='edit-'+'0'.repeat(32);
/** Pure candidate over the real shared purchase/refund book. No engine, clock,
 * callback, stock grant or live mutation. The caller publishes only after CAS. */
export function prepareZebraEdit(s:ZooSave,editor:EditorState,q:ZebraEditRequest){
 const fail=(reason:EditReason)=>({ok:false as const,reason});if(s.schemaVersion!==5||!q||!validateSaveV5(s).ok)return fail('command');if(!Number.isSafeInteger(editor.revision)||editor.revision<0||editor.revision>=Number.MAX_SAFE_INTEGER||s.economy.nextCommand>=Number.MAX_SAFE_INTEGER)return fail('capacity');
 let world:ReturnType<typeof removedWorld>,transaction:ReturnType<typeof editLedger>,nextEditor:EditorState;
 if(q.action==='remove'){
  const quote=q.quote;if(!quote||quote.target?.kind!=='zebra-resource')return fail('protected');if(quote.revision!==editor.revision||quote.command!==s.economy.nextCommand)return fail('stale');const checked=quoteRemoval(s,quote.target,editor.revision);if(!checked.ok)return checked;
  transaction=editLedger(s,operation,refundable(s,quote.target.id).map(r=>({kind:'refund' as const,relatedId:r.paidId,amount:r.amount})));if(!transaction)return fail('funds');world=removedWorld(s.world,quote.target);nextEditor={revision:editor.revision+1,undo:{before:structuredClone(s.world),after:structuredClone(world),refundIds:transaction.entries.map(e=>e.id)}};
 }else if(q.action==='undo'){
  if(q.command!==s.economy.nextCommand||q.revision!==editor.revision||!zebraResourceUndo(editor.undo)||!editor.undo)return fail('stale');const undo=editor.undo,restored=elephantResourceUndoWorld(s.world,undo);if(!restored)return fail('stale');const prop=undo.before.resources.find(r=>!undo.after.resources.some(a=>a.id===r.id))!,refunds=undo.refundIds.map(id=>ledgerProof(s,id));if(refunds.some(e=>!e||e.kind!=='refund'||!e.relatedId||ledgerProof(s,e.relatedId)?.kind!=='build'||ledgerProof(s,e.relatedId)?.relatedId!==prop.id))return fail('command');transaction=editLedger(s,operation,refunds.map(e=>({kind:'restore' as const,relatedId:e!.id,amount:-e!.amount})));if(!transaction)return fail('funds');world=restored;nextEditor={revision:editor.revision+1,undo:null};
 }else return fail('command');
 const next={...structuredClone(s),world,currency:transaction.currency,ledger:transaction.ledger};next.economy.nextCommand++;if(q.action==='undo'&&zebraRestorationBlocked(next))return fail('zebra-space');const first=validateSaveV5(next);if(!first.ok)return fail('command');reconcileZebraWelfare(first.value);if(first.value.ledger.length>=MONEY_RULES.journalEntries)compactFinance(first.value,nextEditor.undo?.refundIds??[]);const checked=validateSaveV5(first.value);return checked.ok?{ok:true as const,state:checked.value,editor:nextEditor}:{ok:false as const,reason:'command' as const};
}
