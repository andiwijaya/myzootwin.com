import type {FinanceCheckpoint,LedgerEntry,LedgerKind,PurchaseProof,RefundProof,TicketProof,ZooSaveV1} from '../core/state.ts';
import {MONEY_RULES} from './prices.ts';
export const LEDGER_KINDS:readonly LedgerKind[]=['starter','build','supplies','maintenance','ticket','reward','refund','restore'];
export const emptyTotals=():Record<LedgerKind,number>=>({starter:0,build:0,supplies:0,maintenance:0,ticket:0,reward:0,refund:0,restore:0});
export function emptyCheckpoint():FinanceCheckpoint{return{version:1,balance:0,entries:0,lastTick:0,compactions:0,commandThrough:0,visitorThrough:0,openSerials:[],maintenancePeriod:0,totals:emptyTotals(),counts:emptyTotals(),purchases:[],refunds:[],tickets:[],rewards:[],lastTicket:null};}
export function totals(s:ZooSaveV1){const amounts={...s.economy.checkpoint.totals},counts={...s.economy.checkpoint.counts};for(const e of s.ledger){amounts[e.kind]+=e.amount;counts[e.kind]++;}return{amounts,counts,entries:s.economy.checkpoint.entries+s.ledger.length};}
export const admissionProofs=(s:ZooSaveV1)=>[...s.economy.checkpoint.tickets.map(p=>p.admission),...s.admissions];
export function ledgerProof(s:ZooSaveV1,id:string){const c=s.economy.checkpoint;return s.ledger.find(e=>e.id===id)??c.purchases.find(p=>p.entry.id===id)?.entry??c.refunds.find(p=>p.entry.id===id)?.entry??c.tickets.find(p=>p.entry.id===id)?.entry??c.rewards.find(e=>e.id===id);}
export function purchaseBook(ledger:LedgerEntry[],base?:Pick<FinanceCheckpoint,'purchases'|'refunds'>){
 const purchases=new Map<string,PurchaseProof>((base?.purchases??[]).map(p=>[p.entry.id,structuredClone(p)])),refunds=new Map<string,RefundProof>((base?.refunds??[]).map(p=>[p.entry.id,structuredClone(p)]));
 for(const e of ledger){
  if(e.kind==='build'){if(purchases.has(e.id)||e.amount>=0)return null;purchases.set(e.id,{entry:{...e},refunded:0});}
  if(e.kind==='refund'){const p=e.relatedId?purchases.get(e.relatedId):null;if(!p||refunds.has(e.id)||e.amount<=0||p.refunded+e.amount>-p.entry.amount)return null;p.refunded+=e.amount;refunds.set(e.id,{entry:{...e},restored:0});}
  if(e.kind==='restore'){const f=e.relatedId?refunds.get(e.relatedId):null,p=f?.entry.relatedId?purchases.get(f.entry.relatedId):null;if(!f||!p||e.amount>=0||f.restored-e.amount>f.entry.amount||p.refunded+e.amount<0)return null;f.restored-=e.amount;p.refunded+=e.amount;}
 }
 return{purchases,refunds};
}
const negative=(kind:LedgerKind)=>['build','supplies','maintenance','restore'].includes(kind);
const safe=(n:number)=>Number.isSafeInteger(n)&&n>=0;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
/** Arithmetic/provenance validation is data-only, shared with raw admission transactions and the codec. */
export function coherentMoney(s:ZooSaveV1):boolean{
 const c=s.economy.checkpoint;if(!c||c.version!==1||!safe(c.balance)||!safe(c.entries)||!safe(c.lastTick)||c.lastTick>s.tick||!safe(c.compactions)||c.compactions>c.entries||!safe(c.commandThrough)||!safe(s.economy.nextCommand)||s.economy.nextCommand<=c.commandThrough||!safe(c.visitorThrough)||c.visitorThrough>=s.visitorFlow.nextSerial||!safe(c.maintenancePeriod)||c.maintenancePeriod>s.economy.maintenancePeriod)return false;
 let opening=0,entries=0;for(const k of LEDGER_KINDS){const a=c.totals[k],n=c.counts[k];if(!Number.isSafeInteger(a)||!safe(n)||(n===0)!==(a===0)||n>Math.abs(a)||a!==0&&(negative(k)?a>0:a<0))return false;opening+=a;entries+=n;}
 if(!Number.isSafeInteger(opening)||opening!==c.balance||entries!==c.entries||c.entries===0&&(c.balance!==0||c.commandThrough!==0||c.visitorThrough!==0||c.lastTick!==0||c.compactions!==0)||c.purchases.length>256||c.refunds.length>256||c.tickets.length>35||c.rewards.length>4||c.openSerials.length>3||new Set(c.openSerials).size!==c.openSerials.length)return false;
 const historical=[...c.purchases.map(p=>p.entry),...c.refunds.map(p=>p.entry),...c.tickets.map(p=>p.entry),...c.rewards],seen=new Set<string>(),ops=new Set<string>();
 for(const e of historical){const cmd=/^cmd-([1-9][0-9]*)(?:-[0-9]+)?$/.exec(e.operationId);if(cmd&&Number(cmd[1])>c.commandThrough)return false;if(seen.has(e.id)||ops.has(e.operationId)||!safe(e.tick)||e.tick>c.lastTick||!Number.isSafeInteger(e.amount)||e.amount===0||negative(e.kind)!==(e.amount<0))return false;seen.add(e.id);ops.add(e.operationId);}
 for(const p of c.purchases)if(p.entry.kind!=='build'||p.entry.relatedId===null||!safe(p.refunded)||p.refunded>-p.entry.amount)return false;
 for(const f of c.refunds){const p=c.purchases.find(p=>p.entry.id===f.entry.relatedId);if(f.entry.kind!=='refund'||!p||!safe(f.restored)||f.restored>f.entry.amount||f.entry.amount-f.restored>p.refunded)return false;}
 if((c.counts.ticket===0)!==(c.lastTicket===null)||c.tickets.length>c.counts.ticket)return false;
 if(c.purchases.length>c.counts.build||c.refunds.length>c.counts.refund||c.rewards.length>c.counts.reward||c.purchases.reduce((n,p)=>n-p.entry.amount,0)>-c.totals.build||c.refunds.reduce((n,p)=>n+p.entry.amount,0)>c.totals.refund)return false;
 const outstanding=new Map<string,number>();for(const f of c.refunds){const id=f.entry.relatedId!;outstanding.set(id,(outstanding.get(id)??0)+f.entry.amount-f.restored);}for(const[id,value]of outstanding)if(value>c.purchases.find(p=>p.entry.id===id)!.refunded)return false;
 const all=[...c.tickets.map(p=>p.admission),...s.admissions],admissions=new Map(),visitors=new Set(),paidEntries=new Set();
 for(const p of c.tickets){if(p.entry.kind!=='ticket'||p.entry.id!==p.admission.ledgerEntryId||p.entry.relatedId!==p.admission.id||p.entry.tick!==p.admission.tick||p.admission.entry!==null&&p.entry.amount!==p.admission.entry.price)return false;}
 if(c.lastTicket){const p=c.lastTicket;if(p.entry.kind!=='ticket'||p.admission.ledgerEntryId!==p.entry.id||p.entry.relatedId!==p.admission.id||p.entry.tick!==p.admission.tick||p.entry.tick>c.lastTick||p.entry.amount<=0||p.entry.amount>c.totals.ticket)return false;}
 let balance=c.balance,tick=c.lastTick;
 for(const e of s.ledger){balance+=e.amount;const cmd=/^cmd-([1-9][0-9]*)(?:-[0-9]+)?$/.exec(e.operationId);if(!Number.isSafeInteger(e.amount)||e.amount===0||negative(e.kind)!==(e.amount<0)||!safe(balance)||balance!==e.balanceAfter||e.tick<tick||e.tick>s.tick||seen.has(e.id)||ops.has(e.operationId)||cmd&&(Number(cmd[1])<=c.commandThrough||Number(cmd[1])>=s.economy.nextCommand))return false;seen.add(e.id);ops.add(e.operationId);tick=e.tick;}
 if(balance!==s.currency)return false;
 for(const a of all){const e=ledgerProof(s,a.ledgerEntryId);if(admissions.has(a.id)||visitors.has(a.visitorId)||paidEntries.has(a.ledgerEntryId)||!e||e.kind!=='ticket'||e.relatedId!==a.id||e.tick!==a.tick||a.entry!==null&&e.amount!==a.entry.price)return false;admissions.set(a.id,a);visitors.add(a.visitorId);paidEntries.add(a.ledgerEntryId);}
 if(s.admissions.length!==s.ledger.filter(e=>e.kind==='ticket').length||s.ledger.some(e=>e.kind==='ticket'&&(!e.relatedId||admissions.get(e.relatedId)?.ledgerEntryId!==e.id)))return false;
 const active=s.visitors.flatMap(v=>v.arrival&&v.arrival.serial<=c.visitorThrough?[v.arrival.serial]:[]).sort((a,b)=>a-b);if(!same(active,[...c.openSerials].sort((a,b)=>a-b)))return false;
 return purchaseBook(s.ledger,c)!==null;
}
/** Only active visitor proof remains live; retired serials cannot be revived after compaction. */
export function retireClosedProofs(s:ZooSaveV1){const c=s.economy.checkpoint,active=new Set(s.visitors.map(v=>v.id)),mission=new Set(s.missions.objectives.viewedVisitorIds);c.openSerials=c.openSerials.filter(n=>active.has(`arrival-${n}`));c.tickets=c.tickets.filter(p=>active.has(p.admission.visitorId)||mission.has(p.admission.visitorId));}
/** Fold complete accepted transactions, never arbitrary raw deletion. Proof and replay barriers remain bounded. */
export function compactFinance(s:ZooSaveV1,pinRefundIds:readonly string[]=[],force=false):boolean{
 if(!s.ledger.length||!force&&s.ledger.length<MONEY_RULES.journalEntries)return false;
 if(!coherentMoney(s))throw new Error('Cannot checkpoint inconsistent finances');
 const c=s.economy.checkpoint,book=purchaseBook(s.ledger,c)!;const amounts=totals(s),active=new Set(s.visitors.map(v=>v.id)),mission=new Set(s.missions.objectives.viewedVisitorIds);
 const refunds=[...book.refunds.values()].filter(f=>pinRefundIds.includes(f.entry.id)),pinned=new Set(refunds.map(f=>f.entry.relatedId));
 if(pinRefundIds.some(id=>!book.refunds.has(id)))throw new Error('Missing Undo refund proof');
 const purchases=[...book.purchases.values()].filter(p=>pinned.has(p.entry.id)||p.refunded<-p.entry.amount);
 if(purchases.length>256||refunds.length>256)throw new Error('Financial proof exceeds bounded world contract');
 const tickets=admissionProofs(s).filter(a=>active.has(a.visitorId)||mission.has(a.visitorId)).map(admission=>({admission:structuredClone(admission),entry:{...ledgerProof(s,admission.ledgerEntryId)!}}));
 const recent=s.admissions.at(-1),lastTicket:TicketProof|null=recent?{admission:structuredClone(recent),entry:{...ledgerProof(s,recent.ledgerEntryId)!}}:c.lastTicket?structuredClone(c.lastTicket):null;
 const rewardIds=new Set(s.missions.rewards.map(r=>r.ledgerEntryId)),rewards=[...c.rewards,...s.ledger.filter(e=>e.kind==='reward')].filter(e=>rewardIds.has(e.id));
 s.economy.checkpoint={version:1,balance:s.currency,entries:amounts.entries,lastTick:s.tick,compactions:c.compactions+1,commandThrough:s.economy.nextCommand-1,visitorThrough:s.visitorFlow.nextSerial-1,openSerials:s.visitors.flatMap(v=>v.arrival?[v.arrival.serial]:[]),maintenancePeriod:s.economy.maintenancePeriod,totals:amounts.amounts,counts:amounts.counts,purchases,refunds,tickets,rewards,lastTicket};
 s.ledger=[];s.admissions=[];return true;
}
