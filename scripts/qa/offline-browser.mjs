import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';
import { build } from 'vite';
import { withIpcPreview } from './ipc-preview.mjs';
import { childPath, fixtureIdentityMatches, json, now } from './tooling.mjs';

const productOrigin = 'http://127.0.0.1:4321';
const fixtureOrigin = 'http://127.0.0.1:4322';
const fixturePath = '/tests/browser/.generated/preview-harness.html';
const stage = '[data-preview-stage]';
const map = '[data-map-control]';
const entry = '[data-play-entry]';
const cssTypes = new Map([['.html', 'text/html'], ['.js', 'text/javascript'], ['.css', 'text/css']]);

async function attachPreview(context, request, fixtureDirectory) {
  await context.route(/^https?:\/\//, async route => {
    const url = new URL(route.request().url());
    if (url.origin !== productOrigin && url.origin !== fixtureOrigin) {
      return route.abort();
    }
    const path = url.pathname;
    if (url.origin === fixtureOrigin && (path === fixturePath || path.startsWith('/assets/'))) {
      const file = childPath(fixtureDirectory, '.' + decodeURIComponent(path));
      return route.fulfill({ body: await readFile(file), contentType: cssTypes.get(extname(file)) });
    }
    const reply = await request(path.startsWith('/dist/') ? path.slice(5) : path);
    const isGlb = path.endsWith('.glb.br') && reply.ok;
    await route.fulfill({
      status: reply.status,
      body: isGlb ? brotliDecompressSync(reply.body) : reply.body,
      contentType: isGlb ? 'model/gltf-binary' : reply.headers['content-type'],
      headers: reply.headers.location ? { location: reply.headers.location } : undefined,
    });
  });
}

const ready = page => page.locator(stage + '[data-landscape-ready="true"] canvas').waitFor();
const checkpoint = page => page.evaluate(() => {
  const root = document.querySelector('[data-play-entry]');
  const save = document.querySelector('[data-save-panel]');
  return { paused: root.dataset.sessionPaused === 'true', tick: Number(save.dataset.savedTick),
    revision: Number(save.dataset.savedRevision), currency: Number(save.dataset.savedCurrency) };
});

async function productViewport(page, width, height, id, directory) {
  await page.setViewportSize({ width, height });
  await page.goto(productOrigin + '/play/');
  await ready(page);
  if (id.endsWith('-id')) {
    const summary = page.locator('[data-hud-options] > summary');
    const language = page.locator('[data-guide-language]');
    await summary.click();
    await language.selectOption('en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await language.selectOption('id');
    await summary.press('Escape');
  }
  const screenshot = `screens/${id}.jpg`;
  await page.screenshot({ path: childPath(directory, screenshot), type: 'jpeg', quality: 85 });
  const data = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
    state: document.querySelector('[data-renderer-panel]').dataset.rendererState,
    canvas: document.querySelectorAll('[data-preview-stage] canvas').length,
    lang: document.documentElement.lang,
    entryScript: new URL([...document.scripts].find(script => script.src.includes('PlayEntry')).src).pathname,
  }));
  assert.equal(data.width, width);
  assert.equal(data.height, height);
  assert.ok(data.documentWidth <= width);
  assert.equal(data.state, 'ready');
  assert.equal(data.canvas, 1);
  if (id.endsWith('-id')) assert.equal(data.lang, 'id');
  return { screenshot, data: { ...data, visualReviewed: false } };
}

async function navigationReload(page) {
  await page.goto(productOrigin + '/play/');
  await ready(page);
  await page.locator(map).press('Enter');
  await page.locator(entry + '[data-session-paused="false"]').waitFor();
  await page.locator(map).click();
  await page.locator('[data-save-panel][data-save-phase="saved"]').waitFor();
  const before = await checkpoint(page);
  assert.ok(before.paused && Number.isSafeInteger(before.revision));
  await page.locator('.zoo-play-brand').click();
  await page.locator('a[href="/animals/"]:visible').first().click();
  const journalPath = new URL(page.url()).pathname;
  assert.equal(journalPath, '/animals/');
  await page.goBack();
  await page.goBack();
  await ready(page);
  const returnPath = new URL(page.url()).pathname;
  const returnCanvas = await page.locator(stage + ' canvas').count();
  const afterBack = await checkpoint(page);
  await page.reload();
  await ready(page);
  const reloadCanvas = await page.locator(stage + ' canvas').count();
  const afterReload = await checkpoint(page);
  assert.equal(returnPath, '/play/');
  assert.deepEqual(afterBack, before);
  assert.deepEqual(afterReload, before);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  return { data: { journalPath, returnPath, returnCanvas, reloadCanvas, canonical, checkpoints: [before, afterBack, afterReload] } };
}

const diagnostics = page => page.locator('#qa-diagnostics').textContent().then(JSON.parse);
const waitDiagnostics = (page, check, arg) => page.waitForFunction(check, arg, { polling: 125 });
async function openFixture(page) {
  await page.goto(fixtureOrigin + fixturePath);
  await page.locator('[data-preview-open]').click();
  await waitDiagnostics(page, () => {
    const d = JSON.parse(document.querySelector('#qa-diagnostics').textContent);
    return d.state.status === 'ready' && d.session?.simulationTick > d.session?.simulationStartTick;
  });
}

