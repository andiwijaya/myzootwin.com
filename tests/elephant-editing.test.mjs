import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSimulation} from '../src/game/core/simulation.ts';
import {migrateSaveV1,validateSaveV2,serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {prepareElephantConstruction} from '../src/game/economy/elephant-construction.ts';
import {prepareElephantWelcome} from '../src/game/animals/elephants/residents.ts';
import {groundPointAllowed} from '../src/game/animals/elephants/ground.ts';
const legacy=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state;
const op=n=>'edit-'+n.toString(16).padStart(32,'0'),target=id=>({kind:'elephant-resource',id});
function home(){let s=migrateSaveV1(legacy).value;const b=prepareElephantConstruction(s,{x:3,z:11},'habitat-edit-care',s.economy.nextCommand);assert.ok(b.ok);s=prepareElephantWelcome(b.state,b.state.economy.nextCommand).state;return createSimulation(s);}
function place(sim,kind='elephant-browse',cell=sim.defaultElephantCareCell(kind),fill=false){const r=sim.placeElephantCare({command:sim.commandRevision(),kind,cell});assert.ok(r.ok,JSON.stringify(r));if(fill){const q=sim.elephantCareSnapshot().resources.find(x=>x.id===r.resourceId);assert.ok(sim.refillElephantCare({command:sim.commandRevision(),id:q.id,revision:q.revision}).ok);}return r.resourceId;}
const stableAnimals=s=>s.animals.map(a=>{const {welfare,habitatFit,care,...stable}=a;return stable;});

test('occupied large habitat refuses all deletion; legacy resources cannot enter the elephant edit route',()=>{
 const sim=home(),before=serializeSaveV2(sim.snapshot());assert.equal(sim.quoteRemoval({kind:'habitat',id:'habitat-edit-care'}).reason,'in-use');const old=sim.snapshot().world.resources.find(r=>r.kind==='food');assert.equal(sim.quoteRemoval(target(old.id)).reason,'protected');assert.equal(sim.quoteRemoval(target('not-here')).reason,'missing');assert.equal(serializeSaveV2(sim.snapshot()),before);sim.dispose();
});

test('remove and Undo refund only the real build price, preserve actual stock and residents, and reject forged/double commands',()=>{
 for(const kind of ['elephant-browse','elephant-water']){const sim=home(),id=place(sim,kind,undefined,true),before=sim.snapshot(),q=sim.quoteRemoval(target(id));assert.ok(q.ok);const price=kind==='elephant-browse'?80:90;assert.equal(q.quote.refund,price);assert.ok(sim.remove({...q.quote,refund:999999},op(1)).ok);const removed=sim.snapshot();assert.equal(removed.currency,before.currency+price);assert.ok(!removed.world.resources.some(r=>r.id===id));assert.deepEqual(stableAnimals(removed),stableAnimals(before));assert.equal(sim.remove(q.quote,op(2)).reason,'stale');assert.equal(sim.refillElephantCare({command:sim.commandRevision(),id,revision:0}).reason,'missing');assert.ok(sim.undo(op(3),sim.commandRevision()).ok);const restored=sim.snapshot();assert.equal(restored.currency,before.currency);assert.deepEqual(restored.world,before.world);assert.deepEqual(restored.animals,before.animals);assert.equal(sim.undo(op(4),sim.commandRevision()).reason,'stale');assert.equal(validateSaveV2(restored).ok,true);sim.dispose();}
});

test('a current quote and an older still-command-current quote both refuse a facility actively sought or used by an elephant',()=>{
 for(const phase of ['seek-food','eat','seek-water','drink']){const sim=home();sim.visitors(false);place(sim,'elephant-browse',undefined,true);place(sim,'elephant-browse',undefined,true);place(sim,'elephant-water',undefined,true);const quotes=new Map(sim.elephantCareSnapshot().resources.map(r=>[r.id,sim.quoteRemoval(target(r.id))]));let active;for(let i=0;i<700&&!active;i++){sim.advance(100);active=sim.elephantSnapshot().animals.find(a=>a.currentBehavior===phase);}assert.ok(active,phase);const old=quotes.get(active.targetResourceId);assert.ok(old.ok);const before=serializeSaveV2(sim.snapshot());assert.equal(sim.quoteRemoval(target(active.targetResourceId)).reason,'elephant-using');assert.equal(sim.remove(old.quote,op(20)).reason,'elephant-using');assert.equal(serializeSaveV2(sim.snapshot()),before);sim.dispose();}
});

test('Undo refuses a valid post-removal actor occupying the former interior prop site without changing cash, residents or its memento',()=>{
 const sim=home(),id=place(sim,'elephant-browse',{x:5,z:14}),q=sim.quoteRemoval(target(id));assert.ok(q.ok&&sim.remove(q.quote,op(30)).ok);const s=sim.snapshot(),editor=sim.editorSnapshot();sim.dispose();const a=s.animals.find(a=>a.speciesId==='elephas-maximus');a.position={x:5.5,z:14.5};const h=s.world.habitats.find(h=>h.kind==='elephant-grove');assert.ok(groundPointAllowed(s.world,h,a.position));assert.ok(validateSaveV2(s).ok);const blocked=createSimulation(s,editor),before=serializeSaveV2(blocked.snapshot());assert.equal(blocked.undo(op(31),blocked.commandRevision()).reason,'elephant-space');assert.equal(serializeSaveV2(blocked.snapshot()),before);assert.deepEqual(blocked.editorSnapshot(),editor);blocked.dispose();
});

test('real low-balance path spending and upkeep prevent an unaffordable Undo without erasing its refund or missing facility state',()=>{
 const sim=home();sim.visitors(false);assert.ok(sim.birds('reserve'));const id=place(sim),cells=sim.worldSnapshot().tiles.filter(t=>t.cell.z>=10&&(t.cell.x<3||t.cell.x>=9)).map(t=>t.cell);for(const c of cells){if(sim.inspect().currency<15)break;sim.buildPath(c,sim.commandRevision());}assert.equal(sim.inspect().currency,0);const q=sim.quoteRemoval(target(id));assert.ok(q.ok&&sim.remove(q.quote,op(40)).ok);assert.equal(sim.inspect().currency,80);for(let i=0;i<600&&sim.inspect().currency>=80;i++)sim.advance(100);assert.ok(sim.inspect().currency<80);const before=serializeSaveV2(sim.snapshot()),editor=sim.editorSnapshot();assert.equal(sim.undo(op(41),sim.commandRevision()).reason,'funds');assert.equal(serializeSaveV2(sim.snapshot()),before);assert.deepEqual(sim.editorSnapshot(),editor);assert.equal(validateSaveV2(sim.snapshot()).ok,true);sim.dispose();
});

test('repeated real remove/Undo cycles survive ledger compaction with exact net cash, one paid facility and no service refunds',()=>{
 const sim=home(),id=place(sim,'elephant-browse',undefined,true),start=sim.snapshot();for(let i=0;i<160;i++){const q=sim.quoteRemoval(target(id));assert.ok(q.ok);assert.equal(q.quote.refund,80);assert.ok(sim.remove(q.quote,op(100+i*2)).ok);assert.ok(sim.undo(op(101+i*2),sim.commandRevision()).ok);}const final=sim.snapshot();assert.equal(final.currency,start.currency);assert.ok(final.economy.checkpoint.compactions>=2);assert.deepEqual(final.world,start.world);assert.deepEqual(final.animals,start.animals);assert.equal(validateSaveV2(final).ok,true);sim.dispose();
});

test('removed-facility cold Continue keeps its one real refund, no orphan targets, no third resident and no fabricated cross-page Undo',()=>{
 const sim=home(),id=place(sim,'elephant-water',undefined,true),before=sim.snapshot(),q=sim.quoteRemoval(target(id));assert.ok(q.ok&&sim.remove(q.quote,op(500)).ok);const saved=serializeSaveV2(sim.snapshot()),parsed=parseSaveV2(saved);assert.ok(parsed.ok);sim.dispose();const cold=createSimulation(parsed.value);assert.equal(serializeSaveV2(cold.snapshot()),saved);assert.equal(cold.inspect().currency,before.currency+90);assert.equal(cold.undo(op(501),cold.commandRevision()).reason,'stale');assert.ok(cold.snapshot().animals.every(a=>a.targetResourceId!==id));assert.equal(cold.elephantSnapshot().animals.length,2);assert.equal(cold.birdSnapshot().animals.length,2);assert.equal(cold.quoteRemoval(target(id)).reason,'missing');cold.dispose();
});


test('facility Undo retains actual passive macaw portions, other elephant stock and every ongoing animal transform/counter',()=>{
 let sim=home();sim.visitors(false);const id=place(sim,'elephant-browse',undefined,true);place(sim,'elephant-browse',undefined,true);place(sim,'elephant-water',undefined,true);const original=sim.snapshot(),q=sim.quoteRemoval(target(id));assert.ok(q.ok&&sim.remove(q.quote,op(600)).ok);let consumed=false;
 for(let i=0;i<900&&!consumed;i++){sim.advance(100);const s=sim.snapshot();consumed=s.world.resources.some(r=>['food','water'].includes(r.kind)&&r.stock<original.world.resources.find(o=>o.id===r.id).stock)&&s.world.resources.some(r=>r.kind==='elephant-water'&&r.stock<8);}assert.ok(consumed,'Actual independent stock consumption must precede Undo');const atRemount=sim.snapshot(),memento=sim.editorSnapshot();sim.dispose();sim=createSimulation(atRemount,memento);assert.ok(sim.inspect().canUndo,'Same-page remount must retain the scoped undo');
 let restored=false;for(let i=0;i<600&&!restored;i++){const before=sim.snapshot(),result=sim.undo(op(601),sim.commandRevision());if(!result.ok){assert.equal(result.reason,'elephant-space');assert.equal(serializeSaveV2(sim.snapshot()),serializeSaveV2(before));sim.advance(100);continue;}restored=true;const after=sim.snapshot();assert.equal(after.currency,before.currency-80);assert.deepEqual(after.world.resources.filter(r=>r.id!==id),before.world.resources);assert.deepEqual(after.world.resources.find(r=>r.id===id),original.world.resources.find(r=>r.id===id));assert.deepEqual(stableAnimals(after),stableAnimals(before));assert.equal(validateSaveV2(after).ok,true);}assert.ok(restored);sim.dispose();
});
