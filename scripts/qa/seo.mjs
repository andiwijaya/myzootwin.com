import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isIndexablePath, siteOrigin, siteUrl } from '../../src/seo.mjs';
import { ANIMAL_ARTICLE_ROUTES, files, pageMetadata, PRODUCT_ROUTES } from './tooling.mjs';

const matches = (text, re) => [...text.matchAll(re)].map(match => match[1]);
export const sitemapLocations = xml => matches(xml, /<loc>([^<]+)<\/loc>/g);

export async function assertBuiltSeo(dist) {
  const paths = (await files(dist)).map(path => '/' + relative(dist, path).split(sep).join('/'));
  const assets = new Set(paths);
  const routes = paths.filter(path => path.endsWith('/index.html')).map(path => path.slice(0, -'index.html'.length));
  assert.deepEqual(routes.sort(), [...PRODUCT_ROUTES].sort(), 'Unexpected or missing public route');
  const pages = new Map();
  const titles = new Set(), descriptions = new Set();
  for (const path of routes) {
    const html = await readFile(join(dist, path, 'index.html'), 'utf8');
    const head = html.match(/<head>(.*?)<\/head>/s)?.[1] ?? '';
    const { canonical, title, h1 } = pageMetadata(html);
    assert.deepEqual(matches(head, /<link rel="canonical" href="([^"]+)"/g), [siteUrl(path)], path);
    assert.equal(canonical, siteUrl(path), path);
    assert.ok(title && h1 && [...html.matchAll(/<h1\b/g)].length === 1, path + ' heading/title');
    assert.ok(!titles.has(title), 'Duplicate title: ' + title);
    titles.add(title);
    const description = matches(head, /<meta name="description" content="([^"]+)"/g);
    assert.ok(description.length === 1 && description[0].length > 40, path + ' description');
    assert.ok(!descriptions.has(description[0]), 'Duplicate description: ' + path);
    descriptions.add(description[0]);
    const indexable = isIndexablePath(path);
    assert.deepEqual(matches(head, /<meta name="robots" content="([^"]+)"/g),
      [indexable ? 'max-image-preview:large' : 'noindex, follow'], path);
    assert.ok(!/<meta[^>]+name="googlebot"/.test(head), path + ' conflicting directive');
    const lang = html.match(/<html lang="([^"]+)"/)?.[1];
    assert.equal(lang, path === '/' || path === '/play/' || path === '/tutorial/' || path.startsWith('/artikel/') ? 'id' : 'en', path);
    if (indexable) {
      const [image] = matches(head, /<meta property="og:image" content="([^"]+)"/g);
      assert.equal(new URL(image).origin, siteOrigin, path);
      assert.ok(assets.has(new URL(image).pathname), path + ' social image missing');
      assert.ok(head.includes('property="og:image:alt"'), path + ' social image missing alt');
    }
    const alternates = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
      .map(([, language, href]) => [language, href]);
    const graph = matches(head, /<script type="application\/ld\+json">([^<]+)<\/script>/g)
      .flatMap(json => JSON.parse(json)['@graph']);
    const links = matches(html, /<a\b[^>]*\bhref="([^"]+)"/g)
      .map(href => new URL(href.replaceAll('&amp;', '&'), canonical))
      .filter(url => url.origin === siteOrigin);
    const fragments = new Set(matches(html, /(?:\s|<)id="([^"]+)"/g));
    pages.set(path, { h1, title, lang, indexable, links, fragments, alternates, graph });
  }
  const localizedPairs = [['/', '/en/'], ['/tutorial/', '/en/tutorial/']];
  const localizations = new Map(localizedPairs.flatMap(([id, en]) => [[id, [id, en]], [en, [id, en]]]));
  for (const [path, data] of pages) {
    const pair = localizations.get(path);
    const expected = pair ? [['id', siteUrl(pair[0])], ['en', siteUrl(pair[1])], ['x-default', siteUrl(pair[0])]] : [];
    assert.deepEqual(data.alternates, expected, path + ' hreflang');
    for (const link of data.links) {
      const target = pages.get(link.pathname);
      assert.ok(target || assets.has(link.pathname), path + ' has broken link: ' + link);
      if (target && link.hash) assert.ok(target.fragments.has(decodeURIComponent(link.hash.slice(1))), path + ' has broken fragment: ' + link);
    }
    const crumb = data.graph.find(node => node['@type'] === 'BreadcrumbList');
    if (['/animals/', '/learn/', '/about/', '/artikel/', '/tutorial/', '/en/tutorial/', ...ANIMAL_ARTICLE_ROUTES].includes(path)) {
      assert.ok(crumb?.itemListElement.length >= 2, path + ' needs breadcrumbs');
      assert.equal(crumb.itemListElement.at(-1).item, siteUrl(path), path);
      for (const [i, entry] of crumb.itemListElement.entries()) {
        assert.equal(entry.position, i + 1, path);
        assert.ok(pages.has(new URL(entry.item).pathname), path + ' breadcrumb missing destination');
      }
    }
    if (ANIMAL_ARTICLE_ROUTES.includes(path)) {
      const article = data.graph.find(node => node['@type'] === 'Article');
      assert.ok(article && article.headline && article.citation && article.mainEntityOfPage === siteUrl(path), path + ' Article schema');
      assert.equal(data.links.filter(link => ANIMAL_ARTICLE_ROUTES.includes(link.pathname) && link.pathname !== path).length, 4, path + ' related stories');
    }
  }
  for (const path of ['/', '/en/']) {
    const home = pages.get(path);
    assert.ok(home.graph.some(node => node['@type'] === 'WebSite' && node.name === 'MyZooTwin'), path);
    assert.ok(home.graph.some(node => node['@type'] === 'VideoGame' && node.url === siteUrl('/play/')), path);
    assert.ok(ANIMAL_ARTICLE_ROUTES.every(article => home.links.some(link => link.pathname === article)), path + ' missing habitat article links');
  }
  const expectedPaths = routes.filter(path => pages.get(path).indexable);
  const visited = new Map([['/', 0]]);
  for (const [path, depth] of visited) {
    for (const linked of pages.get(path).links) {
      const next = linked.pathname;
      if (pages.get(next)?.indexable && !visited.has(next)) visited.set(next, depth + 1);
    }
  }
  assert.ok(expectedPaths.every(path => visited.has(path) && visited.get(path) <= 3), 'Orphaned or deep canonical page');
  const missing = await readFile(join(dist, '404.html'), 'utf8');
  assert.match(missing, /<meta name="robots" content="noindex, follow"/);
  assert.doesNotMatch(missing, /rel="canonical"/, '404 must not canonicalize to a live page');
  assert.match(missing, /Halaman tidak ditemukan/);

  const indexPath = '/sitemap-index.xml', robots = await readFile(join(dist, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*\s+Allow: \/\s+Sitemap: https:\/\/myzootwin\.com\/sitemap-index\.xml\s*$/);
  const children = sitemapLocations(await readFile(join(dist, indexPath), 'utf8'));
  const locations = [];
  assert.ok(children.length, 'Empty sitemap index');
  for (const child of children) {
    const url = new URL(child);
    assert.ok(url.origin === siteOrigin && /^\/sitemap-\d+\.xml$/.test(url.pathname), child);
    locations.push(...sitemapLocations(await readFile(join(dist, url.pathname), 'utf8')));
  }
  assert.deepEqual(locations.sort(), expectedPaths.map(siteUrl).sort(), 'Sitemap and indexable HTML differ');
  return {
    publicRoutes: routes.length, sitemapCount: locations.length, sitemapChildren: children,
    noindex: routes.filter(path => !pages.get(path).indexable),
    maxClickDepth: Math.max(...visited.values()), static404: true,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await assertBuiltSeo(resolve(process.argv[2] ?? 'dist')), null, 2));
}