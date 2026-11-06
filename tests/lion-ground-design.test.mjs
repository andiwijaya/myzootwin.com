import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {appendLionZone} from '../src/game/world/lion-expansion.ts';
import {prepareSpeciesHabitat} from '../src/game/world/species-habitat.ts';
import {lionGroundRoute,lionGroundHeight,lionSegmentAllowed,lionPointAllowed} from '../src/game/animals/lions/ground.ts';
const source=JSON.parse(readFileSync(new URL('./fixtures/lion-v2-golden.json',import.meta.url),'utf8')).state;
const setup=()=>{const w=prepareSpeciesHabitat(appendLionZone(source.world),{x:3,z:18},'habitat-lion-nav','lion-savanna').world,h=w.habitats.at(-1);w.resources.push({id:'lion-kopje-nav',kind:'lion-kopje',habitatId:h.id,cell:{x:6,z:20},stock:1,capacity:1,revision:0,approaches:[{x:6.5,z:20.5}]});return {w,h};};
test('walkable kopje has a deterministic physical ramp, no side or rear cliff shortcut and reversible descent',()=>{
 const {w,h}=setup(),start={x:4.5,z:23.5},goal={x:6.5,z:20.5},route=lionGroundRoute(w,h,start,goal);assert.ok(route);assert.deepEqual(lionGroundRoute(w,h,start,goal),route);assert.equal(lionGroundHeight(w,h,goal),.65);assert.equal(lionSegmentAllowed(w,h,{x:5.5,z:20.5},goal),false);
 let p=start;for(const q of route){assert.ok(lionSegmentAllowed(w,h,p,q));p=q;}assert.ok(lionGroundRoute(w,h,goal,start));assert.equal(route.length<=128,true);
});
test('navigation refuses fences, obstacle crossing, companion collision and unsupported target cells without mutating world',()=>{
 const {w,h}=setup(),bytes=JSON.stringify(w);assert.equal(lionPointAllowed(w,h,{x:3.2,z:19}),false);assert.equal(lionPointAllowed(w,h,{x:5,z:19},[{x:5.5,z:19}]),false);assert.equal(lionGroundRoute(w,h,{x:4.5,z:23.5},{x:2,z:21}),null);assert.equal(JSON.stringify(w),bytes);
 w.resources.push({id:'lion-meat-nav',kind:'lion-meat',habitatId:h.id,cell:{x:4,z:21},stock:0,capacity:12,revision:0,approaches:[]});assert.equal(lionSegmentAllowed(w,h,{x:4.5,z:20.5},{x:4.5,z:22.5}),false);
});
