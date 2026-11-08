import {createIndexedDbBackend,SAVE_DATABASE,SaveFault} from './durable-backend.ts';
import {inspectCheckpoint,type StoredCheckpoint} from './checkpoint.ts';
import {LION_CHECKPOINT_CODEC,serializeSaveV3} from './save-v3.ts';
import {GIRAFFE_CHECKPOINT_CODEC,projectUnstartedV4} from './save-v4.ts';
import type {ZooSaveV4} from '../core/giraffe-state.ts';
const validateV3Backup=(raw:unknown)=>{try{return Boolean(raw&&typeof raw==='object'&&'payload'in raw&&typeof raw.payload==='string'&&JSON.parse(raw.payload).schemaVersion===3&&inspectCheckpoint(raw,LION_CHECKPOINT_CODEC).record);}catch{return false;}};
function predecessor(old:StoredCheckpoint|null,next:StoredCheckpoint):StoredCheckpoint {
 try {
  if(old){const schema=JSON.parse(old.payload).schemaVersion;if(schema===4)throw new SaveFault('unreadable');if(schema===3)return structuredClone(old);const v3=LION_CHECKPOINT_CODEC.parse(old.payload);if(!v3.ok)throw new SaveFault('unreadable');return {...structuredClone(old),writer:'giraffe-v3-intermediate',payload:serializeSaveV3(v3.value)};}
  const fresh=GIRAFFE_CHECKPOINT_CODEC.parse(next.payload);if(!fresh.ok)throw new SaveFault('unreadable');return {...structuredClone(next),writer:'giraffe-v3-intermediate',payload:serializeSaveV3(projectUnstartedV4(fresh.value))};
 }catch{throw new SaveFault('unreadable');}
}
/** Shared historical policy. V5 may reuse this only with a validated V4 intermediate. */
export const GIRAFFE_V3_MIGRATION={prepare:predecessor,validate:validateV3Backup};
/** Same database/store; exact V3 predecessor (or explicitly labelled validated intermediate)
 * is preserved atomically with the first winning V4 write. Never reconstruct lost V4 provenance. */
export function createGiraffeIndexedDbBackend(factory:IDBFactory|undefined,database=SAVE_DATABASE){
 return createIndexedDbBackend<ZooSaveV4>(factory,database,{codec:GIRAFFE_CHECKPOINT_CODEC,databaseVersion:4,minimumSchema:4,preserveV1BeforeMigration:true,preserveV2BeforeMigration:true,v3Migration:GIRAFFE_V3_MIGRATION});
}
