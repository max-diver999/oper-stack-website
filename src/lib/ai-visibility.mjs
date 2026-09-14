/**
 * AI visibility check: can ChatGPT, Perplexity, Copilot, Claude and Gemini read, understand
 * and cite this site? Public signals only, one homepage fetch plus robots, llms.txt, the
 * sitemap head and up to three sampled pages, all in parallel, under a hard time budget so it
 * runs inside a serverless function. Plain ESM so the same module runs in Node for tests.
 *
 * The measurement is language-neutral; only the words a person reads come from the MESSAGES
 * table below, picked by the `lang` option ('en' by default, 'ru' on oper-stack.ru). Finding ids
 * and area ids never change with the language, so task lists and reports can key on them.
 */

const UA = 'Mozilla/5.0 (compatible; OperStackVisibility/0.1; +https://oper-stack.com/ai-visibility/)';
const MAX_BODY = 600_000;

const AI_AGENTS = [
  { agent: 'oai-searchbot', label: 'ChatGPT search (OAI-SearchBot)', labelRu: 'Поиск ChatGPT (OAI-SearchBot)', kind: 'search' },
  { agent: 'chatgpt-user', label: 'ChatGPT browsing (ChatGPT-User)', labelRu: 'Просмотр страниц ChatGPT (ChatGPT-User)', kind: 'search' },
  { agent: 'gptbot', label: 'OpenAI training (GPTBot)', labelRu: 'Обучение OpenAI (GPTBot)', kind: 'train' },
  { agent: 'perplexitybot', label: 'Perplexity (PerplexityBot)', labelRu: 'Perplexity (PerplexityBot)', kind: 'search' },
  { agent: 'perplexity-user', label: 'Perplexity browsing (Perplexity-User)', labelRu: 'Просмотр страниц Perplexity (Perplexity-User)', kind: 'search' },
  { agent: 'claudebot', label: 'Claude (ClaudeBot)', labelRu: 'Claude (ClaudeBot)', kind: 'train' },
  { agent: 'claude-searchbot', label: 'Claude search (Claude-SearchBot)', labelRu: 'Поиск Claude (Claude-SearchBot)', kind: 'search' },
  { agent: 'claude-user', label: 'Claude browsing (Claude-User)', labelRu: 'Просмотр страниц Claude (Claude-User)', kind: 'search' },
  { agent: 'anthropic-ai', label: 'Anthropic (anthropic-ai)', labelRu: 'Anthropic (anthropic-ai)', kind: 'train' },
  { agent: 'google-extended', label: 'Gemini grounding (Google-Extended)', labelRu: 'Gemini (Google-Extended)', kind: 'train' },
  { agent: 'bingbot', label: 'Copilot and Bing (Bingbot)', labelRu: 'Copilot и Bing (Bingbot)', kind: 'search' },
  { agent: 'applebot-extended', label: 'Apple Intelligence (Applebot-Extended)', labelRu: 'Apple Intelligence (Applebot-Extended)', kind: 'train' },
  { agent: 'ccbot', label: 'Common Crawl (CCBot)', labelRu: 'Common Crawl (CCBot)', kind: 'train' },
  { agent: 'duckassistbot', label: 'DuckDuckGo AI (DuckAssistBot)', labelRu: 'DuckDuckGo AI (DuckAssistBot)', kind: 'search' },
];

/**
 * Russian plural form: pl(1, ...) is "страница", pl(2, ...) "страницы", pl(5, ...) "страниц".
 * Two shapes are needed and they differ: a bare count takes the counted form, while "из N"
 * always takes the genitive, which is plural for every N but one. Getting this wrong reads as
 * broken Russian on the one screen we send catalogue traffic to.
 */
const pl = (n, one, few, many) => { const a = Math.abs(n) % 100; const b = a % 10; return a > 10 && a < 20 ? many : b > 1 && b < 5 ? few : b === 1 ? one : many; };
const ofPages = (n) => (n === 1 ? 'проверенной страницы' : 'проверенных страниц');

