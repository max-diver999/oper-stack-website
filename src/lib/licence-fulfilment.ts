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
  input: { email: string; plan: Plan; years?: number; days?: number; issued?: Date },
  privatePem: string,
): { key: string; issued: string; expires: string } {
  const issued = input.issued ?? new Date();
  const expires = new Date(issued);
  // Подписка продлевается помесячно, поэтому ключу нужен срок в днях, а не в годах. Запас в
  // несколько дней сверх месяца закрывает задержку платежа: иначе оформление отвалится у человека,
  // который платит вовремя, просто банк подумал лишний день.
  if (input.days) expires.setDate(expires.getDate() + input.days);
  else expires.setFullYear(expires.getFullYear() + (input.years ?? 1));
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
/**
 * Какой продукт скачивают. Раньше продукт был один, и токен его не называл: ссылка всегда вела
 * в репозиторий кита. Теперь продуктов два, и ссылка обязана знать, за каким из них пришли,
 * иначе покупатель «Боли в страницы» скачал бы Site Kit.
 */
export type DownloadProduct = 'site-kit' | 'pain-to-seo';

export function makeDownloadToken(claims: { email: string; exp: number; product?: DownloadProduct }, secret: string): string {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function verifyDownloadToken(token: string, secret: string, nowSec: number = Math.floor(Date.now() / 1000)): { ok: boolean; email?: string; product?: DownloadProduct; reason?: string } {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return { ok: false, reason: 'malformed token' };
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('base64url'));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'bad signature' };
  let claims: { email?: string; exp?: number; product?: DownloadProduct };
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'unreadable token' };
  }
  if (!claims.exp || claims.exp < nowSec) return { ok: false, reason: 'link expired' };
  // Ссылки, выданные до появления второго продукта, продукта не называют: это кит.
  return { ok: true, email: claims.email, product: claims.product ?? 'site-kit' };
}

/**
 * Письмо с лицензионным ключом. Язык покупателя решает всё: кто купил на русском сайте или через
 * российского провайдера, получает русское письмо, кто на английском, английское. Смешивать нельзя:
 * человек, купивший по-русски, не должен получать инструкцию на языке, которого может не знать.
 */
