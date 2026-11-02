import pathlib,json,hashlib,math,collections,datetime,subprocess
r=pathlib.Path(r'C:\MyZooTwin');w=pathlib.Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-01-gpu-investigation');raw=json.loads((w/'raw-current.json').read_text());assert raw['status']=='PASS12 bounded windows' and len(raw['results'])==12
def percentile(a,f):return sorted(a)[math.ceil(len(a)*f)-1] if a else None
def stats(a):return {'samples':len(a),'p50Ms':percentile(a,.5),'p95Ms':percentile(a,.95),'maxMs':max(a) if a else None}
summaries=[];total=0
for x in raw['results']:
 rows=x['renderRows'];g=x['gpu'];assert x['visibility']=='visible' and len(rows)>=20 and g['status']=='OBSERVED_GPU_ELAPSED'
 assert g['counterBits']==64 and g['disjoint']==0 and g['glError']==0 and not g['overflow'] and not g['pending'] and not g['invalidValues'] and not x['skippedQueries'] and not x['remainingQueries']
 assert len(rows)==g['submitted']==g['completed'] and all(a['nanoseconds'] is not None and a['completedAt']>=a['submittedAt'] for a in rows)
 for key,subset in [('all',rows),('legacyRetained',[a for a in rows if a['completedWhileCollecting']][-300:]),('rafOnly',[a for a in rows if a['kind']=='raf']),('replayOnly',[a for a in rows if a['kind']=='replay'])]:
  recalculated=stats([a['nanoseconds']/1e6 for a in subset]);assert recalculated==g[key],(x['index'],key)
 signature=collections.Counter((a['bufferWidth'],a['bufferHeight'],a['calls'],a['triangles']) for a in rows)
 summaries.append({'phase':x['phase'],'index':x['index'],'graphics':x['graphics'],'speed':x['speed'],'gpuP50Ms':g['all']['p50Ms'],'gpuP95Ms':g['all']['p95Ms'],'cpuCallbackP95Ms':x['cpuCallback']['p95Ms'],'cpuSubmitP95Ms':x['cpuRenderSubmit']['p95Ms'],'queryDrainMs':x['queryDrainMs'],'lateResults':g['legacyExcludedLate'],'legacyP95Ms':g['legacyRetained']['p95Ms'],'legacyMinusFullP95Ms':g['legacyRetained']['p95Ms']-g['all']['p95Ms'],'GPUtimingKinds':dict(collections.Counter(a['kind'] for a in rows)),'workloadSignatures':[{'buffer':[s[0],s[1]],'calls':s[2],'triangles':s[3],'samples':n} for s,n in sorted(signature.items())],'samples':len(rows),'warmStateTick':x['before']['simulationTick'],'endTick':x.get('after',x['before'])['simulationTick'],'fixtureHash':x.get('fixtureHash'),'frozenHash':x.get('frozenStateHash'),'env':x['env']});total+=len(rows)
pairs=[]
for a,b in [(0,7),(1,6),(2,5),(3,4)]:
 x,y=raw['results'][a],raw['results'][b];assert x['fixtureHash']==y['fixtureHash'];assert x['before']['bufferWidth']==y['before']['bufferWidth'] and x['before']['bufferHeight']==y['before']['bufferHeight']
 p,q=x['gpu']['all']['p95Ms'],y['gpu']['all']['p95Ms'];pairs.append({'graphics':x['graphics'],'speed':x['speed'],'indices':[a,b],'sameInitialFixture':True,'gpuP95Ms':[p,q],'changePercent':(q/p-1)*100,'sameEndpointTick':x['before']['simulationTick']==y['before']['simulationTick'],'endpointTicks':[x['before']['simulationTick'],y['before']['simulationTick']]})
frozen=raw['results'][8:];assert len({x['frozenStateHash'] for x in frozen})==1 and len({x['tick'] for x in frozen})==1
frozenSigs={tuple((p['bufferWidth'],p['bufferHeight'],p['calls'],p['triangles']) for p in x['renderRows']) for x in frozen}
signatures={tuple((s['buffer'][0],s['buffer'][1],s['calls'],s['triangles']) for s in x['workloadSignatures']) for x in summaries[8:]};assert len(signatures)==1 and len(summaries[8]['workloadSignatures'])==1
f95=[x['gpu']['all']['p95Ms'] for x in frozen]
assert raw['maxActive']==1 and raw['maxProductPending']==1 and raw['active']==0 and raw['productPending']==0 and not raw['replayPending']
for x in raw['lifecycles']:
 for key in ['geometries','textures','programs','ownedMaterialsLive','simulationSubscribers','pendingFrames','cleanupErrors']:assert x[key]==0,(key,x[key])
