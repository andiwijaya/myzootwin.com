import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {twoHabitatSimulation,ELEPHANT_CONNECTOR} from './fixtures/elephant-two-habitats.mjs';
import {buildZeroCashGrove,serviceRealSupplies} from './fixtures/elephant-economy.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {elephantRecoveryView} from '../src/game/economy/elephant-recovery.ts';
import {presentElephantRecovery} from '../src/game-entry/elephant-recovery-panel.ts';
import {visitTargetForState} from '../src/game/visitors/graph.ts';
import {validatePathPlacement} from '../src/game/world/paths.ts';
import {parseSaveV2,serializeSaveV2,validateSaveV2} from '../src/game/persistence/save-v2.ts';
import {totals} from '../src/game/economy/journal.ts';
const source=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state;
const step=(sim,n)=>{for(let i=0;i<n;i++)sim.advance(100);};
const valid=sim=>assert.ok(validateSaveV2(sim.snapshot()).ok,JSON.stringify(validateSaveV2(sim.snapshot())));
const distressed=()=>{const sim=createSimulation(buildZeroCashGrove(source).state);sim.setSpeed(1);step(sim,10200);return sim;};

test('path recovery proposes the next legally buildable real cell and full remaining cost without mutation; actual quoted tile purchases connect the Grove',()=>{
 const sim=twoHabitatSimulation({connect:false}),base=sim.snapshot(),cash=base.currency,legacy=structuredClone(base.missions),first=sim.elephantRecoveryView();assert.equal(first.kind,'path');assert.deepEqual(first.path,{cell:{x:3,z:8},missing:3,total:45});assert.equal(first.cost,15);for(let i=0;i<20;i++)sim.elephantRecoveryView();assert.equal(serializeSaveV2(sim.snapshot()),serializeSaveV2(base));let bought=0;
 for(;bought<10;bought++){const v=sim.elephantRecoveryView();if(v.kind!=='path')break;assert.equal(validatePathPlacement(sim.snapshot().world,v.path.cell).reason,'ready');assert.ok(sim.buildPath(v.path.cell,v.command).ok);}
 assert.equal(bought,3);assert.equal(sim.inspect().currency,cash-45);const grove=sim.snapshot().world.habitats.find(h=>h.kind==='elephant-grove');assert.ok(visitTargetForState(sim.snapshot(),grove.id));assert.equal(sim.elephantRecoveryView().kind,'gate');assert.deepEqual(sim.snapshot().missions,legacy);valid(sim);sim.dispose();
});

test('actual empty/gate states have concrete actions, cached viewing cells cannot hide a broken bridge and in-place repairs refresh the read-only guidance',()=>{
 const empty=twoHabitatSimulation({welcome:false});assert.equal(empty.elephantRecoveryView().kind,'welcome');assert.equal(empty.elephantRecoveryView().action,'build');empty.dispose();const sim=twoHabitatSimulation(),state=sim.snapshot();assert.equal(elephantRecoveryView(state).kind,'gate');const tile=state.world.tiles.find(t=>t.cell.x===ELEPHANT_CONNECTOR[0].x&&t.cell.z===ELEPHANT_CONNECTOR[0].z);tile.path=false;const before=serializeSaveV2(state),v=elephantRecoveryView(state);assert.equal(v.kind,'path');assert.deepEqual(v.path.cell,ELEPHANT_CONNECTOR[0]);assert.equal(v.path.total,15);assert.equal(serializeSaveV2(state),before);tile.path=true;assert.equal(elephantRecoveryView(state).kind,'gate');sim.visitors(true);assert.equal(sim.elephantRecoveryView().active,false);sim.dispose();
});

