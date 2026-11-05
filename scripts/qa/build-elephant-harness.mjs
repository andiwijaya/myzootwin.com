import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {build} from 'vite';
// Existing local product build supplies the real UI/style; no generated HTML is committed.
const root=resolve('.'),dist=resolve('dist'),outDir='.qa/elephant-world-built';
const qaRoot=resolve(root,outDir);
if(relative(root,qaRoot).replaceAll('\\','/')!=='.qa/elephant-world-built')throw Error('Unsafe QA output path');
await mkdir('.qa/elephant-baseline',{recursive:true});
let html=await readFile('dist/play/index.html','utf8');
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const links=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)];
for(const [tag] of links){const href=tag.match(/href="([^"]+)"/)?.[1];if(!href)throw Error('Missing stylesheet');const file=resolve(dist,'.'+new URL(href,'http://localhost').pathname),part=relative(dist,file);if(part.startsWith('..')||isAbsolute(part))throw Error('Stylesheet leaves local build');html=html.replace(tag,`<style>${await readFile(file,'utf8')}</style>`);}
html=html.replace(/<link\b[^>]*>/gi,'');
html=html.replace(/<body([^>]*)>/i,'<body$1><aside style="padding:8px;background:#fff7ce"><strong>Elephant Grove QA — actual UI, synthetic fixture, no owner database</strong> <button id="qa-v2-inspect">Inspect QA storage</button> <button id="qa-v2-close">Close QA game</button><pre id="qa-v2-storage" style="white-space:pre-wrap">Loading QA storage</pre></aside>');
html=html.replace('</body>','<script type="module" src="/tests/browser/elephant-v2-product.ts"></script></body>');
await writeFile('.qa/elephant-baseline/v2-product.html',html);
await build({root,configFile:false,base:'./',publicDir:false,build:{outDir:qaRoot,emptyOutDir:true,rollupOptions:{input:{world:resolve('tests/browser/elephant-world-harness.html'),placement:resolve('tests/browser/elephant-placement-harness.html'),storage:resolve('tests/browser/elephant-v2-storage-harness.html'),product:resolve('.qa/elephant-baseline/v2-product.html')}}}});
for(const match of html.matchAll(/<img\b[^>]*src="(\/[^"?#]+)"/gi)){
  const source=resolve(dist,'.'+match[1]),target=resolve(outDir,'.'+match[1]);
  if(relative(dist,source).startsWith('..')||relative(resolve(outDir),target).startsWith('..'))throw Error('Image leaves QA output');
  await mkdir(dirname(target),{recursive:true});await copyFile(source,target);
}
