import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendElephantZone} from '../src/game/world/elephant-expansion.ts';
import {preparePath} from '../src/game/world/paths.ts';
import {visitorRoute} from '../src/game/visitors/graph.ts';
import {connector,grovePlan} from './fixtures/elephant-layout-plan.mjs';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));

test('append-only expansion preserves every old tile index and all nine legacy world projections without sharing references',()=>{
  for(const [id,{state}] of Object.entries(frozen.entries)){
    const before=structuredClone(state),next=appendElephantZone(state.world);
    assert.equal(next.height,18,id);assert.equal(next.width,12);assert.equal(next.tiles.length,216);
    assert.deepEqual(next.tiles.slice(0,120),state.world.tiles,id);
    assert.deepEqual({...next,height:10,tiles:next.tiles.slice(0,120)},state.world,id);
    assert.deepEqual(state,before,id);assert.notEqual(next,state.world);assert.notEqual(next.tiles[0].cell,state.world.tiles[0].cell);
    for(const tile of next.tiles.slice(120)){assert.equal(tile.terrain,'land');assert.equal(tile.path,false);assert.equal(tile.occupantId,null);assert.ok(tile.cell.z>=10);}
  }
});

test('repeated expansion preserves player changes in the new zone and never auto-builds or removes anything',()=>{
  const old=frozen.entries.q04Claimed.state.world,next=appendElephantZone(old);
  next.tiles.find(t=>t.cell.x===1&&t.cell.z===10).path=true;
  const repeated=appendElephantZone(next);assert.deepEqual(repeated,next);assert.notEqual(repeated,next);
  assert.equal(repeated.tiles.filter(t=>t.terrain==='creek').length,old.tiles.filter(t=>t.terrain==='creek').length);
  assert.deepEqual(repeated.habitats,old.habitats);assert.deepEqual(repeated.resources,old.resources);assert.deepEqual(repeated.gate,old.gate);
});

test('authoritative existing path commands connect the appended zone and preserve the original habitat and paths',()=>{
  const old=frozen.entries.q04Claimed.state.world;let next=appendElephantZone(old);
  for(const cell of connector){const result=preparePath(next,cell);assert.equal(result.ok,true);next=result.world;}
  const route=visitorRoute(next,next.gate,grovePlan.view);assert.equal(route.length,connector.length+1);
  const expected=structuredClone(old.tiles);expected.find(t=>t.cell.x===1&&t.cell.z===9).path=true;
  assert.deepEqual(next.tiles.slice(0,120),expected);assert.deepEqual(next.habitats,old.habitats);
  next.tiles.find(t=>t.cell.x===1&&t.cell.z===10).path=false;assert.deepEqual(visitorRoute(next,next.gate,grovePlan.view),[]);
});

test('unsupported, sparse, duplicated, reordered and malformed grids refuse expansion without changing input',()=>{
  const world=frozen.entries.new.state.world;
  for(const mutate of [w=>w.width=11,w=>w.height=11,w=>w.tiles.pop(),w=>delete w.tiles[3],w=>w.tiles[1].cell={...w.tiles[0].cell},w=>w.tiles.reverse(),w=>w.tiles[0].terrain='ocean',w=>w.tiles[0].path=1]){
    const bad=structuredClone(world);mutate(bad);const before=structuredClone(bad);assert.throws(()=>appendElephantZone(bad),RangeError);assert.deepEqual(bad,before);
  }
});
