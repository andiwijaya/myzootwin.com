import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from 'vite';
import {files,sourceFingerprint,fingerprint,sha256,runNode,astroCli} from '../tooling.mjs';
const run=process.argv[2],fixture=process.argv[3];if(!/^r7-03-[a-z0-9-]{1,25}$/.test(run??'')||!/^\.qa\/zebra-audit\/r7-03\/[a-z0-9-]{1,32}\/fixture\.json$/.test(fixture??''))throw Error('Fresh run and prepared QA fixture required');
const root=resolve('.'),base=resolve('.qa/zebra-audit/r7-03',run),lab=join(base,'lab'),product=join(base,'product');try{await access(base);throw Error('Immutable run exists');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(base,{recursive:true});
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inputs=await sourceFingerprint(root);
const production=await runNode([await astroCli(root),'build','--outDir',product],{cwd:root,timeoutMs:120000});await writeFile(base+'/product-build.log',production.stdout+production.stderr);if(production.exitCode!==0||!production.stdout.includes('10 page(s) built')||!production.stdout.includes('[build] Complete!'))throw Error('Incomplete production build');
await build({root,configFile:false,publicDir:false,base:'./',define:{__FAULT_SOURCE__:JSON.stringify(source),__FAULT_INPUT__:JSON.stringify(inputs.id)},build:{outDir:lab,emptyOutDir:false,rollupOptions:{input:resolve('scripts/qa/zebra/fault-recovery.html')}}});
const entry='scripts/qa/zebra/fault-recovery.html';await copyFile(fixture,join(lab,'scripts/qa/zebra/fixture.json'));
for(const path of await files(product))if(/\.(html|js|css|json)$/.test(path)){const text=await readFile(path,'utf8');for(const marker of ['myzootwin-zebra-fault-','R7-03 isolated fault','fault-recovery.mjs','_qa-owner','__FAULT_SOURCE__'])if(text.includes(marker))throw Error('QA leaked into product '+path);}
const receipt={at:new Date().toISOString(),source,inputs,run,entry,fixture:{path:fixture,sha256:sha256(await readFile(fixture))},lab:await fingerprint(root,await files(lab)),product:await fingerprint(root,await files(product)),productionExclusion:'PASS'};await writeFile(base+'/source.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:'PASS_IMMUTABLE_FAULT_QA_BUILD',run,source,input:inputs.id,entry,productFiles:receipt.product.entries.length}));
