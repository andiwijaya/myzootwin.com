import type {ZooSaveV1,WorldState} from '../core/state.ts';
import type {MacawHabitat} from '../core/species.ts';
import {appendElephantZone} from '../world/elephant-expansion.ts';
import {MAX_SAVE_CHARS,parseSave,validateSave,type SaveResult} from './save-v1.ts';
import type {CheckpointCodec} from './checkpoint.ts';

/** Migration foundation. Resident/grant/EH proof fields are added with their later gameplay gates.
 * Unknown future content is rejected and preserved, never projected away by this codec. */
export interface ZooSaveV2 extends Omit<ZooSaveV1,'schemaVersion'|'world'> {
  schemaVersion:2;
  world:Omit<WorldState,'habitats'>&{habitats:MacawHabitat[]};
  elephantGrove:{grant:null};
}
type Failure=Extract<SaveResult,{ok:false}>;
export type SaveV2Result={ok:true;value:ZooSaveV2}|Failure;
const plain=(x:unknown):x is Record<string,unknown>=>typeof x==='object'&&x!==null&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x:Record<string,unknown>,keys:string[])=>Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const rootKeys=['schemaVersion','randomSeed','randomState','tick','gameTimeMs','currency','economy','world','animals','visitors','visitorFlow','admissions','ledger','missions','preferences','elephantGrove'];
const fail=(path:string):Failure=>({ok:false,code:'invalid-state',path});
const unsupported=(path:string):Failure=>({ok:false,code:'unsupported-schema',path});

export function validateSaveV2(value:unknown):SaveV2Result {
  if(!plain(value))return fail('$');
  if(value.schemaVersion!==2)return {ok:false,code:'unsupported-schema',path:'$.schemaVersion'};
  if(Object.keys(value).some(key=>!rootKeys.includes(key)))return unsupported('$');
  if(plain(value.elephantGrove)&&Object.keys(value.elephantGrove).some(key=>key!=='grant'))return unsupported('$.elephantGrove');
  if(!exact(value,rootKeys)||!plain(value.elephantGrove)||!exact(value.elephantGrove,['grant']))return fail('$.elephantGrove');
  if(value.elephantGrove.grant!==null)return unsupported('$.elephantGrove.grant');
  const w=value.world;
  if(plain(w)&&Array.isArray(w.habitats)&&w.habitats.some(h=>plain(h)&&h.kind!=='macaw-aviary'))return unsupported('$.world.habitats.kind');
  if(plain(w)&&Array.isArray(w.resources)&&w.resources.some(r=>plain(r)&&!['food','water','perch'].includes(r.kind as string)))return unsupported('$.world.resources.kind');
  if(Array.isArray(value.animals)&&value.animals.some(a=>plain(a)&&a.speciesId!=='ara-ararauna'))return unsupported('$.animals.speciesId');
  if(!plain(w)||w.width!==12||w.height!==18||!Array.isArray(w.habitats)||Object.getPrototypeOf(w.habitats)!==Array.prototype||Object.keys(w.habitats).length!==w.habitats.length||w.habitats.some(h=>!plain(h)||!exact(h,['id','kind','cells','viewingCell'])||h.kind!=='macaw-aviary'))return fail('$.world');
  const legacy={...value,schemaVersion:1,world:{...w,habitats:w.habitats.map(h=>{const {kind:_,...rest}=h;return rest;})}} as Record<string,unknown>;
  delete legacy.elephantGrove;
  const checked=validateSave(legacy);if(!checked.ok)return checked;
  return {ok:true,value:structuredClone(value) as unknown as ZooSaveV2};
}
export function migrateSaveV1(value:unknown):SaveV2Result {
  const checked=validateSave(value);if(!checked.ok)return checked;
  try{
    const world=appendElephantZone(checked.value.world);
    const migrated:ZooSaveV2={...checked.value,schemaVersion:2,world:{...world,habitats:world.habitats.map(h=>({...h,kind:'macaw-aviary'}))},elephantGrove:{grant:null}};
    return validateSaveV2(migrated);
  }catch{return unsupported('$.world.unsupported-layout');}
}
export function parseSaveV2(text:string):SaveV2Result {
  if(typeof text!=='string')return {ok:false,code:'invalid-json',path:'$'};
  if(text.length>MAX_SAVE_CHARS)return {ok:false,code:'too-large',path:'$'};
  let value:unknown;try{value=JSON.parse(text);}catch{return {ok:false,code:'invalid-json',path:'$'};}
  return validateSaveV2(value);
}
export function serializeSaveV2(value:ZooSaveV2):string {
  const checked=validateSaveV2(value);if(!checked.ok)throw new RangeError(`Invalid V2 save: ${checked.path}`);
  const text=JSON.stringify(checked.value);if(text.length>MAX_SAVE_CHARS)throw new RangeError('V2 save too large');return text;
}
/** One simulator/ledger, with a lossless schema adapter at the checkpoint boundary.
 * No unsupported elephant content is accepted by the migration-only foundation. */
export function legacySimulationState(value:ZooSaveV2):ZooSaveV1 {
  const checked=validateSaveV2(value);if(!checked.ok)throw new RangeError('Invalid V2 save');
  const {elephantGrove:_,...state}=checked.value;
  const result=validateSave({...state,schemaVersion:1,world:{...state.world,habitats:state.world.habitats.map(({kind:__,...h})=>h)}});
  if(!result.ok)throw new RangeError('Invalid simulation projection');return result.value;
}
export const ELEPHANT_CHECKPOINT_CODEC:CheckpointCodec={
  parse(text){
    if(typeof text!=='string'||text.length>MAX_SAVE_CHARS)return parseSave(text);
    let value:unknown;try{value=JSON.parse(text);}catch{return parseSave(text);}
    const checked=plain(value)&&value.schemaVersion===1?migrateSaveV1(value):validateSaveV2(value);
    return checked.ok?{ok:true,value:legacySimulationState(checked.value)}:checked;
  },
  serialize(state){const checked=migrateSaveV1(state);if(!checked.ok)throw new RangeError(`Invalid migration source: ${checked.path}`);return serializeSaveV2(checked.value);},
  prepare(state){const checked=migrateSaveV1(state);if(!checked.ok)throw new RangeError(`Invalid migration source: ${checked.path}`);return legacySimulationState(checked.value);},
};
