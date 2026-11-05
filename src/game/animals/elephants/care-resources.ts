import {reconcileElephantWelfare} from './welfare.ts';
import type {ZooSave} from '../../core/zoo-state.ts';
import type {Point} from '../../core/state.ts';
import type {ElephantResource,ZooWorld,ZooResource} from '../../core/species.ts';
import {isElephant,elephants} from '../../core/species.ts';
import {conservationGrantView} from '../../economy/conservation-grant.ts';
import {ELEPHANT_PRICES} from '../../economy/elephant-prices.ts';
import {debit} from '../../economy/spending.ts';
import {validateSaveV2} from '../../persistence/save-v2.ts';
import {ELEPHANT_GROUND,elephantGroundRoute,groundCenters,groundDistance} from './ground.ts';

export type ElephantCareKind='elephant-browse'|'elephant-water'|'elephant-pond';
export type ElephantCareReason='ready'|'locked'|'habitat'|'limit'|'outside'|'occupied'|'space'|'busy'|'funds'|'stale'|'full'|'missing';
export const ELEPHANT_CARE_RULES=Object.freeze({capacity:8,browseRefill:8,waterRefill:4,pondRefill:12,feeders:2,troughs:1,ponds:1});
const knownKind=(k:unknown):k is ElephantCareKind=>k==='elephant-browse'||k==='elephant-water'||k==='elephant-pond';
export const elephantServicePrice=(kind:ElephantCareKind)=>kind==='elephant-browse'?ELEPHANT_CARE_RULES.browseRefill:kind==='elephant-water'?ELEPHANT_CARE_RULES.waterRefill:ELEPHANT_CARE_RULES.pondRefill;
type Placement={reason:ElephantCareReason;resource:ElephantResource|null};

export function defaultElephantCareCell(s:ZooSave,kind:ElephantCareKind):Point|null{
 if(s.schemaVersion!==2)return null;const h=s.world.habitats.find(h=>h.kind==='elephant-grove');if(!h)return null;
 const x=Math.min(...h.cells.map(c=>c.x)),z=Math.min(...h.cells.map(c=>c.z));return kind==='elephant-pond'?{x:x+2,z:z+5}:kind==='elephant-water'?{x:x+5,z:z+3}:{x:x+(s.world.resources.some(r=>r.kind==='elephant-browse'&&r.habitatId===h.id)?5:0),z:z+1};
}
/** Authoritative preview/Confirm authority. Ports and topology are simulation data, never renderer guesses. */
export function validateElephantCarePlacement(s:ZooSave,kind:ElephantCareKind,cell:Point|null):Placement{
 const fail=(reason:ElephantCareReason):Placement=>({reason,resource:null});
 if(s.schemaVersion!==2||!conservationGrantView(s).qualified)return fail('locked');
 if(!knownKind(kind))return fail('stale');const h=s.world.habitats.find(h=>h.kind==='elephant-grove');if(!h)return fail('habitat');
 if(s.world.resources.filter(r=>r.kind===kind&&r.habitatId===h.id).length>=(kind==='elephant-browse'?2:1))return fail('limit');
 if(!cell||!Number.isSafeInteger(cell.x)||!Number.isSafeInteger(cell.z)||!h.cells.some(c=>c.x===cell.x&&c.z===cell.z)||!s.world.tiles.some(t=>t.cell.x===cell.x&&t.cell.z===cell.z&&t.occupantId===h.id&&!t.path))return fail('outside');
 if(s.world.resources.some(r=>r.cell.x===cell.x&&r.cell.z===cell.z))return fail('occupied');
 const center={x:cell.x+.5,z:cell.z+.5},herd=s.animals.filter(isElephant);if(herd.some(a=>groundDistance(a.position,center)<ELEPHANT_GROUND.propClearance))return fail('busy');
 const resource:ElephantResource={id:'elephant-preview',kind,habitatId:h.id,cell:{...cell},stock:0,capacity:ELEPHANT_CARE_RULES.capacity,revision:0,approaches:[]},world:ZooWorld={...s.world,resources:[...s.world.resources,resource]},nodes=groundCenters(world,h);
 if(nodes.length<8)return fail('space');const ports=nodes.filter(p=>{const d=groundDistance(p,center);return d>=.95&&d<=1.6;});if(ports.length<(kind==='elephant-browse'?1:2))return fail('space');
 let pair:[Point,Point]|null=null,separation=-1;for(let i=0;i<ports.length;i++)for(let j=i+1;j<ports.length;j++){const d=groundDistance(ports[i]!,ports[j]!);if(d>separation){pair=[ports[i]!,ports[j]!];separation=d;}}
 if(kind!=='elephant-browse'&&(!pair||separation<ELEPHANT_GROUND.separation))return fail('space');resource.approaches=(pair??[ports[0]!]).map(p=>({...p}));
 const starts=herd.length?herd.map(a=>a.position):[resource.approaches[0]!],facilities=world.resources.filter((r):r is ElephantResource=>'approaches'in r&&r.habitatId===h.id);
 for(const start of starts)for(const r of facilities)if(!r.approaches.some(p=>elephantGroundRoute(world,h,start,p)!==null))return fail('space');
 return {reason:s.currency<ELEPHANT_PRICES[kind]?'funds':'ready',resource};
}
export interface ElephantCareQuote {command:number;kind:ElephantCareKind;cell:Point;}
export function prepareElephantCarePlacement(s:ZooSave,quote:ElephantCareQuote){
 if(!quote||quote.command!==s.economy.nextCommand||!Number.isSafeInteger(quote.command)||quote.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};
 const checked=validateElephantCarePlacement(s,quote.kind,quote.cell);if(s.schemaVersion!==2||checked.reason!=='ready'||!checked.resource)return {ok:false as const,reason:checked.reason};
 const next=structuredClone(s),r={...checked.resource,id:`${quote.kind}-${quote.command}`,revision:quote.command};next.world.resources.push(r);const paid=debit(next,ELEPHANT_PRICES[quote.kind],'build',`place-${r.id}`,r.id);if(paid)return {ok:false as const,reason:paid==='funds'?'funds' as const:'stale' as const};next.economy.nextCommand++;
 const valid=validateSaveV2(reconcileElephantWelfare(next));return valid.ok?{ok:true as const,state:valid.value,resourceId:r.id}:{ok:false as const,reason:'stale' as const};
}
export interface ElephantCareRefillQuote {command:number;id:string;revision:number;}
export function prepareElephantCareRefill(s:ZooSave,quote:ElephantCareRefillQuote){
 if(s.schemaVersion!==2||!conservationGrantView(s).qualified)return {ok:false as const,reason:'locked' as const};
 if(!quote||quote.command!==s.economy.nextCommand||!Number.isSafeInteger(quote.command)||quote.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};
 const resource=s.world.resources.find((r):r is ElephantResource=>r.id===quote.id&&knownKind(r.kind)&&'approaches'in r);if(!resource)return {ok:false as const,reason:'missing' as const};if(quote.revision!==resource.revision)return {ok:false as const,reason:'stale' as const};if(resource.stock>=resource.capacity)return {ok:false as const,reason:'full' as const};
 const next=structuredClone(s),r=next.world.resources.find(r=>r.id===resource.id)!;const paid=debit(next,elephantServicePrice(resource.kind as ElephantCareKind),'supplies',`service-${r.id}`,r.id);if(paid)return {ok:false as const,reason:paid==='funds'?'funds' as const:'stale' as const};r.stock=r.capacity;r.revision++;next.economy.nextCommand++;
 const checked=validateSaveV2(reconcileElephantWelfare(next));return checked.ok?{ok:true as const,state:checked.value,resourceId:r.id}:{ok:false as const,reason:'stale' as const};
}

