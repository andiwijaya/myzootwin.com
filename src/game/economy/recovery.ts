import type {Point,ZooSaveV1} from '../core/state.ts';
import {prepareHabitat} from '../world/build-habitat.ts';
import {validatePathPlacement} from '../world/paths.ts';
import {visitTarget} from '../visitors/graph.ts';
import {quoteRemoval} from '../world/editing.ts';
import {foodView,foodTransaction} from '../animals/feeding.ts';
import {waterView,waterTransaction} from '../animals/watering.ts';
import {perchView,perchTransaction} from '../animals/resting.ts';
import {welcomeBirds} from '../animals/autonomy.ts';
import {PRICES} from './prices.ts';
import {refundable} from './refunds.ts';
export const RECOVERY_RULES=Object.freeze({lowCoins:100,rationBudget:12,urgentAt:60,rationCooldownTicks:300,portionsPerBird:2});
export type RecoveryKind='habitat'|'path'|'food'|'water'|'perch'|'food-refill'|'water-refill'|'rations'|'welcome'|'open'|'reclaim'|'repair-food'|'repair-water'|'repair-perch'|'wait'|'steady';
export interface RecoveryQuote {command:number;key:string;}
export interface RecoveryView extends RecoveryQuote {kind:RecoveryKind;low:boolean;available:boolean;cost:number;gift:boolean;refund:number;cell:Point|null;waitTicks:number;grants:number;rations:number;}
const siteCache=new WeakMap<ZooSaveV1['world'],{anchor:Point;remove:Point[]}|null>();
function habitatSite(s:ZooSaveV1){if(siteCache.has(s.world))return structuredClone(siteCache.get(s.world)!);let best:{anchor:Point;remove:Point[]}|null=null;for(let z=0;z<s.world.height-1;z++)for(let x=0;x<s.world.width-1;x++){const w=structuredClone(s.world),remove:Point[]=[];for(const t of w.tiles)if(t.path&&t.cell.x>=x&&t.cell.x<=x+1&&t.cell.z>=z&&t.cell.z<=z+1){remove.push({...t.cell});t.path=false;}if(remove.some(c=>c.x===w.gate.x&&c.z===w.gate.z))continue;if(!prepareHabitat(w,{x,z},'habitat-support-plan').ok)continue;if(remove.some(cell=>!quoteRemoval(s,{kind:'path',cell},0).ok))continue;if(!best||remove.length<best.remove.length)best={anchor:{x,z},remove};}siteCache.set(s.world,structuredClone(best));return best;}
const roadCache=new WeakMap<ZooSaveV1['world'],Point[]>();
function missingRoad(s:ZooSaveV1){const known=roadCache.get(s.world);if(known)return known;const w=structuredClone(s.world);for(const t of w.tiles)if(validatePathPlacement(w,t.cell).reason==='ready')t.path=true;const route=visitTarget(w)?.route??[],missing=route.filter(p=>!s.world.tiles.find(t=>t.cell.x===p.x&&t.cell.z===p.z)?.path).map(p=>({...p}));roadCache.set(s.world,missing);return missing;}
export function recoveryView(s:ZooSaveV1):RecoveryView{
 let kind:RecoveryKind='steady',cost=0,gift=false,cell:Point|null=null,refund=0,waitTicks=0,available=true;
 const h=s.world.habitats[0],r=s.economy.recovery,food=foodView(s),water=waterView(s),perch=perchView(s),placed=s.animals.filter(a=>a.habitatId===h?.id&&a.position);
 const critical=(k:'food'|'water')=>{const v=k==='food'?food:water;return placed.some(a=>(k==='food'?a.hunger:a.thirst)>=RECOVERY_RULES.urgentAt&&v.portions[[...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).findIndex(b=>b.id===a.id)]===0);};
 const cool=r.lastRationTick===null?0:Math.max(0,RECOVERY_RULES.rationCooldownTicks-(s.tick-r.lastRationTick));
 if(!h){const site=habitatSite(s);if(!site){kind='wait';available=false;}else if(site.remove.length){kind='reclaim';cell=site.remove[0];refund=refundable(s,`path-${cell.x}-${cell.z}`).reduce((n,p)=>n+p.amount,0);}else{kind='habitat';cell=site.anchor;cost=PRICES.habitat;}}
 else if(food.exists&&!food.reachable)kind='repair-food';
 else if(water.exists&&!water.reachable)kind='repair-water';
 else if(!food.exists){kind='food';cost=PRICES.food;available=food.canPlace;}
 else if(!water.exists){kind='water';cost=PRICES.water;available=water.canPlace;}
 else if(s.currency<RECOVERY_RULES.rationBudget&&(critical('food')||critical('water'))){kind='rations';waitTicks=cool;available=cool===0;}
 else if(food.stock<4&&s.currency>=PRICES.foodRefill){kind='food-refill';cost=PRICES.foodRefill;}
 else if(water.stock<4&&s.currency>=PRICES.waterRefill){kind='water-refill';cost=PRICES.waterRefill;}
 else if(!perch.exists){kind='perch';cost=PRICES.perch;available=perch.canPlace;}
 else if(!perch.reachable)kind='repair-perch';
 else if(!visitTarget(s.world)){const missing=missingRoad(s)[0];if(missing){kind='path';cell={...missing};cost=PRICES.path;}else{kind='wait';available=false;}}
 else if(placed.length<2)kind='welcome';
 else if(!s.visitorFlow.open)kind='open';
 else{kind='steady';available=false;}
 if(['repair-food','repair-water','repair-perch'].includes(kind)){const k=kind.slice(7),resource=s.world.resources.find(r=>r.kind===k);refund=resource?refundable(s,resource.id).reduce((n,p)=>n+p.amount,0):0;}
 gift=['habitat','path','food','water','perch'].includes(kind)&&s.currency<cost;
 const needed=(h?0:PRICES.habitat)+(food.exists?0:PRICES.food)+(water.exists?0:PRICES.water)+(perch.exists?0:PRICES.perch)+(h?missingRoad(s).length:5)*PRICES.path+RECOVERY_RULES.rationBudget;const low=s.currency<Math.max(RECOVERY_RULES.lowCoins,needed,cost+RECOVERY_RULES.rationBudget);
 const key=[kind,cell?.x??'-',cell?.z??'-',cost,gift?1:0].join(':');
 return{command:s.economy.nextCommand,key,kind,low,available:available&&kind!=='steady',cost:gift?0:cost,gift,refund,cell,waitTicks,grants:r.equipmentGrants,rations:r.rationBatches};
}
/** Free essentials have no paid-build proof, so selling them returns zero. No currency is granted. */
export function supportTransaction(s:ZooSaveV1,v:RecoveryView):boolean{
 const nonce=s.economy.nextCommand;
 if(v.kind==='habitat'&&v.cell&&v.gift){const p=prepareHabitat(s.world,v.cell,`habitat-support-${nonce}`);if(!p.ok||p.duplicate)return false;s.world=p.world;s.economy.recovery.habitatGrant={id:p.habitatId,tick:s.tick};}
 else if(['food','water','perch'].includes(v.kind)&&v.gift){const k=v.kind as'food'|'water'|'perch',fn=k==='food'?foodTransaction:k==='water'?waterTransaction:perchTransaction;if(fn(s,'place',0,nonce)!=='ok')return false;const resource=s.world.resources.find(r=>r.kind===k)!;if(refundable(s,resource.id).length)return false;}
 else if(v.kind==='rations'){
  for(const k of['food','water']as const){const resource=s.world.resources.find(r=>r.kind===k);if(!resource?.portions)return false;resource.portions=resource.portions.map(n=>Math.max(n,RECOVERY_RULES.portionsPerBird))as[number,number];resource.stock=resource.portions[0]+resource.portions[1];resource.revision=nonce;}
  s.economy.recovery.lastRationTick=s.tick;s.economy.recovery.rationBatches++;s.economy.nextCommand++;return true;
 }else if(v.kind==='welcome'){if(!welcomeBirds(s))return false;s.economy.nextCommand++;return true;}
 else if(v.kind==='open'){s.visitorFlow.open=true;s.visitorFlow.cooldownTicks=0;s.economy.nextCommand++;return true;}
 else return false;
 s.economy.recovery.equipmentGrants++;s.economy.nextCommand++;return true;
}
