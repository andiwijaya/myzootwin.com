/** Build-QA-only side table. Returns the original object; no gameplay/Three properties change. */
const sites=new WeakMap<object,string>();
export function tagVisual3d<T>(value:T,assetId:string):T {if(value!==null&&(typeof value==='object'||typeof value==='function'))sites.set(value as object,assetId);return value;}
export function visualSite(value:object):string|undefined{return sites.get(value);}
