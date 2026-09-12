/**
 * Приём списка сайтов от покупателя курса.
 *
 * Простым языком: человек оплатил, получил письмо со ссылкой, открыл её, вставил список сайтов и
 * нажал кнопку. Здесь мы проверяем, что ссылка настоящая, разбираем вставленное и ставим заявку в
 * очередь. Ни установки, ни командной строки: всё, что от него требуется, это вставить текст.
 *
 * Форма работает без скриптов: обычный POST, ответ обычной страницей. Человек, у которого
 * JavaScript выключен или заблокирован на работе, не должен остаться без купленного.
 *
 * Env: KIT_DOWNLOAD_SECRET (та же подпись, что у ссылки), SMTP_USER, SMTP_PASS, OPS_MAILBOX.
 */
import type { APIRoute } from 'astro';
import { verifyReportToken } from '../../lib/report-fulfilment';
import { buildProspectBody, buildProspectSubject, MAX_SITES, parseBrand, parsePasted } from '../../lib/prospect-request';
import { sendTransactionalMail } from '../../lib/mail-smtp';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

/** Ответ обычной страницей: форма работает без скриптов, значит и ответ должен быть страницей. */
const page = (status: number, title: string, body: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <title>${title}</title>
     <style>body{font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1419;color:#e6edf3;
     display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
     main{max-width:560px}h1{font-size:26px;margin:0 0 12px}p{color:#b9c2cc}a{color:#3db8a9}</style>
     <main><h1>${title}</h1>${body}</main>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

export const POST: APIRoute = async ({ request }) => {
  const secret = env('KIT_DOWNLOAD_SECRET');
  if (!secret) return page(500, 'Something is not set up on our side', '<p>Write to support@oper-stack.com and we will run it by hand.</p>');

  const form = await request.formData();
  const token = String(form.get('t') || '');
  const check = verifyReportToken(token, secret);
  if (!check.ok || !check.claims?.email) {
    return page(400, 'This link is not valid any more', '<p>Links last thirty days. Write to support@oper-stack.com and we will send a fresh one.</p>');
  }

  const { sites, skipped } = parsePasted(String(form.get('sites') || ''));
  if (!sites.length) {
    return page(400, 'No site addresses in that', '<p>Paste one address per line, like <code>example.com</code>. Go back and try again.</p>');
  }

  const brand = parseBrand(String(form.get('by') || ''), String(form.get('color') || ''), String(form.get('logo') || ''));
  const job = {
    email: check.claims.email,
    sites,
    lang: (String(form.get('lang') || 'en') === 'ru' ? 'ru' : 'en') as 'en' | 'ru',
    ...(brand ? { brand } : {}),
  };
  const body = buildProspectBody(job, secret);
  try {
    await sendTransactionalMail({ to: env('OPS_MAILBOX', env('SMTP_USER')), subject: buildProspectSubject(job), ...body });
  } catch (err) {
    console.error('prospect queue mail failed:', err);
    return page(502, 'We could not queue that', '<p>Nothing was lost. Write to support@oper-stack.com with your list and we will run it.</p>');
  }

  const extra = skipped.length
    ? `<p>${skipped.length} line(s) were not addresses and were left out: <code>${skipped.slice(0, 3).map((s) => s.replace(/[<>&]/g, '')).join('</code>, <code>')}</code>.</p>`
    : '';
  return page(200, `${sites.length} site${sites.length > 1 ? 's' : ''} queued`,
    `<p>The table is on its way to <strong>${check.claims.email.replace(/[<>&]/g, '')}</strong>. It usually takes fifteen to thirty minutes, because every site is read properly rather than guessed at.</p>
     ${extra}
     <p>You can close this page. Nothing needs to stay open.</p>`);
};

export const GET: APIRoute = () =>
  page(405, 'Open the link from your email', `<p>This address only accepts the form. Up to ${MAX_SITES} sites at a time.</p>`);
