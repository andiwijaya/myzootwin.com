import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {inspectAnchor,recommendAnchor,planRoute,proveLayout,budget,ZEBRA_DESIGN} from '../scripts/qa/zebra/layout-design.mjs';
import {canonical,readBaselineStates} from '../scripts/qa/zebra/baseline-fixtures.mjs';
import {migrateToV4} from '../src/game/persistence/save-v4.ts';
const state=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v4-golden.json',import.meta.url))).state;
test('real earned V4 admits 64-cell design, real cardinal external connection and grant-only 6000-tick budget',()=>{
 const before=canonical(state),proof=proveLayout(state);assert.equal(canonical(state),before);assert.deepEqual(proof.anchor,{x:14,z:12});assert.equal(new Set(proof.footprint.map(c=>`${c.x},${c.z}`)).size,64);assert.equal(proof.route.paidCells.length,4);assert.equal(proof.budget.spent,1304);assert.equal(proof.budget.reserve,396);assert.equal(proof.budget.affordable,true);assert.equal(proof.oldHabitatAccessUnchanged,true);assert.equal(proof.strictSaveClaim,false);assert.equal(Object.values(ZEBRA_DESIGN.welfare).reduce((a,b)=>a+b,0),1);
});
test('all migrated baseline fixtures preserve state during layout recommendation and reject wrong map/origin',()=>{
 for(const f of readBaselineStates()){const s=migrateToV4(f.state).value,before=canonical(s);assert.equal(inspectAnchor(s.world,{x:14,z:12}).reason,'ready');assert.equal(canonical(s),before);}
 for(const mutate of [w=>w.width=25,w=>w.height=27,w=>w.tiles.pop()]){const w=structuredClone(state.world);mutate(w);assert.equal(inspectAnchor(w,{x:14,z:12}).reason,'map');}
});
test('blocked footprint uses bounded next valid anchor, never deletes improvements, reports exhaustion',()=>{
 for(const [field,value,reason] of [['path',true,'path'],['occupantId','player-improvement','occupied'],['terrain','creek','creek']]){const w=structuredClone(state.world);w.tiles.find(t=>t.cell.x===14&&t.cell.z===12)[field]=value;const before=canonical(w);assert.equal(inspectAnchor(w,{x:14,z:12}).reason,reason);assert.deepEqual(recommendAnchor(w).anchor,{x:15,z:12});assert.equal(canonical(w),before);}
 const w=structuredClone(state.world);w.tiles.find(t=>t.cell.x===15&&t.cell.z===14).path=true;assert.equal(recommendAnchor(w).anchor,null);
 for(const anchor of [{x:13,z:12},{x:16,z:12},{x:14,z:15}])assert.equal(inspectAnchor(state.world,anchor).reason,'zone');assert.equal(inspectAnchor(state.world,{x:23,z:25}).reason,'outside');assert.equal(inspectAnchor(state.world,{x:14.5,z:12}).reason,'outside');
});
test('disconnected gate/walled corridor and overlong cost fail rather than pretending access or affordable setup',()=>{
 const w=structuredClone(state.world);for(const t of w.tiles)if(t.cell.x===12||t.cell.x===13)t.occupantId='blocked-qa';assert.equal(planRoute(w,{x:14,z:12}),null);
 const missingGate=structuredClone(state.world);missingGate.tiles.find(t=>t.cell.x===1&&t.cell.z===8).path=false;assert.equal(planRoute(missingGate,{x:14,z:12}),null);
 assert.equal(budget({cost:15*21}).affordable,false);
});
