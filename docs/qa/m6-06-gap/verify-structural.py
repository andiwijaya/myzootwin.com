import pathlib,json,hashlib,re,struct
from html.parser import HTMLParser
r=pathlib.Path(r'C:\MyZooTwin');w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-06-gap')
run=json.loads((r/'.qa/privacy-m6-06/latest.json').read_text())['runId'];d=r/'.qa/privacy-m6-06'/run;report=json.loads((d/'report.json').read_text());build=r/report['buildDirectory'];old=r/'.qa/builds/s20261102T151611Z'
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.ids=set();self.links=[];self.main=[];self.head={};self.inmain=False;self.title=False;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='main':self.inmain=True
  if tag=='title':self.title=True
  if tag=='a' and 'href' in a:self.links.append(a['href'])
  if tag=='meta':self.head[a.get('name',a.get('property',''))]=a.get('content')
  if tag=='link' and a.get('rel')=='canonical':self.head['canonical']=a.get('href')
 def handle_endtag(self,tag):
  if tag=='main':self.inmain=False
  if tag=='title':self.title=False
 def handle_data(self,data):
  if self.inmain and data.strip():self.main.append(' '.join(data.split()))
  if self.title:self.head['title']=data
rows=[]
for path in ['','animals','wildlife','pets','learn','adventures','gear','about','play']:
 html=(build/path/'index.html').read_text(encoding='utf-8');before=Page((old/path/'index.html').read_text(encoding='utf-8'));after=Page(html)
 pos=0;missing=[];broken=[]
 if path!='play':
  for token in before.main:
   try:pos=after.main.index(token,pos)+1
   except ValueError:missing.append(token)
 for link in after.links:
  if not link.startswith(('/','#')) or link.startswith('//'):continue
  href,_,fragment=link.partition('#');target=build/(href.strip('/') if href else path)
  if target.is_dir():target=target/'index.html'
  if not target.exists() or fragment and target.suffix=='.html' and fragment not in Page(target.read_text(encoding='utf-8')).ids:broken.append(link)
 keys=['title','canonical','description','og:title','og:description','og:url','og:image','twitter:title','twitter:description','twitter:image']
 changed={k:[before.head.get(k),after.head.get(k)] for k in keys if before.head.get(k)!=after.head.get(k)}
 scripts=[{'attrs':a,'inlineBytes':len(b.strip().encode())} for a,b in re.findall(r'<script([^>]*)>(.*?)</script>',html,re.S)]
 assert not missing and not broken and not changed,(path,missing,broken,changed)
 assert all(x['inlineBytes']==0 for x in scripts),(path,'inline code')
 assert not re.search(r'<(?:script|link)[^>]+(?:src|href)=[\"\'][^\"\']*(?:googletagmanager|google-analytics|fonts.googleapis|fonts.gstatic)',html,re.I),(path,'preloaded external resource')
 assert 'G-QACONSENT000' in html,(path,'synthetic retained config missing')
 rows.append({'path':'/'+(path+'/' if path else ''),'canonical':after.head['canonical'],'metadataUnchanged':True,'journalMainTextRetainedInOrder':path!='play','brokenInternalLinks':broken,'scripts':scripts,'staticExternalAnalyticsOrFonts':False})
previous=json.loads((r/'docs/qa/m6-07/final-local/report.json').read_text())['source']['entries'];prior={x['path']:x['sha256'] for x in previous}
protected={}
for name in ['package.json','package-lock.json','public/images/myzootwin-beranda.png','public/favicon.svg','public/licenses/three-MIT.txt','public/licenses/third-party-notices.txt']:
 digest=hashlib.sha256((r/name).read_bytes()).hexdigest();assert digest==prior[name],name;protected[name]=digest
fontURLs=[]
for p in build.rglob('*.css'):
 for url in re.findall(r'url\((.*?)\)',p.read_text()):
  if 'http' in url:fontURLs.append(url)
assert not fontURLs,fontURLs
maps=list(build.rglob('*.map'));assert not maps
moduleFile=d/'bundle-analysis.json'
if not moduleFile.exists():
 candidates=list((r/'.qa').glob('**/*bundle*.json'));print('Bundle metadata candidates',[(str(x.relative_to(r)),x.stat().st_size) for x in candidates[-5:]])
shots=[]
for p in sorted(w.glob('*.jpg')):
 data=p.read_bytes();i=2;dims=None
 while i<len(data):
  if data[i]!=255:i+=1;continue
  while data[i]==255:i+=1
  marker=data[i];i+=1
  if marker in [0xd8,0xd9] or 0xd0<=marker<=0xd7:continue
  length=int.from_bytes(data[i:i+2],'big')
  if marker in [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]:
   height,width=struct.unpack('>HH',data[i+3:i+7]);dims=[width,height];break
  i+=length
 assert dims,p;shots.append({'file':p.name,'bytes':len(data),'format':'JPEG','encodedBitmap':dims,'sha256':hashlib.sha256(data).hexdigest(),'note':'Encoded screenshot bitmap dimensions, not assumed CSS viewport/device pixels.'})
result={'status':'PASS','runId':run,'sourceId':report['source']['id'],'buildId':report['build']['id'],'routes':rows,'unchangedProtectedFiles':protected,'remoteCssURLs':fontURLs,'sourceMaps':len(maps),'screenshots':shots,'limits':['Synthetic public GA ID retained for negative testing; no real provider enabled.','CSS font-family names remain device fallback, no remote font request.','Compiled UI real negative opt-out; positive cases use fake transport.','QA response CSP does not configure production hosting.']}
(w/'structural-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':'PASS','routes':len(rows),'shots':len(shots),'run':run}))
