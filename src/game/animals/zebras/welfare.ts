import type{RuntimeState}from'../../core/runtime-state.ts';
import{zebras,type ZebraAnimal,type ZebraHabitat,type ZebraResourceKind}from'../../core/zebra-state.ts';
import{zebraGroundAccess}from'./ground.ts';
export const ZEBRA_WELFARE_WEIGHTS=Object.freeze({nutrition:.25,hydration:.25,rest:.20,space:.10,social:.10,enrichment:.10});
export type ZebraAccess='missing'|'unreachable'|'empty'|'ready';
/** Fictional game approximation, not veterinary guidance. A completed last meal
 * still helps: an empty reachable facility caps availability rather than erasing
 * already earned relief. Building/refilling never changes needs or counters. */
export function zebraWelfareExplanation(s:RuntimeState,a:ZebraAnimal){
 const h=s.world.habitats.find((h):h is ZebraHabitat=>h.kind==='zebra-grasslands'&&h.id===a.habitatId),ground=h?zebraGroundAccess(s.world,h):null,reachable=ground?.from(a.position);
 const access=(kind:ZebraResourceKind):ZebraAccess=>{const resources=s.world.resources.filter(r=>r.kind===kind&&r.habitatId===a.habitatId);if(!resources.length)return'missing';const available=resources.filter(r=>'approaches'in r&&r.approaches.some(p=>reachable?.(p)));return !available.length?'unreachable':available.some(r=>r.stock>0)?'ready':'empty';};
 const food=access('zebra-graze'),water=access('zebra-water'),shade=access('zebra-shade'),enrichmentAccess=access('zebra-enrichment'),cap=(status:ZebraAccess)=>status==='ready'?100:status==='empty'?80:40;
 const nutrition=Math.min(100-a.hunger,cap(food)),hydration=Math.min(100-a.thirst,cap(water)),rest=shade==='ready'?(a.energy+a.shadeRest)/2:a.energy*.35,space=h&&ground?.allowed(a.position)?ground.nodes/169*100:0,social=zebras(s.animals).filter(b=>b.habitatId===a.habitatId).length>1?a.socialComfort:Math.min(50,a.socialComfort),enrichment=a.enrichment;
 const parts={nutrition,hydration,rest,space,social,enrichment},welfare=Math.round(Object.entries(parts).reduce((n,[k,v])=>n+v*ZEBRA_WELFARE_WEIGHTS[k as keyof typeof parts],0));
 return{...parts,welfare,food,water,shade,enrichmentAccess,company:zebras(s.animals).filter(b=>b.habitatId===a.habitatId).length>1};
}
/** Called only by real canonical ticks and accepted care/welcome commands.
 * Reading the UI or cold-loading a paused save never rewrites its payload. */
export function reconcileZebraWelfare<S extends RuntimeState>(s:S):S{for(const a of zebras(s.animals)){const p=zebraWelfareExplanation(s,a);a.welfare=p.welfare;a.habitatFit=p.space;a.care={low:p.welfare<60,hungry:p.food!=='ready'||a.hunger>=35,thirsty:p.water!=='ready'||a.thirst>=35,tired:p.shade!=='ready'||a.energy<60||a.shadeRest<55,bored:a.enrichment<35};}return s;}
