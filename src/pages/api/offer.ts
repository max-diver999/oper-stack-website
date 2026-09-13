/**
 * Быстрое предложение: полный отчёт за 19 вместо 29 в течение суток.
 *
 * Простым языком. Человек оставил почту и получил бесплатный отчёт. В первом письме есть
 * ссылка: взять полный отчёт за 19 долларов, но только сутки. Ссылка ведёт сюда. Пока сутки
 * не вышли, мы отправляем его на оплату за 19, потом на обычные 29. Никаких промокодов,
 * которые надо копировать и вставлять: человек просто попадает на нужную цену.
 *
 * Почему срок настоящий. Если скидку получают все и всегда, цена 29 превращается в выдумку,
 * и люди учатся ждать. Ссылка подписана вместе со сроком и почтой, поэтому её нельзя продлить,
 * переслать другому или выписать себе заново: подпись не сойдётся.
 *
 * Что происходит, когда сутки вышли: не ошибка, а обычная цена. Человек всё равно попадает
 * на товар и может купить, просто дороже. Тупика здесь быть не должно.
 *
 * Env: KIT_DOWNLOAD_SECRET (та же подпись, что у остальных ссылок),
 *      WHOP_CHECKOUT_RIVALS_19 (скрытый тариф за 19), WHOP_CHECKOUT_RIVALS (обычный за 29).
 */
import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

/** Обычная цена. Сюда же уходит всякий, у кого ссылка просрочена, битая или подделана. */
const FULL_PRICE_URL = () =>
  env('WHOP_CHECKOUT_RIVALS', 'https://whop.com/oper-stack/you-and-three-rivals-watched-for-a-month');

/** Скрытый тариф за 19. Пока он не заведён, все идут на обычную цену, и это не поломка. */
const OFFER_URL = () => env('WHOP_CHECKOUT_RIVALS_19');

export type OfferClaims = { email: string; exp: number };

export function makeOfferToken(claims: OfferClaims, secret: string): string {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function readOfferToken(
  token: string,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): { live: boolean; reason: string; email?: string } {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return { live: false, reason: 'malformed' };
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('base64url'));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { live: false, reason: 'bad signature' };
  let claims: OfferClaims;
  try { claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return { live: false, reason: 'unreadable' }; }
  if (!claims?.email || !claims?.exp) return { live: false, reason: 'incomplete' };
  if (claims.exp < nowSec) return { live: false, reason: 'expired', email: claims.email };
  return { live: true, reason: 'ok', email: claims.email };
}

const redirect = (to: string) =>
  new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });

export const GET: APIRoute = async ({ url }) => {
  const secret = env('KIT_DOWNLOAD_SECRET');
  const offer = OFFER_URL();
  // Нет секрета или тариф ещё не заведён: отправляем на обычную цену, а не показываем ошибку.
  if (!secret || !offer) return redirect(FULL_PRICE_URL());
  const state = readOfferToken(url.searchParams.get('t') || '', secret);
  return redirect(state.live ? offer : FULL_PRICE_URL());
};
