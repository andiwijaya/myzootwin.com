import assert from'node:assert/strict';import{preparedZebraCare}from'./zebra-care-play.mjs';
import{zebraAccessView}from'../../src/game/world/zebra-access.ts';import{debit}from'../../src/game/economy/spending.ts';import{validateSaveV5}from'../../src/game/persistence/save-v5.ts';
/** A zero-wallet boundary fixture, not a real purchase/budget sequence. It keeps
 * real paid-home/care receipts; one explicitly labelled source-ledger expense
 * defines the initial0ZC wallet. Subsequent recovery actions use real commands. */
export function zeroZebraRecoveryBoundary({spare=true,enrichment=true}={}){
 const prepared=preparedZebraCare({supplies:false,enrichment});
 for(let i=0;i<5&&!zebraAccessView(prepared.snapshot()).connected;i++){const p=zebraAccessView(prepared.snapshot()).path;assert.ok(p);assert.equal(prepared.buildPath(p.cell,prepared.commandRevision()).ok,true);}
 assert.equal(zebraAccessView(prepared.snapshot()).connected,true);prepared.visitors(false);
 for(let i=0;i<900&&prepared.visitorView().active;i++)prepared.advance(100);assert.equal(prepared.visitorView().active,0);
 if(!spare){const resource=prepared.zebraCareView().resources.find(r=>r.kind==='zebra-graze'),q=prepared.quoteRemoval({kind:'zebra-resource',id:resource.id});assert.equal(q.ok,true);const request={action:'remove',quote:q.quote},p=prepared.prepareZebraEdit(request);assert.equal(p.ok,true);assert.equal(prepared.acceptCommittedZebraEdit(p.state,request),true);}
 const s=prepared.snapshot();prepared.dispose();assert.equal(debit(s,s.currency,'supplies','qa-zero-boundary','qa-zero-wallet'),null);s.economy.nextCommand++;
 const checked=validateSaveV5(s);assert.equal(checked.ok,true,JSON.stringify(checked));assert.equal(s.currency,0);return checked.value;
}
