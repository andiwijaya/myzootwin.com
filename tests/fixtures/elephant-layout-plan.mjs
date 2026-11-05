import {createInitialState} from '../../src/game/core/initial-state.ts';
// Design fixture only. It is intentionally not a playable V1 save or a migration.
export const grovePlan=Object.freeze({width:12,height:18,legacyOriginX:6,legacyOriginZ:5,anchor:Object.freeze({x:3,z:11}),size:6,view:Object.freeze({x:2,z:13}),grant:1400});
export const connector=Object.freeze([[1,9],[1,10],[2,10],[2,11],[2,12],[2,13]].map(([x,z])=>Object.freeze({x,z})));
export function plannedWorld(){
  const world=structuredClone(createInitialState().world);world.height=grovePlan.height;
  for(let z=10;z<world.height;z++)for(let x=0;x<world.width;x++)world.tiles.push({cell:{x,z},terrain:'land',occupantId:null,path:false});
  return world;
}
export function plannedCells(anchor=grovePlan.anchor){return Array.from({length:36},(_,i)=>({x:anchor.x+i%6,z:anchor.z+Math.floor(i/6)}));}
export const plannedScene=p=>({x:p.x+.5-grovePlan.legacyOriginX,z:p.z+.5-grovePlan.legacyOriginZ});
