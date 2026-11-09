import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {sha256} from '../tooling.mjs';

const out='docs/qa/zebra/hp6-01',raw='.qa/zebra-audit/hp6-01';
await mkdir(raw,{recursive:true});
const remote=JSON.parse(await readFile(out+'/remote.json','utf8'));
assert.equal(remote.sha,'634de84ebfeab6c069ca9463527193a4e99ea458');
const check=remote.checkRuns.find(r=>r.name==='Cloudflare Pages');assert.equal(check.conclusion,'success');assert.equal(check.head_sha,remote.sha);
const preview=check.summary.match(/href='(https:\/\/[^']+)'/)?.[1];assert.ok(preview);assert.ok(new URL(preview).hostname.endsWith('.myzootwin-com.pages.dev'));
const local='.qa/visual3d/h1-03-zebra-accessible4/product';
const expected=['Macaw Aviary','Elephant Grove','Lion Savanna','Giraffe Plains'];
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&gt;/g,'>').replace(/&lt;/g,'<');
const plain=s=>decode(s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1],decode(m[2]??m[3])]));
function inspect(html){
 const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
 const meta=Object.fromEntries(metas.filter(a=>a.name||a.property).map(a=>[a.name||a.property,a.content]));
 const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));
 const anchors=[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(m=>({...attrs(m[1]),text:plain(m[2])}));
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(m=>({...attrs(m[1]),body:m[2]}));
 return{lang:attrs(html.match(/<html\b[^>]*>/i)?.[0]??'').lang,title:plain(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]??''),meta,canonical:links.find(a=>a.rel==='canonical')?.href,alternates:links.filter(a=>a.rel==='alternate').map(a=>({lang:a.hreflang,href:a.href})),preloads:links.filter(a=>a.rel==='modulepreload').map(a=>a.href),headings:[...html.matchAll(/<h([123])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>({level:Number(m[1]),text:plain(m[2])})),images:[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>attrs(m[0])),anchors:anchors.map(a=>({href:a.href,text:a.text,lang:a.lang,hreflang:a.hreflang})),scripts:scripts.map(s=>({src:s.src,type:s.type})),structured:scripts.filter(s=>s.type==='application/ld+json').map(s=>JSON.parse(s.body)),faq:[...html.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi)].map(m=>plain(m[1])),hasCanvas:/<canvas\b/i.test(html),zebraClaim:/zebra|equus.quagga/i.test(plain(html.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'')))};
}
async function get(url){const response=await fetch(url,{signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await response.arrayBuffer());assert.equal(response.status,200,url);return{url:response.url,status:response.status,bytes,sha256:sha256(bytes),headers:{type:response.headers.get('content-type'),server:response.headers.get('server'),cfCache:response.headers.get('cf-cache-status'),cacheControl:response.headers.get('cache-control')}};}
const compact=r=>({url:r.url,status:r.status,bytes:r.bytes.length,sha256:r.sha256,headers:r.headers});
const routes=[];
for(const [origin,name] of [['https://myzootwin.com','apex'],[preview,'deployment']])for(const [path,locale] of [['/','id'],['/en/','en']]){
 const response=await get(origin+path),html=response.bytes.toString('utf8'),page=inspect(html),localHtml=await readFile(local+(path==='/'?'/index.html':'/en/index.html'),'utf8'),localPage=inspect(localHtml);
 await writeFile(raw+'/'+name+'-'+locale+'.html',response.bytes);
 assert.equal(page.lang,locale);assert.equal(page.canonical,'https://myzootwin.com'+path);assert.equal(page.zebraClaim,false);assert.equal(page.hasCanvas,false);assert.equal(page.headings.filter(h=>h.level===1).length,1);
 assert.deepEqual(page.headings.filter(h=>h.level===3&&expected.includes(h.text)).map(h=>h.text),expected);assert.equal(page.images.length,2);assert.equal(page.faq.length,3);
 assert.ok(page.anchors.filter(a=>a.href==='/play/').length>=3);assert.ok(page.anchors.some(a=>a.href==='#habitats'));assert.ok(page.anchors.some(a=>a.href===(locale==='id'?'/en/':'/')));
 assert.deepEqual(page.alternates,[{lang:'id',href:'https://myzootwin.com/'},{lang:'en',href:'https://myzootwin.com/en/'},{lang:'x-default',href:'https://myzootwin.com/'}]);
 assert.equal(page.meta['og:locale'],locale==='id'?'id_ID':'en_US');assert.equal(page.meta['og:url'],page.canonical);assert.equal(page.meta['og:title'],page.title);assert.equal(page.meta['og:description'],page.meta.description);assert.equal(page.meta['twitter:title'],page.title);assert.equal(page.meta['twitter:description'],page.meta.description);assert.equal(page.meta['twitter:card'],'summary_large_image');assert.equal(page.meta['og:image:width'],'1200');assert.equal(page.meta['og:image:height'],'630');
 assert.equal(page.structured.length,1);assert.equal(page.structured[0]['@type'],'VideoGame');assert.equal(page.structured[0].aggregateRating,undefined);assert.equal(page.structured[0].review,undefined);assert.equal(page.structured[0].url,'https://myzootwin.com/play/');
 for(const key of ['title','meta','canonical','alternates','headings','images','structured','faq'])assert.deepEqual(page[key],localPage[key],name+locale+key);
 routes.push({origin:name,locale,path,...compact(response),page,localComparison:'Exact baseline metadata/headings/images/structured/FAQ; no full HTML byte-equivalence claim across build environment',localHtmlSha256:sha256(Buffer.from(localHtml))});
}
for(const locale of ['id','en'])assert.equal(routes.find(r=>r.origin==='apex'&&r.locale===locale).sha256,routes.find(r=>r.origin==='deployment'&&r.locale===locale).sha256,'Apex/deployment exact HTML');
const assets=[];const paths=new Set(routes[0].page.images.flatMap(i=>[i.src,...(i.srcset||'').split(',').map(s=>s.trim().split(/\s+/)[0])]).filter(Boolean));paths.add(new URL(routes[0].page.meta['og:image']).pathname);assert.equal(paths.size,5);
for(const path of paths){const r=await get('https://myzootwin.com'+path),bytes=await readFile('public'+path);assert.equal(r.sha256,sha256(bytes),path);assets.push({path,...compact(r),localExact:true});}
const graph=[],seen=new Set(),queue=[...new Set(routes.flatMap(r=>[...r.page.scripts.map(s=>s.src).filter(Boolean),...r.page.preloads]))];
while(queue.length){const path=queue.shift();if(seen.has(path))continue;seen.add(path);assert.ok(path.startsWith('/_astro/'));assert.ok(!/PlayEntry|foundation-scene|three/i.test(path));const r=await get('https://myzootwin.com'+path),text=r.bytes.toString('utf8');assert.equal(r.sha256,sha256(await readFile(local+path)),path);const imports=[...text.matchAll(/\b(?:import|export)\s*(?:[^"'()]*?\sfrom\s*)?["']([^"']+)["']/g)].map(m=>new URL(m[1],'https://myzootwin.com'+path)).map(u=>{assert.equal(u.origin,'https://myzootwin.com');return u.pathname;});queue.push(...imports);graph.push({path,...compact(r),localExact:true,staticImports:imports});assert.ok(seen.size<=20,'Bounded homepage import graph');}
const robots=await get('https://myzootwin.com/robots.txt'),robotsText=robots.bytes.toString('utf8');assert.match(robotsText,/Allow: \//);const sitemapUrl=robotsText.match(/Sitemap:\s*(https:\/\/\S+)/)?.[1];assert.equal(sitemapUrl,'https://myzootwin.com/sitemap-index.xml');const index=await get(sitemapUrl),locs=[...index.bytes.toString('utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));assert.equal(locs.length,1);const sitemap=await get(locs[0]),urls=[...sitemap.bytes.toString('utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));for(const p of ['/','/en/','/play/'])assert.ok(urls.includes('https://myzootwin.com'+p));assert.ok(!urls.some(u=>/visual3d|qa\/|zebra/i.test(u)));
const play=await get('https://myzootwin.com/play/');await writeFile(raw+'/play.html',play.bytes);const playPage=inspect(play.bytes.toString('utf8'));assert.equal(playPage.zebraClaim,false);
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const files=['src/components/ZooHome.astro','src/layouts/BaseLayout.astro','src/pages/index.astro','src/pages/en/index.astro','public/robots.txt','astro.config.mjs'];
const sourceFiles=await Promise.all(files.map(async path=>({path,sha256:sha256(await readFile(path)),productionBlob:git('rev-parse',remote.sha+':'+path),localBlob:git('rev-parse','HEAD:'+path)})));
assert.ok(sourceFiles.every(r=>r.productionBlob===r.localBlob));assert.equal(git('diff',remote.sha,'HEAD','--',...files,'public/images/home'),'');
const productionEntry=git('show',remote.sha+':src/game-entry/game-entry.ts');assert.match(productionEntry,/createGiraffeIndexedDbBackend/);assert.ok(!productionEntry.includes('createZebraIndexedDbBackend'));const productionZebra=git('ls-tree','-r','--name-only',remote.sha,'--','src/game/animals/zebras','src/game/persistence/save-v5.ts');assert.equal(productionZebra,'');
const report={status:'PASS_HTTP_SOURCE_BASELINE',at:new Date().toISOString(),localHeadAtAudit:git('rev-parse','HEAD'),productionCommit:remote.sha,productionDeployment:check.external_id,preview,sourceFiles,routes,assets,homepageStaticGraph:graph,robots:{...compact(robots),text:robotsText},sitemapIndex:compact(index),sitemap:{...compact(sitemap),urls},playMarkup:{...compact(play),title:playPage.title,zebraClaim:false,scope:'HTML/source audit only. Production game engine was not launched and no owner save was opened.'},deployedFeatures:{homepage:'Four hardcoded cards and Giraffe spotlight; no homepage release-toggle API or Zebra live claim',gameEntryBackend:'createGiraffeIndexedDbBackend; maximum deployed codec V4',zebraSourcePresent:false,scope:'Bound to fresh remote main/check-run and exact apex/deployment HTML. No private Cloudflare environment/settings read is claimed.'},candidate:{zebra:'Local QA V5 only; release/bootstrap/grant and R7-08 gates remain open',homepageChanged:false},noPushOrDeploy:true};
await writeFile(out+'/http-source.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,source:report.localHeadAtAudit,production:report.productionCommit,htmlRoutes:routes.length,ownedMedia:assets.length,homepageScriptChunks:graph.length,sitemapUrls:urls.length,zebraLive:false,gameEngineLaunched:false}));
