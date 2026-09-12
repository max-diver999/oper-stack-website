/**
 * Проверка файла llms.txt.
 *
 * Простым языком. llms.txt это короткий список ваших страниц, написанный для программ: ассистент
 * читает его вместо того, чтобы обходить весь сайт, и по нему решает, что у вас вообще есть. Файл
 * ставят один раз и забывают, а сайт живёт дальше: страницы переименовываются, разделы исчезают.
 * Через полгода половина ссылок в нём ведёт в никуда, и ассистент цитирует несуществующие страницы
 * или не цитирует вовсе. Человек этого не замечает, потому что этот адрес никто не открывает.
 *
 * Здесь файл читается, разбирается по формату и по каждой ссылке проверяется, куда она на самом
 * деле ведёт. Ничего не сохраняется.
 *
 * Технически: спецификация llmstxt.org требует H1 первой строкой; краткое описание блочной цитатой
 * и разделы со списками ссылок описаны как рекомендация, поэтому их отсутствие это замечание, а не
 * провал. Ссылки проверяются HEAD-запросом с коротким сроком, с общим бюджетом на весь прогон:
 * страница ответа важнее полноты обхода.
 */

export type LinkResult = {
  url: string;
  title: string;
  status: number | null;
  redirectedTo?: string;
  note?: string;
};

export type Finding = { level: 'fail' | 'warn' | 'ok'; message: string };

export type LlmsCheck = {
  site: string;
  url: string;
  found: boolean;
  bytes: number;
  hasFull: boolean;
  title: string | null;
  summary: string | null;
  sections: string[];
  links: LinkResult[];
  linkCount: number;
  checked: number;
  offSite: number;
  findings: Finding[];
  verdict: 'good' | 'needs work' | 'broken' | 'missing';
};

const UA = 'Mozilla/5.0 (compatible; OperStackLlmsCheck/1.0; +https://oper-stack.com/tools/llms-txt-checker/)';

async function fetchText(url: string, ms: number): Promise<{ ok: boolean; status: number | null; text: string }> {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/plain,text/markdown,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(ms) });
    return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
  } catch {
    return { ok: false, status: null, text: '' };
  }
}

async function headOnce(url: string, ms: number): Promise<{ status: number | null; location?: string }> {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'user-agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(ms) });
    const location = res.headers.get('location') || undefined;
    // Часть серверов не отвечает на HEAD. Один повтор обычным запросом, иначе получим ложные 405.
    if (res.status === 405 || res.status === 501) {
      const g = await fetch(url, { method: 'GET', headers: { 'user-agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(ms) });
      return { status: g.status, location: g.headers.get('location') || undefined };
    }
    return { status: res.status, location };
  } catch {
    return { status: null };
  }
}

/** Строки вида «- [Заголовок](адрес): пояснение». Пояснение необязательно. */
const LINK_RE = /^\s*[-*]\s*\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*:?\s*(.*)$/;
/** Голый адрес в списке: «- https://site/page — пояснение». Формат такого не просит, но так пишут
 *  чаще всего, и делать вид, что ссылок нет, было бы неправдой. */
const BARE_RE = /^\s*[-*]\s*(https?:\/\/\S+|\/\S+)\s*(?:[:\u2014\u2013-]\s*(.*))?$/;

export function parseLlms(text: string): { title: string | null; summary: string | null; sections: string[]; links: { title: string; url: string }[]; bare: number } {
  const lines = text.split(/\r?\n/);
  let title: string | null = null;
  let summary: string | null = null;
  const sections: string[] = [];
  const links: { title: string; url: string }[] = [];
  let bare = 0;
  for (const line of lines) {
    const h1 = /^#\s+(.+)$/.exec(line);
    if (h1 && !title) { title = h1[1].trim(); continue; }
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) { sections.push(h2[1].trim()); continue; }
    const quote = /^>\s*(.+)$/.exec(line);
    if (quote && !summary) { summary = quote[1].trim(); continue; }
    const m = LINK_RE.exec(line);
    if (m) { links.push({ title: m[1].trim(), url: m[2].trim() }); continue; }
    const b = BARE_RE.exec(line);
    if (b) { bare++; links.push({ title: (b[2] || '').trim() || '(no title)', url: b[1].trim() }); }
  }
  return { title, summary, sections, links, bare };
}

export function normaliseSite(raw: string): { ok: true; origin: string } | { ok: false; reason: string } {
  const s = String(raw || '').trim();
  if (!s) return { ok: false, reason: 'Enter the address of a site.' };
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(s);
  if (scheme && !/^https?$/i.test(scheme[1])) return { ok: false, reason: 'Only http and https addresses work.' };
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return { ok: false, reason: 'That does not look like a web address.' }; }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) return { ok: false, reason: 'That does not look like a domain name.' };
  // Зарезервированные имена ловим и с конца: internal.localhost и box.local проходят проверку на
  // домен, но всегда указывают внутрь машины или сети.
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[)/i.test(u.hostname)
    || /\.(localhost|local|internal|test|example|invalid|home|lan|intranet)$/i.test(u.hostname)) {
    return { ok: false, reason: 'A local address is not reachable from the outside.' };
  }
  return { ok: true, origin: u.origin };
}

