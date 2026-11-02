import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { bundleAnalysis } from './scripts/qa/bundle-analysis.mjs';

export default defineConfig({
  site: 'https://myzootwin.com',
  integrations: [sitemap()],
  output: 'static',
  // Keep processed modules external so /play's self-only CSP remains effective.
  // Returning undefined preserves the vendor default for non-script assets.
  vite: { plugins: [bundleAnalysis()], build: { assetsInlineLimit: (path) => path.endsWith('.js') ? false : undefined } }
});
