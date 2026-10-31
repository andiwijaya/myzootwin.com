import type { Point, WorldState } from '../core/state.ts';
export type PlacementReason = 'choose' | 'ready' | 'outside' | 'creek' | 'path' | 'occupied' | 'scenery';
export interface PlacementProposal { kind:'habitat'; anchor:Point; width:2; height:2; cells:Point[]; }
export interface PlacementView { active:boolean; revision:number; proposal:PlacementProposal|null; reason:PlacementReason; confirmed:PlacementProposal|null; confirmations:number; }
export type PlacementCommand = 'begin'|'confirm'|'cancel'|'left'|'right'|'up'|'down';
export const cellKey=(p:Point)=>`${p.x},${p.z}`;
/** Pure, conservative footprint rules shared by preview and the upcoming habitat command. */
export function validatePlacement(world:WorldState, anchor:Point|null, blocked:ReadonlySet<string>):{proposal:PlacementProposal|null;reason:PlacementReason} {
  if(!anchor)return {proposal:null,reason:'choose'};
  if(!Number.isSafeInteger(anchor.x)||!Number.isSafeInteger(anchor.z))return {proposal:null,reason:'outside'};
  const cells=[{...anchor},{x:anchor.x+1,z:anchor.z},{x:anchor.x,z:anchor.z+1},{x:anchor.x+1,z:anchor.z+1}];
  const proposal:PlacementProposal={kind:'habitat',anchor:{...anchor},width:2,height:2,cells};
  if(cells.some(c=>c.x<0||c.z<0||c.x>=world.width||c.z>=world.height))return {proposal,reason:'outside'};
  const tiles=cells.map(c=>world.tiles.find(t=>t.cell.x===c.x&&t.cell.z===c.z));
  const reason=tiles.some(t=>!t)?'outside':tiles.some(t=>t!.terrain==='creek')?'creek':tiles.some(t=>t!.path)?'path':tiles.some(t=>t!.occupantId!==null)?'occupied':cells.some(c=>blocked.has(cellKey(c)))?'scenery':'ready';
  return {proposal,reason};
}
/** Session-local planning only. It never writes world occupancy, currency or saves. */
export function createPlacementPlanner(world:()=>WorldState,blocked:ReadonlySet<string>,onChange:(view:PlacementView)=>void) {
  let active=false,anchor:Point|null=null,confirmed:PlacementProposal|null=null,revision=0,confirmations=0,disposed=false,enabled=true;
  const view=():PlacementView=>({active,revision,...validatePlacement(world(),anchor,blocked),confirmed:confirmed?structuredClone(confirmed):null,confirmations});
  function emit(){revision++;onChange(view());}
  return {
    begin(){if(!enabled||disposed||active)return;active=true;anchor=null;emit();},
    choose(value:Point|null){if(!enabled||disposed||!active)return;anchor=value?{...value}:null;emit();},
    move(dx:number,dz:number){if(!enabled||disposed||!active)return;const w=world(),p=anchor??{x:Math.floor(w.width/2)-1,z:Math.floor(w.height/2)-1};anchor={x:Math.max(-1,Math.min(w.width-1,p.x+dx)),z:Math.max(-1,Math.min(w.height-1,p.z+dz))};emit();},
    confirm(expectedRevision:number){if(!enabled||disposed||!active||revision!==expectedRevision)return false;const checked=validatePlacement(world(),anchor,blocked);if(checked.reason!=='ready'||!checked.proposal){emit();return false;}confirmed=structuredClone(checked.proposal);confirmations++;active=false;anchor=null;emit();return true;},
    cancel(){if(!enabled||disposed||!active)return;active=false;anchor=null;emit();},
    setEnabled(value:boolean){enabled=value;},
    snapshot:view,
    dispose(){if(disposed)return;active=false;anchor=null;confirmed=null;disposed=true;emit();},
    inspect:()=>({placementActive:active,placementRevision:revision,placementValid:active&&view().reason==='ready',placementConfirmedCount:confirmed?1:0,placementConfirmations:confirmations,placementDisposed:disposed}),
  };
}
