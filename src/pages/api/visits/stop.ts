/**
 * Turns the weekly note off for one site.
 *
 * Deliberately a POST behind a button rather than a link that acts on sight. Mail scanners and
 * link previewers open every link in an email, and an unsubscribe that fires on being looked at
 * quietly cancels people who never asked to be cancelled.
 */
import type { APIRoute } from 'astro';
import { visitsDb, visitsDbConfigured } from '../../../lib/visits-db';

/** REQUIRED: without this POST returns 405 on Vercel static output */
export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!visitsDbConfigured()) return json({ error: 'The counter is not switched on yet.' }, 503);

  let token = '';
  let resume = false;
  try {
    const body = await request.json();
    token = String(body?.t || '').trim();
    resume = body?.resume === true;
  } catch {
    return json({ error: 'That link is not one of ours.' }, 400);
  }
  if (!/^[a-z0-9]{20,64}$/.test(token)) return json({ error: 'That link is not one of ours.' }, 400);

  const sql = visitsDb();
  const rows = await sql`
    update sites set weekly = ${resume} where view_token = ${token} returning domain, weekly`;
  if (!rows.length) return json({ error: 'That link does not open anything.' }, 404);

  return json({ domain: rows[0].domain, weekly: rows[0].weekly });
};