export function buildLicenceEmail(input: {
  email: string; key: string; plan: Plan; expires: string; downloadUrl: string;
  supportEmail: string; siteUrl: string; lang?: 'en' | 'ru'; product?: DownloadProduct;
}) {
  const ru = input.lang === 'ru';
  // Продуктов, которые выдаются ключом, теперь два, и шаги запуска у них разные.
  const isPain = input.product === 'pain-to-seo';
  const planLabel = ru
    ? (input.plan === 'agency' ? 'тариф «Агентство»' : 'тариф «Владелец»')
    : (input.plan === 'agency' ? 'Agency plan' : 'Owner plan');
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const t = ru
    ? {
        subject: isPain ? 'Ваш лицензионный ключ «Боль в страницы»' : 'Ваш лицензионный ключ OperStack Site Kit',
        thanks: isPain ? 'Спасибо за покупку «Боли в страницы».' : 'Спасибо за покупку OperStack Site Kit.',
        keyLabel: 'Лицензионный ключ',
        keyMeta: `${planLabel}, обновления до ${input.expires}`,
        dlLabel: isPain ? 'Скачать программу' : 'Скачать комплект',
        dlMeta: 'ссылка работает 30 дней, новую можно попросить в любой момент',
        startLabel: 'С чего начать',
        steps: isPain
          ? [
              'Распакуйте архив и откройте папку в терминале: npm install',
              'node bin/pain.mjs <папка с выгрузкой переписок> --site вашсайт.ru --lang ru',
              'Откройте полученный отчёт: строки сверху это страницы, которых на сайте нет.',
            ]
          : [
              'Распакуйте архив и откройте папку в терминале: npm install',
              `npm run activate ${input.key}`,
              'Откройте QUICKSTART.md и идите по нему со второго шага.',
            ],
        tail: `Ключ привязан к адресу ${input.email}, никому его не передавайте. Вопросы и возврат, семь дней без объяснения причин: ${input.supportEmail}.`,
        terms: `Условия: ${input.siteUrl}/terms/ и лицензионное соглашение внутри архива.`,
      }
    : {
        subject: isPain ? 'Your Pain to SEO licence' : 'Your OperStack Site Kit licence',
        thanks: isPain ? 'Thank you for buying Pain to SEO.' : 'Thank you for buying the OperStack Site Kit.',
        keyLabel: 'Licence key',
        keyMeta: `${planLabel}, updates until ${input.expires}`,
        dlLabel: isPain ? 'Download the program' : 'Download the kit',
        dlMeta: 'the link works for 30 days; ask for a new one any time',
        startLabel: 'Get started',
        steps: isPain
          ? [
              'Unzip the archive and open the folder in a terminal: npm install',
              'node bin/pain.mjs <folder with your conversation export> --site yoursite.com',
              'Open the report: the rows at the top are the pages your site does not have.',
            ]
          : [
              'Unzip the archive and open the folder in a terminal: npm install',
              `npm run activate ${input.key}`,
              'Open QUICKSTART.md and follow it from step 2.',
            ],
        tail: `The key is tied to ${input.email}; keep it private. Questions and refunds (seven days, no questions asked): ${input.supportEmail}.`,
        terms: `Terms: ${input.siteUrl}/terms/ and the EULA inside the archive.`,
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

/**
 * Whop подписывает вебхук по спецификации Standard Webhooks: HMAC-SHA256 от строки
 * `{webhook-id}.{webhook-timestamp}.{тело}`, результат в base64 в заголовке `webhook-signature`
 * в виде `v1,<подпись>`. Ключ это секрет вида `ws_...`.
 *
 * В документации Whop сказано брать секрет как есть, а спецификация Standard Webhooks требует
 * отбросить префикс и раскодировать остаток из base64. Разбираться на живом платеже поздно,
 * поэтому проверяем оба варианта ключа: подпись, сошедшаяся хоть по одному, настоящая, а чужая
 * не сойдётся ни по одному.
 */
export function verifyWhopSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
): { ok: boolean; reason?: string } {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return { ok: false, reason: 'missing webhook-id, webhook-timestamp or webhook-signature' };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'webhook-timestamp is not a number' };
  if (Math.abs(nowSec - ts) > toleranceSec) return { ok: false, reason: 'timestamp outside tolerance' };

  const signed = `${id}.${timestamp}.${rawBody}`;
  const keys: Buffer[] = [Buffer.from(secret, 'utf8')];
  const bare = secret.replace(/^ws_/, '');
  try { const decoded = Buffer.from(bare, 'base64'); if (decoded.length) keys.push(decoded); } catch { /* пропускаем */ }

  // Заголовок может нести несколько подписей через пробел, пока идёт смена секрета.
  const given = signature.split(' ').map((part) => part.trim().replace(/^v1,?/, '')).filter(Boolean);
  for (const key of keys) {
    const expected = createHmac('sha256', key).update(signed).digest();
    for (const one of given) {
      let mine: Buffer;
      try { mine = Buffer.from(one, 'base64'); } catch { continue; }
      if (mine.length === expected.length && timingSafeEqual(mine, expected)) return { ok: true };
    }
  }
  return { ok: false, reason: 'signature mismatch' };
}

/** Подписанный запрос Whop: нужен тестам и нашим собственным прогонам. */
export function signWhopBody(rawBody: string, secret: string, id: string, ts: number): { id: string; timestamp: string; signature: string } {
  const signed = `${id}.${ts}.${rawBody}`;
  return { id, timestamp: String(ts), signature: `v1,${createHmac('sha256', Buffer.from(secret, 'utf8')).update(signed).digest('base64')}` };
}

/** Достаём из события то, что нужно для выдачи ключа. Поля ищем по нескольким путям: форма
 *  события у Whop зависит от версии API, и терять покупку из-за переименованного поля нельзя. */
