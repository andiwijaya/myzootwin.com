import pathlib,json,urllib.request,urllib.parse,urllib.error,hashlib,datetime
w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-06-notice-four');up=json.loads((w/'current-upstream-audit.json').read_text());candidate=next(x for x in up['records'] if x['name']=='boolbase');assert candidate['status']=='CURRENT_NOTICE_CANDIDATE_ONLY'
url='https://api.github.com/repos/'+candidate['repository']+'/commits?'+urllib.parse.urlencode({'path':candidate['path'],'per_page':10});row={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':url,'maxHistoryEntries':10,'automaticRetries':False}
try:
 req=urllib.request.Request(url,headers={'Accept':'application/vnd.github+json','User-Agent':'MyZooTwin-local-license-audit'})
 with urllib.request.urlopen(req,timeout=20) as response:
  data=response.read(2_000_001);assert len(data)<=2_000_000;values=json.loads(data);row.update(HTTP=response.status,responseSHA256=hashlib.sha256(data).hexdigest(),pagination=response.headers.get('Link'),entries=[{'sha':x['sha'],'message':x['commit']['message'],'date':x['commit']['committer']['date'],'githubAuthorLogin':(x.get('author') or {}).get('login')} for x in values],status='READ')
  row['eligibleOldestObservedCommit']=values[-1]['sha'] if values and not response.headers.get('Link') else None
except urllib.error.HTTPError as e:row.update(status='READ_FAILED_NO_RETRY',HTTP=e.code,denied=e.code in [401,403],reason=str(e))
except Exception as e:row.update(status='READ_FAILED_NO_RETRY',reason=str(e))
(w/'boolbase-license-history.json').write_text(json.dumps(row,indent=2)+'\n',encoding='utf-8');print(json.dumps(row))
