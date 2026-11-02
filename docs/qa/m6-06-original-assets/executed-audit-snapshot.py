import hashlib,json,re,urllib.request,urllib.error,zipfile
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime,timezone
R=Path('C:/MyZooTwin'); W=Path(__file__).parent/'m6-06-original-assets'; W.mkdir(exist_ok=True)
H=lambda b:hashlib.sha256(b).hexdigest()
J=lambda p:json.loads(p.read_text(encoding='utf-8'))
run=J(R/'.qa/assets-m6-06/latest.json')['runId']; report=J(R/f'.qa/assets-m6-06/{run}/report.json'); B=R/report['buildDirectory']; P=R/'.qa/builds/n20261102T181134Z'
assert all(report['stages'][k]=='PASS' for k in ['unit','check','build'])
assert report['source']['id']==report['sourceAfter']['id']
class Page(HTMLParser):
 def __init__(self,html):
  super().__init__(convert_charrefs=True); self.main=False; self.mains=[]; self.meta={};self.images=[]; self.icons=[];self.title=False;self.titletext=[];self.skip=0;self.feed(html)
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='main':self.main=True
  if t in ['script','style']: self.skip+=1
  if t=='title':self.title=True
  if t=='meta' and ('name'in a or 'property'in a):self.meta[a.get('name',a.get('property'))]=a.get('content')
  if t=='link' and a.get('rel')=='canonical':self.meta['canonical']=a.get('href')
  if t=='link' and a.get('rel')=='icon':self.icons.append(a)
  if t=='img':self.images.append(a)
 def handle_endtag(self,t):
  if t=='main':self.main=False
  if t in ['script','style']:self.skip-=1
  if t=='title':self.title=False
 def handle_data(self,d):
  if self.main and not self.skip:self.mains.extend(d.split())
  if self.title:self.titletext.extend(d.split())
def get(path):
 try:
  with urllib.request.urlopen('http://127.0.0.1:4347'+path)as r:return r.status,r.read(),dict(r.headers)
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
routes=[]
for route in ['/','/animals/','/wildlife/','/pets/','/learn/','/adventures/','/gear/','/about/','/play/']:
 rel=route.lstrip('/')+'index.html';old=Page((P/rel).read_text(encoding='utf-8'));new=Page((B/rel).read_text(encoding='utf-8'));status,body,headers=get(route)
 assert status==200 and H(body)==H((B/rel).read_bytes())
 assert old.mains==new.mains and old.meta==new.meta and old.titletext==new.titletext,(route,'content/metadata regression')
 assert new.meta['canonical']=='https://myzootwin.com'+route
 assert len(new.icons)==1 and new.icons[0]['href']=='/favicon.svg' and new.icons[0]['type']=='image/svg+xml'
 routes.append({'route':route,'status':status,'sha256':H(body),'metadata':new.meta,'title':' '.join(new.titletext),'mainTextTokensPreserved':len(new.mains),'icon':new.icons[0]})
home=Page((B/'index.html').read_text(encoding='utf-8'));img=next(x for x in home.images if x['src']=='/images/tropical-creek-journal.svg');assert img['width']=='1024' and img['height']=='1536' and img.get('alt')
assert routes[0]['metadata']['og:image']==routes[-1]['metadata']['og:image']=='https://myzootwin.com/images/tropical-creek-game.jpg'
ret=J(R/'art/site-assets/legacy-retirement.json');oldhash={x['sha256']for x in ret['originals']};inventory=[]
for p in sorted(B.rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(B).as_posix();raw=p.read_bytes();assert H(raw)not in oldhash,rel
 assert not any(x in rel.split('/')for x in ['.qa','.git','art','docs','tests']) and not rel.endswith(('.zip','.map'))
 inventory.append({'path':rel,'bytes':len(raw),'sha256':H(raw)})
manifest=J(R/'art/site-assets/generated-manifest.json');http=[]
for asset in manifest['outputs']:
 path='/'+asset['path'].removeprefix('public/');status,body,headers=get(path);assert status==200 and H(body)==asset['sha256']
 assert (B/path.lstrip('/')).read_bytes()==(R/asset['path']).read_bytes()
 expected='image/png'if path.endswith('.png')else'image/svg+xml';assert headers['Content-Type']==expected
 http.append({'path':path,'status':status,'bytes':len(body),'sha256':H(body),'contentType':headers['Content-Type']})
assert H((B/'images/tropical-creek-game.jpg').read_bytes())=='6edf52437618a80b94911b846cb2722257739be87c4f96c793f1e808d848e880'
status,body,_=get('/play');assert status==200 and Page(body.decode()).meta['canonical']=='https://myzootwin.com/play/'
status,body,_=get('/sitemap-0.xml');assert status==200 and body.count(b'<loc>')==9
hidden=[]
for path in ['/.qa/archives/m6-06-original-assets/legacy-site-assets.zip','/art/site-assets/legacy-retirement.json']:
 status,_,_=get(path);assert status==404;hidden.append({'path':path,'status':status})
archive=Path(ret['archive']);assert H(archive.read_bytes())==ret['archiveSHA256']
with zipfile.ZipFile(archive)as z:
 assert z.testzip()is None
 for a in ret['originals']:
  assert H(z.read(a['path']))==a['sha256'];assert H((W/'restore-check'/a['path']).read_bytes())==a['sha256']
baseline=sum(p.stat().st_size for p in P.rglob('*')if p.is_file());current=sum(x['bytes']for x in inventory)
result={'at':datetime.now(timezone.utc).isoformat(),'status':'PASS','runId':run,'sourceId':report['source']['id'],'buildId':report['build']['id'],'comparisonBuild':str(P.relative_to(R)),'routes':routes,'primaryImage':img,'directPlay':True,'sitemapRoutes':9,'assetsHTTP':http,'nonDistributedPaths':hidden,'candidateInventory':inventory,'candidateLegacyHashMatches':0,'archiveAndRestoredOriginalsVerified':True,'archiveSHA256':ret['archiveSHA256'],'rawDistribution':{'baselineBytes':baseline,'currentBytes':current,'deltaBytes':current-baseline,'baselineFiles':len(list(P.rglob('*.*'))),'currentFiles':len(inventory)},'limits':'Local compiled candidate only. QA self-only CSP is not Cloudflare verification. Raw file bytes are not download timing/FPS. No real analytics enabled; no owner save access or production changes.'}
(W/'final-audit.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:result[k]for k in ['status','runId','sourceId','buildId','rawDistribution','candidateLegacyHashMatches','archiveAndRestoredOriginalsVerified']}))
