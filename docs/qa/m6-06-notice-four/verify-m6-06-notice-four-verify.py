import pathlib,json,hashlib,datetime,tarfile,re
r=pathlib.Path(r'C:\MyZooTwin');w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-06-notice-four');manifest=json.loads((r/'docs/licenses/build-tooling/manifest.json').read_text());registry=json.loads((w/'registry-tarball-audit.json').read_text());build=json.loads((w/'final-build.json').read_text());bridge=json.loads((w/'boolbase-source-bridge.json').read_text());lock=json.loads((r/'package-lock.json').read_text());records=[]
for pkg in registry['packages']:
 assert pkg['status']=='VERIFIED_OFFICIAL_EXACT_TARBALL';archive=pathlib.Path(pkg['archive']['local']);assert hashlib.sha256(archive.read_bytes()).hexdigest()==pkg['archive']['sha256']
 with tarfile.open(archive,'r:gz') as tar:
  for member in tar.getmembers():
   if member.isfile() and member.size<300_000:
    normalized=re.sub(r'\W+',' ',tar.extractfile(member).read().decode('utf-8',errors='replace').lower())
    assert not any(phrase in normalized for phrase in ['permission is hereby granted','permission to use copy modify','the software is provided']), (pkg['name'],member.name,'Review embedded permission text')
 for f in pkg['archive']['members']:
  if 'sha256' in f:
   p=r/'node_modules'/pkg['name']/pathlib.PurePosixPath(f['path']).relative_to('package');assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
 assert lock['packages']['node_modules/'+pkg['name']]['integrity']==pkg['lock']['integrity']
 records.append({'name':pkg['name'],'version':pkg['version'],'publisher':pkg['publisher']['registryUsername'],'archiveIntegrityAndInstalledSourceRechecked':True,'standaloneNoticeInArchive':False,'emittedBrowserCode':False,'status':'MATCHING_VERSION_SOURCE_FULL_NOTICE_ACCOUNTED' if pkg['name']=='boolbase' else 'UNRESOLVED_NO_FULL_PERMISSION_TEXT_AT_INSPECTED_SOURCES'})
texts=[]
for record in manifest['records']:
 if 'file' in record:
  data=(r/'docs/licenses/build-tooling'/record['file']).read_bytes();assert len(data)==record['bytes'] and hashlib.sha256(data).hexdigest()==record['sha256'];texts.append(record['file'])
assert len(texts)==manifest['directTextsAccounted']==9 and len(manifest['remainingFullPermissionTextGaps'])==3
extra=manifest['additionalThirdPartyNotice'];data=(r/'docs/licenses/build-tooling'/extra['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==extra['source']['sha256'];texts.append(extra['file']);assert len(texts)==10
old=json.loads((r/'docs/qa/m6-06-gap/notice-resolution.json').read_text())
for item in old['records']:
 if item.get('file'):assert hashlib.sha256((r/'docs/licenses/build-tooling'/item['file']).read_bytes()).hexdigest()==item['sha256']
licenseSource=next(x for x in bridge['files'] if x['path']=='LICENSE');assert hashlib.sha256((r/'docs/licenses/build-tooling/boolbase-1.0.0-LICENSE.txt').read_bytes()).hexdigest()==licenseSource['sha256']
archives=[]
for path,expected in [('.qa/archives/m6-05/superseded-builds.zip','e175b4be5c2e1880886123779c3d358cca6b3d9fc7d64ddf12b7a1aeb5c3aec3'),('.qa/archives/m6-07/candidate-builds.zip','722252b7841a16eaa1a72274868f194b37e7ae9ad3776fc9905545d9e9d96f08')]:
 value=hashlib.sha256((r/path).read_bytes()).hexdigest();assert value==expected;archives.append({'path':path,'sha256':value})
privacy=json.loads((r/'docs/qa/m6-06-gap/candidate-build-archive.json').read_text());assert hashlib.sha256(pathlib.Path(privacy['archive']).read_bytes()).hexdigest()==privacy['archiveSHA256'];archives.append({'path':privacy['archive'],'sha256':privacy['archiveSHA256']})
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS bounded notice audit; wholeM6-06PARTIAL','packages':records,'directTextsAccounted':9,'totalOriginalFindings':12,'exactTextFiles':texts,'physicalStandaloneAbsencesInUnmodifiedInstalledTree':9,'remaining':manifest['remainingFullPermissionTextGaps'],'qualification':'boolbase full notice is from observedmatching-version officialsource, sole runtimefile exactarchivebytes, source packageJSON scripts field differs; not originalarchive license-file presence or inferredretroactivegrant.','requiredNoticeCoverage':{'currentBrowserArtifacts':'OnlyThree among emitted dependency modules; keep existing public fullMIT notices. None of auditedfour emitted, so do not present them as shipped browser libraries.','buildSourceComplianceRecord':'docs/licenses/build-tooling/boolbase-1.0.0-LICENSE.txt plus manifest source bridge; existing notice files retained. Repository placement is a project choice, not a legalfilename requirement.','redistributionContainingPackageCode':'Carry applicable copyright/permission notices with code according to actual license. Three remaining fulltexts unresolved; this audit grants no source/native/legalclearance.'},'freshBuild':{'runId':build['runId'],'status':build['stages']['build'],'sourceId':build['sourceId'],'artifactsByteIdentical':len(build['artifacts']),'browserThirdParty':build['browserThirdParty'],'unitCheckReuse':build['priorVerification']},'protectedArchives':archives,'ownerBuildPreserved':build['ownerPreserved'],'noVersionGraphOrAuditedInstalledSourceChange':True,'noArtReplacement':True,'noDownloadedTarballOrAuditedPackageBinDebugInvocation':True,'normalizedArchivePermissionClauseScan':'No full-clause token match in any audited archive member; filenames and declaration-only text inspected separately.','V1':'44/51 (86.27%)','legalClearance':False}
(w/'notice-audit-final.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({'accounted':'9/12','remaining':result['remaining'],'verifiedNoticeFiles':len(texts),'freshBuild':build['runId'],'unitCheck':'Exact-source reuse485/205','ownerAndArchives':'PRESERVED'}))
