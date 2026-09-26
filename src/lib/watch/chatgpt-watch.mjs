/**
 * OperStack Watch: называет ли ChatGPT сайт подписчика, кого называет вместо него и что поправить.
 *
 * Простым языком. Раз в неделю мы задаём ChatGPT десять вопросов, которые задал бы покупатель этого
 * бизнеса, и пишем, назвал ли он сайт подписчика и кого назвал вместо. Вопросы придумываются один раз
 * по главной странице и дальше не меняются, иначе недели не сравнить. Под один вопрос, где подписчика
 * не назвали, пишется правка недели: готовый абзац только из фактов его сайта.
 *
 * Письма по заданию Максима от 25.09.2026 (OperStack_письма-подписчику_задание.md): отчёт с
 * разделением на конкурентов и прочих, правка недели, письма на 3-й и 5-й день пробной недели и
 * письмо «две недели без изменений». Каждое имя в письме взято из ответов ChatGPT этой недели,
 * каждое число посчитано, ни одной заглушки.
 *
 * Деньги: самая дешёвая модель и один поиск на вопрос, около 1,2 цента за вопрос. Разбор имён и
 * правка это ещё два коротких вызова без поиска. Бесплатная проверка сюда не ходит никогда.
 *
 * Env: OPENAI_API_KEY; WATCH_MODEL (по умолчанию gpt-5.4-nano); KIT_DOWNLOAD_SECRET для ссылок.
 */
import './log-redact.mjs';
import { createHmac } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { button, emailShell, note, p as par } from './email-shell.mjs';

const env = (k, d = '') => String(process.env[k] ?? d).trim();
const MODEL = () => env('WATCH_MODEL', 'gpt-5.4-nano');
export const QUESTIONS_PER_WEEK = 10;
const SITE = 'https://oper-stack.com';
export const MANAGE_URL = 'https://whop.com/@me/settings/orders/';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const hostOf = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return String(u); } };
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '');
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const weekday = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });

/*
 * Учёт расходов (задание 26.09.2026, п. 2.6 и 3): каждый вызов модели внутри metered() пишет
 * токены и поиски, цена считается по тарифам OpenAI со страницы цен, сверено 26.09.2026
 * (https://developers.openai.com/api/docs/pricing): за миллион токенов вход / кэш / выход,
 * веб-поиск 10 $ за тысячу запросов плюс найденный текст как токены входа.
 */
export const PRICES = {
  checkedAt: '2026-09-26',
  perMillion: { 'gpt-5.4-nano': [0.20, 0.02, 1.25], 'gpt-5.4-mini': [0.75, 0.075, 4.50], 'gpt-5.4': [2.50, 0.25, 15.00] },
  webSearchCall: 0.01,
};
const METER = new AsyncLocalStorage();
export function costOf(calls = []) {
  let usd = 0;
  for (const c of calls) {
    const [inp, cached, out] = PRICES.perMillion[c.model] || PRICES.perMillion['gpt-5.4'];
    usd += ((c.in - c.cached) * inp + c.cached * cached + c.out * out) / 1e6 + c.search * PRICES.webSearchCall;
  }
  return Math.round(usd * 1e6) / 1e6;
}
export async function metered(fn) {
  const store = { calls: [] };
  const result = await METER.run(store, fn);
  return { result, calls: store.calls, cost: costOf(store.calls) };
}

