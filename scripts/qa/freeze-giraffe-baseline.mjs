import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {lionHome} from '../../tests/fixtures/lion-home.mjs';
import {serviceRealSupplies} from '../../tests/fixtures/elephant-economy.ts';
import {missingConnection} from '../../src/game/economy/elephant-recovery.ts';
import {serializeSaveV3,validateSaveV3} from '../../src/game/persistence/save-v3.ts';
const sim=lionHome({pride:true,enrichment:true});
try {
 const home=sim.snapshot().world.habitats.find(h=>h.kind==='lion-savanna');
 for(let i=0;i<40;i++){const q=missingConnection(sim.snapshot(),home.id);if(!q)break;if(!sim.buildPath(q.cell,sim.commandRevision()).ok)throw Error('Real connector failed');}
 sim.visitors(true);
 for(let i=0;i<24000&&sim.lionMissionView().completed<4;i++){
  if(i%20===0){serviceRealSupplies(sim);for(const r of sim.lionCareView().resources)if(r.refillPrice>0&&r.stock<r.capacity/2&&sim.inspect().currency>=r.refillPrice&&!sim.refillLionCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok)throw Error('Real lion service failed');}
  const m=sim.lionMissionView(),row=m.rows.find(r=>r.id===m.currentId);
  if(row?.status==='ready'){const quote={id:row.id,command:sim.commandRevision()},p=sim.prepareLionMission(quote);if(!p.ok||!sim.acceptCommittedLionMission(p.state,quote))throw Error('Real lion reward failed');}
  sim.advance(100);
 }
 if(sim.lionMissionView().completed!==4)throw Error('Could not earn LQ04');
 sim.setPaused(true);const state=sim.snapshot(),text=serializeSaveV3(state);if(!validateSaveV3(state).ok)throw Error('Invalid frozen V3');
 const frozen={provenance:'Disposable deterministic QA world, generated from the previously frozen earned V2 and real V3 product transactions/ticks. No owner data. Reward adoption emulates successful durability; independent CAS tests cover storage.',sourceCommit:'769cbeab0af2e5c76bb6e40a8851eec8532a1127',sha256:createHash('sha256').update(text).digest('hex'),state};
 const destination=new URL('../../tests/fixtures/giraffe-v3-golden.json',import.meta.url),body=JSON.stringify(frozen,null,2)+'\n';
 if(process.argv.includes('--write'))writeFileSync(destination,body);else if(readFileSync(destination,'utf8')!==body)throw Error('Frozen V3 changed');
 console.log(JSON.stringify({tick:state.tick,sha256:frozen.sha256,chars:text.length,residents:state.animals.map(a=>a.id),LQ:state.lionSavanna.missions.completedIds}));
} finally {sim.dispose();}
