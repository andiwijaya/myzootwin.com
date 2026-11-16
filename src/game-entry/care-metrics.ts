import type {EntryLocale} from './locale.ts';
import {zooUiCopy} from './zoo-ui-copy.ts';

export interface CareMetrics {welfare:number;hunger:number;thirst:number;energy:number;}
export const careMetricKinds=['welfare','hunger','thirst','energy'] as const;
export function careMetricValue(kind:keyof CareMetrics,raw:number){
  const value=Math.max(0,Math.min(100,Math.round(Number.isFinite(raw)?raw:0)));
  const lower=kind==='hunger'||kind==='thirst',health=lower?100-value:value;
  return {value,lower,level:health<30?'urgent':health<60?'attention':'good'};
}
const rows=new WeakMap<HTMLElement,Map<keyof CareMetrics,{label:HTMLElement;number:HTMLElement;meter:HTMLElement;fill:HTMLElement}>>();
/** Read-only presentation of native needs. Hunger/thirst keep their original direction. */
export function updateCareMetrics(host:HTMLElement,values:CareMetrics,locale:EntryLocale){
  let metrics=rows.get(host);
  if(!metrics){
    host.classList.toggle('zoo-animal-card',true);
    const group=document.createElement('div'),legend=document.createElement('small');group.className='zoo-metrics';legend.className='zoo-needs-legend';legend.dataset.careMetricLegend='';metrics=new Map();
    for(const kind of careMetricKinds){
      const row=document.createElement('div'),label=document.createElement('span'),number=document.createElement('strong'),meter=document.createElement('span'),fill=document.createElement('i');
      row.className='zoo-metric';row.dataset.careMetric=kind;meter.className='zoo-meter';meter.setAttribute('role','meter');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.append(fill);row.append(label,number,meter);group.append(row);metrics.set(kind,{label,number,meter,fill});
    }
    const heading=host.querySelector('h4,[data-bird-summary]');
    if(heading?.parentElement===host)heading.after(group);else host.insertBefore(group,host.querySelector('details,button'));
    group.after(legend);rows.set(host,metrics);
  }
  const c=zooUiCopy[locale];
  host.querySelector('[data-care-metric-legend]')!.textContent=c.metricHint;
  for(const kind of careMetricKinds){
    const row=metrics.get(kind)!,{value,lower,level}=careMetricValue(kind,values[kind]);
    row.label.textContent=c[kind]+(lower?' ↓':' ↑');row.number.textContent=value+'/100';
    row.meter.dataset.level=level;row.meter.setAttribute('aria-label',c[kind]);row.meter.setAttribute('aria-valuenow',String(value));row.meter.setAttribute('aria-valuetext',value+'/100. '+(lower?c.lower:c.higher));row.meter.title=lower?c.lower:c.higher;row.fill.style.width=value+'%';
  }
}
