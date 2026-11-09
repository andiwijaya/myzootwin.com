import type{ZebraBehavior}from'../game/core/zebra-state.ts';
const labels:Record<'id'|'en',Record<ZebraBehavior,string>>={id:{idle:'Mengamati',wander:'Berjalan','seek-graze':'Menuju pakan',graze:'Merumput','seek-water':'Menuju air',drink:'Minum','seek-shade':'Menuju naungan',rest:'Beristirahat','follow-herd':'Mengikuti kawanan',trot:'Berlari kecil','approach-companion':'Mendekati teman',groom:'Saling merawat','seek-enrichment':'Menuju pengayaan',enrich:'Menjelajah pengayaan'},en:{idle:'Observing',wander:'Walking','seek-graze':'Approaching feed',graze:'Grazing','seek-water':'Approaching water',drink:'Drinking','seek-shade':'Approaching shade',rest:'Resting','follow-herd':'Following the herd',trot:'Trotting','approach-companion':'Approaching a companion',groom:'Mutual grooming','seek-enrichment':'Approaching enrichment',enrich:'Exploring enrichment'}};
export const zebraBehaviorLabel=(behavior:ZebraBehavior,locale:'id'|'en')=>labels[locale][behavior];

import {ZEBRA_RESIDENTS} from '../game/core/zebra-state.ts';
import {TICK_MS} from '../game/core/state.ts';
import {formatNumber} from './i18n-format.ts';
export const zebraResidentLabel=(id:string,locale:'id'|'en')=>ZEBRA_RESIDENTS.find(a=>a.id===id)?.name??(locale==='id'?'Teman kawanan':'Herd companion');
export const zebraElapsed=(ticks:number,locale:'id'|'en')=>formatNumber(ticks*TICK_MS/1000,locale,1)+(locale==='id'?' dtk':' s');
