from pathlib import Path
import json,os,datetime
work=Path(__file__).parent;os.environ.setdefault('MPLCONFIGDIR',str(work/'.mplconfig-m6-02'))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
folder=work/'m6-02-final-soak';data=json.loads((folder/'final.json').read_text(encoding='utf-8'))
assert data['status']=='PASS' and data['continuous']['elapsedMs']>=900000
rows=[s for s in data['samples'] if s['label'] in ['CONTINUOUS','continuous-complete'] and s['elapsedContinuousMs'] is not None]
t=[r['elapsedContinuousMs']/60000 for r in rows];heap=[r['heap'].get('usedJSHeapSize',float('nan'))/1048576 for r in rows]
start=datetime.datetime.fromisoformat(data['continuous']['startedAt'].replace('Z','+00:00'));last=data['released'][-1]
disposedT=(datetime.datetime.fromisoformat(last['at'].replace('Z','+00:00'))-start).total_seconds()/60
speedChanges=[a for a in data['actions'] if a['action']=='Actual selector change']
speed10=next(a for a in speedChanges if a['speed']==10);speed1=next(a for a in speedChanges if a['speed']==1)
offset=lambda a:(datetime.datetime.fromisoformat(a['at'].replace('Z','+00:00'))-start).total_seconds()/60
tenStart,tenEnd=offset(speed10),offset(speed1)
fig,(a,b)=plt.subplots(2,1,figsize=(10,6),sharex=True,gridspec_kw={'height_ratios':[1.3,1]})
a.plot(t,heap,color='#216b72',linewidth=1.3,label='Observed JS heap estimate')
a.set_ylabel('Heap estimate (MiB)');a.set_ylim(bottom=0);a.legend(loc='upper left',bbox_to_anchor=(0,1.18),frameon=False)
for key,label,color in [('geometries','Geometries','#285e8e'),('ownedMaterialsLive','Owned live materials','#a26827'),('programs','Shader programs','#7056a0')]:
 b.plot(t,[r['scene'][key] for r in rows],label=label,color=color,linewidth=1.3)
 assert last[key]==0;b.scatter([disposedT],[last[key]],color=color,s=25,zorder=4)
b.annotate('Final disposal: counts 0',xy=(disposedT,0),xytext=(11.0,9),arrowprops={'arrowstyle':'->','color':'#666'},fontsize=9)
b.set_ylabel('Owned resource count');b.set_xlabel('Real continuous elapsed time (minutes)');b.set_ylim(bottom=-2);b.set_xlim(0,max(15.6,disposedT+.15));b.legend(loc='upper left',frameon=False,ncol=3,fontsize=9)
for ax in (a,b):
 ax.axvspan(tenStart,tenEnd,color='#e9c970',alpha=.15);ax.grid(alpha=.2)
 for spine in ['top','right']:ax.spines[spine].set_visible(False)
a.text((tenStart+tenEnd)/2,a.get_ylim()[1]*.94,'10x simulation interval',ha='center',fontsize=9)
fig.suptitle('MyZooTwin: 15-minute real-time source-app memory soak',fontsize=13,x=.5,y=.98)
fig.text(.08,.01,'Nonstandard heap may be shared/quantized; no forced GC. Final post-disposal heap unmeasured. Resource counts are not GPU bytes or FPS.',fontsize=8,color='#555')
fig.tight_layout(rect=(0,.035,1,.95));fig.savefig(folder/'heap-resources.png',dpi=160);plt.close(fig)
print(str(folder/'heap-resources.png'))
