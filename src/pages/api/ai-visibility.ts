/**
 * AI visibility check endpoint. GET /api/ai-visibility/?url=example.com or POST { url }.
 * Public signals only, hard time budget, small in-memory cache and rate limit per instance.
 */
import type { APIRoute } from 'astro';
import { checkVisibility, normaliseInput } from '../../lib/ai-visibility.mjs';

export const prerender = false;

const cache = new Map<string, { at: number; body: string }>();
const hits = new Map<string, { at: number; n: number }>();
const CACHE_MS = 10 * 60 * 1000;
const LIMIT = 12; // checks per IP per 10 minutes, per instance

function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > CACHE_MS) { hits.set(ip, { at: now, n: 1 }); return false; }
  h.n += 1;
  return h.n > LIMIT;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

async function handle(rawUrl: string, ip: string): Promise<Response> {
  const url = normaliseInput(rawUrl);
  if (!url) return json({ ok: false, error: 'Enter a public site address, for example example.com' }, 400);
  if (limited(ip)) return json({ ok: false, error: 'Too many checks from this connection. Try again in ten minutes.' }, 429);
  const key = new URL(url).host.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return new Response(hit.body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Cache': 'hit' } });
  const result = await checkVisibility(url, { budgetMs: 8500 });
  const body = JSON.stringify(result);
  if (result.ok) cache.set(key, { at: Date.now(), body });
  return json(result, result.ok ? 200 : 422);
}

const ipOf = (request: Request) => (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();

export const GET: APIRoute = async ({ request, url }) => handle(url.searchParams.get('url') || '', ipOf(request));

export const POST: APIRoute = async ({ request }) => {
  let body: { url?: string } = {};
  try { body = await request.json(); } catch { /* fall through with an empty url */ }
  return handle(String(body.url || ''), ipOf(request));
};
