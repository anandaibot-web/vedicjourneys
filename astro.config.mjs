// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://vedicjourneys.vercel.app',
  output: 'server',
  integrations: [mdx(), sitemap()],
  adapter: vercel(),
});
