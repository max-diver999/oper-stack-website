/**
 * Whop webhook: on a successful payment for the Site Kit, issue a licence key and email it with a
 * signed download link. Signature-checked; every other event is acknowledged and ignored.
 * Configure the destination in Whop as https://oper-stack.com/api/whop-webhook/.
 *
 * This replaces the Paddle route: Paddle refused the domain because as merchant of record they do
 * not carry services, so the shop moved to Whop. The licence format, the email and the download
 * link are unchanged, only the event that triggers them.
 *
 * Env: WHOP_WEBHOOK_SECRET (ws_...), WHOP_API_KEY, WHOP_SITE_KIT_IDS (prod_x:owner,plan_y:agency), WHOP_AGENCY_IDS,
 * OPERSTACK_LICENCE_PRIVATE_KEY_B64, KIT_DOWNLOAD_SECRET, plus the SMTP and Telegram variables.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { button, emailShell, note, p as par } from '../../lib/email-shell';
import { buildAgencyEmail,
  buildLicenceEmail, issueLicenceKey, makeDownloadToken, parsePriceMap, readWhopPayment, verifyWhopSignature } from '../../lib/licence-fulfilment';
import { buildReportWelcomeEmail, makeReportToken, readWhopReport, reportTierMap, TOKEN_DAYS } from '../../lib/report-fulfilment';
import { sendCommerceMail } from '../../lib/commerce-mail';
import { finishFulfilment, recordMessage, reserveFulfilment, revokeByProviderReference } from '../../lib/commerce-ledger';
import type { CommerceProduct } from '../../lib/commerce-policy';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

/**
 * A paid Whop event contains both pay_... and membership mem_.... The matching membership event
 * uses that same mem_... as data.id. Basing one-time fulfilment on the membership therefore joins
 * the two webhook types, while a second legitimate purchase creates a new membership and remains
 * deliverable. The final email fallback is only for old/malformed payloads with neither id.
 */
function oneTimeOrderKey(product: CommerceProduct, email: string, event: any): string {
  const data = event?.data ?? {};
  const type = String(event?.type ?? event?.event ?? event?.action ?? '');
  const membership = (typeof data.membership === 'string' ? data.membership : data.membership?.id) ?? data.membership_id
    ?? (type.startsWith('membership.') || type === 'membership_went_valid' ? data.id : '');
  const reference = String(membership || (type === 'payment.succeeded' ? data.id : '') || '').trim();
  if (!reference) throw new Error('missing purchase identity');
  if (product === 'agency' && data.billing_reason === 'subscription_cycle' && data.id) return `whop:agency:${data.id}`;
  return `whop:${product}:${reference}`;
}

function whopMoney(event: any): { amount?: number; currency?: string } {
  const data = event?.data ?? {};
  const amount = Number(data.total ?? data.final_amount ?? data.subtotal);
  return {
    ...(Number.isFinite(amount) ? { amount } : {}),
    ...(typeof data.currency === 'string' ? { currency: data.currency.toUpperCase() } : {}),
  };
}


async function notifyTelegram(text: string): Promise<void> {
  const token = env('TG_TOKEN');
  const chat = env('TG_CHAT_ID');
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `🔑 ${text}` }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (err) {
    console.error('telegram notify failed:', err);
  }
}

/**
 * Почта покупателя по его id, если событие её не принесло.
 *
 * Адреса выбраны не наугад, а проверены ключом 13 сентября 2026. Два, которые стояли здесь
 * раньше, этому ключу запрещены: /api/v5/app/users/ отвечает «нужен App API key, а у вас
 * Bot API key», /api/v2/users/ отвечает «нет прав на этот маршрут». Оба молча возвращали
 * null, и покупатель не получал ничего.
 *
 * Разрешены и работают: /api/v5/company/users/<id> и список участников с фильтром по
 * пользователю. Первый отвечает по одному человеку, второй возвращает запись участника,
 * в которой почта лежит либо сверху, либо внутри user. Пробуем по очереди.
 */
