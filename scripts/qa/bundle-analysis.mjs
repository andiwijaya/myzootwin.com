import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Opt-in local build evidence; no warning suppression, bundle rewrite or source map. */
export function bundleAnalysis() {
  const root=fileURLToPath(new URL('../../',import.meta.url));
  return {name:'myzootwin-local-bundle-evidence',async writeBundle(_options,bundle){
    if(process.env.MYZOO_QA_ANALYZE!=='1')return;
    const entries=Object.values(bundle).filter(entry=>entry.type==='chunk');
    if(!entries.some(entry=>entry.name==='foundation-scene'))return;
    const chunks=entries.map(entry=>({fileName:entry.fileName,name:entry.name,bytes:Buffer.byteLength(entry.code),sha256:createHash('sha256').update(entry.code).digest('hex'),isEntry:entry.isEntry,isDynamicEntry:entry.isDynamicEntry,imports:entry.imports,dynamicImports:entry.dynamicImports,modules:Object.entries(entry.modules).map(([id,info])=>({id:relative(root,id).replaceAll('\\','/'),renderedLength:info.renderedLength,originalLength:info.originalLength})).sort((a,b)=>b.renderedLength-a.renderedLength)}));
    await mkdir(resolve(root,'.qa'),{recursive:true});
    await writeFile(resolve(root,'.qa/bundle-analysis.json'),JSON.stringify({generatedAt:new Date().toISOString(),scope:'Client bundle only; module renderedLength is retained pre-minification code, not additive minified/transfer attribution',chunks},null,2)+'\n');
  }};
}