export function elephantCareView(s:ZooSave){
 const qualified=conservationGrantView(s).qualified,h=s.world.habitats.find(h=>'kind'in h&&h.kind==='elephant-grove'),resources:readonly ZooResource[]=s.world.resources,all=resources.filter((r):r is ElephantResource=>'approaches'in r&&knownKind(r.kind)),view=(r:ElephantResource)=>({id:r.id,kind:r.kind as ElephantCareKind,stock:r.stock,capacity:r.capacity,revision:r.revision,cell:{...r.cell},refillPrice:elephantServicePrice(r.kind as ElephantCareKind),canRefill:r.stock<r.capacity&&s.currency>=elephantServicePrice(r.kind as ElephantCareKind)});
 const feeders=all.filter(r=>r.kind==='elephant-browse').sort((a,b)=>a.cell.x-b.cell.x||a.cell.z-b.cell.z).map(view),water=all.find(r=>r.kind==='elephant-water'),pond=all.find(r=>r.kind==='elephant-pond');return {command:s.economy.nextCommand,qualified,habitat:Boolean(h),balance:s.currency,browsePrice:ELEPHANT_PRICES['elephant-browse'],waterPrice:ELEPHANT_PRICES['elephant-water'],pondPrice:ELEPHANT_PRICES['elephant-pond'],canAddBrowse:Boolean(qualified&&h&&feeders.length<2&&s.currency>=ELEPHANT_PRICES['elephant-browse']),canAddWater:Boolean(qualified&&h&&!water&&s.currency>=ELEPHANT_PRICES['elephant-water']),canAddPond:Boolean(qualified&&h&&!pond&&s.currency>=ELEPHANT_PRICES['elephant-pond']),feeders,water:water?view(water):null,pond:pond?view(pond):null,residents:elephants(s.animals).map(a=>({id:a.id,name:a.name,behavior:a.currentBehavior,backing:Boolean(a.motion.backing),phaseTicksLeft:a.motion.ticksLeft,hunger:Math.round(a.hunger),thirst:Math.round(a.thirst),welfare:a.welfare,foodEaten:a.foodEaten,waterDrunk:a.waterDrunk,baths:a.baths,bathCooldownTicks:a.bathCooldownTicks}))};
}
export type ElephantCareView=ReturnType<typeof elephantCareView>;

export function elephantCareSnapshot(s:ZooSave){const resources:readonly ZooResource[]=s.world.resources;return {resources:structuredClone(resources.filter((r):r is ElephantResource=>'approaches'in r&&knownKind(r.kind))),width:s.world.width,height:s.world.height};}
