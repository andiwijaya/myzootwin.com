import type {RuntimeState,Point} from '../core/state.ts';
import {conservationGrantView} from '../economy/conservation-grant.ts';
import {elephants} from '../core/species.ts';
import {visitTargetForState} from '../visitors/graph.ts';
export type ElephantGuideStage='home'|'care'|'path'|'visitors'|'done';
export type ElephantGuideFocus='grove'|'aviary';
export interface ElephantGuideArea {x:number;z:number;width:number;depth:number;}
const area=(cells:Point[]):ElephantGuideArea|null=>{if(!cells.length)return null;const x=Math.min(...cells.map(p=>p.x)),z=Math.min(...cells.map(p=>p.z));return{x,z,width:Math.max(...cells.map(p=>p.x))+1-x,depth:Math.max(...cells.map(p=>p.z))+1-z};};
/** Four optional contextual hints. Re-reading or focusing never changes the saved world, clock or rewards. */
export function elephantOnboardingView(s:RuntimeState){
 const qualified=conservationGrantView(s).qualified,grove=s.world.habitats.find(h=>h.kind==='elephant-grove'),aviary=s.world.habitats.find(h=>!h.kind||h.kind==='macaw-aviary'),herd=elephants(s.animals),welcomed=herd.length===2&&herd.every(a=>a.habitatId===grove?.id),fed=welcomed&&herd.every(a=>a.foodEaten>0&&a.waterDrunk>0),connected=Boolean(grove&&welcomed&&visitTargetForState(s,grove.id)),claimed=Boolean(s.elephantGrove?.missions.completedIds.includes('EH01')),viewed=Boolean(s.elephantGrove?.missions.objectives.viewedVisitorIds.length),done=[Boolean(grove),fed,connected,claimed&&viewed],stages=['home','care','path','visitors']as const,index=done.indexOf(false),stage:ElephantGuideStage=index===-1?'done':stages[index]!;
 return{active:qualified,stage,steps:stages.map((id,i)=>({id,done:done[i]!})),welcomed,open:s.visitorFlow.open,viewed,claimed,focus:{grove:qualified?(grove?area(grove.cells):{x:3,z:11,width:6,depth:6}):null,aviary:area(aviary?.cells??[])}};
}
export type ElephantOnboardingView=ReturnType<typeof elephantOnboardingView>;