/** Exported so the offline test can assert the Russian forms without hitting the network. */
export const MESSAGES = {
  en: {
    badInput: 'Enter a public site address, for example example.com',
    tooSlow: 'The site took too long to answer',
    badAnswer: (status, url) => `The site answered ${status || 'nothing'} for ${url}`,
    area: { access: 'Can AI crawlers read it', index: 'Is there a map for agents (llms.txt)', entity: 'Is the entity clear (schema)', content: 'Is there something to quote', trust: 'Can it be dated and trusted' },
    robotsAllBlocked: 'robots.txt disallows the whole site for every crawler. Nothing can read it.',
    fetchersBlocked: (list) => `Blocked answer-engine fetchers: ${list}. These are the bots that cite pages live.`,
    trainingBlocked: (list) => `Blocked training crawlers: ${list}. Models will not learn the brand from the site.`,
    noaiMeta: 'A page carries a noai robots meta tag.',
    allAllowed: (n, signal) => `All ${n} AI crawlers and fetchers are allowed${signal ? ` (Content-Signal: ${signal})` : ''}.`,
    llmsMissing: 'No llms.txt. Answer engines get no map of what the site is and which pages matter.',
    llmsNotText: '/llms.txt answers with an HTML page instead of a text index.',
    llmsForeign: (hosts) => `llms.txt links mostly to other hosts (${hosts}). An AI system may misidentify the business.`,
    llmsOk: (n) => `llms.txt present with ${n} link(s) to the site's own pages.`,
    orgOk: 'Organization or business schema names the entity behind the site.',
    orgMissing: 'No Organization or business schema: AI systems have no entity to attach the site to.',
    faqOk: 'FAQPage schema found, the easiest format for an engine to quote.',
    faqMissing: 'No FAQPage schema on the sampled pages.',
    articleOk: 'Article schema on the sampled pages: an engine can name and date what it is quoting.',
    pageTypeOk: (type) => `${type} schema on the sampled pages: an engine can name what it is quoting.`,
    pageTypeMissing: 'The sampled pages carry no page-level type (Article, Service, Product, Course and the like), so an engine cannot say what kind of thing it is quoting.',
    canonicalMissing: 'The homepage has no canonical tag.',
    ogMissing: 'No Open Graph tags on the homepage: shared links and previews render without a title or image.',
    thinPages: (thin, total) => `${thin} of ${total} sampled page(s) hold under 300 words. Engines rarely cite thin pages.`,
    avgWords: (avg) => `Sampled pages carry ${avg} words on average.`,
    answerFirstMissing: (n, total) => `${n} of ${total} sampled page(s) open with an answer-first paragraph (20 to 90 words with a figure right after the H1). That paragraph is what gets quoted.`,
    answerFirstOk: 'Every sampled page opens with an answer-first paragraph carrying a figure.',
    fewH2: (n) => `${n} sampled page(s) have fewer than three H2 sections.`,
    noTables: 'No tables on the sampled pages. Tables are the second most quoted format after the first paragraph.',
    homeOnly: 'Only the homepage could be read, so this area is measured on one page rather than several. A sitemap that answers would give a fuller picture.',
    datesMissing: (n) => `${n} sampled page(s) expose no publication or modified date. Engines prefer sources they can date.`,
    datesOk: 'Sampled pages expose publication dates.',
    noFigures: 'The sampled pages state no figures, so there is nothing that needs a source named.',
    sourcesMissing: (n, total) => `${n} of ${total} sampled page(s) state figures without naming where they came from ("according to", "data from").`,
    sourcesOk: 'Every sampled page that states figures names where they came from.',
    sitemapNoLastmod: 'The sitemap carries no lastmod dates.',
    sitemapTimedOut: 'The sitemap did not answer in time, so it was not checked. The score does not count this either way.',
    sitemapMissing: 'No XML sitemap found at the usual paths or in robots.txt.',
  },
  ru: {
    badInput: 'Введите адрес публичного сайта, например example.ru',
    tooSlow: 'Сайт слишком долго не отвечал',
    badAnswer: (status, url) => `Сайт ответил ${status ? `кодом ${status}` : 'ничем'} на ${url}`,
    area: { access: 'Могут ли роботы ИИ прочитать сайт', index: 'Есть ли карта для агентов (llms.txt)', entity: 'Понятно ли, кто вы (разметка)', content: 'Есть ли что процитировать', trust: 'Можно ли датировать и доверять' },
    robotsAllBlocked: 'robots.txt закрывает весь сайт для всех роботов. Его никто не может прочитать.',
    fetchersBlocked: (list) => `Закрыты поисковые роботы ответных систем: ${list}. Именно они достают страницу, чтобы процитировать её в ответе.`,
    trainingBlocked: (list) => `Закрыты обучающие роботы: ${list}. Модели не узнают о бренде с сайта.`,
    noaiMeta: 'На одной из страниц стоит мета-тег robots со значением noai.',
    allAllowed: (n, signal) => `Все ${n} роботов ИИ допущены на сайт${signal ? ` (Content-Signal: ${signal})` : ''}.`,
    llmsMissing: 'Нет llms.txt. Ответные системы не получают карты: что это за сайт и какие страницы главные.',
    llmsNotText: '/llms.txt отдаёт HTML-страницу вместо текстового указателя.',
    llmsForeign: (hosts) => `Ссылки в llms.txt ведут в основном на чужие домены (${hosts}). Система ИИ может перепутать, чей это бизнес.`,
    llmsOk: (n) => `llms.txt есть, в нём ${n} ${pl(n, 'ссылка', 'ссылки', 'ссылок')} на страницы самого сайта.`,
    orgOk: 'Разметка Organization или бизнеса называет, кто стоит за сайтом.',
    orgMissing: 'Нет разметки Organization или бизнеса: системам ИИ не к кому привязать сайт.',
    faqOk: 'Найдена разметка FAQPage, самый удобный для цитирования формат.',
    faqMissing: 'На проверенных страницах нет разметки FAQPage.',
    articleOk: 'На проверенных страницах есть разметка Article: система может назвать и датировать то, что цитирует.',
    pageTypeOk: (type) => `На проверенных страницах есть разметка ${type}: система может назвать, что именно цитирует.`,
    pageTypeMissing: 'На проверенных страницах нет типа страницы (Article, Service, Product, Course и подобных), поэтому система не может сказать, что за вещь она цитирует.',
    canonicalMissing: 'На главной нет канонического адреса (тега canonical).',
    ogMissing: 'На главной нет тегов Open Graph: ссылка в мессенджерах и соцсетях показывается без заголовка и картинки.',
    thinPages: (thin, total) => (total === 1
      ? 'Единственная проверенная страница короче 300 слов. Короткие страницы цитируют редко.'
      : `Из ${total} ${ofPages(total)} ${thin} короче 300 слов. Короткие страницы цитируют редко.`),
    avgWords: (avg) => `На проверенных страницах в среднем ${avg} ${pl(avg, 'слово', 'слова', 'слов')}.`,
    answerFirstMissing: (n, total) => (total === 1
      ? 'Единственная проверенная страница не начинается с абзаца-ответа (20-90 слов с цифрой сразу после H1). Именно этот абзац попадает в цитату.'
      : `Из ${total} ${ofPages(total)} с абзаца-ответа (20-90 слов с цифрой сразу после H1) ${n === 0 ? 'не начинается ни одна' : n === 1 ? 'начинается одна' : `начинаются ${n}`}. Именно этот абзац попадает в цитату.`),
    answerFirstOk: 'Каждая проверенная страница начинается с абзаца-ответа с цифрой.',
    fewH2: (n, total) => (total === 1
      ? 'У единственной проверенной страницы меньше трёх подзаголовков H2.'
      : `У ${n} из ${total} ${ofPages(total)} меньше трёх подзаголовков H2.`),
    noTables: 'На проверенных страницах нет таблиц. Таблица второй по цитируемости формат после первого абзаца.',
    homeOnly: 'Прочитать удалось только главную, поэтому эта область измерена по одной странице, а не по нескольким. Отвечающая карта сайта дала бы полную картину.',
    datesMissing: (n, total) => (total === 1
      ? 'Единственная проверенная страница не показывает дату публикации или изменения. Системы предпочитают источники, которые можно датировать.'
      : `${n} из ${total} ${ofPages(total)} не ${n === 1 ? 'показывает' : 'показывают'} дату публикации или изменения. Системы предпочитают источники, которые можно датировать.`),
    datesOk: 'Проверенные страницы показывают даты публикации.',
    noFigures: 'На проверенных страницах нет цифр, поэтому и источники называть нечему.',
    sourcesMissing: (n, total) => (total === 1
      ? 'Единственная проверенная страница с цифрами не называет, откуда они («по данным», «источник»).'
      : `${n} из ${total} ${ofPages(total)} ${n === 1 ? 'приводит' : 'приводят'} цифры, не называя, откуда они («по данным», «источник»).`),
    sourcesOk: 'Каждая проверенная страница с цифрами называет их источник.',
    sitemapNoLastmod: 'В карте сайта нет дат изменения (lastmod).',
    sitemapTimedOut: 'Карта сайта не ответила вовремя, поэтому её не проверяли. На оценку это не влияет ни в какую сторону.',
    sitemapMissing: 'XML-карта сайта не найдена ни по обычным адресам, ни в robots.txt.',
  },
};

