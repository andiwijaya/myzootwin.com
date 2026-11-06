from pathlib import Path
import os,json,hashlib,subprocess,datetime,re
root=Path.cwd();out=root/'docs/qa/elephant-hygiene';out.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(n,o):(out/n).write_text(json.dumps(o,indent=2)+'\n',encoding='utf-8')
tracked=[p for p in subprocess.check_output(['git','ls-files','-z']).decode().split('\0')if p];groups={};largest=[];links=[]
for folder,dirs,files in os.walk(root,followlinks=False):
 for name in dirs[:]:
  p=Path(folder)/name
  if p.is_symlink()or p.is_junction():links.append(p.relative_to(root).as_posix());dirs.remove(name)
 for name in files:
  p=Path(folder)/name
  if p.is_symlink():links.append(p.relative_to(root).as_posix());continue
  rel=p.relative_to(root).as_posix();n=p.stat().st_size;g=groups.setdefault(rel.split('/')[0],{'files':0,'bytes':0});g['files']+=1;g['bytes']+=n;largest.append({'path':rel,'bytes':n})
put('inventory.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parent':'43dc563','totalBytes':sum(x['bytes']for x in groups.values()),'groups':groups,'trackedFiles':len(tracked),'trackedBytes':sum((root/p).stat().st_size for p in tracked),'largest':sorted(largest,key=lambda x:-x['bytes'])[:15],'symlinksOrJunctionsNotFollowed':links,'scope':'File metadata only; no credentials or owner saves read. No files deleted.'})
lock=json.loads((root/'package-lock.json').read_text(encoding='utf-8'));installed=[];missing=[]
for name,p in lock['packages'].items():
 if not name:continue
 local=root/name/'package.json'
 if local.is_file():
  m=json.loads(local.read_text(encoding='utf-8'));installed.append({'path':name,'name':m.get('name'),'version':m.get('version'),'license':m.get('license',m.get('licenses')),'optional':p.get('optional',False),'licenseFiles':[x.name for x in local.parent.iterdir()if x.is_file()and x.name.lower().startswith(('license','licence','copying','notice'))]})
 else:missing.append({'path':name,'optional':p.get('optional',False),'os':p.get('os'),'cpu':p.get('cpu')})
put('dependencies.json',{'locked':len(lock['packages'])-1,'installed':installed,'notInstalled':missing,'missingRequired':[x for x in missing if not x['optional']],'licenseScope':'Metadata/local notices only, not exhaustive transitive redistribution clearance','standaloneNoticeGaps':[x['path']for x in installed if not x['licenseFiles']]})
assets=[]
for path in sorted((root/'src/game/render3d').glob('elephant*.ts')):
 assets.append({'path':path.relative_to(root).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path),'origin':'Original project procedural Three geometry/vertex colors/rig code; no downloaded model/texture/audio','licenseBasis':'Project original source; dependency Three MIT separately shipped'})
for path in sorted((root/'public').rglob('*')):
 if path.is_file():assets.append({'path':path.relative_to(root).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path),'origin':'Unchanged from audited63ce52a original checkout; refer art/site-assets/generated-manifest.json and earlier privacy/asset reports'})
put('assets-current.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'assets':assets,'publicArtDependencyFilesChangedSinceBaseline':subprocess.check_output(['git','diff','63ce52a','--name-only','--','public','art','package.json','package-lock.json'],text=True).splitlines(),'threeMitExact':(root/'public/licenses/three-MIT.txt').read_bytes()==(root/'node_modules/three/LICENSE').read_bytes(),'historicalManifest':'docs/ASSET_MANIFEST.json keeps historical evidence; this supplement binds changed Elephant procedural modules to current exact bytes. Historical legal signoff is not promoted.'})
patterns={'dynamicExecution':r'\beval\s*\(|new\s+Function\s*\(','networkApi':r'\bfetch\s*\(|sendBeacon\s*\(|new\s+(?:WebSocket|XMLHttpRequest)','devicePermission':r'getUserMedia|geolocation|requestPermission\(','credentialShape':r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{25,}|sk-[A-Za-z0-9]{30,}'}
hits={k:[]for k in patterns}
for path in (root/'src').rglob('*'):
 if not path.is_file()or path.suffix not in ['.ts','.astro','.js','.mjs']:continue
 for i,line in enumerate(path.read_text(encoding='utf-8').splitlines(),1):
  for name,pat in patterns.items():
   if re.search(pat,line):hits[name].append({'path':path.relative_to(root).as_posix(),'line':i})
put('security-source-scan.json',{'method':'Scoped source pattern audit; paths/lines only, no secret values or broad .env read; not a pentest or proof of all vulnerabilities','hits':hits,'trackedSensitiveFilenameCandidates':[x for x in tracked if re.search(r'(^|/)(\.env(?:\..*)?|id_rsa|credentials|.*\.pem)$',x)],'newRuntimeNetworkDifference':subprocess.check_output(['git','diff','63ce52a','--name-only','--','src/privacy','src/site-events.ts','src/components/SitePrivacy.astro'],text=True).splitlines()})
print(json.dumps({'totalBytes':sum(x['bytes']for x in groups.values()),'tracked':len(tracked),'installed':len(installed),'missingRequired':len([x for x in missing if not x['optional']]),'noticeGaps':len([x for x in installed if not x['licenseFiles']]),'scan':{k:len(v)for k,v in hits.items()},'links':links}))
