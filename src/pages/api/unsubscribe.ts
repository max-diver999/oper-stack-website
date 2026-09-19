/**
 * Отписка от писем. Одна ссылка, один переход, никаких форм и входов.
 *
 * Простым языком: в каждом письме внизу есть ссылка «отписаться». Человек нажимает её и
 * сразу видит страницу «готово». Больше мы ему не пишем. Спрашивать пароль, причину ухода
 * или «вы уверены» здесь нельзя: это ровно тот момент, когда человека надо отпустить.
 *
 * Технически: ссылка подписана тем же секретом, что и остальные, поэтому отписать чужой
 * адрес нельзя. Отметка ставится в таблицу бесплатных проверок, колонка «Отписан», и
 * цепочка писем такие строки пропускает.
 *
 * Почему сразу по переходу, а не по нажатию кнопки на странице: почтовые программы иногда
 * сами открывают ссылки, и человек может остаться подписанным, думая, что отписался.
 * Потерять письмо, которое человек не хотел, безопаснее, чем слать письма тому, кто ушёл.
 *
 * Env: KIT_DOWNLOAD_SECRET, SHEETS_SA_EMAIL, SHEETS_SA_KEY, FREE_CHECKS_SHEET_ID.
 */
import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { setMarketingPermission } from '../../lib/commerce-ledger';
import { markUnsubscribed } from '../../lib/sheets-log';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

export function makeUnsubToken(email: string, secret: string): string {
  const body = Buffer.from(email.trim().toLowerCase(), 'utf8').toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function readUnsubToken(token: string, secret: string): string | null {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('base64url'));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const email = Buffer.from(body, 'base64url').toString('utf8');
  return email.includes('@') ? email : null;
}

const page = (title: string, body: string, status = 200) =>
  new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${title} · OperStack</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B1017;color:#F5F2EC;
font:17px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px}
main{max-width:34rem}h1{font-size:28px;line-height:1.15;margin:0 0 14px}
p{margin:12px 0;color:rgba(245,242,236,.82)}a{color:#3DB8A9}</style></head>
<body><main>${body}</main></body></html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

export const GET: APIRoute = async ({ url }) => {
  const secret = env('KIT_DOWNLOAD_SECRET');
  const email = secret ? readUnsubToken(url.searchParams.get('t') || '', secret) : null;
  if (!email) {
    return page('Link not valid', '<h1>This link is not valid</h1><p>Write to <a href="mailto:info@oper-stack.com">info@oper-stack.com</a> from the address you want removed and we will do it by hand.</p>', 400);
  }
  // «Нет в списке» это тоже успех: писать этому человеку мы не будем, а значит он получил
  // то, за чем пришёл. Ошибку показываем только при настоящей поломке.
  const outcome = await markUnsubscribed(email);
  // The sheet remains the visible operational log; the ledger is the gate checked immediately
  // before every future marketing send. Either copy is enough to stop mail while rollout completes.
  let done = false;
  try { await setMarketingPermission(email, false, 'unsubscribed'); done = true; } catch { console.error('central unsubscribe failed'); }
  return page(
    done ? 'Unsubscribed' : 'Almost',
    done
      ? `<h1>Done. No more email.</h1><p>We will not write to <strong>${email.replace(/[<>&"]/g, '')}</strong> again.</p><p>The free check itself stays open, no account and no email needed: <a href="https://oper-stack.com/ai-visibility/">oper-stack.com/ai-visibility</a>.</p>`
      : `<h1>We could not do it automatically</h1><p>Write to <a href="mailto:info@oper-stack.com">info@oper-stack.com</a> and we will remove <strong>${email.replace(/[<>&"]/g, '')}</strong> by hand.</p>`,
    done ? 200 : 502,
  );
};

/**
 * One-click unsubscribe (RFC 8058).
 *
 * In plain words: mail programs show their own unsubscribe button and, when it is pressed,
 * post here without opening the page. Gmail, Mail.ru and Yandex weigh this: a letter that is
 * easy to leave is reported as spam far less often than one that is not.
 *
 * The reply is plain text on purpose: no person sees this, a program reads it.
 */
export const POST: APIRoute = async ({ url }) => {
  const secret = env('KIT_DOWNLOAD_SECRET');
  const email = secret ? readUnsubToken(url.searchParams.get('t') || '', secret) : null;
  if (!email) return new Response('bad token', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  // «Нет в списке» это тоже успех: писать этому человеку мы не будем, а значит он получил
  // то, за чем пришёл. Ошибку показываем только при настоящей поломке.
  const outcome = await markUnsubscribed(email);
  let done = false;
  try { await setMarketingPermission(email, false, 'unsubscribed'); done = true; } catch { console.error('central unsubscribe failed'); }
  return new Response(done ? 'unsubscribed' : 'queued', {
    status: done ? 200 : 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
