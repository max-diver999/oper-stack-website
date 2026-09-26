/**
 * Платная часть бесплатной проверки: готовый текст и «кого ChatGPT называет вместо вас»
 * (задание 26.09.2026, п. 2 и 3). POST { id, token, sell } запускает или отдаёт готовое,
 * GET ?id= только читает статус, пока идёт прогон. Решения и порядок проверок в free-extras.mjs.
 */
import type { APIRoute } from 'astro';
import { loadCheck } from '../../lib/check-store';
import { extrasStore, getExtras, hashIp } from '../../lib/extras-store';
import { serveExtras } from '../../lib/free-extras.mjs';
import { sendTransactionalMail } from '../../lib/mail-smtp';
import * as W from '../../lib/watch/chatgpt-watch.mjs';

export const prerender = false;

const env = (k: string) => String((import.meta.env as any)[k] || process.env[k] || '').trim();
/*
 * Официальный тестовый секрет Cloudflare (всегда проходит) только вне Vercel, для локальной
 * проверки. На Vercel без настоящего секрета шаг не запускается: без защиты не выкладывать (п. 3).
 */
const TEST_SECRET = '1x0000000000000000000000000000000AA';
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = env('TURNSTILE_SECRET') || (process.env.VERCEL ? '' : TEST_SECRET);
  if (!secret || !token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }), signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    return data.success === true;
  } catch { return false; }
}

async function sendAlert({ spent }: { spent: number }) {
  const text = `За сегодня (по UTC) бесплатная проверка с ChatGPT потратила $${spent.toFixed(2)}, больше порога $20.\n\nПроверки не остановлены. Журнал: таблица free_ai_log в базе сайта.`;
  await sendTransactionalMail({ to: 'info@oper-stack.com', subject: `Бесплатная проверка: $${spent.toFixed(2)} за сутки`, text, html: `<p>${text.replace(/\n/g, '<br>')}</p>` });
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
const ipOf = (request: Request, clientAddress?: string) => (clientAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim();
const brief = (e: any) => (e && e.status ? { status: e.status, ...(e.status === 'needs' ? { profile: e.payload?.profile || null } : {}) } : { status: 'none' });

export const GET: APIRoute = async ({ url }) => {
  const id = String(url.searchParams.get('id') || '');
  if (!id) return json({ status: 'missing' }, 400);
  return json(brief(await getExtras(id)));
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: { id?: string; token?: string; sell?: string } = {};
  try { body = await request.json(); } catch { /* пустое тело */ }
  const id = String(body.id || '');
  if (!id) return json({ status: 'missing' }, 400);
  const out: any = await serveExtras(
    { checkId: id, token: String(body.token || ''), sell: String(body.sell || ''), ip: ipOf(request, clientAddress) },
    { store: { ...extrasStore, loadCheck }, W, verifyTurnstile, hashIp, sendAlert },
  );
  return json(brief(out));
};
