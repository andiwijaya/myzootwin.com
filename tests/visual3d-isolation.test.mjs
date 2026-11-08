import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {join} from 'node:path';
import {discoverVisualInventory} from '../scripts/qa/zebra/visual-inventory.mjs';
import {stateFingerprint} from '../scripts/qa/visual3d/state-fingerprint.ts';
test('QA fingerprint ignores object key order and catches real values/array order without rounding',async()=>{
 const a={cash:0,animals:[{x:1,z:2},{x:3,z:4}],tick:13580},b={tick:13580,animals:[{z:2,x:1},{z:4,x:3}],cash:0};assert.equal(await stateFingerprint(a),await stateFingerprint(b));
 for(const c of [{...b,cash:1},{...b,animals:[...b.animals].reverse()},{...b,animals:[{x:1.0000000001,z:2},{x:3,z:4}]}])assert.notEqual(await stateFingerprint(a),await stateFingerprint(c));
});
test('visual lab uses production mount and bounded synthetic namespace, not a second model/engine',()=>{
 const lab=readFileSync('scripts/qa/visual3d/lab.ts','utf8'),fixture=readFileSync('scripts/qa/visual3d/fixture.ts','utf8');assert.match(lab,/import \{mountFoundationScene\} from '\.\.\/\.\.\/\.\.\/src\/game\/render3d\/foundation-scene.ts'/);assert.doesNotMatch(lab,/createSimulation|setInterval|create\w+(?:Rig|Geometry|ResidentsScene)/);assert.match(fixture,/\^myzootwin-visual3d-/);assert.doesNotMatch(fixture,/SAVE_DATABASE|deleteDatabase|localStorage/);assert.match(lab,/created\.setPaused\?\.\(true\)/);
});
test('no production source or route imports the isolated visual harness',()=>{
 function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);}
 for(const file of walk('src')){const text=readFileSync(file,'utf8');assert.doesNotMatch(text,/(?:scripts\/qa\/visual3d|myzootwin-visual3d-|visual3d-frozen-v4)/,file);}
 const inventory=discoverVisualInventory();assert.equal(inventory.modules.some(m=>m.path.startsWith('scripts/qa/')),false);
});
