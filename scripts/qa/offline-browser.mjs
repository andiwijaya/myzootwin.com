import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';
import { build } from 'vite';
import { withIpcPreview } from './ipc-preview.mjs';
import { ANIMAL_ARTICLE_ROUTES, childPath, fixtureIdentityMatches, json, now } from './tooling.mjs';

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
  const bottom = page.locator('[data-zoo-bottom-toggle]');
  const side = page.locator('[data-zoo-tools-toggle]');
  const panel = page.locator('[data-zoo-bottom-panel]');
  const rail = page.locator('.hud-rail');
  const readMenus = async () => ({
    bottom: await bottom.getAttribute('aria-expanded'),
    side: await side.getAttribute('aria-expanded'),
    bottomVisible: await panel.isVisible(),
    sideVisible: await rail.isVisible(),
  });
  const frame = page.locator('.preview-frame');
  const originalHeight = (await frame.boundingBox()).height;
  assert.equal(await bottom.getAttribute('aria-expanded'), 'true');
  assert.equal(await side.getAttribute('aria-expanded'), 'false');
  assert.equal(await panel.isVisible(), true);
  await bottom.click();
  assert.equal(await bottom.getAttribute('aria-expanded'), 'false');
  assert.equal(await panel.isVisible(), false);
  assert.equal(await page.locator('[data-zoo-navigation]').isVisible(), false);
  assert.equal(await page.locator('[data-hud-coins]').isVisible(), false);
  assert.equal(await page.locator('[data-map-actions] [data-camera-command="rotate-right"]').isVisible(), true);
  assert.equal(await bottom.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return rect.top >= -1 && rect.bottom <= innerHeight + 1;
  }), true);
  const collapsedHeight = (await frame.boundingBox()).height;
  assert.ok(collapsedHeight > originalHeight);
  await side.click();
  assert.equal(await side.getAttribute('aria-expanded'), 'true');
  assert.equal(await panel.isVisible(), false);
  await page.reload();
  await ready(page);
  const collapsedAfterReload = await readMenus();
  assert.deepEqual(collapsedAfterReload, { bottom: 'false', side: 'true', bottomVisible: false, sideVisible: true });
  await bottom.click();
  assert.equal(await panel.isVisible(), true);
  assert.equal(await side.getAttribute('aria-expanded'), 'true');
  await side.click();
  await page.reload();
  await ready(page);
  const reopenedAfterReload = await readMenus();
  assert.deepEqual(reopenedAfterReload, { bottom: 'true', side: 'false', bottomVisible: true, sideVisible: false });
  await page.evaluate(() => window.scrollTo(0, 0));
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
  return { screenshot, data: { ...data, bottomPanel: { originalHeight, collapsedHeight },
    menuReloads: { collapsedAfterReload, reopenedAfterReload }, visualReviewed: false } };
}

