import {Plane,Raycaster,Vector2,Vector3,type Camera} from 'three';
import type {Point,RuntimeWorld} from '../core/state.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import {GIRAFFE_PRICES} from '../animals/giraffes/rules.ts';
import type {GiraffeResourceKind as GiraffeCareKind} from '../core/giraffe-state.ts';
import type {GiraffeCareQuote,validateGiraffeCarePlacement} from '../animals/giraffes/resources.ts';
type GiraffeCareReason=ReturnType<typeof validateGiraffeCarePlacement>['reason']|'capacity'|'duplicate';
export type GiraffeCareCommand='confirm'|'cancel'|'left'|'right'|'up'|'down';
export interface GiraffeCarePreviewView {active:boolean;kind:GiraffeCareKind;cell:Point|null;revision:number;command:number;reason:GiraffeCareReason;price:number;}
interface Authority {command:()=>number;defaultCell:(kind:GiraffeCareKind)=>Point|null;validate:(kind:GiraffeCareKind,cell:Point|null)=>{reason:GiraffeCareReason};commit:(quote:GiraffeCareQuote)=>{ok:boolean;reason?:GiraffeCareReason};}
/** Unpaid local choice only. The existing camera owns gestures, the simulation owns every committed change. */
export function createGiraffeCarePreview(world:()=>Pick<RuntimeWorld,'width'|'height'>,camera:Camera,rect:()=>{left:number;top:number;width:number;height:number},authority:Authority,onChange:()=>void){
 let active=false,kind:GiraffeCareKind='giraffe-browse',cell:Point|null=null,revision=0,command=0,disposed=false,enabled=true,failure:GiraffeCareReason|null=null;
 const raycaster=new Raycaster(),plane=new Plane(new Vector3(0,1,0),0),intersection=new Vector3();
 const view=():GiraffeCarePreviewView=>({active,kind,cell:cell?{...cell}:null,revision,command,reason:active?(command!==authority.command()?'stale':failure??authority.validate(kind,cell).reason):'ready',price:GIRAFFE_PRICES[kind]});
 const changed=()=>{revision++;onChange();};
 function choose(p:Point){if(!enabled||disposed||!active)return;cell={...p};failure=null;changed();}
 return {view,begin(next:GiraffeCareKind){if(!enabled||disposed)return;kind=next;cell=authority.defaultCell(kind);command=authority.command();failure=null;active=true;changed();},
  command(action:GiraffeCareCommand,expectedRevision?:number){if(!enabled||disposed||!active)return false;if(action==='cancel'){active=false;cell=null;failure=null;changed();return true;}
   if(action==='confirm'){if(expectedRevision!==revision||view().reason!=='ready'||!cell)return false;const result=authority.commit({command,kind,cell:{...cell}});if(!result.ok){failure=result.reason??'stale';changed();return false;}active=false;cell=null;failure=null;changed();return true;}
   const w=world(),p=cell??authority.defaultCell(kind);if(!p)return false;choose({x:Math.max(-1,Math.min(w.width,p.x+(action==='left'?-1:action==='right'?1:0))),z:Math.max(-1,Math.min(w.height,p.z+(action==='up'?-1:action==='down'?1:0)))});return true;
  },pick(point:{x:number;y:number}){if(!enabled||disposed||!active)return;const b=rect();if(b.width<=0||b.height<=0)return;camera.updateMatrixWorld(true);raycaster.setFromCamera(new Vector2((point.x-b.left)/b.width*2-1,1-(point.y-b.top)/b.height*2),camera);if(raycaster.ray.intersectPlane(plane,intersection)){const origin=sceneOrigin(world());choose({x:Math.floor(intersection.x+origin.x),z:Math.floor(intersection.z+origin.z)});}},
  cancel(){if(!active)return;active=false;cell=null;failure=null;changed();},setEnabled(value:boolean){enabled=value;},dispose(){if(disposed)return;active=false;cell=null;disposed=true;changed();},inspect:()=>({giraffeCarePreviewActive:active,giraffeCarePreviewRevision:revision,giraffeCarePreviewValid:active&&view().reason==='ready',giraffeCarePreviewDisposed:disposed})};
}
