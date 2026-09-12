/**
 * Whop webhook: on a successful payment for the Site Kit, issue a licence key and email it with a
 * signed download link. Signature-checked; every other event is acknowledged and ignored.
 * Configure the destination in Whop as https://oper-stack.com/api/whop-webhook/.
 *
 * This replaces the Paddle route: Paddle refused the domain because as merchant of record they do
 * not carry services, so the shop moved to Whop. The licence format, the email and the download
 * link are unchanged, only the event that triggers them.
 *
 * Env: WHOP_WEBHOOK_SECRET (ws_...), WHOP_API_KEY, WHOP_SITE_KIT_IDS (prod_x:owner,plan_y:agency),
 * OPERSTACK_LICENCE_PRIVATE_KEY_B64, KIT_DOWNLOAD_SECRET, plus the SMTP and Telegram variables.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { buildLicenceEmail, handleWhopPayment, issueLicenceKey, makeDownloadToken, parsePriceMap, readWhopPayment, verifyWhopSignature } from '../../lib/licence-fulfilment';
import { buildReportWelcomeEmail, makeReportToken, readWhopReport, reportTierMap, TOKEN_DAYS } from '../../lib/report-fulfilment';
import { sendTransactionalMail } from '../../lib/mail-smtp';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

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

/** Почта покупателя по его id, если событие её не принесло. Пробуем обе версии API Whop. */
async function getBuyerEmail(userId: string): Promise<string | null> {
  const key = env('WHOP_API_KEY');
  if (!key) return null;
  const urls = [
    `https://api.whop.com/api/v5/app/users/${encodeURIComponent(userId)}`,
    `https://api.whop.com/api/v2/users/${encodeURIComponent(userId)}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8_000) });
      if (!res.ok) continue;
      const body = (await res.json()) as { email?: string; data?: { email?: string } };
      const email = body.email ?? body.data?.email;
      if (email) return String(email);
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

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'body is not JSON' }, 400);
  }

  const privatePem = Buffer.from(env('OPERSTACK_LICENCE_PRIVATE_KEY_B64'), 'base64').toString('utf8');
  const downloadSecret = env('KIT_DOWNLOAD_SECRET');
  if (!privatePem.includes('PRIVATE KEY') || !downloadSecret) {
    await notifyTelegram(`Whop payment ${event?.data?.id ?? ''} arrived but the licence signing key or download secret is missing on the server: issue the key by hand.`);
    return json({ ok: true, handled: false, reason: 'fulfilment not configured' });
  }

  // Отчёт за 9 и за 29: другой товар, другая выдача. Письмо со ссылкой на форму, где покупатель
  // называет свой сайт. Проверяем это раньше кита: у кита свои идентификаторы, они не пересекаются.
  const report = readWhopReport(event, reportTierMap(env('WHOP_REPORT_IDS')));
  if (report.tier && ['payment.succeeded', 'membership.went_valid', 'membership_went_valid'].includes(report.type)) {
    const buyer = report.email ?? (report.userId ? await getBuyerEmail(report.userId) : null);
    if (!buyer) {
      await notifyTelegram(`Отчёт за ${report.tier} оплачен на Whop (${report.paymentId}), но почты покупателя нет ни в событии, ни в API: выдать вручную.`);
      return json({ ok: true, handled: false, reason: 'buyer email not found' });
    }
    const lang = env('WHOP_REPORT_LANG', 'en') === 'ru' ? 'ru' : 'en';
    const token = makeReportToken({ email: buyer, tier: report.tier, lang, exp: Math.floor(Date.now() / 1000) + TOKEN_DAYS * 24 * 3600 }, downloadSecret);
    const link = `${SITE.url}/report/?t=${encodeURIComponent(token)}${lang === 'ru' ? '&lang=ru' : ''}`;
    try {
      await sendTransactionalMail({ to: buyer, ...buildReportWelcomeEmail({ tier: report.tier, lang, link }) });
      await notifyTelegram(`📄 Отчёт за ${report.tier}: ${buyer} получил ссылку на форму.`);
      return json({ ok: true, handled: true, product: 'report', tier: report.tier });
    } catch (err) {
      console.error('report welcome mail failed:', err);
      await notifyTelegram(`Отчёт за ${report.tier} оплачен (${report.paymentId}), но письмо ${buyer} не ушло: ${(err as Error).message}. Отправить ссылку вручную.`);
      return json({ ok: true, handled: false, reason: 'welcome mail failed' });
    }
  }

  // «Боль в страницы»: тот же ключ и то же письмо, но свой архив и свои шаги запуска.
  const painIds = env('WHOP_PAIN_IDS', 'prod_TSQ7HucCUfmMi').split(',').map((s) => s.trim()).filter(Boolean);
  const painPaid = readWhopPayment(event, Object.fromEntries(painIds.map((id) => [id, 'owner' as const])));
  if (painPaid.plan && ['payment.succeeded', 'membership.went_valid', 'membership_went_valid'].includes(painPaid.type)) {
    const buyer = painPaid.email ?? (painPaid.userId ? await getBuyerEmail(painPaid.userId) : null);
    if (!buyer) {
      await notifyTelegram(`«Боль в страницы» оплачена (${painPaid.paymentId}), но почты покупателя нет ни в событии, ни в API: выдать ключ вручную.`);
      return json({ ok: true, handled: false, reason: 'buyer email not found' });
    }
    const { key, expires } = issueLicenceKey({ email: buyer, plan: 'owner' }, privatePem);
    const link = `${SITE.url}/api/kit-download/?t=${makeDownloadToken({ email: buyer.toLowerCase(), product: 'pain-to-seo', exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }, downloadSecret)}`;
    try {
      await sendTransactionalMail({ to: buyer, ...buildLicenceEmail({
        email: buyer, key, plan: 'owner', expires, downloadUrl: link, product: 'pain-to-seo',
        supportEmail: 'info@oper-stack.com', siteUrl: SITE.url, lang: env('WHOP_REPORT_LANG', 'en') === 'ru' ? 'ru' : 'en',
      }) });
      await notifyTelegram(`🔑 «Боль в страницы»: ключ отправлен на ${buyer}, обновления до ${expires}, платёж ${painPaid.paymentId}.`);
      return json({ ok: true, handled: true, product: 'pain-to-seo' });
    } catch (err) {
      console.error('pain-to-seo mail failed:', err);
      await notifyTelegram(`«Боль в страницы» оплачена (${painPaid.paymentId}), но письмо ${buyer} не ушло: ${(err as Error).message}. Отправить ключ вручную.`);
      return json({ ok: true, handled: false, reason: 'licence mail failed' });
    }
  }

  try {
    const result = await handleWhopPayment(event, {
      idToPlan: parsePriceMap(env('WHOP_SITE_KIT_IDS')),
      getBuyerEmail,
      issue: (email, plan) => issueLicenceKey({ email, plan }, privatePem),
      downloadUrl: (email) => `${SITE.url}/api/kit-download/?t=${makeDownloadToken({ email: email.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }, downloadSecret)}`,
      sendMail: sendTransactionalMail,
      notify: notifyTelegram,
      supportEmail: 'info@oper-stack.com',
      siteUrl: SITE.url,
    });
    return json({ ok: true, ...result });
  } catch (err) {
    console.error('fulfilment failed:', err);
    await notifyTelegram(`Site Kit fulfilment failed for Whop payment ${event?.data?.id ?? ''}: ${(err as Error).message}. Issue the key by hand.`);
    return json({ ok: true, handled: false, reason: 'fulfilment error, owner notified' });
  }
};

export const GET: APIRoute = () => json({ ok: true, endpoint: 'whop-webhook', accepts: ['payment.succeeded', 'membership.went_valid'] });
