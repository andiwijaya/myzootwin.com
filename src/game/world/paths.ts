import type {Point,WorldState} from '../core/state.ts';
import {cellKey,type PlacementProposal,type PlacementReason} from './placement-preview.ts';
import {habitatBlockerKeys} from './build-habitat.ts';
const blockers=habitatBlockerKeys();
export interface HabitatAccess {habitatId:string;connected:boolean;viewingCell:Point|null;route:Point[];adjacentPathCells:Point[];}
export interface PathTopology {reachable:Point[];habitats:HabitatAccess[];pathTiles:number;}
export interface AccessSummary {habitats:number;connected:number;pathTiles:number;reachablePathTiles:number;routeCells:number;}
const neighbors=(p:Point)=>[{x:p.x,z:p.z-1},{x:p.x-1,z:p.z},{x:p.x+1,z:p.z},{x:p.x,z:p.z+1}];
/** Four-neighbor BFS on real path flags only. Proximity/diagonals never grant access. */
export function analyzePaths(world:WorldState):PathTopology{
  const paths=new Map(world.tiles.filter(t=>t.path&&t.terrain==='land'&&t.occupantId===null).map(t=>[cellKey(t.cell),t.cell]));
  const queue:Point[]=[],parent=new Map<string,string|null>(),distance=new Map<string,number>(),gate=cellKey(world.gate);
  if(paths.has(gate)){queue.push({...world.gate});parent.set(gate,null);distance.set(gate,0);}
  for(let head=0;head<queue.length;head++){const current=queue[head],key=cellKey(current);for(const p of neighbors(current)){const next=cellKey(p);if(paths.has(next)&&!parent.has(next)){parent.set(next,key);distance.set(next,distance.get(key)!+1);queue.push({...p});}}}
  const habitats=world.habitats.map(h=>{
    const own=new Set(h.cells.map(cellKey)),adjacent=new Map<string,Point>();
    for(const c of h.cells)for(const p of neighbors(c)){const key=cellKey(p);if(!own.has(key)&&paths.has(key))adjacent.set(key,{...p});}
    const candidates=[...adjacent.values()].filter(p=>parent.has(cellKey(p))).sort((a,b)=>distance.get(cellKey(a))!-distance.get(cellKey(b))!||a.z-b.z||a.x-b.x);
    const viewingCell=candidates[0]??null,route:Point[]=[];let cursor=viewingCell?cellKey(viewingCell):null;
    while(cursor!==null){const p=paths.get(cursor)!;route.unshift({...p});cursor=parent.get(cursor)??null;}
    return {habitatId:h.id,connected:Boolean(viewingCell),viewingCell:viewingCell?{...viewingCell}:null,route,adjacentPathCells:[...adjacent.values()]};
  });
  return {reachable:queue,habitats,pathTiles:paths.size};
}
export function reconcilePathAccess(world:WorldState){const topology=analyzePaths(world),next=structuredClone(world);for(const h of next.habitats)h.viewingCell=topology.habitats.find(a=>a.habitatId===h.id)?.viewingCell??null;return {world:next,topology};}
export function accessSummary(topology:PathTopology):AccessSummary{return {habitats:topology.habitats.length,connected:topology.habitats.filter(h=>h.connected).length,pathTiles:topology.pathTiles,reachablePathTiles:topology.reachable.length,routeCells:topology.habitats.find(h=>h.connected)?.route.length??0};}
export function validatePathPlacement(world:WorldState,anchor:Point|null):{proposal:PlacementProposal|null;reason:PlacementReason}{
  if(!anchor)return {proposal:null,reason:'choose'};
  if(!Number.isSafeInteger(anchor.x)||!Number.isSafeInteger(anchor.z))return {proposal:null,reason:'outside'};
  const proposal:PlacementProposal={kind:'path',anchor:{...anchor},width:1,height:1,cells:[{...anchor}]};
  if(anchor.x<0||anchor.z<0||anchor.x>=world.width||anchor.z>=world.height)return {proposal,reason:'outside'};
  const tile=world.tiles.find(t=>cellKey(t.cell)===cellKey(anchor));
  return {proposal,reason:!tile?'outside':tile.terrain==='creek'?'creek':tile.occupantId!==null?'occupied':tile.path?'path':blockers.has(cellKey(anchor))?'scenery':'ready'};
}
/** A path cell is its own stable idempotent target; pricing/transaction ledger comes in M3. */
export function preparePath(world:WorldState,cell:Point){
  const checked=validatePathPlacement(world,cell);
  if(checked.reason==='path')return {ok:true as const,world:structuredClone(world),cell:{...cell},duplicate:true};
  if(checked.reason!=='ready')return {ok:false as const,reason:checked.reason};
  const next=structuredClone(world);next.tiles.find(t=>cellKey(t.cell)===cellKey(cell))!.path=true;
  return {ok:true as const,world:next,cell:{...cell},duplicate:false};
}
