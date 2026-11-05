import type {Animal,WorldState,ZooSaveV1} from '../core/state.ts';
import {reachableFood} from './feeding.ts';
import {reachableWater} from './watering.ts';
import {reachablePerch} from './resting.ts';
import {macaws} from '../core/species.ts';

/** Configurable game balance, not biological or husbandry advice. */
export const WELFARE_RULES=Object.freeze({foodWeight:.35,waterWeight:.30,habitatWeight:.20,enrichmentWeight:.15,noAccessCap:40,low:60,recovered:65,hungry:60,satisfied:45,tired:35,rested:65,bored:20,enriched:45});
export const emptyCare=()=>({low:false,hungry:false,thirsty:false,tired:false,bored:false});
export type CareAction='food'|'water'|'perch'|'habitat'|'wait';
export type CareCause='habitat'|'food-missing'|'food-unreachable'|'food-empty'|'hungry'|'water-missing'|'water-unreachable'|'water-empty'|'thirsty'|'perch-missing'|'perch-unreachable'|'tired'|'bored';
export interface CareAlert {cause:CareCause;action:CareAction;}
const round=(n:number)=>Math.round(Math.max(0,Math.min(100,n))*100)/100;
function habitatFor(w:WorldState,a:Animal){const h=w.habitats.find(h=>h.id===a.habitatId);if(!h||!a.position||h.cells.length!==4)return undefined;const x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z));return [0,1].every(dx=>[0,1].every(dz=>h.cells.some(c=>c.x===x+dx&&c.z===z+dz)))&&h.cells.every(c=>w.tiles.some(t=>t.cell.x===c.x&&t.cell.z===c.z&&t.terrain==='land'&&t.occupantId===h.id))?h:undefined;}
export function welfareParts(s:ZooSaveV1,a:Animal){const h=habitatFor(s.world,a),slot=macaws(s.animals).sort((a,b)=>a.id.localeCompare(b.id)).findIndex(b=>b.id===a.id),food=h?reachableFood(s.world,h):undefined,water=h?reachableWater(s.world,h):undefined,perch=h?reachablePerch(s.world,h):undefined;
 const foodAccess=Boolean(food&&slot>=0&&slot<food.capacity&&(food.portions?.[slot]??0)>0),waterAccess=Boolean(water&&slot>=0&&slot<water.capacity&&(water.portions?.[slot]??0)>0),foodScore=h?round(Math.min(100-a.hunger,foodAccess?100:WELFARE_RULES.noAccessCap)):0,waterScore=h?round(Math.min(100-a.thirst,waterAccess?100:WELFARE_RULES.noAccessCap)):0,habitatFit=h?100:0,enrichmentScore=h?round(a.enrichment):0;
 return {foodScore,waterScore,habitatFit,enrichmentScore,welfare:round(WELFARE_RULES.foodWeight*foodScore+WELFARE_RULES.waterWeight*waterScore+WELFARE_RULES.habitatWeight*habitatFit+WELFARE_RULES.enrichmentWeight*enrichmentScore),foodAccess,waterAccess,perchAccess:Boolean(perch&&slot<perch.capacity),slot,habitat:h};
}
const high=(was:boolean,value:number,on:number,off:number)=>was?value>off:value>=on;
const low=(was:boolean,value:number,on:number,off:number)=>was?value<off:value<on;
/** Recompute derived scores on every accepted state change/load/tick; never trust stored display values. */
export function reconcileWelfare(s:ZooSaveV1){for(const a of s.animals){const p=welfareParts(s,a);a.habitatFit=p.habitatFit;a.welfare=p.welfare;if(!p.habitat){a.care=emptyCare();continue;}a.care={low:low(a.care.low,a.welfare,WELFARE_RULES.low,WELFARE_RULES.recovered),hungry:high(a.care.hungry,a.hunger,WELFARE_RULES.hungry,WELFARE_RULES.satisfied),thirsty:high(a.care.thirsty,a.thirst,WELFARE_RULES.hungry,WELFARE_RULES.satisfied),tired:low(a.care.tired,a.energy,WELFARE_RULES.tired,WELFARE_RULES.rested),bored:low(a.care.bored,a.enrichment,WELFARE_RULES.bored,WELFARE_RULES.enriched)};}return s;}
export function careAlerts(s:ZooSaveV1,a:Animal):CareAlert[]{const p=welfareParts(s,a),h=p.habitat;if(!h)return [{cause:'habitat',action:'habitat'}];const result:CareAlert[]=[];
 for(const kind of ['water','food']as const){const resource=s.world.resources.find(r=>r.habitatId===h.id&&r.kind===kind),access=kind==='food'?p.foodAccess:p.waterAccess,flag=kind==='food'?a.care.hungry:a.care.thirsty,reachable=kind==='food'?reachableFood(s.world,h):reachableWater(s.world,h);if(!resource)result.push({cause:`${kind}-missing`,action:kind});else if(!reachable)result.push({cause:`${kind}-unreachable`,action:kind});else if(!access)result.push({cause:`${kind}-empty`,action:kind});else if(flag)result.push({cause:kind==='food'?'hungry':'thirsty',action:'wait'});}
 const perch=s.world.resources.find(r=>r.habitatId===h.id&&r.kind==='perch');if(a.care.tired||a.care.bored){if(!perch)result.push({cause:'perch-missing',action:'perch'});else if(!p.perchAccess)result.push({cause:'perch-unreachable',action:'perch'});else{if(a.care.tired)result.push({cause:'tired',action:'wait'});if(a.care.bored)result.push({cause:'bored',action:'wait'});}}
 if(a.care.low&&!result.some(c=>c.cause.startsWith('food-')||c.cause.startsWith('water-')||c.cause==='hungry'||c.cause==='thirsty'))result.unshift({cause:WELFARE_RULES.foodWeight*(100-p.foodScore)>=WELFARE_RULES.waterWeight*(100-p.waterScore)?'hungry':'thirsty',action:'wait'});
 return result;
}
