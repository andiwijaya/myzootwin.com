import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV4} from '../../../src/game/persistence/save-v4.ts';
import {analyzePaths} from '../../../src/game/world/paths.ts';
import {sceneOrigin,toScene} from '../../../src/game/world/scene-coordinates.ts';
import {foodPort} from '../../../src/game/animals/feeding.ts';
import {waterPort} from '../../../src/game/animals/watering.ts';
import {restPort,BIRD_PERCH_HEIGHT} from '../../../src/game/animals/resting.ts';
/** Describe the real immutable earned fixture, never synthesize replacement geometry/engine state. */
export function describeWorldFixture(input:ZooSave){
 const checked=validateSaveV4(input);if(!checked.ok)throw Error('Full Zoo fixture is not strict-valid V4');const s=checked.value,w=s.world,topology=analyzePaths(w);
 const habitats=w.habitats.map(h=>{const resources=w.resources.filter(r=>r.habitatId===h.id),access=topology.habitats.find(a=>a.habitatId===h.id)!;return {id:h.id,kind:h.kind??'macaw-aviary',cells:h.cells.map(p=>({...p})),residents:s.animals.filter(a=>a.habitatId===h.id).map(a=>({id:a.id,species:a.speciesId,phase:a.motion.phase,position:a.position})),resources:resources.map(r=>({id:r.id,kind:r.kind,cell:r.cell,stock:r.stock,capacity:r.capacity,ports:('approaches'in r?r.approaches:[0,1].map(slot=>r.kind==='food'?foodPort(h,slot):r.kind==='water'?waterPort(h,slot):restPort(h,slot))).map(p=>({point:{...p},scene:toScene(p,w,0),height:r.kind==='perch'?.079+BIRD_PERCH_HEIGHT:.11}))})),connected:access.connected,viewingCell:access.viewingCell,route:access.route};});
 const candidate=Array.from({length:64},(_,i)=>({x:14+i%8,z:12+Math.floor(i/8)})),free=candidate.every(c=>{const t=w.tiles[c.z*w.width+c.x];return t?.terrain==='land'&&!t.path&&t.occupantId===null;});
 return {fixtureId:'strict-v4-live-qa-lineage',schema:4,grid:{width:w.width,height:w.height,tiles:w.tiles.length,origin:sceneOrigin(w)},habitats,pathTiles:topology.pathTiles,reachablePaths:topology.reachable,creekTiles:w.tiles.filter(t=>t.terrain==='creek').map(t=>t.cell),resourceKinds:[...new Set(w.resources.map(r=>r.kind))].sort(),visitorIds:s.visitors.map(v=>v.id),zebraReserve:{status:'UNBUILT_V4_LAND_ONLY',candidateCells:64,freeInThisFixture:free,spawnedZebras:0},scope:'Actual strict synthetic V4 world. QA data overlays only; no resource replenishment, free construction, animal spawn or game-state mutation.'};
}
export type WorldFixtureDescription=ReturnType<typeof describeWorldFixture>;
