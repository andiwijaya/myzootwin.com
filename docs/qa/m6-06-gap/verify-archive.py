import pathlib,json,hashlib,zipfile,shutil,datetime
r=pathlib.Path(r'C:\MyZooTwin').resolve();builds=(r/'.qa/builds').resolve();w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-06-gap')
groups={'security-m6-06':['s20261102T133930Z','s20261102T134216Z','s20261102T135153Z'],'privacy-m6-06':['s20261102T161201Z','s20261102T162243Z']}
entries=[];targets=[];blobs={}
for scope,runs in groups.items():
 latest=json.loads((r/'.qa'/scope/'latest.json').read_text())['runId'];assert latest not in runs
 for run in runs:
  target=(builds/run).resolve();assert target.parent==builds and target.is_dir() and not target.is_symlink() and not target.is_junction(),target
  report=json.loads((r/'.qa'/scope/run/'report.json').read_text());expected={x['path']:x['sha256'] for x in report['build']['entries']};seen=[]
  for p in sorted(target.rglob('*')):
   assert not p.is_symlink() and not p.is_junction(),p
   if not p.is_file():continue
   rel=p.relative_to(r).as_posix();data=p.read_bytes();sha=hashlib.sha256(data).hexdigest();assert expected.get(rel)==sha,rel
   entries.append({'scope':scope,'runId':run,'path':rel,'relativeToRun':p.relative_to(target).as_posix(),'blob':'blobs/'+sha,'bytes':len(data),'sha256':sha});seen.append(rel);blobs.setdefault(sha,p)
  assert set(expected)==set(seen),run;targets.append(target)
archive=r/'.qa/archives/m6-06-gap/superseded-builds.zip';archive.parent.mkdir(parents=True,exist_ok=True);assert not archive.exists()
total=sum(x['bytes'] for x in entries);assert total<100_000_000
with zipfile.ZipFile(archive,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for sha,p in sorted(blobs.items()):z.write(p,'blobs/'+sha)
 z.writestr('manifest.json',json.dumps(entries,indent=2)+'\n')
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None and len(z.namelist())==len(blobs)+1
 for item in entries:assert hashlib.sha256(z.read(item['blob'])).hexdigest()==item['sha256']
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'archive':str(archive),'archiveSHA256':hashlib.sha256(archive.read_bytes()).hexdigest(),'archiveBytes':archive.stat().st_size,'originalBytes':total,'uniqueBlobs':len(blobs),'entries':entries,'verifiedCRCAndEveryFileSHA':True,'restore':'Read manifest; validate relativeToRun has no absolute/parent components. Reconstruct only selected run into NEW EMPTY .qa/restored/<runId>, from matching blobs and verify every SHA. No in-place restore executed.','sourceMediaOwnerBuildTouched':False,'originalReportsRetained':True}
(w/'candidate-build-archive.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
# Absolute resolved targets constrained to the explicit generated-build root, no links/junctions. Recheck all bytes immediately before removing only verified archived copies.
for target in targets:
 assert target.resolve().parent==builds and not target.is_symlink() and not target.is_junction()
 for item in entries:
  if item['runId']==target.name:assert hashlib.sha256((r/item['path']).read_bytes()).hexdigest()==item['sha256']
 shutil.rmtree(target)
result.update(removalVerified=all(not p.exists() for p in targets),remainingLooseBuilds=len(list(builds.iterdir())),netBytesReclaimed=total-archive.stat().st_size)
(w/'candidate-build-archive.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:result[k] for k in ['uniqueBlobs','originalBytes','archiveBytes','netBytesReclaimed','remainingLooseBuilds']}))
