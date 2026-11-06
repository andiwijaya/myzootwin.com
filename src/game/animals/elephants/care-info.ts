import type {MultiSpeciesSave as ZooSaveV2} from '../../core/zoo-state.ts';
import {elephantResources,elephants,type ElephantAnimal,type ElephantResource} from '../../core/species.ts';
import {elephantWelfareParts} from './welfare.ts';
import {elephantGroundRoute,groundDistance} from './ground.ts';
import {ELEPHANT_NEEDS as N,ELEPHANT_ENRICHMENT as E,ELEPHANT_SOCIAL as S,ELEPHANT_SUPPLIES} from './care-rules.ts';
import {ELEPHANT_PRICES} from '../../economy/elephant-prices.ts';
export type ElephantCareNote='food-missing'|'food-empty'|'food-blocked'|'hungry'|'water-missing'|'water-empty'|'water-blocked'|'thirsty'|'space'|'shade-missing'|'shade-blocked'|'shade-low'|'tired'|'log-missing'|'log-blocked'|'bored'|'pond-missing'|'pond-dry'|'pond-blocked'|'social-low'|'companion-missing'|'backing'|'cooldown'|'low-score'|'steady';
export type ElephantHelpfulAction='build-food'|'refill-food'|'repair-food'|'wait-food'|'build-water'|'refill-water'|'repair-water'|'wait-water'|'clear-space'|'build-shade'|'repair-shade'|'wait-shade'|'build-log'|'repair-log'|'wait-log'|'build-pond'|'refill-pond'|'repair-pond'|'wait-bath'|'welcome-companion'|'allow-social'|'wait-social'|'wait-clearance'|'steady';
/** Read-only explanation from real needs, resource stock/access and the same species welfare formula. */
export function elephantCareInfo(s:ZooSaveV2,a:ElephantAnimal){
 const p=elephantWelfareParts(s,a),h=s.world.habitats.find(h=>h.id===a.habitatId&&h.kind==='elephant-grove'),resources=elephantResources(s.world.resources).filter(r=>r.habitatId===a.habitatId&&'approaches'in r),of=(kind:ElephantResource['kind'])=>resources.filter(r=>r.kind===kind);
 const reachable=(r:ElephantResource)=>Boolean(h&&r.approaches.some(point=>groundDistance(point,{x:r.cell.x+.5,z:r.cell.z+.5})<=1.6&&elephantGroundRoute(s.world,h,a.position,point)!==null));
 const food=of('elephant-browse'),water=of('elephant-water'),shade=of('elephant-shade'),log=of('elephant-log'),pond=of('elephant-pond'),notes:ElephantCareNote[]=[],next={kind:'steady' as ElephantHelpfulAction,coins:0,resourceId:null as string|null,seconds:0,affordable:true,balance:s.currency};
 const add=(condition:boolean,note:ElephantCareNote)=>{if(condition&&!notes.includes(note))notes.push(note);};
 for(const [rows,label,need,access]of [[food,'food',a.hunger,p.foodAccess],[water,'water',a.thirst,p.waterAccess]]as const){if(!rows.length)notes.push(`${label}-missing`);else if(!rows.some(r=>r.stock>0))notes.push(`${label}-empty`);else if(!access)notes.push(`${label}-blocked`);else if(need>=N.seekAt)notes.push(label==='food'?'hungry':'thirsty');}
 add(p.space<50,'space');add(!shade.length&&a.shadeRest<E.shadeSeekBelow,'shade-missing');add(Boolean(shade.length&&!shade.some(reachable)),'shade-blocked');add(Boolean(shade.length&&a.shadeRest<E.shadeSeekBelow),'shade-low');add(a.energy<E.energySeekBelow,'tired');add(!log.length&&a.enrichment<35,'log-missing');add(Boolean(log.length&&!log.some(reachable)),'log-blocked');add(a.enrichment<35,'bored');add(!pond.length&&a.baths===0&&a.enrichment<65,'pond-missing');add(Boolean(pond.length&&!pond.some(r=>r.stock>0)),'pond-dry');add(Boolean(pond.length&&!pond.some(reachable)),'pond-blocked');add(a.socialComfort<S.seekBelow,'social-low');add(!elephants(s.animals).some(b=>b.id!==a.id&&b.habitatId===a.habitatId),'companion-missing');add(Boolean(a.motion.backing),'backing');add(a.logCooldownTicks>0&&a.enrichment<E.logSeekBelow,'cooldown');
 function action(kind:ElephantHelpfulAction,coins=0,r:ElephantResource|undefined=undefined,seconds=0){next.kind=kind;next.coins=coins;next.resourceId=r?.id??null;next.seconds=seconds;next.affordable=coins<=s.currency;}
 function basic(kind:'food'|'water'){
  const rows=kind==='food'?food:water,access=kind==='food'?p.foodAccess:p.waterAccess,need=kind==='food'?a.hunger:a.thirst,count=kind==='food'?a.foodEaten:a.waterDrunk;
  if(!rows.length){action(kind==='food'?'build-food':'build-water',ELEPHANT_PRICES[kind==='food'?'elephant-browse':'elephant-water']);return true;}
  const usable=rows.find(r=>r.stock>0&&reachable(r)),empty=rows.find(r=>r.stock===0&&reachable(r));
  if(!access){if(empty)action(kind==='food'?'refill-food':'refill-water',kind==='food'?ELEPHANT_SUPPLIES.browseRefill:ELEPHANT_SUPPLIES.waterRefill,empty);else action(kind==='food'?'repair-food':'repair-water');return true;}
  if(need>=N.seekAt||count===0){action(kind==='food'?'wait-food':'wait-water',0,usable);return true;}return false;
 }
 const waterFirst=a.foodEaten===0&&a.waterDrunk===0?a.thirst>=N.criticalAt:a.thirst>=a.hunger;
 if(!basic(waterFirst?'water':'food')&&!basic(waterFirst?'food':'water')){
  if(a.motion.backing)action('wait-clearance');
  else if(p.space<50)action('clear-space');
  else if(['seek-shade','rest'].includes(a.motion.phase))action('wait-shade');
  else if(['seek-log','enrich'].includes(a.motion.phase))action('wait-log',0,undefined,Math.ceil(a.logCooldownTicks/10));
  else if(['seek-bath','bathe','spray'].includes(a.motion.phase))action('wait-bath');
  else if(['approach-companion','trunk-touch'].includes(a.motion.phase))action('wait-social');
  else if(a.shadeRest<E.shadeSeekBelow||a.energy<E.energySeekBelow){if(!shade.length)action('build-shade',ELEPHANT_PRICES['elephant-shade']);else action(shade.some(reachable)?'wait-shade':'repair-shade');}
  else if(a.enrichment<35){if(!log.length)action('build-log',ELEPHANT_PRICES['elephant-log']);else action(log.some(reachable)?'wait-log':'repair-log',0,undefined,Math.ceil(a.logCooldownTicks/10));}
  else if(a.baths===0||a.enrichment<65){if(!pond.length)action('build-pond',ELEPHANT_PRICES['elephant-pond']);else if(!pond.some(reachable))action('repair-pond');else if(!pond.some(r=>r.stock>0))action('refill-pond',ELEPHANT_SUPPLIES.pondRefill,pond.find(reachable));else action('wait-bath',0,undefined,Math.ceil(a.bathCooldownTicks/10));}
  else if(notes.includes('companion-missing'))action('welcome-companion');
  else if(a.socialComfort<S.seekBelow)action('allow-social',0,undefined,Math.ceil(a.socialCooldownTicks/10));
 }
 if(!notes.length)notes.push(p.welfare<60?'low-score':'steady');
 return {welfare:p.welfare,scores:{food:Math.round(p.food),water:Math.round(p.water),space:Math.round(p.space),shade:Math.round(a.shadeRest),enrichment:Math.round(a.enrichment),social:Math.round(a.socialComfort)},access:{food:p.foodAccess,water:p.waterAccess,shade:shade.some(reachable),log:log.some(reachable),pond:pond.some(reachable)},notes,next};
}
export type ElephantCareInfo=ReturnType<typeof elephantCareInfo>;
