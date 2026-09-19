/** Resend delivery events: accepted mail is not treated as delivered until this endpoint says so. */
import type { APIRoute } from 'astro';
import { updateProviderMessage, verifyStandardWebhook } from '../../lib/commerce-ledger';

export const prerender = false;

const env = (key: string): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? '').trim();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

const STATUS: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delayed',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
};

export const POST: APIRoute = async ({ request }) => {
  const raw = await request.text();
  if (!verifyStandardWebhook(raw, {
    id: request.headers.get('svix-id'),
    timestamp: request.headers.get('svix-timestamp'),
    signature: request.headers.get('svix-signature'),
  }, env('RESEND_WEBHOOK_SECRET'))) return json({ ok: false, error: 'bad signature' }, 401);
  let event: any;
  try { event = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad JSON' }, 400); }
  const status = STATUS[String(event?.type || '')];
  const messageId = String(event?.data?.email_id ?? event?.data?.id ?? '');
  if (!status || !messageId) return json({ ok: true, handled: false });
  const to = Array.isArray(event?.data?.to) ? event.data.to[0] : event?.data?.to;
  try {
    await updateProviderMessage('resend', messageId, status, String(to || ''));
    return json({ ok: true, handled: true });
  } catch (error) {
    console.error('resend webhook ledger failed', error);
    return json({ ok: false, error: 'ledger unavailable' }, 503);
  }
};

