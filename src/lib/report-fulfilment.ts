/**
 * Выдача отчёта по сайту: ступени за 9 и за 29 долларов.
 *
 * Простым языком. Покупатель платит на Whop, и сразу получает письмо с одной ссылкой. По ссылке
 * открывается страница с одним полем: адрес его сайта. Больше от него ничего не нужно, ни
 * регистрации, ни доступов к его счётчикам. После отправки формы мы делаем отчёт и присылаем PDF.
 *
 * Почему не спрашиваем адрес прямо на оплате: тогда он зависел бы от настроек чужой площадки, а
 * ссылка в письме работает всегда и её можно открыть с телефона, когда удобно.
 *
 * Технически: идентификатор товара Whop лежит в коде, а не в переменной окружения, потому что он
 * не секрет и кнопка не должна зависеть от доступа к панели хостинга. Ссылка подписана тем же
 * секретом, что и ссылка на скачивание кита (KIT_DOWNLOAD_SECRET), и живёт тридцать дней.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export type ReportTier = '9' | '29';

/** Товары Whop, которые означают отчёт. Пустое значение означает «товар ещё не заведён». */
const TIER_BY_PRODUCT: Record<string, ReportTier> = {
  prod_xGGOfxv4ZJ9bf: '9',
};

/** Переопределение через окружение: WHOP_REPORT_IDS="prod_a:9,prod_b:29". */
export function reportTierMap(spec = ''): Record<string, ReportTier> {
  const extra: Record<string, ReportTier> = {};
  for (const entry of String(spec).split(',')) {
    const [id, tier] = entry.trim().split(':');
    if (id && (tier === '9' || tier === '29')) extra[id] = tier;
  }
  return { ...TIER_BY_PRODUCT, ...extra };
}

/** Сколько страниц и сколько конкурентов даёт каждая ступень. Одно место на весь продукт. */
export const TIER_SPEC: Record<ReportTier, { pages: number; competitors: number; weeks: number }> = {
  '9': { pages: 20, competitors: 0, weeks: 0 },
  '29': { pages: 20, competitors: 3, weeks: 4 },
};

/** Ссылка живёт месяц: покупатель может ввести адрес не сразу. */
export const TOKEN_DAYS = 30;

export type ReportClaims = { email: string; tier: ReportTier; lang: 'ru' | 'en'; exp: number };

export function makeReportToken(claims: ReportClaims, secret: string): string {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function verifyReportToken(
  token: string,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): { ok: boolean; claims?: ReportClaims; reason?: string } {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return { ok: false, reason: 'malformed link' };
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('base64url'));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'bad signature' };
  let claims: ReportClaims;
  try { claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return { ok: false, reason: 'unreadable link' }; }
  if (!claims?.email || !claims?.tier) return { ok: false, reason: 'incomplete link' };
  if (!claims.exp || claims.exp < nowSec) return { ok: false, reason: 'link expired' };
  return { ok: true, claims };
}

/**
 * Адрес сайта из формы. Принимаем только настоящий публичный домен: внутренние и служебные адреса
 * отсекаются здесь, а не в очереди, чтобы человек увидел причину сразу, а не в тишине.
 */
export function normaliseSiteUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const s = String(raw || '').trim();
  if (!s) return { ok: false, reason: 'Enter the address of your site.' };
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return { ok: false, reason: 'That does not look like a web address.' }; }
  if (!/^https?:$/.test(u.protocol)) return { ok: false, reason: 'Only http and https addresses work.' };
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) return { ok: false, reason: 'That does not look like a domain name.' };
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[)/i.test(u.hostname)) return { ok: false, reason: 'A local address is not reachable from the outside.' };
  return { ok: true, url: `${u.origin}${u.pathname === '/' ? '/' : u.pathname}` };
}

export type ReportJob = { url: string; email: string; lang: 'ru' | 'en'; tier: ReportTier };

/**
 * Служебное письмо, которое ставит заявку в очередь.
 *
 * Тема человеческая: её видит владелец ящика, и строка из ста символов base64 в списке писем это
 * просто мусор на экране. Подпись переехала в первую строку тела. Подпись обязательна: без неё кто
 * угодно письмом заставил бы нас гонять бесплатные аудиты и слать PDF на любой адрес.
 */
export function buildRunSubject(job: ReportJob): string {
  let host = job.url;
  try { host = new URL(job.url).host; } catch { /* оставляем как есть */ }
  return `Report request: ${host} (${job.tier} USD)`;
}

