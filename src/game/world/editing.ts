import {visitorRemovalReason} from '../visitors/navigation.ts';
import type {Point,WorldState,ZooSaveV1} from '../core/state.ts';
import {refundable} from '../economy/refunds.ts';
export type EditTarget={kind:'habitat';id:string}|{kind:'path';cell:Point};
export type EditReason='missing'|'protected'|'in-use'|'stale'|'funds'|'command'|'visitor-route'|'visitor-occupied'|'capacity';
export interface RemovalQuote {revision:number;command:number;target:EditTarget;refund:number;}
export interface EditorState {revision:number;undo:null|{before:WorldState;after:WorldState;refundIds:string[]};}
export interface EditView {canUndo:boolean;undoCost?:number;reason:EditReason|null;result:'removed'|'restored'|null;}
export const targetId=(target:EditTarget)=>target.kind==='habitat'?target.id:`path-${target.cell.x}-${target.cell.z}`;
export function quoteRemoval(state:ZooSaveV1,target:EditTarget,revision:number):{ok:true;quote:RemovalQuote}|{ok:false;reason:EditReason}{
  if(target.kind==='habitat'){
    if(!state.world.habitats.some(h=>h.id===target.id))return {ok:false,reason:'missing'};
    if(state.animals.some(a=>a.habitatId===target.id)||state.world.resources.some(r=>r.habitatId===target.id)||state.visitors.some(v=>!v.arrival))return {ok:false,reason:'in-use'};
  }else{
    const c=target.cell,tile=state.world.tiles.find(t=>t.cell.x===c.x&&t.cell.z===c.z);
    if(c.x===state.world.gate.x&&c.z===state.world.gate.z)return {ok:false,reason:'protected'};
    if(!tile?.path)return {ok:false,reason:'missing'};
    const visitorReason=visitorRemovalReason(state,removedWorld(state.world,target),c);if(visitorReason)return {ok:false,reason:visitorReason};
  }
  return {ok:true,quote:{revision,command:state.economy.nextCommand,target:structuredClone(target),refund:refundable(state,targetId(target)).reduce((n,r)=>n+r.amount,0)}};
}
export function removedWorld(world:WorldState,target:EditTarget):WorldState{
  const next=structuredClone(world);
  if(target.kind==='habitat'){next.habitats=next.habitats.filter(h=>h.id!==target.id);for(const tile of next.tiles)if(tile.occupantId===target.id)tile.occupantId=null;}
  else {const tile=next.tiles.find(t=>t.cell.x===target.cell.x&&t.cell.z===target.cell.z);if(tile)tile.path=false;}
  return next;
}
export const sameWorld=(a:WorldState,b:WorldState)=>JSON.stringify(a)===JSON.stringify(b);
