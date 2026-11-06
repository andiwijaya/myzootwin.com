import {missingConnection} from '../../src/game/economy/elephant-recovery.ts';
import {preparePath} from '../../src/game/world/paths.ts';
import {visitTargets} from '../../src/game/visitors/graph.ts';
const geometricTarget=(s,id)=>visitTargets(s.world).find(t=>t.habitatId===id)??null;
/** Executable design fixture only; not an activated save or a migration codec. */
export function giraffeDesignWorld(world){
 if(world.width!==12||world.height!==26||world.tiles.length!==312)throw Error('Expected frozen V3');
 const next=structuredClone(world);next.width=24;next.tiles=[];
 for(let z=0;z<26;z++)for(let x=0;x<24;x++)next.tiles.push(x<12?structuredClone(world.tiles[z*12+x]):{cell:{x,z},terrain:'land',occupantId:null,path:false});
 return next;
}
export function designAnchor(world){const macaw=world.habitats.find(h=>h.kind==='macaw-aviary');return {x:13,z:macaw?Math.max(1,Math.min(3,Math.round(macaw.cells.reduce((n,c)=>n+c.z+.5,0)/macaw.cells.length)-3)):2};}
export function giraffeDesignRoute(state){
 const next=structuredClone(state);next.world=giraffeDesignWorld(state.world);const anchor=designAnchor(next.world),cells=[];
 for(let z=anchor.z;z<anchor.z+7;z++)for(let x=13;x<20;x++)cells.push({x,z});
 const home={id:'habitat-giraffe-design',kind:'giraffe-plains',cells,viewingCell:null};next.world.habitats.push(home);
 for(const c of cells)next.world.tiles[c.z*24+c.x].occupantId=home.id;
 const purchases=[];for(let i=0;i<624;i++){if(geometricTarget(next,home.id))return {state:next,anchor,purchases,cost:purchases.length*15,target:geometricTarget(next,home.id)};const quote=missingConnection(next,home.id);if(!quote)break;const built=preparePath(next.world,quote.cell);if(!built.ok||built.duplicate)throw Error('Design path is illegal');next.world=built.world;purchases.push(quote.cell);}
 throw Error('No legal land route');
}
