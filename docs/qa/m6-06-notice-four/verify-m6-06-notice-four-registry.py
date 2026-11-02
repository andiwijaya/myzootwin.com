import pathlib,json,hashlib,base64,urllib.request,urllib.parse,urllib.error,tarfile,io,re,datetime,concurrent.futures,subprocess
r=pathlib.Path(r'C:\MyZooTwin');w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-06-notice-four');w.mkdir(exist_ok=True);archives=w/'official-tarballs';archives.mkdir(exist_ok=True)
targets={'am-i-vibing':'0.5.0','boolbase':'1.0.0','piccolore':'0.1.3','process-ancestry':'0.1.0'};lock=json.loads((r/'package-lock.json').read_text());prior=json.loads((r/'docs/qa/m6-06-gap/upstream-license-provenance.json').read_text());prior={p['name']:p for p in prior['packages']}
plan={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baselineHEAD':subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip(),'packages':targets,'bound':['One anonymous exactversion registry metadata+officialtarball read perpackage, max5MB archive/unpacked, SRI/hash/installed-byte check; never execute or extract package software.','Reuse previously observed pinned tag/commit evidence; do not repeat exhausted old-tree scans.','One current official upstream license endpoint perrepo. If candidate fulltext exists, at most one10entry license-file history read and a matching-version/source-identity bridge at an observed commit; stop if missing/ambiguous.','No invented SPDX-to-license text, assumed retroactive grant, dependencyversion/install changes, newagreements/auth or upstream messages.','Verify actual emitted browser modules and graph paths before selecting notice locations. WholeM6-06 stillPARTIAL;44/51 unless exact full acceptance met.'],'noAutomaticRetries':True,'priorKnownVersionRefs':{k:{x:prior[k].get(x) for x in ['tag','commit','status','refBasis']} for k in targets}}
(w/'plan.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
def get(url,limit,accept):
 request=urllib.request.Request(url,headers={'Accept':accept,'User-Agent':'MyZooTwin-local-license-audit'})
 with urllib.request.urlopen(request,timeout=25) as response:
  final=response.geturl();assert urllib.parse.urlparse(final).scheme=='https' and urllib.parse.urlparse(final).hostname=='registry.npmjs.org',final
  data=response.read(limit+1);assert len(data)<=limit,'Bounded read exceeded';return data,final
def inspect(item):
 name,version=item;entry=lock['packages']['node_modules/'+name];installed=r/'node_modules'/name;pkg=json.loads((installed/'package.json').read_text());assert pkg['name']==name and pkg['version']==version and entry['version']==version
 row={'name':name,'version':version,'lock':{x:entry.get(x) for x in ['version','resolved','integrity','dev','optional','license']},'installedPackageJsonSHA256':hashlib.sha256((installed/'package.json').read_bytes()).hexdigest(),'priorTagCommit':{x:prior[name].get(x) for x in ['tag','commit','status']}}
 try:
  url='https://registry.npmjs.org/'+urllib.parse.quote(name,safe='')+'/'+version;data,final=get(url,2_000_000,'application/json');metadata=json.loads(data);assert metadata['name']==name and metadata['version']==version
  row.update(registryURL=final,metadataSHA256=hashlib.sha256(data).hexdigest(),publisher={'registryUsername':(metadata.get('_npmUser') or {}).get('name'),'maintainerUsernames':[x.get('name') for x in metadata.get('maintainers',[])],'basis':'Public npm exact-version metadata, no claim of independently verified account ownership/signature; email omitted'},repository=metadata.get('repository'),homepage=metadata.get('homepage'),declaredSPDX=metadata.get('license'),gitHead=metadata.get('gitHead'),dist={x:metadata.get('dist',{}).get(x) for x in ['tarball','integrity','shasum','fileCount','unpackedSize']})
  tarURL=metadata['dist']['tarball'];assert tarURL==entry['resolved'] and urllib.parse.urlparse(tarURL).hostname=='registry.npmjs.org';tar,final=get(tarURL,5_000_000,'application/octet-stream');algorithm,expected=entry['integrity'].split('-',1);assert algorithm in ['sha512','sha256','sha1'];assert base64.b64encode(hashlib.new(algorithm,tar).digest()).decode()==expected
  if metadata['dist'].get('integrity'):assert metadata['dist']['integrity']==entry['integrity']
  assert hashlib.sha1(tar).hexdigest()==metadata['dist']['shasum']
  local=archives/(name+'-'+version+'.tgz');assert not local.exists(),'Preserve existing captured artifact';local.write_bytes(tar)
  members=[];embedded=[];sources=[]
  with tarfile.open(fileobj=io.BytesIO(tar),mode='r:gz') as archive:
   entries=archive.getmembers();assert len(entries)<=500 and sum(x.size for x in entries)<5_000_000
   for m in entries:
    if not m.isfile():members.append({'path':m.name,'kind':'nonregular-skipped'});continue
    path=pathlib.PurePosixPath(m.name);assert path.parts[0]=='package' and not path.is_absolute() and '..' not in path.parts
    content=archive.extractfile(m).read();rel='/'.join(path.parts[1:]);localFile=installed.joinpath(*path.parts[1:]);same=localFile.is_file() and localFile.read_bytes()==content
    members.append({'path':m.name,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest(),'installedByteMatch':same});assert same,(name,rel,'installed bytes differ from exact archive')
    if re.search(r'(^|/)(?:licen[cs]e|copying|notice|unlicense)(?:\.|$)',rel,re.I):embedded.append({'path':rel,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest(),'text':content.decode('utf-8',errors='replace')})
    if pathlib.PurePosixPath(rel).suffix in ['.js','.mjs','.cjs','.ts'] and not rel.endswith('.d.ts'):sources.append({'path':rel,'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content)})
   # Search text contents for full permission clauses, not just standard filename spelling.
   clauses=[]
   for m in entries:
    if m.isfile() and m.size<300_000 and pathlib.PurePosixPath(m.name).suffix.lower() in ['.js','.mjs','.cjs','.ts','.txt','.md','.json']:
     text=archive.extractfile(m).read().decode('utf-8',errors='replace')
     for phrase in ['Permission is hereby granted','Permission to use, copy, modify','THE SOFTWARE IS PROVIDED']:
      if phrase.lower() in text.lower():clauses.append({'file':m.name,'phrase':phrase})
  row.update(status='VERIFIED_OFFICIAL_EXACT_TARBALL',archive={'local':str(local),'url':final,'sha256':hashlib.sha256(tar).hexdigest(),'bytes':len(tar),'lockSRIverified':True,'registrySHA1verified':True,'installedFilesAllByteMatch':True,'members':members},licenseFiles=embedded,fullPermissionClauseMatches=clauses,codeFiles=sources)
 except urllib.error.HTTPError as e:row.update(status='READ_FAILED_NO_RETRY',HTTP=e.code,target=e.url,reason=str(e),denied=e.code in [401,403])
 except Exception as e:row.update(status='READ_FAILED_NO_RETRY',reason=str(e))
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(inspect,targets.items()))
(w/'registry-tarball-audit.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Anonymous official registry reads; no installs, execution, credentials or retries. Archives retained audit-local outside repo. Publisher emails omitted.','packages':rows},indent=2)+'\n',encoding='utf-8')
print(json.dumps([{'name':x['name'],'status':x['status'],'publisher':x.get('publisher'),'licenseFiles':len(x.get('licenseFiles',[])),'fullClauseMatches':x.get('fullPermissionClauseMatches'),'bytes':x.get('archive',{}).get('bytes')} for x in rows]))
