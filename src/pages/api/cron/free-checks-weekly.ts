/**
 * Недельная сводка по платной части бесплатной проверки (задание 26.09.2026, п. 3.6): сколько
 * прогонов с ChatGPT, сколько взято из сохранённого, сколько отсечено лимитом и Turnstile, сколько
 * настоящих запросов и денег. Письмо Максиму на info@, по понедельникам (vercel.json, crons).
 */
import type { APIRoute } from 'astro';
import { extrasStore } from '../../../lib/extras-store';
import { weeklyText } from '../../../lib/free-extras.mjs';
import { sendTransactionalMail } from '../../../lib/mail-smtp';

export const prerender = false;
const SECRET = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ request, url }) => {
  const header = request.headers.get('authorization') || '';
  if (!SECRET || (header !== `Bearer ${SECRET}` && url.searchParams.get('key') !== SECRET)) return json({ error: 'Not for you.' }, 401);
  const to = Date.now(); const from = to - 7 * 24 * 3600e3;
  const rows = await extrasStore.weekly(from);
  const text = weeklyText(rows, { from, to });
  if (url.searchParams.get('dry') === '1') return json({ dry: true, text });
  await sendTransactionalMail({ to: 'info@oper-stack.com', subject: 'Бесплатная проверка с ChatGPT: неделя', text, html: `<p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>` });
  return json({ sent: true });
};
