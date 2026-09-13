/**
 * Одна настоящая задача по сайту в обмен на почту.
 *
 * Простым языком. Человек прогнал бесплатную проверку, увидел балл и оставил почту.
 * Ему тут же уходит письмо с одной задачей: что на сайте сейчас, что поменять и как
 * проверить, что получилось. Задачу он отдаёт тому, кто ведёт его сайт, или вставляет
 * в ChatGPT, Claude или Cursor. Ничего устанавливать не надо.
 *
 * Почему одна, а не все: остальные это платная ступень за 9 долларов. Но эта одна
 * настоящая, из его собственного прогона, а не общий PDF, который раньше обещали
 * и который никем не отправлялся.
 *
 * Письмо уходит синхронно, до ответа: если почта не настроена, человек должен узнать
 * об этом сразу, а не ждать письма, которого не будет.
 */
import type { APIRoute } from 'astro';
import { checkVisibility, normaliseInput } from '../../lib/ai-visibility.mjs';
import { topTask, renderTask } from '../../lib/ai-visibility-tasks.mjs';
import { sendTransactionalMail } from '../../lib/mail-smtp';
import { logLead, originOf } from '../../lib/sheets-log';
import { SITE } from '../../data/site';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;
const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Не больше шести писем с одного адреса за десять минут. */
const hits = new Map<string, { at: number; n: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > 10 * 60 * 1000) { hits.set(ip, { at: now, n: 1 }); return false; }
  h.n += 1;
  return h.n > 6;
}

function buildEmail(task: ReturnType<typeof topTask>, host: string, score: number) {
  const plain = renderTask(task, host);
  const subject = `Your site scored ${score} of 100. Here is what to fix first`;
  const text = [
    plain,
    '',
    `The rest of the tasks for ${host}, one for every problem found, are in the site fix list: ${SITE.url}/products/site-report/`,
    '',
    'OperStack · info@oper-stack.com',
  ].join('\n');
  const html = [
    `<p>Your site <strong>${esc(host)}</strong> scored <strong>${score} of 100</strong> on the AI visibility check.</p>`,
    '<p>Here is the single task that moves that score most. Copy it whole and hand it to whoever looks after your site, or paste it into ChatGPT, Claude or Cursor. Keep the "Now" and "How to check" lines: without them nobody knows where to start or when it is done.</p>',
    '<div style="border-left:3px solid #888;padding:12px 16px;margin:18px 0;background:#fafafa">',
    `<p style="margin:0 0 10px"><strong>Now:</strong> ${esc(task?.now || '')}</p>`,
    `<p style="margin:0 0 10px"><strong>What to do:</strong> ${esc(task?.task || '')}</p>`,
    `<p style="margin:0 0 10px"><strong>How to check:</strong> ${esc(task?.verify || '')}</p>`,
    `<p style="margin:0;color:#666;font-size:13px">${esc(task?.rule || '')}</p>`,
    '</div>',
    `<p>The rest of the tasks for ${esc(host)}, one for every problem found, are in the <a href="${SITE.url}/products/site-report/">site fix list</a>.</p>`,
    '<p style="color:#888;font-size:13px">OperStack · info@oper-stack.com</p>',
  ].join('\n');
  return { subject, text, html };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Malformed request' }, 400); }

  // Ловушка для ботов: поле спрятано от человека, заполнено значит бот.
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true, sent: true });

  const email = String(body.email ?? '').trim();
  const rawUrl = String(body.url ?? '').trim();
  if (!EMAIL.test(email)) return json({ ok: false, error: 'Enter an email we can send the task to' }, 400);
  const url = normaliseInput(rawUrl);
  if (!url) return json({ ok: false, error: 'Run the check first, then ask for the task' }, 400);
  if (limited(clientAddress || 'unknown')) return json({ ok: false, error: 'Too many requests from this connection. Try again in ten minutes.' }, 429);

  let result: any;
  try { result = await checkVisibility(url); } catch { return json({ ok: false, error: 'We could not read that site just now' }, 502); }
  if (!result?.ok) return json({ ok: false, error: 'We could not read that site just now' }, 502);

  const task = topTask(result);
  if (!task) {
    return json({ ok: true, sent: false, message: 'Nothing is failing on this site, so there is no task to send. That is a good result.' });
  }

  try {
    await sendTransactionalMail({ to: email, ...buildEmail(task, result.host, result.score) });
  } catch {
    return json({ ok: false, error: 'We could not send the email just now. Write to info@oper-stack.com and we will send it by hand.' }, 502);
  }

  // Строка в таблицу пишется только после того, как письмо ушло: записываем состоявшийся
  // обмен, а не намерение. Если таблица недоступна, человек всё равно получил свою задачу.
  const { source, campaign, page } = originOf(
    { source: body.from, campaign: body.campaign },
    request.headers.get('referer'),
  );
  await logLead({
    lang: 'en',
    host: result.host,
    score: result.score,
    grade: result.grade,
    email,
    name: String(body.name ?? '').trim().slice(0, 80),
    source,
    campaign,
    page,
    sent: 'задача письмом',
    tier: 'бесплатно',
  });

  return json({ ok: true, sent: true, taskId: task.id });
};

export const GET: APIRoute = async ({ url }) => {
  // Healthcheck для дымового теста: не шлёт писем и не читает чужих сайтов.
  if (url.searchParams.get('healthcheck') === '1') return json({ ok: true, healthcheck: true });
  return json({ ok: false, error: 'POST an email and the address of a site you have just checked' }, 405);
};
