import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateSaveV1,validateSaveV2,serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {prepareElephantConstruction} from '../src/game/economy/elephant-construction.ts';
import {prepareElephantWelcome} from '../src/game/animals/elephants/residents.ts';
import {prepareElephantCarePlacement,prepareElephantCareRefill,defaultElephantCareCell} from '../src/game/animals/elephants/care-resources.ts';
import {elephantWelfareParts,reconcileElephantWelfare} from '../src/game/animals/elephants/welfare.ts';
import {ELEPHANT_WELFARE as W,ELEPHANT_NEEDS as N} from '../src/game/animals/elephants/care-rules.ts';
import {ELEPHANT_GROUND as G,groundDistance,groundPointAllowed} from '../src/game/animals/elephants/ground.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
const legacy=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state;
const herd=s=>s.animals.filter(a=>a.speciesId==='elephas-maximus');
function home(){let s=migrateSaveV1(legacy).value;const built=prepareElephantConstruction(s,{x:3,z:11},'habitat-welfare',s.economy.nextCommand);assert.ok(built.ok,JSON.stringify(built));s=built.state;const welcomed=prepareElephantWelcome(s,s.economy.nextCommand);assert.ok(welcomed.ok);return welcomed.state;}
function essentials(fill=true){let s=home();for(const kind of ['elephant-browse','elephant-browse','elephant-water']){const p=prepareElephantCarePlacement(s,{command:s.economy.nextCommand,kind,cell:defaultElephantCareCell(s,kind)});assert.ok(p.ok);s=p.state;}if(fill)for(const r of s.world.resources.filter(r=>r.kind.startsWith('elephant-'))){const f=prepareElephantCareRefill(s,{command:s.economy.nextCommand,id:r.id,revision:r.revision});assert.ok(f.ok);s=f.state;}return s;}

test('welfare derives each weighted cause from real saved needs, walking space and accessible stocked care without mutating the source',()=>{
 const s=essentials(),a=herd(s)[0],before=serializeSaveV2(s),parts=elephantWelfareParts(s,a);assert.equal(parts.foodAccess,true);assert.equal(parts.waterAccess,true);assert.equal(parts.food,100-a.hunger);assert.equal(parts.water,100-a.thirst);assert.ok(parts.space>0&&parts.space<100);assert.equal(parts.welfare,Math.round(parts.food*W.food+parts.water*W.water+parts.space*W.space+a.shadeRest*W.shade+a.enrichment*W.enrichment+a.socialComfort*W.social));assert.equal(serializeSaveV2(s),before);
 const originalBirds=structuredClone(s.animals.filter(a=>a.speciesId!=='elephas-maximus'));a.hunger=70;a.thirst=90;reconcileElephantWelfare(s);assert.equal(a.care.hungry,true);assert.equal(a.care.thirsty,true);assert.equal(a.care.low,true);assert.equal(a.habitatFit,parts.space);assert.ok(a.welfare<parts.welfare);assert.deepEqual(s.animals.filter(a=>a.speciesId!=='elephas-maximus'),originalBirds);
});

test('refilling dry care restores access but never fakes consumed portions, instant need relief or money',()=>{
 const s=essentials(false),a=herd(s)[0],empty=elephantWelfareParts(s,a);assert.equal(empty.foodAccess,false);assert.equal(empty.waterAccess,false);assert.equal(empty.food,0);assert.equal(empty.water,0);const sim=createSimulation(s),initial=sim.snapshot();for(const r of sim.elephantCareSnapshot().resources)assert.ok(sim.refillElephantCare({command:sim.commandRevision(),id:r.id,revision:r.revision}).ok);const filled=sim.snapshot();assert.equal(filled.currency,initial.currency-20);for(let i=0;i<2;i++){const after=herd(filled)[i],before=herd(initial)[i];assert.equal(after.hunger,before.hunger);assert.equal(after.thirst,before.thirst);assert.equal(after.foodEaten,0);assert.equal(after.waterDrunk,0);assert.ok(after.welfare>before.welfare);}sim.dispose();
});

