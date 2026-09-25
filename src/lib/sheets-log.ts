/**
 * Запись бесплатных проверок в Google-таблицу.
 *
 * Простым языком. Человек проверяет свой сайт на нашей странице. Мы записываем в таблицу
 * одну строку: когда, какой сайт, какой балл, с какой площадки он пришёл. Если он оставил
 * почту ради отчёта, строка попадает во второй лист, уже вместе с почтой. Больше ничего:
 * ни адреса его компьютера, ни того, что он делал дальше.
 *
 * Зачем. Без этого мы теряем каждого, кто прогнал проверку: письмо ушло и след пропал.
 * Таблица это и есть база, из которой потом идут письма и предложения.
 *
 * Что сюда НЕ пишется. Платные отчёты и агентская подписка: покупатель платит за отчёт по
 * сайтам своих клиентов, и складывать их список у себя было бы предательством. Решение
 * Максима от 13 сентября 2026: следы оставляет только бесплатная ступень.
 *
 * Технически: сервисный аккаунт Google, подпись JWT средствами node:crypto, без библиотек.
 * Токен живёт час и лежит в памяти инстанса, поэтому обычная запись это один запрос.
 * Ошибки не выбрасываются наружу никогда: таблица не должна ломать проверку сайта.
 *
 * Env: SHEETS_SA_EMAIL, SHEETS_SA_KEY (приватный ключ целиком, \n можно экранированными),
 * FREE_CHECKS_SHEET_ID. Не задано хотя бы одно, запись молча выключена.
 */
import { createSign } from 'node:crypto';

const SHEET_LEADS = 'С почтой';
const SHEET_ALL = 'Все прогоны';
/*
 * Наши собственные прогоны: дымовая проверка продуктов, радары, ручные запросы из терминала.
 * Раньше они ложились в один лист с живыми людьми и писались как «прямой заход», из-за чего
 * 15.09.2026 в таблице было 158 строк, а настоящих посетителей среди них 28. По такой таблице
 * нельзя понять ни спроса, ни доли тех, кто оставил почту.
 */
const SHEET_OURS = 'Наши прогоны';

/**
 * Наш ли это прогон.
 *
 * Правило нарочно перевёрнуто по сравнению с первой попыткой. 15.09.2026 я сделал наоборот:
 * человеком считалось только то, что похоже на известный браузер. Наутро в листе наших прогонов
 * оказались два НАСТОЯЩИХ покупателя, zavadskiiartem@gmail.com и lady.bookman@inbox.ru: их
 * браузеры под шаблон не подошли. Письма они получили, а из списка заявок пропали.
 *
 * Цена ошибки несимметрична. Принять свой прогон за человека значит немного намусорить в
 * таблице. Принять человека за свой прогон значит потерять из виду покупателя. Поэтому своим
 * считается только то, что мы узнаём явно: наши инструменты, библиотеки и поисковые роботы.
 * Всё остальное, включая незнакомый браузер и пустую строку, считается человеком.
 */
function looksOurs(agent: string): boolean {
  const a = String(agent || '');
  if (/OperStack|curl|wget|node-fetch|python-requests|axios|Go-http|Java\/|okhttp|HeadlessChrome|PhantomJS|Puppeteer|Playwright/i.test(a)) return true;
  return /\bbot\b|spider|crawler|slurp|facebookexternalhit|bingpreview|Googlebot|YandexBot|AhrefsBot|SemrushBot/i.test(a);
}
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
/** Столько ждём Google и не дольше: страница проверки не должна стоять из-за таблицы. */
const TIMEOUT_MS = 3000;

const env = (key: string): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? '').trim();

/** Приватный ключ в переменной окружения хранится одной строкой, переводы строк экранированы. */
const privateKey = (): string => env('SHEETS_SA_KEY').replace(/\\n/g, '\n');

export const sheetsConfigured = (): boolean =>
  Boolean(env('SHEETS_SA_EMAIL') && env('SHEETS_SA_KEY') && env('FREE_CHECKS_SHEET_ID'));

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

let cached: { token: string; until: number } | null = null;

