import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {sha256} from '../tooling.mjs';

const dir='docs/qa/zebra/hp6-04',out='public/images/home',source='5e9baca9108ba4eca52e5abcfcf24b8571736720';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const receipt=async path=>{const b=await readFile(path),m=await sharp(b).metadata();return{path,sha256:sha256(b),bytes:b.length,width:m.width,height:m.height};};
const records=await json('.qa/zebra-audit/hp6-04-capture-browser.json');
for(const r of records){assert.equal(r.source,source);assert.equal(r.state.sha256,'e70827160d1c40e22b0bf3b63cdc8a4ec3a327ea76b5ab19e3cc0489b62921ed');assert.equal(r.state.tick,27849);assert.equal(r.state.actors.length,14);assert.equal(r.frames.nativeDeliveries,0);assert.equal(r.frames.manualTime,0);assert.deepEqual(r.errors,[]);assert.deepEqual(r.failures,[]);}
const crops={overview:{left:30,top:160,width:770,height:520},zebra:{left:90,top:210,width:660,height:460}};
const transforms=[];
for(const [kind,widths]of [['overview',[480,770]],['zebra',[440,660]]]){
 const file=dir+'/'+(kind==='overview'?'overview':'zebra')+'-native.jpg',crop=crops[kind];
 const m=await sharp(file).metadata();assert.equal(m.width,1385);assert.equal(m.height,865);
 for(const width of widths){const path=out+'/v5-'+(kind==='overview'?'zoo':'zebra')+'-'+width+'.webp';await sharp(file).extract(crop).resize({width,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(path);transforms.push({source:file,crop,operation:'Native screenshot crop, downsize only, WebP quality82',...await receipt(path)});}
}
const social=out+'/v5-zoo-social.jpg';
await sharp(dir+'/overview-native.jpg').extract(crops.overview).resize(1200,630,{fit:'contain',background:'#e9eee4',withoutEnlargement:true}).jpeg({quality:85,mozjpeg:true}).toFile(social);
transforms.push({source:dir+'/overview-native.jpg',crop:crops.overview,operation:'Contain original crop without enlargement on1200x630 solid background; no text/animals or gameplay composited',...await receipt(social)});
const capturePath='.qa/zebra-audit/hp6-04-capture-browser.json',captureBytes=await readFile(capturePath);
const provenance={source,sourceBuild:'.qa/visual3d/h1-03-zebra-homepromo2/source.json',scope:'Actual original product V5 renderer/assets and camera. Previously created isolated synthetic QA fixture, low quality, frozen at tick27849; not public availability, a new grant, native active-time or physical-device proof. Screenshot CSS viewport1400x900; native raster1385x865 excludes host chrome/scrollbar. Crops lie inside the visible canvas; no pose/state edits.',sources:await Promise.all(['overview-native','zebra-native'].map(n=>receipt(dir+'/'+n+'.jpg'))),captureReceipt:{path:capturePath,bytes:captureBytes.length,sha256:sha256(captureBytes)},poses:records.slice(0,2).map(r=>({label:r.label,at:r.at,source:r.source,state:r.state,canvas:r.ui.canvas,cameraEnvelopes:r.cameraEnvelopes.map(e=>({kind:e.kind,inside:e.inside})),constructedSites:r.provenance.constructedSites,unmapped:r.provenance.unmapped})),transforms,publication:'Candidate images explicitly captioned V5 preview; current public game still has four habitats. Old useful images retained.'};
await writeFile(dir+'/image-provenance.json',JSON.stringify(provenance,null,2)+'\n');console.log(JSON.stringify(transforms.map(t=>({path:t.path,bytes:t.bytes,width:t.width,height:t.height}))));
