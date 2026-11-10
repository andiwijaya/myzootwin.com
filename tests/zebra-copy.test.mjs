import{formatNumber}from'../src/game-entry/i18n-format.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {zebraConstructionCopy} from '../src/game-entry/zebra-copy.ts';
import {zebraAccessCopy} from '../src/game-entry/zebra-access-panel.ts';
import {zebraCareCopy,zebraCareReason,zebraResourceLabel} from '../src/game-entry/zebra-care-panel.ts';
import {zebraEditCopy} from '../src/game-entry/zebra-edit-copy.ts';
import {zebraMissionCopy} from '../src/game-entry/zebra-mission-panel.ts';
import {zebraWelfareCopy,zebraWelfareLines} from '../src/game-entry/zebra-welfare-copy.ts';
import {zebraRecoveryCopy,presentZebraRecovery} from '../src/game-entry/zebra-recovery-panel.ts';
import {zebraGuideCopy,presentZebraGuide} from '../src/game-entry/zebra-guide.ts';
import {zebraBehaviorLabel,zebraResidentLabel,zebraElapsed} from '../src/game-entry/zebra-behavior-copy.ts';
import {ZEBRA_BEHAVIORS,ZEBRA_RESIDENTS,ZEBRA_RESOURCE_KINDS} from '../src/game/core/zebra-state.ts';
import {ZEBRA_MISSION_RULES,ZEBRA_PRICES} from '../src/game/animals/zebras/rules.ts';
import {TICK_MS} from '../src/game/core/state.ts';import {PRICES} from '../src/game/economy/prices.ts';
import {createSimulation} from '../src/game/core/simulation.ts';import {zebraCodecFixture} from './helpers/zebra-v5-fixture.mjs';
import {chooseGameLocale} from '../src/game-entry/i18n-format.ts';import {readEntryLocale,saveEntryLocale} from '../src/game-entry/locale.ts';
const dictionaries=[zebraConstructionCopy,zebraAccessCopy,zebraCareCopy,zebraEditCopy,zebraMissionCopy,zebraWelfareCopy,zebraRecoveryCopy,zebraGuideCopy];
const shape=(x,p='')=>typeof x==='string'?[p]:Object.entries(x).flatMap(([k,v])=>shape(v,p+'.'+k)).sort();
const leaves=x=>typeof x==='string'?[x]:Object.values(x).flatMap(leaves);

test('all eight Zebra dictionaries cover identical ID/EN fields, with no blank leaves or untranslated internal care terms',()=>{
 for(const d of dictionaries){assert.deepEqual(shape(d.id),shape(d.en));for(const c of [d.id,d.en])for(const text of leaves(c)){assert.ok(text.trim());assert.ok(!/undefined|\[object Object\]/.test(text));}assert.ok(!/\bticks?\b|\btrot\b|\bgrant\b|\brefund\b|menu Satwa/i.test(leaves(d.id).map(s=>s.replace(/\{\w+\}/g,'')).join(' ')));}
});

test('all14 actual Zebra behaviors, four identities and facility kinds have readable localized presentation without stable-ID leakage',()=>{
 for(const locale of ['id','en']){for(const phase of ZEBRA_BEHAVIORS){const value=zebraBehaviorLabel(phase,locale);assert.ok(value?.length>2);assert.ok(!value.includes('seek-'));}for(const a of ZEBRA_RESIDENTS)assert.equal(zebraResidentLabel(a.id,locale),a.name);for(const kind of ZEBRA_RESOURCE_KINDS){assert.ok(zebraResourceLabel(kind,locale));assert.ok(!zebraResourceLabel(kind,locale).includes('zebra-'));}assert.ok(!zebraResidentLabel('invalid-internal-id',locale).includes('invalid-internal-id'));}
 assert.notEqual(zebraBehaviorLabel('groom','id'),zebraBehaviorLabel('groom','en'));assert.notEqual(zebraBehaviorLabel('trot','id'),zebraBehaviorLabel('trot','en'));
});

