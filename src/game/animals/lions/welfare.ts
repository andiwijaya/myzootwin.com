import type {RuntimeState} from '../../core/runtime-state.ts';
import {isLion,type LionAnimal,type LionHabitat,type LionResource} from '../../core/species.ts';
import {lionGroundRoute,lionGroundNodes} from './ground.ts';
import {LION_WELFARE as W} from './rules.ts';
export function lionWelfareParts(s:RuntimeState,a:LionAnimal){
 const h=s.world.habitats.find((h):h is LionHabitat=>h.kind==='lion-savanna'&&h.id===a.habitatId);
 const access=(kind:LionResource['kind'])=>Boolean(h&&s.world.resources.some(r=>r.kind===kind&&r.habitatId===h.id&&r.stock>0&&'approaches'in r&&r.approaches.some(p=>lionGroundRoute(s.world,h,a.position,p)!==null)));
 const foodAccess=access('lion-meat'),waterAccess=access('lion-water'),shelterAccess=access('lion-den'),nutrition=foodAccess?100-a.hunger:0,hydration=waterAccess?100-a.thirst:0,rest=shelterAccess?(a.energy+a.shadeRest)/2:a.energy*.35,space=h?Math.min(100,lionGroundNodes(s.world,h).length/100*100):0,social=s.animals.filter(isLion).length>1?a.socialComfort:Math.min(65,a.socialComfort);
 const welfare=Math.round(nutrition*W.nutrition+hydration*W.hydration+rest*W.rest+space*W.space+a.enrichment*W.enrichment+social*W.social);return {foodAccess,waterAccess,shelterAccess,nutrition,hydration,rest,space,enrichment:a.enrichment,social,welfare};
}
export function reconcileLionWelfare(s:RuntimeState){for(const a of s.animals.filter(isLion)){const p=lionWelfareParts(s,a);explanations.set(a,{tick:s.tick,command:s.economy.nextCommand,parts:p});a.welfare=p.welfare;a.habitatFit=p.space;a.care={low:p.welfare<60,hungry:!p.foodAccess||a.hunger>=35,thirsty:!p.waterAccess||a.thirst>=35,tired:!p.shelterAccess||a.energy<40,bored:a.enrichment<35};}return s;}

// Presentation cache is outside the save and follows both fixed time and paid commands.
const explanations=new WeakMap<LionAnimal,{tick:number;command:number;parts:ReturnType<typeof lionWelfareParts>}>();
export function lionWelfareExplanation(s:RuntimeState,a:LionAnimal){const prior=explanations.get(a);if(prior?.tick===s.tick&&prior.command===s.economy.nextCommand)return {...prior.parts};const parts=lionWelfareParts(s,a);explanations.set(a,{tick:s.tick,command:s.economy.nextCommand,parts});return {...parts};}
