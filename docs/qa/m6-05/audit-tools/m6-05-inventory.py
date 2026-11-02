from pathlib import Path
from collections import Counter
import os,json,subprocess,hashlib,datetime
root=Path(r'C:\MyZooTwin'); out=Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-05-audit');out.mkdir(exist_ok=True)
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0');tracked=[x for x in tracked if x]
rows=[];symlinks=[]
for directory,dirs,files in os.walk(root,followlinks=False):
 for n in dirs[:]:
  p=Path(directory)/n
  if p.is_symlink() or p.is_junction():symlinks.append(p.relative_to(root).as_posix());dirs.remove(n)
 for n in files:
  p=Path(directory)/n
  if p.is_symlink():symlinks.append(p.relative_to(root).as_posix());continue
  rows.append((p.relative_to(root).as_posix(),p.stat().st_size))
groups={}
for name,size in rows:
 top=name.split('/')[0];a=groups.setdefault(top,{'files':0,'bytes':0});a['files']+=1;a['bytes']+=size
lock=json.loads((root/'package-lock.json').read_text());packages=lock['packages'];installed=[];missing=[]
for name,p in packages.items():
 if not name:continue
 local=root/name/'package.json'
 if local.exists():
  m=json.loads(local.read_text(encoding='utf-8'));installed.append({'path':name,'name':m.get('name'),'version':m.get('version'),'license':m.get('license',m.get('licenses')),'dev':p.get('dev',False),'optional':p.get('optional',False),'lockLicense':p.get('license'),'integrity':bool(p.get('integrity')),'licenseFiles':[x.name for x in local.parent.iterdir() if x.is_file() and any(x.name.lower().startswith(q) for q in ['license','copying','notice'])]})
 else:missing.append({'path':name,'optional':p.get('optional',False),'os':p.get('os'),'cpu':p.get('cpu')})
manifest=json.loads((root/'docs/ASSET_MANIFEST.json').read_text());art=[]
for asset in manifest['assets']:
 p=root/(asset.get('path')or'_none_');row={'id':asset.get('id'),'path':asset.get('path'),'rights':asset.get('rights_status'),'exists':p.is_file()}
 if p.is_file():row.update(bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),manifestHashMatches=asset.get('sha256')==hashlib.sha256(p.read_bytes()).hexdigest() if asset.get('sha256') else None)
 art.append(row)
def write(name,obj):(out/name).write_text(json.dumps(obj,indent=2)+'\n',encoding='utf-8')
write('before.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'groups':groups,'totalFiles':len(rows),'totalBytes':sum(s for _,s in rows),'trackedFiles':len(tracked),'trackedBytes':sum((root/p).stat().st_size for p in tracked if (root/p).is_file()),'trackedExtensions':Counter(Path(p).suffix.lower() for p in tracked),'largest':sorted([{'path':n,'bytes':s}for n,s in rows],key=lambda x:-x['bytes'])[:20],'qaBuilds':[x.name for x in (root/'.qa/builds').iterdir() if x.is_dir()],'symlinksOrJunctionsNotFollowed':symlinks,'scope':'Only repository; file size metadata, no credential contents'})
write('dependencies.json',{'lockVersion':lock['lockfileVersion'],'locked':len(packages)-1,'installed':installed,'notInstalled':missing,'licenses':Counter(str(x['license']) for x in installed),'missingLicense':[x['path'] for x in installed if not x['license']],'missingIntegrity':[x['path'] for x in installed if not x['integrity']]})
write('existing-asset-integrity.json',art)
print(json.dumps({'groups':groups,'totalBytes':sum(s for _,s in rows),'trackedBytes':sum((root/p).stat().st_size for p in tracked if (root/p).is_file()),'dependenciesInstalled':len(installed),'missingLicense':[x['path'] for x in installed if not x['license']],'manifestAssets':len(art),'hashDisagreements':[x['id'] for x in art if x.get('manifestHashMatches')is False]}))
