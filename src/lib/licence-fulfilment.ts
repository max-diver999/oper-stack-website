/**
 * Site Kit licence fulfilment: pure functions shared by the Paddle webhook route, the download
 * route and the local test script. No Astro imports here so `node scripts/test-licence-fulfilment.mjs`
 * can exercise everything without a build.
 *
 * Key format (must match site-kit/scripts/activate.mjs and site-kit-tools/make-license.mjs):
 *   OSK1.<base64url JSON {email, plan, issued, expires}>.<base64url Ed25519 signature of that JSON>
 */
import { createHmac, createPrivateKey, sign, timingSafeEqual } from 'node:crypto';

export type Plan = 'owner' | 'agency';

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Issue a licence key for an email address. `privatePem` is the Ed25519 private key in PEM form. */
export function issueLicenceKey(
  input: { email: string; plan: Plan; years?: number; issued?: Date },
  privatePem: string,
): { key: string; issued: string; expires: string } {
  const issued = input.issued ?? new Date();
  const expires = new Date(issued);
  expires.setFullYear(expires.getFullYear() + (input.years ?? 1));
  const payload = Buffer.from(
    JSON.stringify({ email: input.email.trim().toLowerCase(), plan: input.plan, issued: isoDay(issued), expires: isoDay(expires) }),
  );
  const signature = sign(null, payload, createPrivateKey(privatePem));
  return { key: `OSK1.${payload.toString('base64url')}.${signature.toString('base64url')}`, issued: isoDay(issued), expires: isoDay(expires) };
}

/** Paddle-Signature header: `ts=<unix>;h1=<hex>` (h1 may repeat while a secret rotates). */
export function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
): { ok: boolean; reason?: string } {
  if (!header) return { ok: false, reason: 'missing Paddle-Signature header' };
  let ts = 0;
  const hashes: string[] = [];
  for (const part of header.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === 'ts') ts = Number(v);
    if (k === 'h1' && v) hashes.push(v);
  }
  if (!ts || hashes.length === 0) return { ok: false, reason: 'malformed Paddle-Signature header' };
  if (Math.abs(nowSec - ts) > toleranceSec) return { ok: false, reason: 'timestamp outside tolerance' };
  const expected = Buffer.from(createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex'), 'hex');
  for (const h of hashes) {
    const given = Buffer.from(h, 'hex');
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true };
  }
  return { ok: false, reason: 'signature mismatch' };
}

/** Build a Paddle-Signature header for a body: used by the test script and by simulations of our own. */
export function signPaddleBody(rawBody: string, secret: string, ts: number): string {
  return `ts=${ts};h1=${createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex')}`;
}

/** `pri_abc:owner,pri_def:agency` to a lookup table. */
export function parsePriceMap(spec: string): Record<string, Plan> {
  const map: Record<string, Plan> = {};
  for (const entry of spec.split(',')) {
    const [id, plan] = entry.trim().split(':');
    if (id && (plan === 'owner' || plan === 'agency')) map[id] = plan;
  }
  return map;
}

/** Signed, time-limited download token: base64url(JSON) + "." + HMAC. */
export function makeDownloadToken(claims: { email: string; exp: number }, secret: string): string {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function verifyDownloadToken(token: string, secret: string, nowSec: number = Math.floor(Date.now() / 1000)): { ok: boolean; email?: string; reason?: string } {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return { ok: false, reason: 'malformed token' };
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('base64url'));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'bad signature' };
  let claims: { email?: string; exp?: number };
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'unreadable token' };
  }
  if (!claims.exp || claims.exp < nowSec) return { ok: false, reason: 'link expired' };
  return { ok: true, email: claims.email };
}

/**
 * Письмо с лицензионным ключом. Язык покупателя решает всё: кто купил на русском сайте или через
 * российского провайдера, получает русское письмо, кто на английском, английское. Смешивать нельзя:
 * человек, купивший по-русски, не должен получать инструкцию на языке, которого может не знать.
 */
