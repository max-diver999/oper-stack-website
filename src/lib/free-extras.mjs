/**
 * Платная часть бесплатной проверки: готовый текст для страницы клиента и «кого ChatGPT называет
 * вместо вас» по трём вопросам покупателя (задание Максима 26.09.2026, пункты 2 и 3).
 *
 * Простым языком. Сама проверка сайта ничего не стоит и остаётся открытой. А вот вопросы ChatGPT с
 * поиском и абзац, написанный моделью, стоят денег: около 5-9 центов на проверку. Поэтому этот шаг
 * запускается отдельно, со страницы результата, и защищён так, как решил Максим:
 *   1. повтор того же домена за сутки показывает сохранённое и ничего не тратит;
 *   2. Cloudflare Turnstile в невидимом режиме: не пройден, запросов нет;
 *   3. не больше трёх платных прогонов с одного адреса за сутки, счёт на сервере;
 *   4. больше 20 $ за сутки: письмо Максиму, проверки при этом не останавливаются;
 *   5. каждый шаг пишется в журнал, раз в неделю сводка.
 * Общего потолка расходов в OpenAI нет намеренно: по мере продаж он мешал бы.
 *
 * Здесь только решения и порядок шагов. База, модель, Turnstile и почта приходят снаружи (deps),
 * поэтому всё это проверяется тестом без сети: scripts/test-free-extras.mjs.
 */
export const FREE_RUNS_PER_IP = 3;
export const WINDOW_MS = 24 * 3600e3;
export const ALERT_USD = 20;
export const QUESTIONS = 3;
const RUNNING_STALE_MS = 3 * 60e3;

/** Служебные страницы не получают готовый абзац: им короткий ответ не нужен. */
const SERVICE_PAGE = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:terms|terms-of-service|privacy|privacy-policy|cookies?|cookie-policy|legal|imprint|impressum|disclaimer|refunds?|contact|contacts|contact-us|login|log-in|signin|sign-in|signup|sign-up|register|cart|checkout|account|search|sitemap|404)(?:\/|$)/i;

/** Страница для готового абзаца: первая без короткого ответа в начале, главная в приоритете. */
export function pickPage(sample = []) {
  const pages = (Array.isArray(sample) ? sample : [])
    .filter((p) => p && p.url && p.answerFirst === false)
    .map((p) => { try { return { url: p.url, path: new URL(p.url).pathname || '/', h1: p.h1 || '' }; } catch { return null; } })
    .filter((p) => p && !SERVICE_PAGE.test(p.path));
  return pages.find((p) => p.path === '/') || pages[0] || null;
}

/** Сайт не сказал, что продаёт: тогда спрашиваем одним полем, а ChatGPT не трогаем. */
export const weakProfile = (profile) => !profile || String(profile.category || '').trim().length < 3 || !(profile.questions || []).length;

/** Что из разбора уезжает на страницу: вопросы, кто назван, по видам. Без заметок и ссылок ответа. */
export function slimSummary(s) {
  if (!s) return null;
  const names = (xs) => (xs || []).map((x) => (typeof x === 'string' ? x : x?.name)).filter(Boolean);
  return {
    asked: s.asked, named: s.named,
    competitors: (s.competitors || []).map((c) => ({ name: c.name, times: c.times })),
    rows: (s.rows || []).map((r) => ({ question: r.question, named: r.named, error: Boolean(r.error), comp: names(r.comp), other: names(r.other), unclear: names(r.unclear) })),
  };
}

/** Сам прогон: профиль с тремя вопросами, затем разом вопросы ChatGPT и абзац для страницы. */
export async function buildExtras({ url, sample = [], sell = '' }, W) {
  return W.metered(async () => {
    const profile = await W.deriveProfile(url, { count: QUESTIONS, hint: sell });
    const brief = { brand: profile.brand, category: profile.category, city: profile.city || null, country: profile.country || null };
    if (!sell && weakProfile(profile)) return { needs: 'sell', profile: brief };
    const target = { brand: profile.brand, url };
    const page = pickPage(sample);
    const [answers, fix] = await Promise.all([
      W.askParallel(profile.questions.slice(0, QUESTIONS), target),
      page
        ? W.buildFix({ url, brand: profile.brand, category: profile.category, city: profile.city, question: `What does ${profile.brand} offer on this page, and for whom?`, page }).catch(() => null)
        : Promise.resolve(null),
    ]);
    const classes = await W.classifyWeek(answers, profile).catch(() => ({}));
    const summary = W.summarise(answers, target, classes);
    return {
      profile: brief,
      questions: profile.questions.slice(0, QUESTIONS),
      named: slimSummary(summary),
      // Не собрался абзац, блока нет (задание, п. 2.5).
      ready: fix && fix.x ? { a: fix.a, x: fix.x, n: fix.n || [], page: page.path } : null,
    };
  });
}

const startOfUtcDay = (now) => { const d = new Date(now); d.setUTCHours(0, 0, 0, 0); return d.getTime(); };

