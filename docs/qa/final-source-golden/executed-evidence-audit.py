import json,hashlib,re
from pathlib import Path
from datetime import datetime,timezone
R=Path('C:/MyZooTwin');D=R/'docs/qa/final-source-golden';J=lambda p:json.loads(p.read_text(encoding='utf-8'));write=lambda p,x:p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
server=J(D/'server-final.json');B=R/server['buildDirectory'];rows=[]
for x in server['requests']:
 rel=x['path'].lstrip('/');p=B/(rel or 'index.html')
 if p.is_dir():p=p/'index.html'
 if not p.exists()and not Path(rel).suffix:p=B/rel/'index.html'
 if x['status']==200:
  assert p.is_file(),x
  assert hashlib.sha256(p.read_bytes()).hexdigest()==x['sha256'],x
 rows.append({'path':x['path'],'status':x['status'],'bytes':x['bytes'],'sha256':x['sha256'],'exactCandidateBytes':x['status']==200})
non200=[x for x in rows if x['status']!=200]
assert all(x['path']=='/favicon.ico'and x['status']==404 for x in non200)
assert all('favicon.ico'not in p.read_text(encoding='utf-8')for p in B.rglob('*.html'))
assert '/favicon.svg'in(B/'play/index.html').read_text(encoding='utf-8')
assert any(x['path']=='/favicon.svg'and x['status']==200 for x in rows)
assert server.get('requestsCapped')is not True
write(D/'served-byte-audit.json',{'status':'PASS for exact candidate responses; nonblocking undeclared icon probes recorded','requests':rows,'sourceId':server['sourceId'],'buildId':server['buildId'],'non200':non200,'classification':'Four/favicon.ico404 requests; no candidateHTML references.ico, declared/favicon.svg was200. Initiator not instrumented. Optional compatibility observation, no failed declared game asset or blocking journey failure. Do not call all requests200.','basis':'Actual browser-request receipts verified against exact candidate files after shutdown; no new network/test loop.'})
steps={x['label']:x for x in J(D/'steps.json')};assert int(re.search(r'Completed bird viewing: (\d+)',steps['G13-Q03-progress']['snapshot']).group(1))>=1
write(D/'execution-notes.json',{'freshRuntime':'Old browser variable was absent in newREPL. Known authorizedChrome3 was initialized before anyUI; no prior tab/profile claim or permission change.','readerAssertion':'Initial evidence reader expected literal4missions in collapsed AXsnapshot and asserted. Inspected nativeAllmissionscomplete plus recordedDOMsave-detail4missions before/after, then corrected comparison to those distinct signals. No game/source manipulation or rerun to manufacture pass.','requestAuditAssertion':'Initial audit assumed allHTTP200 and asserted on4undeclared/favicon.ico404 probes. Confirmed no.icoHTML reference and declared.svg200, retained every404 explicitly as nonblocking compatibility observation. No source change or extra browser loop.','stdoutHelper':'Readback helper hit Windows stdout encoding for checkmark and one later shell helper had a literal newline quoting error; read-only helpers only, no source/data changes. Structured local script performs final receipt audit.','close':'ImmediatepostClose tabslist showed a stale ownedtab; next fresh list wasempty. No duplicateclose retry. Viewportreset succeeded before originaltabclose.','blockedOperations':'No new denial/pending/uncertain action. Inherited recoverydownload/QA46/frozenbaseline restrictions not retried.','testing':'Currentsource/compiledbuild unchanged. Fresh nativeonejourney only, no Edge/device/background/recording loop, no fresh unit/check/build claimed.'})
issues=J(D/'issue-disposition.json');issues['nonBlockingCurrentObservation']={'target':'/favicon.ico','result':'Four404 responses; path not referenced by any candidateHTML. Actualdeclared/favicon.svg200 and exactbytes. Initiatoruntraced, no blockingdeclaredassetfailure.','independentlyPossible':'Optionaloriginal-art-derivedICOcompatibility can be considered afterdispatch, not added in this slice and not a new PRDblocker.'};write(D/'issue-disposition.json',issues)
files=[{'path':p.relative_to(D).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted(D.rglob('*'))if p.is_file()and p.name!='evidence-inventory.json']
write(D/'evidence-inventory.json',{'at':datetime.now(timezone.utc).isoformat(),'files':files,'bytes':sum(x['bytes']for x in files),'observations':len(J(D/'steps.json')),'progress':'44/51 unchanged,7unchecked exactly fromPRD','sourceId':server['sourceId'],'buildId':server['buildId']})
prd=(R/'docs/MYZOOTWIN_MASTER_PRD_V1.md').read_text(encoding='utf-8');checks=re.findall(r'^- \[([ x])\] \*\*(M[0-6]-[0-9]{2})',prd,re.M);assert len(checks)==51 and sum(x=='x'for x,_ in checks)==44
assert [i for x,i in checks if x==' ']==[x['id']for x in J(D/'seven-open-gates.json')]
print(json.dumps({'requestsVerified':len(rows),'evidenceFiles':len(files),'evidenceBytes':sum(x['bytes']for x in files),'checkboxes':'44/51,seven unchanged','status':'PASS'}))
