import {elephantCareInfo} from '../src/game/animals/elephants/care-info.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {presentMacawHud} from '../src/game-entry/hud-layout.ts';
import {welfareSummary} from '../src/game-entry/hud-summary.ts';
import {entryMessages} from '../src/game-entry/locale.ts';
import {elephantCareCopy,elephantBehaviorLabel} from '../src/game-entry/elephant-care-panel.ts';
import {elephantCatalogCopy} from '../src/game-entry/elephant-catalog.ts';
import {presentSelection} from '../src/game-entry/selection-presentation.ts';
import {presentElephantRecovery} from '../src/game-entry/elephant-recovery-panel.ts';
import {presentElephantCareInfo} from '../src/game-entry/elephant-care-info.ts';
import {twoHabitatSimulation,ELEPHANT_CONNECTOR} from './fixtures/elephant-two-habitats.mjs';
import {migrateSaveV1,serializeSaveV2} from '../src/game/persistence/save-v2.ts';
import {validateSpeciesHabitatPlacement} from '../src/game/world/species-habitat.ts';
const literals=(file,type)=>{const source=ts.createSourceFile(file,readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true),node=source.statements.find(n=>ts.isTypeAliasDeclaration(n)&&n.name.text===type);assert.ok(node,type);return node.type.types.map(t=>t.literal.text);};
const complete=s=>{assert.ok(typeof s==='string'&&s.length>2);assert.doesNotMatch(s,/undefined|\{[a-zA-Z]+\}/);};
test('shared-zoo HUD keeps actual macaw math while visible and accessible labels scope its welfare and completed Qmissions honestly',()=>{
 const sim=twoHabitatSimulation(),s=sim.snapshot(),bytes=serializeSaveV2(s),view=sim.birdsView(),w=welfareSummary(view.placed,view.birds);for(const locale of ['en','id']){const labels=presentMacawHud(w,null,locale);assert.equal(labels.mission,'✓');assert.match(labels.welfare,/Macaws|Makaw/);assert.match(labels.missionLabel,/macaw|makaw/);assert.match(labels.welfareLabel,/Care|Rawat/);assert.ok(labels.welfare.includes(String(w)));assert.match(presentMacawHud(w,'Q04',locale).missionLabel,/Q04/);assert.match(presentMacawHud(null,'Q01',locale).welfare,/macaw|makaw/);complete(entryMessages[locale].previewElephantCanvas);assert.match(entryMessages[locale].previewElephantCanvas,/Ayu.*Nara/);}assert.equal(serializeSaveV2(s),bytes);sim.dispose();
});
test('every authoritative elephant care failure and every real FSM behavior has complete paired critical copy, including urgent backing and completion-only relief',()=>{
 const reasons=literals('game/animals/elephants/care-resources.ts','ElephantCareReason'),behaviors=literals('game/core/species.ts','ElephantBehavior');for(const locale of ['en','id']){for(const reason of reasons)complete(elephantCareCopy[locale][reason]);for(const behavior of behaviors){const label=elephantBehaviorLabel(behavior,false,locale);complete(label);assert.notEqual(label,elephantCareCopy[locale].other);}assert.notEqual(elephantBehaviorLabel('eat',true,locale),elephantBehaviorLabel('eat',false,locale));assert.match(elephantCareCopy[locale].legend,/0%.*100%/);}assert.equal(reasons.length,12);assert.equal(behaviors.length,15);
});
test('actual resident and facility selections stay named and translated through all FSM states without advancing needs, stock, cash or quest progress',()=>{
 const sim=twoHabitatSimulation({pond:true,enrichment:true}),s=sim.snapshot(),bytes=serializeSaveV2(s),care=sim.elephantCareSnapshot(),herd=sim.elephantSnapshot().animals;assert.equal(herd.length,2);for(const locale of ['en','id']){for(const a of herd){for(const behavior of literals('game/core/species.ts','ElephantBehavior')){const selected=presentSelection({kind:'elephant',cell:{x:3,z:11},ordinal:1,residentName:a.name,residentNeeds:{hunger:a.hunger,thirst:a.thirst,welfare:a.welfare,behavior,backing:false}},locale);assert.equal(selected.title,a.name);for(const v of Object.values(selected))complete(v);assert.match(selected.detail,locale==='id'?/Gajah Asia|gajah Asia/:/Asian elephant/);}}for(const [i,r]of care.resources.entries()){const selected=presentSelection({kind:'elephant-facility',cell:r.cell,ordinal:i+1,facilityKind:r.kind,stock:r.stock,capacity:r.capacity},locale);for(const v of Object.values(selected))complete(v);assert.doesNotMatch(selected.title,/elephant-/);}for(const a of sim.elephantSnapshot().animals){const info=presentElephantCareInfo(elephantCareInfo(s,a),a.name,locale);Object.values(info).flat().forEach(complete);}}assert.equal(serializeSaveV2(sim.snapshot()),bytes);sim.dispose();
});
test('a real one-gap route has singular English and complete IDquotes; row11matches the actual zero-based southern placement boundary',()=>{
 const sim=twoHabitatSimulation(),q=sim.quoteRemoval({kind:'path',cell:ELEPHANT_CONNECTOR[0]});assert.ok(q.ok);assert.ok(sim.remove(q.quote,'edit-00000000000000000000000000000502').ok);const help=sim.elephantRecoveryView(),bytes=serializeSaveV2(sim.snapshot());assert.equal(help.kind,'path');assert.equal(help.path.missing,1);assert.match(presentElephantRecovery(help,'en').body,/1 tile,/);assert.doesNotMatch(presentElephantRecovery(help,'en').body,/1 tiles/);assert.match(presentElephantRecovery(help,'id').body,/1 petak/);assert.equal(serializeSaveV2(sim.snapshot()),bytes);sim.dispose();const source=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state,expanded=migrateSaveV1(source).value;assert.equal(validateSpeciesHabitatPlacement(expanded.world,{x:3,z:10},'elephant-grove').reason,'ready');assert.match(elephantCatalogCopy.en.zone,/row 11/);assert.match(elephantCatalogCopy.id.zone,/baris 11/);
});
