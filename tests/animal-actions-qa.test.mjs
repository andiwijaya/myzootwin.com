import test from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation} from '../src/game/core/simulation.ts';
import {validateSave,serializeSave,parseSave} from '../src/game/persistence/save-v1.ts';

const habitat={kind:'habitat',id:'habitat-one'};
const op=n=>`edit-${n.toString(16).padStart(32,'0')}`;
function ready(){const s=createSimulation();assert.ok(s.buildHabitat({x:4,z:4},habitat.id).ok);for(const k of ['food','water','perch'])assert.ok(s[k]('place',0).ok);for(const k of ['food','water'])assert.ok(s[k]('refill',s[k+'View']().revision).ok);assert.ok(s.birds('welcome'));return s;}
function valid(s){const v=validateSave(s.snapshot());assert.ok(v.ok,JSON.stringify(v));assert.equal(s.inspect().listenerErrors,0);}
function replenish(s){for(const k of ['food','water','perch']){const v=s[k+'View']();if(!v.exists&&v.canPlace)s[k]('place',0);if(k!=='perch'&&s[k+'View']().exists&&s[k+'View']().stock<3)s[k]('refill',s[k+'View']().revision);}}

test('mixed care interruptions: 6000 deterministic ticks preserve serving/event conservation, continuity, atomic replay and codec/editor resume',()=>{
 let s=ready(),last=s.snapshot(),fed=0,drank=0,events=new Set(),previousEvents=0,operation=0,resumes=0,pauses=0,removals=0;
 const seen=[new Set(),new Set()];
 const subscribe=()=>s.subscribe(e=>{if(!['animal-fed','animal-drank'].includes(e.type))return;const id=`${e.type}:${e.animalId}:${e.tick}`;assert.ok(!events.has(id),id);events.add(id);if(e.type==='animal-fed')fed++;else drank++;});
 let unsubscribe=subscribe();
 try{for(let t=1;t<=6000;t++){
   if(t%137===0){const k=['food','water','perch'][Math.floor(t/137)%3],v=s[k+'View']();if(v.exists){const before=s.snapshot();assert.ok(s[k]('remove',v.revision).ok);assert.deepEqual(s.snapshot().animals.map(a=>a.position),before.animals.map(a=>a.position));assert.equal(s[k]('remove',v.revision).ok,false);removals++;}}
   if(t%199===0){const before=s.snapshot();s.setPaused(true);for(let j=0;j<5;j++)s.advance(1000);s.frame(900000+t);assert.deepEqual(s.snapshot(),before);for(const k of ['food','water','perch'])assert.equal(s[k]('remove',s[k+'View']().revision).ok,false);s.setPaused(false);s.frame(900000+t);assert.deepEqual(s.snapshot(),before);pauses++;}
   if(t%251===0){const state=parseSave(serializeSave(s.snapshot())),editor=s.editorSnapshot();assert.ok(state.ok);unsubscribe();s.dispose();assert.equal(s.inspect().subscribers,0);s=createSimulation(state.value,editor);unsubscribe=subscribe();assert.deepEqual(s.snapshot(),state.value);resumes++;}
   if(t%1000===0){assert.equal(s.quoteRemoval(habitat).reason,'in-use');assert.ok(s.birds('reserve'));for(const k of ['food','water','perch'])if(s[k+'View']().exists)assert.ok(s[k]('remove',s[k+'View']().revision).ok);const before=s.snapshot(),q=s.quoteRemoval(habitat);assert.ok(q.ok);assert.ok(s.remove(q.quote,op(++operation)).ok);assert.equal(s.remove(q.quote,op(++operation)).ok,false);assert.ok(s.undo(op(++operation)).ok);assert.deepEqual(s.snapshot(),before);replenish(s);assert.ok(s.birds('welcome'));assert.equal(s.birds('welcome'),false);last=s.snapshot();}
   if(t%31===0)replenish(s);
   const before=s.snapshot(),eventCount=events.size;s.advance(100);const state=s.snapshot();valid(s);
   state.animals.forEach((a,i)=>{const b=before.animals[i];seen[i].add(a.motion.phase);assert.ok(a.position&&a.habitatId);assert.ok(Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z)<.064,`${t} ${a.motion.phase}`);assert.ok(Math.abs(a.motion.elevation-b.motion.elevation)<.022);assert.ok(a.foodEaten-b.foodEaten>=0&&a.foodEaten-b.foodEaten<=1);assert.ok(a.waterDrunk-b.waterDrunk>=0&&a.waterDrunk-b.waterDrunk<=1);});
   for(const k of ['food','water']){const a=before.world.resources.find(r=>r.kind===k),b=state.world.resources.find(r=>r.kind===k);if(a&&b){const counter=k==='food'?'foodEaten':'waterDrunk',used=state.animals.reduce((n,x,i)=>n+x[counter]-before.animals[i][counter],0);assert.equal(a.stock-b.stock,used);assert.equal(b.stock,b.portions.reduce((n,x)=>n+x,0));b.portions.forEach((v,i)=>assert.equal(a.portions[i]-v,state.animals[i][counter]-before.animals[i][counter]));}}
   const total=state.animals.reduce((n,a)=>n+a.foodEaten+a.waterDrunk,0);assert.equal(events.size,total);assert.ok(events.size>=eventCount);assert.ok(events.size>=previousEvents);previousEvents=events.size;last=state;
 }
 assert.equal(fed,last.animals.reduce((n,a)=>n+a.foodEaten,0));assert.equal(drank,last.animals.reduce((n,a)=>n+a.waterDrunk,0));assert.ok(fed>20&&drank>20&&removals>30&&resumes>20&&pauses>20);
 assert.ok(seen.every(x=>['eat','drink','rest','enrich','ascend','descend'].every(p=>x.has(p))));assert.equal(s.inspect().currency,1500);
 }finally{unsubscribe();s.dispose();}assert.equal(s.inspect().subscribers,0);
});

