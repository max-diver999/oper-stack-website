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
  adapter: vercel({ maxDuration: 30 }),
  integrations: [
    sitemap({
      filter(page) {
        // Страницы под noindex в карте сайта дают противоречивый сигнал:
        // карта говорит «индексируй», мета на странице говорит «не индексируй».
        //
        // Сравниваем путь целиком, а не вхождением. Вхождение '/site-report/' выбрасывало из карты
        // сайта страницу товара /products/site-report/, то есть ровно ту, которую надо продавать, а
        // форму /report/, закрытую от индексации, оставляло внутри.
        const excludedExact = ['/report/'];
        const excludedPrefix = ['/thanks/'];
        const path = new URL(page).pathname;
        return !excludedExact.includes(path) && !excludedPrefix.some((p) => path.startsWith(p));
      },
      serialize(item) {
        const lastmod = lastmodByUrl.get(item.url);
        return lastmod ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`) } : item;
      },
    }),
  ],
});
