import test from 'node:test';
import assert from 'node:assert/strict';
import {elephantHome,elephantHerd,elephantProps} from './fixtures/elephant-home.mjs';
import {elephantCareInfo} from '../src/game/animals/elephants/care-info.ts';
import {elephantWelfareParts} from '../src/game/animals/elephants/welfare.ts';
import {elephantCareView,prepareElephantCareRefill} from '../src/game/animals/elephants/care-resources.ts';
import {serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {presentElephantCareInfo} from '../src/game-entry/elephant-care-info.ts';
import {elephantBehaviorLabel} from '../src/game-entry/elephant-care-panel.ts';
import {createElephantResidentsScene} from '../src/game/render3d/elephant-residents-scene.ts';
import {presentSelection} from '../src/game-entry/selection-presentation.ts';
const catalog=()=>({identities:new Map(),bounds:new Map(),batches:[]});

test('explanation derives actual species scores/access without trusting forged welfare/care display fields or mutating the save',()=>{
 const s=elephantHome({pond:true,enrichment:true}),a=elephantHerd(s)[0];a.welfare=100;a.care={low:false,hungry:false,thirsty:false,tired:false,bored:false};a.hunger=70;a.thirst=90;const exact=serializeSaveV2(s),info=elephantCareInfo(s,a),parts=elephantWelfareParts(s,a);assert.equal(info.welfare,parts.welfare);assert.notEqual(info.welfare,100);assert.equal(info.scores.food,30);assert.equal(info.scores.water,10);assert.ok(info.notes.includes('hungry')&&info.notes.includes('thirsty'));assert.equal(info.next.kind,'wait-water');assert.equal(elephantCareView(s).residents[0].welfare,parts.welfare);assert.equal(serializeSaveV2(s),exact);
});

test('missing, dry and unreachable supplies give different truthful actions and exact current costs; filling does not claim instant relief',()=>{
 const missing=elephantHome({care:false}),a=elephantHerd(missing)[0];assert.ok(elephantCareInfo(missing,a).notes.includes('food-missing'));assert.equal(elephantCareInfo(missing,a).next.kind,'build-food');assert.equal(elephantCareInfo(missing,a).next.coins,80);
 const dry=elephantHome({filled:false}),b=elephantHerd(dry)[0];b.thirst=85;const before=elephantCareInfo(dry,b);assert.ok(before.notes.includes('water-empty'));assert.equal(before.next.kind,'refill-water');assert.equal(before.next.coins,4);const r=elephantProps(dry).find(r=>r.kind==='elephant-water'),filled=prepareElephantCareRefill(dry,{command:dry.economy.nextCommand,id:r.id,revision:r.revision});assert.ok(filled.ok);const c=elephantHerd(filled.state)[0],after=elephantCareInfo(filled.state,c);assert.equal(c.thirst,85);assert.equal(after.next.kind,'wait-water');assert.ok(after.notes.includes('thirsty')&&!after.notes.includes('water-empty'));const blocked=structuredClone(filled.state);elephantProps(blocked).find(x=>x.id===r.id).approaches=[{x:3.5,z:11.5},{x:8.5,z:16.5}];const info=elephantCareInfo(blocked,elephantHerd(blocked)[0]);assert.ok(info.notes.includes('water-blocked'));assert.equal(info.next.kind,'repair-water');
});

test('shade, dry pond, log cooldown and social needs stay distinct, with a concrete helpful action and honest insufficient funds',()=>{
 const s=elephantHome({pond:true,enrichment:true}),a=elephantHerd(s)[0];a.foodEaten=a.waterDrunk=1;a.hunger=a.thirst=0;let info=elephantCareInfo(s,a);assert.equal(info.next.kind,'wait-shade');assert.ok(info.notes.includes('shade-low'));a.shadeRest=80;a.enrichment=20;a.logCooldownTicks=140;info=elephantCareInfo(s,a);assert.equal(info.next.kind,'wait-log');assert.equal(info.next.seconds,14);assert.ok(info.notes.includes('cooldown'));a.enrichment=70;a.baths=0;elephantProps(s).find(r=>r.kind==='elephant-pond').stock=0;info=elephantCareInfo(s,a);assert.ok(info.notes.includes('pond-dry'));assert.equal(info.next.kind,'refill-pond');assert.equal(info.next.coins,12);a.baths=1;a.enrichment=90;a.socialComfort=30;info=elephantCareInfo(s,a);assert.equal(info.next.kind,'allow-social');assert.ok(info.notes.includes('social-low'));const missing=elephantHome({care:false});missing.currency=1;info=elephantCareInfo(missing,elephantHerd(missing)[0]);assert.equal(info.next.affordable,false);for(const locale of ['id','en']){const copy=presentElephantCareInfo(info,'Ayu',locale);assert.ok(copy.next.includes('80'));assert.ok(copy.next.includes('1'));assert.ok(!copy.next.includes('undefined'));}
});

test('actual tick consumption changes explanations, while cold reload and every ID/EN label preserve the same state and evidence',()=>{
 const sim=createSimulation(elephantHome({pond:true,enrichment:true}));sim.visitors(false);let after;for(let i=0;i<1300;i++){sim.advance(100);after=sim.snapshot();if(elephantHerd(after).every(a=>a.restedTicks>0&&a.enrichedTicks>0&&a.baths>0))break;}assert.ok(elephantHerd(after).every(a=>a.foodEaten>0&&a.waterDrunk>0));const exact=serializeSaveV2(after),cold=parseSaveV2(exact).value;for(const a of elephantHerd(after)){const info=elephantCareInfo(after,a),loaded=elephantCareInfo(cold,elephantHerd(cold).find(b=>b.id===a.id));assert.deepEqual(info,loaded);for(const locale of ['id','en']){const copy=presentElephantCareInfo(info,a.name,locale);assert.ok(copy.inspect.includes(a.name));assert.ok(copy.notes.length>0&&copy.notes.every(Boolean));assert.ok(copy.next.length>10);assert.ok(!JSON.stringify(copy).includes('undefined'));}for(const behavior of ['idle','wander','seek-food','eat','seek-water','drink','seek-bath','bathe','spray','seek-shade','rest','seek-log','enrich','approach-companion','trunk-touch'])for(const locale of ['id','en'])assert.ok(elephantBehaviorLabel(behavior,false,locale).length>0);}assert.equal(serializeSaveV2(after),exact);sim.dispose();
});

test('selected real resident identity reports current rounded needs/behavior in both languages and updates after a later sync',()=>{
 const s=elephantHome(),c=catalog(),scene=createElephantResidentsScene(c);try{scene.sync(elephantHerd(s),12,18,elephantProps(s));let a=c.identities.get('elephant-ayu');assert.match(presentSelection(a,'en').detail,/hunger 20%/);assert.match(presentSelection(a,'id').detail,/lapar 20%/);const next=structuredClone(elephantHerd(s));next[0].hunger=68;next[0].thirst=80;next[0].currentBehavior=next[0].motion.phase='seek-water';scene.sync(next,12,18,elephantProps(s));a=c.identities.get('elephant-ayu');assert.match(presentSelection(a,'en').detail,/hunger 68%/);assert.match(presentSelection(a,'en').detail,/Going to water/);assert.match(presentSelection(a,'id').detail,/Menuju air/);assert.match(presentSelection(a,'en').detail,/inspect Ayu/);}finally{scene.dispose();}
});