test('stored out-of-reach approaches cannot masquerade as accessible food/water and emptying water has a causal welfare penalty',()=>{
 const s=essentials(),a=herd(s)[0],good=elephantWelfareParts(s,a);for(const r of s.world.resources.filter(r=>r.kind==='elephant-browse'))r.approaches=[{x:5.5,z:15.5}];let parts=elephantWelfareParts(s,a);assert.equal(parts.foodAccess,false);assert.ok(parts.welfare<good.welfare);const water=s.world.resources.find(r=>r.kind==='elephant-water');water.stock=0;const dry=elephantWelfareParts(s,a);assert.equal(dry.waterAccess,false);assert.equal(parts.welfare-dry.welfare,Math.round(parts.water*W.water));
});

test('critical hunger and thirst recover through actual completed meals and drinks, with bounded continuous motion',()=>{
 const s=essentials();for(const a of herd(s)){a.hunger=100;a.thirst=100;}reconcileElephantWelfare(s);const sim=createSimulation(s);sim.visitors(false);let food=0,water=0;sim.subscribe(e=>{if(e.type==='animal-fed'&&e.animalId.startsWith('elephant-'))food++;if(e.type==='animal-drank'&&e.animalId.startsWith('elephant-'))water++;});for(let i=0;i<1200;i++){const before=herd(sim.snapshot());sim.advance(100);const after=herd(sim.snapshot()),h=sim.worldSnapshot().habitats.find(h=>h.kind==='elephant-grove');for(let j=0;j<2;j++){assert.ok(groundDistance(before[j].position,after[j].position)<=G.speed+1e-8);assert.ok(groundPointAllowed(sim.worldSnapshot(),h,after[j].position));assert.ok(after[j].hunger<=100&&after[j].thirst<=100);}assert.ok(groundDistance(after[0].position,after[1].position)>=G.separation-1e-8);}
 const final=sim.snapshot();assert.ok(herd(final).every(a=>a.foodEaten>0&&a.waterDrunk>0&&a.hunger<80&&a.thirst<80));assert.equal(food,herd(final).reduce((n,a)=>n+a.foodEaten,0));assert.equal(water,herd(final).reduce((n,a)=>n+a.waterDrunk,0));assert.equal(validateSaveV2(final).ok,true);sim.dispose();
});

test('a dry habitat stays truthful while both needs reach their cap, then real refill recovers both residents after cold Continue',()=>{
 const sim=createSimulation(essentials(false));sim.visitors(false);sim.setSpeed(10);for(let i=0;i<Math.ceil(80/N.hungerPerTick)+1;i++)sim.advance(10);const dry=sim.snapshot();assert.ok(herd(dry).every(a=>a.hunger===100&&a.thirst===100&&a.foodEaten===0&&a.waterDrunk===0&&a.care.low));assert.equal(dry.world.resources.filter(r=>r.kind.startsWith('elephant-')).reduce((n,r)=>n+r.stock,0),0);const parsed=parseSaveV2(serializeSaveV2(dry));assert.ok(parsed.ok);const cold=createSimulation(parsed.value);for(const r of cold.elephantCareSnapshot().resources)assert.ok(cold.refillElephantCare({command:cold.commandRevision(),id:r.id,revision:r.revision}).ok);for(let i=0;i<1200;i++)cold.advance(10);const final=cold.snapshot();assert.ok(herd(final).every(a=>a.foodEaten>0&&a.waterDrunk>0));assert.ok(herd(final).every(a=>a.hunger<80&&a.thirst<80));assert.equal(final.currency,dry.currency-20-8);assert.equal(final.missions.completedIds.join(','),'Q01,Q02,Q03,Q04');assert.equal(validateSaveV2(final).ok,true);sim.dispose();cold.dispose();
});