/**
 * Один запрос со страницы результата. Возвращает то, что показать: done, running, needs, limit,
 * blocked, error или missing. Порядок проверок важен: сохранённое раньше Turnstile и счётчика,
 * потому что повтор ничего не стоит и попытку не тратит.
 */
export async function serveExtras({ checkId, sell = '', token = '', ip = '' }, deps) {
  const { store, W, verifyTurnstile, hashIp, sendAlert, now = Date.now() } = deps;
  const check = await store.loadCheck(checkId);
  if (!check) return { status: 'missing' };
  const domain = check.domain;
  const ipHash = hashIp(ip);
  const cleanSell = String(sell || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const existing = await store.getExtras(checkId);
  if (existing?.status === 'done') return existing;
  if (existing?.status === 'running' && now - Date.parse(existing.updated_at) < RUNNING_STALE_MS) return { status: 'running' };
  if (existing?.status === 'needs' && !cleanSell) return existing;

  // 1. Тот же домен за сутки: сохранённый ответ, без запросов и без попытки (п. 3.4).
  if (!cleanSell) {
    const recent = await store.recentDoneForDomain(domain, now - WINDOW_MS, checkId);
    if (recent) {
      await store.saveExtras(checkId, domain, 'done', { ...recent.payload, reusedFrom: recent.check_id }, 0);
      await store.log({ kind: 'reuse', checkId, domain, ipHash });
      return store.getExtras(checkId);
    }
  }
  // 2. Turnstile (п. 3.2): не пройден, ChatGPT не спрашиваем.
  if (!(await verifyTurnstile(token, ip))) {
    await store.log({ kind: 'turnstile', checkId, domain, ipHash });
    return { status: 'blocked' };
  }
  // 3. Три платных прогона с адреса за сутки (п. 3.1).
  const used = await store.countRuns(ipHash, now - WINDOW_MS);
  if (used >= FREE_RUNS_PER_IP) {
    await store.log({ kind: 'limit', checkId, domain, ipHash });
    return { status: 'limit' };
  }
  if (!(await store.claim(checkId, domain))) return { status: 'running' };
  try {
    const url = check.payload?.url || `https://${domain}/`;
    const m = await buildExtras({ url, sample: check.payload?.sample || [], sell: cleanSell }, W);
    const calls = m.calls.length; const searches = m.calls.reduce((a, c) => a + (c.search || 0), 0);
    if (m.result.needs) {
      await store.saveExtras(checkId, domain, 'needs', m.result, m.cost);
      await store.log({ kind: 'needs', checkId, domain, ipHash, cost: m.cost, calls, searches });
      return store.getExtras(checkId);
    }
    await store.saveExtras(checkId, domain, 'done', { ...m.result, at: new Date(now).toISOString(), sell: cleanSell || null }, m.cost);
    await store.log({ kind: 'run', checkId, domain, ipHash, cost: m.cost, calls, searches });
    // 4. Оповещение, а не остановка (п. 3.5): одно письмо в сутки, когда сутки перевалили за 20 $.
    const dayStart = startOfUtcDay(now);
    const spent = await store.costSince(dayStart);
    if (spent > ALERT_USD && !(await store.hasEvent('alert', dayStart))) {
      await store.log({ kind: 'alert', cost: 0 });
      await sendAlert?.({ spent, since: dayStart }).catch(() => {});
    }
    return store.getExtras(checkId);
  } catch (e) {
    await store.saveExtras(checkId, domain, 'error', { message: String(e?.message || e).slice(0, 200) }, 0);
    await store.log({ kind: 'error', checkId, domain, ipHash });
    return { status: 'error' };
  }
}

/** Недельная сводка (п. 3.6): сколько проверок, настоящих запросов, повторов, отсечено. */
export function weeklyText(rows, { from, to }) {
  const by = Object.fromEntries(rows.map((r) => [r.kind, r]));
  const n = (k) => Number(by[k]?.n || 0);
  const cost = rows.reduce((a, r) => a + Number(r.cost || 0), 0);
  const calls = rows.reduce((a, r) => a + Number(r.calls || 0), 0);
  const searches = rows.reduce((a, r) => a + Number(r.searches || 0), 0);
  const d = (t) => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return [
    `Бесплатная проверка с ChatGPT, ${d(from)} - ${d(to)}.`,
    '',
    `Прогонов с запросами к ChatGPT: ${n('run')}.`,
    `Взято из сохранённого (тот же сайт за сутки): ${n('reuse')}.`,
    `Отсечено лимитом 3 в сутки: ${n('limit')}.`,
    `Отсечено Turnstile: ${n('turnstile')}.`,
    `Спросили у человека, что он продаёт: ${n('needs')}.`,
    `Ошибок: ${n('error')}.`,
    `Настоящих запросов к модели: ${calls}, из них поисков: ${searches}.`,
    `Потрачено: $${cost.toFixed(2)}${n('run') ? `, в среднем $${(cost / Math.max(1, n('run'))).toFixed(3)} на прогон` : ''}.`,
    n('alert') ? `Письмо о перерасходе (больше $20 за сутки) уходило ${n('alert')} раз.` : 'Порог $20 за сутки не превышался.',
  ].join('\n');
}
