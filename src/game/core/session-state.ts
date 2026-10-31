import type { ZooSaveV1 } from './state.ts';
export interface SanctuarySessionState {read():ZooSaveV1|undefined;write(state:ZooSaveV1):void;}
const sessions=new WeakMap<object,SanctuarySessionState>();
/** In-memory data only; survives renderer replacement, never browser reload or storage. */
export function sanctuarySessionFor(owner:object):SanctuarySessionState{
  let session=sessions.get(owner);
  if(!session){let data:ZooSaveV1|undefined;session={read:()=>data?structuredClone(data):undefined,write:value=>{data=structuredClone(value);}};sessions.set(owner,session);}
  return session;
}