async function accessToken(): Promise<string | null> {
  if (cached && Date.now() < cached.until) return cached.token;
  const iss = env('SHEETS_SA_EMAIL');
  const key = privateKey();
  if (!iss || !key) return null;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url({ alg: 'RS256', typ: 'JWT' });
  const claim = b64url({ iss, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 });
  const signature = createSign('RSA-SHA256').update(`${head}.${claim}`).end().sign(key, 'base64url');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${head}.${claim}.${signature}`,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) return null;
  // Минута запаса, чтобы не отправить запрос с токеном, который протух по дороге.
  cached = { token: body.access_token, until: Date.now() + ((body.expires_in ?? 3600) - 60) * 1000 };
  return cached.token;
}

async function append(sheet: string, row: (string | number)[]): Promise<boolean> {
  const token = await accessToken();
  if (!token) return false;
  const id = env('FREE_CHECKS_SHEET_ID');
  const range = `${encodeURIComponent(`${sheet}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // Токен могли отозвать: сбрасываем кэш, чтобы следующая запись взяла новый.
  if (res.status === 401 || res.status === 403) cached = null;
  return res.ok;
}

/** Дата в том виде, в каком её удобно читать и сортировать в таблице: 2026-09-13 17:42:05. */
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

const clean = (v: unknown) => String(v ?? '').trim().slice(0, 40);

/**
 * Откуда пришёл человек и с какой страницы.
 *
 * Сначала верим тому, что прислала сама страница: она помнит метку с момента, когда человек
 * впервые попал на сайт, даже если проверку он запустил через три клика. Если страница
 * ничего не прислала, читаем метки из адреса, с которого пришёл запрос, а в последнюю
 * очередь просто смотрим, с какого домена он к нам перешёл.
 */
export function originOf(
  explicit: { source?: unknown; campaign?: unknown },
  referer: string | null,
): { source: string; campaign: string; page: string } {
  let page = '';
  let fromUrl = { source: '', campaign: '', host: '' };
  if (referer) {
    try {
      const u = new URL(referer);
      page = u.pathname;
      fromUrl = {
        source: clean(u.searchParams.get('utm_source') || u.searchParams.get('ref')),
        campaign: clean(u.searchParams.get('utm_campaign')),
        host: u.host.replace(/^www\./, ''),
      };
    } catch {
      // Чужой или битый Referer: тогда источник останется неизвестным, и это нормально.
    }
  }
  const campaign = clean(explicit.campaign) || fromUrl.campaign;
  const source = clean(explicit.source) || fromUrl.source;
  if (source) return { source, campaign, page };
  // Переход внутри сайта источником не считается: человек уже был у нас.
  const own = fromUrl.host.endsWith('oper-stack.com') || fromUrl.host.endsWith('oper-stack.ru');
  return { source: !fromUrl.host || own ? 'прямой заход' : fromUrl.host, campaign, page };
}

export type CheckRow = {
  /** Заголовок User-Agent запроса. Без него прогон считается нашим, а не человеческим. */
  agent?: string;
  /**
   * Пять областей через дробь: доступ, карта, сущность, содержимое, доверие.
   * Без них расхождение между двумя прогонами доказать нельзя, остаётся гадать по итогу.
   * 15.09.2026 один сайт получил 52 и 67 с разницей в две минуты, и разобрать это было нечем.
   */
  areas?: string;
  lang: string;
  host: string;
  score: number;
  grade: string;
  source: string;
  campaign: string;
  page: string;
};

/** Каждый прогон бесплатной проверки, без почты. */
export async function logCheck(r: CheckRow): Promise<void> {
  if (!sheetsConfigured()) return;
  try {
    const row = [stamp(), r.lang, r.host, r.score, r.grade, r.source, r.campaign, r.page, r.areas ?? ''];
    // Свои прогоны в отдельный лист: лист живых людей должен отвечать на вопрос «есть ли спрос».
    if (looksOurs(r.agent ?? '')) await append(SHEET_OURS, [...row, `наш инструмент: ${String(r.agent ?? '').slice(0, 120)}`]);
    else await append(SHEET_ALL, row);
  } catch {
    // Таблица недоступна. Проверка сайта от этого не страдает, и человек ничего не замечает.
  }
}

/** Прогон, за который человек оставил почту. */
export async function logLead(r: CheckRow & { email: string; name: string; sent: string; tier: string }): Promise<void> {
  if (!sheetsConfigured()) return;
  try {
    const row = [stamp(), r.lang, r.host, r.score, r.grade, r.email, r.name, r.source, r.campaign, r.page, r.sent, r.tier];
    // То же правило, что и у прогонов: в лист заявок попадает только живой человек из браузера.
    if (looksOurs(r.agent ?? '')) await append(SHEET_OURS, [stamp(), r.lang, r.host, r.score, r.grade, r.source, r.campaign, r.page, `наша заявка: ${r.email} · ${String(r.agent ?? '').slice(0, 100)}`]);
    else await append(SHEET_LEADS, row);
  } catch {
    // То же самое: письмо человеку уже ушло, и это важнее строки в таблице.
  }
}

/**
 * Отметить, что человек отписался.
 *
 * Ищем его строки в листе «С почтой» и ставим «да» в колонку N. Строк может быть несколько:
 * один и тот же человек мог проверить пять сайтов. Отписка касается всех.
 *
 * Возвращаем true, только если отметка действительно проставлена. Иначе страница отписки
 * честно скажет человеку написать нам письмом, а не соврёт, что всё готово.
 */
/**
 * Отписка: «адреса нет в списке» и «у нас не вышло» это разные ответы.
 *
 * Человек, которого в таблице нет (отписался раньше, или никогда не оставлял почту), уже получил
 * то, чего хотел: писать ему мы не будем. Показывать ему ошибку и звать написать нам значит
 * пугать его там, где всё в порядке. Ошибка остаётся только для настоящей поломки: таблица не
 * отвечает, ключа нет, запись не прошла.
 */
export async function markUnsubscribed(email: string): Promise<'marked' | 'absent' | 'failed'> {
  if (!sheetsConfigured()) return 'failed';
  const wanted = email.trim().toLowerCase();
  try {
    const token = await accessToken();
    if (!token) return 'failed';
    const id = env('FREE_CHECKS_SHEET_ID');
    const head = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const range = encodeURIComponent(`${SHEET_LEADS}!A2:N`);
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`, {
      headers: head,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return 'failed';
    const rows = ((await res.json()) as { values?: string[][] }).values ?? [];
    // Колонка F это почта, шестая по счёту. Первая строка данных это вторая строка листа.
    const hits = rows
      .map((row, i) => ({ row: i + 2, email: String(row[5] ?? '').trim().toLowerCase() }))
      .filter((r) => r.email === wanted);
    // Не нашли, значит писать некому: цель достигнута, это не поломка.
    if (!hits.length) return 'absent';
    const body = {
      valueInputOption: 'RAW',
      data: hits.map((h) => ({ range: `${SHEET_LEADS}!N${h.row}`, values: [['да']] })),
    };
    const put = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchUpdate`, {
      method: 'POST',
      headers: head,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return put.ok ? 'marked' : 'failed';
  } catch {
    return 'failed';
  }
}

/**
 * Остановить недельные письма OperStack Watch для этой почты (страница «Email settings»).
 *
 * Простым языком. Письма подписки служебные, рекламной отписки в них нет, но выключить их человек
 * должен мочь сам. Отметка ставится в лист «Наблюдение», столбец I «Отписан»: недельный прогон
 * такие строки пропускает. Сама подписка в Whop этим не отменяется, и страница так и говорит.
 */
export async function stopWatchLetters(email: string): Promise<'stopped' | 'absent' | 'failed'> {
  if (!sheetsConfigured()) return 'failed';
  const wanted = email.trim().toLowerCase();
  try {
    const token = await accessToken();
    if (!token) return 'failed';
    const id = env('FREE_CHECKS_SHEET_ID');
    const head = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent('Наблюдение!A2:J')}`, {
      headers: head, signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return 'failed';
    const rows = ((await res.json()) as { values?: string[][] }).values ?? [];
    const hits = rows
      .map((row, i) => ({ row: i + 2, kind: String(row[1] ?? ''), email: String(row[2] ?? '').trim().toLowerCase() }))
      .filter((r) => r.email === wanted && r.kind === 'watch-weekly');
    if (!hits.length) return 'absent';
    const put = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchUpdate`, {
      method: 'POST', headers: head,
      body: JSON.stringify({ valueInputOption: 'RAW', data: hits.map((h) => ({ range: `Наблюдение!I${h.row}`, values: [['да']] })) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return put.ok ? 'stopped' : 'failed';
  } catch {
    return 'failed';
  }
}
