import {createIndexedDbBackend,SAVE_DATABASE,SaveFault} from './durable-backend.ts';
import {inspectCheckpoint,type StoredCheckpoint} from './checkpoint.ts';
import {GIRAFFE_V3_MIGRATION} from './giraffe-backend.ts';
import {GIRAFFE_CHECKPOINT_CODEC,serializeSaveV4} from './save-v4.ts';
import {ZEBRA_CHECKPOINT_CODEC,projectUnstartedV5} from './save-v5.ts';
import type {ZooSaveV5} from '../core/zebra-state.ts';
export const validateZebraV4Backup=(raw:unknown)=>{try{return Boolean(raw&&typeof raw==='object'&&'payload'in raw&&typeof raw.payload==='string'&&JSON.parse(raw.payload).schemaVersion===4&&inspectCheckpoint(raw,GIRAFFE_CHECKPOINT_CODEC).record);}catch{return false;}};
function predecessor(old:StoredCheckpoint|null,next:StoredCheckpoint):StoredCheckpoint{
 try{
  if(old){const schema=JSON.parse(old.payload).schemaVersion;if(schema===5)throw new SaveFault('unreadable');if(schema===4)return structuredClone(old);const v4=GIRAFFE_CHECKPOINT_CODEC.parse(old.payload);if(!v4.ok)throw new SaveFault('unreadable');return{...structuredClone(old),writer:'zebra-v4-intermediate',payload:serializeSaveV4(v4.value)};}
  const fresh=ZEBRA_CHECKPOINT_CODEC.parse(next.payload);if(!fresh.ok)throw new SaveFault('unreadable');return{...structuredClone(next),writer:'zebra-v4-intermediate',payload:serializeSaveV4(projectUnstartedV5(fresh.value))};
 }catch{throw new SaveFault('unreadable');}
}
/** Same database/store, version5. Exact V4 backup + existing history + winning V5 CAS
 * commit together. Intermediates are labelled; missing V5 provenance is never reconstructed.
 * Product adoption remains gated separately; this is the canonical V5 persistence authority. */
export function createZebraIndexedDbBackend(factory:IDBFactory|undefined,database=SAVE_DATABASE){
 return createIndexedDbBackend<ZooSaveV5>(factory,database,{codec:ZEBRA_CHECKPOINT_CODEC,databaseVersion:5,minimumSchema:5,preserveV1BeforeMigration:true,preserveV2BeforeMigration:true,v3Migration:{validate:GIRAFFE_V3_MIGRATION.validate,prepare(old,next){return GIRAFFE_V3_MIGRATION.prepare(old,old?next:predecessor(null,next));}},v4Migration:{prepare:predecessor,validate:validateZebraV4Backup}});
}
