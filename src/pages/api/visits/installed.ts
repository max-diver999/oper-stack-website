/**
 * Answers one question for the owner: is the line actually on my site?
 *
 * Behind the same private token as the numbers, because it names the site and its key.
 */
import type { APIRoute } from 'astro';
import { visitsDb, visitsDbConfigured } from '../../../lib/visits-db';
import { snippetInstalled } from '../../../lib/visits-install';

/** REQUIRED: without this GET is served from the build instead of running */
export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const GET: APIRoute = async ({ url }) => {
  if (!visitsDbConfigured()) return json({ error: 'The counter is not switched on yet.' }, 503);

  const token = String(url.searchParams.get('t') || '').trim();
  if (!/^[a-z0-9]{20,64}$/.test(token)) return json({ error: 'That link is not one of ours.' }, 400);

  const sql = visitsDb();
  const rows = await sql`select id, domain from sites where view_token = ${token} limit 1`;
  if (!rows.length) return json({ error: 'That link does not open anything.' }, 404);

  const state = await snippetInstalled(rows[0].domain, rows[0].id);
  return json({ domain: rows[0].domain, ...state });
};
