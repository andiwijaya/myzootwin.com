import test from 'node:test';
import assert from 'node:assert/strict';
import {lionHome} from './fixtures/lion-home.mjs';
import {serializeSaveV3,validateSaveV3} from '../src/game/persistence/save-v3.ts';
import {LION_PRICES} from '../src/game/animals/lions/rules.ts';
const operation=n=>'edit-'+n.toString(16).padStart(32,'0');

test('all seven paid Lion facilities refund only construction and Undo repays exactly once without restoring refill fees',()=>{
 for(let index=0;index<7;index++){
  const sim=lionHome({enrichment:true}),resource=sim.lionCareView().resources[index],before=sim.snapshot(),quote=sim.quoteRemoval({kind:'lion-resource',id:resource.id});
  assert.ok(quote.ok,JSON.stringify(quote));assert.equal(quote.quote.refund,LION_PRICES[resource.kind]);
  assert.ok(sim.remove(quote.quote,operation(1)).ok);assert.equal(sim.inspect().currency,before.currency+LION_PRICES[resource.kind]);assert.equal(sim.lionCareView().resources.some(r=>r.id===resource.id),false);
  const removed=serializeSaveV3(sim.snapshot());assert.equal(sim.remove(quote.quote,operation(2)).ok,false);assert.equal(serializeSaveV3(sim.snapshot()),removed);
  assert.ok(sim.undo(operation(3),sim.commandRevision()).ok);assert.equal(sim.inspect().currency,before.currency);assert.deepEqual(sim.worldSnapshot(),before.world);
  const restored=serializeSaveV3(sim.snapshot());assert.equal(sim.undo(operation(4),sim.commandRevision()).ok,false);assert.equal(serializeSaveV3(sim.snapshot()),restored);sim.dispose();
 }
});

test('Lion habitat occupancy and active care dependencies block removals; stale paid quotes never partially edit or credit',()=>{
 const sim=lionHome({pride:true,enrichment:true}),h=sim.worldSnapshot().habitats.find(h=>h.kind==='lion-savanna');assert.equal(sim.quoteRemoval({kind:'habitat',id:h.id}).reason,'in-use');
 const unused=sim.lionCareView().resources.find(r=>r.kind==='lion-scratch'),quote=sim.quoteRemoval({kind:'lion-resource',id:unused.id});assert.ok(quote.ok);
 for(let i=0;i<500;i++){sim.advance(100);const actor=sim.lionCareView().residents.find(a=>a.targetResourceId);if(actor){assert.equal(sim.quoteRemoval({kind:'lion-resource',id:actor.targetResourceId}).reason,'lion-using');if(sim.lionCareView().resources.some(r=>r.refillPrice>0&&r.stock<r.capacity))break;}if(i===499)assert.fail('No actual care target');}
 assert.ok(sim.welcomeLions(sim.commandRevision()).ok===false); // full pride never adds a fourth
 const refill=sim.lionCareView().resources.find(r=>r.refillPrice>0&&r.stock<r.capacity);assert.ok(refill);assert.ok(sim.refillLionCare({command:sim.commandRevision(),id:refill.id,revision:refill.revision}).ok);
 const before=serializeSaveV3(sim.snapshot());assert.equal(sim.remove(quote.quote,operation(5)).reason,'stale');assert.equal(serializeSaveV3(sim.snapshot()),before);sim.dispose();
});

test('Undo of a removed Lion facility preserves passive current stock of all other facilities across real ticks',()=>{
 const sim=lionHome({pride:true,enrichment:true}),resource=sim.lionCareView().resources.find(r=>r.kind==='lion-scent'),quote=sim.quoteRemoval({kind:'lion-resource',id:resource.id});assert.ok(quote.ok);assert.ok(sim.remove(quote.quote,operation(6)).ok);
 for(let i=0;i<300;i++)sim.advance(100);let restored=false;
 for(let i=0;i<500;i++){const before=sim.snapshot(),result=sim.undo(operation(7),sim.commandRevision());if(result.ok){restored=true;const after=sim.snapshot();assert.deepEqual(after.world.resources.filter(r=>r.id!==resource.id),before.world.resources);const {refillPrice,...originalResource}=resource;assert.deepEqual(after.world.resources.find(r=>r.id===resource.id),originalResource);break;}assert.deepEqual(sim.snapshot(),before);sim.advance(100);}
 assert.ok(restored,'No safe eventual Undo');assert.ok(validateSaveV3(sim.snapshot()).ok);sim.dispose();
});
