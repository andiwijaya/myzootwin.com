// Pre-implementation design probe only. Never imported by production or serialized as a V4 save.
import {analyzePaths,validatePathPlacement} from '../../../src/game/world/paths.ts';
import {habitatBlockerKeys} from '../../../src/game/world/build-habitat.ts';
import {sceneOrigin} from '../../../src/game/world/scene-coordinates.ts';
import {PRICES,MONEY_RULES} from '../../../src/game/economy/prices.ts';
import {canonical,sha256} from './baseline-fixtures.mjs';

export const ZEBRA_DESIGN=Object.freeze({version:1,map:{width:24,height:26,origin:{x:6,z:5}},size:8,defaultAnchor:{x:14,z:12},search:{minX:14,maxX:15,minZ:12,maxZ:14},corridor:{minX:12,maxX:13},reserve:{eastX:23,southZ:22},prices:{grant:1700,habitat:700,pasture:90,water:75,shade:90,enrichment:65,foodRefill:12,waterRefill:6,enrichmentRefill:4},reserveCoins:150,sessionTicks:6000,welfare:{nutrition:.25,hydration:.20,rest:.20,space:.15,social:.10,enrichment:.10},boundary:'Fictional game balancing and tile geometry only; not animal care, enclosure scale or veterinary guidance. Proposed prices are frozen for implementation tests, not credited or debited here.'});
const key=p=>`${p.x},${p.z}`;
const adjacent=p=>[{x:p.x,z:p.z-1},{x:p.x-1,z:p.z},{x:p.x+1,z:p.z},{x:p.x,z:p.z+1}];
export const footprint=anchor=>Array.from({length:64},(_,i)=>({x:anchor.x+i%8,z:anchor.z+Math.floor(i/8)}));
export function inspectAnchor(world,anchor){
 if(world.width!==24||world.height!==26||world.tiles.length!==624||canonical(sceneOrigin(world))!==canonical(ZEBRA_DESIGN.map.origin))return {reason:'map',cells:[]};
 if(!anchor||!Number.isSafeInteger(anchor.x)||!Number.isSafeInteger(anchor.z))return {reason:'outside',cells:[]};
 const cells=footprint(anchor),tiles=new Map(world.tiles.map(t=>[key(t.cell),t]));
 if(cells.some(c=>c.x<0||c.z<0||c.x>=24||c.z>=26))return {reason:'outside',cells};
 const s=ZEBRA_DESIGN.search;if(anchor.x<s.minX||anchor.x>s.maxX||anchor.z<s.minZ||anchor.z>s.maxZ)return {reason:'zone',cells};
 const occupied=cells.map(c=>tiles.get(key(c)));
 return {reason:occupied.some(t=>!t)?'outside':occupied.some(t=>t.terrain!=='land')?'creek':occupied.some(t=>t.path)?'path':occupied.some(t=>t.occupantId!==null)?'occupied':cells.some(c=>habitatBlockerKeys().has(key(c)))?'scenery':'ready',cells};
}
export function recommendAnchor(world){
 const candidates=[];for(let z=12;z<=14;z++)for(let x=14;x<=15;x++){const anchor={x,z};candidates.push({anchor,...inspectAnchor(world,anchor)});}
 return {anchor:candidates.find(c=>c.reason==='ready')?.anchor??null,candidates};
}
/** Dijkstra over real legal path placements: existing paths cost zero, new paths cost one.
 * New circulation stays west of the east-wing enclosure. No bulldozing/diagonal connection.
 */
