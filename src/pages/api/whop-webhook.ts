/**
 * Whop webhook: on a successful payment for the Site Kit, issue a licence key and email it with a
 * signed download link. Signature-checked; every other event is acknowledged and ignored.
 * Configure the destination in Whop as https://oper-stack.com/api/whop-webhook/.
 *
 * This replaces the Paddle route: Paddle refused the domain because as merchant of record they do
 * not carry services, so the shop moved to Whop. The licence format, the email and the download
 * link are unchanged, only the event that triggers them.
 *
 * Env: WHOP_WEBHOOK_SECRET (ws_...), WHOP_API_KEY, WHOP_SITE_KIT_IDS (prod_x:owner,plan_y:agency),
 * OPERSTACK_LICENCE_PRIVATE_KEY_B64, KIT_DOWNLOAD_SECRET, plus the SMTP and Telegram variables.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { handleWhopPayment, issueLicenceKey, makeDownloadToken, parsePriceMap, verifyWhopSignature } from '../../lib/licence-fulfilment';
import { sendTransactionalMail } from '../../lib/mail-smtp';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

async function notifyTelegram(text: string): Promise<void> {
  const token = env('TG_TOKEN');
  const chat = env('TG_CHAT_ID');
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `🔑 ${text}` }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (err) {
    console.error('telegram notify failed:', err);
  }
}

/** Почта покупателя по его id, если событие её не принесло. Пробуем обе версии API Whop. */
async function getBuyerEmail(userId: string): Promise<string | null> {
  const key = env('WHOP_API_KEY');
  if (!key) return null;
  const urls = [
    `https://api.whop.com/api/v5/app/users/${encodeURIComponent(userId)}`,
    `https://api.whop.com/api/v2/users/${encodeURIComponent(userId)}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8_000) });
      if (!res.ok) continue;
      const body = (await res.json()) as { email?: string; data?: { email?: string } };
      const email = body.email ?? body.data?.email;
      if (email) return String(email);
    } catch { /* пробуем следующий адрес */ }
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const secret = env('WHOP_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'webhook not configured' }, 503);
  const raw = await request.text();
  const check = verifyWhopSignature(raw, {
    id: request.headers.get('webhook-id'),
    timestamp: request.headers.get('webhook-timestamp'),
    signature: request.headers.get('webhook-signature'),
  }, secret);
  if (!check.ok) return json({ error: check.reason }, 401);

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'body is not JSON' }, 400);
  }

  const privatePem = Buffer.from(env('OPERSTACK_LICENCE_PRIVATE_KEY_B64'), 'base64').toString('utf8');
  const downloadSecret = env('KIT_DOWNLOAD_SECRET');
  if (!privatePem.includes('PRIVATE KEY') || !downloadSecret) {
    await notifyTelegram(`Whop payment ${event?.data?.id ?? ''} arrived but the licence signing key or download secret is missing on the server: issue the key by hand.`);
    return json({ ok: true, handled: false, reason: 'fulfilment not configured' });
  }

  try {
    const result = await handleWhopPayment(event, {
      idToPlan: parsePriceMap(env('WHOP_SITE_KIT_IDS')),
      getBuyerEmail,
      issue: (email, plan) => issueLicenceKey({ email, plan }, privatePem),
      downloadUrl: (email) => `${SITE.url}/api/kit-download/?t=${makeDownloadToken({ email: email.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }, downloadSecret)}`,
      sendMail: sendTransactionalMail,
      notify: notifyTelegram,
      supportEmail: 'info@oper-stack.com',
      siteUrl: SITE.url,
    });
    return json({ ok: true, ...result });
  } catch (err) {
    console.error('fulfilment failed:', err);
    await notifyTelegram(`Site Kit fulfilment failed for Whop payment ${event?.data?.id ?? ''}: ${(err as Error).message}. Issue the key by hand.`);
    return json({ ok: true, handled: false, reason: 'fulfilment error, owner notified' });
  }
};

export const GET: APIRoute = () => json({ ok: true, endpoint: 'whop-webhook', accepts: ['payment.succeeded', 'membership.went_valid'] });