/** Первая строка тела: REPORT-RUN v1 <payload> <подпись>. Её и читает очередь. */
export function buildRunBody(job: ReportJob, secret: string): { text: string; html: string } {
  const payload = Buffer.from(JSON.stringify(job)).toString('base64url');
  const line = `REPORT-RUN v1 ${payload} ${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  const text = [line, '', `Site: ${job.url}`, `Buyer: ${job.email}`, `Tier: ${job.tier} USD`, `Language: ${job.lang}`, '', 'Служебная заявка. Её читает очередь отчётов, отвечать не нужно.'].join('\n');
  const html = [`<pre style="font:12px ui-monospace,monospace;color:#888;white-space:pre-wrap;word-break:break-all">${line}</pre>`,
    `<p>Site: ${job.url}<br>Buyer: ${job.email}<br>Tier: ${job.tier} USD<br>Language: ${job.lang}</p>`,
    '<p style="color:#888;font-size:13px">Служебная заявка. Её читает очередь отчётов, отвечать не нужно.</p>'].join('\n');
  return { text, html };
}

const COPY = {
  en: {
    subject: (tier: ReportTier) => (tier === '29' ? 'Your OperStack report and month of watching: one step left' : 'Your OperStack report: one step left'),
    hello: 'Thank you. One thing left: tell us which site to read.',
    action: 'Open this link and enter your address:',
    what: (tier: ReportTier) =>
      tier === '29'
        ? 'You will get the full measurement of your site and of up to three competitors side by side, then four weekly re-checks by email showing what changed. The first report usually arrives within the hour.'
        : 'You will get the full measurement of your site as a PDF: six area scores, every check with its finding, how much of your text disappears without JavaScript, and the files agents look for on your domain. It usually arrives within the hour.',
    validity: `The link works for ${TOKEN_DAYS} days. If it stops working, write to info@oper-stack.com from the address you paid with.`,
    sign: 'OperStack · info@oper-stack.com',
  },
  ru: {
    subject: (tier: ReportTier) => (tier === '29' ? 'Отчёт OperStack и месяц наблюдения: остался один шаг' : 'Отчёт OperStack: остался один шаг'),
    hello: 'Спасибо. Остался один шаг: сказать, какой сайт читать.',
    action: 'Откройте ссылку и введите адрес:',
    what: (tier: ReportTier) =>
      tier === '29'
        ? 'Вы получите полный замер своего сайта и до трёх конкурентов рядом, а потом четыре еженедельных перепроверки письмом: что изменилось. Первый отчёт обычно приходит в течение часа.'
        : 'Вы получите полный замер своего сайта в виде PDF: оценки по шести областям, каждая проверка со своей находкой, сколько текста пропадает без скриптов и какие файлы ищут на домене программы-агенты. Обычно приходит в течение часа.',
    validity: `Ссылка работает ${TOKEN_DAYS} дней. Если перестала, напишите на info@oper-stack.com с того адреса, с которого оплачивали.`,
    sign: 'OperStack · info@oper-stack.com',
  },
};

export function buildReportWelcomeEmail(opts: { tier: ReportTier; lang: 'ru' | 'en'; link: string }): { subject: string; text: string; html: string } {
  const t = COPY[opts.lang];
  const text = [t.hello, '', t.action, opts.link, '', t.what(opts.tier), '', t.validity, '', t.sign].join('\n');
  const html = [
    `<p>${t.hello}</p>`,
    `<p>${t.action}</p>`,
    `<p><a href="${opts.link}" style="display:inline-block;padding:12px 20px;background:#1A8A7D;color:#fff;border-radius:6px;text-decoration:none">${opts.lang === 'ru' ? 'Ввести адрес сайта' : 'Enter your site address'}</a></p>`,
    `<p>${t.what(opts.tier)}</p>`,
    `<p style="color:#666;font-size:14px">${t.validity}</p>`,
    `<p style="color:#666;font-size:14px">${t.sign}</p>`,
  ].join('\n');
  return { subject: t.subject(opts.tier), text, html };
}

/**
 * Событие Whop про отчёт. Те же места, где Whop прячет почту и товар, что и у кита: событий одного
 * вида у них несколько, и поля в них называются по-разному.
 */
export function readWhopReport(event: any, tiers: Record<string, ReportTier>): {
  type: string; paymentId: string; email: string | null; userId: string | null; tier: ReportTier | null; matchedId: string | null;
} {
  const d = event?.data ?? {};
  const first = (...values: unknown[]) => values.find((v) => typeof v === 'string' && v.trim().length > 0) as string | undefined;
  const email = first(d.user_email, d.email, d.user?.email, d.member?.email, d.membership?.user?.email, d.checkout_session?.email, d.metadata?.email) ?? null;
  const userId = first(d.user_id, d.user?.id, d.member?.user_id, d.membership?.user_id) ?? null;
  const candidates = [d.product_id, d.plan_id, d.access_pass_id, d.product?.id, d.plan?.id, d.access_pass?.id, d.membership?.product_id, d.membership?.plan_id]
    .filter((x): x is string => typeof x === 'string' && x.length > 0);
  const matchedId = candidates.find((id) => tiers[id]) ?? null;
  return {
    type: String(event?.type ?? event?.event ?? ''),
    paymentId: String(d.id ?? event?.id ?? ''),
    email: email ? email.trim().toLowerCase() : null,
    userId,
    tier: matchedId ? tiers[matchedId] : null,
    matchedId,
  };
}
