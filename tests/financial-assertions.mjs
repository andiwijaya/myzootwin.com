import assert from'node:assert/strict';
export const nonTicketBalance=s=>s.ledger.filter(e=>e.kind!=='ticket').reduce((n,e)=>n+e.amount,0);
export function assertConserved(s){assert.equal(s.currency,s.ledger.reduce((n,e)=>n+e.amount,0));assert.ok(s.currency>=0);assert.equal(s.ledger.filter(e=>e.kind==='ticket').length,s.admissions.length);}
