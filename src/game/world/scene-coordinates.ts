import type {Point} from '../core/state.ts';
import {ELEPHANT_WORLD,LEGACY_WORLD} from './elephant-expansion.ts';
export interface MapSize {width:number;height:number;}
const legacyOrigin=Object.freeze({x:LEGACY_WORLD.width/2,z:LEGACY_WORLD.height/2});
/** Supported south and lateral extensions retain the original island's world-space origin.
 * Other legacy map dimensions keep their existing centered interpretation. */
export function sceneOrigin(map:MapSize):Readonly<Point> {
  return (map.width===ELEPHANT_WORLD.width&&(map.height===LEGACY_WORLD.height||map.height===ELEPHANT_WORLD.height||map.height===26)||map.width===24&&map.height===26)?legacyOrigin:{x:map.width/2,z:map.height/2};
}
export function toScene(point:Point,map:MapSize,offset=.5):Point {
  const origin=sceneOrigin(map);return {x:point.x+offset-origin.x,z:point.z+offset-origin.z};
}
export function sceneToCell(point:Point,map:MapSize):Point {
  const origin=sceneOrigin(map);return {x:Math.floor(point.x+origin.x),z:Math.floor(point.z+origin.z)};
}
