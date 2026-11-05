import {visitTargetsForState,visitorPaths} from './graph.ts';
import type {RuntimeState} from '../core/state.ts';
import type {HabitatKind} from '../core/species.ts';
/** Tunable V1 curve. Existing queue/corridor capacity still bounds throughput. */
export const ATTRACTION_RULES=Object.freeze({minIntervalTicks:45,maxIntervalTicks:900,comfortableAt:60,strongAt:80});
export interface HabitatAttraction {habitatId:string;kind:HabitatKind;welfare:number;}
/** Equal weight per reachable inhabited habitat. More habitats never multiply arrival capacity or ticket price. */
export function attractionView(s:RuntimeState){
 const w=s.world,targets=visitTargetsForState(s),paths=visitorPaths(w),g=w.gate,path=paths.has(`${g.x},${g.z}`)&&[{x:g.x,z:g.z-1},{x:g.x,z:g.z+1}].some(p=>paths.has(`${p.x},${p.z}`));
 const habitats=targets.flatMap(target=>{const animals=s.animals.filter(a=>a.habitatId===target.habitatId&&a.position!==null),h=w.habitats.find(h=>h.id===target.habitatId);return animals.length?[{habitatId:target.habitatId,kind:(h?.kind??'macaw-aviary')as HabitatKind,welfare:animals.reduce((n,a)=>n+a.welfare,0)/animals.length}]:[];});
 const welfare=habitats.length?Math.round(habitats.reduce((n,h)=>n+h.welfare,0)/habitats.length):null,reason:'closed'|'path'|'habitat'|'animals'|'ready'=!s.visitorFlow.open?'closed':!path?'path':!targets.length?'habitat':!habitats.length?'animals':'ready',score=welfare??0,intervalTicks=Math.round(ATTRACTION_RULES.minIntervalTicks+(ATTRACTION_RULES.maxIntervalTicks-ATTRACTION_RULES.minIntervalTicks)*(1-score/100)**2);
 // Preserve the exact original V1/single-aviary view shape as well as the curve.
 const perHabitat:HabitatAttraction[]|undefined=habitats.some(h=>h.kind==='elephant-grove')?habitats.map(h=>({...h,welfare:Math.round(h.welfare)})):undefined;
 return {ready:reason==='ready',reason,welfare,intervalTicks,level:score>=ATTRACTION_RULES.strongAt?'strong':score>=ATTRACTION_RULES.comfortableAt?'steady':'low',...(perHabitat?{habitats:perHabitat}:{})};
}
export type AttractionView=ReturnType<typeof attractionView>;
