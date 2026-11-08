/** Build-QA-only side table. Returns the original object; no gameplay/Three properties change. */
const sites=new WeakMap<object,string>();
const constructed=new Map<string,number>();
export function tagVisual3d<T>(value:T,assetId:string):T {if(value!==null&&(typeof value==='object'||typeof value==='function')){sites.set(value as object,assetId);constructed.set(assetId,(constructed.get(assetId)??0)+1);}return value;}
export function visualSite(value:object):string|undefined{return sites.get(value);}
export const visualConstructions=()=>[...constructed.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([assetId,instances])=>({assetId,instances}));
export const resetVisualConstructions=()=>constructed.clear();
