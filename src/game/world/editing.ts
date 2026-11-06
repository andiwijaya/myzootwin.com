import {giraffes,type GiraffeHabitat} from '../core/giraffe-state.ts';
import {giraffePointAllowed,giraffeSegmentAllowed} from '../animals/giraffes/ground.ts';
import type {ZooSave} from '../core/zoo-state.ts';
import {groundPointAllowed} from '../animals/elephants/ground.ts';
import {visitorRemovalReason} from '../visitors/navigation.ts';
import type {Point,RuntimeWorld,RuntimeState} from '../core/state.ts';
import {refundable} from '../economy/refunds.ts';
export type EditTarget={kind:'habitat';id:string}|{kind:'path';cell:Point}|{kind:'elephant-resource';id:string}|{kind:'lion-resource';id:string}|{kind:'giraffe-resource';id:string};
export type EditReason='missing'|'protected'|'in-use'|'stale'|'funds'|'command'|'visitor-route'|'visitor-occupied'|'capacity'|'elephant-using'|'elephant-space'|'lion-using'|'lion-space'|'giraffe-using'|'giraffe-space';
export interface RemovalQuote {revision:number;command:number;target:EditTarget;refund:number;}
export interface EditorState {revision:number;undo:null|{before:RuntimeWorld;after:RuntimeWorld;refundIds:string[]};}
export interface EditView {canUndo:boolean;undoCost?:number;reason:EditReason|null;result:'removed'|'restored'|null;}
export const targetId=(target:EditTarget)=>target.kind!=='path'?target.id:`path-${target.cell.x}-${target.cell.z}`;
export function quoteRemoval(state:RuntimeState,target:EditTarget,revision:number):{ok:true;quote:RemovalQuote}|{ok:false;reason:EditReason}{
  if(target.kind==='elephant-resource'||target.kind==='lion-resource'||target.kind==='giraffe-resource'){
    const r=state.world.resources.find(r=>r.id===target.id);if(!r)return {ok:false,reason:'missing'};
    if(!r.kind.startsWith(target.kind==='giraffe-resource'?'giraffe-':target.kind==='lion-resource'?'lion-':'elephant-'))return {ok:false,reason:'protected'};
    if(state.animals.some(a=>a.targetResourceId===r.id))return {ok:false,reason:target.kind==='giraffe-resource'?'giraffe-using':target.kind==='lion-resource'?'lion-using':'elephant-using'};
  }else if(target.kind==='habitat'){
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
export function removedWorld(world:RuntimeWorld,target:EditTarget):RuntimeWorld{
  const next=structuredClone(world);
  if(target.kind==='elephant-resource'||target.kind==='lion-resource'||target.kind==='giraffe-resource'){next.resources=next.resources.filter(r=>r.id!==target.id);}
  else if(target.kind==='habitat'){next.habitats=next.habitats.filter(h=>h.id!==target.id);for(const tile of next.tiles)if(tile.occupantId===target.id)tile.occupantId=null;}
  else {const tile=next.tiles.find(t=>t.cell.x===target.cell.x&&t.cell.z===target.cell.z);if(tile)tile.path=false;}
  return next;
}
export const sameWorld=(a:RuntimeWorld,b:RuntimeWorld)=>JSON.stringify(a)===JSON.stringify(b);

/** Undo cannot rebuild a solid prop through an actual elephant or its committed approach. */
export function elephantRestorationBlocked(state:ZooSave){
 if(state.schemaVersion===1)return false;
 return state.animals.some(a=>{if(a.speciesId!=='elephas-maximus')return false;const h=state.world.habitats.find(h=>h.id===a.habitatId&&h.kind==='elephant-grove');return !h||!groundPointAllowed(state.world,h,a.position)||Boolean(a.target&&!groundPointAllowed(state.world,h,a.target));});
}

/** Restore only the removed elephant prop; passive stock/portion consumption elsewhere stays current. */
export function elephantResourceUndoWorld(world:RuntimeWorld,undo:NonNullable<EditorState['undo']>):RuntimeWorld|null{
 const removed=undo.before.resources.filter(r=>!undo.after.resources.some(a=>a.id===r.id));
 if(removed.length!==1||!(removed[0]!.kind.startsWith('elephant-')||removed[0]!.kind.startsWith('lion-')||removed[0]!.kind.startsWith('giraffe-'))||undo.before.resources.length!==undo.after.resources.length+1)return null;
 const prop=removed[0]!,without={...undo.before,resources:undo.before.resources.filter(r=>r.id!==prop.id)};
 if(!sameWorld(without,undo.after))return null;
 const structure=(w:RuntimeWorld)=>({...w,resources:w.resources.map(r=>({...r,stock:0,...('portions'in r?{portions:r.portions===null?null:[0,0]as[number,number]}:{})}))});
 if(!sameWorld(structure(world),structure(undo.after)))return null;
 const next=structuredClone(world),index=undo.before.resources.findIndex(r=>r.id===prop.id);next.resources.splice(index,0,structuredClone(prop));return next;
}

/** A restored solid prop cannot intersect a live giraffe or its committed approach route. */
export function giraffeRestorationBlocked(state:RuntimeState){return giraffes(state.animals).some(a=>{const h=state.world.habitats.find((h):h is GiraffeHabitat=>h.kind==='giraffe-plains'&&h.id===a.habitatId);if(!h||!giraffePointAllowed(state.world,h,a.position)||a.target&&!giraffePointAllowed(state.world,h,a.target))return true;let from=a.position;for(const to of a.motion.waypoints.slice(a.motion.waypointIndex)){if(!giraffeSegmentAllowed(state.world,h,from,to))return true;from=to;}return false;});}
