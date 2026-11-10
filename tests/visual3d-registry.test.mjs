import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
import {generateVisualRegistry,instrumentVisualModule} from '../scripts/qa/visual3d/registry-build.mjs';import {tagVisual3d,visualSite} from '../scripts/qa/visual3d/tagging.ts';import {discoverVisualInventory} from '../scripts/qa/zebra/visual-inventory.mjs';
import {runInNewContext} from 'node:vm';import * as Three from 'three';
const registry=generateVisualRegistry();
test('typed registry covers every reachable visual module/site, real generated resources and static/public visuals',()=>{
 const inventory=discoverVisualInventory();assert.equal(new Set(registry.records.map(r=>r.assetId)).size,registry.records.length);assert.equal(registry.renderModules,inventory.visualModuleCount);
 for(const m of inventory.modules.filter(m=>m.path.startsWith('src/game/render3d/')))assert.ok(registry.records.some(r=>r.kind==='module'&&r.sourcePath===m.path));
 for(const a of inventory.assets)assert.ok(registry.records.some(r=>r.assetId===a.assetId));for(const a of inventory.staticVisuals)assert.ok(registry.records.some(r=>r.assetId===a.assetId));
 for(const r of registry.records){assert.match(r.sourceHash,/^[a-f0-9]{64}$/);assert.equal(r.visualStatus,'NOT_RUN');assert.ok(r.owner&&r.provenance.license&&r.stateRule&&r.fallback);assert.deepEqual(r.qualityTiers,['low','high']);if(r.category==='zebra'){assert.deepEqual(r.testFixtures,[{id:'v5-zoo-baseline',status:'PLANNED'}]);}else assert.ok(r.testFixtures.some(f=>f.status==='AVAILABLE'));}
 assert.ok(registry.records.some(r=>r.category==='renderer-textures'));assert.ok(registry.records.some(r=>r.category==='audio'));assert.ok(registry.records.some(r=>r.category==='public-file'||r.kind==='public-file'));assert.equal(registry.dependencies[0].license,'MIT');
});
test('QA constructor transform covers every source constructor exactly once with parseable nested source, no mutation of disk',()=>{
 for(const path of new Set(registry.records.filter(r=>r.kind==='constructor-site').map(r=>r.sourcePath))){const original=readFileSync(path,'utf8'),result=instrumentVisualModule(original,path,registry),expected=registry.records.filter(r=>r.sourcePath===path&&r.kind==='constructor-site').length;assert.ok(result,path);const parsed=ts.createSourceFile(path,result,ts.ScriptTarget.Latest,true);assert.deepEqual(parsed.parseDiagnostics,[],path);let tagged=0;function walk(n){if(ts.isCallExpression(n)&&n.expression.getText(parsed)==='__qaVisual3dTag')tagged++;ts.forEachChild(n,walk);}walk(parsed);assert.equal(tagged,expected,path);assert.equal(readFileSync(path,'utf8'),original);}
 assert.equal(instrumentVisualModule('export const x=1','src/none.ts',registry),null);
});
test('side-table identity tagging changes no object fields, descriptors or arrays and retains distinct owners',()=>{
 const shared=Object.freeze({position:Object.freeze([1,2,3])}),before=Object.getOwnPropertyDescriptors(shared);assert.equal(tagVisual3d(shared,'real-source:1'),shared);assert.equal(visualSite(shared),'real-source:1');assert.deepEqual(Object.getOwnPropertyDescriptors(shared),before);assert.equal(tagVisual3d(3,'ignored'),3);const other={};assert.equal(visualSite(other),undefined);tagVisual3d(other,'real-source:2');assert.equal(visualSite(shared),'real-source:1');
});
test('instrumented actual production macaw rig preserves real geometry/transforms and fails stale source-line mappings',()=>{
 const path='src/game/render3d/macaw/macaw-rig.ts',source=readFileSync(path,'utf8');
 // Use the actual existing factory and actual assets, not a substitute model.
 const transformed=instrumentVisualModule(source,path,registry),calls=[];
 const assetSource=readFileSync('src/game/render3d/macaw/macaw-geometry.ts','utf8');
 const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 function execute(code,deps){const exports={};runInNewContext(compile(code),{exports,require:name=>{if(name==='three')return Three;if(name.endsWith('/tagging.ts'))return {tagVisual3d:(v,id)=>{calls.push(id);return tagVisual3d(v,id);}};if(name in deps)return deps[name];throw Error('Unexpected dependency '+name);}},{timeout:3000});return exports;}
 const assetsModule=execute(assetSource,{}),assets=assetsModule.createMacawAssets();
 const native=execute(source,{'./macaw-geometry.ts':assetsModule}).createMacawRig(assets),instrumented=execute(transformed,{'./macaw-geometry.ts':assetsModule}).createMacawRig(assets);
 const project=root=>{const result=[];root.updateMatrixWorld(true);root.traverse(o=>result.push({type:o.type,name:o.name,position:o.position.toArray(),quaternion:o.quaternion.toArray(),scale:o.scale.toArray(),geometry:o.geometry?.getAttribute('position').array.slice(0,30).toString(),triangles:o.geometry?.getAttribute('position').count}));return result;};
 assert.deepEqual(project(instrumented.root),project(native.root));assert.ok(calls.length>10);assert.ok(calls.every(id=>registry.records.some(r=>r.assetId===id)));native.dispose();instrumented.dispose();assets.dispose();
 const stale=structuredClone(registry);stale.records.find(r=>r.sourcePath===path&&r.kind==='constructor-site').line+=999;assert.throws(()=>instrumentVisualModule(source,path,stale),/Incomplete constructor instrumentation/);
});
