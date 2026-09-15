/**
 * Проверка живых сайтов после выкладки: то, что 13 сентября 2026 делалось руками и нашло пять
 * дефектов, которых сборка не видит. Сборка отвечает на вопрос «собралось ли», этот скрипт на
 * вопрос «работает ли у человека».
 *
 *   node scripts/smoke-live.mjs            оба сайта
 *   node scripts/smoke-live.mjs --site en  один
 *
 * Что проверяется и почему именно это:
 *   1. каждый адрес из карты сайта отвечает 200 (страницы пропадают молча);
 *   2. каждая кнопка «купить» ведёт на живую страницу Whop, и цена на ней та же, что у нас;
 *   3. каждый обработчик отвечает разумным кодом, а не 500 (кривое тело роняло prospect-request);
 *   4. бесплатная проверка реально отвечает ok:true (ограничитель закрывал её всему миру);
 *   5. результат проверки нарисован: кольцо 132px, а не чёрный круг (стили Astro не видят innerHTML);
 *   6. ключевые экраны на телефоне и десктопе без ошибок в консоли и без горизонтальной прокрутки.
 * Выход ненулевой при любом провале, чтобы цеплять к CI и к ops-notify.
 */
// playwright-core ничего не качает при установке (полный playwright тянет браузеры в postinstall
// и замедлил бы каждую сборку на Vercel). Он запускает уже стоящий Google Chrome; где Chrome нет,
// шаги 5 и 6 пропускаются с предупреждением, а не роняют скрипт.
import { chromium, devices } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SITES = {
  en: {
    origin: 'https://oper-stack.com',
    lang: 'en',
    check: '/ai-visibility/',
    keyPages: ['/', '/products/', '/products/course/', '/pricing/', '/ai-visibility/', '/visits/'],
    endpoints: [
      ['GET', '/api/ai-visibility/?url=example.net', [200]],
      ['GET', '/api/mcp/', [200]], ['GET', '/api/whop-webhook/', [200]], ['GET', '/api/paddle-webhook/', [200]],
      ['POST', '/api/lead/', [400]], ['POST', '/api/whop-webhook/', [401]], ['POST', '/api/paddle-webhook/', [401]],
      ['POST', '/api/visibility-task/', [400]], ['POST', '/api/prospect-request/', [400]], ['POST', '/api/report-request/', [400, 403]],
      ['GET', '/api/kit-download/?t=x', [403]], ['GET', '/api/unsubscribe/?t=x', [400]],
    ],
    products: resolve('src/data/products.ts'),
  },
  ru: {
    origin: 'https://oper-stack.ru',
    lang: 'ru',
    check: '/ai-visibility/',
    keyPages: ['/', '/produkty/', '/pricing/', '/zakaz/', '/ai-visibility/'],
    endpoints: [
      ['GET', '/api/ai-visibility/?url=example.net', [200]],
      ['POST', '/api/lead/', [400]], ['POST', '/api/order/', [400]],
    ],
    products: null,
  },
};

const only = process.argv.includes('--site') ? process.argv[process.argv.indexOf('--site') + 1] : null;
const failures = [];
const fail = (s) => { failures.push(s); console.log('  ✗ ' + s); };
const ok = (s) => console.log('  ✓ ' + s);
const get = (url, init = {}) => fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(45000), ...init });