function isPrivateHost(host) {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  return h.includes(':') || h.startsWith('[');
}

export function normaliseInput(input) {
  let s = String(input || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || isPrivateHost(u.hostname)) return null;
  u.hash = ''; u.search = '';
  return u.href;
}

async function get(url, { timeout = 6000, method = 'GET' } = {}) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout);
  const started = Date.now();
  try {
    const res = await fetch(url, { method, redirect: 'follow', signal: c.signal, headers: { 'user-agent': UA, accept: 'text/html,application/xml,text/plain,*/*' } });
    let text = '';
    if (method === 'GET') { const buf = await res.arrayBuffer(); text = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, MAX_BODY)); }
    return { ok: res.ok, status: res.status, url: res.url, type: res.headers.get('content-type') || '', text, ms: Date.now() - started };
  } catch (e) { return { ok: false, status: 0, url, type: '', text: '', ms: Date.now() - started, error: e.name === 'AbortError' ? 'timeout' : 'unreachable' }; }
  finally { clearTimeout(t); }
}

const strip = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const attr = (html, re) => { const m = html.match(re); return m ? m[1].trim() : ''; };

export function parseRobots(text) {
  const blocks = []; let cur = null;
  for (const raw of (text || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
    const key = m[1].toLowerCase(); const val = m[2].trim();
    if (key === 'user-agent') { if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; blocks.push(cur); } cur.agents.push(val.toLowerCase()); }
    else if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push({ key, val });
  }
  const signal = (text.match(/^content-signal:\s*(.+)$/im) || [])[1] || '';
  return { blocks, signal };
}

