import type {ZooSave} from '../../core/zoo-state.ts';
import {giraffes,type GiraffeAnimal,type GiraffeHabitat} from '../../core/giraffe-state.ts';
import {giraffeGrantView} from '../../economy/giraffe-grant.ts';
import {giraffeGroundNodes,giraffeDistance} from './ground.ts';
import {validateSaveV4} from '../../persistence/save-v4.ts';
export const GIRAFFE_RESIDENTS=Object.freeze([{id:'giraffe-dira',name:'Dira'},{id:'giraffe-sora',name:'Sora'},{id:'giraffe-lila',name:'Lila'}] as const);
export function giraffeResidentsView(s:ZooSave){const herd=giraffes(s.animals),habitat=s.world.habitats.some(h=>'kind'in h&&h.kind==='giraffe-plains'),qualified=giraffeGrantView(s).qualified;return {qualified,command:s.economy.nextCommand,count:herd.length,canWelcome:qualified&&habitat&&(herd.length===0||herd.length===1),stage:herd.length===0?'first' as const:'companions' as const,residents:herd.map(a=>({id:a.id,name:a.name}))};}
/** First adult, then both companions atomically; no load-time re-creation or random identities. */
export function prepareGiraffeWelcome(s:ZooSave,command:number){
 if(s.schemaVersion!==4||!giraffeResidentsView(s).canWelcome)return {ok:false as const,reason:'locked' as const};
 if(!Number.isSafeInteger(command)||command!==s.economy.nextCommand||command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};
 const next=structuredClone(s),h=next.world.habitats.find((h):h is GiraffeHabitat=>h.kind==='giraffe-plains');if(!h)return {ok:false as const,reason:'habitat' as const};
 const count=giraffes(next.animals).length,add=count===0?GIRAFFE_RESIDENTS.slice(0,1):GIRAFFE_RESIDENTS.slice(1),nodes=giraffeGroundNodes(next.world,h),x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z));
 for(const resident of add){const others=giraffes(next.animals).map(a=>a.position),slot=GIRAFFE_RESIDENTS.findIndex(r=>r.id===resident.id),preferred={x:x+(slot===1?4.5:2.5),z:z+(slot===2?2.5:4.5)},p=[...nodes].sort((a,b)=>giraffeDistance(a,preferred)-giraffeDistance(b,preferred)||a.z-b.z||a.x-b.x).find(p=>others.every(q=>giraffeDistance(p,q)>=1.8));if(!p)return {ok:false as const,reason:'space' as const};
  const a:GiraffeAnimal={...resident,sex:'female',speciesId:'giraffa-sp',habitatId:h.id,position:{...p},target:null,targetResourceId:null,hunger:45,thirst:45,energy:70,habitatFit:100,enrichment:35,welfare:40,care:{low:true,hungry:true,thirsty:true,tired:false,bored:false},currentBehavior:'idle',motion:{phase:'idle',ticksLeft:5,sequence:0,heading:0,waypoints:[],waypointIndex:0,partnerId:null,lastStep:{x:0,z:0},distanceWalked:0,blockedTicks:0},foodEaten:0,waterDrunk:0,restedTicks:0,enrichedTicks:0,socialComfort:70,shadeRest:25,socialCooldownTicks:0,enrichmentCooldownTicks:0,socialInteractions:0,highBrowses:0};next.animals.push(a);
 }
 next.economy.nextCommand++;const checked=validateSaveV4(next);return checked.ok?{ok:true as const,state:checked.value}:{ok:false as const,reason:'stale' as const};
}
