import {SAVE_DATABASE,SAVE_STORE,GIRAFFE_V3_BACKUP} from './durable-backend.ts';
import {inspectCheckpoint,stateFromCheckpoint} from './checkpoint.ts';
import {GIRAFFE_CHECKPOINT_CODEC} from './save-v4.ts';
export type GiraffeMaintenanceStatus={kind:'ready';storedSchema:1|2|3|4;readableAs:4;databaseVersion:number;tick:number;currency:number;residents:string[];missions:number;hasV3Backup:boolean}|{kind:'empty'|'blocked'|'unavailable'};
/** Read-only fix-forward pause: no database version request, creation, put, delete, reset or restore. */
export function readGiraffeMaintenance(factory:IDBFactory|undefined,database=SAVE_DATABASE):Promise<GiraffeMaintenanceStatus>{
 if(!factory)return Promise.resolve({kind:'unavailable'});
 return new Promise(resolve=>{let settled=false,absent=false;const finish=(status:GiraffeMaintenanceStatus)=>{if(!settled){settled=true;resolve(status);}};let request:IDBOpenDBRequest;
  try{request=factory.open(database);}catch{finish({kind:'unavailable'});return;}
  request.onupgradeneeded=()=>{absent=true;request.transaction?.abort();};request.onblocked=()=>finish({kind:'blocked'});request.onerror=()=>finish({kind:absent?'empty':'unavailable'});
  request.onsuccess=()=>{const db=request.result;if(settled){db.close();return;}db.onversionchange=()=>db.close();if(db.version>4||!db.objectStoreNames.contains(SAVE_STORE)){db.close();finish({kind:'blocked'});return;}
   try{const tx=db.transaction(SAVE_STORE,'readonly'),store=tx.objectStore(SAVE_STORE),primary=store.get('primary'),previous=store.get('previous'),backupKeys=['elephant-v1-backup','lion-v2-backup',GIRAFFE_V3_BACKUP,'preserved','restart'],backups=backupKeys.map(k=>store.get(k));tx.onabort=tx.onerror=()=>{db.close();finish({kind:'unavailable'});};
    tx.oncomplete=()=>{db.close();const checked=inspectCheckpoint(primary.result,GIRAFFE_CHECKPOINT_CODEC);if(!checked.record){finish({kind:checked.problem==='missing'&&previous.result===undefined&&backups.every(r=>r.result===undefined)?'empty':'blocked'});return;}const state=stateFromCheckpoint(checked.record,GIRAFFE_CHECKPOINT_CODEC);finish({kind:'ready',storedSchema:JSON.parse(checked.record.payload).schemaVersion,readableAs:4,databaseVersion:db.version,tick:state.tick,currency:state.currency,residents:state.animals.filter(a=>a.speciesId==='giraffa-sp').map(a=>a.name),missions:state.giraffePlains.missions.completedIds.length,hasV3Backup:backups[2]!.result!==undefined});};
   }catch{db.close();finish({kind:'unavailable'});}
  };
 });
}