async function sitemap(origin) {
  const xml = await (await get(`${origin}/sitemap-0.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function checkSite(key) {
  const site = SITES[key];
  console.log(`\n── ${site.origin}`);

  // 1. Карта сайта.
  const urls = await sitemap(site.origin);
  let bad = 0;
  for (const u of urls) {
    const r = await get(u).catch(() => null);
    if (!r || r.status !== 200) { bad++; fail(`${r ? r.status : 'нет ответа'} ${u}`); }
  }
  if (!bad) ok(`карта сайта: ${urls.length} адресов, все 200`);

  // 2. Кнопки «купить» и цены (только там, где есть массив продуктов).
  if (site.products) {
    const src = readFileSync(site.products, 'utf8');
    /*
     * Разбираем по одному товару за раз. Раньше стояло одно жадное выражение на весь файл, и
     * оно склеивало слаг одного товара с адресом другого: 15.09.2026 проверка ругалась на
     * «visits», показывая при этом ссылку от site-report. Ошибка была в проверке, не на сайте.
     */
    const blocks = src.split(/\n\s*\{\n\s*slug: '/).slice(1);
    const items = blocks.map((b) => {
      const slug = b.slice(0, b.indexOf("'"));
      const price = b.match(/\n\s*price: '([^']+)'/)?.[1];
      const href = b.match(/\n\s*cta: \{[^}]*href: '(https:\/\/whop\.com[^']+)'/)?.[1];
      return href && price ? [null, slug, price, href] : null;
    }).filter(Boolean);
    for (const [, slug, price, href] of items) {
      /*
       * Whop иногда не отвечает нам, хотя в настоящем браузере страница открывается: после
       * десятка запросов подряд он режет наш адрес. Поэтому одна повторная попытка с паузой,
       * и только потом вывод. Иначе проверка кричит «магазин лежит» ровно тогда, когда мы
       * сами же его и опросили ([[vercel-challenges-polling-ip]] про тот же приём у Vercel).
       */
      let r = await get(href, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(() => null);
      if (!r || r.status !== 200) {
        await new Promise((res) => setTimeout(res, 5000));
        r = await get(href, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(() => null);
      }
      if (!r || r.status !== 200) { fail(`${slug}: Whop не ответил нам дважды (${r ? r.status : 'нет ответа'}) ${href}. Проверьте адрес в настоящем браузере: он мог просто закрыться от нас`); continue; }
      const html = await r.text();
      const ours = price.match(/\d+/)?.[0];
      // Whop рисует зачёркнутую цену «+20 %» рядом с настоящей, поэтому ищем именно нашу.
      if (ours && !new RegExp(`\\$${ours}(\\D|$)`).test(html)) fail(`${slug}: на Whop не видно цены ${ours}`);
      else ok(`${slug}: Whop 200, цена ${price} на месте`);
    }
  }

  // 3. Обработчики.
  for (const [method, path, want] of site.endpoints) {
    const init = method === 'POST' ? { method, headers: { 'Content-Type': 'application/json' }, body: '{}' } : {};
    const r = await get(site.origin + path, init).catch(() => null);
    if (!r || !want.includes(r.status)) fail(`${method} ${path} → ${r ? r.status : 'нет ответа'}, ждали ${want.join('/')}`);
  }
  ok(`обработчики: ${site.endpoints.length} проверены`);

  // 4. Бесплатная проверка отвечает по существу.
  const api = await (await get(`${site.origin}/api/ai-visibility/?url=example.net`)).json().catch(() => ({}));
  if (api.ok && typeof api.score === 'number') ok(`бесплатная проверка: ok, балл ${api.score}`);
  else fail(`бесплатная проверка не отвечает: ${JSON.stringify(api).slice(0, 120)}`);

  /*
   * Язык ответа. Движок проверки один на два сайта, и до 14 сентября 2026 русский посетитель
   * получал весь результат по-английски: названия областей и все находки. Сборка этого не видит,
   * потому что собирается она одинаково, а язык выбирается в обработчике.
   * Имена роботов не переводятся: это названия продуктов.
   */
  if (api.ok) {
    // С 15.09.2026 обработчик отдаёт в браузер только пройденные проверки и одну правку целиком:
    // остальные находки уезжают заголовками по четыре слова в api.rest. Поэтому язык проверяем
    // по областям, пройденным проверкам и тексту правки, а обрезанные заголовки не трогаем:
    // в четырёх словах кириллицы может не оказаться вовсе, и проверка ловила бы сама себя.
    const строки = [
      ...(api.areas || []).map((a) => a.label),
      ...(api.areas || []).flatMap((a) => (a.findings || []).map((f) => f.text)),
      ...(api.fixes || []).map((f) => f.text),
    ];
    const кириллица = /[А-Яа-яЁё]/;
    const чужие = site.lang === 'ru' ? строки.filter((t) => !кириллица.test(t)) : строки.filter((t) => кириллица.test(t));
    if (!строки.length) fail('в ответе проверки нет ни одной области');
    else if (чужие.length) fail(`ответ проверки не на том языке (${чужие.length} из ${строки.length}): ${чужие.slice(0, 2).join(' | ')}`);
    else ok(`ответ проверки на нужном языке: ${строки.length} строк`);
  }

  // 5 и 6. Живая страница в браузере: кольцо, консоль, прокрутка.
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome' }); } catch (e) { console.log('  ! Chrome не найден, экраны и кольцо не проверены: ' + e.message.split('\n')[0].slice(0, 80)); return; }
  for (const [kind, opts] of [['десктоп', { viewport: { width: 1440, height: 900 } }], ['телефон', { ...devices['iPhone 13'] }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    for (const path of site.keyPages) {
      errors.length = 0;
      try {
        await page.goto(site.origin + path, { waitUntil: 'networkidle', timeout: 45000 });
        const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
        if (wide) fail(`${path} (${kind}): горизонтальная прокрутка`);
        if (errors.length) fail(`${path} (${kind}): ${errors.length} ошибок в консоли, первая: ${errors[0].slice(0, 100)}`);
      } catch (e) { fail(`${path} (${kind}): ${e.message.slice(0, 80)}`); }
    }
    if (kind === 'десктоп') {
      await page.goto(site.origin + site.check, { waitUntil: 'networkidle' });
      await page.fill('input#vis-url', 'example.net');
      await page.click('button[type=submit]');
      await page.waitForSelector('#vis-result .ring', { timeout: 40000 }).catch(() => null);
      const width = await page.evaluate(() => { const r = document.querySelector('#vis-result .ring'); return r ? getComputedStyle(r).width : null; });
      if (width === '132px') ok('результат проверки нарисован: кольцо 132px');
      else fail(`результат проверки без оформления: кольцо ${width}`);
    }
    await ctx.close();
  }
  await browser.close();
  ok(`ключевые экраны: ${site.keyPages.length} страниц, десктоп и телефон`);
}

for (const key of Object.keys(SITES)) if (!only || only === key) await checkSite(key);
console.log(failures.length ? `\nПРОВАЛОВ: ${failures.length}` : '\nВсё работает.');
process.exit(failures.length ? 1 : 0);