async function responses(body, timeoutMs = 60_000) {
  const key = env('OPENAI_API_KEY');
  if (!key) throw new Error('нет OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`OpenAI ${res.status}: ${data.error?.message || 'нет ответа'}`);
  const u = data.usage || {};
  METER.getStore()?.calls.push({ model: body.model, in: u.input_tokens || 0, cached: u.input_tokens_details?.cached_tokens || 0, out: u.output_tokens || 0, search: (data.output || []).filter((o) => o.type === 'web_search_call').length });
  return data;
}

const outputText = (data) => (data.output || []).filter((o) => o.type === 'message').flatMap((o) => o.content || []).map((c) => c.text || '').join('\n').trim();
const citations = (data) => (data.output || []).filter((o) => o.type === 'message').flatMap((o) => o.content || []).flatMap((c) => c.annotations || []).filter((a) => a.type === 'url_citation' && a.url).map((a) => a.url);
/** Адрес без меток utm и якоря: OpenAI дописывает ?utm_source=openai, и один сайт считался бы дважды. */
export const cleanUrl = (u) => { try { const x = new URL(u); [...x.searchParams.keys()].filter((k) => /^utm_/i.test(k)).forEach((k) => x.searchParams.delete(k)); x.hash = ''; return x.toString(); } catch { return String(u || ''); } };
/** Страницы, которые ChatGPT прочитал для ответа, с заголовком (задание «функции Watch», 1.1). */
const sourcesOf = (data) => {
  const seen = new Map();
  for (const a of (data.output || []).filter((o) => o.type === 'message').flatMap((o) => o.content || []).flatMap((c) => c.annotations || [])) {
    if (a.type !== 'url_citation' || !a.url) continue;
    const url = cleanUrl(a.url);
    if (!seen.has(url)) seen.set(url, { url, title: String(a.title || '').replace(/\s+/g, ' ').trim().slice(0, 160) });
  }
  return [...seen.values()];
};

async function json(prompt, schema, name, maxTokens = 2000, model = MODEL()) {
  const data = await responses({ model, input: prompt, reasoning: { effort: 'low' }, max_output_tokens: maxTokens, text: { format: { type: 'json_schema', name, schema, strict: true } } });
  return JSON.parse(outputText(data));
}

/** Страница как текст: заголовок, описание, H1 и сам текст. Для вопросов хватает начала, для правки нужен весь. */
/*
 * HTML-коды в тексте страницы: WordPress пишет апостроф как &#8217; и & как &#038;, Next.js апостроф
 * как &#x27;. Без раскодировки norm превращал их в цифры, и вставленная правка не находилась на
 * странице (ревизия 25.09.2026: письма «isn't on your site yet» клиенту, который её вставил).
 */
const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', rarr: '→', larr: '←', middot: '·', bull: '•', euro: '€', pound: '£', copy: '©', reg: '®', trade: '™', times: '×', deg: '°' };
export const decodeEntities = (s) => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m; }
  return NAMED_ENTITIES[e.toLowerCase()] ?? m;
}).replace(/\u00a0/g, ' ');
export async function readHomepage(url, limit = 2500) {
  const res = await fetch(url, { headers: { 'User-Agent': 'OperStack-Watch/1.0 (+https://oper-stack.com/)' }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  const html = await res.text();
  const pick = (re) => decodeEntities(html.match(re)?.[1] || '').replace(/\s+/g, ' ').trim();
  const raw = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const text = decodeEntities(raw).replace(/\s+/g, ' ').trim();
  return {
    lang: pick(/<html[^>]*\blang=["']?([a-zA-Z-]+)/i).slice(0, 2).toLowerCase() || 'en',
    title: pick(/<title[^>]*>([\s\S]*?)<\/title>/i),
    description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ''),
    text: text.slice(0, limit),
  };
}

/*
 * Вопрос не про работу клиента (раунд 3, пункт 3): для агентства продажи это вопросы про управление,
 * аренду, юристов и стройку. В них не бывает конкурентов, а «no» занижает результат.
 * «rental property selection» (выбор квартиры под сдачу) это покупка, поэтому слово «rental» само
 * по себе вопрос не выкидывает.
 */
export function offTopicQuestion(question, category = '') {
  if (!/propert|real estate|realty|estate|homes|condo|villa|недвиж/i.test(category)) return false;
  return /property management|rental management|manage (?:my|a|the|your)\b|\bmanagers?\b|\blegal\b|lawyer|law firm|notar|construction|builder|contractor|tenant|to rent\b|rent (?:it )?out|for rent\b|letting|developer representatives?/i.test(String(question || ''));
}
const QUESTION_RULE = (category) => (/propert|real estate|realty|estate|homes|condo|villa/i.test(category)
  ? 'Every question must be about the job this client does for a buyer: finding, comparing and choosing property to buy. No questions about property management, rentals to tenants, legal services, construction or developer representatives.'
  : 'Every question must be about the job this client itself does, not about neighbouring services.');

/** Замена вопросов не про работу клиента: столько же новых вопросов покупателя, без повторов. */
export async function replaceQuestions({ brand, category, city, lang = 'en', keep = [], bad = [] }) {
  if (!bad.length) return [];
  const schema = { type: 'object', additionalProperties: false, required: ['questions'], properties: { questions: { type: 'array', items: { type: 'string' }, minItems: bad.length, maxItems: bad.length } } };
  const out = await json([
    `Business: ${brand}, ${category}${city ? `, ${city}` : ''}.`,
    `These buyer questions are already used, do not repeat them: ${keep.map((q) => `"${q}"`).join('; ')}.`,
    `Write ${bad.length} new question${bad.length === 1 ? '' : 's'} a potential customer would type into ChatGPT when looking for such a business, without knowing the brand, whose natural answer is a list of businesses to use. ${QUESTION_RULE(category)} Never mention the brand. Write in ${lang === 'ru' ? 'Russian' : 'English'}.`,
  ].join('\n'), schema, 'watch_replace', 800);
  return out.questions.map((q) => String(q).replace(/\s*[—–]\s*/g, ': ').trim()).filter((q) => q && !offTopicQuestion(q, category));
}

/** Кто этот бизнес и какие вопросы задал бы его покупатель, без имени бренда. Профиль сайта и вопросы покупателя. count: 10 для Watch, 3 для бесплатной проверки (задание 26.09.2026, п. 3). */
export async function deriveProfile(url, { count = QUESTIONS_PER_WEEK, hint = '' } = {}) {
  const page = await readHomepage(url);
  const lang = page.lang === 'ru' ? 'ru' : 'en';
  const schema = {
    type: 'object', additionalProperties: false, required: ['brand', 'category', 'city', 'country', 'questions'],
    properties: {
      brand: { type: 'string' }, category: { type: 'string' }, city: { type: ['string', 'null'] }, country: { type: ['string', 'null'] },
      questions: { type: 'array', items: { type: 'string' }, minItems: count, maxItems: count },
    },
  };
  const profile = await json([
    `Website: ${url}`, `Title: ${page.title}`, `Description: ${page.description}`, `H1: ${page.h1}`, `Text: ${page.text}`, '',
    ...(hint ? [`The owner says what they sell and where: "${String(hint).slice(0, 120)}". Use it for the category, city and country.`] : []),
    'Work out: the brand name as the site writes it; what the business sells, in 2 to 6 words; the city it serves if it is a local business, else null; the country, else null.',
    'Questions must be about the job this business does for its customer, not about neighbouring services (for a property agency or buyer\'s advisor: no property management, rentals to tenants, legal services, construction or developer representatives).',
    `Then write exactly ${count} questions that a potential customer of this business would type into ChatGPT when looking for such a business, without knowing the brand. Every question must be one whose natural answer is a list of businesses, firms, services or products to use, so that ChatGPT names names. Mix: "best ... in <city>", "who can help me ...", "which ... should I use for <typical customer>", "top ... for ...", "alternatives to ...". No questions about prices, laws or how-to steps that are answered without naming providers. The questions are about the kind of business this client is: work out that kind first, then write only questions whose answer would list businesses of that kind. Never mention the brand name or its own slogans. Write the questions in ${lang === 'ru' ? 'Russian' : 'English'}.`,
  ].join('\n'), schema, 'watch_profile');
  // Длинных тире нет нигде, и в вопросах тоже: «before buying—who should I use?» (26.09.2026).
  profile.questions = profile.questions.map((q) => String(q).replace(/\s*[—–]\s*/g, ': ').trim()).filter(Boolean).slice(0, count);
  // Вопросы не про работу клиента меняются сразу, до первого прогона (раунд 3, пункт 3.1).
  // Вопрос с названием самого бизнеса («Alternatives to OperStack…», 26.09.2026) не про поиск: меняем.
  const named = (q) => Boolean(profile.brand) && new RegExp(`(^|[^\\p{L}\\p{N}])${String(profile.brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu').test(q);
  const bad = profile.questions.filter((q) => offTopicQuestion(q, profile.category) || named(q));
  if (bad.length) {
    const keep = profile.questions.filter((q) => !bad.includes(q));
    const fresh = await replaceQuestions({ ...profile, lang, keep, bad }).catch(() => []);
    profile.questions = [...keep, ...fresh].slice(0, count);
  }
  return { ...profile, lang };
}

/**
 * Строки ответа в названия: без номеров, звёздочек, ссылок и пояснений. Уточнение в скобках из
 * названия уходит, в том числе незакрытое («CBRE Thailand (Property Management» после разреза по
 * двоеточию, задание 25.09.2026, 2.3), и вместе с пояснением после тире сохраняется как заметка:
 * по ней разбор имён понимает, за что ChatGPT эту фирму назвал. Капс и написание не трогаем.
 */
/** Похоже на название фирмы, а не на строку-пояснение из ответа ChatGPT (кавычки, «reference», длинная фраза). */
export const validName = (name) => Boolean(name) && name.length <= 80 && !/[?"“”«»]/.test(name) && name.split(/\s+/).length <= 7 && !/\b(reference|workflow|checklist|guide|process|option|options|resources?)\b/i.test(name) && !/^(here|these|i would|i'd|sure|note|вот|я бы)/i.test(name);
const withoutParentheses = (value) => {
  let depth = 0; let out = '';
  for (const c of String(value || '')) {
    if (c === '(') { depth += 1; continue; }
    if (c === ')') { depth = Math.max(0, depth - 1); continue; }
    if (depth === 0) out += c;
  }
  return out;
};
export const cleanName = (n) => withoutParentheses(n).replace(/\s+\/\s+.*$/, '').replace(/\s+(?:sales office|office|team) for .*$/i, '').replace(/[.,;:]+$/, '').trim();
export function namedLines(text) {
  return String(text || '')
    .split('\n')
    .map((l) => {
      const line = l
        .replace(/\(\[[^\]]*\]\([^)]*\)\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
        .replace(/\*\*/g, '');
      const [head, ...tail] = line.split(/\s[—–-]\s|:\s/);
      const inParens = [...head.matchAll(/\(([^)]*)\)?/g)].map((m) => m[1].trim()).filter(Boolean);
      const name = cleanName(head);
      const note = [...inParens, tail.join(': ').trim()].filter(Boolean).join('; ').slice(0, 160);
      return { name, note };
    })
    .filter(({ name }) => validName(name))
    .slice(0, 12);
}
export function namesFrom(text) {
  return namedLines(text).map((x) => x.name);
}

/**
 * Ключ для склейки названий одной фирмы: «Suwanvaralaw», «Suwanvara Law Firm» и
 * «Suwanvara Law Firm (Phuket)» это одна фирма. Убираем регистр, знаки, юридические хвосты и
 * город в конце. Два ключа склеиваются, если один начало другого и короткий не короче шести букв.
 */
const TAILS = /\b(the|law\s*firm|law\s*office|law\s*offices|lawyers?|co|ltd|limited|company|inc|llc|llp|plc|pte|group|holdings|international|capital|asia|thailand|phuket|bangkok|dubai|bali|uk|usa)\b/gi;
export function nameKey(name) {
  return norm(String(name || '').replace(/\([^)]*\)/g, ' ').replace(/[.,]/g, ' ').replace(TAILS, ' '));
}
/*
 * Основное слово без родового хвоста (раунд 3, пункт 2.2): «Issara Real Estate» и «Issara Property»
 * это «issara». Склеиваем по нему, только если оно не короче пяти букв: «Siam» и «Nova» слишком
 * общие, а «Phuket Property Manager» и «Pearl Property Phuket» дают разное («manager» и «pearl»).
 */
const GENERIC = /\b(real\s*estate|realty|properties|property|estates?|homes?)\b/gi;
export const coreKey = (name) => norm(String(name || '').replace(/\([^)]*\)/g, ' ').replace(/[.,]/g, ' ').replace(TAILS, ' ').replace(GENERIC, ' '));
export function mergeNames(allNames) {
  const clusters = [];
  for (const raw of allNames) {
    const name = String(raw || '').trim();
    const key = nameKey(name);
    const core = coreKey(name);
    if (!key) continue;
    const c = clusters.find((x) => x.key === key || (Math.min(x.key.length, key.length) >= 6 && (x.key.startsWith(key) || key.startsWith(x.key))) || (core.length >= 5 && x.core === core));
    if (c) { c.names.add(name); if (name.length > c.display.length) c.display = name; if (key.length < c.key.length) c.key = key; }
    else clusters.push({ key, core, display: name, names: new Set([name]) });
  }
  const map = new Map();
  for (const c of clusters) for (const n of c.names) map.set(n, c.display);
  return (n) => map.get(String(n || '').trim()) ?? String(n || '').trim();
}

/** Назван ли сайт: по имени бренда, по имени домена или по ссылке на сам сайт среди источников. */
export function isNamed({ names = [], text = '', cited = [] }, { brand = '', url = '' }) {
  const host = hostOf(url);
  const root = norm(host.split('.').slice(0, -1).join('.') || host);
  const b = norm(brand);
  const inNames = names.some((n) => {
    const x = norm(n);
    if (!x) return false;
    return (b && (x.includes(b) || (b.includes(x) && x.length >= 5))) || (root.length >= 4 && x.includes(root));
  });
  const inText = (b.length >= 4 && norm(text).includes(b)) || (root.length >= 4 && norm(text).includes(root));
  const inCited = cited.some((u) => hostOf(u) === host);
  return { named: inNames || inText, cited: inCited };
}

/** Строки ответа, где назван клиент: по ним ставится тональность (1.3). Не больше двух строк и 400 знаков. */
export function mentionOf(text, { brand = '', url = '' }) {
  const host = hostOf(url); const root = norm(host.split('.').slice(0, -1).join('.') || host); const b = norm(brand);
  const hit = (t) => (b.length >= 4 && norm(t).includes(b)) || (root.length >= 4 && norm(t).includes(root)) || namedLines(t).some(({ name }) => isNamed({ names: [name] }, { brand, url }).named);
  const parts = String(text || '').split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map((x) => x.replace(/^[\s*#>\d.)-]+/, '').trim()).filter(Boolean);
  return parts.filter(hit).slice(0, 2).join(' ').slice(0, 400);
}

/** Один вопрос: одна модель, один поиск. */
export async function askOne(question, target) {
  const data = await responses({
    model: MODEL(), tools: [{ type: 'web_search' }], max_tool_calls: 1, reasoning: { effort: 'low' }, max_output_tokens: 900,
    input: `${question}\nName the specific businesses you would recommend, one per line.`,
  });
  const text = outputText(data);
  const cited = citations(data);
  const sources = sourcesOf(data);
  const lines = namedLines(text);
  const names = lines.map((x) => x.name);
  const notes = Object.fromEntries(lines.filter((x) => x.note).map((x) => [x.name, x.note]));
  return { question, names, notes, cited, sources, mention: mentionOf(text, target), ...isNamed({ names, text, cited }, target) };
}

/** Вопросы разом, а не по очереди: бесплатная проверка ждёт ответа на экране (задание 26.09.2026, п. 3). */
export async function askParallel(questions, target) {
  return Promise.all(questions.map((q) => askOne(q, target).catch(() => ({ question: q, names: [], cited: [], named: null, error: true }))));
}

/** Все вопросы недели. Упавший вопрос не валит неделю: он записан как «не спросили». */
export async function askAll(questions, target, log = () => {}) {
  const out = [];
  for (const q of questions.slice(0, QUESTIONS_PER_WEEK)) {
    try { out.push(await askOne(q, target)); }
    catch (e) { log(`  вопрос не задан: ${e.message}`); out.push({ question: q, names: [], cited: [], named: null, error: true }); }
  }
  return out;
}

/**
 * Кто из названных такой же бизнес, как подписчик, а кто нет. Один короткий вызов на неделю.
 *
 * Правило (задание Максима 25.09.2026, 2.1-2.2): конкурент только тот, кто делает для того же
 * покупателя ту же работу, что клиент, и кого покупатель выбрал бы вместо него. Юристы, порталы,
 * застройщики своих проектов, стройка, туризм, данные, банки, СМИ и каталоги не конкуренты, если
 * клиент сам не такой. Управляющие компании работают с владельцем после покупки, поэтому агентству
 * или консультанту покупателя они не конкуренты; фирма, у которой есть и то и другое, считается по
 * тому, за что ChatGPT её назвал (заметка из ответа). Непонятное имя идёт в конкуренты, только если
 * само название говорит, что это тот же вид бизнеса, иначе в «unclear businesses».
 * Модель не ответила: все считаются конкурентами, как раньше; письмо тогда не делит, но и не врёт.
 */
export async function classifyNames(names, { category = '', city = '', brand = '' } = {}, context = {}) {
  const list = [...new Set(names.filter(Boolean))].slice(0, 80);
  if (!list.length) return {};
  const schema = {
    type: 'object', additionalProperties: false, required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'competitor', 'type'], properties: { name: { type: 'string' }, competitor: { type: 'boolean' }, type: { type: 'string' } } } } },
  };
  const property = isPropertyClient(category);
  const line = (n) => {
    const c = context[n] || {};
    const said = [...new Set(c.notes || [])].slice(0, 3).join('; ');
    return `- ${n}${said ? ` (ChatGPT said: ${said})` : ''}`;
  };
  try {
    const out = await json([
      `Our client: ${brand}, ${category}${city ? `, ${city}` : ''}.`,
      'For each name below give:',
      '- type: what kind of business it is, 1 to 3 plain lowercase words, plural, the same wording for the same kind (for example "real estate agencies", "developers", "property portals", "law firms", "property managers", "travel agencies", "data companies").',
      '- competitor: true only when it does the same job as our client for the same customer, so a buyer would choose it instead of our client. Otherwise false.',
      'Never competitors unless our client is that same kind: law firms, notaries, banks and lenders, portals and listing sites (for example FazWaz, DDproperty, Hipflat, PropertyGuru, Rightmove, Zillow, Idealista), marketplaces, media, directories, construction firms, travel, data and software companies, government bodies.',
      ...(property ? ['Developers selling their own projects are not competitors of an agency or a buyer\'s advisor. Property managers and rental managers work for owners after the purchase, so they are not competitors either.'] : []),
      'A name that says what it is decides it: law, legal, notary, travel, data, construction or engineering in the name means that kind, not a competitor. Words like Capital, Global, Asia or Group decide nothing on their own.',
      'Use what you know about the business and what ChatGPT said about it. Do not guess the kind from the buyer question: buyers\' questions list all sorts of businesses.',
      ...(property ? ['A name with Real Estate, Realty, Realtor, Estate, Estates, Property, Properties or Homes counts as a real estate agency unless what ChatGPT said or what you know says it is a developer, portal or property manager.'] : []),
      'If you still cannot tell what it is, competitor false and type "unclear businesses".',
      '', ...list.map(line),
    // Раз в неделю, поэтому модель посильнее: самая дешёвая путала виды бизнеса.
    ].join('\n'), schema, 'watch_names', 5000, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
    // Страховка кодом по виду, который назвала модель, и по самому названию: чужой вид не бывает
    // конкурентом, кроме случая, когда клиент сам такой. Если модель ошиблась и в виде, и название
    // молчит, страховка не поможет: такие случаи честно показаны в письме с типом.
    return Object.fromEntries(out.items.map((x) => [x.name, settleType({ name: x.name, type: x.type, competitor: x.competitor, notes: context[x.name]?.notes || [], category })]));
  } catch { return {}; }
}
/**
 * Итоговый вид и «конкурент или нет» для одного имени, по ответу модели и правилам кода. Юристом или
 * турфирмой имя записывается, только если это сказано в названии или ChatGPT прямо так её назвал;
 * иначе это сомнение и «Could not identify» (раунд 3, пункт 2.1 и 2.5).
 */
export function settleType({ name, type: modelType, competitor, notes = [], category = '' }) {
  const own = String(category || '').toLowerCase();
  const never = NOT_COMPETITOR_KINDS.filter((k) => !k.test(own));
  const byName = NAME_SAYS.find(([re]) => re.test(name) && !re.test(own));
  let type = byName ? byName[1] : String(modelType || '').toLowerCase();
  const said = notes.join(' ');
  if (!byName && /\blaw\b|legal|notar|attorney|solicitor/.test(type) && !NOTE_SAYS_LAW.test(said)) type = 'unclear businesses';
  if (!byName && /travel|touris/.test(type) && !/\btravel|\btours?\b|touris/i.test(said)) type = 'unclear businesses';
  return { competitor: !byName && type !== 'unclear businesses' && Boolean(competitor) && !never.some((k) => k.test(type)), type };
}
const isPropertyClient = (category) => /propert|real estate|realty|estate|homes|condo|villa|недвиж/i.test(String(category || ''));
const NAME_SAYS = [[/law\b|\blaw|legal|lawyer|notar|attorney|solicitor/i, 'law firms'], [/\btravel|\btours?\b|touris/i, 'travel agencies']];
const NOTE_SAYS_LAW = /\blaw firm|\blawyers?\b|\battorneys?\b|\bsolicitors?\b|\bnotar/i;
// Название само говорит «агентство» или «управляющая»: так решается роль, когда пояснения нет.
const AGENCY_NAME = /real estate|realty|realtor|\bestates?\b|propert|\bhomes?\b/i;
const MANAGER_NAME = /manag|rental|letting/i;

/** Имя к заметкам ChatGPT и вопросам, где оно названо: по ним разбор решает спорные случаи. */
export function nameContext(answers) {
  const ctx = {};
  for (const a of answers) for (const n of a.names || []) {
    const c = (ctx[n] ||= { notes: [], questions: [] });
    if (a.notes?.[n]) c.notes.push(a.notes[n]);
    c.questions.push(a.question);
  }
  return ctx;
}

/*
 * Разбор для клиента из недвижимости, раунд 4 (задание Максима, пункт 1). Решают название и фраза
 * ChatGPT про эту фирму в этом ответе, а не слова модели-классификатора:
 * 1. law, legal, notary в названии: юристы (правило раунда 3);
 * 2. ChatGPT в этом ответе прямо описал фирму как юристов, управляющую компанию, застройщика своих
 *    проектов или портал / сайт объявлений / marketplace: не конкурент, и фраза сохраняется;
 * 3. Development / Developer в названии: застройщик (название говорит само);
 * 4. Property, Estate, Real Estate, Realty, Realtor, Homes, Invest, Villas, Condo в названии: конкурент;
 * 5. фраза описывает агентство (agency, agent, broker, buyer-side, shortlist, sourcing...): конкурент;
 * 6. фраза прямо описывает другой вид (данные, инвестфонд, стройка и проверки, туризм, СМИ): не
 *    конкурент, с фразой;
 * 7. название молчит и фразы нет: конкурент, только если модель знает фирму как агентство (включить
 *    знанием можно, исключить нельзя); иначе «Could not identify».
 * Вид «не конкурент» без фразы или названия-основания не ставится никогда.
 */
const LAW_NOTE = /\blaw firm|\blawyers?\b|\battorneys?\b|\bsolicitors?\b|\bnotar(?:y|ies|ial)\b|\blegal (?:services|firm|counsel|practice)\b/i;
const MANAGER_NOTE = /\b(?:property|rental|villa|condo|holiday|vacation|home)[\w &-]{0,24}management\b|\bmanagement (?:company|services?)\b|\bproperty manag|\brental manag|\bletting\b/i;
const DEVELOPER_NOTE = /\b(?:is|as) an? (?:property |real estate )?developer\b|^(?:an? |the )?(?:property |real estate )?developer\b(?![- ](?:due|data|registry|directory|websites?|track|checks?))|\bdeveloper of\b|\bdevelops\b|\bown projects?\b|\bbuilds? (?:its|their) own\b/i;
const PORTAL_NOTE = /\bportal\b|\blistings?\b|\bmarketplace\b|\bclassifieds?\b/i;
const AGENCY_NOTE = /\bagency\b|\bagents?\b|\bbrokers?\b|\bbrokerage\b|\brealtors?\b|buyer'?s?[- ]side|\bbuying assistance\b|\bsourcing\b|\bshortlists?\b|\bproperty (?:advis\w*|consult\w*|finder|search)\b|\bsales (?:for|of|team|office)\b/i;
const OTHER_NOTE = [
  [/\bdata (?:provider|platform|company|service)|\banalytics\b|\bresearch (?:firm|company)\b/i, 'data companies'],
  [/\binvestment (?:firm|fund|company|manager)|\bfund manager|\basset manag/i, 'investment firms'],
  [/\bconstruction\b|\bcontractors?\b|\bbuilders?\b|\bengineering\b|\binspections?\b/i, 'construction and inspection firms'],
  [/\btravel agency|\btour operator|\btours\b/i, 'travel agencies'],
  [/\bmedia\b|\bmagazine\b|\bnews site/i, 'media'],
];
/*
 * Известные порталы (раунд 5, ответ 1): всегда порталы, даже без фразы ChatGPT. Дополнять здесь.
 * Сравнение без регистра, пробелов и дефисов, по началу названия: «DDproperty Thailand» тоже портал.
 */
export const KNOWN_PORTALS = ['FazWaz', 'DDproperty', 'Hipflat', 'PropertyGuru', 'Dot Property', 'Thailand-Property', 'Thai Residential'];
const portalKey = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const isKnownPortal = (name) => KNOWN_PORTALS.some((p) => portalKey(name).startsWith(portalKey(p)));
const AGENCY_WORDS = /propert|estate|realty|realtor|\bhomes?\b|invest|villas?\b|condos?\b/i;
const DEVELOPER_NAME = /\bdevelop(?:ment|ers?)\b/i;
const LAW_NAME = /law\b|\blaw|legal|lawyer|notar|attorney|solicitor/i;

export function decideMention({ name, note = '', knownAgency = false }) {
  if (LAW_NAME.test(name)) return { competitor: false, type: 'law firms', why: `the name says it: ${name}`, rank: 2 };
  if (isKnownPortal(name)) return { competitor: false, type: 'property portals', why: `known portal: ${name}`, rank: 2 };
  // «listings» и «agency» в одной фразе: конкурент (раунд 5, B2), дальше решает правило агентства.
  const mixed = PORTAL_NOTE.test(note) && AGENCY_NOTE.test(note);
  for (const [re, type] of [[LAW_NOTE, 'law firms'], [MANAGER_NOTE, 'property managers'], [DEVELOPER_NOTE, 'developers'], [PORTAL_NOTE, 'property portals']]) {
    if (re === PORTAL_NOTE && mixed) continue;
    if (re.test(note)) return { competitor: false, type, why: note, rank: 3 };
  }
  if (DEVELOPER_NAME.test(name)) return { competitor: false, type: 'developers', why: `the name says it: ${name}`, rank: 2 };
  if (AGENCY_NOTE.test(note)) return { competitor: true, type: 'real estate agencies', why: note, rank: 3 };
  if (AGENCY_WORDS.test(name)) return { competitor: true, type: 'real estate agencies', why: `the name says it: ${name}`, rank: 2 };
  for (const [re, type] of OTHER_NOTE) if (re.test(note)) return { competitor: false, type, why: note, rank: 3 };
  if (knownAgency) return { competitor: true, type: 'real estate agencies', why: 'known agency', rank: 1 };
  return { competitor: false, type: 'unclear businesses', why: '', rank: 0 };
}

/*
 * Одна фирма, один вид на весь прогон (раунд 5, пункт 3). Опознали хотя бы в одном ответе, значит
 * этот вид во всех строках. Опознали по-разному, значит решает более прямое основание: фраза ChatGPT
 * (3) сильнее названия и списка (2), те сильнее знания модели (1); при равенстве конкурент.
 * Поэтому и Pearl Property Phuket, названная за управление в одном ответе и за покупку в другом,
 * теперь во всех строках конкурент: две прямые фразы, равенство.
 */
export function oneKindPerName(byRow, merged = (n) => n) {
  const best = new Map();
  for (const row of byRow) for (const [n, c] of Object.entries(row || {})) {
    if (!c || c.type === 'unclear businesses') continue;
    const key = merged(n); const b = best.get(key);
    if (!b || c.rank > b.rank || (c.rank === b.rank && c.competitor && !b.competitor)) best.set(key, c);
  }
  return byRow.map((row) => Object.fromEntries(Object.entries(row || {}).map(([n, c]) => [n, best.get(merged(n)) || c])));
}

/** Какие из молчащих имён модель знает как агентства недвижимости. Только включение, не исключение. */
export async function knownAgencies(names, { category = '', city = '' } = {}) {
  const list = [...new Set(names.filter(Boolean))].slice(0, 60);
  if (!list.length) return new Set();
  const schema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'agency'], properties: { name: { type: 'string' }, agency: { type: 'boolean' } } } } } };
  try {
    const out = await json([
      `Market: ${category}${city ? `, ${city}` : ''}.`,
      'For each business below: agency is true only if you know it as a real estate agency, brokerage or buyer\'s agent that helps people buy property there. If you do not know it, false. Do not guess from the name.',
      '', ...list.map((n) => `- ${n}`),
    ].join('\n'), schema, 'watch_known', 2000, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
    return new Set((out.items || []).filter((x) => x.agency).map((x) => x.name));
  } catch { return new Set(); }
}

/**
 * Разбор недели. Недвижимость: правила выше по каждому упоминанию. Другие клиенты: как раньше, вид
 * по имени от модели с пояснениями ChatGPT и страховкой кодом.
 */
export async function classifyWeek(answers, profile = {}) {
  if (!isPropertyClient(profile.category)) {
    const perName = await classifyNames(answers.flatMap((a) => a.names || []), profile, nameContext(answers));
    return { ...perName, byRow: roleByAnswer(perName, answers, profile.category) };
  }
  const silent = answers.flatMap((a) => (a.names || []).filter((n) => decideMention({ name: n, note: a.notes?.[n] || '' }).type === 'unclear businesses'));
  const known = await knownAgencies(silent, profile);
  const byRow = answers.map((a) => Object.fromEntries((a.names || []).map((n) => [n, decideMention({ name: n, note: a.notes?.[n] || '', knownAgency: known.has(n) })])));
  return { byRow: oneKindPerName(byRow, mergeNames(answers.flatMap((a) => a.names || []))) };
}
/** Роль имени в каждом ответе: вид по имени и поправка кодом по пояснению ChatGPT и вопросу. */
export function roleByAnswer(perName, answers, category = '') {
  const property = isPropertyClient(category);
  return answers.map((a) => Object.fromEntries((a.names || []).map((n) => {
    const c = perName[n];
    if (!c || !property) return [n, c];
    const note = a.notes?.[n] || '';
    const managing = /manag|rental|letting|lease|tenant|maintenance|housekeep/i.test(note) || /\bmanag|rental management|rent (?:it )?out/i.test(a.question || '');
    // Агентство, названное за управление, в этом ответе управляющая (раунд 2).
    if (c.competitor && managing) return [n, { competitor: false, type: 'property managers' }];
    // И наоборот (раунд 3, пункт 2.3): записана управляющей по другому ответу, а здесь названа за
    // покупку, или пояснения нет, а название говорит «агентство», и вопрос не про управление.
    const buying = /buyer|buying|purchase|sales?\b|resale|agent|agency|broker|represent|sourcing|shortlist|advis|consult/i.test(note);
    if (!c.competitor && c.type === 'property managers' && !managing && !MANAGER_NAME.test(n) && (buying || (!note && AGENCY_NAME.test(n)))) return [n, { competitor: true, type: 'real estate agencies' }];
    return [n, c];
  })));
}
const NOT_COMPETITOR_KINDS = [/portal|listing|marketplace/, /\blaw|legal|notar|attorney|solicitor/, /\bbank|lender|mortgage|financ/, /travel|touris|hotel|resort/, /\bdata\b|software|\bapp\b|platform/, /media|news|magazine|directory|directories/, /government|ministry|authority/, /construction|engineering|contractor/, /property manag|rental manag|facility manag/];

/**
 * Итог недели по тем же данным, что таблица (задание 25.09.2026, 1.1-1.2 и 2.2).
 *
 * В строке «instead of you» считаются только ответы, где клиента НЕ назвали, и только имена из
 * колонки конкурентов таблицы: число у имени равно числу строк таблицы с этим именем и ответом
 * «no». Общий счёт по всем ответам (overall) идёт только в тему письма, где рядом стоит и число
 * клиента. «Also named» перечисляет всех не конкурентов, без обрезки.
 */
export function summarise(answers, target, classes = {}) {
  const merged = mergeNames(answers.flatMap((a) => a.names || []));
  const typeOf = {};
  const rows = answers.map((a, i) => {
    // Класс упоминания в этом ответе (по исходному имени или склеенному), иначе класс имени за неделю.
    const cls = (n) => {
      const raw = (a.names || []).find((x) => merged(x) === n);
      return classes.byRow?.[i]?.[raw] ?? classes.byRow?.[i]?.[n] ?? classes[n] ?? classes[raw];
    };
    const names = [...new Set((a.names || []).map(merged))].filter((n) => !isNamed({ names: [n] }, target).named);
    const unclearOf = (n) => cls(n)?.type === 'unclear businesses';
    const comp = names.filter((n) => cls(n)?.competitor !== false && !unclearOf(n));
    const other = names.filter((n) => cls(n)?.competitor === false && !unclearOf(n));
    // Неопознанные отдельно (раунд 3, пункт 2.4): ни в конкурентах, ни в «не конкурентах».
    const unclear = names.filter(unclearOf);
    for (const n of names) if (cls(n)?.type && !typeOf[n]) typeOf[n] = cls(n).type;
    return { ...a, display: names, comp, other, unclear };
  });
  const asked = rows.filter((a) => !a.error);
  const named = asked.filter((a) => a.named).length;
  const count = (list, key) => {
    const m = new Map();
    for (const a of list) for (const n of a[key]) m.set(n, (m.get(n) || 0) + 1);
    return [...m.entries()].sort((x, y) => y[1] - x[1]).map(([name, times]) => ({ name, times, type: typeOf[name] || classes[name]?.type || '' }));
  };
  const instead = count(asked.filter((a) => a.named === false), 'comp');
  const competitors = instead.some((c) => c.times >= 2) ? instead.filter((c) => c.times >= 2).slice(0, 5) : instead.slice(0, 3);
  const overall = count(asked, 'comp').slice(0, 5);
  const others = count(asked, 'other');
  // Кого в другом ответе опознали, того нет в «Could not identify» итога (в таблице по строкам как было).
  const known = new Set(asked.flatMap((a) => [...a.comp, ...a.other]));
  const unclear = count(asked, 'unclear').filter((u) => !known.has(u.name));
  const wins = asked.filter((a) => a.named).map((a) => ({ question: a.question, next: a.comp }));
  return { asked: asked.length, named, competitors, overall, others, unclear, wins, rows };
}

/**
 * Вопрос для правки: где вас не назвали и где конкурентов меньше всего, но хотя бы один есть. Вопрос
 * без единого конкурента (все названные юристы или управляющие) не про работу клиента, правка под
 * него ничего не даст (ревизия 25.09.2026). Таких только и есть, значит берём из них.
 */
export function pickFixQuestion(summary) {
  const misses = summary.rows.filter((a) => !a.error && a.named === false);
  if (!misses.length) return null;
  const withRivals = misses.filter((a) => a.comp.length > 0);
  return [...(withRivals.length ? withRivals : misses)].sort((a, b) => a.comp.length - b.comp.length)[0];
}

/**
 * Проверка фактов правки: каждое число и каждое имя собственное из текста обязано встречаться на
 * сайте клиента или в самом вопросе. Иначе оно заменяется пропуском в квадратных скобках.
 */
export function guardFacts(text, source, allowed = []) {
  const hay = norm(`${source} ${allowed.join(' ')}`);
  let out = String(text || '');
  out = out.replace(/\b\d[\d.,%]*\b/g, (m) => (hay.includes(norm(m)) ? m : '[number]'));
  // Слово в начале предложения («At MORE Group») не часть имени: сверяем имя без него.
  const STARTER = /^(?:At|The|In|On|For|With|Our|We|Your|From|By|And|But|As|If|When|Each|Every|This|These|All|Since)\s+/;
  out = out.replace(/\b([A-Z][\p{L}&'-]+(?:\s+[A-Z][\p{L}&'-]+)+)\b/gu, (m) => (hay.includes(norm(m)) || (STARTER.test(m) && hay.includes(norm(m.replace(STARTER, '')))) ? m : '[name]'));
  return out;
}

/** Английский в готовом абзаце: «three-project shortlist», «WhatsApp or phone number» (задание 25.09.2026, 3.4). */
const COMPOUND_NOUNS = 'shortlist|list|plan|trial|process|search|tour|guide|report|check|package|programme|program|visit|stay|rental|contract|guarantee|warranty|period|window|review|consultation|call|selection|comparison';
export function polishFixEn(text) {
  return String(text || '')
    .replace(new RegExp(`\\b(one|two|three|four|five|six|seven|eight|nine|ten|\\d+) (project|page|step|day|week|month|year|minute|hour|bedroom|room|option) (?=(?:${COMPOUND_NOUNS})\\b)`, 'gi'), '$1-$2 ')
    // Только поле контакта, которое человек оставляет: «your name and WhatsApp or phone».
    // Абсолютные обещания от имени клиента не пишем (раунд 5, пункт 2.4).
    .replace(/\b(?:every|each) major ([a-z]+ )?districts?\b/gi, 'the main $1districts')
    .replace(/\bevery major\b/gi, 'the main')
    // Два названия без запятой перед and: «include A and B», а не «include A, and B» (26.09.2026).
    .replace(/\b(include|includes|including) ([^,.;]+), and ([^,.;]+)([.!?])/g, '$1 $2 and $3$4')
    .replace(/\b((?:share|sharing|send|leave|give|enter)\s+(?:us\s+)?(?:your\s+)?(?:name,?\s+(?:and|or)\s+(?:your\s+)?)?|name,?\s+(?:and|or)\s+(?:your\s+)?)WhatsApp or phone\b(?! number| call)/gi, '$1WhatsApp or phone number');
}

/**
 * Проекты с сайта в абзаце правки идут примерами, а не готовым списком (приёмка раунда 5, пункт 2):
 * «a shortlist matched to your budget» и сразу «Our featured options are A, B, C» спорят друг с
 * другом. Пишем «Featured projects include A, B and C».
 */
export function examplesLead(sentence, { property = false } = {}) {
  // Только перед перечнем названий: «are hand-picked» и «are in Bang Tao» не трогаем.
  return String(sentence || '').replace(/\b(?:our|the)\s+featured\s+(options|projects|entry points|picks|homes|properties|listings|developments|products|services)\s+(?:are|include)(?=\s+[A-Z0-9$])/gi, (m, noun, off, all) => {
    const rest = all.slice(off + m.length).split(/[.!?](?:\s|$)/)[0];
    if (!/^\s+[A-Z0-9$]/.test(rest) || !/,|\sand\s/.test(rest) || (rest.match(/\b[A-Z][\p{L}\p{N}'-]*/gu) || []).length < 2) return m;
    const n = property && /^(?:options|entry points|picks)$/i.test(noun) ? 'projects' : noun.toLowerCase();
    return `${off === 0 || /[.!?]\s*$/.test(all.slice(0, off)) ? 'F' : 'f'}eatured ${n} include`;
  });
}

/** Цитата стоит на странице клиента. */
export function quoteOnSite(quote, source) {
  // Цитата из нескольких кусков через «...»: каждый кусок обязан стоять на странице.
  const parts = String(quote || '').split(/\s*(?:\.\.\.|…)\s*/).map(norm).filter(Boolean);
  const hay = norm(source);
  return parts.length > 0 && parts.join('').length >= 12 && parts.every((q) => q.length >= 6 && hay.includes(q));
}

/*
 * Проверка кодом по словам (ревизия 25.09.2026): каждое смысловое слово предложения должно быть на
 * сайте клиента, в вопросе или в имени бренда. «We filter options…» не пройдёт, если слова «filter»
 * на сайте нет. Служебные слова и местоимения не считаются. Слова сравниваются по первым четырём буквам,
 * чтобы «shown» и «shows», «verified» и «verify» совпадали.
 */
const GLUE = new Set('with from that this have your their they them what when which where about into then than there here also just only very more most each every other some such both many much well like will would could should shall can may might must does done been being were your yours ours ourselves help helps helping make makes made based using want know need find give show shows means right place page pages site website online today also plus whether while because through within without across along after before under over near provide provides offer offers give gives send sends uses gets lets work works bring brings take takes keep keeps receive receives include includes including share shares build builds list lists create creates prepare prepares check checks choose pick select main example examples such rather instead either neither whose whom onto upon among around toward towards still already even'.split(' '));
const stem = (w) => w.slice(0, 4);
export function wordsOnSite(sentence, source, extra = '') {
  const have = new Set(`${source} ${extra}`.toLowerCase().match(/[a-z][a-z'-]{3,}/g)?.map(stem) || []);
  const words = String(sentence).toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [];
  return words.filter((w) => !GLUE.has(w) && !have.has(stem(w)));
}

/*
 * Ключевые слова вопроса (раунд 4, пункт 3): то, что ищет покупатель («condos», «villas»), без
 * служебных слов вопроса, города и бренда. Те, что есть на сайте, абзац обязан содержать; тех, что
 * на сайте нет, в абзац не вставляем, а ставим пометку владельцу.
 */
const QUESTION_GLUE = new Set('best top help compare comparing find finding choose choosing recommend recommended looking look services service firms firm company companies agency agencies agents agent options option alternatives alternative provide provides providing buyers buyer foreign international people professional professionals specialists specialist experts expert helping which what where when there should could would with from that this your their them they good trusted reliable verified multiple various other'.split(' '));
export function questionKeywords(question, source, { brand = '', city = '' } = {}) {
  const skip = new Set(`${brand} ${city}`.toLowerCase().match(/[a-z]+/g) || []);
  // Предметы поиска: слова во множественном числе («condos», «villas»), не глаголы и не «readiness».
  const words = [...new Set((String(question).toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []).filter((w) => !GLUE.has(w) && !QUESTION_GLUE.has(w) && !skip.has(w) && w.length >= 5 && /[^s]s$/.test(w)))];
  const hay = String(source).toLowerCase();
  return { onSite: words.filter((w) => new RegExp(`\\b${w}\\b`).test(hay)), offSite: words.filter((w) => !new RegExp(`\\b${w}\\b`).test(hay)) };
}
/** Пары вида «Bang Tao» и «Bangtao» на сайте: какое написание сайт использует чаще (раунд 4, B1). */
export function siteSpellings(source) {
  const text = String(source);
  const out = [];
  const seen = new Set();
  for (const m of text.matchAll(/\b([A-Z][a-z]{2,})\s([A-Z][a-z]{2,})\b/g)) {
    const two = `${m[1]} ${m[2]}`; const one = `${m[1]}${m[2].toLowerCase()}`;
    if (seen.has(two)) continue; seen.add(two);
    const nTwo = (text.match(new RegExp(`\\b${two}\\b`, 'g')) || []).length;
    const nOne = (text.match(new RegExp(`\\b${one}\\b`, 'gi')) || []).length;
    if (nOne) out.push(nTwo >= nOne ? { use: two, not: one } : { use: one, not: two });
  }
  return out;
}

const EXAMPLES_HINT = 'If a sentence names projects or products from the site, write it as "Featured projects include A, B and C." with the names exactly as on the site and no other words, never "Our featured options are".';

/**
 * Названия с сайта в написании сайта: модель пишет «So Origin Bang Tao Beach», на сайте «So Origin
 * Bangtao Beach» (прогон 25.09.2026). Меняется только разбивка на слова: те же буквы, границы слов
 * одного написания лежат внутри границ другого, число слов разное, написание капсом не берём. Имена
 * до 6 слов; словарь сайта строится один раз на страницу (ревизия: иначе рост кубический).
 */
const CAPS = /\b[A-Z][\p{L}\p{N}&'-]*(?:\s+[A-Z][\p{L}\p{N}&'-]*)+/gu;
const NAME_MAX = 6;
const nameKeyOf = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const cutsOf = (words) => { const out = []; let at = 0; for (const w of words.slice(0, -1)) { at += nameKeyOf(w).length; out.push(at); } return out; };
let siteNameCache = { source: null, map: null };
function siteNameMap(source) {
  if (siteNameCache.source === source) return siteNameCache.map;
  const map = new Map();
  for (const m of String(source || '').matchAll(CAPS)) {
    const words = m[0].split(/\s+/);
    for (let a = 0; a < words.length; a += 1) for (let b = a + 2; b <= Math.min(words.length, a + NAME_MAX); b += 1) {
      const name = words.slice(a, b).join(' '); const key = nameKeyOf(name);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(name);
    }
  }
  siteNameCache = { source, map };
  return map;
}
export function siteNames(sentence, source) {
  const map = siteNameMap(String(source || ''));
  return String(sentence || '').replace(CAPS, (m) => {
    const words = m.split(/\s+/);
    for (let a = 0; a < words.length; a += 1) for (let b = Math.min(words.length, a + NAME_MAX); b > a + 1; b -= 1) {
      const mine = words.slice(a, b); const part = mine.join(' ');
      const found = map.get(nameKeyOf(part));
      if (!found || found.has(part) || found.size !== 1) continue;
      const site = [...found][0]; const theirs = site.split(/\s+/);
      if (theirs.length === mine.length || theirs.some((w) => /\p{Lu}{2}/u.test(w) && !mine.includes(w))) continue;
      const c1 = new Set(cutsOf(mine)); const c2 = new Set(cutsOf(theirs));
      // Отличается только разбивка («Bang Tao» и «Bangtao»), а не место границ («Sea Land» и «Seal And»).
      if ([...c1].every((c) => c2.has(c)) || [...c2].every((c) => c1.has(c))) return [...words.slice(0, a), site, ...words.slice(b)].join(' ');
    }
    return m;
  });
}

/** «Do you offer ___?»: из «Provides a three-project shortlist» делаем «a three-project shortlist». */
const offerPhrase = (claim) => {
  const c = String(claim || '').trim().replace(/[.?!]+$/, '').replace(/^(we |our )/i, '')
    .replace(/^(provides?|offers?|gives?|includes?|has|have|shows?|builds?|sends?|helps? with|delivers?|replies|reply)\s+/i, (m, v) => (/^repl/i.test(v) ? 'a reply ' : ''));
  return c || 'this';
};

/**
 * Правка недели: что сделать и готовый абзац на английском, 60-120 слов, только из фактов сайта.
 *
 * Как проверяется каждое предложение (задание Максима, 3.1-3.2, и ревизия 25.09.2026):
 * 1. модель пишет предложение и цитату со страницы клиента, на которую оно опирается;
 * 2. код ищет цитату в тексте страницы;
 * 3. второй проход модели сверяет смысл: говорит ли цитата всё, что утверждает предложение; если нет,
 *    переписывает предложение так, чтобы оно утверждало только сказанное в цитате;
 * 4. код проверяет, что смысловые слова предложения есть на сайте (wordsOnSite).
 * Не прошло, значит в абзаце не утверждение, а пометка владельцу «[confirm: do you offer X? If yes,
 * keep this sentence: "..."]». Откуда взят каждый факт, сохраняется в ev.
 */
/*
 * Два режима. Правка недели (Watch): абзац под вопрос покупателя для главной. Первый абзац
 * страницы (бесплатная проверка, задание 26.09.2026, п. 2): страница клиента без короткого ответа
 * в начале получает готовый абзац, который встаёт сразу под её H1. Движок проверки считает такой
 * абзац ответом, если в нём 20-90 слов и есть цифра, поэтому здесь 30-90 слов и цифра с сайта
 * обязательны, иначе абзаца нет. Проверки фактов те же самые.
 */
async function buildFixOnce({ url, brand, category, city, question, competitors = [], page: target = null }) {
  const pageMode = Boolean(target?.url);
  const full = await readHomepage(pageMode ? target.url : url, 200000);
  const page = { ...full, text: full.text.slice(0, 7000) };
  const source = `${page.title} ${page.description} ${page.h1} ${page.text}`;
  const path = pageMode ? (target.path || new URL(target.url).pathname) : '';
  const where = path === '/' ? 'your homepage' : path;
  const base = { q: question, p: pageMode ? `${where} (${hostOf(url)})` : `your homepage (${hostOf(url)})`, h: hostOf(url), ...(pageMode ? { m: 'page' } : {}) };
  if (page.text.length < 400) return { ...base, a: pageMode ? `Add a short opening paragraph with one figure right below the H1 of ${where}.` : `Add a short paragraph near the top of your homepage that answers "${question}" directly.`, x: null, ev: [] };
  const schema = {
    type: 'object', additionalProperties: false, required: ['action', 'sentences'],
    properties: {
      action: { type: 'string' },
      sentences: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['text', 'claim', 'quotes'], properties: { text: { type: 'string' }, claim: { type: 'string' }, quotes: { type: 'array', items: { type: 'string' } } } } },
    },
  };
  const keys = pageMode ? { onSite: [], offSite: [] } : questionKeywords(question, source, { brand, city });
  const spell = siteSpellings(source);
  const hints = [
    ...(keys.onSite.length ? [`Use these words from the buyer's question, which the site also uses: ${keys.onSite.join(', ')}.`] : []),
    ...(spell.length ? [`Spell place names the way the site does most often: ${spell.map((x) => `"${x.use}", not "${x.not}"`).join('; ')}, except inside project names, which stay exactly as on the site.`] : []),
  ];
  const out = await json([
    `Client: ${brand}, ${category}${city ? `, ${city}` : ''}. Site: ${url}`,
    pageMode
      ? `Page: ${target.url}. Its H1: "${target.h1 || page.h1}". The paragraph goes right below this H1 as the page's opening paragraph and says directly what this page offers and for whom.`
      : `Buyer question where ChatGPT did not name the client${competitors.length ? `, naming ${competitors.slice(0, 3).join(', ')} instead` : ''}: "${question}"`,
    '', 'Site text (the only source of facts you may use):', page.text, '',
    'Write "action": one sentence, what to put where, starting with a verb, no more than 18 words.',
    (pageMode
      ? 'Write "sentences": one paragraph in English, 50 to 80 words in total, split into its sentences, for the client to paste right below the H1 of this page, in the client\'s own voice (we, our, us), never "they" or "their". Write 3 to 5 short sentences, one fact each, 10 to 22 words. The first sentence says directly what this page offers and for whom, naming the brand once. At least one sentence carries a figure (a number, a price, a count or a range) copied exactly from the site text. Never repeat'
      : 'Write "sentences": one paragraph in English, 60 to 120 words in total, split into its sentences, for the client to paste on the homepage, in the client\'s own voice (we, our, us), never "they" or "their". Write 3 to 5 short sentences, one fact each, 10 to 25 words. The first sentence answers the buyer question directly, naming the brand once; the main words of the question may appear once, there, naturally, and never again: say the rest in plain words. Never repeat')
    + ' a phrase of two or more words. No absolute promises (every, all, always, best, guaranteed). Say why this client is a good answer using only facts in the site text: no new services, methods, promises or timings, and nothing about forms, consent or legal wording. Use correct, natural English: hyphenate compound adjectives (a three-project shortlist), write "phone number" for a contact field. No superlatives the site does not claim. Say who provides each thing the way the site does: developer financing or a bank mortgage belongs to the developer or the bank, never "we provide". No dates: the paragraph stays on the page for months. No em dashes or en dashes.',
    EXAMPLES_HINT,
    ...hints,
    'For every sentence give "quotes": 1 to 3 exact passages from the site text above that together support everything it says, each copied character for character, 5 to 25 words, or [] if nothing supports it; and "claim": what the sentence says the client offers, as a short noun phrase that fits "Do you offer ___?", for example "a three-project shortlist" or "a reply within two hours".',
  ].join('\n'), schema, 'watch_fix', 1600);
  const clean = (t) => polishFixEn(String(t || '').replace(/\s*[—–]\s*/g, ', ').replace(/[[\]]/g, '').trim());
  let ev = (out.sentences || []).map((x) => ({ s: clean(x.text), c: String(x.claim || '').trim(), q: (Array.isArray(x.quotes) ? x.quotes : []).map((t) => String(t).trim()).filter(Boolean).slice(0, 3), u: url })).filter((x) => x.s);
  // Второй проход: смысл предложения против его цитаты.
  const checkSchema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'supported', 'rewrite'], properties: { id: { type: 'integer' }, supported: { type: 'boolean' }, rewrite: { type: 'string' } } } } } };
  let verdict = {};
  try {
    const v = await json([
      'Each item is a sentence a business will publish about itself and quotes from its own website.',
      'supported: true only if the quotes together state everything the sentence claims about the business: what it does, who provides it, how, for whom, when and how fast. If the site says a developer, bank or partner provides something (for example "developer financing", "pay as they build"), a sentence saying "we provide" or "we offer" it is not supported. Wording may differ; meaning may not grow.',
      'rewrite: if not supported, the same sentence rewritten in natural English, same voice (we, our), claiming only what the quotes state; or "" if nothing useful is left. If supported, "".',
      '', ...ev.map((x, k) => `${k}. Sentence: "${x.s}"\n   Quotes: ${x.q.map((t) => `"${t}"`).join(' | ') || '(none)'}`),
    ].join('\n'), checkSchema, 'watch_fix_check', 1600, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
    verdict = Object.fromEntries((v.items || []).map((x) => [x.id, x]));
  } catch { verdict = {}; }
  const extra = `${question} ${brand} ${city || ''} ${category}`;
  ev = ev.map((x, k) => {
    const onPage = x.q.length > 0 && x.q.every((t) => quoteOnSite(t, source));
    const vd = verdict[k];
    let s2 = x.s; let ok = onPage && vd?.supported === true;
    if (onPage && vd && !vd.supported && vd.rewrite) { s2 = clean(vd.rewrite); ok = true; }
    const unknown = wordsOnSite(s2, source, extra);
    const meant = ok;
    if (unknown.length) ok = false;
    return { ...x, s: s2, ok, missing: unknown, meant };
  });
  const dbg = { gen: ev.length, onPage: ev.filter((x) => x.q.length && x.q.every((t) => quoteOnSite(t, source))).length, meant: ev.filter((x) => x.meant).length, siteWords: ev.filter((x) => x.ok).length };
  ev = await repairWords(ev, { source, extra, clean }).catch(() => ev);
  dbg.repaired = ev.filter((x) => x.ok).length;
  // Вычитка (раунд 3, пункт 5): подтверждённые предложения переписываются понятным языком для
  // покупателя, без повторов и внутренних терминов сайта. Проверка ниже; не прошла, значит остаётся
  // версия до вычитки.
  const edited = await editFixEn({ brand, question, source, ev: ev.filter((x) => x.ok), hints }).catch(() => null);
  // Строгий фильтр (раунд 4, ответ 2): предложение со словом или связью, которых нет в его цитатах,
  // удаляется из абзаца, даже если проверка смысла его пропустила.
  const okEv = await strictGate({ ev: edited || ev.filter((x) => x.ok), brand, city, question, source }).catch(() => edited || ev.filter((x) => x.ok));
  dbg.edited = edited ? edited.length : null; dbg.strict = okEv.length;
  // Повторы (раунд 5, пункт 2): фраза из двух и больше слов не встречается в абзаце дважды.
  // Второе вхождение: предложение уходит; повтор внутри одного предложения тоже.
  // Проекты примерами и без дат до проверки повторов: замена сама не должна создать повтор (ревизия).
  const lead = { property: isPropertyClient(category) };
  const origin = new Map();
  const shaped = okEv.flatMap((x) => { const t = withoutDates(examplesLead(x.s, lead)); if (!t) return []; const y = { ...x, s: t }; origin.set(y, x); return [y]; });
  const kept = nameBrandFirst(await fixSelfRepeats(dropRepeats(shaped, { keepSelf: true }), { source, brand, city, question }), brand);
  const keptFrom = new Set(kept.map((y) => origin.get(y)).filter(Boolean));
  dbg.kept = kept.length;
  const and = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  /*
   * В рамке только готовый к публикации текст (раунд 5, пункт 1). Всё, что владельцу нужно решить,
   * идёт под рамкой обычным текстом: неподтверждённое предложение, предложение с пропуском после
   * проверки фактов, слова вопроса, которых нет в абзаце.
   */
  const notes = [];
  const inFrame = [];
  for (const x of kept) {
    const g = guardFacts(siteNames(x.s, source), source, [question, brand, city || '']);
    if (/\[/.test(g)) notes.push(`Optional: add this sentence once you fill in the blank: ${g.replace(/\[(number|name)\]/g, '(your $1)')}`);
    else inFrame.push(g);
  }
  for (const x of ev.filter((y) => !y.ok && withoutDates(examplesLead(y.s, lead)))) notes.push(`Optional: if you offer ${offerPhrase(x.c)}, add this sentence: ${withoutDates(examplesLead(x.s, lead)).replace(/[[\]]/g, '')}`);
  const body = inFrame.join(' ').toLowerCase();
  // Слово засчитано и в единственном числе, и внутри «three-project»: «projects» есть, если есть «project».
  const hasWord = (w) => new RegExp(`(^|[^a-z])${w.replace(/s$/, '')}s?([^a-z]|$)`).test(body);
  const missingWords = [...keys.onSite.filter((w) => !hasWord(w)), ...keys.offSite];
  if (missingWords.length) notes.push(`Before you publish: add the words "${and(missingWords)}" to this paragraph if you sell ${missingWords.length === 2 ? 'both' : 'them'}.`);
  const words = inFrame.join(' ').split(/\s+/).filter(Boolean).length;
  const joined = inFrame.join(' ');
  // Первый абзац страницы засчитывается движком только с цифрой и в 20-90 слов: иначе он не нужен.
  const text = pageMode ? (words >= 25 && words <= 90 && /\d/.test(joined) ? joined : null) : (words >= 25 ? joined : null);
  // Что убрали фильтры, сохраняем для разбора: удалённое не пропадает молча.
  const dropped = (edited || ev.filter((x) => x.ok)).filter((x) => !keptFrom.has(x)).map((x) => ({ ...x, ok: false, dropped: true }));
  // Инструкция над рамкой одна для всех (раунд 5, B5): место на чужой странице мы не видим.
  const action = text ? (pageMode ? `Add this right below the H1 of ${where}, as its first paragraph.` : 'Add this to your homepage, just below the first section.') : clean(out.action);
  dbg.words = words; dbg.inFrame = inFrame.length;
  return { ...base, dbg, a: action, x: text, ...(text ? { lp: liveProbe(text, full.text) } : {}), n: text ? notes : [], ev: [...kept.map((x) => ({ ...x, ok: true })), ...dropped, ...ev.filter((x) => !x.ok)], edited: Boolean(edited) };
}

/*
 * Абзац пишет модель, и прогоны одного кода дают разный текст: 25.09.2026 из трёх прогонов под
 * один вопрос один остался без абзаца, в другом не было названия марки. Поэтому до трёх попыток:
 * берём первую, где в рамке 3 и больше предложений и марка названа в первом; иначе лучшую из них.
 */
const FIX_ATTEMPTS = () => { const raw = String(env('WATCH_FIX_ATTEMPTS', '') ?? '').trim(); const n = raw === '' ? 3 : Number(raw); return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 3; };
/** Марка целым словом: «Nest» не находится в «honest». */
const hasBrand = (text, brand) => Boolean(brand) && new RegExp(`(^|[^\\p{L}\\p{N}])${String(brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu').test(String(text || ''));
export function fixQuality(fix, brand) {
  if (!fix?.x) return 0;
  const sentences = fix.x.split(/(?<=[.!?])\s+/).filter(Boolean);
  const brandFirst = hasBrand(sentences[0], brand);
  return (brandFirst ? 10 : 0) + Math.min(sentences.length, 5);
}
export async function buildFix(args, { attempts = FIX_ATTEMPTS(), once = buildFixOnce } = {}) {
  let best = null; let lastError = null; let tries = 0;
  for (; tries < attempts; tries += 1) {
    let fix;
    try { fix = await once(args); } catch (e) { lastError = e; continue; }
    // Страница почти пустая (или проверка на бота): другие попытки ничего не дадут; уже написанный
    // абзац из прошлой попытки не теряем.
    if (!fix.x && !fix.ev?.length) { if (best) { tries += 1; break; } return { ...fix, tries: tries + 1 }; }
    const score = fixQuality(fix, args.brand);
    if (!best || score > best.score) best = { fix, score };
    // Первый абзац страницы короче (2-4 предложения): хватает марки и двух предложений.
    if (score >= (args.page ? 12 : 13)) { tries += 1; break; }
  }
  if (!best) throw lastError || new Error('правка не написана');
  return { ...best.fix, tries };
}

/**
 * Дат в абзаце для вставки нет (прогон 25.09.2026: «updated July 12, 2026»): текст висит на главной
 * месяцами и устаревает. Хвост «, updated July 12, 2026» срезается; любая другая дата («in December
 * 2026», «by Q4 2026», «from 24 August 2026»), и предложение уходит целиком, чтобы не оставить
 * обрубок «ready for handover in.» (ревизия). «Since 2015» датой не считается.
 */
const MONTH = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\b\\.?';
const DATE = `(?:${MONTH}\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\s+${MONTH}\\s+\\d{4}|${MONTH}\\s+\\d{4})`;
const ANY_DATE = new RegExp(`${DATE}|\\b\\d{1,2}[./-]\\d{1,2}[./-](?:19|20)?\\d{2}\\b|\\b(?:19|20)\\d{2}-\\d{2}-\\d{2}\\b|\\b(?:q[1-4]|h[12])\\s+(?:19|20)\\d{2}\\b|\\b(?:in|by|until|till|before|through|from|during|for|expected|updated|as of)\\s+(?:early\\s+|mid-|late\\s+|(?:the\\s+)?end of\\s+|(?:the\\s+)?start of\\s+)?(?:19|20)\\d{2}\\b(?!\\s*(?:\\+|%|usd|thb|eur|gbp|aed|rub|baht|dollars?|\\$|฿|€|£|₽|per\\b|sq|m2|m²|owners|units|people|buyers|clients|families|guests|investors|members|deals|sales|listings|properties|projects|homes|villas|condos|apartments))`, 'i');
export function withoutDates(sentence) {
  const s = String(sentence || '').trim();
  const t = s.replace(new RegExp(`,\\s*(?:last\\s+)?(?:updated|as of)\\s+(?:on\\s+)?${DATE}\\s*[.!?]?$`, 'i'), '.');
  if (ANY_DATE.test(t)) return null;
  return t.split(/\s+/).filter(Boolean).length >= 4 ? t : null;
}

/**
 * Марка в первом предложении: «We help you compare…» без марки в абзаце становится «At MORE Group, we
 * help you compare…». Глаголы не трогаем: «MORE Group compares … and send» ломал грамматику (ревизия).
 */
export function nameBrandFirst(ev, brand) {
  if (!brand || !ev.length || ev.some((x) => hasBrand(x.s, brand))) return ev;
  const [first, ...rest] = ev;
  if (!/^We\s+[a-z]/.test(first.s)) return ev;
  return [{ ...first, s: `At ${brand}, we${first.s.slice(2)}` }, ...rest];
}

/*
 * Предложение с подтверждённым смыслом падало из-за одного слова не с сайта («curates», «grounded»):
 * 26.09.2026 так терялось первое предложение с маркой, и абзац не собирался в половине прогонов.
 * Такое предложение (1-3 чужих слова) модель один раз переписывает словами сайта, код проверяет
 * заново: все смысловые слова на сайте, новых чисел нет. Не вышло, остаётся как было.
 */
async function repairWords(ev, { source, extra, clean }) {
  const bad = ev.filter((x) => !x.ok && x.meant && x.missing?.length && x.missing.length <= 3);
  if (!bad.length) return ev;
  const schema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'text'], properties: { id: { type: 'integer' }, text: { type: 'string' } } } } } };
  const out = await json([
    'Rewrite each sentence without the words in brackets, using plain words from the site text instead. Keep the meaning, the facts, the numbers and the "we/our" voice; add nothing; natural English; no dashes.',
    '', 'Site text:', source.slice(0, 6000), '', ...bad.map((x, k) => `${k}. [${x.missing.join(', ')}] ${x.s}`),
  ].join('\n'), schema, 'watch_fix_words', 700, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
  const fixed = Object.fromEntries((out.items || []).map((y) => [y.id, clean(y.text)]));
  const nums = (t) => (String(t).match(/\d[\d.,]*\d|\d/g) || []).sort().join(' ');
  return ev.map((x) => {
    const k = bad.indexOf(x); if (k < 0) return x;
    const t = fixed[k];
    if (!t || wordsOnSite(t, source, extra).length || nums(t) !== nums(x.s)) return x;
    return { ...x, s: t, ok: true, missing: [], repaired: true };
  });
}

/**
 * Повторы фраз из двух слов: предложение, где пара слов уже была, уходит. Пары считаются двумя
 * способами: соседние слова, как раньше («our team», «prices from»), и смысловые слова через служебные
 * («matched to budget and use» и «match your budget and use» дают «budget use», прогон 25.09.2026).
 */
const PAIR_SKIP = ['and', 'the', 'a', 'of', 'to', 'in', 'on', 'for', 'with', 'we', 'you'];
const REPEAT_SKIP = new Set([...PAIR_SKIP, 'or', 'an', 'at', 'by', 'from', 'our', 'your', 'is', 'are']);
export function dropRepeats(ev, { keepSelf = false } = {}) {
  const seen = new Set(); const out = [];
  const pairLists = (t) => {
    const all = String(t).toLowerCase().match(/[a-z0-9$][a-z0-9$'-]*/g) || [];
    const near = []; const across = [];
    for (let k = 0; k < all.length - 1; k += 1) if (!(GLUE.has(all[k]) && GLUE.has(all[k + 1])) && !PAIR_SKIP.includes(all[k]) && !PAIR_SKIP.includes(all[k + 1])) near.push(`${all[k]} ${all[k + 1]}`);
    const w = all.filter((x) => !REPEAT_SKIP.has(x));
    for (let k = 0; k < w.length - 1; k += 1) if (!(GLUE.has(w[k]) && GLUE.has(w[k + 1]))) across.push(`${w[k]} ${w[k + 1]}`);
    return [near, across];
  };
  for (const x of ev) {
    const lists = pairLists(x.s);
    const p = [...new Set(lists.flat())];
    const dup = lists.map((l) => l.find((q, k) => l.indexOf(q) !== k)).find(Boolean);
    if (p.some((q) => seen.has(q))) continue;
    if (dup && !keepSelf) continue;
    p.forEach((q) => seen.add(q)); out.push(dup ? { ...x, repeat: dup } : x);
  }
  return out;
}

/*
 * Повтор внутри одного предложения (раунд 5, пункт 2.2): предложение переписывается без второго
 * вхождения и снова проверяется словами по цитатам. Не вышло, значит предложение удаляется.
 */
async function fixSelfRepeats(ev, { source, brand, city, question }) {
  const bad = ev.filter((x) => x.repeat);
  if (!bad.length) return ev;
  const schema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'text'], properties: { id: { type: 'integer' }, text: { type: 'string' } } } } } };
  let fixed = {};
  try {
    const out = await json([
      'Rewrite each sentence so that the phrase in brackets appears only once. Keep the meaning and the facts, add nothing, keep "we/our" voice, natural English, no dashes.',
      '', ...bad.map((x, k) => `${k}. [${x.repeat}] ${x.s}`),
    ].join('\n'), schema, 'watch_fix_repeat', 600, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
    fixed = Object.fromEntries((out.items || []).map((y) => [y.id, polishFixEn(String(y.text || '').replace(/\s*[—–]\s*/g, ', ').trim())]));
  } catch { fixed = {}; }
  const near = (x) => x.q.map((t) => quoteWindow(t, source)).join(' ');
  return ev.flatMap((x) => {
    if (!x.repeat) return [x];
    const t = fixed[bad.indexOf(x)];
    const still = t && dropRepeats([{ s: t }]).length === 0;
    if (!t || still || wordsOnSite(t, near(x), `${brand} ${city || ''} ${question}`).length) return [];
    const { repeat, ...rest } = x;
    return [{ ...rest, s: t }];
  });
}

/**
 * Вычитка абзаца правки. Модель переписывает подтверждённые предложения для покупателя: убирает
 * повторы, меняет внутренние слова сайта («entry median snapshot», «live developer data with a
 * specialist reply») на обычные и ничего не добавляет. Затем второй проход сверяет каждое новое
 * предложение с исходными и их цитатами. Хоть одно новое утверждение, и вычитка отбрасывается.
 */
async function editFixEn({ brand, question, source, ev, hints = [] }) {
  if (ev.length < 2) return null;
  const schema = { type: 'object', additionalProperties: false, required: ['sentences'], properties: { sentences: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['text', 'from'], properties: { text: { type: 'string' }, from: { type: 'array', items: { type: 'integer' } } } } } } };
  const out = await json([
    `A business (${brand}) will paste this paragraph on its homepage to answer a buyer's question: "${question}".`,
    'Rewrite it so a buyer understands it at first reading: plain, natural English, in the business\'s own voice (we, our), 3 to 5 sentences. Say each thing once and never repeat a phrase of two or more words; the main words of the buyer\'s question at most once, in the first sentence. No absolute promises (every, all, always, best). Replace the site\'s own internal terms with ordinary words, choosing words that appear in the sentences or on the site wherever you can. Name the brand once, in the first sentence. Add nothing: no fact, service, number, name or promise that is not in the sentences below. No em dashes or en dashes.',
    EXAMPLES_HINT,
    ...hints,
    'For each new sentence give "from": the numbers of the original sentences it is based on.',
    '', ...ev.map((x, k) => `${k}. ${x.s}`),
  ].join('\n'), schema, 'watch_fix_edit', 1200, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
  const next = (out.sentences || []).map((x) => ({ s: polishFixEn(String(x.text || '').replace(/\s*[—–]\s*/g, ', ').replace(/[[\]]/g, '').trim()), from: (x.from || []).filter((k) => ev[k]) })).filter((x) => x.s && x.from.length);
  if (next.length < 2) return null;
  const checkSchema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'adds'], properties: { id: { type: 'integer' }, adds: { type: 'boolean' } } } } } };
  const v = await json([
    'Each item is a rewritten sentence and the original sentences and website quotes it came from.',
    'adds: true if the rewritten sentence claims anything about the business that the originals and quotes do not state (a new service, method, number, name, time or promise), or changes what something is, who provides it or whom it is for (for example projects "featured this week" becoming "your shortlist", or developer financing becoming "we provide a payment plan"). Plainer wording is fine.',
    '', ...next.map((x, k) => `${k}. Rewritten: "${x.s}"\n   Originals: ${x.from.map((i) => `"${ev[i].s}"`).join(' ')}\n   Quotes: ${x.from.flatMap((i) => ev[i].q).map((t) => `"${t}"`).join(' | ')}`),
  ].join('\n'), checkSchema, 'watch_fix_edit_check', 800, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
  const adds = new Set((v.items || []).filter((x) => x.adds).map((x) => x.id));
  if (adds.size || (v.items || []).length < next.length) return null;
  // И проверка словами, как у исходного абзаца: смысловые слова есть на сайте или в исходных предложениях.
  const allowed = `${ev.map((x) => `${x.s} ${x.q.join(' ')}`).join(' ')} ${question} ${brand}`;
  if (next.some((x) => wordsOnSite(x.s, source, allowed).length)) return null;
  return next.map((x) => ({ s: x.s, c: ev[x.from[0]].c, q: [...new Set(x.from.flatMap((i) => ev[i].q))].slice(0, 4), u: ev[x.from[0]].u }));
}