async function tutorialFromHome(page) {
  const pages = [];
  for (const [lang, home, guide, width, height] of [
    ['id', '/', '/tutorial/', 1366, 768],
    ['en', '/en/', '/en/tutorial/', 360, 780],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(productOrigin + home);
    const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    const promotion = page.locator('[data-home-map-features]');
    const tutorial = page.locator('[data-home-tutorial]');
    assert.equal(await promotion.isVisible(), true);
    assert.equal(await promotion.locator('a').getAttribute('href'), guide + '#kamera');
    assert.equal(await tutorial.getAttribute('href'), guide);
    await tutorial.click();
    await page.waitForURL(productOrigin + guide, { waitUntil: 'domcontentloaded' });
    assert.equal(new URL(page.url()).pathname, guide);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    const article = page.locator('[data-tutorial-page]');
    const chapterIds = await article.locator('[data-tutorial-chapter]').evaluateAll(nodes => nodes.map(node => node.id));
    const links = await article.locator('nav a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    assert.equal(chapterIds.length, 8);
    assert.deepEqual(links, chapterIds.map(id => '#' + id));
    const imgs = await article.locator('img[data-tutorial-screenshot]').evaluateAll(async nodes =>
      Promise.all(nodes.map(async node => {
        const file = new Image();
        file.src = node.src;
        await file.decode();
        return { url: node.src, width: file.naturalWidth, height: file.naturalHeight,
          device: node.dataset.tutorialScreenshot, alt: node.alt,
          zoomLink: node.closest('a')?.href };
      })),
    );
    assert.equal(new Set(imgs.map(img => img.url)).size, 12);
    assert.ok(imgs.every(img => img.alt.trim() && img.zoomLink === img.url && img.url.startsWith(productOrigin + '/_astro/')));
    const mobileScreens = imgs.filter(x => x.device === 'mobile' && x.width === 390 && x.height === 844).length;
    const desktopScreens = imgs.filter(x => x.device === 'desktop' && x.width === 1366 && x.height === 768).length;
    assert.equal(mobileScreens, 6);
    assert.equal(desktopScreens, 6);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal(canonical, 'https://myzootwin.com' + guide);
    const alternate = lang === 'id' ? 'en' : 'id';
    assert.equal(await page.locator(`header .language-link[hreflang="${alternate}"]`).getAttribute('href'),
      lang === 'id' ? '/en/tutorial/' : '/tutorial/');
    const guideOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(homeOverflow, false);
    assert.equal(guideOverflow, false);
    await article.locator('nav a[href="#misi-pertama"]').click();
    await page.waitForURL(productOrigin + guide + '#misi-pertama');
    assert.equal(new URL(page.url()).hash, '#misi-pertama');
    await article.locator('[data-tutorial-play]').first().click();
    await page.waitForURL(productOrigin + '/play/', { waitUntil: 'domcontentloaded' });
    const play = new URL(page.url()).pathname;
    assert.equal(play, '/play/');
    await ready(page);
    pages.push({ lang, home, guide, width, height, chapters: chapterIds.length, mobileScreens, desktopScreens,
      play, canonical, homeOverflow, guideOverflow });
  }
  return { data: { pages } };
}

async function animalArticles(page) {
  const profiles = [];
  for (const [width, height] of [[1366, 768], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(productOrigin + '/');
    const menu = page.locator('header a[data-site-articles]');
    assert.equal(await menu.getAttribute('href'), '/artikel/');
    await menu.click();
    await page.waitForURL(productOrigin + '/artikel/', { waitUntil: 'domcontentloaded' });
    const index = new URL(page.url()).pathname;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    const list = page.locator('[data-article-index]');
    const links = await list.locator('[data-article-card]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    assert.deepEqual(links, ANIMAL_ARTICLE_ROUTES);
    const articles = [];
    for (const path of links) {
      await list.locator(`a[href="${path}"]`).click();
      await page.waitForURL(productOrigin + path, { waitUntil: 'domcontentloaded' });
      const story = page.locator('[data-animal-story]');
      const slug = path.split('/')[2];
      assert.equal(await story.getAttribute('data-animal-story'), slug);
      assert.equal(await story.locator('[data-article-photo]').count(), 1);
      const photo = await story.locator('[data-article-photo]').evaluate(async image => {
        await image.decode();
        if (!image.alt || image.naturalWidth !== 1280 || image.naturalHeight !== 853) throw Error('Invalid article photo');
        return new URL(image.src).pathname;
      });
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const play = await story.locator('a[href="/play/"]').getAttribute('href');
      const chapter = await story.locator('a[href^="/tutorial/#"]').getAttribute('href');
      assert.equal(canonical, 'https://myzootwin.com' + path);
      assert.equal(play, '/play/');
      assert.equal(chapter, slug === 'makaw' ? '/tutorial/#rawat' : '/tutorial/#habitat');
      assert.equal(await story.locator('a[href^="https://"]').count(), 1);
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(pageOverflow, false);
      articles.push({ path, photo, canonical, play, overflow: pageOverflow });
      await page.goBack();
      await list.waitFor();
    }
    assert.equal(new Set(articles.map(article => article.photo)).size, 5);
    profiles.push({ width, height, index, overflow, articles });
  }
  return { data: { profiles } };
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
        ['tutorial-home', () => tutorialFromHome(page)],
        ['animal-articles', () => animalArticles(page)],
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
