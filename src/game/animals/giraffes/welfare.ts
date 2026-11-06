import type {RuntimeState} from '../../core/runtime-state.ts';
import {giraffes,type GiraffeAnimal,type GiraffeHabitat,type GiraffeResourceKind} from '../../core/giraffe-state.ts';
import {giraffeGroundRoute,giraffeGroundNodes} from './ground.ts';
import {GIRAFFE_WELFARE as W} from './rules.ts';
/** Fictional game welfare: accessible essential browse and water are independent of enrichment. */
export function giraffeWelfareParts(s:RuntimeState,a:GiraffeAnimal){
 const h=s.world.habitats.find((h):h is GiraffeHabitat=>h.kind==='giraffe-plains'&&h.id===a.habitatId);
 const access=(kind:GiraffeResourceKind)=>Boolean(h&&s.world.resources.some(r=>r.kind===kind&&r.habitatId===h.id&&r.stock>0&&'approaches'in r&&r.approaches.some(p=>giraffeGroundRoute(s.world,h,a.position,p)!==null)));
 const foodAccess=access('giraffe-browse'),waterAccess=access('giraffe-water'),shadeAccess=access('giraffe-shade'),nutrition=foodAccess?100-a.hunger:0,hydration=waterAccess?100-a.thirst:0,rest=shadeAccess?(a.energy+a.shadeRest)/2:a.energy*.35,space=h?Math.min(100,giraffeGroundNodes(s.world,h).length):0,social=giraffes(s.animals).length>1?a.socialComfort:Math.min(50,a.socialComfort),enrichment=a.enrichment;
 const welfare=Math.round(nutrition*W.nutrition+hydration*W.hydration+rest*W.rest+space*W.space+social*W.social+enrichment*W.enrichment);return {foodAccess,waterAccess,shadeAccess,nutrition,hydration,rest,space,social,enrichment,welfare};
}
const cache=new WeakMap<GiraffeAnimal,{tick:number;command:number;parts:ReturnType<typeof giraffeWelfareParts>}>();
export function reconcileGiraffeWelfare(s:RuntimeState){for(const a of giraffes(s.animals)){const p=giraffeWelfareParts(s,a);cache.set(a,{tick:s.tick,command:s.economy.nextCommand,parts:p});a.welfare=p.welfare;a.habitatFit=p.space;a.care={low:p.welfare<60,hungry:!p.foodAccess||a.hunger>=35,thirsty:!p.waterAccess||a.thirst>=35,tired:!p.shadeAccess||a.energy<40,bored:a.enrichment<35};}return s;}
export function giraffeWelfareExplanation(s:RuntimeState,a:GiraffeAnimal){const prior=cache.get(a);if(prior?.tick===s.tick&&prior.command===s.economy.nextCommand)return {...prior.parts};const parts=giraffeWelfareParts(s,a);cache.set(a,{tick:s.tick,command:s.economy.nextCommand,parts});return {...parts};}
