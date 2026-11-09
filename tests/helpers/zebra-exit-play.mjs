import{readFileSync}from'node:fs';import assert from'node:assert/strict';
import{preparedZebraCare}from'./zebra-care-play.mjs';
import{validateSaveV5}from'../../src/game/persistence/save-v5.ts';
import{zebraResources}from'../../src/game/core/zebra-state.ts';
export const zebraExitObservation=JSON.parse(readFileSync(new URL('../fixtures/zebra-exit-observation.json',import.meta.url),'utf8'));
/** Exact observed four Zebra states/resources transplanted into the existing
 * source-command fixture. Old species, finance and RNG are source fixture data,
 * not a reconstructed complete browser save or an owner's profile. */
export function zebraExitState(){
 const base=preparedZebraCare(),s=base.snapshot();base.dispose();
 const home=s.world.habitats.find(h=>h.kind==='zebra-grasslands'),resources=zebraResources(s.world.resources),ids=new Map(zebraExitObservation.resources.map((r,i)=>[r.id,resources[i].id]));
 for(const r of zebraExitObservation.resources){const index=s.world.resources.findIndex(a=>a.id===ids.get(r.id));s.world.resources[index]={...structuredClone(r),id:ids.get(r.id),habitatId:home.id};}
 s.tick=zebraExitObservation.tick;s.gameTimeMs=s.tick*100;
 s.animals=s.animals.filter(a=>a.speciesId!=='equus-quagga').concat(zebraExitObservation.zebraActors.map(a=>({...structuredClone(a),habitatId:home.id,targetResourceId:a.targetResourceId?ids.get(a.targetResourceId):null})));
 const checked=validateSaveV5(s);assert.equal(checked.ok,true,JSON.stringify(checked));return checked.value;
}
