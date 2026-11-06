import type {WorldState,Point} from '../core/state.ts';
export const GIRAFFE_WORLD=Object.freeze({width:24,height:26});
export const GIRAFFE_LAYOUT=Object.freeze({x:13,size:7,minZ:1,maxZ:3,defaultZ:2,circulationX:12,reserveMinZ:10});
type Grid=Pick<WorldState,'width'|'height'|'tiles'>;
/** Pure reindex after strict source validation. No caller mutation, money, path or animal side effect.
 * Inactive in product until exact V4 persistence and anchored scene proof pass. */
export function expandGiraffeWorld<W extends Grid>(world:W):W {
 if((world.width!==12&&world.width!==24)||world.height!==26||!Array.isArray(world.tiles)||world.tiles.length!==world.width*26||Object.keys(world.tiles).length!==world.tiles.length)throw new RangeError('Unsupported giraffe expansion layout');
 for(let i=0;i<world.tiles.length;i++){
  const t=world.tiles[i];if(!t||t.cell?.x!==i%world.width||t.cell?.z!==Math.floor(i/world.width)||!['land','creek'].includes(t.terrain)||typeof t.path!=='boolean'||t.occupantId!==null&&typeof t.occupantId!=='string')throw new RangeError('Invalid giraffe expansion tile');
 }
 const next=structuredClone(world);if(world.width===24)return next;
 next.width=24;next.tiles=[];
 for(let z=0;z<26;z++)for(let x=0;x<24;x++)next.tiles.push(x<12?structuredClone(world.tiles[z*12+x]!):{cell:{x,z},terrain:'land',occupantId:null,path:false});
 return next;
}
/** Preview is aligned with the actual saved macaw. Missing macaw returns a locked-preview recommendation only. */
export function recommendedGiraffeAnchor(world:Pick<WorldState,'habitats'>):Point {
 const macaw=world.habitats.find(h=>!('kind'in h)||h.kind==='macaw-aviary');
 const center=macaw?.cells.length?macaw.cells.reduce((sum,c)=>sum+c.z+.5,0)/macaw.cells.length:null;
 return {x:13,z:center===null?2:Math.max(1,Math.min(3,Math.round(center)-3))};
}
