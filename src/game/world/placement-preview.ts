import type { Point, WorldState } from '../core/state.ts';
export type PlacementReason = 'choose' | 'ready' | 'outside' | 'creek' | 'path' | 'occupied' | 'scenery' | 'limit' | 'command';
export type PlacementKind='habitat'|'path';
export interface PlacementProposal { kind:PlacementKind; anchor:Point; width:1|2; height:1|2; cells:Point[]; }
export interface PlacementView { kind:PlacementKind; active:boolean; revision:number; proposal:PlacementProposal|null; reason:PlacementReason; confirmed:PlacementProposal|null; confirmations:number; }
export type PlacementCommand = 'begin'|'begin-path'|'confirm'|'cancel'|'left'|'right'|'up'|'down';
export const cellKey=(p:Point)=>`${p.x},${p.z}`;
/** Pure, conservative footprint rules shared by preview and the upcoming habitat command. */
export function validatePlacement(world:WorldState, anchor:Point|null, blocked:ReadonlySet<string>,kind:PlacementKind='habitat'):{proposal:PlacementProposal|null;reason:PlacementReason} {
  if(!anchor)return {proposal:null,reason:'choose'};
  if(!Number.isSafeInteger(anchor.x)||!Number.isSafeInteger(anchor.z))return {proposal:null,reason:'outside'};
  const cells=kind==='path'?[{...anchor}]:[{...anchor},{x:anchor.x+1,z:anchor.z},{x:anchor.x,z:anchor.z+1},{x:anchor.x+1,z:anchor.z+1}];
  const proposal:PlacementProposal={kind,anchor:{...anchor},width:kind==='path'?1:2,height:kind==='path'?1:2,cells};
  if(cells.some(c=>c.x<0||c.z<0||c.x>=world.width||c.z>=world.height))return {proposal,reason:'outside'};
  const tiles=cells.map(c=>world.tiles.find(t=>t.cell.x===c.x&&t.cell.z===c.z));
  const reason=tiles.some(t=>!t)?'outside':tiles.some(t=>t!.terrain==='creek')?'creek':tiles.some(t=>t!.path)?'path':tiles.some(t=>t!.occupantId!==null)?'occupied':cells.some(c=>blocked.has(cellKey(c)))?'scenery':'ready';
  return {proposal,reason};
}
export interface PlacementPlannerOptions {
  validate?:(world:WorldState,anchor:Point|null,kind:PlacementKind)=>{proposal:PlacementProposal|null;reason:PlacementReason};
  commit?:(proposal:PlacementProposal,operationId:string)=>boolean;
  operationId?:()=>string;
}
/** Candidate state is local; an optional authoritative command commits the checked proposal. */
export function createPlacementPlanner(world:()=>WorldState,blocked:ReadonlySet<string>,onChange:(view:PlacementView)=>void,options:PlacementPlannerOptions={}) {
  let active=false,anchor:Point|null=null,confirmed:PlacementProposal|null=null,revision=0,confirmations=0,disposed=false,enabled=true;
  let operationId='';let kind:PlacementKind='habitat',lastPathCell:Point|null=null;
  const validate=(anchor:Point|null)=>options.validate?options.validate(world(),anchor,kind):validatePlacement(world(),anchor,blocked,kind);
  const view=():PlacementView=>({kind,active,revision,...validate(anchor),confirmed:confirmed?structuredClone(confirmed):null,confirmations});
  function emit(){revision++;onChange(view());}
  return {
    begin(value:PlacementKind='habitat'){if(!enabled||disposed||active)return;kind=value;lastPathCell=null;active=true;anchor=null;operationId=options.operationId?.()??`habitat-${crypto.randomUUID()}`;emit();},
    choose(value:Point|null){if(!enabled||disposed||!active)return;anchor=value?{...value}:null;emit();},
    move(dx:number,dz:number){if(!enabled||disposed||!active)return;const w=world(),p=anchor??(kind==='path'?(lastPathCell??w.gate):{x:Math.floor(w.width/2)-1,z:Math.floor(w.height/2)-1});anchor={x:Math.max(-1,Math.min(w.width-1,p.x+dx)),z:Math.max(-1,Math.min(w.height-1,p.z+dz))};emit();},
    confirm(expectedRevision:number){if(!enabled||disposed||!active||revision!==expectedRevision)return false;const checked=validate(anchor);if(checked.reason!=='ready'||!checked.proposal){emit();return false;}if(options.commit&&!options.commit(checked.proposal,operationId)){emit();return false;}confirmed=structuredClone(checked.proposal);confirmations++;lastPathCell=kind==='path'?{...checked.proposal.anchor}:null;active=kind==='path';anchor=null;emit();return true;},
    cancel(){if(!enabled||disposed||!active)return;active=false;anchor=null;emit();},
    setEnabled(value:boolean){enabled=value;},
    snapshot:view,
    dispose(){if(disposed)return;active=false;anchor=null;confirmed=null;disposed=true;emit();},
    inspect:()=>({placementActive:active,placementPathMode:kind==='path',placementRevision:revision,placementValid:active&&view().reason==='ready',placementConfirmedCount:confirmed?1:0,placementConfirmations:confirmations,placementDisposed:disposed}),
  };
}
