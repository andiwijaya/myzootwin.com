import type {EntryLocale} from './locale.ts';
const cache=new Map<string,Intl.NumberFormat>();
/** Presentation only: never use formatted output for simulation or stored IDs. */
export function formatNumber(value:number|string|null|undefined,locale:EntryLocale,maximumFractionDigits=2,minimumFractionDigits=0):string{
 if(typeof value==='string')return value;
 if(typeof value!=='number'||!Number.isFinite(value))return '—';
 const key=locale+':'+maximumFractionDigits+':'+minimumFractionDigits;let f=cache.get(key);
 if(!f){f=new Intl.NumberFormat(locale==='id'?'id-ID':'en-US',{maximumFractionDigits,minimumFractionDigits});cache.set(key,f);}
 return f.format(value);
}
export function chooseGameLocale(preferred:EntryLocale,manual:boolean,saved:EntryLocale|undefined):EntryLocale{return manual?preferred:saved??preferred;}
