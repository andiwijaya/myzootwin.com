import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {twoHabitatSimulation} from '../../tests/fixtures/elephant-two-habitats.mjs';
import {serviceRealSupplies} from '../../tests/fixtures/elephant-economy.ts';
import {serializeSaveV2,parseSaveV2} from '../../src/game/persistence/save-v2.ts';
const sim=twoHabitatSimulation({pond:true,enrichment:true});sim.setSpeed(1);sim.visitors(true);
for(let i=0;i<12000&&sim.elephantMissionView().completed<4;i++){
  if(i%10===0)serviceRealSupplies(sim);
  const view=sim.elephantMissionView(),row=view.rows.find(r=>r.id===view.currentId);
  if(row?.status==='ready'){
    const quote={id:row.id,command:sim.commandRevision()},prepared=sim.prepareElephantMission(quote);
    if(!prepared.ok||!sim.acceptCommittedElephantMission(prepared.state,quote))throw Error('Baseline claim failed');
  }
  sim.advance(100);
}
if(sim.elephantMissionView().completed!==4)throw Error('Baseline did not finish all EH missions');
sim.setPaused(true);
const text=serializeSaveV2(sim.snapshot()),state=JSON.parse(text);
if(!parseSaveV2(text).ok)throw Error('Baseline codec failed');
const frozen={provenance:'Disposable deterministic QA world made with original V1 fixture and actual Elephant commands/ticks. Not owner data. Claims here emulate a successful durable boundary; CAS is tested separately.',sourceCommit:'377ec7d',sha256:createHash('sha256').update(text).digest('hex'),state};
const destination=new URL('../../tests/fixtures/lion-v2-golden.json',import.meta.url);
if(process.argv.includes('--write'))writeFileSync(destination,JSON.stringify(frozen,null,2)+'\n');
else if(readFileSync(destination,'utf8')!==JSON.stringify(frozen,null,2)+'\n')throw Error('Frozen golden changed');
console.log(JSON.stringify({tick:state.tick,sha256:frozen.sha256,chars:text.length,residents:state.animals.map(a=>a.id),EH:state.elephantGrove.missions.completedIds}));sim.dispose();
