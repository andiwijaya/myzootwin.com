import type {RuntimeWorld,Point} from '../core/state.ts';
import {habitatBlockerKeys} from './build-habitat.ts';
import {validatePlacement,type PlacementReason} from './placement-preview.ts';
/** Candidate reservation only. Never rewrites saved tiles, removes paths, changes origin or creates a habitat. */
export const ZEBRA_LAYOUT=Object.freeze({width:24,height:26,size:8,minX:14,maxX:15,minZ:12,maxZ:14,defaultX:14,defaultZ:12,corridorMinX:12,corridorMaxX:13,eastReserveX:23,southReserveZ:22});
type World=Pick<RuntimeWorld,'width'|'height'|'tiles'|'habitats'>;
export function validateZebraPlacement(world:World,anchor:Point|null,blocked:ReadonlySet<string>=habitatBlockerKeys()){
 if(world.width!==24||world.height!==26||world.tiles.length!==624||Object.keys(world.tiles).length!==624||world.tiles.some((t,i)=>!t||!t.cell||t.cell.x!==i%24||t.cell.z!==Math.floor(i/24)))return {proposal:null,reason:'command' as const};
 const checked=validatePlacement(world,anchor,blocked,'habitat',8);
 if(checked.reason!=='ready')return checked;
 if(!anchor||anchor.x<ZEBRA_LAYOUT.minX||anchor.x>ZEBRA_LAYOUT.maxX||anchor.z<ZEBRA_LAYOUT.minZ||anchor.z>ZEBRA_LAYOUT.maxZ)return {...checked,reason:'zone' as const};
 if(world.habitats.some(h=>'kind'in h&&h.kind==='zebra-grasslands'))return {...checked,reason:'limit' as const};
 return checked;
}
/** Six deterministic alternatives, all east of the saved circulation and above the southern reserve. */
export function zebraPlacementCandidates(world:World,blocked:ReadonlySet<string>=habitatBlockerKeys()):{anchor:Point;reason:PlacementReason}[]{
 const candidates:{anchor:Point;reason:PlacementReason}[]=[];
 for(let z=ZEBRA_LAYOUT.minZ;z<=ZEBRA_LAYOUT.maxZ;z++)for(let x=ZEBRA_LAYOUT.minX;x<=ZEBRA_LAYOUT.maxX;x++){const anchor={x,z};candidates.push({anchor,reason:validateZebraPlacement(world,anchor,blocked).reason});}
 return candidates;
}
export const recommendedZebraAnchor=(world:World):Point|null=>zebraPlacementCandidates(world).find(c=>c.reason==='ready')?.anchor??null;
/** Read-only descriptions for QA/help; reserved means available future design space, not occupied land. */
export function zebraReservationCells(){
 const corridor:Point[]=[],future:Point[]=[];
 for(let z=0;z<26;z++)for(let x=12;x<24;x++){if(x>=12&&x<=13)corridor.push({x,z});else if(x===23||z>=22)future.push({x,z});}
 return {corridor,future};
}
