/**
 * The numbers behind one private link: who sent this site visitors, and when.
 *
 * The view token is the only credential. It is long, it never appears in page source, and it is
 * checked against one row. Nothing else identifies the caller, and nothing about visitors exists
 * to return in the first place.
 */
import type { APIRoute } from 'astro';
import { visitsDb, visitsDbConfigured } from '../../../lib/visits-db';
import { recentScores, scoreForToday } from '../../../lib/visits-score';

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
  const site = await sql`
    select id, domain, created_at, last_seen_at from sites where view_token = ${token} limit 1`;
  if (!site.length) return json({ error: 'That link does not open anything.' }, 404);

  const id = site[0].id;
  const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 90, 1), 365);

  const byAssistant = await sql`
    select assistant, sum(hits)::int as hits
    from visits
    where site_id = ${id} and day >= current_date - ${days}::int
    group by assistant
    order by hits desc, assistant asc`;

  const byDay = await sql`
    select day::text as day, sum(hits)::int as hits
    from visits
    where site_id = ${id} and day >= current_date - ${days}::int
    group by day
    order by day asc`;

  const total = byAssistant.reduce((sum, row) => sum + row.hits, 0);

  // The other half of the picture. Measuring costs about ten seconds, so it happens once a day and
  // a refresh reads the stored point rather than paying for it again.
  let score = null;
  let scoreBefore = null;
  try {
    const points = await recentScores(id, 2);
    const today = points.find((p) => p.day === new Date().toISOString().slice(0, 10));
    score = today ?? (await scoreForToday(id, site[0].domain)) ?? points[0] ?? null;
    scoreBefore = points.find((p) => p.day !== score?.day) ?? null;
  } catch {
    // A failed measurement must not take the visit numbers down with it.
  }

  return json({
    domain: site[0].domain,
    installedAt: site[0].created_at,
    lastVisitAt: site[0].last_seen_at,
    days,
    total,
    byAssistant,
    byDay,
    score,
    scoreBefore,
  });
};
