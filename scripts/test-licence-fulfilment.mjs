#!/usr/bin/env node
/**
 * Offline test of the licence fulfilment logic: key format against the kit's verifier, webhook
 * signature checks, download tokens, and the transaction handler with fake dependencies.
 * Run: node scripts/test-licence-fulfilment.mjs (Node 22.6 or newer strips the TypeScript types).
 */
import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import {
  buildLicenceEmail,
  handleTransactionCompleted,
  issueLicenceKey,
  makeDownloadToken,
  parsePriceMap,
  signPaddleBody,
  verifyDownloadToken,
  verifyPaddleSignature,
} from '../src/lib/licence-fulfilment.ts';

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
  if (!ok) failures++;
};

// 1. Key format, verified the way site-kit/scripts/activate.mjs verifies it.
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
const issued = issueLicenceKey({ email: 'Buyer@Example.com', plan: 'owner', issued: new Date('2026-09-11T10:00:00Z') }, privatePem);
const m = issued.key.match(/^OSK1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
check('key has the OSK1.payload.signature shape', Boolean(m));
const payload = Buffer.from(m[1], 'base64url');
const data = JSON.parse(payload.toString('utf8'));
check('payload fields match the kit verifier', data.email === 'buyer@example.com' && data.plan === 'owner' && data.issued === '2026-09-11' && data.expires === '2027-09-11', JSON.stringify(data));
check('signature verifies with the public key', verify(null, payload, createPublicKey(publicPem), Buffer.from(m[2], 'base64url')));
check('tampered key fails', !verify(null, Buffer.from(payload.toString('utf8').replace('owner', 'agency')), createPublicKey(publicPem), Buffer.from(m[2], 'base64url')));

// 2. Paddle signature.
const secret = 'pdl_ntfset_test_secret';
const body = JSON.stringify({ event_type: 'transaction.completed', data: { id: 'txn_1' } });
const now = 1_800_000_000;
check('valid signature accepted', verifyPaddleSignature(body, signPaddleBody(body, secret, now), secret, now).ok);
check('wrong secret rejected', !verifyPaddleSignature(body, signPaddleBody(body, 'other', now), secret, now).ok);
check('altered body rejected', !verifyPaddleSignature(body + ' ', signPaddleBody(body, secret, now), secret, now).ok);
check('stale timestamp rejected', !verifyPaddleSignature(body, signPaddleBody(body, secret, now - 3600), secret, now).ok);
check('missing header rejected', !verifyPaddleSignature(body, null, secret, now).ok);
check('rotated header with two h1 values accepted', verifyPaddleSignature(body, `${signPaddleBody(body, 'old', now)};h1=${signPaddleBody(body, secret, now).split('h1=')[1]}`, secret, now).ok);

// 3. Download tokens.
const dl = makeDownloadToken({ email: 'buyer@example.com', exp: now + 3600 }, 'dl-secret');
check('download token round-trips', verifyDownloadToken(dl, 'dl-secret', now).email === 'buyer@example.com');
check('expired download token rejected', !verifyDownloadToken(dl, 'dl-secret', now + 7200).ok);
check('forged download token rejected', !verifyDownloadToken(dl.slice(0, -2) + 'zz', 'dl-secret', now).ok);

// 4. Handler with fake dependencies.
const priceToPlan = parsePriceMap('pri_kit:owner,pri_agency:agency,junk');
check('price map parsed', priceToPlan.pri_kit === 'owner' && priceToPlan.pri_agency === 'agency' && Object.keys(priceToPlan).length === 2);
const calls = { mail: [], notify: [] };
const deps = {
  priceToPlan,
  getCustomerEmail: async (id) => (id === 'ctm_1' ? 'buyer@example.com' : null),
  issue: (email, plan) => ({ key: `OSK1.test.${plan}`, expires: '2027-09-11' }),
  downloadUrl: (email) => `https://oper-stack.com/api/kit-download/?t=token-for-${email}`,
  sendMail: async (msg) => { calls.mail.push(msg); },
  notify: async (text) => { calls.notify.push(text); },
  supportEmail: 'support@oper-stack.com',
  siteUrl: 'https://oper-stack.com',
};
const paid = { event_type: 'transaction.completed', data: { id: 'txn_1', customer_id: 'ctm_1', items: [{ price: { id: 'pri_other' } }, { price: { id: 'pri_kit' } }] } };
const r1 = await handleTransactionCompleted(paid, deps);
check('kit purchase issues a key', r1.handled && r1.plan === 'owner' && calls.mail.length === 1 && calls.mail[0].to === 'buyer@example.com', JSON.stringify(r1));
check('email carries key, download link and support address', /OSK1\.test\.owner/.test(calls.mail[0].text) && /kit-download/.test(calls.mail[0].text) && /support@oper-stack\.com/.test(calls.mail[0].text));
check('owner notified', calls.notify.length === 1 && /issued/.test(calls.notify[0]));
const r2 = await handleTransactionCompleted({ event_type: 'transaction.completed', data: { id: 'txn_2', customer_id: 'ctm_1', items: [{ price: { id: 'pri_other' } }] } }, deps);
check('transaction without a kit item is ignored', !r2.handled && calls.mail.length === 1, r2.reason);
const r3 = await handleTransactionCompleted({ event_type: 'transaction.completed', data: { id: 'txn_3', customer_id: 'ctm_missing', items: [{ price: { id: 'pri_kit' } }] } }, deps);
check('missing customer email notifies the owner instead of failing silently', !r3.handled && calls.notify.length === 2, r3.reason);
const r4 = await handleTransactionCompleted({ event_type: 'transaction.updated', data: {} }, deps);
check('other events ignored', !r4.handled);
const mail = buildLicenceEmail({ email: 'a@b.c', key: 'OSK1.x.y', plan: 'agency', expires: '2027-01-01', downloadUrl: 'https://x/y?t=1', supportEmail: 's@x', siteUrl: 'https://x' });
check('email HTML escapes nothing dangerous and mentions the agency plan', mail.html.includes('Agency plan') && !mail.html.includes('<script'));

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
