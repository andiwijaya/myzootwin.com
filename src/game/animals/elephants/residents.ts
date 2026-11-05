import type {ZooSave} from '../../core/zoo-state.ts';
import type {RuntimeState} from '../../core/runtime-state.ts';
import {isElephant,ELEPHANT_SPECIES_ID,type ElephantAnimal} from '../../core/species.ts';
import {conservationGrantView} from '../../economy/conservation-grant.ts';
import {validateSaveV2} from '../../persistence/save-v2.ts';
import type {Point} from '../../core/state.ts';

export const ELEPHANT_RESIDENTS=Object.freeze([{id:'elephant-ayu',name:'Ayu'},{id:'elephant-nara',name:'Nara'}] as const);
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
/** Deterministic interior pair, with room between animals and clearance from existing care props. */
export function elephantSpawnPair(s:RuntimeState):[Point,Point]|null{
 const h=s.world.habitats.find(h=>'kind'in h&&h.kind==='elephant-grove');if(!h||h.cells.length!==36)return null;
 const x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z)),props=s.world.resources.filter(r=>r.habitatId===h.id),order=[{x:x+1.5,z:z+2.5},{x:x+4.5,z:z+2.5}];
 for(let row=1;row<5;row++)for(let col=1;col<5;col++){const p={x:x+col+.5,z:z+row+.5};if(!order.some(q=>distance(q,p)<.01))order.push(p);}
 const free=order.filter(p=>props.every(r=>distance(p,{x:r.cell.x+.5,z:r.cell.z+.5})>=1.15));
 for(const a of free)for(const b of free)if(distance(a,b)>=2.4)return [{...a},{...b}];return null;
}
export function elephantResidentsView(s:RuntimeState){
 const residents=s.animals.filter(isElephant),habitat=s.world.habitats.some(h=>'kind'in h&&h.kind==='elephant-grove');
 const reason:'locked'|'habitat'|'present'|'space'|'ready'=!conservationGrantView(s).qualified?'locked':residents.length?'present':!habitat?'habitat':!elephantSpawnPair(s)?'space':'ready';
 return {command:s.economy.nextCommand,reason,canWelcome:reason==='ready',residents:residents.map(a=>({id:a.id,name:a.name,sex:a.sex}))};
}
/** Two free residents, never a purchase, reward, automatic migration side effect or repeated welcome. */
export function prepareElephantWelcome(s:ZooSave,command:number){
 const view=elephantResidentsView(s);if(s.schemaVersion!==2||!view.canWelcome)return {ok:false as const,reason:view.reason};
 if(command!==s.economy.nextCommand||!Number.isSafeInteger(command)||command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'command' as const};
 const positions=elephantSpawnPair(s),habitat=s.world.habitats.find(h=>h.kind==='elephant-grove');if(!positions||!habitat)return {ok:false as const,reason:'space' as const};
 const next=structuredClone(s);
 for(const [i,resident]of ELEPHANT_RESIDENTS.entries()){
  const a:ElephantAnimal={...resident,speciesId:ELEPHANT_SPECIES_ID,sex:'female',habitatId:habitat.id,position:positions[i]!,target:null,targetResourceId:null,hunger:20,thirst:20,energy:80,habitatFit:100,enrichment:30,welfare:30,care:{low:true,hungry:true,thirsty:true,tired:false,bored:true},currentBehavior:'idle',motion:{phase:'idle',ticksLeft:20,sequence:0,heading:0,waypoints:[],waypointIndex:0},foodEaten:0,waterDrunk:0,restedTicks:0,enrichedTicks:0,socialComfort:70,shadeRest:0,bathCooldownTicks:0,logCooldownTicks:0,socialCooldownTicks:0,baths:0,socialInteractions:0};next.animals.push(a);
 }
 next.economy.nextCommand++;const checked=validateSaveV2(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'command' as const};
}
