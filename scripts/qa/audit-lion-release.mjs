import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {pageMetadata} from './tooling.mjs';

// Read-only checks of the already-built candidate, with an explicit baseline.
const base=process.argv[2];
if(!base)throw Error('Pass the original Elephant dist directory');
const routes=['/','/animals/','/wildlife/','/pets/','/learn/','/adventures/','/gear/','/about/','/play/'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const checks=[];
for(const path of routes){
 const built=await readFile(join('dist',path,'index.html'));
 const response=await fetch('http://127.0.0.1:4367'+path);
 const served=Buffer.from(await response.arrayBuffer());
 const current=pageMetadata(built.toString()),prior=pageMetadata(await readFile(join(base,path,'index.html'),'utf8'));
 if(response.status!==200||hash(built)!==hash(served)||current.canonical!=='https://myzootwin.com'+path||JSON.stringify(current)!==JSON.stringify(prior))throw Error('Route regression '+path);
 if(path!=='/play/'&&hash(built)!==hash(await readFile(join(base,path,'index.html'))))throw Error('Journal route bytes changed '+path);
 checks.push({path,status:200,sha256:hash(built),metadata:current,identicalToElephant:path!=='/play/'});
}
const sitemap=await readFile('dist/sitemap-0.xml','utf8');
if([...sitemap.matchAll(/<loc>/g)].length!==9||!routes.every(path=>sitemap.includes('https://myzootwin.com'+path)))throw Error('Sitemap regression');
const scripts=async root=>{const list=[];for(const name of await readdir(join(root,'_astro'))){if(!name.endsWith('.js'))continue;const bytes=await readFile(join(root,'_astro',name));list.push({name,bytes:bytes.length,gzip:gzipSync(bytes).length});}return list;};
const currentScripts=await scripts('dist'),baselineScripts=await scripts(base);
const totals=list=>list.reduce((o,v)=>({bytes:o.bytes+v.bytes,gzip:o.gzip+v.gzip}),{bytes:0,gzip:0});
const current=totals(currentScripts),baseline=totals(baselineScripts);
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);let trackedBytes=0;
for(const path of tracked)trackedBytes+=(await stat(path)).size;
const addedRuntime=execFileSync('git',['diff','baseline-local','--','src'],{encoding:'utf8'}).split(/\r?\n/).filter(line=>line.startsWith('+')&&!line.startsWith('+++')).join('\n');
const networkTokens=['fetch(','XMLHttpRequest','sendBeacon','WebSocket','https://','http://','getUserMedia'];
const newNetworkTokens=networkTokens.filter(token=>addedRuntime.includes(token));
if(newNetworkTokens.length)throw Error('Review new runtime network access: '+newNetworkTokens.join(','));
const result={at:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),routes:checks,sitemapCount:9,scripts:{current:currentScripts,baseline:baselineScripts,currentTotals:current,baselineTotals:baseline,delta:{bytes:current.bytes-baseline.bytes,gzip:current.gzip-baseline.gzip}},tracked:{files:tracked.length,bytes:trackedBytes},newRuntimeNetworkTokens:newNetworkTokens,scope:'Static HTTP/metadata/byte comparison; no production deployment or owner save access'};
await writeFile('docs/qa/lion/release-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
