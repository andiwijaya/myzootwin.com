import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {discoverVisualInventory} from '../scripts/qa/zebra/visual-inventory.mjs';
const frozen=JSON.parse(readFileSync(new URL('../docs/qa/zebra/z0-03/inventory.json',import.meta.url),'utf8'));
// Keep the immutable Z0-03 receipt. H1 found Box3Helper and spray's Object3D transform helper omitted by the original regex.
// Compare its original source inventory after projecting out that explicit scanner correction.
const addedType=t=>t?.endsWith('Helper')||t==='Object3D'||t==='LOD';
const normalize=r=>({...r,modules:r.modules.map(m=>({...m,constructors:m.constructors.filter(c=>!addedType(c.type))})),assets:r.assets.filter(a=>!addedType(a.type)).map(({assetId,...a})=>a),publicAssets:r.publicAssets.map(({builtReferences,...asset})=>asset)});
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
test('all production-reachable visual sources and nested geometry/part sites remain registered without needing QA build artifacts',()=>{
 const actual=discoverVisualInventory();assert.equal(hash(normalize(actual)),hash(normalize(frozen)),'Visual source inventory drift: regenerate only after reviewing changed runtime modules/assets');
 assert.deepEqual(actual.unresolved,[]);assert.equal(new Set(actual.assets.map(a=>a.assetId)).size,actual.assets.length);
 for(const family of ['macaw','elephant','lion','giraffe','environment','visitors','lighting','camera-picking'])assert.ok(actual.assets.some(a=>a.family===family),family);
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
