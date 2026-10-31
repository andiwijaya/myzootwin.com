import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { bundleAnalysis } from './scripts/qa/bundle-analysis.mjs';

export default defineConfig({
  site: 'https://myzootwin.com',
  integrations: [sitemap()],
  output: 'static',
  vite: { plugins: [bundleAnalysis()] }
});
