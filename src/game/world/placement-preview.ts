import type { Point, RuntimeWorld } from '../core/state.ts';
import {sceneOrigin} from './scene-coordinates.ts';
export type PlacementReason = 'choose' | 'ready' | 'outside' | 'creek' | 'path' | 'occupied' | 'scenery' | 'limit' | 'command' | 'funds' | 'capacity' | 'zone' | 'locked';
export type PlacementKind='habitat'|'path';
export interface PlacementProposal { kind:PlacementKind; anchor:Point; width:1|2|6|7|8; height:1|2|6|7|8; cells:Point[]; }
export interface PlacementView { kind:PlacementKind; habitatKind?:import('../core/species.ts').HabitatKind; pending?:true; failure?:'storage'; active:boolean; revision:number; proposal:PlacementProposal|null; reason:PlacementReason; confirmed:PlacementProposal|null; confirmations:number; }
export type PlacementCommand = 'begin'|'begin-path'|'confirm'|'cancel'|'left'|'right'|'up'|'down';
export const cellKey=(p:Point)=>`${p.x},${p.z}`;
/** Pure, conservative footprint rules shared by preview and the upcoming habitat command. */
export function validatePlacement(world:Pick<RuntimeWorld,'width'|'height'|'tiles'>, anchor:Point|null, blocked:ReadonlySet<string>,kind:PlacementKind='habitat',footprint:2|6|7|8=2):{proposal:PlacementProposal|null;reason:PlacementReason} {
  if(!anchor)return {proposal:null,reason:'choose'};
  if(!Number.isSafeInteger(anchor.x)||!Number.isSafeInteger(anchor.z))return {proposal:null,reason:'outside'};
  if((footprint!==2&&footprint!==6&&footprint!==7&&footprint!==8)||(footprint===7&&world.height!==26)||(footprint===8&&(world.width!==24||world.height!==26)))return {proposal:null,reason:'command'};
  const size=kind==='path'?1:footprint;
  const cells=Array.from({length:size*size},(_,i)=>({x:anchor.x+i%size,z:anchor.z+Math.floor(i/size)}));
  const proposal:PlacementProposal={kind,anchor:{...anchor},width:size,height:size,cells};
  if(cells.some(c=>c.x<0||c.z<0||c.x>=world.width||c.z>=world.height))return {proposal,reason:'outside'};
  const tiles=cells.map(c=>world.tiles.find(t=>t.cell.x===c.x&&t.cell.z===c.z));
  const reason=tiles.some(t=>!t)?'outside':tiles.some(t=>t!.terrain==='creek')?'creek':tiles.some(t=>t!.path)?'path':tiles.some(t=>t!.occupantId!==null)?'occupied':cells.some(c=>blocked.has(cellKey(c)))?'scenery':'ready';
  return {proposal,reason};
}
export interface PlacementPlannerOptions {
  validate?:(world:RuntimeWorld,anchor:Point|null,kind:PlacementKind)=>{proposal:PlacementProposal|null;reason:PlacementReason};
  commit?:(proposal:PlacementProposal,operationId:string)=>boolean|Promise<boolean>;
  operationId?:()=>string;
}
/** Candidate state is local; an optional authoritative command commits the checked proposal. */
export function createPlacementPlanner(world:()=>RuntimeWorld,blocked:ReadonlySet<string>,onChange:(view:PlacementView)=>void,options:PlacementPlannerOptions={}) {
  let active=false,anchor:Point|null=null,confirmed:PlacementProposal|null=null,revision=0,confirmations=0,disposed=false,enabled=true,pending=false;
  let operationId='';let kind:PlacementKind='habitat',lastPathCell:Point|null=null;
  const validate=(anchor:Point|null)=>options.validate?options.validate(world(),anchor,kind):validatePlacement(world(),anchor,blocked,kind);
  const view=():PlacementView=>({kind,active,revision,...validate(anchor),...(pending?{pending:true as const}:{}),confirmed:confirmed?structuredClone(confirmed):null,confirmations});
  function emit(){revision++;onChange(view());}
  function settle(proposal:PlacementProposal,accepted:boolean){pending=false;if(disposed)return false;if(!accepted){emit();return false;}confirmed=structuredClone(proposal);confirmations++;lastPathCell=kind==='path'?{...proposal.anchor}:null;active=kind==='path';anchor=null;emit();return true;}
  return {
    begin(value:PlacementKind='habitat'){if(!enabled||disposed||active||pending)return;kind=value;lastPathCell=null;active=true;anchor=null;operationId=options.operationId?.()??`habitat-${crypto.randomUUID()}`;emit();},
    choose(value:Point|null){if(!enabled||disposed||!active||pending)return;anchor=value?{...value}:null;emit();},
    move(dx:number,dz:number){if(!enabled||disposed||!active||pending)return;const w=world(),origin=sceneOrigin(w),p=anchor??(kind==='path'?(lastPathCell??w.gate):{x:Math.floor(origin.x)-1,z:Math.floor(origin.z)-1});anchor={x:Math.max(-1,Math.min(w.width-1,p.x+dx)),z:Math.max(-1,Math.min(w.height-1,p.z+dz))};emit();},
    confirm(expectedRevision:number){if(!enabled||disposed||!active||pending||revision!==expectedRevision)return false;const checked=validate(anchor);if(checked.reason!=='ready'||!checked.proposal){emit();return false;}const proposal=structuredClone(checked.proposal);try{const accepted=options.commit?.(proposal,operationId)??true;if(typeof accepted==='boolean')return settle(proposal,accepted);pending=true;emit();return accepted.then(result=>settle(proposal,result),()=>settle(proposal,false));}catch{return settle(proposal,false);}},
    cancel(){if(!enabled||disposed||!active||pending)return;active=false;anchor=null;emit();},
    setEnabled(value:boolean){enabled=value;},
    refresh(){if(active&&!disposed&&!pending)emit();},
    snapshot:view,
    dispose(){if(disposed)return;active=false;anchor=null;confirmed=null;pending=false;disposed=true;emit();},
    inspect:()=>({placementActive:active,placementPathMode:kind==='path',placementRevision:revision,placementValid:active&&!pending&&view().reason==='ready',placementConfirmedCount:confirmed?1:0,placementConfirmations:confirmations,placementDisposed:disposed,...(pending?{placementPending:true}:{} )}),
  };
}
