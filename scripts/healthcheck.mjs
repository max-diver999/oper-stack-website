#!/usr/bin/env node
/**
 * SEO-сайт healthcheck — копировать в scripts/healthcheck.mjs каждого нового сайта.
 * См. SEO_SITE_PLAYBOOK.md часть 12.10 и часть 13.
 *
 * Запуск:
 *   node scripts/healthcheck.mjs
 *   SITE_URL=https://my-other-domain.com node scripts/healthcheck.mjs
 *
 * В package.json:
 *   "scripts": {
 *     "healthcheck": "node scripts/healthcheck.mjs",
 *     "deploy": "npm run build && vercel --prod --yes && sleep 10 && npm run healthcheck"
 *   }
 *
 * Exit code 0 = всё OK. Exit code 1 = есть провалы → не деплоить дальше.
 */

const SITE = (process.env.SITE_URL || 'https://YOURSITE.com').replace(/\/$/, '');

// Список проверок. Расширять под конкретный сайт — добавить все свои API endpoints,
// важные для бизнеса URL (pricing, checkout, signup) и страницы с уникальным шаблоном.
const checks = [
  { name: 'sitemap-index', url: `${SITE}/sitemap-index.xml`, expect: 200 },
  { name: 'robots.txt',    url: `${SITE}/robots.txt`,         expect: 200 },
  { name: 'homepage',      url: `${SITE}/`,                    expect: 200 },
  { name: 'favicon',       url: `${SITE}/favicon.svg`,         expect: 200, optional: true },
  { name: 'og-default',    url: `${SITE}/images/og-default.jpg`, expect: 200, optional: true },

  // КРИТИЧНО: проверка что Astro API endpoint реально работает (catch для 405).
  // Без этой проверки баг "prerender не выставлен → POST возвращает 405" живёт в production неделями
  // и съедает все лиды. См. SEO_SITE_PLAYBOOK 12.1.
  // Если у проекта нет lead-формы — заменить на любой свой POST endpoint (signup / contact / order).
  {
    name: 'lead API POST',
    url: `${SITE}/api/lead/`,
    expect: 200,
    method: 'POST',
    body: { name: 'healthcheck', contact: 'healthcheck@bot', source: 'healthcheck' },
  },

  // Раскомментировать/добавить под endpoints своего проекта. Любой POST/GET API endpoint
  // должен здесь быть представлен — это главная защита от молчаливых 405/500 в production.
  // {
  //   name: 'chat API POST',
  //   url: `${SITE}/api/chat/`,
  //   expect: 200,
  //   method: 'POST',
  //   body: { messages: [{ role: 'user', content: 'ping' }] },
  // },
  // { name: 'currency API GET', url: `${SITE}/api/currency/`, expect: 200 },
  // { name: 'search API GET',   url: `${SITE}/api/search/?q=test`, expect: 200 },
];

const results = [];
let failed = 0;

for (const c of checks) {
  const opts = { method: c.method || 'GET' };
  if (c.body) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(c.body);
  }

  let status = 0;
  let error = null;
  try {
    const r = await fetch(c.url, opts);
    status = r.status;
  } catch (e) {
    error = e.message;
  }

  const ok = status === c.expect;
  const icon = ok ? '✓' : (c.optional ? '⚠' : '✗');
  const tag = c.optional && !ok ? ' (optional)' : '';
  console.log(`${icon} ${c.name}: ${status || 'ERR'} (expected ${c.expect})${tag}${error ? ' — ' + error : ''}`);

  results.push({ ...c, status, ok });
  if (!ok && !c.optional) failed++;
}

console.log(`\n${failed === 0 ? '✓ All required checks passed' : `✗ ${failed} required checks failed`} — ${SITE}`);

if (failed > 0) {
  console.error('\nЧастые причины провалов:');
  console.error('  • lead API POST → 405: добавить `export const prerender = false;` в src/pages/api/lead.ts (см. SEO_SITE_PLAYBOOK 12.1)');
  console.error('  • lead API POST → 308: клиентский fetch использует /api/lead вместо /api/lead/ (см. 12.2)');
  console.error('  • sitemap-index → 500: вероятно output: server вместо static в astro.config.mjs (см. часть 1)');
  console.error('  • homepage → 404: домен не привязан к Vercel deployment, проверить vercel.json/Vercel dashboard');
}

process.exit(failed > 0 ? 1 : 0);