async function getBuyerEmail(userId: string): Promise<string | null> {
  const key = env('WHOP_API_KEY');
  if (!key) return null;
  const pick = (o: unknown): string | null => {
    const d = o as Record<string, any> | null;
    const found = d?.email ?? d?.user?.email ?? d?.data?.email ?? d?.data?.user?.email
      ?? (Array.isArray(d?.data) ? (d!.data[0]?.email ?? d!.data[0]?.user?.email) : undefined);
    return typeof found === 'string' && found.includes('@') ? found : null;
  };
  const urls = [
    `https://api.whop.com/api/v5/company/users/${encodeURIComponent(userId)}`,
    `https://api.whop.com/api/v2/members?user_id=${encodeURIComponent(userId)}`,
    `https://api.whop.com/api/v2/memberships?user_id=${encodeURIComponent(userId)}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8_000) });
      if (!res.ok) continue;
      const email = pick(await res.json());
      if (email) return email.trim().toLowerCase();
    } catch { /* пробуем следующий адрес */ }
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const secret = env('WHOP_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'webhook not configured' }, 503);
  const raw = await request.text();
  const check = verifyWhopSignature(raw, {
    id: request.headers.get('webhook-id'),
    timestamp: request.headers.get('webhook-timestamp'),
    signature: request.headers.get('webhook-signature'),
  }, secret);
  if (!check.ok) return json({ error: check.reason }, 401);
  const eventId = request.headers.get('webhook-id') || 'missing-event-id';

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'body is not JSON' }, 400);
  }

  const incomingType = String(event?.type ?? event?.event ?? event?.action ?? '');
  if (incomingType === 'payment.refunded' || (['refund.created', 'refund.updated'].includes(incomingType) && ['succeeded', 'completed'].includes(String(event?.data?.status)))) {
    const reference = String(event?.data?.payment?.id ?? event?.data?.payment_id
      ?? (incomingType.startsWith('payment.') ? event?.data?.id : '') ?? '');
    if (!reference) return json({ ok: true, handled: false, reason: 'refund without payment id' });
    try {
      const revoked = await revokeByProviderReference('whop', reference, 'refunded');
      return json({ ok: true, handled: revoked > 0, revoked });
    } catch (error) {
      console.error('refund ledger failed:', error);
      return json({ ok: false, error: 'ledger unavailable; retry this webhook' }, 503);
    }
  }

  const privatePem = Buffer.from(env('OPERSTACK_LICENCE_PRIVATE_KEY_B64'), 'base64').toString('utf8');
  const downloadSecret = env('KIT_DOWNLOAD_SECRET');
  if (!privatePem.includes('PRIVATE KEY') || !downloadSecret) {
    await notifyTelegram(`Whop payment ${event?.data?.id ?? ''} arrived but the licence signing key or download secret is missing on the server: issue the key by hand.`);
    return json({ ok: false, handled: false, reason: 'fulfilment not configured' }, 503);
  }

  // Отчёт за 9 и за 29: другой товар, другая выдача. Письмо со ссылкой на форму, где покупатель
  // называет свой сайт. Проверяем это раньше кита: у кита свои идентификаторы, они не пересекаются.
  const report = readWhopReport(event, reportTierMap(env('WHOP_REPORT_IDS')));
  if (report.tier && ['payment.succeeded', 'membership.activated', 'membership.went_valid', 'membership_went_valid'].includes(report.type)) {
    const buyer = report.email ?? (report.userId ? await getBuyerEmail(report.userId) : null);
    if (!buyer) {
      await notifyTelegram(`Отчёт за ${report.tier} оплачен на Whop (${report.paymentId}), но почты покупателя нет ни в событии, ни в API: выдать вручную.`);
      return json({ ok: false, handled: false, reason: 'buyer email not found; retry required' }, 503);
    }
    const product: CommerceProduct = report.tier === '9' ? 'report-9' : report.tier === '29' ? 'report-29' : report.tier === 'watch' ? 'watch' : 'audit-149';
    let reserved;
    try {
      reserved = await reserveFulfilment({
        provider: 'whop', eventId, eventType: report.type,
        orderKey: oneTimeOrderKey(product, buyer, event), providerRef: report.paymentId,
        email: buyer, product, kind: 'report-welcome', metadata: { matchedId: report.matchedId },
        ...whopMoney(event),
      });
    } catch (error) {
      console.error('report ledger reservation failed:', error);
      return json({ ok: false, error: 'ledger unavailable; retry this webhook' }, 503);
    }
    if (!reserved.process) return json({ ok: true, handled: false, reason: 'already delivered or being delivered' });
    const lang = env('WHOP_REPORT_LANG', 'en') === 'ru' ? 'ru' : 'en';
    const token = makeReportToken({ orderId: reserved.orderId, purpose: 'report', email: buyer, tier: report.tier, lang, exp: Math.floor(Date.now() / 1000) + TOKEN_DAYS * 24 * 3600, ...(report.tier === 'watch' && report.membership ? { membership: report.membership } : {}) }, downloadSecret);
    const link = `${SITE.url}/report/?t=${encodeURIComponent(token)}${lang === 'ru' ? '&lang=ru' : ''}`;
    try {
      const mail = buildReportWelcomeEmail({ tier: report.tier, lang, link });
      const sent = await sendCommerceMail({ logicalKey: reserved.jobId, jobId: reserved.jobId, kind: 'purchase-delivery', payload: { from: 'OperStack <info@oper-stack.com>', to: [buyer], reply_to: 'info@oper-stack.com', ...mail } });
      await recordMessage({
        jobId: reserved.jobId, logicalKey: reserved.jobId, email: buyer, kind: 'report-welcome',
        subject: mail.subject, provider: sent.provider, providerMessageId: sent.messageId, status: 'accepted',
      });
      await finishFulfilment(reserved.jobId, 'accepted');
      await notifyTelegram(report.tier === 'watch' ? `👀 Подписка Watch: ${buyer} начал (${report.type}), получил ссылку на форму.` : `📄 Отчёт за ${report.tier}: ${buyer} получил ссылку на форму.`);
      return json({ ok: true, handled: true, product: 'report', tier: report.tier });
    } catch (err) {
      console.error('report welcome mail failed:', err);
      await finishFulfilment(reserved.jobId, 'failed', (err as Error).message).catch(console.error);
      await notifyTelegram(`Отчёт за ${report.tier} оплачен (${report.paymentId}), но письмо ${buyer} не ушло: ${(err as Error).message}. Отправить ссылку вручную.`);
      return json({ ok: false, handled: false, reason: 'welcome mail failed; retry this webhook' }, 503);
    }
  }

  // The course itself lives in Whop Courses, so Whop performs the delivery. We still record the
  // entitlement here: otherwise the central dashboard misses the sale and the sequence can keep
  // offering products without knowing this buyer exists.
  const data = event?.data ?? {};
  const courseIds = env('WHOP_COURSE_IDS').split(',').map((value) => value.trim()).filter(Boolean);
  const candidateIds = [data.product_id, data.plan_id, data.access_pass_id, data.product?.id, data.plan?.id, data.access_pass?.id]
    .filter((value): value is string => typeof value === 'string');
  const productName = String(data.product_name ?? data.product?.title ?? data.product?.name ?? data.plan?.name ?? data.access_pass?.title ?? '');
  const coursePaid = courseIds.some((id) => candidateIds.includes(id)) || /invisible\s+to\s+chatgpt/i.test(productName);
  const paidType = String(event?.type ?? event?.event ?? event?.action ?? '');
  if (coursePaid && ['payment.succeeded', 'membership.activated', 'membership.went_valid', 'membership_went_valid'].includes(paidType)) {
    const parsed = readWhopPayment(event, Object.fromEntries(courseIds.map((id) => [id, 'owner' as const])));
    const email = parsed.email ?? (parsed.userId ? await getBuyerEmail(parsed.userId) : null);
    if (!email) {
      await notifyTelegram(`Course paid on Whop (${parsed.paymentId}) but no buyer email was found.`);
      return json({ ok: false, handled: false, reason: 'buyer email not found; retry required' }, 503);
    }
    try {
      const reserved = await reserveFulfilment({
        provider: 'whop', eventId, eventType: paidType,
        orderKey: oneTimeOrderKey('course', email, event), providerRef: parsed.paymentId,
        email, product: 'course', kind: 'whop-course-access', metadata: { deliveredBy: 'whop' },
        ...whopMoney(event),
      });
      if (reserved.process) {
        const token = makeReportToken({ orderId: reserved.orderId, purpose: 'prospect', email, tier: '9', lang: 'en', exp: Math.floor(Date.now()/1000)+TOKEN_DAYS*86400 }, downloadSecret);
        const link = `${SITE.url}/prospects/?t=${encodeURIComponent(token)}`;
        const text = `Thank you for buying the OperStack course. Open your course in Whop. Your included site prospecting tool: ${link}. Paste up to 20 sites to receive the comparison by email. Need help? Reply to info@oper-stack.com.`;
        await sendCommerceMail({ logicalKey: reserved.jobId, jobId: reserved.jobId, kind: 'course-bonus', payload: { from: 'OperStack <info@oper-stack.com>', to: [email], reply_to: 'info@oper-stack.com', subject: 'Your OperStack course and site prospecting tool', text, html: `<p>${text}</p>` } });
        await finishFulfilment(reserved.jobId, 'accepted');
      }
      return json({ ok: true, handled: reserved.process, product: 'course', deliveredBy: 'whop' });
    } catch (error) {
      console.error('course ledger failed:', error);
      return json({ ok: false, error: 'ledger unavailable; retry this webhook' }, 503);
    }
  }

  // Агентский план: подписка, а не покупка. Ключ живёт месяц, и новый уходит при каждом
  // успешном платеже, поэтому продление здесь это обычное событие, а не отдельная ветка логики.
  const agencyIds = env('WHOP_AGENCY_IDS').split(',').map((s) => s.trim()).filter(Boolean);
  const agencyPaid = agencyIds.length
    ? readWhopPayment(event, Object.fromEntries(agencyIds.map((id) => [id, 'agency' as const])))
    : { plan: null as null | 'agency', type: '', email: null as string | null, userId: null as string | null, paymentId: '' };
  if (agencyPaid.plan && ['payment.succeeded', 'membership.activated', 'membership.went_valid', 'membership_went_valid'].includes(agencyPaid.type)) {
    const buyer = agencyPaid.email ?? (agencyPaid.userId ? await getBuyerEmail(agencyPaid.userId) : null);
    if (!buyer) {
      await notifyTelegram(`Агентский план оплачен (${agencyPaid.paymentId}), но почты покупателя нет ни в событии, ни в API: выдать ключ вручную.`);
      return json({ ok: false, handled: false, reason: 'buyer email not found; retry required' }, 503);
    }
    let reserved;
    try {
      reserved = await reserveFulfilment({
        provider: 'whop', eventId, eventType: agencyPaid.type,
        orderKey: oneTimeOrderKey('agency', buyer, event), providerRef: agencyPaid.paymentId,
        email: buyer, product: 'agency', kind: 'agency-key',
        entitlementEndsAt: new Date((Date.parse(event?.data?.paid_at || event?.data?.created_at || '') || Date.now()) + 35 * 24 * 3600_000),
        ...whopMoney(event),
      });
    } catch (error) {
      console.error('agency ledger reservation failed:', error);
      return json({ ok: false, error: 'ledger unavailable; retry this webhook' }, 503);
    }
    if (!reserved.process) return json({ ok: true, handled: false, reason: 'already delivered or being delivered' });
    // 35 дней, а не 30: платёж может задержаться на сутки, и оформление не должно отваливаться
    // у того, кто заплатил вовремя.
    const { key, expires } = issueLicenceKey({ email: buyer, plan: 'agency', days: 35 }, privatePem);
    try {
      const mail = buildAgencyEmail({
        email: buyer, key, expires,
        supportEmail: 'support@oper-stack.com', siteUrl: SITE.url,
      });
      const sent = await sendCommerceMail({ logicalKey: reserved.jobId, jobId: reserved.jobId, kind: 'purchase-delivery', payload: { from: 'OperStack <info@oper-stack.com>', to: [buyer], reply_to: 'info@oper-stack.com', ...mail } });
      await recordMessage({ jobId: reserved.jobId, logicalKey: reserved.jobId, email: buyer, kind: 'agency-key', subject: mail.subject, provider: sent.provider, providerMessageId: sent.messageId, status: 'accepted' });
      await finishFulfilment(reserved.jobId, 'accepted');
      await notifyTelegram(`🔑 Агентский план: ключ отправлен на ${buyer}, действует до ${expires}, платёж ${agencyPaid.paymentId}.`);
      return json({ ok: true, handled: true, product: 'agency' });
    } catch (err) {
      console.error('agency mail failed:', err);
      await finishFulfilment(reserved.jobId, 'failed', (err as Error).message).catch(console.error);
      await notifyTelegram(`Агентский план оплачен (${agencyPaid.paymentId}), но письмо ${buyer} не ушло: ${(err as Error).message}. Отправить ключ вручную.`);
      return json({ ok: false, handled: false, reason: 'agency mail failed; retry this webhook' }, 503);
    }
  }

  // «Боль в страницы»: тот же ключ и то же письмо, но свой архив и свои шаги запуска.
  const painIds = env('WHOP_PAIN_IDS', 'prod_TSQ7HucCUfmMi').split(',').map((s) => s.trim()).filter(Boolean);
  const painPaid = readWhopPayment(event, Object.fromEntries(painIds.map((id) => [id, 'owner' as const])));
  if (painPaid.plan && ['payment.succeeded', 'membership.activated', 'membership.went_valid', 'membership_went_valid'].includes(painPaid.type)) {
    const buyer = painPaid.email ?? (painPaid.userId ? await getBuyerEmail(painPaid.userId) : null);
    if (!buyer) {
      await notifyTelegram(`«Боль в страницы» оплачена (${painPaid.paymentId}), но почты покупателя нет ни в событии, ни в API: выдать ключ вручную.`);
      return json({ ok: false, handled: false, reason: 'buyer email not found; retry required' }, 503);
    }
    let reserved;
    try {
      reserved = await reserveFulfilment({
        provider: 'whop', eventId, eventType: painPaid.type,
        orderKey: oneTimeOrderKey('pain-to-seo', buyer, event), providerRef: painPaid.paymentId,
        email: buyer, product: 'pain-to-seo', kind: 'licence',
        ...whopMoney(event),
      });
    } catch (error) {
      console.error('pain-to-seo ledger reservation failed:', error);
      return json({ ok: false, error: 'ledger unavailable; retry this webhook' }, 503);
    }
    if (!reserved.process) return json({ ok: true, handled: false, reason: 'already delivered or being delivered' });
    const { key, expires } = issueLicenceKey({ email: buyer, plan: 'owner' }, privatePem);
    const link = `${SITE.url}/api/kit-download/?t=${makeDownloadToken({ email: buyer.toLowerCase(), product: 'pain-to-seo', exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }, downloadSecret)}`;
    try {
      const mail = buildLicenceEmail({
        email: buyer, key, plan: 'owner', expires, downloadUrl: link, product: 'pain-to-seo',
        supportEmail: 'support@oper-stack.com', siteUrl: SITE.url, lang: env('WHOP_REPORT_LANG', 'en') === 'ru' ? 'ru' : 'en',
      });
      const sent = await sendCommerceMail({ logicalKey: reserved.jobId, jobId: reserved.jobId, kind: 'purchase-delivery', payload: { from: 'OperStack <info@oper-stack.com>', to: [buyer], reply_to: 'info@oper-stack.com', ...mail } });
      await recordMessage({ jobId: reserved.jobId, logicalKey: reserved.jobId, email: buyer, kind: 'licence', subject: mail.subject, provider: sent.provider, providerMessageId: sent.messageId, status: 'accepted' });
      await finishFulfilment(reserved.jobId, 'accepted');
      await notifyTelegram(`🔑 «Боль в страницы»: ключ отправлен на ${buyer}, обновления до ${expires}, платёж ${painPaid.paymentId}.`);
      return json({ ok: true, handled: true, product: 'pain-to-seo' });
    } catch (err) {
      console.error('pain-to-seo mail failed:', err);
      await finishFulfilment(reserved.jobId, 'failed', (err as Error).message).catch(console.error);
      await notifyTelegram(`«Боль в страницы» оплачена (${painPaid.paymentId}), но письмо ${buyer} не ушло: ${(err as Error).message}. Отправить ключ вручную.`);
      return json({ ok: false, handled: false, reason: 'licence mail failed; retry this webhook' }, 503);
    }
  }

  /*
   * Ветка аудита убрана 18.09.2026. Раньше она просила покупателя ответить письмом с адресом
   * сайта, а дальше отчёт собирался руками на маке владельца: выключенный компьютер означал,
   * что человек за 149 долларов не получит ничего. Теперь аудит это обычная ступень отчёта и
   * обслуживается веткой выше: письмо со ссылкой на форму, дальше очередь.
   */
  const siteKit = readWhopPayment(event, parsePriceMap(env('WHOP_SITE_KIT_IDS')));
  if (!['payment.succeeded', 'membership.activated', 'membership.went_valid', 'membership_went_valid'].includes(siteKit.type)) {
    return json({ ok: true, handled: false, reason: `ignored event ${siteKit.type || 'unknown'}` });
  }
  if (!siteKit.plan) return json({ ok: true, handled: false, reason: 'no known product in this payment' });
  const buyer = siteKit.email ?? (siteKit.userId ? await getBuyerEmail(siteKit.userId) : null);
  if (!buyer) {
    await notifyTelegram(`Site Kit paid on Whop (${siteKit.paymentId}) but no buyer email was found: issue the key by hand.`);
    return json({ ok: false, handled: false, reason: 'buyer email not found; retry required' }, 503);
  }
  const product: CommerceProduct = siteKit.plan === 'agency' ? 'site-kit-agency' : 'site-kit-owner';
  let reserved;
  try {
    reserved = await reserveFulfilment({
      provider: 'whop', eventId, eventType: siteKit.type,
      orderKey: oneTimeOrderKey(product, buyer, event), providerRef: siteKit.paymentId,
      email: buyer, product, kind: 'licence',
      ...whopMoney(event),
    });
  } catch (error) {
    console.error('site-kit ledger reservation failed:', error);
    return json({ ok: false, error: 'ledger unavailable; retry this webhook' }, 503);
  }
  if (!reserved.process) return json({ ok: true, handled: false, reason: 'already delivered or being delivered' });
  const { key, expires } = issueLicenceKey({ email: buyer, plan: siteKit.plan }, privatePem);
  const downloadUrl = `${SITE.url}/api/kit-download/?t=${makeDownloadToken({ email: buyer.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }, downloadSecret)}`;
  const mail = buildLicenceEmail({ email: buyer, key, plan: siteKit.plan, expires, downloadUrl, supportEmail: 'support@oper-stack.com', siteUrl: SITE.url });
  try {
    const sent = await sendCommerceMail({ logicalKey: reserved.jobId, jobId: reserved.jobId, kind: 'purchase-delivery', payload: { from: 'OperStack <info@oper-stack.com>', to: [buyer], reply_to: 'info@oper-stack.com', ...mail } });
    await recordMessage({ jobId: reserved.jobId, logicalKey: reserved.jobId, email: buyer, kind: 'licence', subject: mail.subject, provider: sent.provider, providerMessageId: sent.messageId, status: 'accepted' });
    await finishFulfilment(reserved.jobId, 'accepted');
    await notifyTelegram(`Site Kit licence issued: ${buyer}, ${siteKit.plan}, payment ${siteKit.paymentId}.`);
    return json({ ok: true, handled: true, product: 'site-kit', plan: siteKit.plan });
  } catch (err) {
    console.error('site-kit fulfilment failed:', err);
    await finishFulfilment(reserved.jobId, 'failed', (err as Error).message).catch(console.error);
    await notifyTelegram(`Site Kit fulfilment failed for Whop payment ${siteKit.paymentId}: ${(err as Error).message}.`);
    return json({ ok: false, handled: false, reason: 'licence mail failed; retry this webhook' }, 503);
  }
};

export const GET: APIRoute = () => json({ ok: true, endpoint: 'whop-webhook', accepts: ['payment.succeeded', 'membership.went_valid'] });
