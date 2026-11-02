import pathlib,json,hashlib,re,struct
from html.parser import HTMLParser
r=pathlib.Path(r'C:\MyZooTwin');w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-07')
latest=json.loads((r/'.qa/integration-m6-07/latest.json').read_text());run=latest['runId'];d=r/'.qa/integration-m6-07'/run;report=json.loads((d/'report.json').read_text());build=r/report['buildDirectory'];old=r/'.qa/builds/s20261102T135958Z'
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.ids=set();self.anchors=[];self.main=[];self.head={};self.inmain=False;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='main':self.inmain=True
  if tag=='a' and 'href' in a:self.anchors.append(a['href'])
  if tag=='meta':self.head[a.get('name',a.get('property',''))]=a.get('content')
  if tag=='link' and a.get('rel')=='canonical':self.head['canonical']=a.get('href')
 def handle_endtag(self,tag):
  if tag=='main':self.inmain=False
 def handle_data(self,data):
  if self.inmain and data.strip():self.main.append(' '.join(data.split()))
def load(base,path):return Page((base/path/'index.html').read_text(encoding='utf-8'))
rows=[]
for path in ['','animals','wildlife','pets','learn','adventures','gear','about','play']:
 a,b=load(old,path),load(build,path)
 legacy=b.main;position=0;missing=[]
 if path!='play':
  for token in a.main:
   try:position=legacy.index(token,position)+1
   except ValueError:missing.append(token)
 broken=[]
 for link in b.anchors:
  if not link.startswith(('/','#')) or link.startswith('//'):continue
  href,_,fragment=link.partition('#');targetPath=href.strip('/') if href else path
  target=build/targetPath
  if target.is_dir():target=target/'index.html'
  if not target.exists():broken.append(link);continue
  if fragment and target.suffix=='.html' and fragment not in Page(target.read_text(encoding='utf-8')).ids:broken.append(link)
 metaKeys=['canonical','description','og:title','og:description','og:url','twitter:title','twitter:description']
 changed={k:{'before':a.head.get(k),'after':b.head.get(k)} for k in metaKeys if a.head.get(k)!=b.head.get(k)}
 if path not in ['','play']:assert not changed,(path,changed)
 assert not missing and not broken,(path,missing,broken)
 html=(build/path/'index.html').read_text(encoding='utf-8');scripts=[{'attrs':attrs,'inlineBytes':len(body.strip().encode())} for attrs,body in re.findall(r'<script([^>]*)>(.*?)</script>',html,re.S)]
 assert any('BaseLayout' in x['attrs'] for x in scripts),(path,'external site script missing')
 if path=='play':assert all(x['inlineBytes']==0 for x in scripts),'Inline game script conflicts with CSP'
 if path=='':assert 'PlayEntry.astro_astro_type_script' not in html and 'foundation-scene.' not in html,'Game loaded on homepage'
 rows.append({'path':'/'+(path+'/' if path else ''),'canonical':b.head['canonical'],'legacyMainTextPreservedInOrder':path!='play','missingLegacyTokens':missing,'brokenInternalLinks':broken,'intentionalMetadataChanges':changed,'h1Count':html.count('<h1'),'socialImage':b.head.get('og:image'),'scripts':scripts})
png=(r/'public/images/tropical-creek-game.jpg').read_bytes();assert png[:2]==b'\xff\xd8'
i=2;dims=None
while i<len(png):
 if png[i]!=255:i+=1;continue
 while png[i]==255:i+=1
 marker=png[i];i+=1
 if marker in [0xd8,0xd9] or 0xd0<=marker<=0xd7:continue
 length=int.from_bytes(png[i:i+2],'big');assert length>=2 and i+length<=len(png)
 if marker in [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]:
  height,width=struct.unpack('>HH',png[i+3:i+7]);dims=(width,height);break
 i+=length
assert dims==(1366,768)
originalHashes={name:hashlib.sha256((r/name).read_bytes()).hexdigest() for name in ['public/images/myzootwin-beranda.png','public/favicon.svg','package.json','package-lock.json']}
import subprocess
oldSource=json.loads((r/'docs/qa/m6-06/final-local/report.json').read_text(encoding='utf-8'))['source']['entries'];oldRaw={x['path']:x['sha256'] for x in oldSource}
for name,value in originalHashes.items():
 if name.startswith('public/'):
  assert hashlib.sha256(subprocess.check_output(['git','show','e311ea05e1a090492b3ddf618c69584133b4c75a:'+name],cwd=r)).hexdigest()==value,name
 else:
  assert oldRaw[name]==value,name # Compare exact prior working bytes, not Git LF-normalized blobs.
  assert json.loads(subprocess.check_output(['git','show','e311ea05e1a090492b3ddf618c69584133b4c75a:'+name],cwd=r))==json.loads((r/name).read_text()),name
result={'status':'PASS','runId':run,'sourceId':report['source']['id'],'buildId':report['build']['id'],'routes':rows,'poster':{'bytes':len(png),'dimensions':dims,'sha256':hashlib.sha256(png).hexdigest()},'originalAssetsAndLockUnchanged':originalHashes,'notes':['Home H1/title/description intentionally updated; original home content retained, old H1 becomes H2.','Learn gains an aside; its original metadata and all legacy journal main-text tokens remain.','Play description now describes actual four-mission development preview; ID translation separately verified natively.','Physical/production/consent clearance not implied.']}
(w/'structural-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':'PASS','run':run,'routes':len(rows),'posterBytes':len(png),'lockUnchanged':True}))
