#!/usr/bin/env node
/**
 * Offline test for the two languages of the free check. No network: fetch is stubbed with
 * synthetic sites, so this runs in CI and on a plane.
 *
 * It guards three things that broke before:
 *   1. Russian visitors used to get the whole result in English. Every area label and every
 *      finding must carry Cyrillic under lang 'ru', and none under lang 'en'.
 *   2. The score must not depend on the language. It is the same measurement either way.
 *   3. Russian source phrases and figure units («по данным», «12 500 ₽») must count, or every
 *      Russian site loses the same five points for writing Russian.
 * Plus the number agreement, which is what a person notices first.
 */
import { checkVisibility, MESSAGES } from '../src/lib/ai-visibility.mjs';

let failures = 0;
const ok = (cond, what) => { if (!cond) { failures += 1; console.log(`  ✗ ${what}`); } else console.log(`  ✓ ${what}`); };
const CYR = /[Ѐ-ӿ]/;

/** A tiny site served from memory. Anything not listed answers 404. */
function serve(files) {
  globalThis.fetch = async (url) => {
    const key = String(url).replace(/\/$/, '');
    const hit = files[key] ?? files[key + '/'] ?? files[String(url)];
    if (!hit) return mk(404, 'text/plain', 'not found', url);
    return mk(200, hit.type, hit.body, url);
  };
}
function mk(status, type, body, url, extra = {}) {
  const bytes = new TextEncoder().encode(body);
  const headers = { 'content-type': type, ...extra };
  return {
    ok: status >= 200 && status < 300, status, url: String(url),
    headers: { get: (h) => headers[h.toLowerCase()] ?? null },
    arrayBuffer: async () => bytes.buffer,
  };
}

/** Сайт, который отвечает всем 403 с признаком проверки браузера Cloudflare. */
function serveWall() {
  globalThis.fetch = async (url) => mk(403, 'text/html', '<html><body>Checking your browser</body></html>', url, { 'cf-mitigated': 'challenge', server: 'cloudflare' });
}

const page = ({ h1, lead, body = '', schema = [], date = true, table = false }) => ({
  type: 'text/html; charset=utf-8',
  body: `<!doctype html><html><head><title>${h1}</title>
    <link rel="canonical" href="https://demo.ru/"><meta property="og:title" content="${h1}">
    ${schema.map((t) => `<script type="application/ld+json">{"@context":"https://schema.org","@type":"${t}"${date ? ',"datePublished":"2026-09-01","dateModified":"2026-09-10"' : ''}}</script>`).join('')}
    </head><body><main><h1>${h1}</h1><p>${lead}</p>
    <h2>Раздел один</h2><p>${body}</p><h2>Раздел два</h2><p>${body}</p><h2>Раздел три</h2><p>${body}</p>
    ${table ? '<table><tr><td>строка</td></tr></table>' : ''}</main></body></html>`,
});

const filler = 'Текст раздела для объёма. '.repeat(60);
const leadRu = 'Компания работает с 2017 года и закрыла 350 сделок, по данным внутреннего реестра, средний бюджет 12 500 ₽ в месяц по договорам за 2026 год.';

