import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {validateSaveV4} from '../../../src/game/persistence/save-v4.ts';
import {sceneOrigin} from '../../../src/game/world/scene-coordinates.ts';

const directory='docs/qa/zebra/z0-01';
await mkdir(directory,{recursive:true});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const fixture=JSON.parse(await readFile('tests/fixtures/giraffe-v4-golden.json','utf8'));
const checked=validateSaveV4(fixture.state);
assert.ok(checked.ok,JSON.stringify(checked));
const state=checked.value;
assert.deepEqual([state.world.width,state.world.height,state.world.tiles.length],[24,26,624]);
assert.deepEqual(sceneOrigin(state.world),{x:6,z:5});
const browser=JSON.parse(await readFile(directory+'/browser.json','utf8'));
const check=JSON.parse((await readFile(directory+'/cloudflare-check.json','utf8')).replace(/^\uFEFF/,''));
const expected='634de84ebfeab6c069ca9463527193a4e99ea458';
assert.equal(check.head_sha,expected);assert.equal(check.conclusion,'success');
assert.equal(git('rev-parse','origin/main'),expected);
assert.equal(git('diff',expected,'--','src','public','package.json','package-lock.json','astro.config.mjs'),'');
for(const b of browser.baselines){assert.equal(b.habitats.length,4);assert.equal(b.hasZebraClaim,false);assert.equal(b.canvas,0);assert.ok(b.canonical.startsWith('https://myzootwin.com/'));}
assert.equal(browser.baselines.length,2);
const report={at:new Date().toISOString(),status:'PASS',id:'Z0-01',source:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD:src'),branch:git('branch','--show-current'),remote:'andiwijaya/myzootwin.com',remoteMain:expected,production:check,world:{width:24,height:26,cells:624,origin:sceneOrigin(state.world),schemaVersion:state.schemaVersion,residents:state.animals.length,habitats:state.world.habitats.map(h=>h.kind)},fixture:{path:'tests/fixtures/giraffe-v4-golden.json',sha256:createHash('sha256').update(await readFile('tests/fixtures/giraffe-v4-golden.json')).digest('hex'),scope:'Existing synthetic V4 fixture; no owner save'},historicalGiraffe:{reported:'39/42 at the 7 November local handoff',current:'Existing V4 source has since been published; current deployment/homepage identity independently verified. Historical gates are not counted toward Zebra.',presentedFps:'UNMEASURED; no new performance claim'},release:{zebra:'NOT DEPLOYED',authorization:'Local implementation and release preparation only; R7-08 held'},inputAccess:'Complete official Library reads; metadata-preserving Windows materialization separately BLOCKED',browser:'browser.json'};
await writeFile(directory+'/baseline.json',JSON.stringify(report,null,2)+'\n');
console.log('Z0-01 PASS: local/remote/live identities, strict V4 24x26/origin6,5 and four-habitat bilingual baseline reconciled.');
