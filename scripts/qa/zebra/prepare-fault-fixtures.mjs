import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {preparedZebraCare} from '../../../tests/helpers/zebra-care-play.mjs';
import {zebraAccessView} from '../../../src/game/world/zebra-access.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {admissionProofs} from '../../../src/game/economy/journal.ts';
import {readBaselineStates,canonical} from './baseline-fixtures.mjs';
import {sha256,sourceFingerprint} from '../tooling.mjs';
const target=process.argv[2];if(!target||!/^\.qa\/zebra-audit\/r7-03\/[a-z0-9-]{1,32}$/.test(target))throw Error('Fresh named R7-03 fixture directory required');
await mkdir(target,{recursive:false});
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inputs=await sourceFingerprint(process.cwd()),sim=preparedZebraCare(),events=[];
sim.subscribe(e=>{if(e.type.startsWith('zebra-')||e.type==='visitor-admitted')events.push(e);});
const initial=sim.snapshot(),oldTickets=new Set(admissionProofs(initial).map(a=>a.visitorId));
for(let i=0;i<5&&!zebraAccessView(sim.snapshot()).connected;i++){const p=zebraAccessView(sim.snapshot());assert.equal(sim.buildPath(p.path.cell,sim.commandRevision()).ok,true);}
const q={id:'ZQ01',command:sim.commandRevision()},p=sim.prepareZebraMission(q);assert.equal(p.ok,true);assert.equal(sim.acceptCommittedZebraMission(p.state,q),true);sim.visitors(true);
let ticks=0;
for(;ticks<6000;ticks++){
 sim.advance(100);
 if(ticks%100===0)for(const r of sim.zebraCareView().resources)if(r.refillPrice&&r.stock===0){const q={id:r.id,revision:r.revision,command:sim.commandRevision()},p=sim.prepareZebraRefill(q);assert.equal(p.ok,true);assert.equal(sim.acceptCommittedZebraCare(p.state,q),true);}
 if(sim.zebraMissionView().rows[1].status==='ready'&&sim.snapshot().visitors.some(v=>v.entry?.status==='paid'&&!oldTickets.has(v.id)))break;
}
assert.ok(ticks<6000,'Missing source-earned ZQ02 + new live paid admission');
const state=sim.snapshot(),candidate=sim.prepareZebraMission({id:'ZQ02',command:sim.commandRevision()});assert.equal(candidate.ok,true);assert.equal(candidate.state.currency,state.currency+150);assert.equal(validateSaveV5(state).ok,true);sim.dispose();
const fixture={metadata:{source,input:inputs.id,recipe:'Labelled synthetic grant/home prerequisite from original strict helper; every welcome/care/refill/path/ZQ01/admission and bounded tick uses actual source commands. ZQ02 not claimed. Not public grant/budget acceptance.',ticks:ticks+1,initialHash:sha256(canonical(initial)),stateHash:sha256(canonical(state)),candidateHash:sha256(canonical(candidate.state)),events,helperHash:sha256(await readFile('tests/helpers/zebra-care-play.mjs'))},state,baseline:readBaselineStates().map(({id,state})=>({id,state}))};
await writeFile(target+'/fixture.json',JSON.stringify(fixture)+'\n');await writeFile(target+'/source.json',JSON.stringify({source,inputs,fixture:{sha256:sha256(await readFile(target+'/fixture.json')),stateHash:fixture.metadata.stateHash,ticks:fixture.metadata.ticks},scope:fixture.metadata.recipe},null,2)+'\n');console.log(JSON.stringify({status:'PASS_SOURCE_CAUSAL_FIXTURE',target,ticks:fixture.metadata.ticks,stateHash:fixture.metadata.stateHash,command:state.economy.nextCommand,cash:state.currency,mission:'ZQ02_READY_150_NOT_CLAIMED',newPaid:state.visitors.filter(v=>v.entry?.status==='paid'&&!oldTickets.has(v.id)).map(v=>v.id)}));
