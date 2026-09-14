/**
 * AI visibility check endpoint. GET /api/ai-visibility/?url=example.com or POST { url }.
 * Public signals only, hard time budget, small in-memory cache and rate limit per instance.
 */
import type { APIRoute } from 'astro';
import { checkVisibility, normaliseInput } from '../../lib/ai-visibility.mjs';
import { logCheck, originOf } from '../../lib/sheets-log';

export const prerender = false;

const cache = new Map<string, { at: number; body: string }>();
const hits = new Map<string, { at: number; n: number }>();
const CACHE_MS = 10 * 60 * 1000;
const LIMIT = 12; // checks per IP per 10 minutes, per instance

/**
 * Ограничение считается по адресу посетителя. Если адрес определить не удалось, не ограничиваем
 * вовсе: 13 сентября 2026 заголовок x-forwarded-for до обработчика не доходил, все запросы падали
 * в одно ведро с ключом "unknown", и двенадцать проверок в десять минут закрывали инструмент
 * для всех сразу. Пустить лишний прогон дешевле, чем погасить бесплатную проверку всему свету.
 */
function limited(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > CACHE_MS) { hits.set(ip, { at: now, n: 1 }); return false; }
  h.n += 1;
  return h.n > LIMIT;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

/**
 * Каждый прогон уходит строкой в таблицу: какой сайт проверяли, какой балл, с какой площадки
 * человек пришёл. Почты здесь нет и быть не может, её на этом шаге ещё не спрашивали.
 * Ждём таблицу вместе с ответом, но не дольше трёх секунд, и любую её ошибку проглатываем.
 */
async function record(result: any, request: Request, from: { source?: string; campaign?: string }): Promise<void> {
  if (!result?.ok) return;
  const { source, campaign, page } = originOf(from, request.headers.get('referer'));
  await logCheck({ lang: 'en', host: result.host, score: result.score, grade: result.grade, source, campaign, page });
}

async function handle(rawUrl: string, ip: string, request: Request, from: { source?: string; campaign?: string }): Promise<Response> {
  const url = normaliseInput(rawUrl);
  if (!url) return json({ ok: false, error: 'Enter a public site address, for example example.com' }, 400);
  if (limited(ip)) return json({ ok: false, error: 'Too many checks from this connection. Try again in ten minutes.' }, 429);
  const key = new URL(url).host.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return new Response(hit.body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Cache': 'hit' } });
  const result = await checkVisibility(url, { budgetMs: 8500 });
  const body = JSON.stringify(result);
  if (result.ok) cache.set(key, { at: Date.now(), body });
  await record(result, request, from);
  return json(result, result.ok ? 200 : 422);
}

/** Адрес берём тем же способом, что и соседний обработчик задач: сначала clientAddress. */
const ipOf = (request: Request, clientAddress?: string) =>
  (clientAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();

export const GET: APIRoute = async ({ request, url, clientAddress }) =>
  handle(url.searchParams.get('url') || '', ipOf(request, clientAddress), request, {
    source: url.searchParams.get('from') || undefined,
    campaign: url.searchParams.get('campaign') || undefined,
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: { url?: string; from?: string; campaign?: string } = {};
  try { body = await request.json(); } catch { /* fall through with an empty url */ }
  return handle(String(body.url || ''), ipOf(request, clientAddress), request, { source: body.from, campaign: body.campaign });
};