/** Effective verdict for one agent: the most specific block wins, then the star block, then allowed. */
export function agentVerdict(robots, agent) {
  const own = robots.blocks.find((b) => b.agents.includes(agent));
  const star = robots.blocks.find((b) => b.agents.includes('*'));
  const block = own || star;
  if (!block) return 'allowed';
  const fullBlock = block.rules.some((r) => r.key === 'disallow' && r.val === '/') && !block.rules.some((r) => r.key === 'allow' && r.val === '/');
  return fullBlock ? 'blocked' : 'allowed';
}

/*
 * Source phrases and figure units in English and Russian. A Russian page that writes «по данным
 * Росстата, 12 500 ₽» names a source and states a figure just as an English one does, and the
 * check must see both, or every Russian site loses the same five points for no reason. \b is
 * ASCII-only in JavaScript, so the Cyrillic words are fenced with letter lookarounds instead.
 */
const SOURCE_RE = /(?<!\p{L})(according to|source:|sources:|data from|reported by|published by|registry|statistics office|central bank|по данным|источник:|источники:|согласно|по информации|по сведениям|росстат|центробанк|банк россии|росреестр|минфин|минэкономразвития)(?!\p{L})/giu;
const FIGURE_RE = /\d[\d,.]*\s*(%|percent|процент\w*|[A-Z]{3}\b|km|км|m²|м²|sqm|кв\.?\s?м|min|мин|тыс|млн|млрд|₽|руб)/gu;

