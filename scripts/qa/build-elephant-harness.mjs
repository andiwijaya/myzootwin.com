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
html=html.replace(/<body([^>]*)>/i,'<body$1><aside style="padding:8px;background:#fff7ce"><strong>Elephant Grove QA — actual UI, synthetic fixture, no owner database</strong> <button id="qa-v2-inspect">Inspect QA storage</button><button id="qa-v2-touch-check">Run injected touch checks (QA)</button><details><summary>Injected touch result</summary><pre id="qa-v2-touch-result">UNRUN</pre></details> <button id="qa-v2-close">Close QA game</button> <button id="qa-v2-show-checkpoint">Show QA checkpoint</button> <button id="qa-v2-pause-spray">Pause on next real wet spray (QA)</button><button id="qa-v2-pause-rest">Pause on next real shade rest (QA)</button> <button id="qa-v2-pause-enrich">Pause on next real log rub (QA)</button><button id="qa-v2-pause-social">Pause on next real trunk greeting (QA)</button><button id="qa-v2-pause-elephant-grove">Pause on next real elephant viewing (QA)</button> <button id="qa-v2-pause-macaw-aviary">Pause on next real macaw viewing (QA)</button><button id="qa-v2-pause-eh04">Pause when EH04 actually ready (QA)</button><pre id="qa-v2-checkpoint" style="white-space:pre-wrap" hidden></pre><p id="qa-v2-elephant-phases" aria-live="off"></p><details><summary>QA storage checkpoint</summary><pre id="qa-v2-storage" style="white-space:pre-wrap">Loading QA storage</pre></details></aside>');
html=html.replace('</body>','<script type="module" src="/tests/browser/elephant-v2-product.ts"></script></body>');
await writeFile('.qa/elephant-baseline/v2-product.html',html);
await build({root,configFile:false,base:'./',publicDir:false,build:{outDir:qaRoot,emptyOutDir:true,rollupOptions:{input:{rig:resolve('tests/browser/elephant-rig-harness.html'),world:resolve('tests/browser/elephant-world-harness.html'),placement:resolve('tests/browser/elephant-placement-harness.html'),storage:resolve('tests/browser/elephant-v2-storage-harness.html'),product:resolve('.qa/elephant-baseline/v2-product.html')}}}});
for(const match of html.matchAll(/<img\b[^>]*src="(\/[^"?#]+)"/gi)){
  const source=resolve(dist,'.'+match[1]),target=resolve(outDir,'.'+match[1]);
  if(relative(dist,source).startsWith('..')||relative(resolve(outDir),target).startsWith('..'))throw Error('Image leaves QA output');
  await mkdir(dirname(target),{recursive:true});await copyFile(source,target);
}
