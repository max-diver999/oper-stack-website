/** Signed internal API used by the RU checkout and the email worker. */
import type { APIRoute } from 'astro';
import {
  marketingEligibility,
  messageExists,
  recordManualOrder,
  recordMessage,
  setMarketingPermission,
  verifyInternalSignature,
} from '../../lib/commerce-ledger';
import type { CommerceProduct } from '../../lib/commerce-policy';

export const prerender = false;

const PRODUCTS = new Set<CommerceProduct>([
  'report-9', 'report-29', 'audit-149', 'agency', 'site-kit-owner', 'site-kit-agency', 'pain-to-seo', 'course',
]);
const env = (key: string): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? '').trim();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const product = (value: unknown): CommerceProduct | null => PRODUCTS.has(value as CommerceProduct) ? value as CommerceProduct : null;

export const POST: APIRoute = async ({ request }) => {
  const raw = await request.text();
  if (!verifyInternalSignature(raw, {
    timestamp: request.headers.get('x-operstack-timestamp'),
    signature: request.headers.get('x-operstack-signature'),
  }, env('OPERSTACK_LEDGER_SECRET'))) return json({ ok: false, error: 'bad signature' }, 401);

  let body: Record<string, any>;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad JSON' }, 400); }
  try {
    if (body.action === 'eligibility') {
      const offered = Array.isArray(body.offered) ? body.offered.map(product).filter(Boolean) as CommerceProduct[] : [];
      const logicalKey = String(body.logicalKey || '');
      if (logicalKey && await messageExists(logicalKey)) {
        return json({ ok: true, allowed: false, reason: 'message already recorded', owned: [] });
      }
      return json({ ok: true, ...(await marketingEligibility(String(body.email || ''), offered)) });
    }
    if (body.action === 'manual_order') {
      const item = product(body.product);
      if (!item || !body.orderKey || !body.email) return json({ ok: false, error: 'incomplete order' }, 400);
      const recorded = await recordManualOrder({
        orderKey: String(body.orderKey), email: String(body.email), product: item,
        amount: Number(body.amount) || 0, currency: String(body.currency || 'RUB'),
        site: String(body.site || ''), metadata: typeof body.metadata === 'object' ? body.metadata : {},
      });
      return json({ ok: true, orderId: recorded.orderId, duplicate: recorded.duplicate, number: recorded.metadata.number });
    }
    if (body.action === 'message') {
      if (!body.logicalKey || !body.email || !body.kind) return json({ ok: false, error: 'incomplete message' }, 400);
      await recordMessage({
        logicalKey: String(body.logicalKey), email: String(body.email), kind: String(body.kind),
        subject: String(body.subject || ''), provider: String(body.provider || ''),
        providerMessageId: body.providerMessageId ? String(body.providerMessageId) : undefined,
        status: String(body.status || 'accepted'), metadata: typeof body.metadata === 'object' ? body.metadata : {},
      });
      return json({ ok: true });
    }
    if (body.action === 'marketing_permission') {
      if (!body.email) return json({ ok: false, error: 'email is required' }, 400);
      await setMarketingPermission(String(body.email), Boolean(body.allowed), String(body.reason || ''));
      return json({ ok: true });
    }
    return json({ ok: false, error: 'unknown action' }, 400);
  } catch (error) {
    console.error('commerce API failed', error);
    return json({ ok: false, error: 'ledger unavailable' }, 503);
  }
};
