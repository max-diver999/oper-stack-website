/**
 * Sends the weekly note, once a week, to the owners who asked for it.
 *
 * Vercel calls this on a schedule. It is not a public endpoint: a caller has to carry the secret
 * Vercel sends, or the same secret as a query string when run by hand.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../../data/site';
import { sendTransactionalMail } from '../../../lib/mail-smtp';
import { visitsDb, visitsDbConfigured } from '../../../lib/visits-db';
import { dueForReport, numbersFor, composeWeekly } from '../../../lib/visits-weekly';
import { recentScores, recordScore } from '../../../lib/visits-score';

/** REQUIRED: without this the route is served from the build instead of running */
export const prerender = false;

const SECRET = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function authorised(request: Request, url: URL): boolean {
  if (!SECRET) return false; // no secret configured means nobody may run it, including Vercel
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${SECRET}` || url.searchParams.get('key') === SECRET;
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!authorised(request, url)) return json({ error: 'Not for you.' }, 401);
  if (!visitsDbConfigured()) return json({ error: 'No database.' }, 503);

  // A dry run says who would be written to and what the email would say, and sends nothing.
  const dry = url.searchParams.get('dry') === '1';

  const sql = visitsDb();
  const due = await dueForReport();
  const sent: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  // Measuring costs about ten seconds a site, so the run takes a budget rather than a count:
  // whoever fits gets a fresh score, the rest keep last week's and get one next time.
  const measureUntil = Date.now() + 60_000;

  for (const row of due) {
    const numbers = await numbersFor(row.id);

    let score = null;
    let scoreBefore = null;
    try {
      const points = await recentScores(row.id, 2);
      if (!dry && Date.now() < measureUntil) {
        score = (await recordScore(row.id, row.domain)) ?? points[0] ?? null;
        scoreBefore = points[0] && points[0].day !== score?.day ? points[0] : points[1] ?? null;
      } else {
        score = points[0] ?? null;
        scoreBefore = points[1] ?? null;
      }
    } catch {
      // The visit numbers must go out even when the measurement does not.
    }

    const mail = composeWeekly(row, numbers, SITE.url, score, scoreBefore);
    if (!mail) {
      skipped.push(row.domain);
      // Still stamp it, or a site with a quiet week is reconsidered every single run.
      if (!dry) await sql`update sites set last_report_at = now() where id = ${row.id}`;
      continue;
    }
    if (dry) {
      // The whole email, because the only way to know a weekly note reads well is to read it.
      sent.push(`${row.domain}\n  SUBJECT: ${mail.subject}\n${mail.text.replace(/^/gm, '  ')}`);
      continue;
    }
    try {
      await sendTransactionalMail({ to: row.email, subject: mail.subject, text: mail.text, html: mail.html });
      await sql`update sites set last_report_at = now() where id = ${row.id}`;
      sent.push(row.domain);
    } catch {
      // Left unstamped on purpose: the next run tries again rather than losing the week.
      failed.push(row.domain);
    }
  }

  return json({ considered: due.length, sent, skipped, failed, dry });
};