console.log('\n── богатый сайт, три страницы в выборке');
serve({
  'https://demo.ru': page({ h1: 'Главная', lead: leadRu, body: filler, schema: ['Organization', 'FAQPage'], table: true }),
  'https://demo.ru/robots.txt': { type: 'text/plain', body: 'User-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=no\nAllow: /\nSitemap: https://demo.ru/sitemap.xml\n' },
  'https://demo.ru/llms.txt': { type: 'text/plain', body: ['# demo', ...Array.from({ length: 6 }, (_, i) => `- https://demo.ru/uslugi/stranica-${i}/`)].join('\n') },
  'https://demo.ru/sitemap.xml': { type: 'application/xml', body: `<?xml version="1.0"?><urlset>${Array.from({ length: 8 }, (_, i) => `<loc>https://demo.ru/uslugi/dlinnyy-adres-stranicy-${i}/</loc><lastmod>2026-09-10</lastmod>`).join('')}</urlset>` },
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`https://demo.ru/uslugi/dlinnyy-adres-stranicy-${i}`, page({ h1: `Страница ${i}`, lead: leadRu, body: filler, schema: ['Article'], table: true })])),
});
const ru = await checkVisibility('demo.ru', { lang: 'ru', budgetMs: 8000 });
const en = await checkVisibility('demo.ru', { lang: 'en', budgetMs: 8000 });
ok(ru.ok && en.ok, 'проверка отработала на обоих языках');
ok(ru.score === en.score, `балл не зависит от языка (${ru.score} и ${en.score})`);
const ruTexts = [...ru.areas.map((a) => a.label), ...ru.areas.flatMap((a) => a.findings.map((f) => f.text)), ...ru.fixes.map((f) => f.area)];
const enTexts = [...en.areas.map((a) => a.label), ...en.areas.flatMap((a) => a.findings.map((f) => f.text))];
const latinOnly = ruTexts.filter((t) => !CYR.test(t));
ok(latinOnly.length === 0, `в русском ответе нет английских строк${latinOnly.length ? `: ${latinOnly.join(' | ')}` : ''}`);
ok(enTexts.every((t) => !CYR.test(t)), 'в английском ответе нет русских строк');
// Имена роботов это названия продуктов и не переводятся. Переводится только пояснение рядом:
// "ChatGPT search" становится "Поиск ChatGPT", а "Perplexity (PerplexityBot)" остаётся как есть.
const описанные = ru.crawlers.filter((c) => /search|browsing|training|grounding|and Bing/i.test(c.label.split('(')[0]));
ok(описанные.length === 0, `у роботов не осталось английских пояснений${описанные.length ? `: ${описанные.map((c) => c.label).join(' | ')}` : ''}`);
ok(ru.crawlers.some((c) => /Поиск ChatGPT/.test(c.label)) && en.crawlers.some((c) => /ChatGPT search/.test(c.label)), 'пояснения к роботам переведены');
const trust = ru.areas.find((a) => a.id === 'trust');
ok(trust.findings.some((f) => f.level === 'pass'), 'область дат и источников не штрафует богатый сайт');
ok(ru.areas.find((a) => a.id === 'content').score === 25, 'русская страница с ответом, H2 и таблицей берёт все 25 баллов за контент');
ok(ru.areas.every((a) => a.findings.every((f) => !/undefined|NaN|\[object/.test(f.text))), 'ни одной незаполненной подстановки в тексте');

console.log('\n── пустой сайт, одна страница, всё закрыто');
serve({
  'https://pusto.ru': { type: 'text/html', body: '<!doctype html><html><head><title>Пусто</title></head><body><h1>Пусто</h1><p>Мало слов.</p></body></html>' },
  'https://pusto.ru/robots.txt': { type: 'text/plain', body: 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: OAI-SearchBot\nDisallow: /\n' },
});
const pusto = await checkVisibility('pusto.ru', { lang: 'ru', budgetMs: 6000 });
const pustoTexts = [...pusto.areas.map((a) => a.label), ...pusto.areas.flatMap((a) => a.findings.map((f) => f.text))];
ok(pustoTexts.every((t) => CYR.test(t)), 'все находки пустого сайта по-русски');
ok(pustoTexts.some((t) => /Единственная проверенная страница короче 300 слов/.test(t)), 'одна страница названа единственной, а не «1 из 1 проверенных страница»');
ok(pusto.areas.find((a) => a.id === 'access').findings.some((f) => /Закрыты поисковые роботы/.test(f.text)), 'закрытые роботы названы по-русски');

console.log('\n── число в первом абзаце: цифрой или словом');
/*
 * Дом стиля многих сайтов требует писать числа словами, и «шестнадцать гейтов» это такая же
 * цифра, как «16». 13 из 16 наших витрин продуктов теряли балл ровно на этом. «Один» и «one»
 * не считаются: слишком часто это оборот речи, а не число.
 */
const leadPage = (lead) => ({ type: 'text/html; charset=utf-8', body: `<!doctype html><html><head><title>Лид</title></head><body><main><h1>Заголовок</h1><p>${lead}</p><h2>Раз</h2><h2>Два</h2><h2>Три</h2><p>${'Текст для объёма. '.repeat(120)}</p></main></body></html>` });
const leadCases = [
  ['цифра засчитана', 'Инструмент читает сайт и ставит балл из 100 по пяти областям, а потом называет три правки, которые двигают его сильнее всего, простыми словами.', true],
  ['число словом по-русски засчитано', 'Инструмент читает сайт и ставит балл по пяти областям, а потом называет шестнадцать проверок, которые двигают его сильнее всего, простыми словами и без регистрации.', true],
  ['число словом по-английски засчитано', 'The package ships sixteen gates and one config file, runs in your terminal, prints a table, and returns an exit code your build can act on without any account.', true],
  ['абзац без числа не засчитан', 'Инструмент читает сайт целиком и рассказывает простыми словами, что мешает ответным системам его цитировать, а потом предлагает исправления в понятном порядке.', false],
  ['«один» числом не считается', 'One of the better ways to keep a content site honest is to run the checks before publishing rather than after, which is what this package exists to make easy.', false],
];
for (const [name, lead, expect] of leadCases) {
  serve({ 'https://lid.ru': leadPage(lead), 'https://lid.ru/robots.txt': { type: 'text/plain', body: 'User-agent: *\nAllow: /\n' } });
  const r = await checkVisibility('lid.ru', { lang: 'ru', budgetMs: 6000 });
  ok(r.sample[0].answerFirst === expect, `${name}${r.sample[0].answerFirst === expect ? '' : ` (получено: ${r.sample[0].answerFirst})`}`);
}

console.log('\n── цифры и источники');
/*
 * Ровно те случаи, на которых инструмент штрафовал несправедливо (найдено 14.09.2026 на своих же
 * страницах): цена и длительность встречи это факты о себе; пример, подписанный словом
 * «иллюстративный», не утверждение; ссылка на исследование это названный источник, даже если
 * рядом нет оборота «по данным». И наоборот: голый процент без ссылки и без оборота штрафуется.
 */
const figurePage = (inner) => ({ type: 'text/html; charset=utf-8', body: `<!doctype html><html><head><title>Цифры</title><link rel="canonical" href="https://cifry.ru/"><meta property="og:title" content="Цифры"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","datePublished":"2026-09-01"}</script></head><body><main><h1>Цифры</h1><p>${'Вступление на двадцать слов, чтобы страница не считалась пустой и абзац-ответ находился там, где нужно, вместе с числом 7 внутри. '.repeat(1)}</p>${inner}<h2>Раз</h2><h2>Два</h2><h2>Три</h2><p>${'Текст для объёма. '.repeat(120)}</p></main></body></html>` });

const cases2 = [
  ['цена и длительность источника не требуют', '<p>Разбор бесплатный, занимает 45 минут. Внедрение от 3 000 ₽ в месяц.</p>', true],
  ['процент без источника штрафуется', '<p>Конверсия выросла на 40% за квартал.</p>', false],
  ['процент с оборотом «по данным» засчитан', '<p>По данным Росстата, спрос вырос на 40% за год.</p>', true],
  ['процент со ссылкой наружу засчитан', '<p>Аудит Harvard Business Review 2011 года показал падение на 40% (<a href="https://hbr.org/2011/03/x">исследование HBR</a>).</p>', true],
  ['подписанный пример не считается утверждением', '<table><tr><th>Пункт</th><th>Иллюстративный вес</th></tr><tr><td>Квалификация</td><td>25%</td></tr></table>', true],
];
for (const [name, inner, expectOk] of cases2) {
  serve({
    'https://cifry.ru': figurePage(inner),
    'https://cifry.ru/robots.txt': { type: 'text/plain', body: 'User-agent: *\nAllow: /\n' },
  });
  const r = await checkVisibility('cifry.ru', { lang: 'ru', budgetMs: 6000 });
  const t = r.areas.find((a) => a.id === 'trust');
  // При одной странице текст находки другой («не называет»), при нескольких «не называя».
  const наказан = t.findings.some((f) => /не называ(ет|я)/.test(f.text));
  ok(наказан !== expectOk, `${name}${наказан === expectOk ? ` (получено: ${наказан ? 'штраф' : 'без штрафа'})` : ''}`);
}

console.log('\n── сайт за проверкой браузера');
serveWall();
const wallRu = await checkVisibility('stena.ru', { lang: 'ru', budgetMs: 6000 });
const wallEn = await checkVisibility('stena.ru', { lang: 'en', budgetMs: 6000 });
ok(wallRu.ok === false && wallRu.blocked === true && wallRu.challenged === true, 'проверка браузера распознана, а не принята за сломанный сайт');
ok(CYR.test(wallRu.error) && /проверкой браузера/.test(wallRu.error), `объяснение по-русски: «${wallRu.error.slice(0, 60)}…»`);
ok(/browser challenge/.test(wallEn.error), 'по-английски объяснение прежнее');
ok(wallRu.status === 403, 'код ответа отдан наружу');

console.log('\n── склонения после чисел');
const R = MESSAGES.ru;
const cases = [
  [R.thinPages(1, 1), 'Единственная проверенная страница короче 300 слов. Короткие страницы цитируют редко.'],
  [R.thinPages(1, 3), 'Из 3 проверенных страниц 1 короче 300 слов. Короткие страницы цитируют редко.'],
  [R.answerFirstMissing(0, 1), 'Единственная проверенная страница не начинается с абзаца-ответа (20-90 слов с цифрой сразу после H1). Именно этот абзац попадает в цитату.'],
  [R.answerFirstMissing(2, 3), 'Из 3 проверенных страниц с абзаца-ответа (20-90 слов с цифрой сразу после H1) начинаются 2. Именно этот абзац попадает в цитату.'],
  [R.answerFirstMissing(1, 2), 'Из 2 проверенных страниц с абзаца-ответа (20-90 слов с цифрой сразу после H1) начинается одна. Именно этот абзац попадает в цитату.'],
  [R.sourcesMissing(2, 2), '2 из 2 проверенных страниц приводят цифры, не называя, откуда они («по данным», «источник»).'],
  [R.sourcesMissing(1, 3), '1 из 3 проверенных страниц приводит цифры, не называя, откуда они («по данным», «источник»).'],
  [R.datesMissing(1, 4), '1 из 4 проверенных страниц не показывает дату публикации или изменения. Системы предпочитают источники, которые можно датировать.'],
  [R.llmsOk(1), 'llms.txt есть, в нём 1 ссылка на страницы самого сайта.'],
  [R.llmsOk(3), 'llms.txt есть, в нём 3 ссылки на страницы самого сайта.'],
  [R.llmsOk(59), 'llms.txt есть, в нём 59 ссылок на страницы самого сайта.'],
  [R.avgWords(871), 'На проверенных страницах в среднем 871 слово.'],
  [R.avgWords(872), 'На проверенных страницах в среднем 872 слова.'],
  [R.avgWords(3066), 'На проверенных страницах в среднем 3066 слов.'],
  [R.fewH2(1, 1), 'У единственной проверенной страницы меньше трёх подзаголовков H2.'],
  [R.fewH2(2, 3), 'У 2 из 3 проверенных страниц меньше трёх подзаголовков H2.'],
];
for (const [got, want] of cases) ok(got === want, got === want ? `«${want}»` : `ожидалось «${want}», получено «${got}»`);

console.log('\n── таблица сообщений');
const keys = (o) => Object.keys(o).sort().join(',');
ok(keys(MESSAGES.ru) === keys(MESSAGES.en), 'в обеих таблицах одинаковый набор ключей');
ok(keys(MESSAGES.ru.area) === keys(MESSAGES.en.area), 'одинаковый набор областей');

console.log(failures ? `\n${failures} проверок не прошло` : '\nВсе проверки прошли.');
process.exit(failures ? 1 : 0);