/*
 * Строгий фильтр готового абзаца (раунд 4, ответ 2). Два условия, оба по цитатам этого предложения:
 * смысловые слова предложения стоят в его цитатах (или в вопросе, бренде, городе), и предложение не
 * связывает то, что цитаты говорят по отдельности («featured projects» и поле «Your goal» не дают
 * «we match featured options to your goal»). Не прошло, значит предложение удаляется.
 */
/** Текст страницы вокруг цитаты (около 250 знаков с каждой стороны): цитата и её ближайший контекст. */
function quoteWindow(quote, source) {
  const hay = String(source); const low = hay.toLowerCase();
  const probe = String(quote || '').toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
  const at = probe.length >= 8 ? low.indexOf(probe) : -1;
  return at < 0 ? String(quote || '') : hay.slice(Math.max(0, at - 250), at + String(quote).length + 250);
}
/*
 * Где на странице стоит само предложение: окна вокруг мест, где встречаются его фразы из трёх
 * слов подряд. Модель часто цитирует соседний кусок, и слова почти дословной строки сайта
 * («three-project shortlist matched to budget») не находились рядом с цитатой (26.09.2026).
 */
function ownWindows(sentence, source) {
  const words = String(sentence).toLowerCase().match(/[a-z0-9$][a-z0-9$'-]*/g) || [];
  const hay = String(source).toLowerCase();
  const out = [];
  for (let k = 0; k + 3 <= words.length; k += 1) {
    const at = hay.indexOf(words.slice(k, k + 3).join(' '));
    if (at >= 0) out.push(String(source).slice(Math.max(0, at - 250), at + 250));
  }
  return out.join(' ');
}
async function strictGate({ ev, brand, city, question, source = '' }) {
  if (!ev.length) return ev;
  const near = (x) => `${x.q.map((t) => quoteWindow(t, source)).join(' ')} ${ownWindows(x.s, source)}`;
  const byWords = ev.filter((x) => !wordsOnSite(x.s, near(x), `${brand} ${city || ''} ${question}`).length);
  if (!byWords.length) return byWords;
  const schema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'joins'], properties: { id: { type: 'integer' }, joins: { type: 'boolean' } } } } } };
  const v = await json([
    'Each item is a sentence and the website quotes it is based on.',
    'joins: true if the sentence links facts that the quotes state separately, or states a relation the quotes do not state (for example "we match featured options to your goal" when the quotes only mention featured options and a form field "Your goal").',
    '', ...byWords.map((x, k) => `${k}. Sentence: "${x.s}"\n   Quotes: ${x.q.map((t) => `"${t}"`).join(' | ')}`),
  ].join('\n'), schema, 'watch_fix_joins', 800, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
  const joins = new Set((v.items || []).filter((x) => x.joins).map((x) => x.id));
  if ((v.items || []).length < byWords.length) return byWords;
  return byWords.filter((_, k) => !joins.has(k));
}

