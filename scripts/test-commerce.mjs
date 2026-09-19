import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHmac } from 'node:crypto';

const dir = await mkdtemp(join(tmpdir(), 'operstack-ledger-test-'));
const pg = new PGlite();
globalThis.__commerceTestSql = async (parts, ...values) => {
  const query = parts.reduce((q, part, i) => q + (i ? '$' + i : '') + part, '');
  return (await pg.query(query, values)).rows;
};
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.RESEND_API_KEY = 'test-only';
const outfile = join(dir, 'test.mjs');
await build({ stdin: { contents: "export * from './src/lib/commerce-ledger.ts'; export * from './src/lib/commerce-mail.ts';", resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', outfile,
  plugins: [{ name: 'isolated-postgres', setup(b) {
    b.onResolve({ filter: /^@neondatabase\/serverless$/ }, () => ({ path: 'mock', namespace: 'test' }));
    b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const neon = () => globalThis.__commerceTestSql;' }));
  } }] });
const m = await import(pathToFileURL(outfile));
let sends = 0;
let failOnce = false;
const bodies = [];
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  sends++; bodies.push(options.body);
  if (failOnce) { failOnce = false; throw new Error('connection lost'); }
  return Response.json({ id: 'mail-' + options.headers['Idempotency-Key'] });
};
try {
  const base = { provider: 'whop', eventId: 'evt1', eventType: 'payment.succeeded', orderKey: 'order1', providerRef: 'pay_1', email: 'buyer@example.com', product: 'report-29', kind: 'welcome', amount: 29, currency: 'USD' };
  const first = await m.reserveFulfilment(base);
  assert.equal(first.process, true);
  await assert.rejects(m.reserveFulfilment({ ...base, eventId: 'evt2' }), /in progress/);
  await m.finishFulfilment(first.jobId, 'accepted');
  assert.equal((await m.reserveFulfilment(base)).process, false);
  assert.equal((await m.marketingEligibility(base.email, ['report-9'])).allowed, false);
  assert.equal((await m.marketingEligibility(base.email, ['audit-149'])).allowed, true);
  const payload = { from: 'OperStack <info@oper-stack.com>', to: [base.email], subject: 'Report', text: 'First body' };
  const message = { logicalKey: 'test-mail', kind: 'report', payload };
  failOnce = true;
  await assert.rejects(m.sendCommerceMail(message), /connection lost/);
  const sent = await m.sendCommerceMail({ ...message, payload: { ...payload, text: 'Changed body' } });
  assert.equal(bodies[0], bodies[1], 'retry must use saved body');
  await m.sendCommerceMail(message);
  assert.equal(sends, 2, 'accepted message cannot resend');
  await m.updateProviderMessage('resend', sent.messageId, 'delivered', base.email);
  await m.updateProviderMessage('resend', sent.messageId, 'sent', base.email);
  assert.equal((await pg.query('SELECT status FROM commerce_messages WHERE logical_key=$1', ['test-mail'])).rows[0].status, 'delivered');
  const suppressed = await m.sendCommerceMail({ ...message, logicalKey: 'marketing', offered: ['report-29'] });
  assert.equal(suppressed.suppressed, true);
  assert.equal(sends, 2);
  await m.updateProviderMessage('resend', 'unrelated', 'bounced', 'outside@example.com');
  assert.equal((await m.marketingEligibility('outside@example.com', [])).allowed, true);
  await m.updateProviderMessage('resend', 'early', 'bounced', 'early@example.com');
  await m.recordMessage({ logicalKey: 'early', email: 'early@example.com', kind: 'test', provider: 'resend', providerMessageId: 'early', status: 'accepted' });
  assert.equal((await m.marketingEligibility('early@example.com', [])).allowed, false);
  await m.revokeByProviderReference('whop', 'pay_1', 'refunded');
  assert.equal((await m.reserveFulfilment(base)).process, false);
  assert.equal((await m.marketingEligibility(base.email, ['report-29'])).allowed, true);
  await m.setMarketingPermission(base.email, false, 'unsubscribe');
  assert.equal((await m.marketingEligibility(base.email, ['audit-149'])).allowed, false);
  const timestamp = String(Math.floor(Date.now()/1000));
  const key = Buffer.from('test-signing-secret').toString('base64');
  const signature = 'v1,' + createHmac('sha256', Buffer.from(key,'base64')).update('evt.'+timestamp+'.{}').digest('base64');
  assert.equal(m.verifyStandardWebhook('{}', { id: 'evt', timestamp, signature }, 'whsec_'+key), true);
  assert.equal(m.verifyStandardWebhook('{}', { id: 'evt', timestamp, signature }, ''), false);
  console.log('PASS: isolated PostgreSQL — duplicate orders, leases, immutable retries, delivery ordering, scoped bounces, refunds, purchase suppression, unsubscribe, signatures');
} finally { await pg.close(); await rm(dir, { recursive: true, force: true }); }
