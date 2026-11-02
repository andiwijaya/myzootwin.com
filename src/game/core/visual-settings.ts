import type {Preferences} from './state.ts';
export type VisualSettings=Pick<Preferences,'graphics'|'reducedMotion'>;
export const VISUAL_SETTINGS_KEY='myzootwin.visual.preferences.v1';
export function isVisualSettings(x:unknown):x is VisualSettings {if(!x||typeof x!=='object'||Array.isArray(x))return false;const v=x as Record<string,unknown>;return typeof v.graphics==='string'&&['auto','low','high'].includes(v.graphics)&&typeof v.reducedMotion==='boolean'&&Object.keys(v).every(k=>k==='graphics'||k==='reducedMotion');}
export function readVisualSettings(storage:Pick<Storage,'getItem'>|undefined):VisualSettings|null{try{const x=JSON.parse(storage?.getItem(VISUAL_SETTINGS_KEY)??'null');if(x?.schemaVersion!==1||!isVisualSettings(x.value))return null;return {...x.value};}catch{return null;}}
export function saveVisualSettings(storage:Pick<Storage,'setItem'>|undefined,value:VisualSettings):boolean{if(!storage||!isVisualSettings(value))return false;try{storage.setItem(VISUAL_SETTINGS_KEY,JSON.stringify({schemaVersion:1,value}));return true;}catch{return false;}}
export function visualPolicy(value:VisualSettings,systemMotion:boolean,width:number,coarse:boolean,dpr:number){const low=value.graphics==='low'||value.graphics==='auto'&&(coarse||width<700);return{low,reducedMotion:value.reducedMotion||systemMotion,pixelRatio:Math.min(Number.isFinite(dpr)&&dpr>0?dpr:1,low?1:1.5)};}
