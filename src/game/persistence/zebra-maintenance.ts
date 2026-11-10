import {SAVE_DATABASE,SAVE_STORE,ZEBRA_V4_BACKUP} from './durable-backend.ts';
import {inspectCheckpoint,stateFromCheckpoint} from './checkpoint.ts';
import {ZEBRA_CHECKPOINT_CODEC} from './save-v5.ts';
import {GIRAFFE_CHECKPOINT_CODEC} from './save-v4.ts';
export type ZebraMaintenanceStatus={kind:'ready';storedSchema:1|2|3|4|5;readableAs:5;databaseVersion:number;tick:number;currency:number;habitats:number;animals:number;zebras:number;hasV4Backup:boolean}|{kind:'empty'|'blocked'|'unavailable'};
/** Compatible no-write pause. No requested version, schema upgrade, writer backend,
 * put/delete/reset, fallback restoration or game/renderer/simulation owner. */
export function readZebraMaintenance(factory:IDBFactory|undefined,database=SAVE_DATABASE):Promise<ZebraMaintenanceStatus>{
 if(!factory)return Promise.resolve({kind:'unavailable'});
 return new Promise(resolve=>{
  let settled=false,absent=false;const finish=(value:ZebraMaintenanceStatus)=>{if(!settled){settled=true;resolve(value);}};let open:IDBOpenDBRequest;
  try{open=factory.open(database);}catch{finish({kind:'unavailable'});return;}
  open.onupgradeneeded=()=>{absent=true;open.transaction?.abort();};open.onblocked=()=>finish({kind:'blocked'});open.onerror=event=>{event.preventDefault();finish({kind:absent?'empty':'unavailable'});};
  open.onsuccess=()=>{
   const db=open.result;if(settled){db.close();return;}db.onversionchange=()=>db.close();
   if(db.version>5||!db.objectStoreNames.contains(SAVE_STORE)){db.close();finish({kind:'blocked'});return;}
   try{
    const version=db.version,tx=db.transaction(SAVE_STORE,'readonly'),store=tx.objectStore(SAVE_STORE),primary=store.get('primary'),previous=store.get('previous'),keys=['elephant-v1-backup','lion-v2-backup','giraffe-v3-backup',ZEBRA_V4_BACKUP,'preserved','restart'],other=keys.map(key=>store.get(key));
    tx.onabort=tx.onerror=()=>{db.close();finish({kind:'unavailable'});};
    tx.oncomplete=()=>{
     db.close();try{
      const checked=inspectCheckpoint(primary.result,ZEBRA_CHECKPOINT_CODEC);
      if(!checked.record){finish({kind:checked.problem==='missing'&&previous.result===undefined&&other.every(r=>r.result===undefined)?'empty':'blocked'});return;}
      const schema=JSON.parse(checked.record.payload).schemaVersion as 1|2|3|4|5,backup=other[3]!.result,backupChecked=inspectCheckpoint(backup,GIRAFFE_CHECKPOINT_CODEC),hasV4Backup=Boolean(backupChecked.record&&JSON.parse(backupChecked.record.payload).schemaVersion===4);
      if(schema===5&&(version!==5||!hasV4Backup)){finish({kind:'blocked'});return;}
      const state=stateFromCheckpoint(checked.record,ZEBRA_CHECKPOINT_CODEC);
      finish({kind:'ready',storedSchema:schema,readableAs:5,databaseVersion:version,tick:state.tick,currency:state.currency,habitats:state.world.habitats.length,animals:state.animals.length,zebras:state.animals.filter(a=>a.speciesId==='equus-quagga').length,hasV4Backup});
     }catch{finish({kind:'blocked'});}
    };
   }catch{db.close();finish({kind:'unavailable'});}
  };
 });
}
