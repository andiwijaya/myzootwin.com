import {mkdir,readFile,writeFile,cp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {build} from 'vite';
import {preparedZebraCare} from '../../../tests/helpers/zebra-care-play.mjs';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {astroCli,runNode,sourceFingerprint,sha256} from '../tooling.mjs';
import {menuFixtures} from './menu-fixtures.mjs';

const id=process.argv[2];if(!/^[a-z0-9-]{1,60}$/.test(id??''))throw Error('Pass a unique habitat focus QA ID');
const root=resolve('.'),base=resolve('.qa/habitat-focus',id),product=join(base,'product'),lab=join(base,'lab');
try{await access(base);throw Error('Preserve the prior QA build; choose a new ID');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(join(base,'input'),{recursive:true});
const source=await sourceFingerprint(root),result=await runNode([await astroCli(root),'build','--outDir',product],{cwd:root,timeoutMs:120000});
await writeFile(join(base,'build.log'),result.stdout+result.stderr);if(result.exitCode!==0)throw Error('Product build failed; see build.log');
// Synthetic five-habitat seed. Facility removal/refunds use real source commands solely to
// leave a construction slot for each species. This is not unlock/progression acceptance.
const sim=preparedZebraCare({supplies:false,enrichment:false});
if(!sim.food('remove',sim.foodView().revision,sim.commandRevision()).ok)throw Error('Missing macaw construction slot');
for(const kind of ['elephant-log','lion-scent','giraffe-enrichment']){
  const r=sim.snapshot().world.resources.find(r=>r.kind===kind);let removed=false;
  for(let i=0;i<3000;i++){
    const q=sim.quoteRemoval({kind:kind.split('-')[0]+'-resource',id:r.id});
    if(q.ok){const result=sim.remove(q.quote,'edit-'+randomUUID().replaceAll('-',''));if(!result.ok)throw Error('Cannot prepare '+kind+': '+result.reason);removed=true;break;}
    sim.advance(100);
  }
  if(!removed)throw Error('Busy fixture '+kind);
}
const state=sim.snapshot();sim.visitors(false);const buildScrollState=sim.snapshot();sim.dispose();const checked=validateSaveV5(state);if(!checked.ok)throw Error('Invalid focus fixture '+checked.path);if(!validateSaveV5(buildScrollState).ok||buildScrollState.visitorFlow.open)throw Error('Invalid closed-entrance Build scroll fixture');
let html=await readFile(join(product,'play/index.html'),'utf8');
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*rel="modulepreload"[^>]*>/gi,'');
html=html.replace(/<body([^>]*)>/i,'<body$1><aside class="focus-qa"><strong>QA · synthetic five-habitat save · actual game UI and renderer</strong><p>No owner saves, uploads, downloads, public routes, or production changes.</p><div id="qa-actions"><button id="qa-suite">Run focused integration checks</button><button id="qa-inspect">Inspect current state</button><button id="qa-context">Inject WebGL context loss</button></div><details><summary>QA results</summary><pre id="qa-result">Loading</pre></details></aside>');
html=html.replace('</head>','<meta name="robots" content="noindex,nofollow"><style>.focus-qa{font:13px system-ui;background:#fff4cb;color:#153b2f;padding:8px}.focus-qa button{min-height:44px;margin:3px}.focus-qa p{margin:4px}.focus-qa pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto}</style></head>').replace('</body>','<script type="module" src="/scripts/qa/habitat-focus/product.ts"></script></body>');
const input=join(base,'input/index.html');await writeFile(input,html);
await build({root,configFile:false,publicDir:false,base:'/',build:{outDir:lab,emptyOutDir:false,rollupOptions:{input}}});
await cp(join(lab,'.qa/habitat-focus',id,'input/index.html'),join(lab,'index.html'));
await cp(join(product,'_astro'),join(lab,'_astro'),{recursive:true});
for(const folder of ['zoo-assets','zoo-environment','zoo-fixtures','fonts'])try{await cp(join(root,'public',folder),join(lab,folder),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await writeFile(join(lab,'focus-fixture.json'),JSON.stringify(state));
await writeFile(join(lab,'build-scroll-fixture.json'),JSON.stringify(buildScrollState));
const perfSimulation=preparedZebraCare({supplies:true,enrichment:true}),perfState=perfSimulation.snapshot();perfSimulation.dispose();
if(!validateSaveV5(perfState).ok)throw Error('Invalid performance fixture');
await writeFile(join(lab,'performance-fixture.json'),JSON.stringify(perfState));
const scrollSimulation=preparedZebraCare({supplies:false,enrichment:true}),scrollState=scrollSimulation.snapshot();scrollSimulation.dispose();
if(!validateSaveV5(scrollState).ok)throw Error('Invalid care scroll fixture');
await writeFile(join(lab,'care-scroll-fixture.json'),JSON.stringify(scrollState));
await writeFile(join(lab,'menu-fixtures.json'),JSON.stringify(menuFixtures(scrollState,state)));
const after=await sourceFingerprint(root);if(source.id!==after.id)throw Error('Source changed during QA build');
await writeFile(join(base,'source.json'),JSON.stringify({at:new Date().toISOString(),sourceFingerprint:source.id,fixtureHash:sha256(JSON.stringify(state)),scope:'Synthetic fixture; actual UI, single native renderer/RAF, native IndexedDB with the core V5 codec. Not unlock or physical-device evidence.'},null,2));
console.log(JSON.stringify({base,lab,product,sourceFingerprint:source.id}));
