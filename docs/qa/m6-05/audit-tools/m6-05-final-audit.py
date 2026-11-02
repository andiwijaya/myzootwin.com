from pathlib import Path
import json,hashlib,zipfile,datetime,os,subprocess
root=Path(r'C:\MyZooTwin');out=Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-05-audit');run='s20261102T131415Z'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def tree(p):return {f.relative_to(p).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f)} for f in sorted(p.rglob('*')) if f.is_file()}
old=tree(root/'.qa/builds/s20261102T125154Z');new=tree(root/'.qa/builds'/run);assert old==new
analysis=json.loads((root/'.qa/bundle-analysis.json').read_text());assert all(new[c['fileName']]['sha256']==c['sha256']for c in analysis['chunks'])
client=[x['id'] for c in analysis['chunks'] for x in c['modules'] if 'node_modules/'in x['id']and x['renderedLength']>0];assert client and all(x.startswith('node_modules/three/')for x in client)
notice=root/'public/licenses/three-MIT.txt';assert notice.read_bytes()==(root/'node_modules/three/LICENSE').read_bytes()
deps=json.loads((out/'dependencies.json').read_text());notices=[]
for x in deps['installed']:
 p=root/x['path'];effective=x['license'];basis='Installed package.json license field'
 if not effective:
  raw=(p/'LICENSE').read_text();assert raw.startswith('MIT License')and'Copyright (c) 2021 Sachin Raja'in raw;effective='MIT';basis='Installed full MIT LICENSE; package metadata omits license'
 notices.append({**x,'effectiveLicense':effective,'basis':basis,'noticeHashes':[{'path':(p/n).relative_to(root).as_posix(),'bytes':(p/n).stat().st_size,'sha256':sha(p/n)}for n in x['licenseFiles']]})
deps['installed']=notices;deps['effectiveUnresolvedLicenses']=[];deps['noticeFileGaps']=[x['path']for x in notices if not x['licenseFiles']];deps['auditScope']='Local installed metadata and license-file inventory, no registry update/advisory scan or legal sign-off.13 metadata-only notice gaps remain for broader tool/source/native redistribution. Only Three.js is emitted in measured client chunks.';(out/'dependencies.json').write_text(json.dumps(deps,indent=2)+'\n')
assert len(deps['noticeFileGaps'])==13 and not[x for x in deps['notInstalled']if not x['optional']]
m=json.loads((root/'docs/ASSET_MANIFEST.json').read_text());checked=[]
def validate(x):
 if isinstance(x,dict):
  p=x.get('path');h=x.get('sha256')
  if p and h:
   f=root/p;assert f.is_file()and sha(f)==h,p;checked.append(p)
  for v in x.values():validate(v)
 elif isinstance(x,list):
  for v in x:validate(v)
validate(m)
prior=json.loads((out/'existing-asset-integrity.json').read_text());legacy=[x for x in prior if x['id']in['journal_hero','site_favicon']];assert all(sha(root/x['path'])==x['sha256']for x in legacy)
archive=json.loads((out/'build-archive.json').read_text());zpath=Path(archive['archive']);assert sha(zpath)==archive['archiveSha256'];restored=0
with zipfile.ZipFile(zpath)as z:
 assert z.testzip()is None
 for b in archive['manifest']['builds']:
  assert not Path(b['resolvedDirectory']).exists()
  for f in b['files']:
   raw=z.read('blobs/'+f['sha256']);assert len(raw)==f['bytes']and hashlib.sha256(raw).hexdigest()==f['sha256'];restored+=1
assert all((root/'.qa/builds'/x).is_dir()for x in archive['remainingFinalBuilds'])
groups={}
for directory,dirs,files in os.walk(root,followlinks=False):
 dirs[:]=[d for d in dirs if not(Path(directory)/d).is_symlink()and not(Path(directory)/d).is_junction()]
 for name in files:
  p=Path(directory)/name
  if p.is_symlink():continue
  key=p.relative_to(root).parts[0];g=groups.setdefault(key,{'files':0,'bytes':0});g['files']+=1;g['bytes']+=p.stat().st_size
final={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runId':run,'installedPackageInventory':369,'lockPackages':deps['locked'],'optionalNotInstalled':len(deps['notInstalled']),'requiredMissing':0,'npmLsAllExit':0,'unusedCompiler':json.loads((out/'no-unused.json').read_text()),'reachableSourceModules':92,'staticUnreachableCandidates':0,'unresolvedRelativeImports':0,'assetReferencesHashChecked':len(checked),'assetEntries':len(m['assets']),'manifestSHA256':sha(root/'docs/ASSET_MANIFEST.json'),'README_SHA256':sha(root/'README.md'),'legacyBytesPreserved':legacy,'thirdPartyClientModules':client,'threeNoticeSHA256':sha(notice),'fullTransitiveRedistributionNoticeClearance':False,'noticeFileGaps':13,'buildEquality':{'prior':'s20261102T125154Z','final':run,'allFilesByteIdentical':True,'files':len(new),'priorNativeEvidence':'docs/qa/m6-04/native.json and HUD/recovery receipts; source/runtime-byte reuse only, no new browser/device pass'},'buildFiles':new,'archiveVerifiedAfterRemoval':{'archive':archive['archive'],'sha256':archive['archiveSha256'],'builds':8,'reconstructedFileByteHashes':restored,'crcVerified':True,'netBytesReclaimed':archive['originalBytes']-archive['archiveBytes'],'restoreExecutedToFilesystem':False,'roundtrip':'Every file read back from archived blobs and compared by size/SHA; no in-place restore attempted'},'sizeBefore':json.loads((out/'before.json').read_text())['totalBytes'],'sizeAfterBeforeNewReceipts':sum(x['bytes']for x in groups.values()),'groupsAfterBeforeNewReceipts':groups,'scope':'Logical file bytes; .git/node_modules/QA included, filesystem overhead excluded; final commit/receipts add a small amount','restrictions':'No owner save/browser/preview changes; denied download/QA46 untouched; no installs/push/deploy/Actions/login/grants'}
(out/'final-audit.json').write_text(json.dumps(final,indent=2)+'\n')
print(json.dumps({k:v for k,v in final.items()if k in['assetReferencesHashChecked','assetEntries','sizeBefore','sizeAfterBeforeNewReceipts','archiveVerifiedAfterRemoval','buildEquality','manifestSHA256']}))
