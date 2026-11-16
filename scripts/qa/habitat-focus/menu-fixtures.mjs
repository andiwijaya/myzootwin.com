import {migrateToV5,validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {readBaselineStates} from '../zebra/baseline-fixtures.mjs';
import {missionFixture} from '../../../tests/browser/mission-dom-scenarios.mjs';
import {recoveryFixture} from '../../../tests/browser/recovery-dom-scenarios.mjs';
import {twoHabitatSimulation} from '../../../tests/fixtures/elephant-two-habitats.mjs';
import {lionHome} from '../../../tests/fixtures/lion-home.mjs';
import {preparedGiraffeZoo} from '../../../tests/fixtures/giraffe-play.mjs';
import {missingConnection} from '../../../src/game/economy/elephant-recovery.ts';
import {createSimulation} from '../../../src/game/core/simulation.ts';
import {zebraAccessView} from '../../../src/game/world/zebra-access.ts';

/** Whole synthetic starting saves only. UI audit, not unlock/progression acceptance. */
export function menuFixtures(full,slots){
 const result={full,slots},baselines=readBaselineStates();
 const add=(name,state)=>{const r=migrateToV5(state);if(!r.ok)throw Error(name+': '+JSON.stringify(r));result[name]=r.value;};
 for(const [name,id]of Object.entries({fresh:'v1-new',elephantGrant:'v1-q04Claimed',lionGrant:'v2-earned',giraffeGrant:'v3-earned',zebraGrant:'v4-earned',q04:'v1-q04Ready'}))add(name,baselines.find(r=>r.id===id).state);
 add('q01',missionFixture('connected'));add('recovery',recoveryFixture('zero'));
 const zebra=createSimulation(full);for(let i=0;i<100&&!zebraAccessView(zebra.snapshot()).connected;i++){const path=zebraAccessView(zebra.snapshot()).path;if(!path)break;const r=zebra.buildPath(path.cell,zebra.commandRevision());if(!r.ok)throw Error('Zebra connection '+JSON.stringify(r));}add('zq',zebra.snapshot());zebra.dispose();
 for(const [name,make]of [['eh',()=>twoHabitatSimulation({pond:true,enrichment:true})],['lq',()=>lionHome({pride:true,enrichment:true})],['gq',()=>preparedGiraffeZoo()]]){
  const sim=make(),home=sim.snapshot().world.habitats.at(-1);for(let i=0;i<100;i++){const path=missingConnection(sim.snapshot(),home.id);if(!path)break;const r=sim.buildPath(path.cell,sim.commandRevision());if(!r.ok)throw Error(name+' connector '+JSON.stringify(r));}add(name,sim.snapshot());sim.dispose();
 }
 for(const[name,state]of Object.entries(result))if(!validateSaveV5(state).ok)throw Error('Invalid menu fixture '+name);
 return result;
}
