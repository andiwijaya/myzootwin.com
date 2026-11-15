import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {brotliDecompressSync} from 'node:zlib';
const source=resolve('C:/PelatukDotCom/public/aviary-assets/v01'),out=resolve('public/zoo-environment/v01'),sha=b=>createHash('sha256').update(b).digest('hex'),bytes=await readFile(join(source,'manifest.json')),original=JSON.parse(bytes);
// Woodpeckers, Pelatuk-branded gate/banner and bird-specific care kit remain authoring library only.
const models=original.models.filter(a=>['tree','understory','visitor'].includes(a.category)||/^boulder-/.test(a.id)).map(a=>({...a,bytes:a.transferBytes,sha256:a.transferSha256,animations:a.category==='visitor'?['idle','walk','observe','idle-reduced','walk-reduced','observe-reduced']:[]}));
const wanted=new Set(models.flatMap(a=>a.textures)),textures=original.textures.filter(t=>wanted.has(t.sha256));
await mkdir(join(out,'models'),{recursive:true});await mkdir(join(out,'textures'),{recursive:true});
for(const a of models){const data=await readFile(join(source,a.url)),raw=brotliDecompressSync(data);if(sha(data)!==a.sha256||data.length!==a.bytes||sha(raw)!==a.rawSha256||raw.length!==a.rawBytes)throw Error('Pelatuk derivative identity '+a.id);await writeFile(join(out,a.url),data);}
for(const a of textures){const data=await readFile(join(source,a.url));if(sha(data)!==a.sha256||data.length!==a.bytes)throw Error('Pelatuk texture identity');await writeFile(join(out,a.url),data);}
const manifest={schemaVersion:1,version:'v01',sourceManifestSha256:sha(bytes),source:'C:/PelatukDotCom/public/aviary-assets/v01',scope:'Selected verified original Pelatuk foliage, rocks and visitors; no woodpecker gameplay or Pelatuk branding',models,textures,totalPayloadBytes:models.reduce((n,a)=>n+a.bytes,0)+textures.reduce((n,a)=>n+a.bytes,0)};await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({models:models.length,textures:textures.length,bytes:manifest.totalPayloadBytes}));
