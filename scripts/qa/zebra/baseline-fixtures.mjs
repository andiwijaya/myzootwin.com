import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateZooSave,serializeZooSave} from '../../../src/game/persistence/save.ts';
import {migrateToV4} from '../../../src/game/persistence/save-v4.ts';
import {sceneOrigin} from '../../../src/game/world/scene-coordinates.ts';

export const baselineFiles=['elephant-legacy-v1.json','lion-v2-golden.json','giraffe-v3-golden.json','giraffe-v4-golden.json'];
export const sha256=v=>createHash('sha256').update(v).digest('hex');
export const fixtureTextHash=bytes=>sha256(bytes.toString('utf8').replace(/\r\n/g,'\n'));
export const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export function projections(state){
 const groups={world:state.world,animals:state.animals,visitors:{visitors:state.visitors,flow:state.visitorFlow,admissions:state.admissions},finance:{currency:state.currency,ledger:state.ledger,economy:state.economy},missions:{macaw:state.missions,elephant:state.elephantGrove??null,lion:state.lionSavanna??null,giraffe:state.giraffePlains??null},clock:{tick:state.tick,gameTimeMs:state.gameTimeMs,randomSeed:state.randomSeed,randomState:state.randomState},preferences:state.preferences};
 return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,sha256(canonical(v))]));
}
export function readBaselineStates(){
 return baselineFiles.flatMap(name=>{const bytes=readFileSync(new URL('../../../tests/fixtures/'+name,import.meta.url)),data=JSON.parse(bytes),states=data.entries?Object.entries(data.entries).map(([key,value])=>[key,value.state]):[['earned',data.state]];return states.map(([key,state])=>({id:`v${state.schemaVersion}-${key}`,file:'tests/fixtures/'+name,fileSha256:fixtureTextHash(bytes),state}));});
}
export function createBaselineManifest(){
 return {version:1,scope:'Frozen synthetic fixtures only; original production module codecs; no owner save',fileHashEncoding:'UTF-8 text with Git checkout CRLF normalized to LF; original source files unchanged; state/serializer/projection hashes remain exact',fixtures:readBaselineStates().map(({state,...meta})=>{const check=validateZooSave(state);if(!check.ok)throw Error(meta.id+JSON.stringify(check));const migrated=migrateToV4(state);if(!migrated.ok)throw Error(meta.id+JSON.stringify(migrated));return {...meta,schemaVersion:state.schemaVersion,stateSha256:sha256(canonical(state)),serializedSha256:sha256(serializeZooSave(state)),projections:projections(state),migratedV4Sha256:sha256(canonical(migrated.value)),map:{width:state.world.width,height:state.world.height,origin:sceneOrigin(state.world)},habitats:state.world.habitats.map(h=>({id:h.id,kind:h.kind??'macaw-aviary',cells:h.cells,viewingCell:h.viewingCell})),residentIds:state.animals.map(a=>a.id)};})};
}
