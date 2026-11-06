import {SAVE_DATABASE,SAVE_STORE} from './durable-backend.ts';
import {inspectCheckpoint,stateFromCheckpoint} from './checkpoint.ts';
import {LION_CHECKPOINT_CODEC} from './save-v3.ts';

export type LionMaintenanceStatus = {kind:'ready';tick:number;currency:number;residents:string[];missions:number;schema:3;databaseVersion:number}|{kind:'empty'|'blocked'|'unavailable'};

/** A rollback maintenance response: no version request, store creation, put, delete or automatic restore. */
export function readLionMaintenance(factory:IDBFactory|undefined,database=SAVE_DATABASE):Promise<LionMaintenanceStatus>{
 if(!factory)return Promise.resolve({kind:'unavailable'});
 return new Promise(resolve=>{
  let settled=false,absent=false;const finish=(status:LionMaintenanceStatus)=>{if(!settled){settled=true;resolve(status);}};
  let request:IDBOpenDBRequest;try{request=factory.open(database);}catch{finish({kind:'unavailable'});return;}
  request.onupgradeneeded=()=>{absent=true;request.transaction?.abort();};
  request.onblocked=()=>finish({kind:'blocked'});
  request.onerror=()=>finish({kind:absent?'empty':'unavailable'});
  request.onsuccess=()=>{
   const db=request.result;if(settled){db.close();return;}db.onversionchange=()=>db.close();
   if(db.version>3||!db.objectStoreNames.contains(SAVE_STORE)){db.close();finish({kind:'blocked'});return;}
   try{
    const tx=db.transaction(SAVE_STORE,'readonly'),store=tx.objectStore(SAVE_STORE),primary=store.get('primary'),previous=store.get('previous'),backups=['elephant-v1-backup','lion-v2-backup','preserved','restart'].map(key=>store.get(key));
    tx.onabort=tx.onerror=()=>{db.close();finish({kind:'unavailable'});};
    tx.oncomplete=()=>{
     db.close();const checked=inspectCheckpoint(primary.result,LION_CHECKPOINT_CODEC);
     if(!checked.record){finish({kind:checked.problem==='missing'&&previous.result===undefined&&backups.every(request=>request.result===undefined)?'empty':'blocked'});return;}
     const state=stateFromCheckpoint(checked.record,LION_CHECKPOINT_CODEC);
     finish({kind:'ready',schema:3,databaseVersion:db.version,tick:state.tick,currency:state.currency,residents:state.animals.filter(a=>a.speciesId==='panthera-leo').map(a=>a.name),missions:state.lionSavanna.missions.completedIds.length});
    };
   }catch{db.close();finish({kind:'unavailable'});}
  };
 });
}
