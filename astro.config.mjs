import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import referenceConfig from './reference-infra.config.json' with { type: 'json' };
import { collectContentLastmod } from './scripts/reference-infra/content-lastmod.mjs';

const contentLastmod = await collectContentLastmod(referenceConfig, { root: process.cwd() });
const lastmodByUrl = new Map(contentLastmod.map((item) => [item.url, item.lastmod]));

export default defineConfig({
  site: 'https://oper-stack.com',
  output: 'static',
  trailingSlash: 'always',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter(page) {
        // Страницы под noindex в карте сайта дают противоречивый сигнал:
        // карта говорит «индексируй», мета на странице говорит «не индексируй».
        const excluded = ['/thanks/', '/site-report/'];
        return !excluded.some((path) => page.includes(path));
      },
      serialize(item) {
        const lastmod = lastmodByUrl.get(item.url);
        return lastmod ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`) } : item;
      },
    }),
  ],
});
