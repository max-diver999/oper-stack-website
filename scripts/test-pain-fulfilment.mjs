/** Проверяем выдачу «Боли в страницы»: ключ, ссылка со своим продуктом и письмо про неё, а не про кит. */
import { buildLicenceEmail, issueLicenceKey, makeDownloadToken, readWhopPayment, verifyDownloadToken } from '../src/lib/licence-fulfilment.ts';
import { generateKeyPairSync } from 'node:crypto';

const { privateKey } = generateKeyPairSync('ed25519');
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const secret = 'test-secret';
let bad = 0;
const ok = (name, cond, extra = '') => { if (!cond) bad++; console.log(`${cond ? 'ок ' : 'НЕ '} ${name}${extra ? ' ' + extra : ''}`); };

const paid = readWhopPayment({ type: 'payment.succeeded', data: { id: 'pay_9', product_id: 'prod_TSQ7HucCUfmMi', user_email: 'b@example.com' } }, { prod_TSQ7HucCUfmMi: 'owner' });
ok('покупка «Боли» узнаётся по товару', paid.plan === 'owner' && paid.email === 'b@example.com');

const { key, expires } = issueLicenceKey({ email: 'b@example.com', plan: 'owner' }, pem);
ok('ключ выдан', key.startsWith('OSK1.') && /^\d{4}-\d{2}-\d{2}$/.test(expires));

const token = makeDownloadToken({ email: 'b@example.com', product: 'pain-to-seo', exp: Math.floor(Date.now() / 1000) + 3600 }, secret);
const check = verifyDownloadToken(token, secret);
ok('ссылка помнит, за каким продуктом пришли', check.ok && check.product === 'pain-to-seo', String(check.product));

const oldToken = makeDownloadToken({ email: 'b@example.com', exp: Math.floor(Date.now() / 1000) + 3600 }, secret);
ok('старая ссылка без продукта это кит', verifyDownloadToken(oldToken, secret).product === 'site-kit');

const mailPain = buildLicenceEmail({ email: 'b@example.com', key, plan: 'owner', expires, downloadUrl: 'https://x/', product: 'pain-to-seo', supportEmail: 'info@oper-stack.com', siteUrl: 'https://oper-stack.com', lang: 'en' });
ok('письмо про «Боль», а не про кит', mailPain.subject.includes('Pain to SEO') && !mailPain.text.includes('QUICKSTART'), mailPain.subject);

const mailKit = buildLicenceEmail({ email: 'b@example.com', key, plan: 'owner', expires, downloadUrl: 'https://x/', supportEmail: 'info@oper-stack.com', siteUrl: 'https://oper-stack.com', lang: 'en' });
ok('письмо кита не изменилось', mailKit.subject.includes('Site Kit') && mailKit.text.includes('QUICKSTART'));

const mailRu = buildLicenceEmail({ email: 'b@example.com', key, plan: 'owner', expires, downloadUrl: 'https://x/', product: 'pain-to-seo', supportEmail: 'info@oper-stack.com', siteUrl: 'https://oper-stack.ru', lang: 'ru' });
ok('русское письмо про «Боль»', mailRu.subject.includes('Боль'), mailRu.subject);

console.log(bad ? `\nпровалов: ${bad}` : '\nвыдача «Боли в страницы» работает');
process.exit(bad ? 1 : 0);
