import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://oper-stack.com',
  output: 'static',
  trailingSlash: 'always',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter(page) {
        return !page.includes('/thanks/');
      },
    }),
  ],
});
