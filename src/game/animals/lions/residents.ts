import type {RuntimeState} from '../../core/runtime-state.ts';
import type {ZooSave} from '../../core/zoo-state.ts';
import {isLion,type LionAnimal,type LionHabitat} from '../../core/species.ts';
import {lionGrantView} from '../../economy/lion-grant.ts';
import {lionGroundNodes,lionDistance} from './ground.ts';
import {validateMultiSave} from '../../persistence/save.ts';
export const LION_RESIDENTS=Object.freeze([{id:'lion-raka',name:'Raka',sex:'male'},{id:'lion-sena',name:'Sena',sex:'female'},{id:'lion-tala',name:'Tala',sex:'female'}] as const);
export function lionResidentsView(s:ZooSave){const pride=s.animals.filter(a=>a.speciesId==='panthera-leo'),habitat=s.world.habitats.some(h=>'kind'in h&&h.kind==='lion-savanna'),qualified=lionGrantView(s).qualified;return {qualified,command:s.economy.nextCommand,count:pride.length,canWelcome:qualified&&habitat&&pride.length<3,stage:pride.length===0?'male' as const:'females' as const,residents:pride.map(a=>({id:a.id,name:'name'in a?a.name:a.id}))};}
/** Private first-male vertical slice, then both females. Identity, sex and membership never regenerate at load. */
export function prepareLionWelcome(s:ZooSave,command:number){
 if(s.schemaVersion!==3&&s.schemaVersion!==4||!lionResidentsView(s).canWelcome)return {ok:false as const,reason:'locked' as const};
 if(!Number.isSafeInteger(command)||command!==s.economy.nextCommand||command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};
 const next=structuredClone(s),h=(next.world.habitats as RuntimeState['world']['habitats']).find((h):h is LionHabitat=>h.kind==='lion-savanna');if(!h)return {ok:false as const,reason:'habitat' as const};
 const count=(next.animals as RuntimeState['animals']).filter(isLion).length,add=count===0?LION_RESIDENTS.slice(0,1):LION_RESIDENTS.slice(1),nodes=lionGroundNodes(next.world,h);
 for(const resident of add){const others=(next.animals as RuntimeState['animals']).filter(isLion).map(a=>a.position),x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z)),slot=LION_RESIDENTS.findIndex(r=>r.id===resident.id),preferred={x:x+(slot===1?4.5:2.5),z:z+(slot===2?1.5:4.5)},p=[...nodes].sort((a,b)=>lionDistance(a,preferred)-lionDistance(b,preferred)||a.z-b.z||a.x-b.x).find(p=>others.every(q=>lionDistance(p,q)>=1.8));if(!p)return {ok:false as const,reason:'space' as const};
  const a:LionAnimal={...resident,speciesId:'panthera-leo',habitatId:h.id,position:{...p},target:null,targetResourceId:null,hunger:45,thirst:45,energy:70,habitatFit:100,enrichment:35,welfare:40,care:{low:true,hungry:true,thirsty:true,tired:false,bored:false},currentBehavior:'idle',motion:{phase:'idle',ticksLeft:5,sequence:0,heading:0,waypoints:[],waypointIndex:0,elevation:0,partnerId:null,lastStep:{x:0,z:0},distanceWalked:0,blockedTicks:0},foodEaten:0,waterDrunk:0,restedTicks:0,enrichedTicks:0,socialComfort:75,shadeRest:25,roarCooldownTicks:0,scentCooldownTicks:0,scratchCooldownTicks:0,socialCooldownTicks:0,roars:0,scentInvestigations:0,scratches:0,socialInteractions:0};next.animals.push(a);
 }
 next.economy.nextCommand++;const checked=validateMultiSave(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'stale' as const};
}
