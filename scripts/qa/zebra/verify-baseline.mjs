import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {files,sha256} from '../tooling.mjs';
import {canonical,sha256 as hash} from './baseline-fixtures.mjs';
const base='docs/qa/zebra/z0-02/',r=JSON.parse(await readFile(base+'browser.json','utf8')),build=JSON.parse(await readFile('.qa/zebra/z0-02/render/source.json','utf8'));
const golden=JSON.parse(await readFile('tests/fixtures/giraffe-v4-golden.json','utf8')).state;
const before=JSON.parse(await readFile('.qa/zebra-audit/z0-02-before.json','utf8')),after=JSON.parse(await readFile('.qa/zebra-audit/z0-02-after.json','utf8'));
assert.equal(canonical(before),canonical(golden));assert.equal(canonical(before),canonical(after));assert.ok(r.stateEqual&&r.persistedEqual&&r.valid);
assert.equal(r.owners,1);assert.equal(r.maxOwners,1);assert.equal(r.cleanup.owners,0);assert.equal(r.console.length,0);
for(const v of r.views){assert.equal(v.canvas,1);assert.ok(v.documentWidth<=v.width);assert.equal(v.paused,'true');}
const retired=r.cleanup.retired.at(-1);
for(const key of ['pendingFrames','simulationSubscribers','geometries','textures','ownedMaterialsLive','cleanupErrors'])assert.equal(retired[key],0,key);
// A renderer info counter is not an owned-resource counter. H1-08 must measure
// repeated lifecycle growth; this freeze step neither certifies nor hides it.
assert.equal(retired.disposed,true);
const productFiles=await files('.qa/zebra/z0-02/product');
for(const p of productFiles.filter(p=>/\.(js|html)$/.test(p)))assert.ok(!/giraffe-qa-|giraffe-product-|zebra-v1-v4-baseline|visual3d/.test(await readFile(p,'utf8')),p+' leaked QA');
const log=await readFile('.qa/zebra-audit/z0-02-regression.log'),text=log.toString(),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number(text.match(new RegExp('^# '+k+' ([0-9]+)$','m'))?.[1])]));
assert.ok(counts.tests>0&&counts.tests===counts.pass&&counts.fail===0);
const screenshots=[];for(const path of ['desktop-id.jpg','portrait-id.jpg','landscape-id.jpg']){const bytes=await readFile(base+path);screenshots.push({path,bytes:bytes.length,sha256:sha256(bytes)});}
const report={at:new Date().toISOString(),id:'Z0-02',status:'PASS',source:build.source,build:build.build.id,rendererSourceHash:build.rendererHash,fixtures:12,stateSha256:hash(canonical(golden)),originalEqualsNativeBeforeAndAfter:true,tests:{counts,log:'.qa/zebra-audit/z0-02-regression.log',sha256:sha256(log)},screenshots,productPages:productFiles.filter(p=>p.endsWith('index.html')).length,qaAbsentFromProduct:true,cleanup:{ownedFramesSubscribersGeometriesTexturesMaterialsErrors:0,rendererProgramCounter:retired.programs,repeatedLifecycle:'UNRUN until H1-08',note:'First verification incorrectly asserted literal program count zero and failed at observed1. Ownership checks now remain distinct from renderer counters, as the harness specification requires. No leak-free claim.'},performance:'No active soak; presented FPS UNMEASURED'};
await writeFile(base+'verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,counts,source:build.source,build:build.build.id,remainingProgramCounter:retired.programs}));
