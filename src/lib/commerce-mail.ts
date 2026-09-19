import { createHash } from 'node:crypto';
import { db, ensureCommerceSchema, marketingEligibility, recordMessage } from './commerce-ledger';
import type { CommerceProduct } from './commerce-policy';

export type MailPayload = {
  from: string; to: string[]; subject: string; text: string; html?: string;
  reply_to?: string; headers?: Record<string, string>;
  attachments?: { filename: string; content: string; content_type?: string }[];
};

/** Durable immutable email request: retries use exactly the same provider body and key. */
export async function sendCommerceMail(input: {
  logicalKey: string; kind: string; payload: MailPayload; jobId?: string; offered?: CommerceProduct[];
}): Promise<{ provider: 'resend'; messageId: string; suppressed?: boolean }> {
  await ensureCommerceSchema();
  const sql = db();
  const address = input.payload.to[0]?.trim().toLowerCase();
  if (!address || input.payload.to.length !== 1 || !input.logicalKey || input.logicalKey.length > 512) throw new Error('invalid outbox request');
  await sql`INSERT INTO commerce_outbox (logical_key,payload,kind,email,offered,job_id)
    VALUES (${input.logicalKey},${JSON.stringify(input.payload)}::jsonb,${input.kind},${address},
      ${input.offered === undefined ? null : JSON.stringify(input.offered)}::jsonb,${input.jobId ?? null})
    ON CONFLICT DO NOTHING`;
  const [row] = await sql`SELECT * FROM commerce_outbox WHERE logical_key = ${input.logicalKey}`;
  if (row.email !== address) throw new Error('outbox recipient conflict');
  if (row.status === 'accepted') {
    await recordMessage({ logicalKey: input.logicalKey, jobId: row.job_id || undefined, email: address,
      kind: row.kind, subject: row.payload.subject, provider: 'resend', providerMessageId: row.provider_message_id, status: 'accepted' });
    return { provider: 'resend', messageId: row.provider_message_id };
  }
  if (row.status === 'suppressed') return { provider: 'resend', messageId: '', suppressed: true };
  if (row.offered !== null) {
    const eligibility = await marketingEligibility(address, row.offered);
    if (!eligibility.allowed) {
      await sql`UPDATE commerce_outbox SET status='suppressed',last_error=${eligibility.reason},updated_at=now() WHERE logical_key=${input.logicalKey}`;
      await recordMessage({ logicalKey: input.logicalKey, email: address, kind: row.kind, subject: row.payload.subject,
        provider: 'resend', status: 'suppressed', metadata: { reason: eligibility.reason } });
      return { provider: 'resend', messageId: '', suppressed: true };
    }
  }
  // Resend retains keys for 24 hours. Do not blindly resend an uncertain older request.
  if (row.first_attempt_at && Date.now() - new Date(row.first_attempt_at).getTime() >= 23 * 3600_000) {
    await sql`UPDATE commerce_outbox SET status='review',last_error='Provider deduplication window expired: reconcile before retry',updated_at=now() WHERE logical_key=${input.logicalKey}`;
    throw new Error('email requires delivery reconciliation; automatic duplicate prevented');
  }
  const claimed = await sql`UPDATE commerce_outbox SET status='sending', attempts=attempts+1,
      first_attempt_at=COALESCE(first_attempt_at,now()),lease_until=now()+interval '90 seconds',updated_at=now()
    WHERE logical_key=${input.logicalKey} AND status IN ('pending','retry','sending')
      AND (lease_until IS NULL OR lease_until < now()) RETURNING logical_key`;
  if (!claimed.length) throw new Error('email busy or requires review; retry later');
  try {
    const key = process.env.RESEND_API_KEY || import.meta.env?.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
        'Idempotency-Key': createHash('sha256').update(input.logicalKey).digest('hex') },
      body: JSON.stringify(row.payload), signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Resend rejected send (${response.status})`);
    const result = await response.json() as { id?: string };
    if (!result.id) throw new Error('Resend response missing email id');
    await sql`UPDATE commerce_outbox SET status='accepted',provider_message_id=${result.id},lease_until=NULL,last_error='',updated_at=now() WHERE logical_key=${input.logicalKey}`;
    await recordMessage({ logicalKey: input.logicalKey, jobId: row.job_id || undefined, email: address,
      kind: row.kind, subject: row.payload.subject, provider: 'resend', providerMessageId: result.id, status: 'accepted' });
    return { provider: 'resend', messageId: result.id };
  } catch (error) {
    await sql`UPDATE commerce_outbox SET status='retry',lease_until=NULL,last_error=${String((error as Error).message).slice(0,500)},updated_at=now()
      WHERE logical_key=${input.logicalKey} AND status <> 'accepted'`;
    throw error;
  }
}

export async function retryCommerceMail(): Promise<{ retried: number; failed: number }> {
  await ensureCommerceSchema();
  const sql = db();
  const rows = await sql`SELECT * FROM commerce_outbox
    WHERE status IN ('pending','retry','sending') AND (lease_until IS NULL OR lease_until < now())
    ORDER BY created_at LIMIT 10`;
  let retried = 0; let failed = 0;
  for (const row of rows) {
    try {
      await sendCommerceMail({ logicalKey: row.logical_key, kind: row.kind, payload: row.payload,
        jobId: row.job_id || undefined, offered: row.offered ?? undefined });
      if (row.job_id) await sql`UPDATE commerce_fulfilment_jobs SET status='accepted',lease_until=NULL,last_error='',updated_at=now() WHERE id=${row.job_id}`;
      retried++;
    } catch { failed++; }
  }
  return { retried, failed };
}
