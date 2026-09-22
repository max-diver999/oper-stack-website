/**
 * Двадцать сайтов без единой команды в терминале.
 *
 * Простым языком: человек открывает страницу по ссылке из своего письма, вставляет список сайтов
 * из блокнота или из таблицы, нажимает кнопку и получает на почту таблицу «кому писать первым».
 * Ни установки, ни командной строки, ни программ на компьютере.
 *
 * Технически это та же очередь, что у отчёта за 9 долларов: подписанное служебное письмо на наш
 * ящик, которое разбирает ops-runner. Базы нет намеренно, чужие адреса живут ровно до отправки.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export type ProspectJob = {
  email: string;
  sites: { url: string; name: string }[];
  lang: 'en' | 'ru';
  /** Оформление агентского плана. Логотип берётся по адресу с его же сайта: хранить чужие файлы
   *  мы не хотим, а логотип у агентства почти всегда уже лежит в открытом доступе. */
  brand?: { by: string; color: string; logo: string };
};

const HEX = /^#?[0-9a-f]{6}$/i;

/** Оформление из формы. Пустые поля просто не применяются, кривые не роняют заявку. */
export function parseBrand(by: string, color: string, logo: string): ProspectJob['brand'] | undefined {
  const name = String(by || '').trim().slice(0, 60);
  if (!name) return undefined;
  let logoUrl = '';
  try {
    const u = new URL(String(logo || '').trim());
    if (/^https?:$/.test(u.protocol) && /\.(svg|png|jpe?g|webp)$/i.test(u.pathname)) logoUrl = u.toString();
  } catch { /* логотип необязателен */ }
  return { by: name, color: HEX.test(String(color || '').trim()) ? String(color).trim() : '', logo: logoUrl };
}

/** Сколько сайтов принимаем за раз. Двадцать это и обещание курса, и потолок разумного прогона. */
export const MAX_SITES = 20;

/**
 * Разбор того, что человек вставил. Он вставит что угодно: из блокнота, из Excel, со ссылками и
 * без, с пустыми строками, с точкой с запятой вместо запятой. Разбирать надо всё это, а не учить
 * человека формату: формат это наша работа, а не его.
 */
export function parsePasted(raw: string): { sites: { url: string; name: string }[]; skipped: string[] } {
  const sites: { url: string; name: string }[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const line of String(raw || '').split(/[\r\n]+/)) {
    const text = line.trim();
    if (!text || text.startsWith('#')) continue;
    // Разделителем может оказаться запятая, точка с запятой или табуляция из таблицы.
    const [first, ...rest] = text.split(/[,;\t]/);
    const name = rest.join(' ').trim();
    let candidate = first.trim().replace(/^<|>$/g, '');
    if (!candidate) continue;
    if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
    try {
      const u = new URL(candidate);
      if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) throw new Error('not a site');
      const key = u.hostname.replace(/^www\./, '').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      sites.push({ url: u.origin + (u.pathname === '/' ? '/' : u.pathname), name: name || key });
    } catch {
      skipped.push(text.slice(0, 80));
    }
  }
  return { sites: sites.slice(0, MAX_SITES), skipped };
}

export function buildProspectSubject(job: ProspectJob): string {
  return `Prospect run: ${job.sites.length} site(s)`;
}

/** Первая строка тела: PROSPECT-RUN v1 <payload> <подпись>. Её и читает очередь. */
export function buildProspectBody(job: ProspectJob, secret: string): { text: string; html: string } {
  const payload = Buffer.from(JSON.stringify(job)).toString('base64url');
  const line = `PROSPECT-RUN v1 ${payload} ${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  const list = job.sites.map((s) => `  ${s.url}${s.name && s.name !== s.url ? `, ${s.name}` : ''}`);
  const brand = job.brand ? [`Brand: ${job.brand.by}${job.brand.color ? ` ${job.brand.color}` : ''}${job.brand.logo ? ' + logo' : ''}`] : [];
  const text = [line, '', `Buyer: ${job.email}`, ...brand, `Sites: ${job.sites.length}`, ...list, '',
    'Служебная заявка. Её читает очередь, отвечать не нужно.'].join('\n');
  const html = [
    `<pre style="font:12px ui-monospace,monospace;color:#888;white-space:pre-wrap;word-break:break-all">${line}</pre>`,
    `<p>Buyer: ${job.email}<br>Sites: ${job.sites.length}</p>`,
    '<p style="color:#888;font-size:13px">Служебная заявка. Её читает очередь, отвечать не нужно.</p>',
  ].join('\n');
  return { text, html };
}

/** Проверка подписи на стороне очереди. */
export function readProspectJob(firstLine: string, secret: string): ProspectJob | null {
  const m = String(firstLine || '').trim().match(/^PROSPECT-RUN v1 ([A-Za-z0-9_-]+) ([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const expected = Buffer.from(createHmac('sha256', secret).update(m[1]).digest('base64url'));
  const given = Buffer.from(m[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try { return JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8')) as ProspectJob; } catch { return null; }
}
