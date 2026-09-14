/**
 * The other half of the owner's picture.
 *
 * The counter says how many people an assistant sent. The check says whether an assistant can
 * quote the site at all. One without the other is half an answer: a site nobody can quote will
 * never have visits to count, and a site with visits and no idea why cannot repeat what worked.
 *
 * So the score is recorded rather than recomputed and forgotten, and both numbers appear together
 * with how they moved.
 */
import { checkVisibility } from '@operstack/audit';
import { visitsDb } from './visits-db';

export type ScorePoint = { day: string; score: number; areas: Array<{ label: string; score: number; max: number }> };

/** Today's stored score, if we already took one today. */
export async function todaysScore(siteId: string): Promise<ScorePoint | null> {
  const sql = visitsDb();
  const rows = await sql`
    select day::text as day, score, areas from scores
    where site_id = ${siteId} and day = current_date limit 1`;
  return rows.length ? ({ day: rows[0].day, score: rows[0].score, areas: rows[0].areas || [] } as ScorePoint) : null;
}

/** The last two points, newest first, so a page can show the number and how it moved. */
export async function recentScores(siteId: string, limit = 2): Promise<ScorePoint[]> {
  const sql = visitsDb();
  const rows = await sql`
    select day::text as day, score, areas from scores
    where site_id = ${siteId} order by day desc limit ${limit}`;
  return rows.map((r: any) => ({ day: r.day, score: r.score, areas: r.areas || [] }));
}

/**
 * Measures the site and stores the result under today's date. Re-running on the same day
 * overwrites rather than adding a second point, so a page refresh cannot invent a trend.
 */
export async function recordScore(siteId: string, domain: string): Promise<ScorePoint | null> {
  const result: any = await checkVisibility(domain, { budgetMs: 11000 });
  if (!result || result.ok === false) return null;
  const areas = (result.areas || []).map((a: any) => ({ label: a.label, score: a.score, max: a.max }));
  const sql = visitsDb();
  await sql`
    insert into scores (site_id, day, score, areas)
    values (${siteId}, current_date, ${result.score}, ${JSON.stringify(areas)}::jsonb)
    on conflict (site_id, day) do update set score = excluded.score, areas = excluded.areas`;
  return { day: new Date().toISOString().slice(0, 10), score: result.score, areas };
}

/** Takes today's measurement only if we have not already taken one. */
export async function scoreForToday(siteId: string, domain: string): Promise<ScorePoint | null> {
  return (await todaysScore(siteId)) ?? (await recordScore(siteId, domain));
}
