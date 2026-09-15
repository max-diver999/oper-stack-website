/**
 * AI visibility check endpoint. GET /api/ai-visibility/?url=example.com or POST { url }.
 * Public signals only, hard time budget, small in-memory cache and rate limit per instance.
 */
import type { APIRoute } from 'astro';
import { VISIBILITY_DEFAULTS, checkVisibility, normaliseInput } from '@operstack/audit';
import { logCheck, originOf } from '../../lib/sheets-log';

export const prerender = false;

const cache = new Map<string, { at: number; body: string }>();
const hits = new Map<string, { at: number; n: number }>();
const CACHE_MS = 10 * 60 * 1000;
const LIMIT = 12; // checks per IP per 10 minutes, per instance

/**
 * Ограничение считается по адресу посетителя. Если адрес определить не удалось, не ограничиваем
 * вовсе: 13 сентября 2026 заголовок x-forwarded-for до обработчика не доходил, все запросы падали
 * в одно ведро с ключом "unknown", и двенадцать проверок в десять минут закрывали инструмент
 * для всех сразу. Пустить лишний прогон дешевле, чем погасить бесплатную проверку всему свету.
 */
function limited(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > CACHE_MS) { hits.set(ip, { at: now, n: 1 }); return false; }
  h.n += 1;
  return h.n > LIMIT;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

/**
 * Каждый прогон уходит строкой в таблицу: какой сайт проверяли, какой балл, с какой площадки
 * человек пришёл. Почты здесь нет и быть не может, её на этом шаге ещё не спрашивали.
 * Ждём таблицу вместе с ответом, но не дольше трёх секунд, и любую её ошибку проглатываем.
 */
async function record(result: any, request: Request, from: { source?: string; campaign?: string }): Promise<void> {
  if (!result?.ok) return;
  const { source, campaign, page } = originOf(from, request.headers.get('referer'));
  await logCheck({ lang: 'en', host: result.host, score: result.score, grade: result.grade, source, campaign, page });
}

/**
 * Что из результата уезжает в браузер.
 *
 * Простым языком. Бесплатная проверка показывает балл, области, пройденные проверки и одну
 * правку целиком. Остальные найденные проблемы человек видит списком под размытием: он видит,
 * что список настоящий и какой он длины, а содержание получает в списке правок за деньги.
 *
 * Поэтому полный текст спрятанных находок сюда не кладётся вовсе. Размытие это картинка, и
 * «выделить всё» или отключённые стили сняли бы его за секунду. Честно и в обратную сторону:
 * заголовок обрезан до четырёх слов на сервере, то есть прятать нечего, скрыт только смысл.
 *
 * Пройденные проверки остаются целиком: хорошая новость про свой сайт не товар.
 */
const TEASER_WORDS = 4;
const teaser = (text: unknown): string =>
  String(text ?? '').trim().split(/\s+/).slice(0, TEASER_WORDS).join(' ').replace(/[.,;:!?\u2026]+$/, '');

function forVisitor(result: any): any {
  if (!result?.ok || !Array.isArray(result.areas)) return result;
  const firstId = result.fixes?.[0]?.id ?? null;
  const rest: Array<{ area: string; level: string; teaser: string }> = [];
  const areas = result.areas.map((a: any) => {
    const kept: any[] = [];
    let problems = 0;
    for (const f of a.findings || []) {
      if (f.level === 'pass') { kept.push(f); continue; }
      if (firstId && f.id === firstId) continue; // показана целиком отдельной правкой
      problems += 1;
      rest.push({ area: a.label, level: f.level, teaser: teaser(f.text) });
    }
    return { ...a, findings: kept, problems };
  });
  // Правок в ответе одна: та, что показывается целиком. Остальные живут в rest заголовками.
  return { ...result, areas, fixes: (result.fixes || []).slice(0, 1), rest };
}

async function handle(rawUrl: string, ip: string, request: Request, from: { source?: string; campaign?: string }): Promise<Response> {
  const url = normaliseInput(rawUrl);
  if (!url) return json({ ok: false, error: 'Enter a public site address, for example example.com' }, 400);
  if (limited(ip)) return json({ ok: false, error: 'Too many checks from this connection. Try again in ten minutes.' }, 429);
  const key = new URL(url).host.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return new Response(hit.body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Cache': 'hit' } });
  // Настройки берём из пакета и руками не задаём: любое расхождение параметров это
  // расхождение чисел между страницей, письмом и отчётом.
  const result = await checkVisibility(url, { ...VISIBILITY_DEFAULTS, lang: 'en' });
  // В таблицу пишем по полному результату, в браузер отдаём урезанный.
  await record(result, request, from);
  const visible = forVisitor(result);
  const body = JSON.stringify(visible);
  if (result.ok) cache.set(key, { at: Date.now(), body });
  return json(visible, result.ok ? 200 : 422);
}

/** Адрес берём тем же способом, что и соседний обработчик задач: сначала clientAddress. */
const ipOf = (request: Request, clientAddress?: string) =>
  (clientAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();

export const GET: APIRoute = async ({ request, url, clientAddress }) =>
  handle(url.searchParams.get('url') || '', ipOf(request, clientAddress), request, {
    source: url.searchParams.get('from') || undefined,
    campaign: url.searchParams.get('campaign') || undefined,
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: { url?: string; from?: string; campaign?: string } = {};
  try { body = await request.json(); } catch { /* fall through with an empty url */ }
  return handle(String(body.url || ''), ipOf(request, clientAddress), request, { source: body.from, campaign: body.campaign });
};
