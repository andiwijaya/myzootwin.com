from pathlib import Path
from datetime import datetime
import json,re,hashlib,shutil
R=Path('C:/MyZooTwin');W=Path(__file__).parent/'duration-soak';D=R/'docs/qa/m4-07-duration';D.mkdir(exist_ok=True)
J=lambda p:json.loads(p.read_text(encoding='utf-8'))
write=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
steps=J(W/'steps.json');a={x['label']:x for x in steps};start=a['S00-start-1x'];end=a['S99-end-active'];pauses=J(W/'pause-intervals.json')
server=J(W/'server-final.json');assert server['sourceId']==server['sourceAfter']=='8e5af7f95ca28262b5fc8e3ae5f84e999682d1ccc0e9e060892c4b446fdbcd91';assert server['buildId']=='b39d78e351cdba467a937aa8db78de32a5c006a01040f23b23b78722d8ffd9ab'and server['ownerPreserved']and server['portFree']
parse=lambda x:datetime.fromisoformat(x.replace('Z','+00:00'))
wall=(parse(end['at'])-parse(start['at'])).total_seconds();excluded=sum((parse(x['resumedConfirmedUTC'])-parse(x['startRequestUTC'])).total_seconds()for x in pauses)
assert wall-excluded>=900,(wall,excluded)
for x in steps:
 if x.get('phase')=='cold':continue
 assert x['page']['world']['simulationRate']=='1',x['label']
 assert x['page']['visibility']=='visible',x['label']
 assert x['page']['canvases']==1,x['label']
 assert x['page']['world']['placedBirds']=='2'and x['page']['world']['builtHabitats']=='1',x['label']
 assert 0<=int(x['page']['world']['visitorCount'])<=3,x['label']
 assert 0<=int(x['page']['world']['foodStock'])<=8 and 0<=int(x['page']['world']['waterStock'])<=8
 assert 'Game changed in another tab'not in x['snapshot']and 'Could not save'not in x['snapshot']
 if x['label']not in ['S20-paused-start','S21-paused-stable']:assert x['page']['root']['sessionPaused']=='false',x['label']
keys=['builtHabitats','occupiedTiles','placedBirds','foodExists','foodStock','waterExists','waterStock','perchExists','simulationRate','worldConnected','worldPathCount','worldRouteCells','visitorCount','visitorViewed','visitorViewing','visitorWalking']
freezeA=a['S20-paused-start'];freezeB=a['S21-paused-stable']
assert all(freezeA['page']['world'][k]==freezeB['page']['world'][k]for k in keys)
balance=lambda x:int(re.search(r'strong: ([\d,]+) ZC',x['snapshot']).group(1).replace(',',''))
assert balance(freezeA)==balance(freezeB)
before=a['T00-final-saved'];after=a['T02-cold-Continue'];assert balance(before)==balance(after)
assert all(before['page']['world'][k]==after['page']['world'][k]for k in keys)
def economy(x):
 s=x['snapshot'];t=int(re.search(r'Tickets (\d+) \+ mission rewards',s).group(1));m=int(re.search(r'\+ mission rewards (\d+)',s).group(1));c,sup,u=map(int,re.search(r'Construction (\d+) .* Supplies (\d+) .* Upkeep (\d+)',s).groups());adm=int(re.search(r'Paid admissions (\d+)',s).group(1));return {'balance':balance(x),'tickets':t,'missionRewards':m,'construction':c,'supplies':sup,'upkeep':u,'paidAdmissions':adm}
base=economy(a['S01-guest-economy-baseline']);final=economy(a['S98-final-economy']);assert final['balance']-base['balance']==final['tickets']-base['tickets']-(final['supplies']-base['supplies'])-(final['upkeep']-base['upkeep']);assert final['paidAdmissions']>base['paidAdmissions']
closedA=economy(a['S30-gate-closed']);closedB=economy(a['S31-gate-closed-stable']);assert closedA['tickets']==closedB['tickets']and closedA['paidAdmissions']==closedB['paidAdmissions']
welfare=[int(m.group(1))for x in steps if(m:=re.search(r'generic: Welfare (\d+)%',x['snapshot']))]
write(D/'acceptance.json',{'status':'PASS scoped final-source duration/soak; recording UNRUN','sourceId':server['sourceId'],'buildId':server['buildId'],'sourceAfter':server['sourceAfter'],'wallSeconds':wall,'excludedPauseSeconds':excluded,'conservativeUnpausedWindowSeconds':wall-excluded,'startUTC':start['at'],'endUTC':end['at'],'manualPauses':pauses,'speed':'1x native throughout measured duration; wall time is not a claim of presentedFPS or exactsimseconds.','economyBaseline':base,'economyFinal':final,'economyDeltaReconciles':True,'gateClosure':{'start':a['S30-gate-closed']['at'],'end':a['S31-gate-closed-stable']['at'],'before':closedA,'after':closedB,'newTickets':0,'agentsReturned':a['S31-gate-closed-stable']['page']['world']['visitorCount']},'observedHeaderWelfareRange':[min(welfare),max(welfare)],'pauseFieldsFrozen':keys,'coldTabFieldsMatch':keys,'coldBalance':balance(after),'coldMissions':4,'coldBirds':2,'noProductChanges':True,'automatedEvidence':'Same-source486tests/207check/build froms20261102T192224Z reused, not rerun.','recording':'Unavailable in approved runtime; no fabricatedvideo, M4-07 remainsunchecked.','limits':'NativeChrome desktop only; no newEdge/device/background/FPS/human/speaker/processrestart claim. Currentheap/GPU not measured; earlier profiles remain separate.'})
for p in W.iterdir():
 if p.is_file():shutil.copyfile(p,D/p.name)
print(json.dumps({'wallSeconds':wall,'pausedSeconds':excluded,'unpausedWindowSeconds':wall-excluded,'balanceBefore':base['balance'],'balanceAfter':final['balance'],'admissionsDelta':final['paidAdmissions']-base['paidAdmissions'],'status':'PASS'}))
