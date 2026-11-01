import type {EditorState} from '../world/editing.ts';
import type { ZooSaveV1 } from './state.ts';
export interface SanctuarySessionState {checkpoint?(reader:()=>ZooSaveV1,critical?:boolean):void;flush?():void;read():ZooSaveV1|undefined;write(state:ZooSaveV1):void;readEditor():EditorState|undefined;writeEditor(state:EditorState):void;}
const sessions=new WeakMap<object,SanctuarySessionState>();
/** In-memory data only; survives renderer replacement, never browser reload or storage. */
export function sanctuarySessionFor(owner:object):SanctuarySessionState{
  let session=sessions.get(owner);
  if(!session){let data:ZooSaveV1|undefined;let editor:EditorState|undefined;session={readEditor:()=>editor?structuredClone(editor):undefined,writeEditor:value=>{editor=structuredClone(value);},read:()=>data?structuredClone(data):undefined,write:value=>{data=structuredClone(value);}};sessions.set(owner,session);}
  return session;
}
