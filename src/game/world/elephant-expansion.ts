import type {WorldState} from '../core/state.ts';

export const LEGACY_WORLD = Object.freeze({width:12,height:10});
export const ELEPHANT_WORLD = Object.freeze({width:12,height:18});
type WorldGrid = Pick<WorldState,'width'|'height'|'tiles'>;

/** Append-only preparation, not a save decoder. Call only after validating the source save.
 * It remains inactive in the product until scene anchoring and the V2 persistence gate pass.
 * Unsupported layouts refuse expansion rather than silently reshaping player data. */
export function appendElephantZone<W extends WorldGrid>(world:W):W {
  if(world.width!==LEGACY_WORLD.width||(world.height!==LEGACY_WORLD.height&&world.height!==ELEPHANT_WORLD.height))throw new RangeError('Unsupported elephant expansion layout');
  if(!Array.isArray(world.tiles)||world.tiles.length!==world.width*world.height||Object.keys(world.tiles).length!==world.tiles.length)throw new RangeError('Invalid expansion grid');
  for(let i=0;i<world.tiles.length;i++){
    const tile=world.tiles[i];
    if(!tile||tile.cell?.x!==i%world.width||tile.cell?.z!==Math.floor(i/world.width)||!['land','creek'].includes(tile.terrain)||typeof tile.path!=='boolean'||(tile.occupantId!==null&&typeof tile.occupantId!=='string'))throw new RangeError('Invalid expansion tile');
  }
  const next=structuredClone(world);
  if(next.height===ELEPHANT_WORLD.height)return next;
  for(let z=LEGACY_WORLD.height;z<ELEPHANT_WORLD.height;z++)for(let x=0;x<next.width;x++)next.tiles.push({cell:{x,z},terrain:'land',occupantId:null,path:false});
  next.height=ELEPHANT_WORLD.height;
  return next;
}