old=[]
for era in ['before','after']:
 for name in ['desktop','portrait','landscape']+(['desktop-repeat'] if era=='after' else []):
  z=json.loads((r/'docs/qa/m6-01'/era/(name+'.json')).read_text());old.append({'era':era,'name':name,'cameraAttempts':[a['cameraMoves'] for a in z['rows']]})
manifest=json.loads((r/'docs/qa/m6-01/manifest.json').read_text());checked=0
for path,expected in manifest['files'].items():assert hashlib.sha256((r/'docs/qa/m6-01'/path).read_bytes()).hexdigest()==expected,path;checked+=1
latest=json.loads((r/'.qa/gpu-m6-01/latest.json').read_text());report=json.loads((r/'.qa/gpu-m6-01'/latest['runId']/'report.json').read_text());assert raw['identity']=={'run':report['runId'],'build':report['build']['id'],'source':report['source']['id']}
newBase=r/report['buildDirectory'];oldBase=r/'.qa/builds/s20261102T163123Z';buildDiff=[];newFiles=[p for p in newBase.rglob('*') if p.is_file()]
assert {p.relative_to(newBase) for p in newFiles}=={p.relative_to(oldBase) for p in oldBase.rglob('*') if p.is_file()}
for p in newFiles:
 if p.read_bytes()!=(oldBase/p.relative_to(newBase)).read_bytes():buildDiff.append(p.relative_to(newBase).as_posix())
assert not buildDiff,buildDiff
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'COMPLETE bounded investigation; historical cause INCONCLUSIVE','identity':raw['identity'],'viewport':raw['viewport'],'totalValidQueries':total,'windows':summaries,'repeatPairs':pairs,'frozen':{'count':4,'sameStateAndTick':True,'sameWorkloadSignature':True,'gpuP95RangeMs':[min(f95),max(f95)],'spreadPercentOfMinimum':(max(f95)/min(f95)-1)*100},'maxAbsoluteCurrentRetentionP95DifferenceMs':max(abs(s['legacyMinusFullP95Ms']) for s in summaries),'totalLateResultsRetained':sum(s['lateResults'] for s in summaries),'sourceMethodCorrection':'Initial concern about separate immediate camera render is NOT supported. foundation-scene camera delegates controls.command; controls update camera transform only, next RAF renders it. New raw live rows are100%RAF despite4 camera commands/window. Original report sentence claiming extra camera GPU renders is corrected, not treated as explanation of old increase. Old raw summaries cannot prove per-query origins.','historicalCameraAttempts':old,'originalReceiptHashesVerified':checked,'compiledArtifactComparison':{'reference':'privacy-m6-06/s20261102T163123Z','files':len(newFiles),'allBytesIdentical':True,'note':'BuildIDs include run-directory paths, so raw output equality checked by relative path/SHA instead of comparing IDs.'},'lifecycle':'8contexts disposed; one product RAF maximum, QA frozen RAF only while product paused; zero owners/errors after disposal','causalConclusion':'Unresolved. Valid new times do not establish old regression or artifact. Current same-code high10 p95 varies; frozen pose shows narrower spread. Current retention bias is quantified but cannot retroactively recompute unrecorded old queries; camera-immediate-render theory rejected. Need controlled authorized before/after matched workload with raw metrics and driver/power/host conditions; do not retry denied comparison.','presentationFPS':'UNMEASURED','physicalAndroid':'UNRUN','V1':'44/51;M6-01unchecked'}
(w/'independent-analysis.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':result['status'],'queries':total,'frozen':result['frozen'],'maxRetentionP95Delta':result['maxAbsoluteCurrentRetentionP95DifferenceMs'],'pairedGPU':pairs,'productBytesIdentical':len(newFiles),'oldReceipts':checked}))
