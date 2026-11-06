import {Plane,Raycaster,Vector2,Vector3,type Camera} from 'three';
import type {Point,RuntimeWorld} from '../core/state.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import {LION_PRICES} from '../animals/lions/rules.ts';
import type {LionResourceKind as LionCareKind} from '../core/species.ts';
import type {LionCareQuote,validateLionCarePlacement} from '../animals/lions/resources.ts';
type LionCareReason=ReturnType<typeof validateLionCarePlacement>['reason']|'capacity'|'duplicate';
export type LionCareCommand='confirm'|'cancel'|'left'|'right'|'up'|'down';
export interface LionCarePreviewView {active:boolean;kind:LionCareKind;cell:Point|null;revision:number;command:number;reason:LionCareReason;price:number;}
interface Authority {command:()=>number;defaultCell:(kind:LionCareKind)=>Point|null;validate:(kind:LionCareKind,cell:Point|null)=>{reason:LionCareReason};commit:(quote:LionCareQuote)=>{ok:boolean;reason?:LionCareReason};}
/** Unpaid local choice only. The existing camera owns gestures, the simulation owns every committed change. */
export function createLionCarePreview(world:()=>Pick<RuntimeWorld,'width'|'height'>,camera:Camera,rect:()=>{left:number;top:number;width:number;height:number},authority:Authority,onChange:()=>void){
 let active=false,kind:LionCareKind='lion-meat',cell:Point|null=null,revision=0,command=0,disposed=false,enabled=true,failure:LionCareReason|null=null;
 const raycaster=new Raycaster(),plane=new Plane(new Vector3(0,1,0),0),intersection=new Vector3();
 const view=():LionCarePreviewView=>({active,kind,cell:cell?{...cell}:null,revision,command,reason:active?(command!==authority.command()?'stale':failure??authority.validate(kind,cell).reason):'ready',price:LION_PRICES[kind]});
 const changed=()=>{revision++;onChange();};
 function choose(p:Point){if(!enabled||disposed||!active)return;cell={...p};failure=null;changed();}
 return {view,begin(next:LionCareKind){if(!enabled||disposed)return;kind=next;cell=authority.defaultCell(kind);command=authority.command();failure=null;active=true;changed();},
  command(action:LionCareCommand,expectedRevision?:number){if(!enabled||disposed||!active)return false;if(action==='cancel'){active=false;cell=null;failure=null;changed();return true;}
   if(action==='confirm'){if(expectedRevision!==revision||view().reason!=='ready'||!cell)return false;const result=authority.commit({command,kind,cell:{...cell}});if(!result.ok){failure=result.reason??'stale';changed();return false;}active=false;cell=null;failure=null;changed();return true;}
   const w=world(),p=cell??authority.defaultCell(kind);if(!p)return false;choose({x:Math.max(-1,Math.min(w.width,p.x+(action==='left'?-1:action==='right'?1:0))),z:Math.max(-1,Math.min(w.height,p.z+(action==='up'?-1:action==='down'?1:0)))});return true;
  },pick(point:{x:number;y:number}){if(!enabled||disposed||!active)return;const b=rect();if(b.width<=0||b.height<=0)return;camera.updateMatrixWorld(true);raycaster.setFromCamera(new Vector2((point.x-b.left)/b.width*2-1,1-(point.y-b.top)/b.height*2),camera);if(raycaster.ray.intersectPlane(plane,intersection)){const origin=sceneOrigin(world());choose({x:Math.floor(intersection.x+origin.x),z:Math.floor(intersection.z+origin.z)});}},
  cancel(){if(!active)return;active=false;cell=null;failure=null;changed();},setEnabled(value:boolean){enabled=value;},dispose(){if(disposed)return;active=false;cell=null;disposed=true;changed();},inspect:()=>({lionCarePreviewActive:active,lionCarePreviewRevision:revision,lionCarePreviewValid:active&&view().reason==='ready',lionCarePreviewDisposed:disposed})};
}