test('all three unreachable resources grant no benefits; actual remove/rebuild recovers both severely needy birds within a bounded combined-care window',()=>{
 const a=ready(),state=a.snapshot();a.dispose();for(const r of state.world.resources)r.cell={food:{x:5,z:4},water:{x:4,z:4},perch:{x:4,z:5}}[r.kind];for(const bird of state.animals){bird.hunger=95;bird.thirst=95;bird.energy=10;bird.enrichment=0;}
 const s=createSimulation(state);try{for(let t=0;t<200;t++){s.advance(100);valid(s);}assert.ok(s.snapshot().animals.every(a=>a.foodEaten===0&&a.waterDrunk===0&&a.restedTicks===0&&a.enrichedTicks===0&&a.welfare<60));for(const k of ['food','water','perch']){assert.equal(s[k+'View']().reachable,false);assert.ok(s[k]('remove',s[k+'View']().revision).ok);}
 for(let t=0;t<1800;t++){replenish(s);s.advance(100);valid(s);}assert.ok(s.snapshot().animals.every(a=>a.foodEaten>=4&&a.waterDrunk>=4&&a.restedTicks>0&&a.enrichedTicks>0&&a.welfare>=65&&!a.care.low));
 }finally{s.dispose();}
});

test('mid-cycle cold reconstruction and irregular render partitions preserve complete animal/resource state and exact care event sequence',()=>{
 const a=ready();for(let i=0;i<173;i++)a.advance(100);const decoded=parseSave(serializeSave(a.snapshot()));assert.ok(decoded.ok);const b=createSimulation(decoded.value,a.editorSnapshot()),ea=[],eb=[];const ua=a.subscribe(e=>ea.push(e)),ub=b.subscribe(e=>eb.push(e));
 try{for(let i=0;i<1800;i++){replenish(a);replenish(b);a.advance(100);for(const ms of [7,31,12,50])b.advance(ms);assert.deepEqual(a.snapshot(),b.snapshot());}assert.deepEqual(ea,eb);assert.ok(ea.filter(e=>e.type==='animal-fed').length>5);assert.ok(ea.filter(e=>e.type==='animal-drank').length>5);valid(a);valid(b);}finally{ua();ub();a.dispose();b.dispose();}assert.equal(a.inspect().subscribers+b.inspect().subscribers,0);
});