/** Ссылка на страницу правки: правка едет в ссылке, подписанной тем же секретом, что на сайте. */
export function fixLink(fix, week) {
  const secret = env('KIT_DOWNLOAD_SECRET');
  if (!secret || !fix) return `${SITE}/pricing/`;
  const body = Buffer.from(JSON.stringify({ h: fix.h, q: fix.q, a: fix.a, x: fix.x, p: fix.p, w: week, ...(fix.n?.length ? { n: fix.n } : {}) })).toString('base64url');
  return `${SITE}/fix/?t=${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

/** Ссылка «Email settings»: та же подпись почты, что у отписки на сайте. */
export function settingsLink(email) {
  const secret = env('KIT_DOWNLOAD_SECRET');
  if (!secret) return `${SITE}/contact/`;
  const body = Buffer.from(String(email).trim().toLowerCase(), 'utf8').toString('base64url');
  return `${SITE}/email-settings/?t=${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

/** Стоит ли правка на сайте: ищем её начало (первые десять слов без пропусков) в тексте страницы. */
/**
 * Кусок правки для проверки «уже на сайте»: первые 10 слов подряд, которых на странице ещё нет.
 * Раньше брались первые 10 слов рамки, а модель часто начинает абзац дословной строкой сайта, и
 * правка считалась выложенной до того, как клиент что-то вставил (ревизия 25.09.2026). Весь абзац
 * уже на странице: кусок не нужен, null.
 */
export function liveProbe(text, pageText) {
  const hay = norm(pageText);
  // Сначала начало предложения: кусок на стыке строки сайта и нового текста («…and use. At») даёт
  // ложное «live», если клиент допишет своё к той же строке (ревизия).
  for (const sentence of String(text || '').split(/(?<=[.!?])\s+/)) {
    const w = sentence.split(/\s+/).filter(Boolean).slice(0, 10).join(' ');
    if (norm(w).length >= 20 && !hay.includes(norm(w))) return w;
  }
  const words = String(text || '').split(/\s+/).filter(Boolean);
  for (let k = 0; k + 10 <= words.length; k += 1) {
    const w = words.slice(k, k + 10).join(' ');
    if (norm(w).length >= 20 && !hay.includes(norm(w))) return w;
  }
  return null;
}
export async function fixIsLive(url, fix) {
  if (!fix?.x) return false;
  try {
    const page = await readHomepage(url, 200000);
    const words = fix.x.replace(/\[[^\]]*\]/g, ' ').split(/\s+/).filter(Boolean);
    const probe = norm(fix.lp || words.slice(0, 10).join(' '));
    return probe.length >= 20 && norm(page.text).includes(probe);
  } catch { return false; }
}

const footer = (email) => [[settingsLink(email), 'Email settings'], [MANAGE_URL, 'Manage subscription']];
/** «A, B and C» (задание 25.09.2026, 9). */
export const listAnd = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
/** Цитата кончается на «?» или «!», значит точки после кавычки нет: «…buyers?"», а не «…buyers?".». */
export const endQuote = (t) => String(t).replace(/([?!])"\./g, '$1"');
const h3 = (t) => `<p style="margin:22px 0 8px;font-family:${FONT};font-size:16px;font-weight:700;color:#14181C">${esc(t)}</p>`;
const colorOf = (d) => (d > 0 ? '#1A8A7D' : d < 0 ? '#B5412D' : '#5A6470');
/** Пометки владельцу под рамкой, обычным текстом: в копируемый текст они не попадают (раунд 5, пункт 1). */
const notesHtml = (fix) => (fix?.n?.length ? fix.n.map((t) => `<p style="margin:0 0 10px;font-family:${FONT};font-size:14px;line-height:1.5;color:#3F4854">${esc(t)}</p>`) : []);
const notesText = (fix) => (fix?.n?.length ? ['', ...fix.n] : []);
const quote = (t) => `<!--copy--><div style="margin:6px 0 12px;padding:14px 16px;border-left:3px solid #1A8A7D;background:#FFFFFF;border-radius:6px;font-family:${FONT};font-size:15px;line-height:1.55;color:#14181C">${esc(t)}</div><!--/copy-->`;
// Таблица по тому же правилу, что строки над ней: конкуренты в строке ответа, не конкуренты ниже
// серым, все имена без обрезки (задание 25.09.2026, 1.2 и 2.2).
const questionStatus = (a) => a.previousNamed === null ? 'New question; history starts here.' : typeof a.previousNamed === 'boolean' ? `Previous check: ${a.previousNamed ? 'named you' : 'did not name you'}.` : '';
const listBlock = (rows) => rows.map((a) => `<div style="padding:10px 0;border-bottom:1px solid #E2DDD2;font-family:${FONT}">
  <div style="font-size:15px;line-height:1.4;color:#14181C;font-weight:600">${esc(a.question)}${a.custom ? ' <span style="font-weight:400">(Your question)</span>' : ''}</div>${questionStatus(a) ? `<div style="font-size:13px;color:#5A6470">${esc(questionStatus(a))}</div>` : ''}
  <div style="margin-top:3px;font-size:14px;line-height:1.45"><span style="font-weight:700;color:${a.error ? '#5A6470' : a.named ? '#1A8A7D' : '#B5412D'}">${a.error ? 'not asked' : a.named ? 'yes, named you' : 'no'}</span>${a.comp?.length ? `<span style="color:#3F4854"> · ${esc(a.comp.join(', '))}</span>` : !a.error && !a.named ? '<span style="color:#3F4854"> · no competitor named</span>' : ''}</div>
  ${a.other?.length ? `<div style="margin-top:2px;font-size:13px;line-height:1.45;color:#5A6470">Not counted as competitors: ${esc(a.other.join(', '))}</div>` : ''}
  ${a.unclear?.length ? `<div style="margin-top:2px;font-size:13px;line-height:1.45;color:#5A6470">Could not identify: ${esc(a.unclear.join(', '))}</div>` : ''}
</div>`).join('');
const rowText = (a) => `- ${a.question}${a.custom ? " (Your question)" : ""}${questionStatus(a) ? ` [${questionStatus(a)}]` : ""}: ${a.error ? 'not asked' : a.named ? 'yes' : 'no'}${a.comp?.length ? `. ${a.comp.join(', ')}` : !a.error && !a.named ? '. no competitor named' : ''}${a.other?.length ? `. Not counted as competitors: ${a.other.join(', ')}` : ''}${a.unclear?.length ? `. Could not identify: ${a.unclear.join(', ')}` : ''}`;

/** Тема отчёта по заданию: с цифрой и главным конкурентом. */
export function reportSubject({ host, week, summary, when = '' }) {
  /*
   * Раунд 3, пункт 8: «ChatGPT named you in 3 of 10 answers. Named more often: ZODIAC (3×)», если
   * лидер один; если лидеров несколько с одинаковым счётом, только «ChatGPT named you in 3 of 10
   * answers (first check)» или с датой. Счёт тот же, что в строке «instead of you» письма. Хвосты
   * «Co., Ltd.», «LLC» из названия убираются.
   */
  const label = week ? (when || `week ${week}`) : 'first check';
  if (summary.asked && summary.named === summary.asked) return `ChatGPT named you in all ${summary.asked} answers (${label})`;
  const base = `ChatGPT named you in ${summary.named} of ${summary.asked} answers`;
  const [top, second] = summary.competitors;
  // Раунд 4: лидер в теме, только если его назвали вместо вас чаще, чем назвали вас.
  // Дата или «first check» в каждой теме: одинаковые темы Gmail склеивает в одну цепочку.
  if (top && (!second || top.times > second.times) && top.times > summary.named) return `${base}. Named more often: ${shortName(top.name)} (${top.times}×), ${label}`;
  return `${base} (${label})`;
}
export const shortName = (n) => String(n || '').replace(/,?\s*\b(?:Co\.?,?\s*Ltd\.?|Company Limited|Co\.|Ltd\.?|Limited|LLC|L\.L\.C\.|Inc\.?|Pte\.?|PLC|LLP|GmbH|S\.?A\.?)(?=\s|$)/gi, '').replace(/[,.\s]+$/, '').trim();

/**
 * Отчёт Watch, первый (week 0) и недельные. Структура сверху вниз по разделу 3.2 задания.
 * history: прошлые недели, последняя в конце; rivals: только настоящие, из формы.
 */
/** «(↑1)» к числу против прошлой недели; нет прошлой недели или не изменилось, пусто. */
const arrow = (now, was) => (Number.isFinite(was) && now !== was ? ` (${now > was ? '↑' : '↓'}${Math.abs(now - was)})` : '');
/** Строка доли: «Named in 10 answers: You 5 (↑1) · Butler Estates 3 · …» (1.2). */
export function shareLine(share, prevShare = null) {
  const was = (name) => prevShare?.rivals?.find((r) => nameKey(r.name) === nameKey(name))?.times;
  return `Named in ${share.asked} answers: You ${share.you}${arrow(share.you, prevShare?.you)}${share.rivals.map((r) => ` · ${r.name} ${r.times}${arrow(r.times, was(r.name))}`).join('')}`;
}
/** Тональность одной строкой: «How ChatGPT describes you: neutral in 3, positive in 1.» (1.3). */
export function toneLine(tone) {
  const c = { positive: 0, neutral: 0, caveats: 0 };
  for (const t of tone) c[t.label] += 1;
  const parts = ['neutral', 'positive', 'caveats'].filter((k) => c[k]).sort((a, b) => c[b] - c[a]).map((k) => `${k === 'caveats' ? 'with caveats' : k} in ${c[k]}`);
  return parts.length ? `How ChatGPT describes you: ${parts.join(', ')}.` : '';
}
/** «Where to get mentioned» (1.1): какие сайты ChatGPT прочитал, есть ли там клиент, с чего начать. */
export function whereToGetMentioned(src) {
  if (!src || !src.top?.length) return null;
  const n = src.asked;
  const tag = (e) => `${e.domain} (${e.answers} ${e.answers === 1 ? 'answer' : 'answers'})`;
  const lines = [`To answer these questions, ChatGPT read: ${listAnd(src.top.map(tag))}.`];
  const missing = src.top.filter((e) => e.mentioned === false);
  const present = src.top.filter((e) => e.mentioned === true);
  const unknown = src.top.filter((e) => e.mentioned === null);
  if (missing.length === src.top.length) lines.push("We did not find your name on any of the checked source pages.");
  else if (missing.length) lines.push(`We did not find your name on the checked pages from ${listAnd(missing.map((e) => e.domain))}.`);
  if (present.length) lines.push(`We found your name on the checked pages from ${listAnd(present.map((e) => e.domain))}.`);
  if (unknown.length) lines.push(`We could not open ${listAnd(unknown.map((e) => e.domain))} to check whether you are there.`);
  const start = missing[0];
  if (start) lines.push(`Start with ${start.domain}: it shaped ${start.answers} of ${n} answers.`);
  const whose = (n) => (/s$/i.test(n) ? `${n}'` : `${n}'s`);
  for (const r of src.rivals || []) lines.push(`ChatGPT read ${whose(r.name)} own site for ${r.answers} ${r.answers === 1 ? 'answer' : 'answers'}.`);
  if (src.own) lines.push(`It read your own site for ${src.own} ${src.own === 1 ? 'answer' : 'answers'}.`);
  return { lines, top: src.top };
}

export function buildReportLetter({ host, email, week = 0, summary, history = [], site = null, rivals = [], fix = null, fixRepeat = false, fixLive = false, when, replaced = [], insight = null, changedQuestions = [] }) {
  const first = week === 0;
  const prev = history.length ? history[history.length - 1] : null;
  const plateau = history.length >= 2 && history.slice(-2).every((h) => h.named === summary.named) && summary.named < summary.asked;
  const subject = reportSubject({ host, week, summary, when });
  const headLine = first ? `Your first check: ChatGPT named you in ${summary.named} of ${summary.asked} answers` : `${when}: ChatGPT named you in ${summary.named} of ${summary.asked} answers`;
  const n = summary.asked;
  const blocks = [];
  const text = [headLine, ''];

  const intro = changedQuestions.length ? `On ${when} we checked ${n} buyer questions, including your updated questions.` : first
    ? `On ${when} we asked ChatGPT, with web search, the ${n} questions below, the way your buyers would ask them.`
    : `On ${when} we asked ChatGPT the same ${n} questions as before.`;
  blocks.push(par(esc(intro))); text.push(intro);
  // Замена вопроса не про работу клиента называется один раз, в письме той недели (раунд 3, 3.2).
  if (replaced.length) {
    const line = replaced.length === 1
      ? `We replaced one question that was not about your work: "${replaced[0].from}" → "${replaced[0].to}"`
      : `We replaced ${replaced.length} questions that were not about your work: ${replaced.map((r) => `"${r.from}" → "${r.to}"`).join('; ')}`;
    blocks.push(note(esc(line))); text.push(line);
  }
  if (changedQuestions.length) {
    const changeNote = `Your updated questions are now in use. History starts again for each changed question; unchanged questions keep their records. The overall total is not compared with the old question set this week.`;
    blocks.push(note(esc(changeNote))); text.push(changeNote);
  }
  if (!first && prev) {
    const d = summary.named - prev.named;
    const line = d === 0 && plateau
      ? (fixLive ? `No change since last week (${prev.named} of ${prev.asked}). Your fix is live; it can take a few weeks for ChatGPT to pick it up.` : `No change since last week (${prev.named} of ${prev.asked}).`)
      : `Last week: ${prev.named} of ${prev.asked}.`;
    blocks.push(`<p style="margin:0 0 12px;font-family:${FONT};font-size:15px;font-weight:700;color:${colorOf(d)}">${esc(line)}</p>`);
    text.push(line);
  }
  for (const w of summary.wins) {
    const line = endQuote(w.next.length ? `You were named next to ${listAnd(w.next)} for "${w.question}".` : `You were named for "${w.question}".`);
    blocks.push(par(esc(line))); text.push(line);
  }
  // Оговорка в ответах ChatGPT важнее всего остального: отдельным блоком наверху (1.3).
  const caveat = (insight?.tone || []).find((t) => t.label === 'caveats');
  if (caveat) {
    const line = `ChatGPT mentions a concern: "${caveat.quote}". Here is what to do about it: answer the reviews or pages it draws on, and add a fact to your site that settles the question.`;
    blocks.splice(1, 0, `<p style="margin:0 0 14px;padding:12px 14px;border-radius:10px;background:#FBF0D5;font-family:${FONT};font-size:15px;line-height:1.5;color:#16202B">${esc(line)}</p>`); text.splice(3, 0, line, '');
  }
  if (insight?.share && insight.share.rivals.length) {
    // Доля теми же числами, что таблица по вопросам ниже (1.2): «You 5 · Butler Estates 3 …».
    const line = shareLine(insight.share, prev?.share || null);
    blocks.push(par(`<strong>${esc(line.split(':')[0])}:</strong>${esc(line.slice(line.indexOf(':') + 1))}`)); text.push('', line);
  } else if (summary.competitors.length) {
    const list = listAnd(summary.competitors.map((c) => `${c.name} (in ${c.times} ${c.times === 1 ? 'answer' : 'answers'})`));
    blocks.push(par(`<strong>Named most often instead of you:</strong> ${esc(list)}.`)); text.push('', `Named most often instead of you: ${list}.`);
  } else if (summary.named < summary.asked) {
    const line = 'No competitor of yours was named in these answers, only other types of businesses. These questions are open for you.';
    blocks.push(par(esc(line))); text.push('', line);
  }
  if (summary.others.length || summary.unclear?.length) {
    const byType = new Map();
    for (const o of summary.others) { const t = o.type || 'other businesses'; byType.set(t, [...(byType.get(t) || []), o.name]); }
    // Кого разбор не опознал, не называем «не конкурентами»: это тоже утверждение. Пишем как есть.
    const unclear = [...(byType.get('unclear businesses') || []), ...(summary.unclear || []).map((u) => u.name)]; byType.delete('unclear businesses');
    const line = [byType.size ? `Also named (not your competitors): ${[...byType.entries()].map(([t, ns]) => `${t}: ${listAnd(ns)}`).join('; ')}.` : '',
      // Раунд 5, B1: названия неопознанных только в таблице, здесь одна строка.
      unclear.length ? `${unclear.length} other ${unclear.length === 1 ? 'name we could not classify is' : 'names we could not classify are'} listed in the table below.` : ''].filter(Boolean).join(' ');
    blocks.push(`<p style="margin:0 0 12px;font-family:${FONT};font-size:14px;line-height:1.5;color:#5A6470">${esc(line)}</p>`); text.push(line);
  }
  const tl = !caveat && insight?.tone?.length ? toneLine(insight.tone) : '';
  if (tl) { blocks.push(par(esc(tl))); text.push(tl); }
  else if (insight && summary.named > 0 && !insight.tone?.length) { const unavailable = 'No supported tone assessment is available for this check.'; blocks.push(note(esc(unavailable))); text.push(unavailable); }
  blocks.push(listBlock(summary.rows));
  text.push('', ...summary.rows.map(rowText));

  if (fix) {
    const row = summary.rows.find((r) => r.question === fix.q);
    // Раунд 5, B4: «This week's question: "…?" ChatGPT named X instead of you.»
    const q = `This week's question: "${fix.q}"${/[?!.]$/.test(fix.q) ? '' : '.'}`;
    const intro2 = fixRepeat ? "Last week's fix isn't on your site yet, so here it is again." : `${q}${row?.comp?.length ? ` ChatGPT named ${listAnd(row.comp.slice(0, 2))} instead of you.` : ''}`;
    blocks.push(h3('Fix of the week'), par(esc(intro2)), par(`<strong>${esc(fix.a)}</strong>`));
    if (fix.x) blocks.push(quote(fix.x), ...notesHtml(fix));
    blocks.push(par(esc("Publish it, and next week we'll check if ChatGPT picks it up.")));
    text.push('', 'Fix of the week', intro2, fix.a, ...(fix.x ? ['', fix.x, ...notesText(fix)] : []), '', "Publish it, and next week we'll check if ChatGPT picks it up.");
  }
  // «Where to get mentioned» вместо общей фразы про каталоги и отзывы, если источники пришли (1.1.6).
  const where = whereToGetMentioned(insight?.sources);
  if (where) {
    blocks.push(h3('Where to get mentioned'), ...where.lines.map((l) => par(esc(l))));
    text.push('', 'Where to get mentioned', ...where.lines);
  }
  // Балл сайта одной строкой (задание 25.09.2026, 9): «технически готов» уже несёт цифру.
  if (site) {
    const lastWeek = Number.isFinite(site.was) && !first ? `, last week ${site.was}` : '';
    const ready = Number.isFinite(site.now) && site.now >= 80 && summary.named < summary.asked / 2;
    const s = ready
      ? `Your site is technically ready (${site.now} out of 100${lastWeek}).${where ? '' : " What's missing is other sites talking about you: directories, reviews, articles."}`
      : `Your site score: ${Number.isFinite(site.now) ? `${site.now} out of 100` : 'not measured'}${lastWeek ? ` (${lastWeek.slice(2)})` : ''}.`;
    const rs = rivals.filter((r) => r.host).map((r) => `${r.host}: ${Number.isFinite(r.now) ? `${r.now} out of 100` : 'not measured'}${Number.isFinite(r.was) && !first ? ` (last week ${r.was})` : ''}.`);
    blocks.push(par(esc([s, ...rs].join(' ')))); text.push('', s, ...rs);
  }
  if (first) {
    const line = 'Are these the questions your buyers ask? Reply to this email with any changes. We keep the same questions every week so you can compare week to week.';
    blocks.push(par(esc(line))); text.push('', line);
  }
  if (fix) {
    const cta = fixRepeat ? 'See the fix' : "See this week's fix";
    blocks.push(button(fixLink(fix, week), `${cta} →`)); text.push('', `${cta}: ${fixLink(fix, week)}`);
  }
  const questionsUrl = `${settingsLink(email).replace('/email-settings/', '/watch/questions/')}&site=${encodeURIComponent(host)}`;
  blocks.push(par(`<a href="${esc(questionsUrl)}">Change your questions</a>`)); text.push('', `Change your questions: ${questionsUrl}`);
  const honest = 'The answers come from ChatGPT through its API with web search switched on. They change from run to run, so read the trend across weeks rather than any single answer.';
  blocks.push(note(esc(honest))); text.push('', honest, '', `Email settings: ${settingsLink(email)}`, `Manage subscription: ${MANAGE_URL}`);

  // Прехедер отдельной короткой фразой, не копия темы и заголовка (пункт 4 дополнения).
  const preheader = first ? 'The questions, the answers and your fix of the week.' : 'What changed since last week, and this week\'s fix.';
  const html = emailShell({ site: 'en', preheader, heading: [headLine], blocks, links: footer(email) });
  return { subject, text: text.join('\n'), html };
}

/** Письмо 3, день 3 пробной недели: «Сделали первую правку?» */
export function buildDay3Letter({ host, email, fix, comp = [], firstCheckAt, nextCheckAt }) {
  const l1 = endQuote(`On ${weekday(firstCheckAt)} ChatGPT didn't name you for "${fix.q}".${comp.length ? ` It named ${comp.slice(0, 2).join(' and ')}.` : ''}`);
  const l2 = fix.x ? `The fix is one paragraph on ${fix.p}. Here it is, ready to paste:` : `The fix is one change on ${fix.p}:`;
  const l3 = `It takes about 10 minutes. Publish it before ${fmtDay(nextCheckAt)}, and your next report will show whether ChatGPT picked it up.`;
  const html = emailShell({
    site: 'en', preheader: `The fix for ${host} is written and ready.`, heading: ['Did you add the first fix?'], links: footer(email),
    // Раунд 3, пункт 1: кнопка «Copy the text» только там, где текст стоит в самом письме.
    blocks: [par('Hi,'), par(esc(`Quick check on ${host}.`)), par(esc(l1)), par(esc(l2)), ...(fix.x ? [quote(fix.x), ...notesHtml(fix)] : [par(`<strong>${esc(fix.a)}</strong>`)]), button(fixLink(fix, 0), fix.x ? 'Copy the text →' : 'See the fix →'), par(esc(l3)), par('Maksim, OperStack')],
  });
  const text = ['Hi,', '', `Quick check on ${host}.`, '', l1, '', l2, ...(fix.x ? ['', fix.x, ...notesText(fix), ''] : [fix.a, '']), `${fix.x ? 'Copy the text' : 'See the fix'}: ${fixLink(fix, 0)}`, '', l3, '', 'Maksim, OperStack', '', `Email settings: ${settingsLink(email)}`, `Manage subscription: ${MANAGE_URL}`].join('\n');
  return { subject: 'Did you add the first fix?', text, html };
}

/** Цена плана словами для письма дня 5: «$35 for the next month». */
export const planCharge = (plan) => {
  if (!plan || !Number.isFinite(plan.price) || !['month', 'year'].includes(plan.per)) return null;
  const n = Number.isInteger(plan.price) ? String(plan.price) : plan.price.toFixed(2);
  return `$${n} for the next ${plan.per}`;
};

/**
 * Письмо 4, за два дня до конца пробной недели: что нашли и что дальше.
 *
 * С 25.09.2026 (задание Максима, 10): сумма списания обычным текстом в теле письма, с ценой того
 * плана, который человек выбрал (plan приходит из Whop, см. membershipInfo). Не узнали план, значит
 * называем обе цены, как на странице цен. Отмена «Cancel any time», пока Максим не подтвердил
 * «в одно нажатие». Кнопка правки сразу после находок.
 */
export function buildDay5Letter({ host, email, trialEnd, summary, fixes = 0, live = 0, rivals = [], fix = null, plan = null }) {
  const top = summary.competitors[0];
  const topRow = top ? summary.rows.find((r) => r.comp.includes(top.name) && !r.named) : null;
  const liveLine = live === 0 ? (fixes === 1 ? "It isn't live yet." : "They aren't live yet.") : `${live} ${live === 1 ? 'is' : 'are'} live.`;
  const found = [
    `ChatGPT named you in ${summary.named} of ${summary.asked} answers.`,
    ...(top && topRow ? [endQuote(`${top.name} is named where you are not: "${topRow.question}".`)] : []),
    ...(fixes > 0 ? [`${fixes} ${fixes === 1 ? 'fix is' : 'fixes are'} written for your site. ${liveLine}`] : []),
  ];
  const next = [
    'we ask ChatGPT the same questions and show what changed;',
    'you get the next fix, written and ready to paste;',
    rivals.length ? `you see ${listAnd(rivals.slice(0, 3))} beside you.` : 'you see who ChatGPT names instead of you, and how that moves.',
  ];
  const end = fmtDate(trialEnd);
  const charge = planCharge(plan);
  // Раунд 3, пункт 4: ссылка отмены в самом абзаце, рядом с суммой и датой.
  const cancelDay = fmtDate(trialEnd);
  const money = charge
    ? `Your free week ends on ${end}. On that day you'll be charged ${charge}, then ${plan.per === 'year' ? 'yearly' : 'monthly'} until you cancel. You don't need to do anything to continue. To avoid the charge, cancel before ${cancelDay}:`
    : `Your free week ends on ${end}. On that day your plan continues at the price you chose at checkout, $35 a month or $299 a year, until you cancel. You don't need to do anything to continue. To avoid the charge, cancel before ${cancelDay}:`;
  const moneyHtml = `${esc(money)} <a href="${MANAGE_URL}" style="color:#1A8A7D;text-decoration:underline">Manage subscription</a>.`;
  const publish = `Publish your fix before ${end}, and the next check will show whether ChatGPT picks it up.`;
  const showFix = Boolean(fix) && live === 0;
  const ul = (xs) => `<ul style="margin:6px 0 14px;padding-left:20px;font-family:${FONT};font-size:15px;line-height:1.6;color:#14181C">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const html = emailShell({
    site: 'en', preheader: `Your free week ends on ${end}.`, heading: [`${host}: your week with OperStack`], links: footer(email),
    blocks: [par('Hi,'), par('Here is what we found:'), ul(found),
      ...(showFix ? [par(esc(publish)), button(fixLink(fix, 0), 'See your fix →')] : []),
      par('<strong>What happens next, every week:</strong>'), ul(next), par(moneyHtml), par('Maksim, OperStack')],
  });
  const text = ['Hi,', '', 'Here is what we found:', '', ...found.map((x) => `- ${x}`),
    ...(showFix ? ['', publish, `See your fix: ${fixLink(fix, 0)}`] : []),
    '', 'What happens next, every week:', ...next.map((x) => `- ${x}`), '', `${money} ${MANAGE_URL}`, '', 'Maksim, OperStack', '', `Email settings: ${settingsLink(email)}`, `Manage subscription: ${MANAGE_URL}`].join('\n');
  return { subject: `Your week with OperStack: what we found on ${host}`, text, html };
}

/**
 * Письмо 6, две недели без изменений: честная причина и что двигает.
 *
 * Раунд 3, пункт 1: в письме сама правка (вопрос, что сделать и абзац в той же рамке, что в недельном
 * отчёте), кнопка ведёт на её страницу /fix/. Заголовок не спорит с результатом: «more often», если
 * клиента называли хоть раз, и «yet», если ни разу.
 */
export function buildPlateauLetter({ host, email, summary, fix = null, fixLive = false, when = fmtDate(Date.now()) }) {
  const head = `Two weeks, same result: ${summary.named} of ${summary.asked}. Here's the honest reason and what moves it.`;
  const title = summary.named > 0 ? `Why ChatGPT isn't naming ${host} more often` : `Why ChatGPT isn't naming ${host} yet`;
  const showFix = !fixLive && fix;
  const body = showFix
    ? "The fixes aren't on your site yet. ChatGPT can only name you for what your site and other sites say about you. Start with this one:"
    : 'Your site is ready. ChatGPT also looks at what other sites say about you. The fastest thing to add: a listing or reviews on the directories and review sites your buyers already use.';
  const forQ = showFix ? `The question: "${fix.q}"${/[?!.]$/.test(fix.q) ? '' : '.'}` : '';
  const html = emailShell({
    site: 'en', preheader: head, heading: [title], links: footer(email),
    blocks: [par('Hi,'), par(esc(head)), par(esc(body)),
      ...(showFix ? [par(esc(forQ)), par(`<strong>${esc(fix.a)}</strong>`), ...(fix.x ? [quote(fix.x), ...notesHtml(fix)] : []), button(fixLink(fix, 0), fix.x ? 'Copy the text →' : 'See the fix →')] : []),
      par('Reply to this email if you want us to look at it with you.'), par('Maksim, OperStack')],
  });
  const text = ['Hi,', '', head, '', body, ...(showFix ? ['', forQ, fix.a, ...(fix.x ? ['', fix.x, ...notesText(fix)] : []), '', `${fix.x ? 'Copy the text' : 'See the fix'}: ${fixLink(fix, 0)}`] : []), '', 'Reply to this email if you want us to look at it with you.', '', 'Maksim, OperStack', '', `Email settings: ${settingsLink(email)}`, `Manage subscription: ${MANAGE_URL}`].join('\n');
  // В теме дата: письмо может прийти снова через четыре недели, и Gmail склеил бы их в цепочку.
  return { subject: `${title} (${when})`, text, html };
}

/*
 * Почему они, а не я (задание «функции Watch», этап 1). Три вещи из того, что уже пришло в ответах:
 * 1.1 какие сайты ChatGPT прочитал, чтобы ответить, и есть ли на них клиент («Where to get mentioned»);
 * 1.2 доля ответов: клиент против каждого конкурента, теми же числами, что таблица по вопросам;
 * 1.3 как ChatGPT о клиенте отзывается, одной меткой на ответ, где он назван, с цитатой из ответа.
 */
const rootOf = (host) => norm(String(host).replace(/^www\./, '').split('.').slice(0, -1).join('.') || host);
export function sourceSummary(answers, { url }, summary) {
  const own = hostOf(url);
  const rivals = (summary.competitors || []).concat(summary.overall || []).map((c) => c.name).filter((n, i, a) => a.indexOf(n) === i);
  const rivalOf = (host) => {
    const r = rootOf(host);
    return rivals.find((n) => { const k = coreKey(n) || norm(n); return k.length >= 4 && (r.includes(k) || k.includes(r)) && r.length >= 4; }) || null;
  };
  const byDomain = new Map();
  let withSources = 0;
  for (const a of answers) {
    const list = (a.sources || []).filter((x) => x && x.url);
    if (list.length) withSources += 1;
    const seen = new Set();
    for (const x of list) {
      const d = hostOf(x.url); if (!d || seen.has(d)) continue; seen.add(d);
      const e = byDomain.get(d) || { domain: d, answers: 0, url: x.url, title: x.title || '' };
      e.answers += 1; byDomain.set(d, e);
    }
  }
  const all = [...byDomain.values()].sort((a, b) => b.answers - a.answers || a.domain.localeCompare(b.domain));
  const isOwn = (d) => d === own || d.endsWith(`.${own}`);
  return {
    asked: answers.length, withSources,
    own: all.filter((e) => isOwn(e.domain)).reduce((n, e) => n + e.answers, 0),
    rivals: all.filter((e) => !isOwn(e.domain) && rivalOf(e.domain)).map((e) => ({ ...e, name: rivalOf(e.domain) })).slice(0, 3),
    top: all.filter((e) => !isOwn(e.domain) && !rivalOf(e.domain)).slice(0, 5),
  };
}
/** Есть ли клиент на сайте-источнике: по названию и по домену на самой странице. Не открылась, значит неизвестно. */
export async function markMentions(top, { brand, url }, fetchPage = (u) => readHomepage(u, 200000)) {
  const b = norm(brand); const host = hostOf(url);
  return Promise.all(top.map(async (e) => {
    try {
      const p = await fetchPage(e.url);
      const hay = norm(`${p.title} ${p.text}`);
      if (hay.length < 200) return { ...e, mentioned: null };
      return { ...e, mentioned: (b.length >= 4 && hay.includes(b)) || hay.includes(norm(host)) };
    } catch { return { ...e, mentioned: null }; }
  }));
}
/** Доля ответов по строкам таблицы: у клиента и у конкурентов (юристы, порталы и неопознанные сюда не входят). */
export function shareOfAnswers(summary, limit = 4) {
  const rows = (summary.rows || []).filter((r) => !r.error);
  const counts = new Map();
  for (const r of rows) { const seen = new Set(); for (const n of r.comp || []) { const k = nameKey(n); if (seen.has(k)) continue; seen.add(k); const c = counts.get(k) || { name: n, times: 0 }; c.times += 1; counts.set(k, c); } }
  const rivals = [...counts.values()].sort((a, b) => b.times - a.times || a.name.localeCompare(b.name)).slice(0, limit);
  return { asked: rows.length, you: rows.filter((r) => r.named).length, rivals };
}
/** Тональность: одна метка на ответ, где клиент назван, и дословная цитата-основание. Без цитаты метки нет. */
export function supportedToneQuote(quote, mention) {
  const plain = String(quote || '').replace(/\[[^\]]*\]\(https?:[^)]+\)/g, '').replace(/https?:\/\/\S+/g, '');
  const words = plain.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
  return words.length >= 5 && words.length <= 20 && norm(mention).includes(norm(quote));
}
export async function toneOf(answers, brand) {
  const items = answers.map((a, id) => ({ id, a })).filter((x) => x.a.named && x.a.mention);
  if (!items.length) return [];
  const schema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'label', 'quote'], properties: { id: { type: 'integer' }, label: { type: 'string', enum: ['positive', 'neutral', 'caveats', 'none'] }, quote: { type: 'string' } } } } } };
  const out = await json([
    `Each item is the part of a ChatGPT answer that mentions ${brand}. Label how the answer describes ${brand}:`,
    'positive: praises or recommends it; neutral: states facts without judgement; caveats: mentions a concern, limitation or complaint about it; none: not enough to tell.',
    'quote: the exact words from the item (5 to 20 words) that justify the label, copied character for character, or "" for none.',
    '', ...items.map((x) => `${x.id}. ${x.a.mention}`),
  ].join('\n'), schema, 'watch_tone', 600, env('WATCH_CLASSIFY_MODEL', 'gpt-5.4-mini'));
  const byId = new Map(items.map((x) => [x.id, x.a]));
  return (out.items || []).filter((t) => t.label !== 'none' && byId.has(t.id) && t.quote && supportedToneQuote(t.quote, byId.get(t.id).mention))
    .map((t) => ({ question: byId.get(t.id).question, label: t.label, quote: t.quote.trim() }));
}
export async function buildInsight(answers, target, summary, { fetchPage } = {}) {
  const src = sourceSummary(answers, target, summary);
  const top = await markMentions(src.top, target, fetchPage).catch(() => src.top.map((e) => ({ ...e, mentioned: null })));
  const tone = await toneOf(answers, target.brand).catch(() => []);
  return { sources: { ...src, top }, share: shareOfAnswers(summary), tone };
}

