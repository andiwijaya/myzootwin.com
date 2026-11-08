import type {ZooHabitat} from '../../core/species.ts';
import type {ZooSave} from '../../core/zoo-state.ts';
import type {Point} from '../../core/state.ts';
import {giraffes,giraffeResources,type GiraffeResource,type GiraffeResourceKind,type GiraffeHabitat,GIRAFFE_RESOURCE_KINDS} from '../../core/giraffe-state.ts';
import {giraffeGrantView} from '../../economy/giraffe-grant.ts';
import {GIRAFFE_PRICES} from './rules.ts';
import {validateMultiSave} from '../../persistence/save.ts';
import {giraffeGroundNodes,giraffeGroundRoute,giraffeDistance,giraffePointAllowed,giraffeBounds,giraffeSegmentAllowed} from './ground.ts';
import {debit} from '../../economy/spending.ts';
export const giraffeConsumable=(kind:GiraffeResourceKind)=>kind!=='giraffe-shade';
export const giraffeServicePrice=(kind:GiraffeResourceKind)=>kind==='giraffe-browse'?GIRAFFE_PRICES.foodRefill:kind==='giraffe-water'?GIRAFFE_PRICES.waterRefill:kind==='giraffe-enrichment'?GIRAFFE_PRICES.enrichmentRefill:0;
export interface GiraffeCareQuote {command:number;kind:GiraffeResourceKind;cell:Point;}
export interface GiraffeRefillQuote {command:number;id:string;revision:number;}
export function defaultGiraffeCareCell(s:ZooSave,kind:GiraffeResourceKind):Point|null{
 if((s.schemaVersion!==4&&s.schemaVersion!==5))return null;const h=(s.world.habitats as readonly ZooHabitat[]).find((h):h is GiraffeHabitat=>h.kind==='giraffe-plains');if(!h)return null;const {x,z}=giraffeBounds(h);
 return kind==='giraffe-browse'?{x:x+(s.world.resources.some(r=>r.kind==='giraffe-browse')?6:0),z:z+1}:kind==='giraffe-water'?{x:x+6,z:z+3}:kind==='giraffe-shade'?{x,z:z+5}:{x:x+3,z:z+6};
}
export function validateGiraffeCarePlacement(s:ZooSave,kind:GiraffeResourceKind,cell:Point|null){
 const fail=(reason:'locked'|'habitat'|'limit'|'outside'|'occupied'|'busy'|'space'|'funds'|'stale')=>({reason,resource:null});
 if((s.schemaVersion!==4&&s.schemaVersion!==5)||!giraffeGrantView(s).qualified||kind==='giraffe-enrichment'&&!s.giraffePlains.missions.completedIds.includes('GQ03'))return fail('locked');if(!GIRAFFE_RESOURCE_KINDS.includes(kind))return fail('stale');
 const h=(s.world.habitats as readonly ZooHabitat[]).find((h):h is GiraffeHabitat=>h.kind==='giraffe-plains');if(!h)return fail('habitat');if(giraffeResources(s.world.resources).filter(r=>r.kind===kind).length>=(kind==='giraffe-browse'?2:1))return fail('limit');
 if(!cell||!Number.isSafeInteger(cell.x)||!Number.isSafeInteger(cell.z)||!h.cells.some(c=>c.x===cell.x&&c.z===cell.z))return fail('outside');if(s.world.resources.some(r=>r.cell.x===cell.x&&r.cell.z===cell.z))return fail('occupied');
 const herd=giraffes(s.animals),center={x:cell.x+.5,z:cell.z+.5};if(herd.some(a=>giraffeDistance(a.position,center)<.9))return fail('busy');
 const resource:GiraffeResource={id:'giraffe-preview',kind,habitatId:h.id,cell:{...cell},stock:giraffeConsumable(kind)?0:1,capacity:kind==='giraffe-browse'||kind==='giraffe-water'?12:kind==='giraffe-enrichment'?6:1,revision:0,approaches:[]},world={...s.world,resources:[...s.world.resources,resource]},nodes=giraffeGroundNodes(world,h);
 if(nodes.length<30)return fail('space');
 const candidates=nodes.filter(p=>giraffeDistance(p,center)>=.9&&giraffeDistance(p,center)<=1.5).sort((a,b)=>giraffeDistance(a,center)-giraffeDistance(b,center)||a.z-b.z||a.x-b.x);
 let best:[Point,Point]|null=null,dist=0;for(const a of candidates)for(const b of candidates){const d=giraffeDistance(a,b);if(d>=1.05&&d>dist){best=[a,b];dist=d;}}if(!best)return fail('space');resource.approaches=best.map(p=>({...p}));
 for(const a of herd){let p=a.position;for(const goal of a.motion.waypoints.slice(a.motion.waypointIndex)){if(!giraffeSegmentAllowed(world,h,p,goal))return fail('busy');p=goal;}}
 const starts=herd.length?herd.map(a=>a.position):[{x:giraffeBounds(h).x+2.5,z:giraffeBounds(h).z+4.5}];
 for(const p of starts){if(!giraffePointAllowed(world,h,p))return fail('busy');for(const r of [...giraffeResources(s.world.resources),resource])if(r.approaches.some(port=>!giraffePointAllowed(world,h,port))||!r.approaches.some(port=>giraffeGroundRoute(world,h,p,port)!==null))return fail('space');}
 return {reason:s.currency<GIRAFFE_PRICES[kind]?'funds' as const:'ready' as const,resource};
}
export function prepareGiraffeCarePlacement(s:ZooSave,q:GiraffeCareQuote){
 if((s.schemaVersion!==4&&s.schemaVersion!==5)||!q||q.command!==s.economy.nextCommand||!Number.isSafeInteger(q.command)||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};const placement=validateGiraffeCarePlacement(s,q.kind,q.cell);if(placement.reason!=='ready'||!placement.resource)return {ok:false as const,reason:placement.reason};
 const next=structuredClone(s),r={...placement.resource,id:`${q.kind}-${q.command}`,revision:q.command};next.world.resources.push(r);const failure=debit(next,GIRAFFE_PRICES[q.kind],'build',`place-${r.id}`,r.id);if(failure)return {ok:false as const,reason:failure};next.economy.nextCommand++;
 const checked=validateMultiSave(next);return checked.ok?{ok:true as const,state:checked.value,resourceId:r.id}:{ok:false as const,reason:'stale' as const};
}
export function prepareGiraffeRefill(s:ZooSave,q:GiraffeRefillQuote){
 if((s.schemaVersion!==4&&s.schemaVersion!==5)||!q||q.command!==s.economy.nextCommand||!Number.isSafeInteger(q.command)||q.command>=Number.MAX_SAFE_INTEGER)return {ok:false as const,reason:'stale' as const};
 const r=giraffeResources(s.world.resources).find(r=>r.id===q.id);if(!r)return {ok:false as const,reason:'missing' as const};if(r.revision!==q.revision)return {ok:false as const,reason:'stale' as const};if(!giraffeConsumable(r.kind)||r.stock>=r.capacity)return {ok:false as const,reason:'full' as const};
 const next=structuredClone(s),resource=giraffeResources(next.world.resources).find(r=>r.id===q.id)!;const failure=debit(next,giraffeServicePrice(r.kind),'supplies',`service-${r.id}`,r.id);if(failure)return {ok:false as const,reason:failure};resource.stock=resource.capacity;resource.revision++;next.economy.nextCommand++;
 const checked=validateMultiSave(next);return checked.ok?{ok:true as const,state:checked.value,resourceId:r.id}:{ok:false as const,reason:'stale' as const};
}
