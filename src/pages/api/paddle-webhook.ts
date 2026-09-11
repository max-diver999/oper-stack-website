/**
 * Paddle Billing webhook: on transaction.completed with a Site Kit price, issue a licence key and
 * email it with a signed download link. Signature-checked; every other event is acknowledged and
 * ignored. Configure the destination in Paddle as https://oper-stack.com/api/paddle-webhook/.
 *
 * Env: PADDLE_WEBHOOK_SECRET, PADDLE_API_KEY, PADDLE_SITE_KIT_PRICE_IDS (pri_x:owner,pri_y:agency),
 * OPERSTACK_LICENCE_PRIVATE_KEY_B64, KIT_DOWNLOAD_SECRET, plus the SMTP and Telegram variables.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { handleTransactionCompleted, issueLicenceKey, makeDownloadToken, parsePriceMap, verifyPaddleSignature } from '../../lib/licence-fulfilment';
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
    });
  } catch (err) {
    console.error('telegram notify failed:', err);
  }
}

async function getCustomerEmail(customerId: string): Promise<string | null> {
  const key = env('PADDLE_API_KEY');
  if (!key) return null;
  const res = await fetch(`https://api.paddle.com/customers/${encodeURIComponent(customerId)}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { email?: string } };
  return body.data?.email ? String(body.data.email) : null;
}

export const POST: APIRoute = async ({ request }) => {
  const secret = env('PADDLE_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'webhook not configured' }, 503);
  const raw = await request.text();
  const check = verifyPaddleSignature(raw, request.headers.get('paddle-signature'), secret);
  if (!check.ok) return json({ error: check.reason }, 401);

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'body is not JSON' }, 400);
  }
  if (event?.event_type !== 'transaction.completed') return json({ ok: true, ignored: event?.event_type ?? 'unknown' });

  const privatePem = Buffer.from(env('OPERSTACK_LICENCE_PRIVATE_KEY_B64'), 'base64').toString('utf8');
  const downloadSecret = env('KIT_DOWNLOAD_SECRET');
  if (!privatePem.includes('PRIVATE KEY') || !downloadSecret) {
    await notifyTelegram(`Site Kit paid (${event?.data?.id}) but the licence signing key or download secret is missing on the server: issue the key by hand.`);
    return json({ ok: true, handled: false, reason: 'fulfilment not configured' });
  }

  try {
    const result = await handleTransactionCompleted(event, {
      priceToPlan: parsePriceMap(env('PADDLE_SITE_KIT_PRICE_IDS')),
      getCustomerEmail,
      issue: (email, plan) => issueLicenceKey({ email, plan }, privatePem),
      downloadUrl: (email) => `${SITE.url}/api/kit-download/?t=${makeDownloadToken({ email: email.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }, downloadSecret)}`,
      sendMail: sendTransactionalMail,
      notify: notifyTelegram,
      supportEmail: 'support@oper-stack.com',
      siteUrl: SITE.url,
    });
    return json({ ok: true, ...result });
  } catch (err) {
    console.error('fulfilment failed:', err);
    await notifyTelegram(`Site Kit fulfilment failed for transaction ${event?.data?.id}: ${(err as Error).message}. Issue the key by hand.`);
    return json({ ok: true, handled: false, reason: 'fulfilment error, owner notified' });
  }
};

export const GET: APIRoute = () => json({ ok: true, endpoint: 'paddle-webhook', accepts: ['transaction.completed'] });
