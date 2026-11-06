import type {WorldState} from '../core/state.ts';
export const LION_WORLD=Object.freeze({width:12,height:26});
export const LION_LAYOUT=Object.freeze({anchor:Object.freeze({x:3,z:18}),view:Object.freeze({x:2,z:21}),size:7});
/** Pure append after source validation. Never repairs, recenters or mutates the original grid. */
export function appendLionZone<W extends Pick<WorldState,'width'|'height'|'tiles'>>(world:W):W {
  if(world.width!==12||(world.height!==18&&world.height!==26)||world.tiles.length!==world.width*world.height||Object.keys(world.tiles).length!==world.tiles.length)throw new RangeError('Unsupported lion expansion layout');
  for(let i=0;i<world.tiles.length;i++){
    const t=world.tiles[i];if(!t||t.cell?.x!==i%12||t.cell?.z!==Math.floor(i/12)||!['land','creek'].includes(t.terrain)||typeof t.path!=='boolean'||t.occupantId!==null&&typeof t.occupantId!=='string')throw new RangeError('Invalid lion expansion tile');
  }
  const next=structuredClone(world);
  for(let z=next.height;z<26;z++)for(let x=0;x<12;x++)next.tiles.push({cell:{x,z},terrain:'land',occupantId:null,path:false});
  next.height=26;return next;
}
