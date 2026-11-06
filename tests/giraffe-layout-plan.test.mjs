import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {giraffeDesignWorld,designAnchor,giraffeDesignRoute} from './fixtures/giraffe-layout-plan.mjs';
import {visitorRoute,visitTargetForState,visitTargetsForState} from '../src/game/visitors/graph.ts';import {habitatBlockerKeys} from '../src/game/world/build-habitat.ts';
const golden=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v3-golden.json',import.meta.url),'utf8')).state;
test('design reconstructs 624 row-major cells, preserves every old coordinate, and leaves the entire reserve vacant',()=>{
 const before=JSON.stringify(golden),w=giraffeDesignWorld(golden.world);assert.equal(w.width,24);assert.equal(w.height,26);assert.equal(w.tiles.length,624);
 for(const t of golden.world.tiles)assert.deepEqual(w.tiles[t.cell.z*24+t.cell.x],t);
 for(const t of w.tiles.filter(t=>t.cell.x>=12))assert.deepEqual(t,{cell:t.cell,terrain:'land',occupantId:null,path:false});
 assert.equal(JSON.stringify(golden),before);assert.deepEqual(w.resources,golden.world.resources);assert.deepEqual(w.habitats,golden.world.habitats);
});
test('plot anchor follows the saved macaw band and never moves old residents or invents a macaw',()=>{
 assert.deepEqual(designAnchor(golden.world),{x:13,z:2});
 for(const [z,expected] of [[3,1],[4,2],[5,3],[7,3]]){const w=structuredClone(golden.world),h=w.habitats.find(h=>h.kind==='macaw-aviary');h.cells=[{x:3,z},{x:4,z},{x:3,z:z+1},{x:4,z:z+1}];assert.deepEqual(designAnchor(w),{x:13,z:expected});}
 assert.deepEqual(designAnchor({...golden.world,habitats:[]}),{x:13,z:2});
});
test('real path legality and visitor BFS permit a paid land connector around the creek without touching reserved land',()=>{
 const {state,anchor,purchases,cost,target}=giraffeDesignRoute(golden),w=state.world,blockers=habitatBlockerKeys();assert.ok(purchases.length>0);assert.equal(cost,purchases.length*15);assert.deepEqual(anchor,{x:13,z:2});
 assert.ok(target.route.every(c=>{const t=w.tiles[c.z*24+c.x];return t.path&&t.terrain==='land'&&t.occupantId===null&&(c.x===1&&c.z===8||!blockers.has(`${c.x},${c.z}`));}));
 assert.ok(purchases.every(c=>c.x<12||c.z<10));for(const t of w.tiles.filter(t=>t.cell.x>=12&&t.cell.z>=10))assert.equal(t.path||t.occupantId!==null,false);
 const last=purchases.at(-1);w.tiles[last.z*24+last.x].path=false;assert.deepEqual(visitorRoute(w,w.gate,target.cell),[]);
});
test('quoted grant covers real legal route, complete facilities, initial topups and upkeep with at least150 reserve',()=>{
 const {cost}=giraffeDesignRoute(golden),spent=700+2*90+75+90+65+cost+2*12+6+4+8;assert.ok(1850-spent>=150,JSON.stringify({cost,spent,reserve:1850-spent}));
});

test('geometric planning may quote an empty plot but visitor targeting never sends guests to an unpopulated giraffe habitat',()=>{
 const {state,target}=giraffeDesignRoute(golden);assert.ok(target.route.length>1);assert.equal(visitTargetForState(state,'habitat-giraffe-design'),null);assert.ok(visitTargetsForState(state).every(t=>t.habitatId!=='habitat-giraffe-design'));
});