test('care help uses the real Build/Care/Missions/Guests flow, GQ04-gated source grant, canonical prices and fixed-time mission thresholds',()=>{
 for(const locale of ['id','en']){const c=presentZebraGuide(locale),text=c.steps.join(' ');assert.equal(c.steps.length,7);assert.ok(!/\{\w+\}|undefined/.test(text));for(const amount of [PRICES.path,ZEBRA_PRICES['zebra-graze'],ZEBRA_PRICES['zebra-water'],ZEBRA_PRICES['zebra-shade'],ZEBRA_PRICES['zebra-enrichment'],ZEBRA_PRICES.foodRefill,ZEBRA_PRICES.waterRefill,ZEBRA_PRICES.enrichmentRefill])assert.ok(text.includes(amount+' ZC'));assert.ok(text.includes(String(ZEBRA_MISSION_RULES.comfortableTicks*TICK_MS/1000)));assert.ok(text.includes(String(ZEBRA_MISSION_RULES.thrivingTicks*TICK_MS/1000)));assert.ok(text.includes(formatNumber(ZEBRA_PRICES.grant,locale)+' ZC'));assert.ok(text.includes(formatNumber(ZEBRA_PRICES.habitat,locale)+' ZC'));assert.ok(text.includes('GQ04'));assert.ok(text.includes('ZQ01–ZQ04'));assert.ok(text.includes('Zaki')&&text.includes('Kira'));}
 assert.match(zebraWelfareCopy.id.company,/Bangun/);assert.match(zebraWelfareCopy.en.company,/Build/);assert.match(presentZebraGuide('id').notice,/bukan panduan/);assert.match(presentZebraGuide('en').notice,/not instructions/);
});

test('displayed active seconds retain exact canonical thresholds and decimal locale without changing persisted counters',()=>{
 assert.equal(zebraElapsed(49,'id'),'4,9 dtk');assert.equal(zebraElapsed(49,'en'),'4.9 s');assert.equal(zebraElapsed(50,'id'),'5 dtk');assert.equal(zebraElapsed(100,'en'),'10 s');assert.equal(zebraElapsed(320,'id'),'32 dtk');
 for(const locale of ['id','en']){assert.match(zebraMissionCopy[locale].hints[1],/5/);assert.match(zebraMissionCopy[locale].hints[3],/10/);assert.ok(!/tick/i.test(zebraMissionCopy[locale].hints.join(' ')));}
});

test('copy and remedy views are read-only for a valid populated V5 save and cover every care failure and access status in both languages',()=>{
 const sim=createSimulation(zebraCodecFixture()),before=sim.snapshot(),view=sim.zebraCareView();
 for(const locale of ['id','en']){for(const reason of ['locked','habitat','limit','outside','occupied','busy','space','funds','stale','capacity','duplicate','missing','full','storage','ready','zebra-using','zebra-space','protected','command','unknown'])assert.ok(!/undefined|\{\w+\}/.test(zebraCareReason(reason,locale)));for(const kind of ['build','refill','unreachable','waiting','refund','funds','support','path','space','gate']){const text=presentZebraRecovery({...view.recovery,kind,animal:'Mira',resourceKind:'zebra-water',cost:6,balance:0,refund:65,missingPaths:4,totalPathCost:60},locale);assert.ok(text.body&&text.action);assert.ok(!/undefined|\{\w+\}/.test(text.body));}for(const resident of view.residents)for(const access of ['ready','missing','unreachable','empty']){const p={...resident.welfare,food:access,water:access,shade:access,company:false};assert.equal(zebraWelfareLines(p,locale).length,7);assert.ok(zebraWelfareLines(p,locale).every(s=>!s.includes('undefined')));}presentZebraGuide(locale);}
 assert.deepEqual(sim.snapshot(),before);sim.dispose();
});

test('default ID never overwrites an explicit EN preference or EN durable save; the locale namespace persists a deliberate switch only',()=>{
 let value=null,writes=0;const store={getItem:()=>value,setItem:(_key,next)=>{value=next;writes++;}};
 const initial=readEntryLocale(store,'en-US');assert.equal(initial.locale,'id');assert.equal(writes,0);assert.equal(chooseGameLocale(initial.locale,false,'en'),'en');assert.equal(chooseGameLocale('id',true,'en'),'id');assert.equal(saveEntryLocale(store,'en'),true);assert.equal(writes,1);assert.equal(readEntryLocale(store,'id-ID').locale,'en');assert.equal(writes,1);value='{broken';assert.equal(readEntryLocale(store,'en-US').locale,'id');assert.equal(writes,1);
});
