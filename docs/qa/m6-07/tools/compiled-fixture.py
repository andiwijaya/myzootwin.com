import pathlib,json,re
r=pathlib.Path(r'C:\MyZooTwin');run=json.loads((r/'.qa/integration-m6-07/latest.json').read_text())['runId'];assert re.fullmatch(r's\d{8}T\d{6}Z',run)
report=json.loads((r/'.qa/integration-m6-07'/run/'report.json').read_text());html=(r/report['buildDirectory']/'play/index.html').read_text(encoding='utf-8')
modules=re.findall(r'<script([^>]*)>(.*?)</script>',html,re.S);assert all(not body.strip() for attrs,body in modules), 'Game CSP forbids inlined processed scripts'
assert any('BaseLayout' in attrs for attrs,body in modules),'Compiled external BaseLayout script missing'
html=re.sub(r'<script\b[^>]*src="[^"]*PlayEntry[^"]*"[^>]*>.*?</script>','',html,flags=re.S)
html=html.replace('src="/_astro/','src="/'+report['buildDirectory']+'/_astro/').replace('href="/_astro/','href="/'+report['buildDirectory']+'/_astro/')
html=re.sub(r'<html\b([^>]*)>',lambda m:'<html'+m[1]+' data-qa-run-id="'+run+' / '+report['source']['id']+' / '+report['build']['id']+'">',html,count=1)
html=html.replace('</body>','<script type="module" src="/tests/browser/compiled-site-observer.mjs"></script></body>')
(r/'tests/browser/.generated/compiled-site-harness.html').write_text(html,encoding='utf-8')
print('Compiled BaseLayout/CSP fixture generated; game entry removed, no owner IDB access.')