export function readWhopPayment(event: any, idToPlan: Record<string, Plan>): {
  type: string; paymentId: string; email: string | null; userId: string | null; plan: Plan | null; matchedId: string | null;
} {
  const d = event?.data ?? {};
  const first = (...values: unknown[]) => values.find((v) => typeof v === 'string' && v.trim().length > 0) as string | undefined;
  const email = first(d.user_email, d.email, d.user?.email, d.member?.email, d.membership?.user?.email, d.checkout_session?.email, d.metadata?.email) ?? null;
  const userId = first(d.user_id, d.user?.id, d.member?.user_id, d.membership?.user_id) ?? null;
  const candidates = [d.product_id, d.plan_id, d.access_pass_id, d.product?.id, d.plan?.id, d.access_pass?.id, d.membership?.product_id, d.membership?.plan_id]
    .filter((x): x is string => typeof x === 'string' && x.length > 0);
  const matchedId = candidates.find((id) => idToPlan[id]) ?? null;
  return {
    type: String(event?.type ?? event?.event ?? ''),
    paymentId: String(d.id ?? event?.id ?? ''),
    email: email ? email.trim().toLowerCase() : null,
    userId,
    plan: matchedId ? idToPlan[matchedId] : null,
    matchedId,
  };
}

export interface WhopFulfilmentDeps extends Omit<FulfilmentDeps, 'priceToPlan' | 'getCustomerEmail'> {
  idToPlan: Record<string, Plan>;
  /** Почта покупателя по его id в Whop, если её не было в событии. */
  getBuyerEmail: (userId: string) => Promise<string | null>;
}

/** Успешный платёж в Whop: выдать один ключ на купленный товар и отправить его покупателю. */
export async function handleWhopPayment(event: any, deps: WhopFulfilmentDeps): Promise<FulfilmentResult> {
  const paid = readWhopPayment(event, deps.idToPlan);
  if (!['payment.succeeded', 'membership.went_valid', 'membership_went_valid'].includes(paid.type)) {
    return { handled: false, reason: `ignored event ${paid.type || 'unknown'}` };
  }
  if (!paid.plan) return { handled: false, reason: 'no Site Kit product in this payment', transactionId: paid.paymentId };

  const email = paid.email ?? (paid.userId ? await deps.getBuyerEmail(paid.userId) : null);
  if (!email) {
    await deps.notify(`Site Kit paid on Whop (${paid.paymentId}) but no buyer email in the event or the API: issue the key by hand.`);
    return { handled: false, reason: 'buyer email not found', transactionId: paid.paymentId, plan: paid.plan };
  }

  const { key, expires } = deps.issue(email, paid.plan);
  const mail = buildLicenceEmail({
    email, key, plan: paid.plan, expires,
    downloadUrl: deps.downloadUrl(email), supportEmail: deps.supportEmail, siteUrl: deps.siteUrl, lang: deps.lang ?? 'en',
  });
  await deps.sendMail({ to: email, ...mail });
  await deps.notify(`Site Kit licence issued from Whop: ${email}, ${paid.plan} plan, updates until ${expires}, payment ${paid.paymentId}.`);
  return { handled: true, reason: 'licence issued', email, plan: paid.plan, transactionId: paid.paymentId };
}

/**
 * Письмо агентского плана. У него нет архива для скачивания: инструмент ставится из npm, а
 * покупается право выпускать отчёты под своим брендом. Поэтому и шаги другие, и ключ здесь
 * живёт месяц, а не год: каждый успешный платёж присылает новый.
 */
export function buildAgencyEmail(input: {
  email: string; key: string; expires: string; supportEmail: string; siteUrl: string; renewal?: boolean;
}) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const steps = [
    'npm install -g @operstack/audit',
    `export OPERSTACK_LICENCE="${input.key}"`,
    'operstack-audit batch clients.txt --by "Your Agency" --logo logo.svg --color "#7b3fa0" --no-tool-line --pdf',
  ];
  const lines = [
    input.renewal
      ? 'Your OperStack agency plan renewed. Here is the key for the next month.'
      : 'Your OperStack agency plan is active. Here is your key.',
    '',
    `Licence key: ${input.key}`,
    `Valid until: ${input.expires} (a new key arrives with every renewal)`,
    '',
    'Three commands to your first branded report:',
    ...steps.map((s, i) => `  ${i + 1}. ${s}`),
    '',
    'clients.txt holds one site per line, either "example.com" or "example.com, Client Name".',
    'Reports land in reports/ as HTML and PDF, carrying your logo, your colour and your name.',
    '',
    `Docs: ${input.siteUrl}/products/agency/`,
    `Questions: ${input.supportEmail}`,
  ];
  const text = lines.join('\n');
  return {
    subject: input.renewal ? 'OperStack agency plan renewed' : 'Your OperStack agency licence key',
    text,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#111">${esc(text).replace(/\n/g, '<br>')}</div>`,
  };
}
