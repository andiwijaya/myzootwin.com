import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {migrateToV3} from '../../src/game/persistence/save-v3.ts';
import {createSimulation} from '../../src/game/core/simulation.ts';
export function lionHome({pride=false,care=true,enrichment=false,filled=true}={}){
 const initial=JSON.parse(readFileSync(new URL('./lion-v2-golden.json',import.meta.url),'utf8')).state,sim=createSimulation(migrateToV3(initial).value);
 const quote={command:sim.commandRevision()},grant=sim.prepareLionGrant(quote);assert.ok(grant.ok,JSON.stringify(grant));assert.ok(sim.acceptCommittedLionGrant(grant.state,quote));
 assert.ok(sim.buildLionHabitat({x:3,z:18},'habitat-lion-test',sim.commandRevision()).ok);assert.ok(sim.welcomeLions(sim.commandRevision()).ok);
 for(const kind of [...(care?['lion-meat','lion-meat','lion-water']:[]),...(enrichment?['lion-den','lion-kopje','lion-scent','lion-scratch']:[])]){const result=sim.placeLionCare({command:sim.commandRevision(),kind,cell:sim.defaultLionCareCell(kind)});assert.ok(result.ok,kind+JSON.stringify(result));}
 if(filled)for(const r of sim.lionCareView().resources)if(r.stock<r.capacity)assert.ok(sim.refillLionCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok);
 if(pride)assert.ok(sim.welcomeLions(sim.commandRevision()).ok);return sim;
}
