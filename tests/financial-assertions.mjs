import assert from'node:assert/strict';
import{totals}from'../src/game/economy/journal.ts';
export const nonTicketBalance=s=>{const a=totals(s).amounts;return Object.values(a).reduce((n,v)=>n+v,0)-a.ticket;};
export function assertConserved(s){assert.equal(s.currency,Object.values(totals(s).amounts).reduce((n,v)=>n+v,0));assert.ok(s.currency>=0);assert.equal(s.ledger.filter(e=>e.kind==='ticket').length,s.admissions.length);}
