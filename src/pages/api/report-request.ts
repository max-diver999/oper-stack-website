/**
 * Приём адреса сайта от покупателя отчёта.
 *
 * Простым языком: человек оплатил, получил письмо со ссылкой, открыл её и ввёл адрес своего сайта.
 * Здесь мы проверяем, что ссылка настоящая и не просрочена, что адрес похож на настоящий сайт, и
 * ставим заявку в очередь. Больше ничего у человека не спрашиваем и ничего о нём не храним.
 *
 * Технически: очередь это служебное письмо на наш же ящик с подписанной темой. Его раз в пятнадцать
 * минут разбирает ops-notify и делает отчёт. Базы данных нет намеренно: адрес чужого сайта живёт
 * ровно до того момента, как отчёт ушёл.
 *
 * Форма работает без скриптов: обычный POST, ответ обычной страницей. Так покупатель не окажется
 * заперт, если у него что-то блокирует JavaScript.
 *
 * Env: KIT_DOWNLOAD_SECRET (та же подпись, что у ссылки на кит), SMTP_USER, SMTP_PASS.
 */
import type { APIRoute } from 'astro';
import { buildRunBody, buildRunSubject, normaliseSiteUrl, verifyReportToken } from '../../lib/report-fulfilment';
import { sendTransactionalMail } from '../../lib/mail-smtp';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

/** Куда падает заявка. Тот же ящик, что читает очередь. */
const QUEUE_TO = 'info@oper-stack.com';

const escape = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Ответ той же тёмной страницей, что и остальной сайт: покупатель не должен думать,
 *  что его выкинуло куда-то не туда. */
function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escape(title)}</title>
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
:root{--ink:#0B1017;--paper:#F5F2EC;--teal:#3DB8A9;--muted:#8B939E}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--ink);color:var(--paper);
font-family:'DM Sans',system-ui,sans-serif;padding:24px}
main{max-width:32rem}
h1{font-family:'Fraunces',Georgia,serif;font-size:clamp(24px,5vw,32px);line-height:1.15;margin:0 0 14px}
p{color:var(--muted);line-height:1.55;margin:0 0 14px}
a{color:var(--teal)}
.muted{font-size:14px}
</style></head><body><main>${body}</main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

const RU = (lang: string) => lang === 'ru';

export const POST: APIRoute = async ({ request }) => {
  const secret = env('KIT_DOWNLOAD_SECRET');
  if (!secret) return page('Not configured', '<h1>The form is not configured yet</h1><p>Write to <a href="mailto:info@oper-stack.com">info@oper-stack.com</a> with the address of your site and we will run the report by hand.</p>', 503);

  let token = '';
  let site = '';
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      const body = (await request.json()) as { t?: string; site?: string };
      token = String(body.t || '');
      site = String(body.site || '');
    } else {
      const form = await request.formData();
      token = String(form.get('t') || '');
      site = String(form.get('site') || '');
    }
  } catch {
    return page('Bad request', '<h1>The form did not arrive</h1><p>Go back and send it again.</p>', 400);
  }

  const check = verifyReportToken(token, secret);
  if (!check.ok || !check.claims) {
    return page('Link not valid', `<h1>This link is not valid</h1><p>${escape(check.reason || 'unknown reason')}. Write to <a href="mailto:info@oper-stack.com">info@oper-stack.com</a> from the address you paid with and we will send a fresh one.</p>`, 403);
  }
  const { email, tier, lang } = check.claims;

  const url = normaliseSiteUrl(site);
  if (!url.ok) {
    const back = `/report/?t=${encodeURIComponent(token)}&e=${encodeURIComponent(url.reason)}`;
    return page('Check the address', `<h1>${escape(url.reason)}</h1><p><a href="${escape(back)}">Go back and try again</a>.</p>`, 400);
  }

  // Заявка в очередь. Подпись лежит первой строкой тела: письмо нельзя подделать снаружи,
  // а тема при этом остаётся читаемой для человека, который откроет ящик.
  const job = { url: url.url, email, lang, tier };
  try {
    await sendTransactionalMail({ to: QUEUE_TO, subject: buildRunSubject(job), ...buildRunBody(job, secret) });
  } catch {
    return page('Could not queue', '<h1>We could not put the request through</h1><p>Nothing is lost. Write to <a href="mailto:info@oper-stack.com">info@oper-stack.com</a> with the address of your site and we will run it by hand.</p>', 502);
  }

  const ru = RU(lang);
  return page(
    ru ? 'Заявка принята' : 'Request accepted',
    ru
      ? `<h1>Принято: ${escape(url.url)}</h1>
<p>Отчёт придёт на ${escape(email)}. Обычно в течение часа, чаще за несколько минут.</p>
<p>Ничего делать не нужно, письмо придёт само. Если через час его нет, посмотрите в спаме и напишите на <a href="mailto:info@oper-stack.com">info@oper-stack.com</a>.</p>
<p class="muted">Мы не храним адрес вашего сайта после того, как отчёт отправлен.</p>`
      : `<h1>Got it: ${escape(url.url)}</h1>
<p>The report goes to ${escape(email)}. Usually within the hour, often within minutes.</p>
<p>Nothing else to do; the email arrives on its own. If an hour passes and it has not, check your spam folder and write to <a href="mailto:info@oper-stack.com">info@oper-stack.com</a>.</p>
<p class="muted">We do not keep the address of your site once the report has been sent.</p>`,
  );
};

/** GET на этот адрес это чья-то ошибка, а не покупатель: отправляем на форму. */
export const GET: APIRoute = async ({ url }) =>
  new Response(null, { status: 302, headers: { Location: `/report/${url.search}`, 'Cache-Control': 'no-store' } });
