import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {migrateToV4,validateSaveV4,parseSaveV4,serializeSaveV4,projectUnstartedV4,GIRAFFE_CHECKPOINT_CODEC} from '../src/game/persistence/save-v4.ts';
import {migrateToV3,validateSaveV3} from '../src/game/persistence/save-v3.ts';
import {validateSaveV2} from '../src/game/persistence/save-v2.ts';import {validateSave} from '../src/game/persistence/save-v1.ts';
import {debit} from '../src/game/economy/spending.ts';import {compactFinance,coherentMoney} from '../src/game/economy/journal.ts';
const read=name=>JSON.parse(readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8'));
const golden=read('giraffe-v3-golden.json').state,old=read('elephant-legacy-v1.json').entries,v2=read('lion-v2-golden.json').state;
function codecHome(){
 const s=migrateToV4(golden).value,h={id:'habitat-giraffe-codec',kind:'giraffe-plains',cells:[],viewingCell:null};
 for(let z=2;z<9;z++)for(let x=13;x<20;x++)h.cells.push({x,z});assert.equal(debit(s,700,'build','codec-home',h.id),null);s.economy.nextCommand++;s.world.habitats.push(h);for(const c of h.cells)s.world.tiles[c.z*24+c.x].occupantId=h.id;
 const a={id:'giraffe-dira',speciesId:'giraffa-sp',name:'Dira',sex:'female',habitatId:h.id,position:{x:15.5,z:6.5},target:null,targetResourceId:null,hunger:45,thirst:45,energy:70,habitatFit:100,enrichment:35,welfare:40,care:{low:true,hungry:true,thirsty:true,tired:false,bored:false},currentBehavior:'idle',motion:{phase:'idle',ticksLeft:5,sequence:0,heading:0,waypoints:[],waypointIndex:0,partnerId:null,lastStep:{x:0,z:0},distanceWalked:0,blockedTicks:0},foodEaten:0,waterDrunk:0,restedTicks:0,enrichedTicks:0,socialComfort:75,shadeRest:25,socialCooldownTicks:0,enrichmentCooldownTicks:0,socialInteractions:0,highBrowses:0};s.animals.push(a);assert.ok(validateSaveV4(s).ok,JSON.stringify(validateSaveV4(s)));return {s,h,a};
}
test('V3 to V4 is pure/lossless over all old coordinates and fields; migration adds only clean312land cells and empty GQ namespace',()=>{
 const before=JSON.stringify(golden),r=migrateToV4(golden);assert.ok(r.ok,JSON.stringify(r));const s=r.value;assert.equal(s.schemaVersion,4);assert.equal(s.world.width,24);assert.equal(s.world.height,26);assert.equal(s.world.tiles.length,624);assert.deepEqual(projectUnstartedV4(s),golden);assert.equal(JSON.stringify(golden),before);
 for(const t of golden.world.tiles)assert.deepEqual(s.world.tiles[t.cell.z*24+t.cell.x],t);for(const t of s.world.tiles.filter(t=>t.cell.x>=12))assert.deepEqual(t,{cell:t.cell,terrain:'land',occupantId:null,path:false});
 assert.equal(s.currency,golden.currency);assert.equal(s.animals.length,7);assert.equal(s.giraffePlains.grant,null);assert.equal(s.giraffePlains.missions.completedIds.length,0);assert.deepEqual(migrateToV4(s).value,s);assert.deepEqual(parseSaveV4(serializeSaveV4(s)).value,s);assert.ok(serializeSaveV4(s).length<100000);
});
test('all nine exact V1 saves and earned V2 migrate through frozen V3 validators with historical preferences/RNG/money/proofs preserved',()=>{
 for(const source of [...Object.values(old).map(x=>x.state),v2]){const before=JSON.stringify(source),v3=migrateToV3(source),v4=migrateToV4(source);assert.ok(v3.ok);assert.ok(v4.ok,JSON.stringify(v4));assert.deepEqual(projectUnstartedV4(v4.value),v3.value);assert.equal(JSON.stringify(source),before);assert.equal(GIRAFFE_CHECKPOINT_CODEC.parse(before).ok,true);}
 const s=migrateToV4(golden).value;for(const validate of [validateSave,validateSaveV2,validateSaveV3])assert.equal(validate(s).code,'unsupported-schema');
});
test('V4 rejects corruption, append-not-reindex, historical proof changes and sparse grids without normalizing any original bytes',()=>{
 const base=migrateToV4(golden).value;
 for(const mutate of [s=>s.currency++,s=>s.randomState=-1,s=>s.world.width=12,s=>s.world.height=34,s=>s.world.tiles.pop(),s=>delete s.world.tiles[12],s=>s.world.tiles=[...golden.world.tiles,...s.world.tiles.filter(t=>t.cell.x>=12)],s=>s.lionSavanna.missions.rewards[0].award='forged',s=>s.giraffePlains.missions.currentId=null,s=>s.giraffePlains.missions.objectives.highBrowses=1,s=>s.giraffePlains.grant={id:'giraffe-plains-grant-v1',ledgerEntryId:'giraffe-plains-grant-v1',tick:s.tick,command:s.economy.nextCommand-1}]){const s=structuredClone(base);mutate(s);const text=JSON.stringify(s);assert.equal(validateSaveV4(s).ok,false,text);assert.equal(JSON.stringify(s),text);}
 assert.equal(parseSaveV4('{bad').code,'invalid-json');assert.equal(parseSaveV4(' '.repeat(1000001)).code,'too-large');assert.equal(migrateToV4({...golden,currency:1}).ok,false);
});
test('future schema, root and nested content are blocked and never coerced to old formats',()=>{
 const base=migrateToV4(golden).value;
 for(const mutate of [s=>s.schemaVersion=5,s=>s.future={},s=>s.giraffePlains.future=true,s=>s.giraffePlains.missions.future=true,s=>s.world.habitats[0].kind='future-home',s=>s.animals[0].speciesId='future-species',s=>s.world.resources[0].kind='giraffe-future']){const s=structuredClone(base);mutate(s);assert.equal(GIRAFFE_CHECKPOINT_CODEC.parse(JSON.stringify(s)).code,'unsupported-schema',JSON.stringify(s));}
});
test('strict V4 validates labelled paid fixture/one adult and rejects wrong identity, free construction,2herd, orphan or unsafe action',()=>{
 const {s,h,a}=codecHome();assert.deepEqual(parseSaveV4(serializeSaveV4(s)).value,s);
 for(const mutate of [v=>v.animals.at(-1).name='Sora',v=>v.animals.at(-1).sex='male',v=>v.animals.at(-1).position.x=12,v=>v.animals.at(-1).currentBehavior='roar',v=>v.animals.at(-1).motion.phase='wander',v=>v.animals.at(-1).highBrowses=1,v=>v.animals.at(-1).motion.lastStep.x=.05,v=>v.animals.at(-1).motion.waypoints=[{x:12,z:5}],v=>v.animals.push({...structuredClone(a),id:'giraffe-sora',name:'Sora',position:{x:17.5,z:6.5}}),v=>v.world.habitats.at(-1).cells[0].x=12,v=>v.world.habitats.pop(),v=>v.ledger.at(-1).amount=-1]){const v=structuredClone(s);mutate(v);assert.equal(validateSaveV4(v).ok,false,JSON.stringify(validateSaveV4(v)));}
 const alone=structuredClone(s);alone.animals=alone.animals.filter(a=>a.speciesId!=='giraffa-sp');alone.world.habitats=alone.world.habitats.filter(x=>x.id!==h.id);for(const c of h.cells)alone.world.tiles[c.z*24+c.x].occupantId=null;assert.ok(validateSaveV4(alone).ok);assert.throws(()=>projectUnstartedV4(s));
});
test('real source-based elevated browse ports require cost, ownership and reached contact; rendering cannot mint a meal',()=>{
 const {s,h,a}=codecHome(),r={id:'giraffe-browse-codec',kind:'giraffe-browse',habitatId:h.id,cell:{x:14,z:3},stock:0,capacity:12,revision:0,approaches:[{x:14.5,z:4.75},{x:15.75,z:3.5}]};assert.equal(debit(s,90,'build','codec-care',r.id),null);s.economy.nextCommand++;s.world.resources.push(r);assert.ok(validateSaveV4(s).ok,JSON.stringify(validateSaveV4(s)));
 a.position={...r.approaches[0]};a.target={...r.approaches[0]};a.targetResourceId=r.id;a.currentBehavior=a.motion.phase='browse';a.motion.ticksLeft=20;assert.ok(validateSaveV4(s).ok,JSON.stringify(validateSaveV4(s)));
 for(const mutate of [v=>v.world.resources.at(-1).habitatId='missing',v=>v.world.resources.at(-1).stock=13,v=>v.world.resources.at(-1).approaches[0]={x:14.5,z:3.5},v=>v.animals.at(-1).target.x+=.5,v=>v.animals.at(-1).position.x+=.1,v=>v.animals.at(-1).targetResourceId=null]){const v=structuredClone(s);mutate(v);assert.equal(validateSaveV4(v).ok,false,JSON.stringify(validateSaveV4(v)));}
 assert.equal(a.foodEaten,0);assert.equal(a.highBrowses,0);assert.equal(r.stock,0);
});
test('V4 grant and future reward proof remain pinned exactly once through real journal compaction',()=>{
 const s=migrateToV4(golden).value,q=s.economy.nextCommand,id='giraffe-plains-grant-v1';s.currency+=1850;s.ledger.push({id,operationId:id,kind:'reward',amount:1850,balanceAfter:s.currency,tick:s.tick,relatedId:'giraffe-plains'});s.giraffePlains.grant={id,ledgerEntryId:id,tick:s.tick,command:q};s.economy.nextCommand++;assert.ok(validateSaveV4(s).ok,JSON.stringify(validateSaveV4(s)));assert.equal(compactFinance(s,[],true),true);assert.ok(coherentMoney(s));assert.ok(validateSaveV4(s).ok,JSON.stringify(validateSaveV4(s)));assert.equal(s.economy.checkpoint.rewards.filter(r=>r.id===id).length,1);assert.deepEqual(parseSaveV4(serializeSaveV4(s)).value,s);
 const forged=structuredClone(s);forged.giraffePlains.grant.command=1;assert.equal(validateSaveV4(forged).ok,false);
});