export function buildLicenceEmail(input: {
  email: string; key: string; plan: Plan; expires: string; downloadUrl: string;
  supportEmail: string; siteUrl: string; lang?: 'en' | 'ru';
}) {
  const ru = input.lang === 'ru';
  const planLabel = ru
    ? (input.plan === 'agency' ? 'тариф «Агентство»' : 'тариф «Владелец»')
    : (input.plan === 'agency' ? 'Agency plan' : 'Owner plan');
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const t = ru
    ? {
        subject: 'Ваш лицензионный ключ OperStack Site Kit',
        thanks: 'Спасибо за покупку OperStack Site Kit.',
        keyLabel: 'Лицензионный ключ',
        keyMeta: `${planLabel}, обновления до ${input.expires}`,
        dlLabel: 'Скачать комплект',
        dlMeta: 'ссылка работает 30 дней, новую можно попросить в любой момент',
        startLabel: 'С чего начать',
        steps: [
          'Распакуйте архив и откройте папку в терминале: npm install',
          `npm run activate ${input.key}`,
          'Откройте QUICKSTART.md и идите по нему со второго шага.',
        ],
        tail: `Ключ привязан к адресу ${input.email}, никому его не передавайте. Вопросы и возврат, семь дней без объяснения причин: ${input.supportEmail}.`,
        terms: `Условия: ${input.siteUrl}/terms/ и лицензионное соглашение внутри комплекта.`,
      }
    : {
        subject: 'Your OperStack Site Kit licence',
        thanks: 'Thank you for buying the OperStack Site Kit.',
        keyLabel: 'Licence key',
        keyMeta: `${planLabel}, updates until ${input.expires}`,
        dlLabel: 'Download the kit',
        dlMeta: 'the link works for 30 days; ask for a new one any time',
        startLabel: 'Get started',
        steps: [
          'Unzip the archive and open the folder in a terminal: npm install',
          `npm run activate ${input.key}`,
          'Open QUICKSTART.md and follow it from step 2.',
        ],
        tail: `The key is tied to ${input.email}; keep it private. Questions and refunds (seven days, no questions asked): ${input.supportEmail}.`,
        terms: `Terms: ${input.siteUrl}/terms/ and the EULA inside the kit.`,
      };

  const text = [
    t.thanks,
    '',
    `${t.keyLabel} (${t.keyMeta}):`,
    input.key,
    '',
    `${t.dlLabel} (${t.dlMeta}):`,
    input.downloadUrl,
    '',
    `${t.startLabel}:`,
    ...t.steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    t.tail,
    t.terms,
  ].join('\n');

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#111">
<p>${t.thanks}</p>
<p><strong>${t.keyLabel}</strong> (${esc(t.keyMeta)}):<br><code style="font-size:13px;word-break:break-all">${esc(input.key)}</code></p>
<p><strong>${t.dlLabel}</strong> (${esc(t.dlMeta)}):<br><a href="${esc(input.downloadUrl)}">${esc(input.downloadUrl)}</a></p>
<p><strong>${t.startLabel}</strong></p>
<ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<p>${esc(t.tail)}<br>${esc(t.terms)}</p>
</div>`;

  return { subject: t.subject, text, html };
}

export interface FulfilmentDeps {
  priceToPlan: Record<string, Plan>;
  getCustomerEmail: (customerId: string) => Promise<string | null>;
  issue: (email: string, plan: Plan) => { key: string; expires: string };
  downloadUrl: (email: string) => string;
  sendMail: (msg: { to: string; subject: string; text: string; html: string }) => Promise<void>;
  notify: (text: string) => Promise<void>;
  supportEmail: string;
  siteUrl: string;
  /** Язык покупателя. Задаётся тем, откуда пришла покупка, а не догадками. */
  lang?: 'en' | 'ru';
}

export interface FulfilmentResult {
  handled: boolean;
  reason: string;
  email?: string;
  plan?: Plan;
  transactionId?: string;
}

/** A completed Paddle transaction: issue one key per kit line item's plan and send it to the customer. */
export async function handleTransactionCompleted(event: any, deps: FulfilmentDeps): Promise<FulfilmentResult> {
  const data = event?.data ?? {};
  const transactionId = String(data.id || '');
  if (event?.event_type !== 'transaction.completed') return { handled: false, reason: `ignored event ${event?.event_type}` };
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  const kitItem = items.find((it) => it?.price?.id && deps.priceToPlan[it.price.id]);
  if (!kitItem) return { handled: false, reason: 'no Site Kit item in this transaction', transactionId };
  const plan = deps.priceToPlan[kitItem.price.id];
  const customerId = String(data.customer_id || '');
  const email = customerId ? await deps.getCustomerEmail(customerId) : null;
  if (!email) {
    await deps.notify(`Site Kit paid (${transactionId}) but no customer email for ${customerId || 'unknown customer'}: issue the key by hand.`);
    return { handled: false, reason: 'customer email not found', transactionId, plan };
  }
  const { key, expires } = deps.issue(email, plan);
  const lang = deps.lang ?? (typeof event?.data?.custom_data?.lang === 'string' && event.data.custom_data.lang === 'ru' ? 'ru' : 'en');
  const mail = buildLicenceEmail({ email, key, plan, expires, downloadUrl: deps.downloadUrl(email), supportEmail: deps.supportEmail, siteUrl: deps.siteUrl, lang });
  await deps.sendMail({ to: email, ...mail });
  await deps.notify(`Site Kit licence issued: ${email}, ${plan} plan, updates until ${expires}, transaction ${transactionId}.`);
  return { handled: true, reason: 'licence issued', email, plan, transactionId };
}
