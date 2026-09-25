/**
 * Подписанные ссылки из писем OperStack Watch: страница правки недели и настройки писем.
 *
 * Правка едет прямо в ссылке, подписанной тем же секретом, что и остальные ссылки из писем
 * (KIT_DOWNLOAD_SECRET): хранить её отдельно не нужно, а подделать или поменять текст снаружи
 * нельзя. Та же схема в очереди на сервере (chatgpt-watch.mjs, fixLink).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export type WatchFix = { h: string; q: string; a: string; x: string | null; p: string; w: number; n?: string[] };

export function readSigned<T>(token: string, secret: string): T | null {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac || !secret) return null;
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('base64url'));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T; } catch { return null; }
}

export function makeSigned(value: unknown, secret: string): string {
  const body = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}
