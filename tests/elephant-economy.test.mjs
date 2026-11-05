import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {zeroCashQualified,buildZeroCashGrove,serviceRealSupplies} from './fixtures/elephant-economy.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {ELEPHANT_PRICES,ELEPHANT_STARTER_BUDGET} from '../src/game/economy/elephant-prices.ts';
import {prepareConservationGrant,conservationGrantView,CONSERVATION_GRANT_ID} from '../src/game/economy/conservation-grant.ts';
import {totals,compactFinance,ledgerProof} from '../src/game/economy/journal.ts';
import {parseSaveV2,serializeSaveV2,validateSaveV2,migrateSaveV1} from '../src/game/persistence/save-v2.ts';
import {entryMessages} from '../src/game-entry/locale.ts';
import {elephantCatalogCopy} from '../src/game-entry/elephant-catalog.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')),source=frozen.entries.q04Claimed.state;
const valid=s=>{assert.ok(validateSaveV2(s).ok,JSON.stringify(validateSaveV2(s)));assert.equal(s.currency,Object.values(totals(s).amounts).reduce((n,a)=>n+a,0));};
const step=(sim,n)=>{for(let i=0;i<n;i++)sim.advance(100);};

test('zero-cash qualified grant buys the actual complete six-prop setup, six real paths, initial supplies and first two-habitat upkeep with64ZC reserve',()=>{
 const {zero,state}=buildZeroCashGrove(source);assert.equal(zero.currency,0);assert.equal(conservationGrantView(zero).canClaim,true);assert.equal(ELEPHANT_PRICES.grant,1400);assert.deepEqual(ELEPHANT_STARTER_BUDGET,{paths:6,construction:1210,supplies:32,upkeep:4,total:1336,reserve:64});assert.equal(state.currency,68);
 const before=totals(zero),after=totals(state);assert.equal(after.amounts.build-before.amounts.build,-1300);assert.equal(after.amounts.supplies-before.amounts.supplies,-32);assert.equal(after.amounts.reward-before.amounts.reward,1400);assert.equal(state.world.resources.filter(r=>r.kind.startsWith('elephant-')).length,6);assert.equal(state.animals.filter(a=>a.speciesId==='elephas-maximus').length,2);
 const sim=createSimulation(state);sim.setSpeed(1);const period=state.economy.maintenancePeriod;for(let i=0;i<600&&sim.snapshot().economy.maintenancePeriod===period;i++)sim.advance(100);assert.equal(sim.economyView().maintenancePeriod,period+1);assert.equal(sim.inspect().currency,64);assert.equal(sim.visitorView().tickets.revenue,after.amounts.ticket);valid(sim.snapshot());sim.dispose();
});

test('a15minute simulated paid-care flow remains solvent and consumes real supplies, with exact1x/10x cold continuation and retained grant proof',()=>{
 const {state}=buildZeroCashGrove(source),a=createSimulation(state);a.setSpeed(1);a.visitors(true);let b=createSimulation(a.snapshot()),min=68;b.setSpeed(10);
 for(let i=0;i<9000;i++){if(i%10===0){serviceRealSupplies(a);serviceRealSupplies(b);}a.advance(100);b.advance(10);min=Math.min(min,a.inspect().currency);if(i===4499){const mid=b.snapshot();assert.ok(compactFinance(mid,[],true));valid(mid);assert.equal(prepareConservationGrant(mid,{command:mid.economy.nextCommand}).reason,'claimed');b.dispose();b=createSimulation(parseSaveV2(serializeSaveV2(mid)).value);}}
 const x=a.snapshot(),y=b.snapshot();y.preferences.speed=1;const canonical=structuredClone(x);assert.ok(compactFinance(canonical,[],true));assert.ok(compactFinance(y,[],true));delete canonical.economy.checkpoint.compactions;delete y.economy.checkpoint.compactions;assert.deepEqual(canonical,y);
 assert.equal(min,60);assert.equal(x.currency,124);assert.ok(x.currency>state.currency);assert.ok(a.visitorView().tickets.admissions>=30);assert.equal(a.economyView().maintenanceDue,0);assert.ok(a.elephantSnapshot().animals.every(e=>e.foodEaten>=14&&e.waterDrunk>=17&&e.welfare>=70&&e.baths>=1));assert.ok(totals(x).amounts.supplies<totals(state).amounts.supplies);assert.equal(ledgerProof(x,CONSERVATION_GRANT_ID).amount,1400);valid(x);valid(b.snapshot());a.dispose();b.dispose();
});

