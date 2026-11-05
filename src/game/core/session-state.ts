import type {EditorState} from '../world/editing.ts';
import type { ZooSaveV1 } from './state.ts';
import type {ZooSave} from './zoo-state.ts';
export interface SanctuarySessionState<State extends ZooSave=ZooSaveV1> {checkpoint?(reader:()=>State,critical?:boolean):void;flush?():void;read():State|undefined;write(state:State):void;readEditor():EditorState|undefined;writeEditor(state:EditorState):void;}
const sessions=new WeakMap<object,SanctuarySessionState>();
/** In-memory data only; survives renderer replacement, never browser reload or storage. */
export function sanctuarySessionFor(owner:object):SanctuarySessionState{
  let session=sessions.get(owner);
  if(!session){let data:ZooSaveV1|undefined;let editor:EditorState|undefined;session={readEditor:()=>editor?structuredClone(editor):undefined,writeEditor:value=>{editor=structuredClone(value);},read:()=>data?structuredClone(data):undefined,write:value=>{data=structuredClone(value);}};sessions.set(owner,session);}
  return session;
}
