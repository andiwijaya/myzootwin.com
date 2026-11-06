import {createIndexedDbBackend,SAVE_DATABASE} from './durable-backend.ts';
import {LION_CHECKPOINT_CODEC} from './save-v3.ts';
/** Same single store, version barrier and generation/revision CAS. Canonical writer after native migration QA; never downgrade its database version. */
export function createLionIndexedDbBackend(factory:IDBFactory|undefined,database=SAVE_DATABASE){
 return createIndexedDbBackend(factory,database,{codec:LION_CHECKPOINT_CODEC,databaseVersion:3,minimumSchema:3,preserveV1BeforeMigration:true,preserveV2BeforeMigration:true});
}