function analysePage(html, url) {
  const head = html.slice(0, 200_000);
  const title = strip(attr(head, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const description = attr(head, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || attr(head, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const robotsMeta = attr(head, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i).toLowerCase();
  const canonical = attr(head, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) || attr(head, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const ogTitle = /property=["']og:title["']/i.test(head);
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const types = new Set();
  for (const block of ld) for (const m of block.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)) types.add(m[1]);
  const datePublished = attr(head, /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']*)["']/i) || (ld.join('\n').match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1] || '';
  const dateModified = attr(head, /<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']*)["']/i) || (ld.join('\n').match(/"dateModified"\s*:\s*"([^"]+)"/) || [])[1] || '';
  // Site chrome is dropped so it cannot be counted as content, with one exception that matters:
  // an article's title block is usually <header><h1>…</h1><p>the answer…</p></header>. Stripping
  // every <header> deleted exactly the paragraph this check looks for, so a page that did open
  // with an answer scored as if it had none. Keep any header that carries the H1.
  const stripChrome = (h) => h
    .replace(/<(nav|footer|aside)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, (block) => (/<h1[\s>]/i.test(block) ? block : ' '));
  const bodyHtml = stripChrome((html.match(/<body[\s\S]*<\/body>/i) || [html])[0]);
  const text = strip(bodyHtml);
  const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  const h1 = strip((bodyHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || ['', ''])[1]);
  const h2Count = (bodyHtml.match(/<h2[\s>]/gi) || []).length;
  const tables = (bodyHtml.match(/<table[\s>]/gi) || []).length;
  const afterH1 = bodyHtml.split(/<\/h1>/i)[1] || '';
  const firstPara = strip((afterH1.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || ['', ''])[1]);
  const firstParaWords = (firstPara.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  const answerFirst = firstParaWords >= 20 && firstParaWords <= 90 && /\d/.test(firstPara);
  const sourcePhrases = (text.match(SOURCE_RE) || []).length;
  const numbers = (text.match(FIGURE_RE) || []).length;
  return { url, title, description, robotsMeta, canonical, ogTitle, schemaTypes: [...types], datePublished, dateModified, words, h1, h2Count, tables, firstPara: firstPara.slice(0, 220), answerFirst, sourcePhrases, numbers, noai: /noai|noimageai/.test(robotsMeta) };
}

async function readSitemap(origin, robotsText, timeoutFn = () => 3000) {
  const fromRobots = [...(robotsText || '').matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const candidates = fromRobots.length
    ? [...fromRobots.slice(0, 2), `${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`, `${origin}/sitemap.xml`]
    : [`${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`, `${origin}/sitemap.xml`];
  /*
   * "We ran out of time" and "there is no sitemap" are different answers and used to score the
   * same. A slow response once cost a real site three points and made the same site score 78, 81
   * and 84 on different days, which is the one thing a number we sell must never do.
   */
  let timedOut = false;
  for (const u of [...new Set(candidates)]) {
    if (timeoutFn() < 500) { timedOut = true; break; }
    const r = await get(u, { timeout: timeoutFn() });
    if (r.error === 'timeout') { timedOut = true; continue; }
    if (!r.ok || !/<(urlset|sitemapindex)/.test(r.text)) continue;
    let locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    let lastmod = /<lastmod>/.test(r.text);
    if (/<sitemapindex/.test(r.text) && locs.length && timeoutFn() > 500) {
      const child = await get(locs[0], { timeout: timeoutFn() });
      if (child.ok) { locs = [...child.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]); lastmod = lastmod || /<lastmod>/.test(child.text); }
    }
    return { found: true, url: u, count: locs.length, lastmod, pages: locs.filter((l) => !/\.(xml|pdf|jpe?g|png)$/i.test(l)) };
  }
  return { found: false, url: '', count: 0, lastmod: false, pages: [], timedOut };
}

export async function checkVisibility(input, { budgetMs = 8500, lang = 'en' } = {}) {
  const T = MESSAGES[lang] || MESSAGES.en;
  const agentLabel = (a) => (lang === 'ru' ? a.labelRu : a.label);
  const started = Date.now();
  const deadline = started + budgetMs;
  const left = () => deadline - Date.now();
  const url = normaliseInput(input);
  if (!url) return { ok: false, error: T.badInput };
  const origin = new URL(url).origin; const host = new URL(url).host;
  const [home, robotsRes, llmsRes] = await Promise.all([get(url, { timeout: Math.min(6000, left() - 300) }), get(`${origin}/robots.txt`, { timeout: Math.min(4000, left() - 300) }), get(`${origin}/llms.txt`, { timeout: Math.min(4000, left() - 300) })]);
  if (!home.ok || !/html/i.test(home.type)) return { ok: false, error: home.error === 'timeout' ? T.tooSlow : T.badAnswer(home.status, url) };
  const homePage = analysePage(home.text, home.url);
  const robots = parseRobots(robotsRes.ok ? robotsRes.text : '');
  const sitemap = left() > 1500 ? await readSitemap(origin, robotsRes.ok ? robotsRes.text : '', () => Math.min(3000, left() - 300)) : { found: false, url: '', count: 0, lastmod: false, pages: [], skipped: true };
  let sampled = [];
  if (left() > 2000 && sitemap.pages.length) {
    const norm = (u) => u.replace(/\/$/, '').toLowerCase();
    const picks = sitemap.pages.filter((p) => norm(p) !== norm(home.url) && p.startsWith(origin)).sort((a, b) => b.length - a.length).slice(0, 12).filter((_, i) => i % 4 === 0).slice(0, 3);
    const rs = await Promise.all(picks.map((p) => get(p, { timeout: Math.min(4000, left() - 300) })));
    sampled = rs.filter((r) => r.ok && /html/i.test(r.type)).map((r) => analysePage(r.text, r.url));
  }
  const pages = [homePage, ...sampled];

  // llms.txt
  const llmsIsText = llmsRes.ok && !/<html/i.test(llmsRes.text.slice(0, 400));
  const llmsLinks = llmsIsText ? [...llmsRes.text.matchAll(/https?:\/\/[^\s)\]>]+/g)].map((m) => m[0]) : [];
  const llmsForeign = llmsLinks.filter((l) => { try { return !new URL(l).host.endsWith(host.replace(/^www\./, '')); } catch { return false; } });

  // Area 1: access for AI crawlers (25)
  const verdicts = AI_AGENTS.map((a) => ({ ...a, verdict: agentVerdict(robots, a.agent) }));
  const blockedSearch = verdicts.filter((v) => v.kind === 'search' && v.verdict === 'blocked');
  const blockedTrain = verdicts.filter((v) => v.kind === 'train' && v.verdict === 'blocked');
  const starBlocked = agentVerdict(robots, '__none__') === 'blocked';
  const noai = pages.some((p) => p.noai);
  let access = 25;
  if (starBlocked) access = 0; else { access -= Math.min(15, blockedSearch.length * 4); access -= Math.min(8, blockedTrain.length * 2); if (noai) access -= 5; }
  access = Math.max(0, access);
  const accessFindings = [];
  if (starBlocked) accessFindings.push({ id: 'robots-all-blocked', level: 'fail', text: T.robotsAllBlocked });
  if (blockedSearch.length) accessFindings.push({ id: 'robots-fetchers-blocked', level: 'fail', text: T.fetchersBlocked(blockedSearch.map(agentLabel).join(', ')) });
  if (blockedTrain.length) accessFindings.push({ id: 'robots-training-blocked', level: 'warn', text: T.trainingBlocked(blockedTrain.map(agentLabel).join(', ')) });
  if (noai) accessFindings.push({ id: 'noai-meta', level: 'warn', text: T.noaiMeta });
  if (!accessFindings.length) accessFindings.push({ level: 'pass', text: T.allAllowed(AI_AGENTS.length, robots.signal) });

  // Area 2: agent index (15)
  let index = 0; const indexFindings = [];
  if (!llmsRes.ok) indexFindings.push({ id: 'llms-missing', level: 'fail', text: T.llmsMissing });
  else if (!llmsIsText) { index = 3; indexFindings.push({ id: 'llms-not-text', level: 'fail', text: T.llmsNotText }); }
  else if (llmsLinks.length && llmsForeign.length > llmsLinks.length / 2) { index = 5; indexFindings.push({ id: 'llms-foreign', level: 'fail', text: T.llmsForeign([...new Set(llmsForeign.map((l) => new URL(l).host))].slice(0, 3).join(', ')) }); }
  else { index = llmsLinks.length >= 5 ? 15 : 10; indexFindings.push({ level: 'pass', text: T.llmsOk(llmsLinks.length) }); }

  // Area 3: entity and structure (20)
  const allTypes = new Set(pages.flatMap((p) => p.schemaTypes));
  const hasOrg = [...allTypes].some((t) => /Organization|Corporation|NGO|EducationalOrganization|GovernmentOrganization|MedicalOrganization|NewsMediaOrganization|Person|LocalBusiness|RealEstateAgent|Dentist|Physician|Hospital|Pharmacy|VeterinaryCare|LegalService|Attorney|Notary|AccountingService|InsuranceAgency|FinancialService|BankOrCreditUnion|AutomotiveBusiness|AutoRepair|AutoDealer|HomeAndConstructionBusiness|Plumber|Electrician|RoofingContractor|HVACBusiness|HousePainter|Locksmith|MovingCompany|GeneralContractor|Restaurant|FoodEstablishment|CafeOrCoffeeShop|Bakery|BarOrPub|LodgingBusiness|Hotel|TravelAgency|HealthAndBeautyBusiness|BeautySalon|HairSalon|DaySpa|NailSalon|TattooParlor|SportsActivityLocation|HealthClub|Gym|ProfessionalService|Store|ClothingStore|GroceryStore|HardwareStore|FurnitureStore|JewelryStore|PetStore|ChildCare|EmploymentAgency|SelfStorage|Library|Museum|EntertainmentBusiness|MedicalClinic|DentalClinic|Optician|PhysicalTherapy|NutritionService|EmergencyService|ITService|WebDesignService|MarketingAgency|AdvertisingAgency/.test(t));
  const hasFaq = allTypes.has('FAQPage');
  const hasArticle = [...allTypes].some((t) => /Article|BlogPosting|NewsArticle/.test(t));
  /*
   * A page does not have to be an article to be quotable. Asking every site for Article schema
   * marks a correctly typed service, shop, course or job page as missing something, which is the
   * same mistake the check once made by refusing "Dentist" as a business type. What an answer
   * engine needs is a page-level type it can name, so any of these earns the same points.
   */
  const PAGE_TYPES = /^(Service|Product|Course|Event|HowTo|Recipe|SoftwareApplication|WebApplication|MobileApplication|JobPosting|Book|Review|QAPage|MedicalWebPage|CollectionPage|ItemPage|AboutPage|ProfilePage)$/;
  const pageType = [...allTypes].find((t) => PAGE_TYPES.test(t)) || null;
  let entity = 0; const entityFindings = [];
  if (hasOrg) { entity += 8; entityFindings.push({ level: 'pass', text: T.orgOk }); } else entityFindings.push({ id: 'schema-org-missing', level: 'fail', text: T.orgMissing });
  if (hasFaq) { entity += 5; entityFindings.push({ level: 'pass', text: T.faqOk }); } else entityFindings.push({ id: 'schema-faq-missing', level: 'warn', text: T.faqMissing });
  if (hasArticle) {
    entity += 3;
    entityFindings.push({ level: 'pass', text: T.articleOk });
  } else if (pageType) {
    entity += 3;
    entityFindings.push({ level: 'pass', text: T.pageTypeOk(pageType) });
  } else if (sampled.length) {
    entityFindings.push({ id: 'schema-article-missing', level: 'warn', text: T.pageTypeMissing });
  }
  if (homePage.canonical) entity += 2; else entityFindings.push({ id: 'canonical-missing', level: 'warn', text: T.canonicalMissing });
  if (homePage.ogTitle) entity += 2; else entityFindings.push({ id: 'og-missing', level: 'warn', text: T.ogMissing });

  // Area 4: answer-first content (25)
  const contentPages = sampled.length ? sampled : [homePage];
  /* Say so. A score built from one page is not the same measurement as one built from four. */
  const homeOnly = !sampled.length;
  const thin = contentPages.filter((p) => p.words < 300).length;
  const answerFirst = contentPages.filter((p) => p.answerFirst).length;
  const structured = contentPages.filter((p) => p.h2Count >= 3).length;
  const withTables = contentPages.filter((p) => p.tables > 0).length;
  let content = 0; const contentFindings = [];
  content += Math.round(10 * (1 - thin / contentPages.length));
  if (thin) contentFindings.push({ id: 'thin-pages', level: thin === contentPages.length ? 'fail' : 'warn', text: T.thinPages(thin, contentPages.length) }); else contentFindings.push({ level: 'pass', text: T.avgWords(Math.round(contentPages.reduce((a, p) => a + p.words, 0) / contentPages.length)) });
  content += Math.round(8 * (answerFirst / contentPages.length));
  if (answerFirst < contentPages.length) contentFindings.push({ id: 'answer-first-missing', level: answerFirst ? 'warn' : 'fail', text: T.answerFirstMissing(answerFirst, contentPages.length) }); else contentFindings.push({ level: 'pass', text: T.answerFirstOk });
  content += Math.round(4 * (structured / contentPages.length)) + Math.round(3 * (withTables / contentPages.length));
  if (structured < contentPages.length) contentFindings.push({ id: 'few-h2', level: 'warn', text: T.fewH2(contentPages.length - structured, contentPages.length) });
  if (!withTables) contentFindings.push({ id: 'no-tables', level: 'warn', text: T.noTables });
  if (homeOnly) contentFindings.push({ level: 'warn', text: T.homeOnly });

  // Area 5: freshness and sources (15)
  const dated = contentPages.filter((p) => p.datePublished || p.dateModified).length;
  /*
   * Only a page that states figures can fail to attribute them. Docking a page for naming no
   * source for numbers it does not contain is not a measurement, it is a complaint, and the
   * finding said something untrue about the page.
   */
  const withFigures = contentPages.filter((p) => p.numbers > 0);
  const sourced = withFigures.filter((p) => p.sourcePhrases > 0).length;
  let trust = 0; const trustFindings = [];
  trust += Math.round(7 * (dated / contentPages.length));
  if (dated < contentPages.length) trustFindings.push({ id: 'dates-missing', level: dated ? 'warn' : 'fail', text: T.datesMissing(contentPages.length - dated, contentPages.length) }); else trustFindings.push({ level: 'pass', text: T.datesOk });
  if (!withFigures.length) {
    trust += 5;
    trustFindings.push({ level: 'pass', text: T.noFigures });
  } else {
    trust += Math.round(5 * (sourced / withFigures.length));
    if (sourced < withFigures.length) {
      trustFindings.push({ id: 'sources-missing', level: 'warn', text: T.sourcesMissing(withFigures.length - sourced, withFigures.length) });
    } else {
      trustFindings.push({ level: 'pass', text: T.sourcesOk });
    }
  }
  if (sitemap.found) {
    trust += sitemap.lastmod ? 3 : 1;
    if (!sitemap.lastmod) trustFindings.push({ id: 'sitemap-no-lastmod', level: 'warn', text: T.sitemapNoLastmod });
  } else if (sitemap.timedOut || sitemap.skipped) {
    // Not measured, so not scored down. Printing a low number for something we never read is the
    // error this check exists to avoid in other people's tools.
    trust += 3;
    trustFindings.push({ level: 'warn', text: T.sitemapTimedOut });
  } else {
    trustFindings.push({ level: 'fail', text: T.sitemapMissing });
  }

  const areas = [
    { id: 'access', label: T.area.access, score: access, max: 25, findings: accessFindings },
    { id: 'index', label: T.area.index, score: index, max: 15, findings: indexFindings },
    { id: 'entity', label: T.area.entity, score: entity, max: 20, findings: entityFindings },
    { id: 'content', label: T.area.content, score: content, max: 25, findings: contentFindings },
    { id: 'trust', label: T.area.trust, score: trust, max: 15, findings: trustFindings },
  ];
  const total = areas.reduce((a, x) => a + x.score, 0);
  const grade = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 45 ? 'C' : total >= 25 ? 'D' : 'E';
  const fixes = areas.flatMap((a) => a.findings.filter((f) => f.level === 'fail').map((f) => ({ id: f.id, area: a.label, text: f.text }))).concat(areas.flatMap((a) => a.findings.filter((f) => f.level === 'warn').map((f) => ({ id: f.id, area: a.label, text: f.text })))).slice(0, 3);
  return {
    ok: true, url: home.url, host, checkedAt: new Date().toISOString(), ms: Date.now() - started,
    score: total, grade, areas, fixes,
    sample: pages.map((p) => ({ url: p.url, title: p.title, words: p.words, answerFirst: p.answerFirst, dated: Boolean(p.datePublished || p.dateModified), schema: p.schemaTypes.slice(0, 4) })),
    sitemap: { found: sitemap.found, count: sitemap.count, lastmod: sitemap.lastmod, unchecked: Boolean(!sitemap.found && (sitemap.timedOut || sitemap.skipped)) },
    crawlers: verdicts.map((v) => ({ label: agentLabel(v), kind: v.kind, verdict: v.verdict })),
  };
}
