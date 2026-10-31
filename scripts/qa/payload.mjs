import { readFile, readdir, lstat } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { files, fingerprint, sourceFingerprint, json, readJson, sha256 } from './tooling.mjs';

export function analysisMatches(analysis,entries) { return analysis.chunks.length>0&&analysis.chunks.every(chunk=>entries.get(chunk.fileName)?.sha256===chunk.sha256); }
export async function payloadBaseline(root) {
  const dist=join(root,'dist'),paths=await files(dist),fingerprints=await fingerprint(root,paths),entries=new Map();
  for(const path of paths){const bytes=await readFile(path),name=relative(dist,path).replaceAll('\\','/');entries.set(name,{path:name,bytes:bytes.length,gzipLevel9Bytes:/\.(html|css|js|xml|txt)$/.test(name)?gzipSync(bytes,{level:9,mtime:0}).length:null,sha256:sha256(bytes)});}
  const analysis=await readJson(join(root,'.qa/bundle-analysis.json'));if(!analysisMatches(analysis,entries))throw Error('Build-analysis hash does not match current client chunks');
  const html=await readFile(join(dist,'play/index.html'),'utf8');
  const shellPaths=['play/index.html',...new Set([...html.matchAll(/\b(?:href|src)="\/(\_astro\/[^"?#]+)"/g)].map(x=>x[1]))];
  if(shellPaths.length<2||shellPaths.some(path=>!entries.has(path)))throw Error('Incomplete shell asset set');
  const lazy=analysis.chunks.find(x=>x.name==='foundation-scene');
  const firstOpenPaths=[...new Set([...shellPaths,lazy.fileName])];
  const describe=list=>({files:list.map(path=>entries.get(path)),rawBytes:list.reduce((n,path)=>n+entries.get(path).bytes,0),gzipLevel9EstimateBytes:list.reduce((n,path)=>n+(entries.get(path).gzipLevel9Bytes??entries.get(path).bytes),0)});
  const disk={};
  for(const folder of ['src','public','art','docs','.git','node_modules','dist','.qa']) {
    let count=0,bytes=0,symlinks=0;
    async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){const child=join(path,entry.name);if(entry.isSymbolicLink()){symlinks++;continue;}if(entry.isDirectory())await walk(child);else if(entry.isFile()){count++;bytes+=(await lstat(child)).size;}}}
    await walk(join(root,folder));disk[folder]={files:count,logicalBytes:bytes,skippedSymlinks:symlinks};
  }
  return {generatedAt:new Date().toISOString(),source:(await sourceFingerprint(root)).id,buildId:fingerprints.id,scope:'Current read-only renderer preview. Same-origin built bytes/gzip estimates, not measured network transfer, first-interaction latency or future populated-game payload',shell:describe(shellPaths),firstPreviewOpen:describe(firstOpenPaths),externalRuntimeAssets:'Existing Google Fonts stylesheet/fonts are remote and not measured; no external game model/texture/audio loaded',dist:{files:entries.size,rawBytes:[...entries.values()].reduce((n,e)=>n+e.bytes,0)},analysis,disk,budgets:{futureFirstPlayBytes:20_000_000,futurePhysicalAndroidPresentationFPS:30,futureDesktopPresentationFPS:60,screenCSS:[[360,780],[780,360],[1366,768],[1920,1080]],qaRunsMax:5,qaPruneKeep:3,qaLogMaxBytes:2_000_000,qaScreenshotMaxBytes:2_000_000,qaScreenshotMaxCount:8,repoPreferredMaxBytes:10_000_000_000}};
}
const direct=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct){const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');const result=await payloadBaseline(root);await json(join(root,'.qa/payload-baseline.json'),result);console.log(JSON.stringify({buildId:result.buildId,shellRaw:result.shell.rawBytes,firstPreviewOpenRaw:result.firstPreviewOpen.rawBytes,firstPreviewOpenGzipEstimate:result.firstPreviewOpen.gzipLevel9EstimateBytes,output:'.qa/payload-baseline.json'},null,2));}