async function lifecycle(page) {
  await openFixture(page);
  const samples = [];
  const record = async name => { const sample = { ...await diagnostics(page), name }; samples.push(sample); return sample; };
  await record('ready');
  await page.locator('#qa-pause').click();
  const paused = await record('paused');
  await page.locator('#qa-id').click();
  await page.locator('#qa-en').click();
  await record('still-paused');
  await page.locator('#qa-resume').click();
  await waitDiagnostics(page, tick => JSON.parse(document.querySelector('#qa-diagnostics').textContent).session?.simulationTick > tick, paused.session.simulationTick);
  await record('resumed');
  await page.locator('#qa-unmount').click();
  await record('closed');
  return { data: {
    harnessRunId: await page.locator('#qa-run-id').textContent(),
    harnessBuildId: await page.locator('#qa-build-id').textContent(),
    harnessSourceId: await page.locator('#qa-source-id').textContent(),
    samples,
  }};
}

async function contextRetry(page) {
  await openFixture(page);
  await page.locator('#qa-context').click();
  await waitDiagnostics(page, () => JSON.parse(document.querySelector('#qa-diagnostics').textContent).canvasCount === 0);
  const failed = await diagnostics(page);
  assert.equal(failed.faultSource, 'injected WEBGL_lose_context');
  await page.locator('[data-preview-retry]').click();
  await ready(page);
  const retry = await diagnostics(page);
  return { data: {
    source: 'WEBGL_lose_context', failedState: failed.state.status, failedReason: failed.state.reason,
    failedCanvas: failed.canvasCount, failedSubscribers: failed.lastDisposed.simulationSubscribers,
    retryState: retry.state.status, retryCanvas: retry.canvasCount,
  }};
}

export async function runOfflineBrowser(root, directory, report) {
  const harness = childPath(root, '.' + fixturePath);
  assert.ok(fixtureIdentityMatches(await readFile(harness, 'utf8'), report), 'Fixture identity does not match this run');
  const fixtureDirectory = childPath(directory, 'fixture-build');
  await build({ root, configFile: false, publicDir: false,
    build: { outDir: fixtureDirectory, emptyOutDir: false, rollupOptions: { input: harness } } });
  await mkdir(childPath(directory, 'screens'), { recursive: true });
  const receipt = JSON.parse(await readFile(childPath(directory, 'browser-template.json'), 'utf8'));
  const path = process.env.MYZOO_QA_PLAYWRIGHT_MODULE;
  const { chromium } = await import(path ? pathToFileURL(path).href : 'playwright');
  const executablePath = process.env.MYZOO_QA_CHROME;
  const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  receipt.startedAt = now();
  let failure;
  try {
    await withIpcPreview(root, async request => {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
      await attachPreview(context, request, fixtureDirectory);
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      const log = entry => {
        if (receipt.console.entries.length < receipt.console.limit) receipt.console.entries.push(entry);
        receipt.console.capped = receipt.console.entries.length >= receipt.console.limit;
      };
      page.on('pageerror', error => { if (page.url().startsWith(productOrigin)) log(error.message); });
      page.on('console', message => {
        const url = message.location().url;
        if (page.url().startsWith(productOrigin) && ['error', 'warning'].includes(message.type()) &&
            (!url || url.startsWith(productOrigin))) log(message.text());
      });
      const cases = [
        ['desktop-native', () => productViewport(page, 1366, 768, 'desktop-native', directory)],
        ['portrait-native-id', () => productViewport(page, 360, 780, 'portrait-native-id', directory)],
        ['landscape-native-id', () => productViewport(page, 780, 360, 'landscape-native-id', directory)],
        ['navigation-reload', () => navigationReload(page)],
        ['native-lifecycle', () => lifecycle(page)],
        ['injected-failure-retry', () => contextRetry(page)],
      ];
      for (const [id, execute] of cases) {
        const row = receipt.cases.find(entry => entry.id === id);
        try {
          Object.assign(row, await execute(), { status: 'PASS', observedAt: now() });
          console.log(`${id} passed browser actions`);
        } catch (error) {
          Object.assign(row, { status: 'FAIL', observedAt: now(), data: { error: error.message } });
          throw error;
        }
      }
      await page.setViewportSize({ width: 1366, height: 768 });
      receipt.viewportReset = true;
      await context.close();
      receipt.ownedTabsClosed = true;
    });
  } catch (error) {
    failure = error;
  } finally {
    await browser.close();
    receipt.finishedAt = now();
    await json(childPath(directory, 'browser-receipt.json'), receipt);
  }
  if (failure) throw failure;
  if (receipt.console.entries.length) throw Error('Native product browser reported warnings or errors');
  console.log('Review the three actual screenshots and record visualReviewed before qa:verify.');
}