test('zero-cash actual depletion points to existing bounded macaw support, which changes no elephant stock or currency and cannot replay',()=>{
 const sim=distressed(),initial=sim.snapshot(),view=sim.elephantRecoveryView();assert.equal(initial.currency,0);assert.equal(view.kind,'funds');assert.equal(view.action,'support');assert.ok(view.cost>0);assert.equal(view.affordable,false);const bytes=serializeSaveV2(initial);for(let i=0;i<25;i++)sim.elephantRecoveryView();assert.equal(serializeSaveV2(sim.snapshot()),bytes);
 const quote=sim.recoveryView();assert.equal(quote.kind,'rations');assert.ok(sim.recover({command:quote.command,key:quote.key}));const after=sim.snapshot();assert.equal(after.currency,0);assert.deepEqual(after.world.resources.filter(r=>r.kind.startsWith('elephant-')),initial.world.resources.filter(r=>r.kind.startsWith('elephant-')));assert.equal(sim.recover({command:quote.command,key:quote.key}),false);assert.equal(totals(after).amounts.reward,totals(initial).amounts.reward);assert.equal(sim.elephantRecoveryView().kind,'funds');valid(sim);sim.dispose();
});

test('real refills prepare supplies while critical needs remain truthful; cold guidance names the actual resident and action without instant recovery',()=>{
 const sim=distressed();sim.visitors(true);for(let i=0;i<2500&&sim.inspect().currency<24;i++)sim.advance(100);assert.ok(sim.inspect().currency>=20);const before=sim.snapshot();for(const r of sim.elephantCareSnapshot().resources.filter(r=>r.kind==='elephant-browse'||r.kind==='elephant-water'))if(r.stock===0)assert.ok(sim.refillElephantCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok);const s=sim.snapshot(),v=sim.elephantRecoveryView();assert.ok(v.active);assert.equal(v.kind,'care');assert.ok(['Ayu','Nara'].includes(v.name));assert.ok(v.care.next.kind.startsWith('wait-'));assert.equal(v.cost,0);assert.ok(s.animals.filter(a=>a.speciesId==='elephas-maximus').every(a=>a.thirst===100));assert.equal(totals(s).amounts.reward,totals(before).amounts.reward);const cold=createSimulation(parseSaveV2(serializeSaveV2(s)).value);assert.deepEqual(cold.elephantRecoveryView(),v);cold.setPaused(true);const frozen=serializeSaveV2(cold.snapshot());cold.advance(86400000);assert.equal(serializeSaveV2(cold.snapshot()),frozen);valid(sim);sim.dispose();cold.dispose();
});

test('the actual zero-depletion support and paid-admission loop removes negative guidance only after real care recovers, with no further grant',()=>{
 const sim=distressed(),reward=totals(sim.snapshot()).amounts.reward;sim.visitors(true);for(let i=0;i<8000;i++){if(i%10===0){const r=sim.recoveryView();if(r.low&&r.available&&r.kind==='rations')sim.recover({command:r.command,key:r.key});serviceRealSupplies(sim,false);}sim.advance(100);}const v=sim.elephantRecoveryView();assert.equal(v.active,false);assert.equal(v.kind,'steady');assert.equal(sim.inspect().currency,22);assert.ok(sim.elephantSnapshot().animals.every(a=>a.welfare>=70));assert.equal(totals(sim.snapshot()).amounts.reward,reward);assert.equal(sim.economyView().maintenanceDue,0);valid(sim);sim.dispose();
});

test('unavailable legal route is explicitly space guidance; impossible fault inputs never cause clearing, purchases or invented success',()=>{
 const sim=twoHabitatSimulation({connect:false}),s=sim.snapshot();sim.dispose();for(const t of s.world.tiles)if(!t.path&&t.occupantId===null)t.terrain='creek';const before=JSON.stringify(s),v=elephantRecoveryView(s);assert.equal(v.kind,'space');assert.equal(v.action,'build');assert.equal(v.path,null);assert.equal(JSON.stringify(s),before);
});

test('every negative-state action has complete ID/EN price, location and honest next-step text without raw internal IDs',()=>{
 const sim=twoHabitatSimulation({connect:false}),v=sim.elephantRecoveryView();for(const locale of ['id','en'])for(const kind of ['welcome','care','funds','path','space','gate']){const input={...v,kind,name:'Ayu',waitTicks:85},before=JSON.stringify(input),p=presentElephantRecovery(input,locale);assert.ok(p.title&&p.body&&p.action&&p.price&&p.wait);const text=Object.values(p).join(' ');assert.ok(!text.includes('{')&&!text.includes('undefined')&&!text.includes('habitat-actual-elephant-test'));assert.equal(JSON.stringify(input),before);}sim.dispose();
});
