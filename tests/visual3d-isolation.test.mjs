import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {join} from 'node:path';
import {discoverVisualInventory} from '../scripts/qa/zebra/visual-inventory.mjs';
test('visual lab uses production mount and bounded synthetic namespace, not a second model/engine',()=>{
 const lab=readFileSync('scripts/qa/visual3d/lab.ts','utf8'),fixture=readFileSync('scripts/qa/visual3d/fixture.ts','utf8');assert.match(lab,/import \{mountFoundationScene\} from '\.\.\/\.\.\/\.\.\/src\/game\/render3d\/foundation-scene.ts'/);assert.doesNotMatch(lab,/createSimulation|setInterval|create\w+(?:Rig|Geometry|ResidentsScene)/);assert.match(fixture,/\^myzootwin-visual3d-/);assert.doesNotMatch(fixture,/SAVE_DATABASE|deleteDatabase|localStorage/);assert.match(lab,/created\.setPaused\?\.\(true\)/);
});
test('no production source or route imports the isolated visual harness',()=>{
 function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);}
 for(const file of walk('src')){const text=readFileSync(file,'utf8');assert.doesNotMatch(text,/(?:scripts\/qa\/visual3d|myzootwin-visual3d-|visual3d-frozen-v4)/,file);}
 const inventory=discoverVisualInventory();assert.equal(inventory.modules.some(m=>m.path.startsWith('scripts/qa/')),false);
});
