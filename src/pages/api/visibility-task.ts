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
import { makeOfferToken } from './offer';
import { button, emailShell, esc as escHtml, findings, note, p as par, scoreBlock, taskBlock } from '../../lib/email-shell';
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
function buildEmail(task: ReturnType<typeof topTask>, result: any, unsubUrl: string, offerUrl: string | null) {
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
    ...(offerUrl
      ? ['',
         'If you want the whole picture, not just your own site: the full report puts you beside up to three rivals and re-checks your site every week for a month.',
         'It is 29 USD. For the next 24 hours it is 19, and then this link goes back to 29 and does not come back. One offer per address.',
         offerUrl]
      : []),
    '',
    'OperStack · info@oper-stack.com',
    `Not interested in the follow-ups? One click and we stop: ${unsubUrl}`,
  ].join('\n');

  const html = emailShell({
    preheader: n
      ? `${n} problem${n === 1 ? '' : 's'} found, and the one to fix first`
      : 'Nothing is failing on this site',
    heading: n
      ? `${n} problem${n === 1 ? '' : 's'} on ${host}`
      : `${host} is clean`,
    blocks: [
      scoreBlock(host, score),
      n
        ? par('Everything the check found on your site:') + findings(problems)
        : par('Nothing is failing on this site. That is a good result, and rarer than you would think.'),
      ...(task
        ? [
            par('Here is the one that moves your score most, written out in full. Copy it whole and hand it to whoever looks after your site, or paste it into ChatGPT, Claude or Cursor. Keep the Now and How to check lines: without them nobody knows where to start or when it is done.'),
            taskBlock(task as Record<string, string>),
          ]
        : []),
      par(`A five-page measurement of <strong>${escHtml(host)}</strong> follows as a PDF, usually within twenty minutes.`),
      par('This check reads one page. The site fix list reads up to twenty and turns every problem above into a task written the same way.'),
      button(`${SITE.url}/products/site-report/`, 'Get the full list of tasks, 9 USD →'),
      note('For scale: an agency charges 2,000 to 7,500 USD for a technical audit and takes 30 to 45 days. Most of that bill is the measuring, and measuring is what a machine does best. What an agency adds on top, a person who reads your findings and says what they mean for your business, is our 149 USD audit.'),
      /**
       * Срочная цена. Она обязана быть здесь, а не только в письме следующего дня: то письмо
       * говорит «остаётся четыре часа», и если про цену не сказали сегодня, человек читает
       * про конец срока, о начале которого не слышал.
       *
       * Блока нет, пока скрытый тариф не заведён: обещать цену, которой нет, нельзя.
       */
      ...(offerUrl
        ? [
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0"><tr><td bgcolor="#FFF6E4" style="padding:20px 22px;border-radius:10px">
              <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#14181C"><strong>If you want the whole picture, not just your own site.</strong> The full report puts you beside up to three rivals on the same measurement, and re-checks your site every week for a month, so you can see what your fixes actually moved.</p>
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#14181C">It is 29 USD. <strong>For the next 24 hours it is 19</strong>, and then this link goes back to 29 and does not come back. One offer per address.</p>
            </td></tr></table>`,
            button(offerUrl, 'Take the full report at 19 USD →'),
          ]
        : []),
    ],
    unsubUrl,
  });
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
    const secret = env('KIT_DOWNLOAD_SECRET');
    const unsubUrl = `${SITE.url}/api/unsubscribe/?t=${makeUnsubToken(email, secret)}`;
    // Ссылка живёт сутки: столько же, сколько обещает письмо. Письмо следующего дня выпишет
    // свою, на оставшиеся четыре часа.
    const offerUrl = secret && env('WHOP_CHECKOUT_RIVALS_19')
      ? `${SITE.url}/api/offer/?t=${makeOfferToken({ email: email.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 24 * 3600 }, secret)}`
      : null;
    await sendTransactionalMail({ to: email, ...buildEmail(task, result, unsubUrl, offerUrl) });
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
