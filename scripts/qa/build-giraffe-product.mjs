import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'vite';
const root=resolve('.'),dist=resolve('dist'),qa=resolve('.qa/giraffe-product'),input=resolve('.qa/giraffe-input/product.html');
if(relative(root,qa).replaceAll('\\','/')!=='.qa/giraffe-product')throw Error('Unsafe own QA directory');
await mkdir(dirname(input),{recursive:true});let html=await readFile('dist/play/index.html','utf8');
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
for(const [tag] of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)){const href=tag.match(/href="([^"]+)"/)?.[1];if(!href)throw Error('Missing CSS');const path=resolve(dist,'.'+new URL(href,'http://localhost').pathname);if(relative(dist,path).startsWith('..'))throw Error('Invalid CSS');html=html.replace(tag,`<style>${await readFile(path,'utf8')}</style>`);}
html=html.replace(/<link\b[^>]*>/gi,'').replace(/<body([^>]*)>/i,'<body$1><aside style="padding:12px;background:#fff4cb;overflow-wrap:anywhere"><strong>Giraffe QA: actual compiled product, synthetic named database only</strong><button id="giraffe-qa-measure">Start native1xmeasurement</button><button id="giraffe-qa-stop-measure">Stop measurement</button><button id="giraffe-qa-inspect">Inspect QA state</button><button id="giraffe-qa-close">Close QA game</button><button id="giraffe-qa-loss">Lose QA WebGL context</button><button id="giraffe-qa-corrupt">Corrupt isolated QA primary</button><details><summary>Source and save evidence</summary><pre id="giraffe-qa-result" style="white-space:pre-wrap;overflow-wrap:anywhere">Loading</pre></details></aside>');
html=html.replace('</body>','<script type="module" src="/scripts/qa/giraffe-product.ts"></script></body>');await writeFile(input,html);
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),entryHash=createHash('sha256').update(await readFile('src/game/render3d/foundation-scene.ts')).digest('hex');
await build({root,configFile:false,base:'./',publicDir:false,define:{__GIRAFFE_QA_SOURCE__:JSON.stringify(source),__GIRAFFE_QA_RENDER_HASH__:JSON.stringify(entryHash)},build:{outDir:qa,emptyOutDir:true,rollupOptions:{input:[input,resolve('scripts/qa/giraffe-maintenance.html'),resolve('scripts/qa/giraffe-race.html')]}}});
for(const m of html.matchAll(/<img\b[^>]*src="(\/[^"?#]+)"/gi)){const from=resolve(dist,'.'+m[1]),to=resolve(qa,'.'+m[1]);if(relative(dist,from).startsWith('..')||relative(qa,to).startsWith('..'))throw Error('Unsafe QA asset');await mkdir(dirname(to),{recursive:true});await copyFile(from,to);}
await writeFile(resolve(qa,'source.json'),JSON.stringify({source,entryHash,at:new Date().toISOString(),scope:'Actual product modules compiled in labelled synthetic QA shell'},null,2));
