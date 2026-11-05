import {createIndexedDbBackend,SAVE_DATABASE} from './durable-backend.ts';
import {ELEPHANT_CHECKPOINT_CODEC} from './save-v2.ts';
/** Opt-in until the complete migration/Continue/recovery gate passes. Never opens a second game database. */
export function createElephantIndexedDbBackend(factory:IDBFactory|undefined,database=SAVE_DATABASE){
  return createIndexedDbBackend(factory,database,{codec:ELEPHANT_CHECKPOINT_CODEC,databaseVersion:2,minimumSchema:2,preserveV1BeforeMigration:true});
}
