from pathlib import Path
import json,hashlib,zipfile,datetime
root=Path(r'C:\MyZooTwin');base=(root/'.qa/builds').resolve();out=Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-05-audit')
selected=['s20261102T030906Z','s20261102T031857Z','s20261102T044916Z','s20261102T050031Z','s20261102T054108Z','s20261102T075430Z','s20261102T075747Z','s20261102T091112Z']
archive=root/'.qa/archives/m6-05/superseded-builds.zip';archive.parent.mkdir(parents=True,exist_ok=True);assert not archive.exists(),'Existing archive must not be overwritten'
records=[];blobs={};logical=0
for name in selected:
 d=base/name;assert d.resolve().parent==base and d.is_dir() and not d.is_junction() and not d.is_symlink()
 entries=[]
 for p in sorted(d.rglob('*')):
  assert not p.is_symlink() and not p.is_junction()
  if not p.is_file():continue
  data=p.read_bytes();sha=hashlib.sha256(data).hexdigest();logical+=len(data);blobs.setdefault(sha,data);entries.append({'path':p.relative_to(d).as_posix(),'bytes':len(data),'sha256':sha})
 assert entries and any(x['path']=='play/index.html' for x in entries)
 records.append({'runId':name,'resolvedDirectory':str(d.resolve()),'files':entries})
manifest={'schemaVersion':1,'scope':'Superseded generated isolated QA builds only; source, history, final scope builds, original media and owner dist untouched','builds':records,'restore':'Reconstruct files in a NEW named .qa/restored/<runId> directory from blobs/<sha256> after verifying SHA and safe relative paths. Never restore over dist or source. ZIP contains content-addressed blobs, not a conventional direct-extract tree.'}
with zipfile.ZipFile(archive,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 z.writestr('manifest.json',json.dumps(manifest,indent=2)+'\n')
 for sha,data in sorted(blobs.items()):z.writestr('blobs/'+sha,data)
with zipfile.ZipFile(archive)as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(blobs)+1 and len(set(z.namelist()))==len(z.namelist())
 for r in records:
  for f in r['files']:
   data=z.read('blobs/'+f['sha256']);assert len(data)==f['bytes'] and hashlib.sha256(data).hexdigest()==f['sha256'];assert data==(Path(r['resolvedDirectory'])/f['path']).read_bytes()
receipt={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'ARCHIVED_VERIFIED_NOT_YET_REMOVED','archive':str(archive.resolve()),'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'archiveBytes':archive.stat().st_size,'originalBytes':logical,'uniqueBlobs':len(blobs),'crcAndEveryFileShaVerified':True,'removeExactly':selected,'resolvedBase':str(base),'remainingFinalBuilds':sorted(x.name for x in base.iterdir()if x.is_dir()and x.name not in selected),'manifest':manifest}
(out/'build-archive.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:v for k,v in receipt.items()if k!='manifest'}))
