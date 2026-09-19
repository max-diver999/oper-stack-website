import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { entitlementsGranted, type CommerceProduct } from './commerce-policy';

const env = (key: string): string =>
  String(process.env[key] ?? (import.meta.env as Record<string, unknown> | undefined)?.[key] ?? '').trim();

let schemaReady: Promise<void> | null = null;

export function db() {
  const url = env('DATABASE_URL');
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

export async function ensureCommerceSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS commerce_provider_events (
      provider text NOT NULL,
      event_id text NOT NULL,
      event_type text NOT NULL DEFAULT '',
      received_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (provider, event_id)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS commerce_orders (
      id text PRIMARY KEY,
      order_key text NOT NULL UNIQUE,
      source text NOT NULL,
      provider_ref text NOT NULL DEFAULT '',
      email text NOT NULL,
      product text NOT NULL,
      site text NOT NULL DEFAULT '',
      status text NOT NULL,
      amount numeric,
      currency text NOT NULL DEFAULT '',
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS commerce_orders_email_idx ON commerce_orders (lower(email), created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS commerce_entitlements (
      id text PRIMARY KEY,
      order_id text NOT NULL REFERENCES commerce_orders(id),
      email text NOT NULL,
      product text NOT NULL,
      site text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'active',
      starts_at timestamptz NOT NULL DEFAULT now(),
      ends_at timestamptz,
      UNIQUE (order_id, product)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS commerce_entitlements_email_idx ON commerce_entitlements (lower(email), product, status)`;
    await sql`CREATE TABLE IF NOT EXISTS commerce_fulfilment_jobs (
      id text PRIMARY KEY,
      order_id text NOT NULL REFERENCES commerce_orders(id),
      kind text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      attempts integer NOT NULL DEFAULT 0,
      lease_until timestamptz,
      last_error text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (order_id, kind)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS commerce_messages (
      id text PRIMARY KEY,
      job_id text REFERENCES commerce_fulfilment_jobs(id),
      logical_key text NOT NULL UNIQUE,
      email text NOT NULL,
      kind text NOT NULL,
      subject text NOT NULL DEFAULT '',
      provider text NOT NULL DEFAULT '',
      provider_message_id text,
      status text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS commerce_messages_provider_idx ON commerce_messages (provider, provider_message_id)`;
    await sql`CREATE TABLE IF NOT EXISTS commerce_contact_preferences (
      email text PRIMARY KEY,
      marketing_allowed boolean NOT NULL DEFAULT true,
      reason text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS commerce_delivery_events (
      provider text NOT NULL, message_id text NOT NULL, status text NOT NULL, email text NOT NULL,
      received_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(provider,message_id,status,email)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS commerce_outbox (
      logical_key text PRIMARY KEY, payload jsonb NOT NULL, kind text NOT NULL, email text NOT NULL,
      offered jsonb, job_id text, status text NOT NULL DEFAULT 'pending', provider_message_id text,
      first_attempt_at timestamptz, lease_until timestamptz, attempts integer NOT NULL DEFAULT 0,
      last_error text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

export type ReserveInput = {
  provider: string;
  eventId: string;
  eventType: string;
  orderKey: string;
  providerRef?: string;
  email: string;
  product: CommerceProduct;
  site?: string;
  kind: string;
  metadata?: Record<string, unknown>;
  entitlementEndsAt?: Date;
  amount?: number;
  currency?: string;
};

export async function reserveFulfilment(input: ReserveInput): Promise<{ process: boolean; orderId: string; jobId: string }> {
  await ensureCommerceSchema();
  const sql = db();
  const email = input.email.trim().toLowerCase();
  const proposedOrderId = randomUUID();
  await sql`INSERT INTO commerce_provider_events (provider, event_id, event_type)
    VALUES (${input.provider}, ${input.eventId}, ${input.eventType})
    ON CONFLICT (provider, event_id) DO NOTHING`;
  const orders = await sql`INSERT INTO commerce_orders
      (id, order_key, source, provider_ref, email, product, site, status, amount, currency, metadata)
    VALUES (${proposedOrderId}, ${input.orderKey}, ${input.provider}, ${input.providerRef ?? ''}, ${email}, ${input.product}, ${input.site ?? ''}, 'paid', ${input.amount ?? null}, ${input.currency ?? ''}, ${JSON.stringify(input.metadata ?? {})}::jsonb)
    ON CONFLICT (order_key) DO UPDATE SET
      provider_ref = CASE WHEN excluded.provider_ref LIKE 'pay_%' THEN excluded.provider_ref ELSE commerce_orders.provider_ref END,
      amount = COALESCE(commerce_orders.amount, excluded.amount),
      currency = CASE WHEN commerce_orders.currency = '' THEN excluded.currency ELSE commerce_orders.currency END,
      updated_at = now()
    RETURNING id, status`;
  const orderId = String(orders[0].id);
  if (orders[0].status !== 'paid') return { process: false, orderId, jobId: '' };
  for (const product of entitlementsGranted(input.product)) {
    await sql`INSERT INTO commerce_entitlements
        (id, order_id, email, product, site, status, ends_at)
      VALUES (${randomUUID()}, ${orderId}, ${email}, ${product}, ${input.site ?? ''}, 'active', ${input.entitlementEndsAt?.toISOString() ?? null})
      ON CONFLICT (order_id, product) DO NOTHING`;
  }
  const proposedJobId = randomUUID();
  const jobs = await sql`INSERT INTO commerce_fulfilment_jobs (id, order_id, kind)
    VALUES (${proposedJobId}, ${orderId}, ${input.kind})
    ON CONFLICT (order_id, kind) DO UPDATE SET updated_at = commerce_fulfilment_jobs.updated_at
    RETURNING id`;
  const jobId = String(jobs[0].id);
  const claimed = await sql`UPDATE commerce_fulfilment_jobs
    SET status = 'processing', attempts = attempts + 1, lease_until = now() + interval '15 minutes', updated_at = now()
    WHERE id = ${jobId}
      AND (status IN ('pending', 'failed') OR (status = 'processing' AND lease_until < now()))
    RETURNING id`;
  if (!claimed.length) {
    const state = await sql`SELECT status FROM commerce_fulfilment_jobs WHERE id = ${jobId}`;
    if (state[0]?.status === 'processing') throw new Error('fulfilment in progress; retry later');
  }
  return { process: claimed.length > 0, orderId, jobId };
}

export async function finishFulfilment(jobId: string, status: 'accepted' | 'failed', error = ''): Promise<void> {
  await ensureCommerceSchema();
  const sql = db();
  await sql`UPDATE commerce_fulfilment_jobs
    SET status = ${status}, last_error = ${error.slice(0, 1000)}, lease_until = NULL, updated_at = now()
    WHERE id = ${jobId}`;
}

export async function revokeByProviderReference(provider: string, providerRef: string, reason: string): Promise<number> {
  await ensureCommerceSchema();
  const sql = db();
  const orders = await sql`UPDATE commerce_orders
    SET status = ${reason}, updated_at = now()
    WHERE source = ${provider} AND provider_ref = ${providerRef}
    RETURNING id`;
  for (const order of orders) {
    await sql`UPDATE commerce_entitlements SET status = 'inactive' WHERE order_id = ${String(order.id)}`;
  }
  return orders.length;
}

export async function recordMessage(input: {
  jobId?: string;
  logicalKey: string;
  email: string;
  kind: string;
  subject?: string;
  provider: string;
  providerMessageId?: string;
  status: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await ensureCommerceSchema();
  const sql = db();
  await sql`INSERT INTO commerce_messages
      (id, job_id, logical_key, email, kind, subject, provider, provider_message_id, status, metadata)
    VALUES (${randomUUID()}, ${input.jobId ?? null}, ${input.logicalKey}, ${input.email.toLowerCase()}, ${input.kind}, ${input.subject ?? ''}, ${input.provider}, ${input.providerMessageId ?? null}, ${input.status}, ${JSON.stringify(input.metadata ?? {})}::jsonb)
    ON CONFLICT (logical_key) DO UPDATE SET
      provider = excluded.provider,
      provider_message_id = COALESCE(excluded.provider_message_id, commerce_messages.provider_message_id),
      status = CASE WHEN commerce_messages.status IN ('delivered','bounced','complained') THEN commerce_messages.status ELSE excluded.status END,
      metadata = commerce_messages.metadata || excluded.metadata,
      updated_at = now()`;
  if (input.providerMessageId) await reconcileDelivery(input.provider, input.providerMessageId);
}

export async function updateProviderMessage(provider: string, providerMessageId: string, status: string, email = ''): Promise<void> {
  await ensureCommerceSchema();
  const sql = db();
  await sql`INSERT INTO commerce_delivery_events (provider, message_id, status, email)
    VALUES (${provider}, ${providerMessageId}, ${status}, ${email.toLowerCase()}) ON CONFLICT DO NOTHING`;
  await reconcileDelivery(provider, providerMessageId);
}

export async function reconcileDelivery(provider: string, id: string): Promise<void> {
  const sql = db();
  await sql`UPDATE commerce_messages m SET status = e.status, updated_at = now()
    FROM (SELECT status FROM commerce_delivery_events WHERE provider = ${provider} AND message_id = ${id}
      ORDER BY CASE status WHEN 'complained' THEN 6 WHEN 'bounced' THEN 5 WHEN 'delivered' THEN 4
      WHEN 'failed' THEN 3 WHEN 'delayed' THEN 2 ELSE 1 END DESC LIMIT 1) e
    WHERE m.provider = ${provider} AND m.provider_message_id = ${id}`;
  await sql`INSERT INTO commerce_contact_preferences (email, marketing_allowed, reason)
    SELECT DISTINCT lower(m.email), false, 'delivery failure'
    FROM commerce_messages m JOIN commerce_delivery_events e
      ON e.provider = m.provider AND e.message_id = m.provider_message_id AND lower(e.email) = lower(m.email)
    WHERE m.provider = ${provider} AND m.provider_message_id = ${id} AND e.status IN ('bounced','complained')
    ON CONFLICT (email) DO UPDATE SET marketing_allowed = false, reason = excluded.reason, updated_at = now()`;
}

export async function setMarketingPermission(email: string, allowed: boolean, reason: string): Promise<void> {
  await ensureCommerceSchema();
  const sql = db();
  await sql`INSERT INTO commerce_contact_preferences (email, marketing_allowed, reason)
    VALUES (${email.toLowerCase()}, ${allowed}, ${reason})
    ON CONFLICT (email) DO UPDATE SET marketing_allowed = excluded.marketing_allowed, reason = excluded.reason, updated_at = now()`;
}

export async function marketingEligibility(email: string, offered: CommerceProduct[]): Promise<{
  allowed: boolean; reason: string; owned: string[];
}> {
  await ensureCommerceSchema();
  const sql = db();
  const address = email.trim().toLowerCase();
  const pref = await sql`SELECT marketing_allowed, reason FROM commerce_contact_preferences WHERE email = ${address} LIMIT 1`;
  if (pref[0] && pref[0].marketing_allowed === false) {
    return { allowed: false, reason: String(pref[0].reason || 'marketing disabled'), owned: [] };
  }
  const rows = await sql`SELECT DISTINCT product FROM commerce_entitlements
    WHERE lower(email) = ${address} AND status = 'active' AND (ends_at IS NULL OR ends_at > now())`;
  const owned = rows.map((row) => String(row.product));
  const duplicate = offered.find((product) => owned.includes(product));
  return duplicate
    ? { allowed: false, reason: `already owns ${duplicate}`, owned }
    : { allowed: true, reason: '', owned };
}

export async function messageExists(logicalKey: string): Promise<boolean> {
  await ensureCommerceSchema();
  const sql = db();
  const rows = await sql`SELECT 1 FROM commerce_messages
    WHERE logical_key = ${logicalKey} LIMIT 1`;
  return rows.length > 0;
}

export async function commerceDashboardSnapshot(): Promise<{
  orders: Record<string, unknown>[];
  orderStatus: Record<string, unknown>[];
  revenue: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  checks: Record<string, unknown>[];
}> {
  await ensureCommerceSchema();
  const sql = db();
  const [orders, orderStatus, revenue, jobs, messages, checks] = await Promise.all([
    sql`SELECT id, source, provider_ref, email, product, site, status, amount, currency, created_at
      FROM commerce_orders ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT status, count(*)::int AS count FROM commerce_orders GROUP BY status ORDER BY status`,
    sql`SELECT currency, sum(amount)::numeric AS amount, count(*)::int AS orders
      FROM commerce_orders WHERE status = 'paid' AND amount IS NOT NULL
      GROUP BY currency ORDER BY currency`,
    sql`SELECT status, count(*)::int AS count FROM commerce_fulfilment_jobs GROUP BY status ORDER BY status`,
    sql`SELECT status, count(*)::int AS count FROM commerce_messages GROUP BY status ORDER BY status`,
    sql`SELECT lang, count(*)::int AS count FROM checks
      WHERE created_at >= now() - interval '30 days' GROUP BY lang ORDER BY lang`,
  ]);
  return { orders, orderStatus, revenue, jobs, messages, checks };
}

export async function recordManualOrder(input: {
  orderKey: string; email: string; product: CommerceProduct; amount: number; currency: string; site?: string; metadata?: Record<string, unknown>;
}): Promise<{ orderId: string; duplicate: boolean; metadata: Record<string, unknown> }> {
  await ensureCommerceSchema();
  const sql = db();
  const orderId = randomUUID();
  const inserted = await sql`INSERT INTO commerce_orders
      (id, order_key, source, provider_ref, email, product, site, status, amount, currency, metadata)
    VALUES (${orderId}, ${input.orderKey}, 'ru-invoice', ${input.orderKey}, ${input.email.toLowerCase()}, ${input.product}, ${input.site ?? ''}, 'pending', ${input.amount}, ${input.currency}, ${JSON.stringify(input.metadata ?? {})}::jsonb)
    ON CONFLICT (order_key) DO NOTHING
    RETURNING id, metadata`;
  if (inserted[0]) return { orderId: String(inserted[0].id), duplicate: false, metadata: (inserted[0].metadata ?? {}) as Record<string, unknown> };
  const found = await sql`SELECT id, metadata FROM commerce_orders WHERE order_key = ${input.orderKey} LIMIT 1`;
  if (!found[0]) throw new Error('manual order conflicted but could not be read');
  return { orderId: String(found[0].id), duplicate: true, metadata: (found[0].metadata ?? {}) as Record<string, unknown> };
}

export function verifyInternalSignature(raw: string, headers: { timestamp: string | null; signature: string | null }, secret: string, now = Math.floor(Date.now() / 1000)): boolean {
  const ts = Number(headers.timestamp);
  if (!secret || !Number.isFinite(ts) || Math.abs(now - ts) > 300 || !headers.signature) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex'));
  const supplied = Buffer.from(headers.signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function verifyStandardWebhook(raw: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, secret: string, now = Math.floor(Date.now() / 1000)): boolean {
  const ts = Number(headers.timestamp);
  if (!secret || !headers.id || !headers.signature || !Number.isFinite(ts) || Math.abs(now - ts) > 300) return false;
  const bare = secret.replace(/^whsec_/, '');
  let key: Buffer;
  try { key = Buffer.from(bare, 'base64'); } catch { return false; }
  if (!key.length) return false;
  const expected = createHmac('sha256', key).update(`${headers.id}.${headers.timestamp}.${raw}`).digest();
  return headers.signature.split(' ').some((part) => {
    if (!part.startsWith('v1,')) return false;
    const value = part.slice(3);
    const supplied = Buffer.from(value, 'base64');
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}
