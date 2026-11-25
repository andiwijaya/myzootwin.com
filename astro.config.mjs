import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { bundleAnalysis } from './scripts/qa/bundle-analysis.mjs';
import { isIndexablePath, siteOrigin } from './src/seo.mjs';

export default defineConfig({
  site: siteOrigin,
  integrations: [sitemap({ filter: url => isIndexablePath(new URL(url).pathname) })],
  output: 'static',
  // Keep processed modules external so /play's self-only CSP remains effective.
  // Returning undefined preserves the vendor default for non-script assets.
  vite: { plugins: [bundleAnalysis()], build: { assetsInlineLimit: (path) => path.endsWith('.js') ? false : undefined } }
});
