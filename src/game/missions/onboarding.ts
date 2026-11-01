import type {Point,ZooSaveV1} from '../core/state.ts';
import {analyzePaths,validatePathPlacement} from '../world/paths.ts';
import {validateHabitatPlacement} from '../world/build-habitat.ts';
import {PRICES} from '../economy/prices.ts';
import {MISSION_RULES} from './engine.ts';
export type GuideCommand='preview'|'confirm'|'cancel'|'focus';
export interface FirstMissionGuide {stage:'habitat'|'path'|'claim'|'done'|'blocked';kind:'habitat'|'path'|null;target:Point|null;remaining:number;cost:number;coins:number;affordable:boolean;reward:number;habitat:boolean;connected:boolean;reason:'none'|'space'|'access';}
/** Read-only suggestions. Every construction still uses the normal preview and atomic paid command. */
export function firstMissionGuide(s:ZooSaveV1):FirstMissionGuide{
 const topology=analyzePaths(s.world),habitat=s.world.habitats.length>0,connected=topology.habitats.some(h=>h.connected),reward=MISSION_RULES.Q01.coins;
 let stage:FirstMissionGuide['stage']='habitat',kind:FirstMissionGuide['kind']='habitat',target:Point|null=null,remaining=0,cost:number=PRICES.habitat,reason:FirstMissionGuide['reason']='none';
 if(s.missions.completedIds.includes('Q01')){stage='done';kind=null;cost=0;const h=s.world.habitats[0];target=h?{x:h.cells.reduce((n,p)=>n+p.x,0)/h.cells.length,z:h.cells.reduce((n,p)=>n+p.z,0)/h.cells.length}:null;}
 else if(connected){stage='claim';kind=null;cost=0;}
 else if(!habitat){const center={x:Math.floor(s.world.width/2)-2,z:Math.floor(s.world.height/2)-1};target=s.world.tiles.map(t=>t.cell).filter(c=>validateHabitatPlacement(s.world,c).reason==='ready').sort((a,b)=>Math.abs(a.x-center.x)+Math.abs(a.z-center.z)-Math.abs(b.x-center.x)-Math.abs(b.z-center.z)||a.z-b.z||a.x-b.x)[0]??null;if(!target){stage='blocked';kind=null;cost=0;reason='space';}}
 else{stage='path';kind='path';cost=PRICES.path;const potential=structuredClone(s.world);for(const t of potential.tiles)if(validatePathPlacement(potential,t.cell).reason==='ready')t.path=true;const route=analyzePaths(potential).habitats.find(h=>h.connected)?.route??[],missing=route.filter(c=>!s.world.tiles.find(t=>t.cell.x===c.x&&t.cell.z===c.z)?.path);remaining=missing.length;target=missing[0]??null;if(!target){stage='blocked';kind=null;cost=0;reason='access';}}
 return{stage,kind,target:target?{...target}:null,remaining,cost,coins:s.currency,affordable:s.currency>=cost,reward,habitat,connected,reason};
}
