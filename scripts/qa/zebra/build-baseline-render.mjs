import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {resolve,relative,dirname,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from 'vite';
import {files,fingerprint,sha256} from '../tooling.mjs';
const root=resolve('.'),base=resolve('.qa/zebra/z0-02'),product=join(base,'product'),output=join(base,'render'),input=join(base,'input/baseline.html');
if(relative(root,base).replaceAll('\\','/')!=='.qa/zebra/z0-02')throw Error('Invalid own QA root');
try{await access(join(output,'source.json'));throw Error('Baseline already built; preserve source-bound output');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(dirname(input),{recursive:true});
let html=await readFile(join(product,'play/index.html'),'utf8');
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
for(const [tag] of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)){
 const href=tag.match(/href="([^"]+)"/)?.[1];if(!href)throw Error('Missing CSS');
 const path=resolve(product,'.'+new URL(href,'http://localhost').pathname);if(relative(product,path).startsWith('..'))throw Error('CSS leaves QA product');
 html=html.replace(tag,`<style>${await readFile(path,'utf8')}</style>`);
}
html=html.replace(/<link\b[^>]*>/gi,'').replace(/<body([^>]*)>/i,'<body$1><aside style="padding:12px;background:#fff4cb;overflow-wrap:anywhere"><strong>V4 baseline QA — real product modules, synthetic isolated database only</strong><button id="giraffe-qa-measure">Start native1xmeasurement</button><button id="giraffe-qa-stop-measure">Stop measurement</button><button id="giraffe-qa-inspect">Inspect QA state</button><button id="giraffe-qa-close">Close QA game</button><button id="giraffe-qa-loss">Lose QA WebGL context</button><button id="giraffe-qa-corrupt">Corrupt isolated QA primary</button><details><summary>Source and save evidence</summary><pre id="giraffe-qa-result" style="white-space:pre-wrap;overflow-wrap:anywhere">Loading</pre></details></aside>');
html=html.replace('</body>','<script type="module" src="/scripts/qa/giraffe-product.ts"></script></body>');
await writeFile(input,html);
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),rendererHash=sha256(await readFile('src/game/render3d/foundation-scene.ts'));
await build({root,configFile:false,base:'./',publicDir:false,define:{__GIRAFFE_QA_SOURCE__:JSON.stringify(source),__GIRAFFE_QA_RENDER_HASH__:JSON.stringify(rendererHash)},build:{outDir:output,emptyOutDir:false,sourcemap:false,rollupOptions:{input}}});
for(const m of html.matchAll(/<img\b[^>]*src="(\/[^"?#]+)"/gi)){
 const from=resolve(product,'.'+m[1]),to=resolve(output,'.'+m[1]);if(relative(product,from).startsWith('..')||relative(output,to).startsWith('..'))throw Error('Unsafe QA image');
 await mkdir(dirname(to),{recursive:true});await copyFile(from,to);
}
const report={at:new Date().toISOString(),source,rendererHash,scope:'Existing product QA adapter reused without production changes; frozen synthetic V4 seeded through real V4 backend with original V3 backup',product:await fingerprint(root,await files(product)),build:await fingerprint(root,await files(output)),entry:relative(output,join(output,'.qa/zebra/z0-02/input/baseline.html')).replaceAll('\\','/')};
await writeFile(join(output,'source.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({source,output,build:report.build.id,entry:report.entry}));
