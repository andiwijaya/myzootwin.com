import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{createSimulation}from'../src/game/core/simulation.ts';import{migrateToV5,validateSaveV5,serializeSaveV5,parseSaveV5}from'../src/game/persistence/save-v5.ts';
import{zebraAccessView}from'../src/game/world/zebra-access.ts';import{totals,ledgerProof}from'../src/game/economy/journal.ts';
import{ZEBRA_PRICES}from'../src/game/animals/zebras/rules.ts';
const old=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v4-golden.json',import.meta.url),'utf8')).state,must=x=>{assert.equal(x.ok,true,JSON.stringify(x));return x;};
test('actual1700 grant funds paid essential8x8/4paths/4residents/care and6000active1x ticks with>=150 reserve, without old money or later income subsidizing the budget',()=>{
 const sim=createSimulation(migrateToV5(old).value);sim.setSpeed(1);sim.visitors(false);const before=sim.snapshot(),q={command:sim.commandRevision()},grant=must(sim.prepareZebraGrant(q));assert.equal(sim.acceptCommittedZebraGrant(grant.state,q),true);const startTotals=totals(sim.snapshot());
 const h=sim.zebraHabitatView(),p=must(sim.prepareZebraHabitat(h.anchor,'habitat-zebra-budget',h.command));assert.ok(sim.acceptCommittedZebraHabitat(p.state,h.anchor,'habitat-zebra-budget',h.command));let paths=0;while(zebraAccessView(sim.snapshot()).path){assert.ok(paths++<20);must(sim.buildPath(zebraAccessView(sim.snapshot()).path.cell,sim.commandRevision()));}assert.equal(paths,4);
 for(const kind of['zebra-graze','zebra-water','zebra-shade']){const q={kind,cell:sim.defaultZebraCareCell(kind),command:sim.commandRevision()},p=must(sim.prepareZebraCare(q));assert.ok(sim.acceptCommittedZebraCare(p.state,q));}
 for(let i=0;i<2;i++){const command=sim.commandRevision(),p=must(sim.prepareZebraWelcome(command));assert.ok(sim.acceptCommittedZebraWelcome(p.state,command));}
 let minWelfare=100,refills=0;
 for(let i=0;i<6000;i++){
  for(const r of sim.zebraCareView().resources)if(r.kind!=='zebra-shade'&&r.stock===0){const q={id:r.id,revision:r.revision,command:sim.commandRevision()},p=must(sim.prepareZebraRefill(q));assert.ok(sim.acceptCommittedZebraCare(p.state,q));refills++;}
  sim.advance(100);minWelfare=Math.min(minWelfare,...sim.zebraCareView().residents.map(a=>a.welfare.welfare));
  if(i%600===0){assert.equal(validateSaveV5(sim.snapshot()).ok,true);assert.equal(ledgerProof(sim.snapshot(),'zebra-grasslands-grant-v1').amount,ZEBRA_PRICES.grant);}
 }
 const state=sim.snapshot(),endTotals=totals(state),costs=['build','supplies','maintenance'].reduce((n,k)=>n-(endTotals.amounts[k]-startTotals.amounts[k]),0),reserve=ZEBRA_PRICES.grant-costs;
 assert.equal(state.tick-before.tick,6000);assert.equal(state.world.habitats.length,5);assert.equal(state.animals.length,14);assert.ok(reserve>=150,JSON.stringify({costs,reserve,minWelfare,refills}));assert.equal(endTotals.amounts.ticket,startTotals.amounts.ticket);assert.equal(endTotals.amounts.reward,startTotals.amounts.reward);assert.equal(state.currency-before.currency,reserve);assert.equal(sim.zebraCareView().residents.length,4);
 for(const a of sim.zebraCareView().residents){assert.ok(a.foodEaten>=3&&a.waterDrunk>=3&&a.restedTicks>0,JSON.stringify(a));assert.ok(a.welfare.welfare>=60&&a.hunger<70&&a.thirst<70,JSON.stringify(a));}
 const cold=must(parseSaveV5(serializeSaveV5(state))).value;assert.equal(cold.currency,state.currency);assert.deepEqual(cold.zebraGrasslands.grant,state.zebraGrasslands.grant);sim.dispose();
 console.log(JSON.stringify({scope:'Deterministic source commands, emulated successful adoption; not native wall-time/physical-device/FPS or storage acceptance',ticks:6000,grant:ZEBRA_PRICES.grant,costs,reserve,refills,minWelfare}));
});
