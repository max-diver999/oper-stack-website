import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { commerceDashboardSnapshot } from '../../lib/commerce-ledger';

export const prerender = false;

const env = (key: string): string =>
  String(process.env[key] ?? (import.meta.env as Record<string, unknown> | undefined)?.[key] ?? '').trim();
const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] || char));
const equal = (left: string, right: string) => {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

function authorised(request: Request): boolean {
  const expectedUser = env('OPERSTACK_DASHBOARD_USER');
  const expectedPass = env('OPERSTACK_DASHBOARD_PASSWORD');
  if (!expectedUser || !expectedPass) return false;
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded = '';
  try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); } catch { return false; }
  const split = decoded.indexOf(':');
  return split > 0 && equal(decoded.slice(0, split), expectedUser) && equal(decoded.slice(split + 1), expectedPass);
}

const cards = (rows: Record<string, unknown>[], key: string, value: string) => rows.map((row) =>
  `<div class="card"><b>${esc(row[value])}</b><span>${esc(row[key])}</span></div>`).join('');

export const GET: APIRoute = async ({ request }) => {
  if (!authorised(request)) return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="OperStack orders", charset="UTF-8"', 'Cache-Control': 'no-store' },
  });
  let data;
  try { data = await commerceDashboardSnapshot(); } catch (error) {
    console.error('orders dashboard failed', error);
    return new Response('Ledger unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const paid = data.orderStatus.find((row) => row.status === 'paid')?.count ?? 0;
  const pending = data.orderStatus.find((row) => row.status === 'pending')?.count ?? 0;
  const failed = data.jobs.find((row) => row.status === 'failed')?.count ?? 0;
  const body = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><title>Заказы · OperStack</title><style>
  :root{color-scheme:dark;--bg:#071014;--panel:#0d191f;--line:#1d3139;--ink:#eff8f6;--muted:#8ea6ad;--mint:#51d6bd;--amber:#f3bd63;--red:#ff7e7e}
  *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 15% 0,#12302f 0,transparent 35%),var(--bg);color:var(--ink);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,sans-serif}
  main{max-width:1280px;margin:auto;padding:38px 24px 70px}header{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:28px}h1{font-size:clamp(28px,4vw,52px);letter-spacing:-.04em;margin:0}header p{color:var(--muted);margin:6px 0 0}.pill{border:1px solid var(--line);border-radius:99px;padding:8px 12px;color:var(--mint)}
  .summary,.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.summary{margin-bottom:26px}.hero,.card,section{background:color-mix(in srgb,var(--panel) 94%,transparent);border:1px solid var(--line);box-shadow:0 18px 60px #0004}.hero{padding:20px;border-radius:18px}.hero b{display:block;font-size:32px;letter-spacing:-.03em}.hero span,.card span{color:var(--muted)}.hero.bad b{color:var(--red)}
  section{border-radius:18px;padding:20px;margin-top:16px}h2{font-size:17px;margin:0 0 14px}.card{border-radius:13px;padding:14px}.card b{display:block;font-size:22px}.cards{margin-bottom:8px}
  .table{overflow:auto}table{width:100%;border-collapse:collapse;min-width:850px}th,td{text-align:left;padding:11px 10px;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}td.email{max-width:260px;overflow:hidden;text-overflow:ellipsis}.status{color:var(--mint)}.pending{color:var(--amber)}
  @media(max-width:600px){main{padding:24px 14px 50px}header{align-items:start;flex-direction:column}.hero{padding:16px}}
  </style></head><body><main><header><div><h1>Заказы OperStack</h1><p>EN Whop + RU счета · последние 100 заказов</p></div><span class="pill">live ledger</span></header>
  <div class="summary"><div class="hero"><b>${esc(paid)}</b><span>оплачено</span></div><div class="hero"><b>${esc(pending)}</b><span>ждут оплаты</span></div><div class="hero ${Number(failed) ? 'bad' : ''}"><b>${esc(failed)}</b><span>ошибок выдачи</span></div></div>
  <section><h2>Выручка по валютам</h2><div class="cards">${cards(data.revenue, 'currency', 'amount') || '<span>Пока нет оплат</span>'}</div></section>
  <section><h2>Воронка и доставка</h2><div class="cards">${cards(data.checks, 'lang', 'count')}${cards(data.jobs, 'status', 'count')}${cards(data.messages, 'status', 'count')}</div></section>
  <section><h2>Последние заказы</h2><div class="table"><table><thead><tr><th>Дата</th><th>Источник</th><th>Продукт</th><th>Статус</th><th>Сумма</th><th>Email</th><th>Сайт</th></tr></thead><tbody>${data.orders.map((row) => `<tr><td>${esc(String(row.created_at ?? '').slice(0, 19).replace('T', ' '))}</td><td>${esc(row.source)}</td><td>${esc(row.product)}</td><td class="status ${row.status === 'pending' ? 'pending' : ''}">${esc(row.status)}</td><td>${esc(row.amount)} ${esc(row.currency)}</td><td class="email">${esc(row.email)}</td><td>${esc(row.site)}</td></tr>`).join('')}</tbody></table></div></section>
  </main></body></html>`;
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
};

