import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join,relative,dirname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';

export const root=resolve(import.meta.dirname,'../../../..');
export const sourceRoot='C:/PelatukDotCom';
export const targetRoot=join(root,'art/imports/pelatuk-aviary/v01');
const plannedLibraryHash='868ef9f2ede908b72479258b215b26b6e107f1611fcbe0ce698bc06fc949b4f4';
export const hash=b=>createHash('sha256').update(b).digest('hex');
const json=b=>JSON.parse(b.toString('utf8'));
function inside(base,path){const p=resolve(base,path);if(p!==base&&!p.startsWith(base+sep))throw Error('Path leaves library: '+path);return p;}
async function keep(file,bytes){await mkdir(dirname(file),{recursive:true});try{await writeFile(file,bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;if(hash(await readFile(file))!==hash(bytes))throw Error('Refuse to replace different file: '+file);}}
const metadataPaths=[
 'assets/aviary/library.json','assets/aviary/README.md','docs/AVIARY_ASSET_LIBRARY.md','docs/AVIARY_RELEASE_2026-11-15.md',
 'docs/QA_EVIDENCE/AVIARY_ASSET_LAB_V41_2026-11-14/README.md',
 'docs/QA_EVIDENCE/AVIARY_FOREST_LAB_V01_2026-11-14/README.md',
 'docs/QA_EVIDENCE/AVIARY_UNDERSTORY_LAB_V01_2026-11-14/README.md',
 'docs/QA_EVIDENCE/AVIARY_SURFACE_LAB_V02_2026-11-14/README.md',
 'docs/QA_EVIDENCE/AVIARY_FIXTURE_LAB_V02_2026-11-14/README.md',
 'docs/QA_EVIDENCE/AVIARY_VISITOR_LAB_V04_2026-11-14/README.md',
 'docs/QA_EVIDENCE/AVIARY_SURFACE_COMPONENTS_V01_2026-11-14/README.md',
 'docs/QA_EVIDENCE/AVIARY_BANNER_V01_2026-11-15/README.md',
 'docs/QA_EVIDENCE/AVIARY_RUNTIME_V02_2026-11-15/README.md'
];
export async function importLibrary(verifyOnly=false){
 const sourceLibrary=await readFile(join(sourceRoot,'assets/aviary/library.json'));
 if(hash(sourceLibrary)!==plannedLibraryHash)throw Error('Source catalogue differs from reviewed plan');
 const library=json(sourceLibrary);if(library.assets.length!==122||library.totalMasterBytes!==689550484)throw Error('Unexpected catalogue totals');
 const assets=[],checks=[];
 for(const asset of library.assets){
  const sourcePath=inside(resolve(sourceRoot),asset.path),sub=asset.path.replace(/^assets\/aviary\/exports\//,'');
  if(sub===asset.path||!sub.endsWith('.glb'))throw Error('Unexpected source master path');
  const localPath='masters/'+sub,dest=inside(targetRoot,localPath),before=await readFile(sourcePath);
  if(before.length!==asset.bytes||hash(before)!==asset.sha256)throw Error('Source mismatch: '+asset.id);
  if(!verifyOnly){await mkdir(dirname(dest),{recursive:true});try{await copyFile(sourcePath,dest,fsConstants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}}
  const after=await readFile(dest),sourceAfter=await readFile(sourcePath);
  if(after.length!==asset.bytes||hash(after)!==asset.sha256||hash(sourceAfter)!==asset.sha256)throw Error('Copy verification mismatch: '+asset.id);
  if(after.readUInt32LE(0)!==0x46546c67||after.readUInt32LE(4)!==2||after.readUInt32LE(8)!==after.length)throw Error('Invalid GLB header');
  const gltf=json(after.subarray(20,20+after.readUInt32LE(12)));
  if([...(gltf.buffers??[]),...(gltf.images??[])].some(v=>v.uri&&!v.uri.startsWith('data:')))throw Error('External dependency: '+asset.id);
  const {path:ignored,...metadata}=asset;
  assets.push({...metadata,sourcePath:asset.path,localPath,sourceSha256:asset.sha256,provenancePath:'provenance/'+asset.provenance,sourceManifestPath:'provenance/'+asset.manifest});
  checks.push({id:asset.id,sourcePath:asset.path,localPath,bytes:after.length,sourceSha256:hash(sourceAfter),destinationSha256:hash(after),selfContained:true,status:'PASS'});
 }
 const paths=[...new Set([...metadataPaths,...library.assets.map(a=>a.manifest)])],metadata=[];
 for(const p of paths){const bytes=await readFile(inside(resolve(sourceRoot),p)),dest=inside(targetRoot,'provenance/'+p);if(!verifyOnly)await keep(dest,bytes);const retained=await readFile(dest);if(hash(retained)!==hash(bytes))throw Error('Provenance mismatch: '+p);metadata.push({sourcePath:p,localPath:'provenance/'+p,bytes:retained.length,sha256:hash(retained)});}
 const manifest={schemaVersion:1,originProject:'Pelatuk.com',sourceLibrarySha256:plannedLibraryHash,coordinateConvention:library.coordinateConvention,scalePolicy:library.scalePolicy,runtimeResponsibilities:library.runtimeResponsibilities,selectedMasters:122,totalMasterBytes:689550484,purpose:'Local authoring library and QA only; not a production bundle',assets,provenanceFiles:metadata};
 const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');if(!verifyOnly)await keep(join(targetRoot,'manifest.json'),manifestBytes);else if(hash(await readFile(join(targetRoot,'manifest.json')))!==hash(manifestBytes))throw Error('Destination manifest differs');
 const receipt={schemaVersion:1,checkedAt:new Date().toISOString(),sourceRoot,sourceLibrarySha256:plannedLibraryHash,destinationRoot:relative(root,targetRoot).replaceAll('\\','/'),manifestSha256:hash(manifestBytes),selectedMasters:122,totalMasterBytes:checks.reduce((n,a)=>n+a.bytes,0),sourcePreserved:true,checks,provenance:metadata,productionExclusion:'PENDING_BUILD_SCAN',status:'PASS'};
 if(!verifyOnly){await mkdir(join(root,'docs/qa/glb'),{recursive:true});await writeFile(join(root,'docs/qa/glb/p1-copy-20261115.json'),JSON.stringify(receipt,null,2)+'\n');}
 return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const r=await importLibrary(process.argv.includes('--verify-only'));console.log(JSON.stringify({status:r.status,masters:r.selectedMasters,bytes:r.totalMasterBytes,provenance:r.provenance.length,sourcePreserved:r.sourcePreserved}));
}
