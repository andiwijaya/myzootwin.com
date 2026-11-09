import type{ZooSave}from'../core/zoo-state.ts';
import{zebras,zebraResources,type ZebraResourceKind}from'../core/zebra-state.ts';
import{ZEBRA_NEEDS,ZEBRA_PRICES}from'../animals/zebras/rules.ts';
import{zebraGroundAccess,zebraDistance}from'../animals/zebras/ground.ts';
import{zebraServicePrice}from'../animals/zebras/resources.ts';
import{quoteRemoval}from'../world/editing.ts';
import{zebraAccessView}from'../world/zebra-access.ts';
import{recoveryView}from'./recovery.ts';
import{macawRuntimeView}from'../core/runtime-state.ts';
export interface ZebraRecoveryView{active:boolean;kind:'hidden'|'build'|'refill'|'unreachable'|'waiting'|'refund'|'funds'|'support'|'path'|'space'|'gate'|'steady';command:number;balance:number;cost:number;resourceId:string|null;resourceKind:ZebraResourceKind|null;animal:string|null;refund:number;missingPaths:number;totalPathCost:number;}
/** Truthful review guidance only: no free Zebra supplies, grant, removal, debit,
 * stock/position edit, RNG draw or simulated tick. Existing commands do the work. */
export function zebraRecoveryView(s:ZooSave,editorRevision=0):ZebraRecoveryView{
 const v:ZebraRecoveryView={active:false,kind:'hidden',command:s.economy.nextCommand,balance:s.currency,cost:0,resourceId:null,resourceKind:null,animal:null,refund:0,missingPaths:0,totalPathCost:0};
 if(s.schemaVersion!==5)return v;const h=s.world.habitats.find(h=>h.kind==='zebra-grasslands'),herd=zebras(s.animals);if(!h||!herd.length)return v;
 const resources=zebraResources(s.world.resources),worst=[...herd].sort((a,b)=>Number(Math.max(b.hunger,b.thirst)>=70)-Number(Math.max(a.hunger,a.thirst)>=70)||a.welfare-b.welfare||a.id.localeCompare(b.id))[0]!;
 v.active=true;v.animal=worst.name;
 const essential:ZebraResourceKind[]=['zebra-graze','zebra-water','zebra-shade'];
 const needs:ZebraResourceKind[]=worst.thirst>=70?['zebra-water','zebra-graze','zebra-shade']:essential;
 const ground=zebraGroundAccess(s.world,h),reachable=ground.from(worst.position);let waiting:{id:string;kind:ZebraResourceKind}|null=null;
 for(const kind of needs){
  const own=resources.filter(r=>r.kind===kind);
  if(!own.length){v.kind='build';v.resourceKind=kind;v.cost=ZEBRA_PRICES[kind];break;}
  const service=own.filter(r=>r.approaches.some(port=>zebraDistance(port,{x:r.cell.x+.5,z:r.cell.z+.5})<=ZEBRA_NEEDS.maxFeedApproach&&reachable(port)));
  if(!service.length){v.kind='unreachable';v.resourceId=own[0]!.id;v.resourceKind=kind;break;}
  if(kind!=='zebra-shade'&&service.every(r=>r.stock===0)){v.kind='refill';v.resourceId=service[0]!.id;v.resourceKind=kind;v.cost=zebraServicePrice(kind);break;}
  if((kind==='zebra-graze'&&worst.hunger>=35)||(kind==='zebra-water'&&worst.thirst>=35)||(kind==='zebra-shade'&&(worst.energy<60||worst.shadeRest<55))){waiting??={kind,id:service.find(r=>r.stock>0)?.id??service[0]!.id};}
 }
 if(v.kind==='hidden'&&waiting){v.kind='waiting';v.resourceKind=waiting.kind;v.resourceId=waiting.id;}
 if(v.cost>s.currency){
  const spare=resources.filter(r=>r.kind==='zebra-enrichment'||r.kind==='zebra-graze'&&resources.filter(a=>a.kind===r.kind).length>1);
  for(const r of spare.sort((a,b)=>Number(a.kind!=='zebra-enrichment')-Number(b.kind!=='zebra-enrichment')||a.id.localeCompare(b.id))){const quote=quoteRemoval(s,{kind:'zebra-resource',id:r.id},editorRevision);if(!quote.ok||quote.quote.refund<=0)continue;v.kind='refund';v.resourceId=r.id;v.resourceKind=r.kind;v.refund=quote.quote.refund;return v;}
  const old=recoveryView(macawRuntimeView(s));v.kind=old.low&&old.available?'support':'funds';return v;
 }
 if(v.kind!=='hidden')return v;
 const access=zebraAccessView(s);if(!access.connected){v.kind=access.path?'path':'space';v.cost=access.path?15:0;v.missingPaths=access.path?.missing??0;v.totalPathCost=access.path?.total??0;if(v.cost>s.currency)v.kind='funds';return v;}
 if(!s.visitorFlow.open){v.kind='gate';return v;}
 v.kind='steady';v.active=false;return v;
}
