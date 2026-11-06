import test from 'node:test';
import assert from 'node:assert/strict';
import {syncLionFacilitySelect} from '../src/game-entry/lion-facility-select.ts';
import {LION_RESOURCE_KINDS} from '../src/game/persistence/save-v3.ts';

function picker(){
 const writes=[],attributes=new Map();let disabled=false;
 const options=LION_RESOURCE_KINDS.map(value=>{let text='';return {value,get textContent(){return text;},set textContent(next){writes.push(['option',value,next]);text=next;}};});
 return {writes,select:{options,value:'lion-water',getAttribute:name=>attributes.get(name)??null,setAttribute(name,value){writes.push(['attribute',name,value]);attributes.set(name,value);},get disabled(){return disabled;},set disabled(value){writes.push(['disabled',value]);disabled=value;}}};
}

test('a facility picker receives no DOM writes across repeated simulation renders, preserving the selected value and option identities',()=>{
 const {select,writes}=picker(),nodes=[...select.options];syncLionFacilitySelect(select,'en','Plan facility',false);
 assert.equal(writes.length,7);assert.equal(select.options[1].textContent,'Drinking trough · 70 ZC');writes.length=0;
 for(let tick=0;tick<500;tick++)syncLionFacilitySelect(select,'en','Plan facility',false);
 assert.deepEqual(writes,[]);assert.equal(select.value,'lion-water');assert.deepEqual(select.options,nodes);
});

test('changing language updates each real label once while preserving the selected facility and the same native control',()=>{
 const {select,writes}=picker();syncLionFacilitySelect(select,'en','Plan facility',false);writes.length=0;
 syncLionFacilitySelect(select,'id','Rencanakan fasilitas',false);assert.equal(writes.length,7);assert.equal(select.options[1].textContent,'Bak air minum · 70 ZC');assert.equal(select.value,'lion-water');writes.length=0;
 syncLionFacilitySelect(select,'id','Rencanakan fasilitas',false);assert.deepEqual(writes,[]);
});

test('pause and resume still update disabled state exactly once without rewriting the option list',()=>{
 const {select,writes}=picker();syncLionFacilitySelect(select,'en','Plan facility',false);writes.length=0;
 syncLionFacilitySelect(select,'en','Plan facility',true);assert.deepEqual(writes,[['disabled',true]]);writes.length=0;
 syncLionFacilitySelect(select,'en','Plan facility',true);assert.deepEqual(writes,[]);
 syncLionFacilitySelect(select,'en','Plan facility',false);assert.deepEqual(writes,[['disabled',false]]);
});
