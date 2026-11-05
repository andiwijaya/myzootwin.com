import type {ZooSaveV2} from '../../core/zoo-state.ts';
import {isElephant,type ElephantAnimal,type ElephantResource} from '../../core/species.ts';
import {elephantGroundRoute,groundCenters,groundDistance} from './ground.ts';
import {ELEPHANT_NEEDS,ELEPHANT_WELFARE as W} from './care-rules.ts';
export function elephantWelfareParts(s:ZooSaveV2,a:ElephantAnimal){
 const h=s.world.habitats.find(h=>h.id===a.habitatId&&h.kind==='elephant-grove');
 const access=(kind:'elephant-browse'|'elephant-water')=>Boolean(h&&s.world.resources.some(r=>r.kind===kind&&r.habitatId===h.id&&r.stock>0&&'approaches'in r&&(r as ElephantResource).approaches.some(p=>groundDistance(p,{x:r.cell.x+.5,z:r.cell.z+.5})<=1.6&&elephantGroundRoute(s.world,h,a.position,p)!==null)));
 const foodAccess=access('elephant-browse'),waterAccess=access('elephant-water'),food=foodAccess?100-a.hunger:0,water=waterAccess?100-a.thirst:0,space=h?Math.min(100,groundCenters(s.world,h).length/16*100):0;
 const welfare=Math.round(food*W.food+water*W.water+space*W.space+a.shadeRest*W.shade+a.enrichment*W.enrichment+a.socialComfort*W.social);return {foodAccess,waterAccess,food,water,space,welfare};
}
export function reconcileElephantWelfare(s:ZooSaveV2){for(const a of s.animals.filter(isElephant)){const p=elephantWelfareParts(s,a);a.habitatFit=p.space;a.welfare=p.welfare;a.care={low:p.welfare<W.low,hungry:!p.foodAccess||a.hunger>=ELEPHANT_NEEDS.seekAt,thirsty:!p.waterAccess||a.thirst>=ELEPHANT_NEEDS.seekAt,tired:a.energy<30,bored:a.enrichment<35};}return s;}
