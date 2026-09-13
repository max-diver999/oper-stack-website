/**
 * One visit from an AI assistant, reported by the snippet running on the owner's site.
 *
 * The snippet sends JSON, not the plain text that would avoid a preflight. Astro's own protection
 * against forged requests refuses a cross-site POST carrying a form-like content type, and text
 * counts as one, so a plain-text beacon is rejected with 403 before this file ever runs. JSON costs
 * one preflight, which the browser then caches for a day.
 *
 * Nothing about the visitor is stored. The row that grows is site, assistant, day, count.
 */
import type { APIRoute } from 'astro';
import { assistantName } from '../../../lib/assistant-hosts';
import { visitsDb, visitsDbConfigured, originMatchesDomain } from '../../../lib/visits-db';

/** REQUIRED: without this POST returns 405 on Vercel static output */
export const prerender = false;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/** The beacon never reads the answer, so every reply is the same short one. */
function done(status = 204): Response {
  return new Response(null, { status, headers: CORS });
}

export const OPTIONS: APIRoute = async () => done(204);

export const POST: APIRoute = async ({ request }) => {
  if (!visitsDbConfigured()) return done(204);

  let key = '';
  let from = '';
  try {
    const body = JSON.parse(await request.text());
    key = String(body?.key || '').trim();
    from = String(body?.from || '').trim();
  } catch {
    return done(204);
  }
  if (!/^osv_[a-z0-9]{8,64}$/.test(key)) return done(204);

  const assistant = assistantName(from);
  if (!assistant) return done(204); // not an assistant: silently ignored, never counted

  try {
    const sql = visitsDb();
    const rows = await sql`select id, domain from sites where id = ${key} limit 1`;
    if (!rows.length) return done(204);

    // A key is public, so anyone could post it from anywhere. A visit only counts when the browser
    // says it happened on the site the key belongs to.
    const origin = request.headers.get('origin');
    if (!originMatchesDomain(origin, rows[0].domain)) return done(204);

    await sql`
      insert into visits (site_id, assistant, day, hits)
      values (${key}, ${assistant}, current_date, 1)
      on conflict (site_id, assistant, day) do update set hits = visits.hits + 1`;
    await sql`update sites set last_seen_at = now() where id = ${key}`;
  } catch {
    // A counter must never break the page it sits on, so a failure here stays quiet.
    return done(204);
  }

  return done(204);
};
