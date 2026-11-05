import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateSaveV1} from '../../src/game/persistence/save-v2.ts';
import {prepareConservationGrant} from '../../src/game/economy/conservation-grant.ts';
import {prepareElephantConstruction} from '../../src/game/economy/elephant-construction.ts';
import {prepareElephantWelcome} from '../../src/game/animals/elephants/residents.ts';
import {defaultElephantCareCell,prepareElephantCarePlacement,prepareElephantCareRefill} from '../../src/game/animals/elephants/care-resources.ts';
/** Existing sanitized fixture plus actual player commands, never owner storage or fabricated paid props. */
export function elephantHome({care=true,pond=false,enrichment=false,filled=true,welcome=true}={}){
 let s=migrateSaveV1(JSON.parse(readFileSync(new URL('./elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state).value;
 for(const prepare of [s=>prepareConservationGrant(s,{command:s.economy.nextCommand}),s=>prepareElephantConstruction(s,{x:3,z:11},'habitat-actual-elephant-test',s.economy.nextCommand),...(welcome?[s=>prepareElephantWelcome(s,s.economy.nextCommand)]:[])]){const r=prepare(s);assert.ok(r.ok);s=r.state;}
 for(const kind of [...(care?['elephant-browse','elephant-browse','elephant-water']:[]),...(pond?['elephant-pond']:[]),...(enrichment?['elephant-shade','elephant-log']:[])]){const r=prepareElephantCarePlacement(s,{command:s.economy.nextCommand,kind,cell:defaultElephantCareCell(s,kind)});assert.ok(r.ok,JSON.stringify(r));s=r.state;}
 if(filled)for(const resource of s.world.resources.filter(r=>'approaches'in r&&r.capacity===8)){const r=prepareElephantCareRefill(s,{command:s.economy.nextCommand,id:resource.id,revision:resource.revision});assert.ok(r.ok);s=r.state;}
 return s;
}
export const elephantHerd=s=>s.animals.filter(a=>a.speciesId==='elephas-maximus');
export const elephantProps=s=>s.world.resources.filter(r=>'approaches'in r);
