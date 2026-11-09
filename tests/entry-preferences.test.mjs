import test from 'node:test';
import assert from 'node:assert/strict';
import { ENTRY_PREFERENCES_KEY, entryMessages, readEntryLocale, saveEntryLocale } from '../src/game-entry/locale.ts';

test('Indonesian is the product default for every browser language', () => {
  assert.equal(readEntryLocale({ getItem: () => null }, 'id-ID').locale, 'id');
  assert.equal(readEntryLocale({ getItem: () => null }, 'ID').locale, 'id');
  for(const language of ['en-US','ja-JP','fr',''])assert.deepEqual(readEntryLocale({getItem:()=>null},language),{locale:'id',source:'default',storageAvailable:true});
});

test('valid saved choice overrides browser language', () => {
  const result = readEntryLocale({ getItem: () => '{"schemaVersion":1,"locale":"en"}' }, 'id-ID');
  assert.deepEqual(result, { locale: 'en', source: 'saved', storageAvailable: true });
});

test('malformed preferences fall back without deleting or rewriting storage', () => {
  let writes = 0;
  const storage = { getItem: () => '{broken', setItem: () => writes++, removeItem: () => assert.fail('must not erase data') };
  assert.equal(readEntryLocale(storage, 'id').locale, 'id');
  assert.equal(writes, 0);
});

test('unsupported schemas and locales are ignored', () => {
  for (const raw of ['{"schemaVersion":2,"locale":"id"}', '{"schemaVersion":1,"locale":"xx"}', 'null', '[]']) {
    assert.equal(readEntryLocale({ getItem: () => raw }, 'en').locale, 'id');
  }
});

test('blocked storage remains usable for the current visit', () => {
  assert.deepEqual(readEntryLocale({ getItem: () => { throw new Error('blocked'); } }, 'id'), { locale: 'id', source: 'default', storageAvailable: false });
  assert.equal(readEntryLocale(undefined, 'en').storageAvailable, false);
});

test('saving writes only the entry preference namespace and versioned locale', () => {
  const writes = [];
  assert.equal(saveEntryLocale({ setItem: (...args) => writes.push(args) }, 'id'), true);
  assert.deepEqual(writes, [[ENTRY_PREFERENCES_KEY, '{"schemaVersion":1,"locale":"id"}']]);
});

test('unavailable persistence and invalid runtime locale never claim success', () => {
  assert.equal(saveEntryLocale({ setItem: () => { throw new Error('full'); } }, 'en'), false);
  assert.equal(saveEntryLocale(undefined, 'id'), false);
  assert.equal(saveEntryLocale({ setItem: () => assert.fail('invalid locale must not be written') }, 'xx'), false);
});

test('entry dictionaries have complete matching keys and truthful preview copy', () => {
  assert.deepEqual(Object.keys(entryMessages.id).sort(), Object.keys(entryMessages.en).sort());
  for (const copy of Object.values(entryMessages)) {
    assert.ok(Object.values(copy).every(value => typeof value === 'string' && value.length > 0));
    assert.notEqual(copy.preferenceSaved, copy.preferenceTemporary);
    assert.notEqual(copy.play, copy.help);
    assert.notEqual(copy.continue, copy.settings);
  }
});
