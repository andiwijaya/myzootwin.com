import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {expandGiraffeWorld,recommendedGiraffeAnchor,GIRAFFE_WORLD} from '../src/game/world/giraffe-expansion.ts';
const golden=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v3-golden.json',import.meta.url),'utf8')).state;
test('actual lateral expansion preserves312 old coordinates and all non-grid data without mutation or freebies',()=>{
 const old=structuredClone(golden.world),next=expandGiraffeWorld(old);assert.deepEqual(GIRAFFE_WORLD,{width:24,height:26});assert.equal(next.tiles.length,624);assert.equal(next.width,24);assert.equal(next.height,26);
 for(const t of old.tiles){assert.deepEqual(next.tiles[t.cell.z*24+t.cell.x],t);assert.notEqual(next.tiles[t.cell.z*24+t.cell.x],t);}
 for(const t of next.tiles.filter(t=>t.cell.x>=12))assert.deepEqual(t,{cell:t.cell,terrain:'land',occupantId:null,path:false});
 assert.deepEqual({...next,width:old.width,tiles:old.tiles},old);assert.deepEqual(old,golden.world);assert.deepEqual(expandGiraffeWorld(next),next);next.tiles[0].cell.x=99;assert.equal(old.tiles[0].cell.x,0);
});
test('row-major reindex catches wrong append-only implementations over32 adversarial legacy grids',()=>{
 for(let seed=0;seed<32;seed++){
  const w=structuredClone(golden.world);for(const [i,t] of w.tiles.entries()){t.terrain=(i+seed)%7===0?'creek':'land';t.path=(i*3+seed)%5===0;t.occupantId=(i+seed)%13===0?`synthetic-${seed}-${i}`:null;}
  const next=expandGiraffeWorld(w);assert.notDeepEqual(next.tiles.slice(0,312),w.tiles);
  for(let z=0;z<26;z++)for(let x=0;x<12;x++)assert.deepEqual(next.tiles[z*24+x],w.tiles[z*12+x]);
  for(let i=0;i<624;i++)assert.deepEqual(next.tiles[i].cell,{x:i%24,z:Math.floor(i/24)});
 }
});
test('unsupported dimensions, sparse arrays, tile reordering and invalid flags fail without repair',()=>{
 for(const change of [w=>w.width=13,w=>w.height=34,w=>w.tiles.pop(),w=>delete w.tiles[12],w=>w.tiles[12].cell.x=1,w=>w.tiles[0].terrain='future',w=>w.tiles[0].path=1,w=>w.tiles[0].occupantId=42,w=>w.tiles.extra=true]){const w=structuredClone(golden.world);change(w);const before=JSON.stringify(w);assert.throws(()=>expandGiraffeWorld(w),RangeError);assert.equal(JSON.stringify(w),before);}
});
test('recommended giraffe placement uses stable macaw footprint rather than a fixed north-south location',()=>{
 assert.deepEqual(recommendedGiraffeAnchor(golden.world),{x:13,z:2});
 for(const [z,expected] of [[3,1],[4,2],[5,3]]){const w=structuredClone(golden.world),h=w.habitats.find(h=>h.kind==='macaw-aviary');for(const c of h.cells)c.z+=z-4;assert.deepEqual(recommendedGiraffeAnchor(w),{x:13,z:expected});}
 assert.deepEqual(recommendedGiraffeAnchor({habitats:[]}),{x:13,z:2});
});
