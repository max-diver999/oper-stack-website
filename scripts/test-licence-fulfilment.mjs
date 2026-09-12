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

const ruMail = buildLicenceEmail({ email: 'a@b.c', key: 'OSK1.x.y', plan: 'owner', expires: '2027-01-01', downloadUrl: 'https://x/y?t=1', supportEmail: 's@x', siteUrl: 'https://x', lang: 'ru' });
check('russian letter has a russian subject', /лицензионный ключ/i.test(ruMail.subject));
check('russian letter has no english sentences', !/Thank you for buying|Get started|Download the kit/.test(ruMail.text));
check('russian letter still carries the key and the link', ruMail.text.includes('OSK1.x.y') && ruMail.text.includes('https://x/y?t=1'));
check('russian letter states the seven day refund', /семь дней/.test(ruMail.text));
check('english letter is unchanged by the russian one', /Thank you for buying/.test(mail.text) && !/Спасибо/.test(mail.text));
check('email HTML escapes nothing dangerous and mentions the agency plan', mail.html.includes('Agency plan') && !mail.html.includes('<script'));


// 6. Whop: подпись, разбор события и выдача ключа по платежу.
{
  const { verifyWhopSignature, signWhopBody, readWhopPayment, handleWhopPayment } = await import('../src/lib/licence-fulfilment.ts');
  const secret = 'ws_' + Buffer.from('a'.repeat(32)).toString('base64');
  const body = JSON.stringify({ type: 'payment.succeeded', data: { id: 'pay_1', user_email: 'Buyer@Example.com', product_id: 'prod_kit' } });
  const now = Math.floor(Date.now() / 1000);
  const h = signWhopBody(body, secret, 'msg_1', now);

  check('whop: своя подпись принимается', verifyWhopSignature(body, h, secret, now).ok);
  check('whop: чужая подпись отклоняется', !verifyWhopSignature(body, { ...h, signature: 'v1,' + Buffer.from('nope').toString('base64') }, secret, now).ok);
  check('whop: подменённое тело отклоняется', !verifyWhopSignature(body + ' ', h, secret, now).ok);
  check('whop: старый запрос отклоняется', !verifyWhopSignature(body, h, secret, now + 3600).ok);
  check('whop: без заголовков отклоняется', !verifyWhopSignature(body, { id: null, timestamp: null, signature: null }, secret, now).ok);
  check('whop: несколько подписей в заголовке, одна наша', verifyWhopSignature(body, { ...h, signature: `v1,${Buffer.from('other').toString('base64')} ${h.signature}` }, secret, now).ok);

  const idToPlan = { prod_kit: 'owner', plan_agency: 'agency' };
  const read = readWhopPayment(JSON.parse(body), idToPlan);
  check('whop: почта приведена к нижнему регистру', read.email === 'buyer@example.com', read.email ?? 'нет');
  check('whop: тариф определён по товару', read.plan === 'owner');
  check('whop: чужой товар не даёт тарифа', readWhopPayment({ type: 'payment.succeeded', data: { id: 'p', product_id: 'prod_other' } }, idToPlan).plan === null);
  check('whop: почта видна и во вложенном объекте', readWhopPayment({ type: 'payment.succeeded', data: { user: { email: 'A@B.co' } } }, idToPlan).email === 'a@b.co');

  const sent = [];
  const deps = {
    idToPlan,
    getBuyerEmail: async () => 'fallback@example.com',
    issue: () => ({ key: 'OSK1.x.y', expires: '2027-09-11' }),
    downloadUrl: (email) => `https://oper-stack.com/api/kit-download/?t=${encodeURIComponent(email)}`,
    sendMail: async (m) => sent.push(m),
    notify: async () => {},
    supportEmail: 'info@oper-stack.com',
    siteUrl: 'https://oper-stack.com',
  };
  const done = await handleWhopPayment(JSON.parse(body), deps);
  check('whop: ключ выдан', done.handled && done.email === 'buyer@example.com', done.reason);
  check('whop: письмо ушло один раз', sent.length === 1 && sent[0].text.includes('OSK1.x.y'));

  const noEmail = await handleWhopPayment({ type: 'payment.succeeded', data: { id: 'pay_2', user_id: 'user_1', product_id: 'prod_kit' } }, deps);
  check('whop: почта добирается через API, если её не было', noEmail.handled && noEmail.email === 'fallback@example.com', noEmail.reason);

  const other = await handleWhopPayment({ type: 'payment.succeeded', data: { id: 'pay_3', product_id: 'prod_other' } }, deps);
  check('whop: чужой товар не выдаёт ключ', !other.handled && other.reason.includes('no Site Kit'));
  const ignored = await handleWhopPayment({ type: 'membership.cancelled', data: {} }, deps);
  check('whop: посторонние события игнорируются', !ignored.handled);
  check('whop: лишних писем не ушло', sent.length === 2, `писем ${sent.length}`);
}


// ── Агентский план ────────────────────────────────────────────────────────────
// Правило: ключ подписки живёт месяц с запасом, а письмо ведёт в npm, а не в архив.
const { buildAgencyEmail } = await import('../src/lib/licence-fulfilment.ts');

const month = issueLicenceKey({ email: 'agency@example.com', plan: 'agency', days: 35 }, privatePem);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
check('ключ подписки живёт 35 дней', daysBetween(month.issued, month.expires) === 35);

const year = issueLicenceKey({ email: 'owner@example.com', plan: 'owner' }, privatePem);
check('разовая покупка по-прежнему на год', daysBetween(year.issued, year.expires) >= 365);

const claim = JSON.parse(Buffer.from(month.key.split('.')[1], 'base64url').toString('utf8'));
check('в ключе записан агентский план', claim.plan === 'agency');
check('почта в ключе приведена к нижнему регистру', claim.email === 'agency@example.com');

const first = buildAgencyEmail({ email: 'a@b.c', key: month.key, expires: month.expires, supportEmail: 's@x', siteUrl: 'https://x' });
check('письмо не обещает продление тому, кто купил впервые', !/renewed/i.test(first.subject) && !/renewed/i.test(first.text));
check('письмо ведёт в npm, а не в архив', first.text.includes('npm install -g @operstack/audit'));
check('в письме есть сама команда прогона', first.text.includes('operstack-audit batch'));
check('ключ в письме целиком', first.text.includes(month.key));
check('в письме нет ссылки на скачивание архива', !/kit-download/.test(first.text));

check('письмо называет срок, до которого ключ жив', first.text.includes(month.expires));


console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