/** Одна неделя целиком: вопросы, разбор имён, итог и правка. Общая для первого отчёта и недельных. */
export async function runWeek({ url, brand, category, city, questions, previousFix = null, log = () => {} }) {
  const target = { brand, url };
  const answers = await askAll(questions, target, log);
  const classes = await classifyWeek(answers, { category, city, brand });
  const summary = summarise(answers, target, classes);
  let fix = null; let fixRepeat = false; let fixLive = false;
  if (previousFix) fixLive = await fixIsLive(url, previousFix);
  if (previousFix && !fixLive && summary.rows.some((r) => r.question === previousFix.q && r.named === false)) { fix = previousFix; fixRepeat = true; }
  else {
    const row = pickFixQuestion(summary);
    if (row) {
      try { fix = await buildFix({ url, brand, category, city, question: row.question, competitors: row.comp }); }
      catch (e) { log(`  правка не написана: ${e.message}`); }
    }
  }
  const insight = await buildInsight(answers, target, summary).catch(() => null);
  return { answers, summary, fix, fixRepeat, fixLive, insight };
}


export const questionKey = (value) => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
export function validateWatchQuestions(values) {
  if (!Array.isArray(values) || values.length !== 10) throw new Error('Enter exactly 10 questions.');
  const questions = values.map((v) => {
    if (typeof v !== 'string' || v.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) throw new Error('Each question must be plain text, up to 500 characters.');
    const q = v.trim().replace(/\s+/g, ' ');
    if ((q.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length < 5) throw new Error('Each question needs at least 5 words.');
    return q;
  });
  if (new Set(questions.map(questionKey)).size !== 10) throw new Error('Use 10 different questions.');
  return questions;
}
export function watchQuestionPlan(baseline, last, customRaw = '') {
  const custom = customRaw ? JSON.parse(customRaw) : null;
  const questions = custom ? validateWatchQuestions(custom.questions) : baseline.questions || [];
  const previous = last.report?.rows || baseline.report?.rows || [];
  const oldQuestions = previous.length ? previous.map((r) => r.question) : baseline.questions || [];
  const changed = questions.filter((q) => !oldQuestions.some((old) => questionKey(old) === questionKey(q)));
  const sameSet = (a, b) => a.length === b.length && a.every((q) => b.some((x) => questionKey(x) === questionKey(q)));
  const history = (last.history || baseline.history || []).filter((h) => h.questions ? sameSet(h.questions, questions) : sameSet(oldQuestions, questions));
  return { questions, changed, history, custom: custom ? questions.filter((q, i) => custom.custom?.[i] !== false) : [] };
}
export function attachQuestionHistory(summary, previous, custom, existing = {}) {
  const history = {};
  summary.rows = summary.rows.map((row) => {
    const key = questionKey(row.question);
    const old = previous.find((p) => questionKey(p.question) === key);
    const samples = [...(existing[key] || [])];
    if (!samples.length && old && !old.error) samples.push(Boolean(old.named));
    if (!row.error) samples.push(Boolean(row.named));
    history[key] = samples.slice(-60);
    return { ...row, custom: custom.some((q) => questionKey(q) === key), previousNamed: old && !old.error ? Boolean(old.named) : null };
  });
  return history;
}