export function planRoute(world,anchor){
 if(inspectAnchor(world,anchor).reason!=='ready')return null;
 const targets=new Set(Array.from({length:8},(_,i)=>key({x:anchor.x-1,z:anchor.z+i}))),tiles=new Map(world.tiles.map(t=>[key(t.cell),t]));
 const oldCells=new Set(world.habitats.flatMap(h=>h.cells.map(key)));
 const allowed=p=>p.x<anchor.x&&(tiles.get(key(p))?.path&&tiles.get(key(p)).occupantId===null&&tiles.get(key(p)).terrain==='land'||validatePathPlacement(world,p).reason==='ready'&&!adjacent(p).some(c=>oldCells.has(key(c))));
 const gate=world.gate;if(!allowed(gate))return null;
 const distances=new Map([[key(gate),tiles.get(key(gate)).path?0:1]]),parents=new Map([[key(gate),null]]),open=[{...gate}];let found=null;
 while(open.length){open.sort((a,b)=>distances.get(key(a))-distances.get(key(b))||a.z-b.z||a.x-b.x);const current=open.shift(),k=key(current);if(targets.has(k)){found=k;break;}for(const p of adjacent(current)){if(!allowed(p))continue;const next=key(p),d=distances.get(k)+(tiles.get(next).path?0:1);if(d<(distances.get(next)??Infinity)){distances.set(next,d);parents.set(next,k);if(!open.some(c=>key(c)===next))open.push(p);}}}
 if(found===null)return null;
 const route=[];for(let k=found;k!==null;k=parents.get(k))route.unshift({...tiles.get(k).cell});
 const paidCells=route.filter(p=>!tiles.get(key(p)).path);return {route,paidCells,cost:paidCells.length*PRICES.path,viewingCell:route.at(-1)};
}
export function budget(route){
 const p=ZEBRA_DESIGN.prices,lines=[['fence',p.habitat],['two stocked pastures',2*p.pasture],['stocked water',p.water],['shade',p.shade],['stocked enrichment',p.enrichment],['paid visitor connection',route.cost],['two food refills',2*p.foodRefill],['one water refill',p.waterRefill],['one enrichment refill',p.enrichmentRefill],['ten minutes of all-five-habitat upkeep',Math.ceil(ZEBRA_DESIGN.sessionTicks/MONEY_RULES.maintenanceTicks)*5*PRICES.maintenance]];
 const spent=lines.reduce((n,[,v])=>n+v,0);return {grant:p.grant,priorCashAssumed:0,ticketOrQuestIncomeAssumed:0,lines:lines.map(([item,cost])=>({item,cost})),spent,reserve:p.grant-spent,minimumReserve:150,affordable:p.grant-spent>=150};
}
export function proveLayout(state){
 const before=canonical(state),selected=recommendAnchor(state.world),anchor=selected.anchor,route=anchor&&planRoute(state.world,anchor);if(!route)throw Error('No legal connected design');
 const world=structuredClone(state.world),cells=footprint(anchor),own=new Set(cells.map(key));for(const t of world.tiles){if(own.has(key(t.cell)))t.occupantId='habitat-zebra-design';if(route.paidCells.some(p=>key(p)===key(t.cell)))t.path=true;}
 world.habitats.push({id:'habitat-zebra-design',kind:'zebra-grasslands',cells,viewingCell:null});
 const topology=analyzePaths(world),access=topology.habitats.find(h=>h.habitatId==='habitat-zebra-design'),oldTopology=analyzePaths(state.world);
 if(!access.connected||!route.route.every((p,i,a)=>!i||Math.abs(p.x-a[i-1].x)+Math.abs(p.z-a[i-1].z)===1)||access.route.some(p=>own.has(key(p))))throw Error('Path is not real outside four-neighbor access');
 for(const old of oldTopology.habitats)if(canonical(old)!==canonical(topology.habitats.find(h=>h.habitatId===old.habitatId)))throw Error('Legacy habitat access changed');
 if(canonical(state)!==before)throw Error('Design mutated source fixture');
 return {design:ZEBRA_DESIGN,fixtureState:sha256(before),anchor,footprint:cells,route,budget:budget(route),oldHabitatAccessUnchanged:true,existingTilesChanged:0,newPaths:route.paidCells,prototypeOnly:true,strictSaveClaim:false,grid:{width:world.width,height:world.height,origin:sceneOrigin(world)},clearance:{corridorColumns:[12,13],eastReserveColumns:[23],southReserveRows:[22,23,24,25],minimumGiraffeGapRows:2},selected};
}
