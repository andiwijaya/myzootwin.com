import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {discoverVisualInventory} from '../scripts/qa/zebra/visual-inventory.mjs';
const frozen=JSON.parse(readFileSync(new URL('../docs/qa/zebra/z0-03/inventory.json',import.meta.url),'utf8'));
const extension=JSON.parse(readFileSync(new URL('./fixtures/zebra-visual-v5-extension.json',import.meta.url),'utf8'));
const releaseExtension=JSON.parse(readFileSync(new URL('./fixtures/zebra-release-public-extension.json',import.meta.url),'utf8'));
const glbExtension=JSON.parse(readFileSync(new URL('./fixtures/glb-visual-extension.json',import.meta.url),'utf8'));
const focusExtension=JSON.parse(readFileSync(new URL('./fixtures/habitat-focus-visual-extension.json',import.meta.url),'utf8'));
const withoutLine=({line,...record})=>record;
// Keep the immutable Z0-03 receipt. H1 found Box3Helper and spray's Object3D transform helper omitted by the original regex.
// Compare its original source inventory after projecting out that explicit scanner correction.
const addedType=t=>t?.endsWith('Helper')||t==='Object3D'||t==='LOD';
const normalize=r=>({...r,modules:r.modules.map(m=>({...m,constructors:m.constructors.filter(c=>!addedType(c.type))})),assets:r.assets.filter(a=>!addedType(a.type)).map(({assetId,...a})=>a),publicAssets:r.publicAssets.map(({builtReferences,...asset})=>asset)});
test('all production-reachable visual sources and nested geometry/part sites remain registered without needing QA build artifacts',()=>{
 const actual=discoverVisualInventory(),current=normalize(actual),historical=normalize(frozen);
 // Z2 adds a species data module to the runtime closure. Keep historical visual factories,
 // assets and media exact; core contract changes are covered by the V1-V4 golden projections.
 // Do not rewrite the immutable Z0 receipt or reject an intentional nonvisual schema extension.
 // Z2-03 adds one original Zebra fence factory and three reviewed integration modules.
 // The explicit GLB extension binds the reviewed migration to exact source and
 // public hashes. All other original render modules remain exact. Never rewrite Z0.
 const integration=new Set(['src/game/render3d/foundation-scene.ts','src/game/render3d/placement-preview.ts','src/game/render3d/preview-controller.ts']),newFactory='src/game/render3d/zebra/world-scene.ts';
 const protectedModule=m=>m.path.startsWith('src/game/render3d/')&&!integration.has(m.path)&&!m.path.startsWith('src/game/render3d/zebra/')&&m.path!=='src/game/render3d/scene-selection.ts';
 const migrated=new Set(glbExtension.changedPaths),retiredModules=new Set(glbExtension.retiredModules.map(m=>m.path)),ordered=(a,b)=>(a.path??a.sourcePath).localeCompare(b.path??b.sourcePath);
 assert.deepEqual([...retiredModules],['src/game/render3d/visitor-scene.ts']);
 for(const m of glbExtension.retiredModules){assert.deepEqual(m,historical.modules.find(h=>h.path===m.path));assert.equal(createHash('sha256').update(readFileSync(new URL('../'+m.path,import.meta.url),'utf8').replace(/\r\n/g,'\n')).digest('hex'),m.sha256,'Legacy visitor source remains exact but is no longer reached by the product');}
 assert.deepEqual([...migrated].filter(p=>!p.startsWith('src/game/render3d/glb/')).sort(),['src/game/render3d/elephant-residents-scene.ts','src/game/render3d/macaw/autonomous-birds.ts','src/game/render3d/macaw/macaw-studio.ts']);
 // Reviewed habitat zoom changes camera framing/picking and adds a reversible view mask.
 // Keep all animal, scenery and lighting factories pinned to their original receipts.
 const focusPaths=new Set(focusExtension.changedPaths);
 assert.deepEqual([...focusPaths].sort(),['src/game/render3d/camera-controls.ts','src/game/render3d/camera-navigation.ts','src/game/render3d/habitat-focus.ts','src/game/render3d/scene-picking.ts']);
 for(const predecessor of focusExtension.predecessors)assert.equal(historical.modules.find(m=>m.path===predecessor.path)?.sha256,predecessor.sha256);
 const priorModules=[...historical.modules.filter(m=>protectedModule(m)&&!migrated.has(m.path)&&!retiredModules.has(m.path)),...glbExtension.modules.filter(protectedModule)];
 assert.deepEqual(current.modules.filter(protectedModule),[...priorModules.filter(m=>!focusPaths.has(m.path)),...focusExtension.modules].sort(ordered),'Only the explicit zoom extension may change protected camera/render sources');
 const protectedAsset=a=>!integration.has(a.sourcePath)&&!a.sourcePath.startsWith('src/game/render3d/zebra/')&&a.sourcePath!=='src/game/render3d/scene-selection.ts';
 const priorAssets=[...historical.assets.filter(a=>protectedAsset(a)&&!migrated.has(a.sourcePath)&&!retiredModules.has(a.sourcePath)),...glbExtension.assets.filter(protectedAsset)];
 assert.deepEqual(current.assets.filter(protectedAsset),[...priorAssets.filter(a=>!focusPaths.has(a.sourcePath)),...focusExtension.assets].sort(ordered),'Original parts remain exact outside the explicit GLB and zoom extensions');
 for(const path of integration)assert.deepEqual(current.assets.filter(a=>a.sourcePath===path).map(({line,...a})=>a),(path==='src/game/render3d/foundation-scene.ts'?glbExtension.assets:historical.assets).filter(a=>a.sourcePath===path).map(({line,...a})=>a),'Reviewed integration constructors/parts: '+path);
 // HP6 adds one reviewed preview image and five exact original capture derivatives.
 // Keep original media bytes/provenance exact; only two retired source references change.
 const originalStatic=new Set(historical.staticVisuals.map(a=>a.assetId));
 assert.deepEqual(current.staticVisuals.filter(a=>originalStatic.has(a.assetId)).map(withoutLine),historical.staticVisuals.map(withoutLine));
 assert.deepEqual(current.staticVisuals.filter(a=>!originalStatic.has(a.assetId)).map(withoutLine),extension.staticAdditions);
 assert.ok(current.staticVisuals.every(a=>Number.isSafeInteger(a.line)&&a.line>0));
 assert.deepEqual(current.generatedResources,historical.generatedResources);
 const retired=new Map(extension.retiredSourceReferences.map(a=>[a.path,a.sourceStringReferences]));
 const reviewed=readFileSync(new URL('../'+releaseExtension.evidence.path,import.meta.url));
 assert.equal(createHash('sha256').update(reviewed).digest('hex'),releaseExtension.evidence.sha256);
 const audit=JSON.parse(gunzipSync(reviewed));assert.equal(audit.source,releaseExtension.reviewedSource);
 const accepted=new Map([...historical.publicAssets.map(a=>retired.has(a.path)?{...a,sourceStringReferences:retired.get(a.path)}:a),...extension.publicAdditions].map(a=>[a.path,a]));
 const metadataOnly=new Set(['giraffes-480.webp','giraffes-800.webp','zoo-640.webp','zoo-960.webp','zoo-social.jpg'].map(n=>'public/images/home/'+n));
 assert.equal(releaseExtension.changes.length,6);assert.equal(releaseExtension.additions.length,1);
 for(const {before,after}of releaseExtension.changes){
  assert.deepEqual(accepted.get(before.path),before,'Exact historical predecessor '+before.path);assert.equal(after.path,before.path);
  if(metadataOnly.has(before.path)){const {provenance:_old,...old}=before,{provenance:_new,...next}=after;assert.deepEqual(next,old,'Existing media bytes/references unchanged '+before.path);}
  else assert.equal(before.path,'public/licenses/third-party-notices.txt','Only reviewed vendor notice may change bytes');
  accepted.set(after.path,after);
 }
 for(const added of releaseExtension.additions){assert.equal(added.path,'public/licenses/vite-MIT.txt');assert.ok(!accepted.has(added.path));accepted.set(added.path,added);}
 for(const record of [...releaseExtension.changes.map(r=>r.after),...releaseExtension.additions]){
  const audited=audit.publicAssets.find(a=>a.path===record.path);assert.ok(audited,'Actual reviewed R7-06 distribution '+record.path);
  assert.equal(record.sha256,audited.sha256);assert.equal(record.bytes,audited.bytes);
  assert.deepEqual(record.provenance,[{id:audited.record,rights:audited.rights,origin:audited.origin}]);
 }
 const glbEvidence=readFileSync(new URL('../'+glbExtension.evidence.path,import.meta.url));
 assert.equal(createHash('sha256').update(glbEvidence).digest('hex'),glbExtension.evidence.sha256);
 const glbAudit=normalize(JSON.parse(gunzipSync(glbEvidence)));
 assert.deepEqual(glbAudit.modules.filter(m=>migrated.has(m.path)),glbExtension.modules.filter(m=>migrated.has(m.path)));
 assert.equal(glbExtension.publicAdditions.length,123);
 for(const added of glbExtension.publicAdditions){
  assert.match(added.path,/^public\/(?:_headers$|zoo-(?:assets|environment|fixtures)\/v01\/)/);
  assert.ok(!accepted.has(added.path));assert.deepEqual(added,glbAudit.publicAssets.find(a=>a.path===added.path));
  assert.ok(Array.isArray(added.provenance)&&added.provenance.length===1,'Content-hash-bound GLB provenance '+added.path);
  accepted.set(added.path,added);
 }
 assert.deepEqual(current.publicAssets,[...accepted.values()].sort((a,b)=>a.path.localeCompare(b.path)),'All copied assets remain exactly reviewed; no unregistered addition/deletion/content/provenance drift');
 assert.equal(createHash('sha256').update(readFileSync(new URL('../'+extension.evidence.path,import.meta.url))).digest('hex'),extension.evidence.sha256);
 assert.equal(extension.staticAdditions.length,1);assert.equal(extension.publicAdditions.length,5);
 assert.ok(extension.publicAdditions.every(a=>Array.isArray(a.provenance)&&a.provenance.length===1&&a.provenance[0].rights==='original_project_work_no_external_art_inputs'));
 assert.ok(actual.modules.some(m=>m.path===newFactory&&m.family==='zebra'));
 assert.deepEqual(actual.unresolved,[]);assert.equal(new Set(actual.assets.map(a=>a.assetId)).size,actual.assets.length);
 for(const family of ['macaw','elephant','lion','giraffe','zebra','environment','visitors','lighting','camera-picking'])assert.ok(actual.assets.some(a=>a.family===family),family);
 for(const m of actual.modules)for(const target of m.imports)assert.ok(actual.modules.some(x=>x.path===target),target+' missing from runtime closure');
 for(const m of actual.modules.filter(m=>m.path.startsWith('src/game/render3d/')))for(const c of m.constructors)assert.ok(actual.assets.some(a=>a.sourcePath===m.path&&a.type===c.type&&a.line===c.line),m.path+':'+c.line+' omitted');
 assert.ok(actual.assets.some(a=>a.type==='Box3Helper'&&a.sourcePath.endsWith('scene-picking.ts')),'H1 runtime-discovered real helper stays registered');
 assert.ok(actual.assets.some(a=>a.type==='Object3D'&&a.sourcePath.endsWith('elephant-spray.ts')),'real spray instance transform helper stays registered');
});
test('absence/provenance records distinguish actual spray, generated textures/audio and replaced historical media',()=>{
 assert.ok(frozen.assets.some(a=>a.sourcePath.endsWith('elephant-spray.ts')&&a.type==='InstancedMesh'));
 assert.ok(frozen.generatedResources.some(a=>a.category==='renderer-textures'));
 assert.ok(frozen.generatedResources.some(a=>a.category==='audio'));
 assert.ok(frozen.staticVisuals.some(a=>a.sourcePath==='src/components/PlayEntry.astro'&&a.tag==='svg'));
 assert.equal(frozen.notApplicable.find(a=>a.category==='Three.Sprite / SpriteMaterial').status,'NA');
 const png=frozen.publicAssets.find(a=>a.path==='public/images/myzootwin-beranda.png');assert.ok(Array.isArray(png.provenance)&&png.provenance.some(p=>p.id==='journal_hero_png_compat'&&p.rights==='original_project_work_no_external_art_inputs'));
 assert.ok(frozen.assets.every(a=>a.visualStatus==='NOT_RUN'),'Initial source inventory is not a rendered asset acceptance claim');
});
