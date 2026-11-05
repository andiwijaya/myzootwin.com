import type {ZooSaveV2} from '../../src/game/core/zoo-state.ts';
import {createSimulation} from '../../src/game/core/simulation.ts';
import {migrateSaveV1,validateSaveV2} from '../../src/game/persistence/save-v2.ts';
import {prepareConservationGrant} from '../../src/game/economy/conservation-grant.ts';
import {prepareElephantConstruction} from '../../src/game/economy/elephant-construction.ts';
import {prepareElephantWelcome} from '../../src/game/animals/elephants/residents.ts';
const check=(ok:unknown,message:string)=>{if(!ok)throw Error(message);};
/** Explicit synthetic prior-spending condition, never owner storage or a player money command. */
export function zeroCashQualified(source:unknown):ZooSaveV2{
 const migrated=migrateSaveV1(source);if(!migrated.ok)throw Error('Invalid frozen source');const sim=createSimulation(migrated.value);sim.visitors(false);for(let i=0;i<2500&&sim.visitorView().active;i++)sim.advance(100);check(!sim.visitorView().active,'Original visitors not drained');const state=sim.snapshot();sim.dispose();if(state.schemaVersion!==2)throw Error('Expected V2');
 const amount=state.currency;state.ledger.push({id:'qa-eh4-03-prior-spending',operationId:'qa-eh4-03-prior-spending',kind:'maintenance',amount:-amount,balanceAfter:0,tick:state.tick,relatedId:null});state.currency=0;check(validateSaveV2(state).ok,'Invalid labelled zero-cash condition');return state;
}
/** Grant/build/welcome/care/services/connector are actual product transactions after the labelled initial condition. */
export function buildZeroCashGrove(source:unknown){
 const zero=zeroCashQualified(source),grant=prepareConservationGrant(zero,{command:zero.economy.nextCommand});if(!grant.ok)throw Error('Qualified zero-cash grant refused');const built=prepareElephantConstruction(grant.state,{x:3,z:11},'habitat-economy-golden',grant.state.economy.nextCommand);if(!built.ok)throw Error('Priced grove refused');const welcomed=prepareElephantWelcome(built.state,built.state.economy.nextCommand);if(!welcomed.ok)throw Error('Free welcome refused');const sim=createSimulation(welcomed.state);
 try{
  for(const kind of ['elephant-browse','elephant-browse','elephant-water','elephant-pond','elephant-shade','elephant-log']as const){const cell=sim.defaultElephantCareCell(kind);check(cell&&sim.placeElephantCare({command:sim.commandRevision(),kind,cell}).ok,'Actual priced care refused');}
  for(const r of sim.elephantCareSnapshot().resources.filter(r=>r.capacity===8))check(sim.refillElephantCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok,'Initial real service refused');
  for(const cell of [{x:1,z:9},{x:1,z:10},{x:2,z:10},{x:2,z:11},{x:2,z:12},{x:2,z:13}])check(sim.buildPath(cell,sim.commandRevision()).ok,'Actual connector refused');check(sim.inspect().currency===68,'Expected68ZC reserve before next upkeep');return{zero,state:sim.snapshot()};
 }finally{sim.dispose();}
}
/** A player-like paid service policy, not a renderer or production autoplayer. Only existing affordable supplies are replenished. */
export function serviceRealSupplies(sim:ReturnType<typeof createSimulation>,pond=true){
 for(const kind of ['food','water']as const){const v=sim[kind+'View' as 'foodView'|'waterView']();if(v.exists&&v.stock<=2&&sim.inspect().currency>=(kind==='food'?8:4))check(sim[kind]('refill',v.revision,sim.commandRevision()).ok,'Actual macaw service refused');}
 for(const r of sim.elephantCareSnapshot().resources.filter(r=>r.capacity===8&&(pond||r.kind!=='elephant-pond'))){const cost=r.kind==='elephant-browse'?8:r.kind==='elephant-water'?4:12;if(r.stock<=2&&sim.inspect().currency>=cost)check(sim.refillElephantCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok,'Actual elephant service refused');}
}