test('actually closed and depleted zoo reaches zero without negative cash, then limited macaw rations plus real paid visits recover both elephant needs',()=>{
 const sim=createSimulation(buildZeroCashGrove(source).state);sim.setSpeed(1);step(sim,10200);const distressed=sim.snapshot();assert.equal(distressed.currency,0);assert.ok(sim.elephantSnapshot().animals.every(a=>a.hunger===100&&a.thirst===100&&a.welfare<30));assert.equal(sim.economyView().maintenanceDue,0);sim.visitors(true);let rations=0;
 for(let i=0;i<8000;i++){if(i%10===0){const r=sim.recoveryView();if(r.low&&r.available&&r.kind==='rations'&&sim.recover({command:r.command,key:r.key}))rations++;serviceRealSupplies(sim,false);}sim.advance(100);assert.ok(sim.inspect().currency>=0);}
 const recovered=sim.snapshot();assert.equal(recovered.currency,22);assert.equal(rations,2);assert.equal(sim.economyView().maintenanceDue,0);assert.ok(sim.elephantSnapshot().animals.every(a=>a.hunger<40&&a.thirst<40&&a.welfare>=70));assert.equal(totals(recovered).amounts.reward,totals(distressed).amounts.reward);assert.equal(sim.visitorView().tickets.revenue-totals(distressed).amounts.ticket,(sim.visitorView().tickets.admissions-totals(distressed).counts.ticket)*10);valid(recovered);sim.dispose();
});

test('grant financial proof and separate displayed conservation income survive actual paid edit cycles and journal retention without replay',()=>{
 let sim=createSimulation(buildZeroCashGrove(source).state);const oldGrant=sim.snapshot().elephantGrove.grant,opening=sim.inspect().currency;
 for(let i=0;i<80;i++){assert.ok(sim.buildPath({x:0,z:10},sim.commandRevision()).ok);const q=sim.quoteRemoval({kind:'path',cell:{x:0,z:10}});assert.ok(q.ok);assert.ok(sim.remove(q.quote,'edit-'+(8000+i).toString(16).padStart(32,'0')).ok);}
 const state=sim.snapshot();assert.ok(state.economy.checkpoint.compactions>0);assert.equal(state.currency,opening);assert.equal(ledgerProof(state,CONSERVATION_GRANT_ID).amount,1400);assert.deepEqual(state.elephantGrove.grant,oldGrant);const cash=sim.economyView();assert.equal(cash.rewards,1460);assert.equal(cash.conservationGrant,1400);assert.equal(cash.missionRewards,60);sim.dispose();sim=createSimulation(parseSaveV2(serializeSaveV2(state)).value);const before=serializeSaveV2(sim.snapshot());for(let n=0;n<50;n++)assert.equal(prepareConservationGrant(sim.snapshot(),{command:sim.commandRevision()}).reason,'claimed');assert.equal(serializeSaveV2(sim.snapshot()),before);assert.deepEqual(sim.economyView(),cash);valid(sim.snapshot());sim.dispose();
});

test('unclaimed Q04 and original zero-cash fresh save remain locked; insufficient funds, full and stale services never spend or fabricate supply',()=>{
 for(const name of ['zeroCash','q04Ready']){const state=migrateSaveV1(frozen.entries[name].state).value;assert.equal(conservationGrantView(state).canClaim,false);assert.equal(prepareConservationGrant(state,{command:state.economy.nextCommand}).reason,'locked');}
 const sim=createSimulation(buildZeroCashGrove(source).state),resource=sim.elephantCareSnapshot().resources.find(r=>r.kind==='elephant-water'),before=serializeSaveV2(sim.snapshot());assert.equal(sim.refillElephantCare({command:sim.commandRevision(),id:resource.id,revision:resource.revision}).ok,false);assert.equal(serializeSaveV2(sim.snapshot()),before);step(sim,10200);const empty=sim.elephantCareSnapshot().resources.find(r=>r.kind==='elephant-water');assert.equal(empty.stock,0);const broke=serializeSaveV2(sim.snapshot());assert.equal(sim.refillElephantCare({command:sim.commandRevision(),id:empty.id,revision:empty.revision}).reason,'funds');assert.equal(sim.refillElephantCare({command:1,id:empty.id,revision:resource.revision}).ok,false);assert.equal(serializeSaveV2(sim.snapshot()),broke);valid(sim.snapshot());sim.dispose();
});

test('budget and conservation income are bilingual, explicit about recurring costs, and preserve the original reward meaning',()=>{
 for(const locale of ['en','id']){const cash=entryMessages[locale].cashflowElephantIncome,budget=elephantCatalogCopy[locale].budget;for(const key of ['tickets','rewards','grant'])assert.ok(cash.includes('{'+key+'}'));for(const key of ['paths','coins','reserve'])assert.ok(budget.includes('{'+key+'}'));assert.match(budget,locale==='en'?/Later refills and upkeep/:/berikutnya tetap berbayar/);assert.ok(entryMessages[locale].cashflowIncome.includes('{rewards}'));}const state=zeroCashQualified(source),sim=createSimulation(state);assert.equal(sim.economyView().conservationGrant,undefined);assert.equal(sim.economyView().rewards,60);sim.dispose();
});