export async function checkLlms(site: string, { maxLinks = 12, budgetMs = 9000 } = {}): Promise<LlmsCheck> {
  const origin = site.replace(/\/$/, '');
  const url = `${origin}/llms.txt`;
  const started = Date.now();
  const left = () => Math.max(500, budgetMs - (Date.now() - started));

  const main = await fetchText(url, Math.min(6000, left()));
  const base: LlmsCheck = {
    site: origin, url, found: main.ok, bytes: main.text.length, hasFull: false,
    title: null, summary: null, sections: [], links: [], linkCount: 0, checked: 0, offSite: 0,
    findings: [], verdict: 'missing',
  };

  if (!main.ok) {
    base.findings.push({
      level: 'fail',
      message: main.status === null
        ? 'The site did not answer at /llms.txt. Either there is no file there, or the site is refusing automated readers.'
        : `There is no file at ${url}: the server answered ${main.status}. An assistant that looks for a map of your site finds nothing and has to guess from your HTML.`,
    });
    return base;
  }

  const parsed = parseLlms(main.text);
  base.title = parsed.title;
  base.summary = parsed.summary;
  base.sections = parsed.sections;
  base.linkCount = parsed.links.length;

  if (!parsed.title) base.findings.push({ level: 'fail', message: 'The file does not start with a heading. The format asks for one H1 line naming the site, and a reader that cannot find it does not know whose map this is.' });
  else base.findings.push({ level: 'ok', message: `The file names the site: ${parsed.title}` });

  if (!parsed.summary) base.findings.push({ level: 'warn', message: 'No short summary. One blockquote line under the heading is what an assistant quotes when it explains what your site is.' });
  if (!parsed.sections.length) base.findings.push({ level: 'warn', message: 'No sections. Headings group the links so a reader can tell guides from products without opening them.' });
  if (!parsed.links.length) base.findings.push({ level: 'fail', message: 'The file lists no links. A map with nothing on it is the same as no map.' });
  else if (parsed.bare === parsed.links.length) base.findings.push({ level: 'warn', message: `All ${parsed.links.length} links are written as bare addresses. The format asks for [title](address): a line explaining what is behind the link, which is the part a reader quotes when it decides what to open.` });
  else if (parsed.bare) base.findings.push({ level: 'warn', message: `${parsed.bare} of ${parsed.links.length} links are written as bare addresses instead of [title](address). Mixed formats are read inconsistently.` });

  // Ссылки. Бюджет один на всех: страница ответа важнее полноты обхода.
  const sample = parsed.links.slice(0, maxLinks);
  const results: LinkResult[] = [];
  await Promise.all(sample.map(async (l) => {
    let abs = l.url;
    try { abs = new URL(l.url, `${origin}/`).href; } catch { /* оставляем как есть */ }
    const off = (() => { try { return new URL(abs).origin !== origin; } catch { return false; } })();
    if (off) base.offSite++;
    const r = await headOnce(abs, Math.min(4000, left()));
    results.push({
      url: abs, title: l.title, status: r.status,
      ...(r.location ? { redirectedTo: new URL(r.location, abs).href } : {}),
      ...(off ? { note: 'points at another domain' } : {}),
    });
  }));
  base.links = results.sort((a, b) => sample.findIndex((s) => s.title === a.title) - sample.findIndex((s) => s.title === b.title));
  base.checked = results.length;

  const dead = results.filter((r) => r.status === null || (r.status >= 400));
  const moved = results.filter((r) => r.status !== null && r.status >= 300 && r.status < 400);
  if (dead.length) base.findings.push({ level: 'fail', message: `${dead.length} of ${results.length} checked links do not lead to a page. An assistant following your own map lands on nothing.` });
  if (moved.length) base.findings.push({ level: 'warn', message: `${moved.length} of ${results.length} checked links redirect. Point the map at the final address: every hop is a chance to lose the reader.` });
  if (!dead.length && !moved.length && results.length) base.findings.push({ level: 'ok', message: `All ${results.length} checked links answer directly.` });
  if (base.offSite) base.findings.push({ level: 'warn', message: `${base.offSite} link(s) point at another domain. That is allowed, but a map of your site that sends readers elsewhere is doing someone else a favour.` });

  const full = await fetchText(`${origin}/llms-full.txt`, Math.min(3000, left()));
  base.hasFull = full.ok;
  if (full.ok) base.findings.push({ level: 'ok', message: 'There is also an llms-full.txt, so a reader can take the whole text in one request.' });

  const fails = base.findings.filter((f) => f.level === 'fail').length;
  const warns = base.findings.filter((f) => f.level === 'warn').length;
  base.verdict = fails ? 'broken' : warns ? 'needs work' : 'good';
  return base;
}
