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
import { VISIBILITY_DEFAULTS, checkVisibility, normaliseInput } from '@operstack/audit';
import { buildRunBody, buildRunSubject } from '../../lib/report-fulfilment';
import { sendTransactionalMail } from '../../lib/mail-smtp';
import { logLead, originOf } from '../../lib/sheets-log';
import { SITE } from '../../data/site';

export const prerender = false;

/*
 * Защита от второй отправки того же письма.
 *
 * 16.09.2026 двое покупателей получили одно и то же письмо дважды: `kuzviksi@ya.ru` с разницей в
 * тринадцать секунд, `railmi@yandex.ru` через двадцать минут. Кнопка на форме гасится, значит
 * человек отправлял ещё раз со второй попытки или после перезагрузки. Два одинаковых письма
 * подряд выглядят неряшливо и портят репутацию отправителя у почтовиков.
 *
 * Память живёт в экземпляре функции, то есть защита не абсолютная: два запроса могут попасть на
 * разные экземпляры. Это ловит частый случай, повтор в одну и ту же минуту, и стоит ноль.
 */
const QUEUED_MS = 15 * 60 * 1000;
const queued = new Map<string, number>();
function recentlyQueued(email: string, url: string): boolean {
  const key = `${email.toLowerCase()}|${url.toLowerCase()}`;
  const now = Date.now();
  for (const [k, at] of queued) if (now - at > QUEUED_MS) queued.delete(k);
  const was = queued.get(key);
  if (was && now - was < QUEUED_MS) return true;
  queued.set(key, now);
  return false;
}
/** Что отвечаем на повтор: спокойно и без обвинений, письмо и правда уже в пути. */
const ALREADY_SENT = 'That letter is already on its way to the same address. Check your inbox, spam included: it arrives within a few minutes.';

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
async function queueFreeReport(url: string, email: string, visibility: unknown): Promise<boolean> {
  const secret = env('KIT_DOWNLOAD_SECRET');
  if (!secret) return false;
  // Балл едет вместе с заявкой: письмо должно назвать ту же цифру, которую человек
  // только что видел на странице, а не свою собственную из другой шкалы.
  // Вместе с заявкой едет весь результат проверки, а не одно число. Отчёт берёт его как есть
  // и второй раз не мерит: два честных замера одного живого сайта расходятся на пару баллов,
  // и покупатель увидел бы на странице одно, а в письме другое.
  const job = { url, email, lang: 'en' as const, tier: 'free' as const, visibility };
  try {
    await sendTransactionalMail({ to: QUEUE_TO, subject: buildRunSubject(job), ...buildRunBody(job, secret) });
    return true;
  } catch {
    return false;
  }
}

/**
 * Разбудить очередь прямо сейчас.
 *
 * Простым языком: обычно очередь сама просыпается раз в пять минут. Здесь мы стучимся к ней
 * сразу, чтобы человек получил отчёт примерно через минуту, а не ждал.
 *
 * Не вышло, значит ничего страшного: заявка уже лежит в ящике, и очередь возьмёт её на
 * ближайшем круге. Поэтому ошибку глотаем и ответ человеку не портим.
 *
 * Env: OPS_DISPATCH_TOKEN, токен GitHub с правом запускать задачи в oper-stack/ops-notify.
 */
async function wakeQueue(): Promise<boolean> {
  const token = env('OPS_DISPATCH_TOKEN');
  if (!token) return false;
  try {
    const res = await fetch('https://api.github.com/repos/oper-stack/ops-notify/actions/workflows/notify.yml/dispatches', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: { job: 'report' } }),
      signal: AbortSignal.timeout(6000),
    });
    return res.status === 204;
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

  // Повтор той же пары «почта и сайт» письма не порождает: см. recentlyQueued.

  if (recentlyQueued(email, url)) return json({ ok: true, sent: true, already: true, note: ALREADY_SENT });


  let result: any;
  try { result = await checkVisibility(url, { ...VISIBILITY_DEFAULTS, lang: 'en' }); } catch { return json({ ok: false, error: 'We could not read that site just now' }, 502); }
  if (!result?.ok) return json({ ok: false, error: 'We could not read that site just now' }, 502);

  // Заявка в очередь. Письмо человеку собирает она: у неё есть браузер, чтобы напечатать
  // PDF, а здесь его нет. Если заявку поставить не удалось, человек не получит ничего, и
  // сказать об этом надо сразу, а не молча.
  const queued = await queueFreeReport(result.url ?? url, email, result);
  if (!queued) {
    return json({ ok: false, error: 'We could not start your report just now. Write to info@oper-stack.com and we will run it by hand.' }, 502);
  }
  // Будим очередь, чтобы отчёт пришёл через минуту, а не на ближайшем круге.
  const woken = await wakeQueue();

  // Строка в таблицу пишется после того, как заявка принята: записываем состоявшийся обмен,
  // а не намерение.
  const { source, campaign, page } = originOf(
    { source: body.from, campaign: body.campaign },
    request.headers.get('referer'),
  );
  await logLead({
    agent: request.headers.get('user-agent') ?? '',
    lang: 'en',
    host: result.host,
    score: result.score,
    grade: result.grade,
    email,
    name: String(body.name ?? '').trim().slice(0, 80),
    source,
    campaign,
    page,
    sent: woken ? 'отчёт собирается, очередь разбужена' : 'отчёт в очереди',
    tier: 'бесплатно',
  });

  return json({ ok: true, sent: true, queued, woken });
};

export const GET: APIRoute = async ({ url }) => {
  // Healthcheck для дымового теста: не шлёт писем и не читает чужих сайтов.
  if (url.searchParams.get('healthcheck') === '1') return json({ ok: true, healthcheck: true });
  return json({ ok: false, error: 'POST an email and the address of a site you have just checked' }, 405);
};
