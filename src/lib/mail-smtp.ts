/**
 * Transactional mail from OperStack.
 *
 * Простым языком: письмо постороннему человеку уходит через Resend, служебное самим себе через
 * почтовый ящик Google. 16.09.2026 Яндекс отбил наше письмо живому человеку кодом
 * «554 подозрение на спам», а Mail.ru клал в спам. С письмом всё было в порядке: подпись домена
 * проходит, независимая проверка дала 10 из 10, чёрных списков нет. Дело было в канале: ящик
 * Google Workspace сделан для переписки, а не для рассылки, и почтовые службы это видят. То же
 * письмо через Resend легло во «Входящие» и у Яндекса, и у Mail.ru.
 *
 * Если Resend не принял письмо, оно тут же уходит через Google: молчание хуже, чем письмо из
 * менее удачного канала, человек ждёт то, что заказал.
 *
 * Env: SMTP_USER (info@oper-stack.com), SMTP_PASS (an app password), RESEND_API_KEY,
 * LICENCE_FROM (display name and address), LICENCE_NOTIFY_EMAIL (copy of every letter).
 */
import nodemailer from 'nodemailer';
import { canReceiveMail } from './deliverable';

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

/** Наши собственные адреса: письма на них это служебная переписка, а не доставка покупателю. */
const OURS = /@(oper-stack\.(com|ru)|moregroup\.estate)$/i;

const goesOutside = (to: string, cc?: string): boolean =>
  [to, cc].flatMap((v) => String(v || '').split(',')).map((s) => s.trim()).filter(Boolean)
    .some((a) => !OURS.test(a));

/**
 * Ключ читается статически, а не по строке-ключу. Так его подставляет сборщик, и это тот же
 * способ, которым пользуется давно работающая отправка оповещений о лидах. Динамическое чтение
 * вида env('RESEND_API_KEY') на сборке не подставляется и в рабочей функции оказалось пустым:
 * 16.09.2026 из-за этого письма молча уходили старым каналом.
 */
const RESEND_API_KEY = (
  import.meta.env.RESEND_API_KEY ||
  process.env.RESEND_API_KEY ||
  ''
).trim();

/**
 * Отправка обычным веб-запросом, а не по почтовому протоколу. Причина та же: оповещения о лидах
 * уходят так с самого начала и доходят, а почтовый протокол из функции повёл себя иначе. Берём
 * проверенный способ, а не тот, который кажется правильнее.
 */
async function sendViaResend(letter: {
  from: string; to: string; cc?: string; replyTo: string; subject: string; text: string; html: string;
}): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: letter.from,
      to: [letter.to],
      ...(letter.cc ? { cc: [letter.cc] } : {}),
      reply_to: letter.replyTo,
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const timeouts = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 };

export async function sendTransactionalMail(msg: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!user || !pass) throw new Error('SMTP_USER or SMTP_PASS is not set');
  // A bounce hurts the domain's reputation and pushes the next letters into spam, so a plainly
  // dead address is never written to. Details and boundaries live in deliverable.ts.
  const reachable = await canReceiveMail(msg.to);
  if (!reachable.ok) throw new Error(`not sent: ${reachable.why}`);

  const ccRaw = env('LICENCE_NOTIFY_EMAIL', 'accounts@oper-stack.com');
  const cc = ccRaw && ccRaw !== msg.to ? ccRaw : undefined;
  const letter = {
    from: env('LICENCE_FROM', `OperStack <${user}>`),
    to: msg.to,
    cc,
    replyTo: 'info@oper-stack.com',
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  };

  // No pool, explicit timeouts, and close() after the send: an open SMTP socket keeps a serverless
  // function alive until the platform kills it, which is what a 504 after a delivered email looks like.
  if (RESEND_API_KEY && goesOutside(msg.to, cc)) {
    try {
      await sendViaResend(letter);
      return;
    } catch (e) {
      // Домен не подтверждён, лимит выбран, служба недоступна: причина неважна, человек ждёт письмо.
      console.error('resend refused, falling back to google:', (e as Error).message);
    }
  }

  const google = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass }, pool: false, ...timeouts,
  });
  try {
    await google.sendMail(letter);
  } finally {
    google.close();
  }
}
