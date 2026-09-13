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
import { buildRunBody, buildRunSubject } from '../../lib/report-fulfilment';
import { makeUnsubToken } from './unsubscribe';
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

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

/** Куда падает заявка. Тот же ящик, что читает очередь отчётов. */
const QUEUE_TO = 'info@oper-stack.com';

/**
 * Ставим бесплатный отчёт в ту же очередь, что делает платные.
 *
 * Простым языком: список находок человек получает письмом сразу, а PDF собирается по-настоящему,
 * с открытием пяти страниц в браузере, и приходит следом в течение двадцати минут.
 *
 * Заявка это служебное письмо с подписанной темой, ровно как у платных ступеней. Подпись нужна,
 * чтобы никто не смог заказать бесплатный прогон на чужой адрес: очередь проверяет её и чужие
 * заявки не берёт.
 *
 * Не получилось поставить в очередь, значит человек всё равно уже получил список письмом:
 * ошибку глотаем и ответ не портим.
 */
async function queueFreeReport(url: string, email: string): Promise<boolean> {
  const secret = env('KIT_DOWNLOAD_SECRET');
  if (!secret) return false;
  const job = { url, email, lang: 'en' as const, tier: 'free' as const };
  try {
    await sendTransactionalMail({ to: QUEUE_TO, subject: buildRunSubject(job), ...buildRunBody(job, secret) });
    return true;
  } catch {
    return false;
  }
}
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

/**
 * Письмо в обмен на почту.
 *
 * На странице человек видит балл, всё, что пройдено, и первые три проблемы. Остальные проблемы
 * спрятаны, и письмо это ровно то, что он за них получает. Поэтому здесь идёт ПОЛНЫЙ список
 * найденного, а не одна задача: иначе обещание на странице было бы враньём.
 *
 * Порядок: сначала весь список, потом первая задача целиком как образец, потом ступень за 9.
 */
function buildEmail(task: ReturnType<typeof topTask>, result: any, unsubUrl: string) {
  const host = String(result?.host ?? '');
  const score = Number(result?.score ?? 0);
  type Finding = { level: string; text: string };
  const problems: { area: string; level: string; text: string }[] = [];
  for (const area of (result?.areas ?? []) as { label: string; findings: Finding[] }[]) {
    for (const f of area.findings ?? []) {
      if (f.level !== 'pass') problems.push({ area: area.label, level: f.level, text: f.text });
    }
  }
  const n = problems.length;
  const subject = n
    ? `${host}: ${score} of 100, and the ${n} problem${n === 1 ? '' : 's'} behind it`
    : `${host} scored ${score} of 100, and nothing is failing`;

  const listText = problems.map((p, i) => `${i + 1}. [${p.level === 'warn' ? 'partial' : 'problem'}] ${p.area}: ${p.text}`).join('\n');
  const listHtml = problems.map((p) => `<li style="margin:7px 0"><span style="display:inline-block;min-width:62px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:${p.level === 'warn' ? '#9a7b1f' : '#a33'}">${p.level === 'warn' ? 'Partial' : 'Problem'}</span> <strong>${esc(p.area)}.</strong> ${esc(p.text)}</li>`).join('');

  const text = [
    `${host} scored ${score} of 100 on the AI visibility check.`,
    '',
    n ? `Everything the check found, ${n} item${n === 1 ? '' : 's'}:` : 'Nothing is failing on this site.',
    listText,
    '',
    'The one that moves your score most, written out in full:',
    '',
    renderTask(task, host),
    '',
    `This check reads one page. The site fix list reads up to twenty and turns every problem above into a task written the same way: ${SITE.url}/products/site-report/`,
    '',
    'OperStack · info@oper-stack.com',
    `Not interested in the follow-ups? One click and we stop: ${unsubUrl}`,
  ].join('\n');

  const html = [
    `<p>Your site <strong>${esc(host)}</strong> scored <strong>${score} of 100</strong> on the AI visibility check.</p>`,
    n ? `<p>Everything the check found on it, ${n} item${n === 1 ? '' : 's'}:</p><ul style="padding-left:18px;margin:14px 0">${listHtml}</ul>` : '<p>Nothing is failing on this site. That is a good result.</p>',
    '<p>Here is the one that moves your score most, written out in full. Copy it whole and hand it to whoever looks after your site, or paste it into ChatGPT, Claude or Cursor. Keep the "Now" and "How to check" lines: without them nobody knows where to start or when it is done.</p>',
    '<div style="border-left:3px solid #888;padding:12px 16px;margin:18px 0;background:#fafafa">',
    `<p style="margin:0 0 10px"><strong>Now:</strong> ${esc(task?.now || '')}</p>`,
    `<p style="margin:0 0 10px"><strong>What to do:</strong> ${esc(task?.task || '')}</p>`,
    `<p style="margin:0 0 10px"><strong>How to check:</strong> ${esc(task?.verify || '')}</p>`,
    `<p style="margin:0;color:#666;font-size:13px">${esc(task?.rule || '')}</p>`,
    '</div>',
    `<p>This check reads one page. The <a href="${SITE.url}/products/site-report/">site fix list</a> reads up to twenty and turns every problem above into a task written the same way, for 9 USD.</p>`,
    '<p style="color:#888;font-size:13px">OperStack · info@oper-stack.com<br>'
      + `Not interested in the follow-ups? <a href="${unsubUrl}" style="color:#888">One click and we stop.</a></p>`,
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
    const unsubUrl = `${SITE.url}/api/unsubscribe/?t=${makeUnsubToken(email, env('KIT_DOWNLOAD_SECRET'))}`;
    await sendTransactionalMail({ to: email, ...buildEmail(task, result, unsubUrl) });
  } catch {
    return json({ ok: false, error: 'We could not send the email just now. Write to info@oper-stack.com and we will send it by hand.' }, 502);
  }

  // PDF ставим в очередь до записи в таблицу, чтобы в строке было видно, что именно ушло.
  const queued = await queueFreeReport(result.url ?? url, email);

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
    sent: queued ? 'список письмом + PDF в очереди' : 'список письмом',
    tier: 'бесплатно',
  });

  return json({ ok: true, sent: true, taskId: task.id, queued });
};

export const GET: APIRoute = async ({ url }) => {
  // Healthcheck для дымового теста: не шлёт писем и не читает чужих сайтов.
  if (url.searchParams.get('healthcheck') === '1') return json({ ok: true, healthcheck: true });
  return json({ ok: false, error: 'POST an email and the address of a site you have just checked' }, 405);
};
