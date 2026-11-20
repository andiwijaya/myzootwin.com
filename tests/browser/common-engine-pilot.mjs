import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { serializeSave } from '../../src/game/persistence/save-v1.ts';

const [address, playwrightEntry] = process.argv.slice(2);
const origin = new URL(address);
assert.equal(origin.protocol, 'http:');
assert.equal(origin.hostname, '127.0.0.1');
const { chromium } = await import(pathToFileURL(playwrightEntry).href);
const fixture = new URL('../fixtures/elephant-legacy-v1.json', import.meta.url);
const { state: legacy } = JSON.parse(readFileSync(fixture, 'utf8')).entries.midQ02;
const oldRecord = { format: 1, revision: 1, writtenAt: 1, writer: 'myzoo-qa-v1', payload: serializeSave(legacy) };
const root = '[data-play-entry]';
const stage = '[data-preview-stage]';
const save = '[data-save-panel]';
const timeout = 35_000;
const browser = await chromium.launch({
  executablePath: process.env.MYZOO_QA_CHROME || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

function attribute(page, selector, key, value) {
  return page.waitForFunction(({ selector, key, value }) => document.querySelector(selector)?.getAttribute(key) === value,
    { selector, key, value }, { timeout });
}

function checkpoint(page, name, key) {
  return page.evaluate(({ name, key }) => new Promise((resolve, reject) => {
    const connection = indexedDB.open(name);
    connection.onupgradeneeded = () => connection.transaction.abort();
    connection.onerror = () => reject(connection.error);
    connection.onsuccess = () => {
      const database = connection.result;
      const transaction = database.transaction('checkpoints', 'readonly');
      const read = transaction.objectStore('checkpoints').get(key);
      transaction.oncomplete = () => { database.close(); resolve(read.result); };
      transaction.onabort = transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }), { name, key });
}

async function runPilot(name, viewport, touch) {
  const context = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch, locale: 'en-US', reducedMotion: 'reduce' });
  const databaseName = 'myzootwin-qa-common-engine-v03-' + name;
  const route = new URL('/play/?qa-session=' + name, origin).href;
  const page = await context.newPage();
  page.setDefaultTimeout(timeout);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  async function press(selector) {
    const button = page.locator(selector);
    if (touch) await button.tap();
    else await button.click();
  }

  try {
    await page.goto(new URL('/robots.txt', origin).href, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ databaseName, oldRecord }) => new Promise((resolve, reject) => {
      const connection = indexedDB.open(databaseName, 1);
      connection.onupgradeneeded = () => connection.result.createObjectStore('checkpoints').put(oldRecord, 'primary');
      connection.onerror = () => reject(connection.error);
      connection.onsuccess = () => { connection.result.close(); resolve(); };
    }), { databaseName, oldRecord });

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await attribute(page, save, 'data-save-phase', 'available');
    await press('[data-hud-save-details] > summary');
    await press('[data-save-recovery-review]');
    await press('[data-save-recovery-confirm]');
    await press('[data-continue]');
    await page.locator(stage + ' canvas').waitFor();
    await attribute(page, stage, 'data-common-engine-pilot', '0.3.0');
    await attribute(page, stage, 'data-placed-birds', '2');
    await attribute(page, stage, 'data-water-stock', '6');
    await page.locator('[data-save-resume-button]').waitFor();
    await attribute(page, save, 'data-save-phase', 'saved');
    assert.deepEqual(await checkpoint(page, databaseName, 'elephant-v1-backup'), oldRecord);
    const migrated = JSON.parse((await checkpoint(page, databaseName, 'primary')).payload);
    assert.equal(migrated.schemaVersion, 5);
    assert.equal(migrated.tick, legacy.tick);

    await press('[data-save-resume-button]');
    await attribute(page, root, 'data-session-paused', 'false');
    await press('[data-zoo-destination="macaw-aviary"]');
    await press('[data-hud-tab="care"]');
    await press('[data-water-command="refill"]');
    await attribute(page, stage, 'data-water-stock', '8');
    const lastSavedTick = Number(await page.locator(save).getAttribute('data-saved-tick'));
    await page.waitForFunction(({ save, lastSavedTick }) =>
      Number(document.querySelector(save)?.getAttribute('data-saved-tick')) > lastSavedTick + 3,
      { save, lastSavedTick }, { timeout });
    await press('[data-pause-toggle]');
    await attribute(page, root, 'data-session-paused', 'true');
    await attribute(page, save, 'data-save-phase', 'saved');

    const saved = await checkpoint(page, databaseName, 'primary');
    const state = JSON.parse(saved.payload);
    const water = state.world.resources.find(({ kind }) => kind === 'water');
    const priorOperations = new Set(migrated.ledger.map(({ operationId }) => operationId));
    const refills = state.ledger.filter(({ kind, relatedId, operationId }) =>
      kind === 'supplies' && relatedId === water.id && !priorOperations.has(operationId));
    assert.equal(refills.length, 1);
    assert.equal(refills[0].operationId, `cmd-${migrated.economy.nextCommand}`);
    assert.ok(refills[0].amount < 0);
    assert.equal(state.economy.nextCommand, migrated.economy.nextCommand + 1);
    assert.ok(state.tick > refills[0].tick);
    assert.ok(water.stock > 6);
    assert.deepEqual(await checkpoint(page, databaseName, 'elephant-v1-backup'), oldRecord);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await attribute(page, save, 'data-save-phase', 'available');
    await press('[data-continue]');
    await page.locator('[data-save-resume-button]').waitFor();
    await attribute(page, stage, 'data-common-engine-pilot', '0.3.0');
    await attribute(page, stage, 'data-water-stock', String(water.stock));
    await attribute(page, stage, 'data-placed-birds', '2');
    await attribute(page, save, 'data-save-phase', 'saved');
    assert.equal((await checkpoint(page, databaseName, 'primary')).payload, saved.payload);
    assert.deepEqual(await page.evaluate(async () => (await indexedDB.databases()).map(({ name }) => name)), [databaseName]);
    assert.deepEqual(errors, []);
    const display = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, touch: navigator.maxTouchPoints > 0 }));
    assert.equal(display.width, viewport.width);
    assert.equal(display.height, viewport.height);
    assert.equal(display.touch, touch);
    assert.ok(display.scrollWidth <= display.width);
    console.log(JSON.stringify({ profile: name, ...display, engine: '0.3.0', database: databaseName, saveVersion: '1 → 5',
      tick: [legacy.tick, state.tick], refillTick: refills[0].tick, water: [6, water.stock], careCommands: 1, saveRevision: saved.revision, reopened: true, v1BackupIdentical: true }));
  } catch (error) {
    const diagnostics = await page.evaluate(({ root, stage, save }) => ({
      entry: { ...document.querySelector(root)?.dataset }, stage: { ...document.querySelector(stage)?.dataset },
      save: { ...document.querySelector(save)?.dataset },
      refill: document.querySelector('[data-water-command="refill"]')?.getBoundingClientRect().toJSON(),
      pause: document.querySelector('[data-pause-toggle]')?.getBoundingClientRect().toJSON(),
    }), { root, stage, save }).catch(() => ({}));
    console.error(name, JSON.stringify({ ...diagnostics, errors }));
    throw error;
  } finally {
    await context.close();
  }
}

try {
  await runPilot('desktop-qa', { width: 1366, height: 900 }, false);
  await runPilot('mobile-qa', { width: 390, height: 844 }, true);
} finally {
  await browser.close();
}
