import {validateSave,serializeSave} from './save-v1.ts';
import {validateSaveV2,serializeSaveV2} from './save-v2.ts';
import {validateSaveV3,serializeSaveV3} from './save-v3.ts';
import type {ZooSave,MultiSpeciesSave} from '../core/zoo-state.ts';
/** Exact schema dispatch; never silently coerces unsupported data to the current version. */
export const validateZooSave=(value:unknown)=>typeof value==='object'&&value!==null&&'schemaVersion'in value&&value.schemaVersion===3?validateSaveV3(value):typeof value==='object'&&value!==null&&'schemaVersion'in value&&value.schemaVersion===2?validateSaveV2(value):validateSave(value);
export const serializeZooSave=(state:ZooSave)=>state.schemaVersion===3?serializeSaveV3(state):state.schemaVersion===2?serializeSaveV2(state):serializeSave(state);
/** Internal version-preserving command validator. Public input decoders above remain unknown-to-exact. */
export function validateMultiSave<S extends MultiSpeciesSave>(value:S):{ok:true;value:S}|Extract<ReturnType<typeof validateSaveV2>,{ok:false}>{
 const checked=value.schemaVersion===3?validateSaveV3(value):validateSaveV2(value);
 return checked.ok?{ok:true,value:checked.value as S}:checked;
}
