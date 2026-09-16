/**
 * Временная диагностика канала отправки. Удалить сразу после разбора.
 *
 * Отвечает только тому, кто знает общий секрет. Про сам ключ Resend не сообщает ничего: ни длины,
 * ни куска, только «есть или нет». Наружу уходит лишь то, что ответила служба Resend на пробную
 * отправку на наш собственный адрес.
 *
 * Зачем: 16.09.2026 письма с сайтов упорно уходили запасным каналом через Google, хотя тот же
 * запрос с тем же ключом из командной строки проходит. Гадать дальше бессмысленно, нужен ответ
 * от самой функции.
 */
import type { APIRoute } from 'astro';
import { sendTransactionalMail, lastResendError } from '../../lib/mail-smtp';
export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

/** Читаем двумя способами сразу: статически, как рабочая отправка, и по строке, как было у меня. */
const STATIC_KEY = (import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || '').trim();

export const GET: APIRoute = async ({ url }) => {
  const secret = env('KIT_DOWNLOAD_SECRET');
  if (!secret || url.searchParams.get('t') !== secret) {
    return new Response('not found', { status: 404 });
  }

  const dynamicKey = env('RESEND_API_KEY');
  const out: Record<string, unknown> = {
    ключСтатически: STATIC_KEY ? 'есть' : 'ПУСТО',
    ключПоСтроке: dynamicKey ? 'есть' : 'ПУСТО',
    ключиСовпадают: STATIC_KEY === dynamicKey,
    отправитель: env('LICENCE_FROM', '(не задано)'),
    node: process.version,
  };

  const key = STATIC_KEY || dynamicKey;
  if (!key) {
    out.resend = 'не пробовали: ключа нет';
    return new Response(JSON.stringify(out, null, 2), {
      status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env('LICENCE_FROM', 'OperStack <info@oper-stack.com>'),
        to: ['info+diag@oper-stack.com'],
        subject: 'диагностика канала',
        text: 'диагностика',
      }),
    });
    out.resend = { код: res.status, ответ: (await res.text()).slice(0, 300) };
  } catch (e) {
    out.resend = { упало: String((e as Error).message).slice(0, 300), тип: (e as Error).name };
  }

  // А теперь то же самое, но настоящим отправщиком: он и есть подозреваемый.
  const target = url.searchParams.get('to') || '';
  if (target) {
    try {
      await sendTransactionalMail({ to: target, subject: 'диагностика отправщика', text: 'диагностика', html: '<p>диагностика</p>' });
      const { lastResendError: err } = await import('../../lib/mail-smtp');
      out.черезОтправщик = err ? { каналGoogle: true, причинаОтказаResend: err } : { каналResend: true };
    } catch (e) {
      out.черезОтправщик = { упало: String((e as Error).message).slice(0, 300) };
    }
  }

  return new Response(JSON.stringify(out, null, 2), {
    status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
