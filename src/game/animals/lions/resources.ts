import type {ZooSave,ZooSaveV3} from '../../core/zoo-state.ts';
import type {Point} from '../../core/state.ts';
import {isLion,type LionResource,type LionResourceKind,type LionHabitat} from '../../core/species.ts';
import {lionGrantView} from '../../economy/lion-grant.ts';
import {LION_PRICES} from './rules.ts';
import {LION_RESOURCE_KINDS,validateSaveV3} from '../../persistence/save-v3.ts';
import {lionGroundNodes,lionGroundRoute,lionDistance,lionPointAllowed,lionBounds,lionSegmentAllowed} from './ground.ts';
import {debit} from '../../economy/spending.ts';
export const lionResources=(s:ZooSaveV3)=>s.world.resources.filter((r):r is LionResource=>r.kind.startsWith('lion-'));
export const lionConsumable=(kind:LionResourceKind)=>!['lion-den','lion-kopje'].includes(kind);
export const lionServicePrice=(kind:LionResourceKind)=>kind==='lion-meat'?LION_PRICES.foodRefill:kind==='lion-water'?LION_PRICES.waterRefill:kind==='lion-scent'||kind==='lion-scratch'?LION_PRICES.enrichmentRefill:0;
export interface LionCareQuote {command:number;kind:LionResourceKind;cell:Point;}
export interface LionRefillQuote {command:number;id:string;revision:number;}
export function defaultLionCareCell(s:ZooSave,kind:LionResourceKind):Point|null{
 if(s.schemaVersion!==3)return null;const h=s.world.habitats.find((h):h is LionHabitat=>h.kind==='lion-savanna');if(!h)return null;const {x,z}=lionBounds(h);
 return kind==='lion-meat'?{x:x+(s.world.resources.some(r=>r.kind==='lion-meat')?6:0),z:z+1}:kind==='lion-water'?{x:x+6,z:z+3}:kind==='lion-den'?{x,z:z+5}:kind==='lion-kopje'?{x:x+3,z:z+2}:kind==='lion-scent'?{x:x+6,z:z+5}:{x:x+3,z:z+6};
}
export function validateLionCarePlacement(s:ZooSave,kind:LionResourceKind,cell:Point|null){
 const fail=(reason:'locked'|'habitat'|'limit'|'outside'|'occupied'|'busy'|'space'|'funds'|'stale')=>({reason,resource:null});
 if(s.schemaVersion!==3||!lionGrantView(s).qualified)return fail('locked');if(!LION_RESOURCE_KINDS.includes(kind))return fail('stale');
 const h=s.world.habitats.find((h):h is LionHabitat=>h.kind==='lion-savanna');if(!h)return fail('habitat');if(lionResources(s).filter(r=>r.kind===kind).length>=(kind==='lion-meat'?2:1))return fail('limit');
 if(!cell||!Number.isSafeInteger(cell.x)||!Number.isSafeInteger(cell.z)||!h.cells.some(c=>c.x===cell.x&&c.z===cell.z))return fail('outside');if(s.world.resources.some(r=>r.cell.x===cell.x&&r.cell.z===cell.z))return fail('occupied');
 const pride=s.animals.filter(isLion),center={x:cell.x+.5,z:cell.z+.5};if(pride.some(a=>lionDistance(a.position,center)<.9))return fail('busy');
 const resource:LionResource={id:'lion-preview',kind,habitatId:h.id,cell:{...cell},stock:lionConsumable(kind)?0:1,capacity:kind==='lion-meat'||kind==='lion-water'?12:kind==='lion-scent'||kind==='lion-scratch'?6:1,revision:0,approaches:[]},world={...s.world,resources:[...s.world.resources,resource]},nodes=lionGroundNodes(world,h);
 if(nodes.length<30)return fail('space');
 if(kind==='lion-kopje'){
  resource.approaches=[center];if(!lionPointAllowed(world,h,{x:center.x,z:center.z+2})||!lionPointAllowed(world,h,center))return fail('space');
 }else{
  const candidates=nodes.filter(p=>lionDistance(p,center)>=.9&&lionDistance(p,center)<=1.5).sort((a,b)=>lionDistance(a,center)-lionDistance(b,center)||a.z-b.z||a.x-b.x);
  let best:[Point,Point]|null=null,dist=0;for(const a of candidates)for(const b of candidates){const d=lionDistance(a,b);if(d>=.9&&d>dist){best=[a,b];dist=d;}}
  if(!best)return fail('space');resource.approaches=best.map(p=>({...p}));
 }
 for(const a of pride){let point=a.position;for(const target of a.motion.waypoints.slice(a.motion.waypointIndex)){if(!lionSegmentAllowed(world,h,point,target))return fail('busy');point=target;}}
 const starts=pride.length?pride.map(a=>a.position):[{x:Math.min(...h.cells.map(c=>c.x))+1.5,z:Math.min(...h.cells.map(c=>c.z))+1.5}];
 for(const a of starts){if(!lionPointAllowed(world,h,a))return fail('busy');for(const r of [...lionResources(s),resource])if(r.approaches.some(p=>!lionPointAllowed(world,h,p))||!r.approaches.some(p=>lionGroundRoute(world,h,a,p)!==null))return fail('space');}
 return {reason:s.currency<LION_PRICES[kind]?'funds' as const:'ready' as const,resource};
}
export function prepareLionCarePlacement(s:ZooSave,q:LionCareQuote){
 if(s.schemaVersion!==3||!q||q.command!==s.economy.nextCommand||!Number.isSafeInteger(q.command)||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};const placement=validateLionCarePlacement(s,q.kind,q.cell);if(placement.reason!=='ready'||!placement.resource)return {ok:false as const,reason:placement.reason};
 const next=structuredClone(s),r={...placement.resource,id:`${q.kind}-${q.command}`,revision:q.command};next.world.resources.push(r);const failure=debit(next,LION_PRICES[q.kind],'build',`place-${r.id}`,r.id);if(failure)return {ok:false as const,reason:failure};next.economy.nextCommand++;
 const checked=validateSaveV3(next);return checked.ok?{ok:true as const,state:checked.value,resourceId:r.id}:{ok:false as const,reason:'stale' as const};
}
export function prepareLionRefill(s:ZooSave,q:LionRefillQuote){
 if(s.schemaVersion!==3||!q||q.command!==s.economy.nextCommand||!Number.isSafeInteger(q.command)||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};
 const r=lionResources(s).find(r=>r.id===q.id);if(!r)return {ok:false as const,reason:'missing' as const};if(r.revision!==q.revision)return {ok:false as const,reason:'stale' as const};if(!lionConsumable(r.kind)||r.stock>=r.capacity)return {ok:false as const,reason:'full' as const};
 const next=structuredClone(s),resource=lionResources(next).find(r=>r.id===q.id)!;const failure=debit(next,lionServicePrice(r.kind),'supplies',`service-${r.id}`,r.id);if(failure)return {ok:false as const,reason:failure};resource.stock=resource.capacity;resource.revision++;next.economy.nextCommand++;
 const checked=validateSaveV3(next);return checked.ok?{ok:true as const,state:checked.value,resourceId:r.id}:{ok:false as const,reason:'stale' as const};
}
