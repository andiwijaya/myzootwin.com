import pathlib,json,urllib.request,urllib.error,urllib.parse,base64,hashlib,datetime
w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-06-notice-four');audit=json.loads((w/'registry-tarball-audit.json').read_text());folder=w/'upstream-candidates';folder.mkdir(exist_ok=True)
records=[];stopped=False
def get(url):
 request=urllib.request.Request(url,headers={'Accept':'application/vnd.github+json','User-Agent':'MyZooTwin-local-license-audit'})
 with urllib.request.urlopen(request,timeout=20) as response:
  data=response.read(2_000_001);assert len(data)<=2_000_000;assert urllib.parse.urlparse(response.geturl()).hostname=='api.github.com';return json.loads(data),{'url':url,'finalURL':response.geturl(),'HTTP':response.status,'responseSHA256':hashlib.sha256(data).hexdigest()}
for pkg in audit['packages']:
 if stopped:records.append({'name':pkg['name'],'status':'UNRUN_AFTER_DENIED_UPSTREAM_READ'});continue
 url=pkg['repository']['url'].removeprefix('git+').removesuffix('.git');repo=urllib.parse.urlparse(url).path.strip('/');requestURL='https://api.github.com/repos/'+repo+'/license';row={'name':pkg['name'],'version':pkg['version'],'repository':repo,'target':requestURL,'requests':[]}
 try:
  value,receipt=get(requestURL);row['requests'].append(receipt);text=base64.b64decode(value['content']);assert hashlib.sha1(b'blob '+str(len(text)).encode()+b'\0'+text).hexdigest()==value['sha'];full=any(x in text.lower() for x in [b'permission is hereby granted',b'permission to use, copy, modify'])
  local=folder/(pkg['name']+'-current-'+pathlib.PurePosixPath(value['path']).name);assert not local.exists();local.write_bytes(text)
  row.update(status='CURRENT_NOTICE_CANDIDATE_ONLY' if full else 'CURRENT_ENDPOINT_NOT_FULL_PERMISSION_TEXT',path=value['path'],blobSHA1=value['sha'],sha256=hashlib.sha256(text).hexdigest(),bytes=len(text),sourceURL=value.get('html_url'),local=str(local),fullPermissionText=full,upstreamSPDX=(value.get('license') or {}).get('spdx_id'),versionCoverage='Not yet established for locked version; no retroactive application inferred.')
 except urllib.error.HTTPError as e:
  if e.code==404:row.update(status='NO_CURRENT_LICENSE_ENDPOINT',HTTP=404,reason='Public repository license endpoint reports not found; prior exact-tag/tree read also had no full notice. Stop this package search after exact tarball absence and this endpoint. No filename guessing.')
  else:row.update(status='READ_FAILED_NO_RETRY',HTTP=e.code,reason=str(e),denied=e.code in [401,403]);stopped=e.code in [401,403]
 except Exception as e:row.update(status='READ_FAILED_NO_RETRY',reason=str(e))
 records.append(row);print(json.dumps({'name':row['name'],'status':row['status'],'bytes':row.get('bytes')}),flush=True)
(w/'current-upstream-audit.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'anonymous':True,'automaticRetries':False,'stopAfterDenial':stopped,'records':records},indent=2)+'\n',encoding='utf-8')
