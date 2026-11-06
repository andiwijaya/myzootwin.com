import type {RuntimeState,Point} from '../core/state.ts';
import type {MultiSpeciesSave as ZooSaveV2} from '../core/zoo-state.ts';
import {elephants} from '../core/species.ts';
import {macawRuntimeView} from '../core/runtime-state.ts';
import {elephantCareInfo,type ElephantCareInfo} from '../animals/elephants/care-info.ts';
import {visitTargetForState,visitorPaths,visitorRoute} from '../visitors/graph.ts';
import {validatePathPlacement} from '../world/paths.ts';
import {recoveryView} from './recovery.ts';
import {PRICES} from './prices.ts';
export interface ElephantPathReview {command:number;cell:Point;}
export interface ElephantRecoveryView {
 active:boolean;command:number;kind:'hidden'|'welcome'|'care'|'funds'|'path'|'space'|'gate'|'steady';action:'none'|'build'|'care'|'path'|'support'|'gate'|'guests';
 balance:number;cost:number;affordable:boolean;name:string|null;animalId:string|null;resourceId:string|null;care:ElephantCareInfo|null;
 path:{cell:Point;missing:number;total:number}|null;waitTicks:number;
}
/** An unpaid route proposal over only legally buildable real cells; never writes a path or clears scenery/occupants. */
export function missingConnection(s:RuntimeState,habitatId:string){
 const world={...s.world,tiles:s.world.tiles.map(t=>({...t,path:t.path||validatePathPlacement(s.world,t.cell).reason==='ready'}))},paths=visitorPaths(world),h=world.habitats.find(h=>h.id===habitatId);if(!h)return null;
 const key=(p:Point)=>`${p.x},${p.z}`,gate=key(world.gate),original=new Map(s.world.tiles.map(t=>[key(t.cell),t.path])),own=new Set(h.cells.map(key)),targets=new Set(h.cells.flatMap(c=>[{x:c.x,z:c.z-1},{x:c.x-1,z:c.z},{x:c.x+1,z:c.z},{x:c.x,z:c.z+1}]).filter(p=>!own.has(key(p))&&paths.has(key(p))).map(key));
 // Lexicographic Dijkstra: minimize actual15ZC purchases before distance. A one-gap repair beats a new shorter road.
 const distance=new Map<string,{builds:number;steps:number}>(),parents=new Map<string,string|null>(),queue:Array<{cell:Point;builds:number;steps:number}>=[];
 if(paths.has(gate)){distance.set(gate,{builds:0,steps:0});parents.set(gate,null);queue.push({cell:world.gate,builds:0,steps:0});}
 let destination:Point|null=null;
 while(queue.length){queue.sort((a,b)=>a.builds-b.builds||a.steps-b.steps||a.cell.z-b.cell.z||a.cell.x-b.cell.x);const next=queue.shift()!,current=key(next.cell),best=distance.get(current)!;if(next.builds!==best.builds||next.steps!==best.steps)continue;if(current!==gate&&targets.has(current)){destination=next.cell;break;}
  for(const n of [{x:next.cell.x,z:next.cell.z-1},{x:next.cell.x-1,z:next.cell.z},{x:next.cell.x+1,z:next.cell.z},{x:next.cell.x,z:next.cell.z+1}]){const id=key(n);if(!paths.has(id)||((current===gate||id===gate)&&n.x!==next.cell.x))continue;const builds=best.builds+(original.get(id)?0:1),steps=best.steps+1,old=distance.get(id);if(old&&(old.builds<builds||old.builds===builds&&old.steps<=steps))continue;distance.set(id,{builds,steps});parents.set(id,current);queue.push({cell:n,builds,steps});}
 }
 if(!destination||visitorRoute(world,world.gate,destination).length<2)return null;const route:Point[]=[];let id:string|null=key(destination);while(id!==null){route.unshift({...paths.get(id)!});id=parents.get(id)??null;}const missing=route.filter(p=>!original.get(key(p)));
 return missing.length?{cell:{...missing[0]!},missing:missing.length,total:missing.length*PRICES.path}:null;
}

/** One truthful next review action. No grant, debit, refill, advancement or optimistic success lives in this view. */
export function elephantRecoveryView(s:RuntimeState):ElephantRecoveryView{
 const v:ElephantRecoveryView={active:false,command:s.economy.nextCommand,kind:'hidden',action:'none',balance:s.currency,cost:0,affordable:true,name:null,animalId:null,resourceId:null,care:null,path:null,waitTicks:0},h=s.world.habitats.find(h=>h.kind==='elephant-grove');if(s.schemaVersion===1||!s.elephantGrove||!h)return v;
 v.active=true;const herd=elephants(s.animals);if(herd.length!==2){v.kind='welcome';v.action='build';return v;}
 const residents=herd.map(a=>({a,info:elephantCareInfo(s as ZooSaveV2,a)})).sort((x,y)=>Number(y.a.hunger>=80||y.a.thirst>=80)-Number(x.a.hunger>=80||x.a.thirst>=80)||x.info.welfare-y.info.welfare||x.a.id.localeCompare(y.a.id)),worst=residents[0]!;
 function care(){v.name=worst.a.name;v.animalId=worst.a.id;v.care=worst.info;v.cost=worst.info.next.coins;v.resourceId=worst.info.next.resourceId;v.affordable=v.cost<=s.currency;}
 function funds(){v.kind='funds';const legacy=recoveryView(macawRuntimeView(s));v.waitTicks=legacy.waitTicks;v.action=legacy.low&&legacy.available&&legacy.kind!=='steady'&&legacy.kind!=='wait'?'support':!s.visitorFlow.open?'gate':'guests';return v;}
 // Critical/low care comes first when it is affordable. Unaffordable guidance gives the real existing income/support route.
 if(worst.info.welfare<60||worst.a.hunger>=80||worst.a.thirst>=80){care();if(!v.affordable)return funds();v.kind='care';v.action='care';return v;}
 if(!visitTargetForState(s,h.id)){v.path=missingConnection(s,h.id);if(!v.path){v.kind='space';v.action='build';return v;}v.cost=PRICES.path;v.affordable=s.currency>=v.cost;if(!v.affordable)return funds();v.kind='path';v.action='path';return v;}
 if(!s.visitorFlow.open){v.kind='gate';v.action='gate';return v;}
 v.kind='steady';v.active=false;return v;
}
