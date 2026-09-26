// Платный шаг бесплатной проверки: защита и повторы (задание 26.09.2026, п. 3, раздел «Проверка»).
// Без сети и без денег: база, модель, Turnstile и почта подменены.
import assert from 'node:assert/strict';
import { serveExtras, pickPage, weakProfile, weeklyText, FREE_RUNS_PER_IP } from '../src/lib/free-extras.mjs';

function fakeStore(checks) {
  const extras = new Map(); const events = [];
  return {
    events, extras,
    async loadCheck(id) { return checks[id] || null; },
    async getExtras(id) { return extras.get(id) || null; },
    async recentDoneForDomain(domain, since, exceptId) {
      for (const [id, e] of extras) if (id !== exceptId && e.domain === domain && e.status === 'done' && Date.parse(e.updated_at) >= since) return { check_id: id, payload: e.payload };
      return null;
    },
    async countRuns(ipHash, since) { return events.filter((x) => x.kind === 'run' && x.ipHash === ipHash && x.at >= since).length; },
    async claim(id, domain) { const e = extras.get(id); if (e?.status === 'running') return false; extras.set(id, { check_id: id, domain, status: 'running', updated_at: new Date(clock.now).toISOString() }); return true; },
    async saveExtras(id, domain, status, payload, cost) { extras.set(id, { check_id: id, domain, status, payload, cost, updated_at: new Date(clock.now).toISOString() }); },
    async log(e) { events.push({ ...e, at: clock.now }); },
    async costSince(since) { return events.filter((x) => x.at >= since).reduce((a, x) => a + (x.cost || 0), 0); },
    async hasEvent(kind, since) { return events.some((x) => x.kind === kind && x.at >= since); },
  };
}
const clock = { now: Date.parse('2026-09-26T12:00:00Z') };
const calls = { profile: 0, ask: 0, fix: 0 };
const W = {
  async metered(fn) { const result = await fn(); return { result, calls: [{ model: 'gpt-5.4-nano', search: 1 }, { model: 'gpt-5.4-mini', search: 0 }], cost: 0.06 }; },
  async deriveProfile(url, { hint }) { calls.profile += 1; return url.includes('vague') && !hint ? { brand: 'Vague', category: '', questions: [] } : { brand: 'Acme', category: hint || 'dentist', city: 'Bristol', questions: ['q1?', 'q2?', 'q3?'] }; },
  async askParallel(qs) { calls.ask += 1; return qs.map((q) => ({ question: q, names: ['Rival'], named: false })); },
  async buildFix() { calls.fix += 1; return { a: 'Add this right below the H1 of /, as its first paragraph.', x: 'Acme treats 40 patients a day in Bristol.', n: [] }; },
  async classifyWeek() { return {}; },
  summarise(answers) { return { asked: answers.length, named: 0, competitors: [{ name: 'Rival', times: 3 }], rows: answers.map((a) => ({ question: a.question, named: false, comp: ['Rival'], other: [], unclear: [] })) }; },
};
const sample = [{ url: 'https://acme.test/', answerFirst: false, h1: 'Acme' }];
const checks = {};
for (let k = 1; k <= 8; k += 1) checks[`c${k}`] = { id: `c${k}`, domain: `site${k}.test`, payload: { url: `https://site${k}.test/`, sample } };
checks.same1 = { id: 'same1', domain: 'same.test', payload: { url: 'https://same.test/', sample } };
checks.same2 = { id: 'same2', domain: 'same.test', payload: { url: 'https://same.test/', sample } };
checks.vague = { id: 'vague', domain: 'vague.test', payload: { url: 'https://vague.test/', sample } };
const store = fakeStore(checks);
let alerts = 0;
const deps = (over = {}) => ({ store, W, verifyTurnstile: async (t) => t === 'ok', hashIp: (ip) => `h:${ip}`, sendAlert: async () => { alerts += 1; }, now: clock.now, ...over });

// Три прогона с одного адреса проходят, четвёртый не трогает ChatGPT.
for (let k = 1; k <= FREE_RUNS_PER_IP; k += 1) assert.equal((await serveExtras({ checkId: `c${k}`, token: 'ok', ip: '1.1.1.1' }, deps())).status, 'done', `прогон ${k}`);
const before = { ...calls };
const fourth = await serveExtras({ checkId: 'c4', token: 'ok', ip: '1.1.1.1' }, deps());
assert.equal(fourth.status, 'limit');
assert.deepEqual(calls, before, '4-я проверка с одного IP за сутки не запускает запрос к ChatGPT');
// Другой адрес работает; сутки спустя тот же адрес снова работает.
assert.equal((await serveExtras({ checkId: 'c5', token: 'ok', ip: '2.2.2.2' }, deps())).status, 'done');
clock.now += 24 * 3600e3 + 1000;
assert.equal((await serveExtras({ checkId: 'c6', token: 'ok', ip: '1.1.1.1' }, deps())).status, 'done', 'через сутки лимит обнулился');

// Тот же домен за сутки: сохранённое, без запросов и без попытки.
assert.equal((await serveExtras({ checkId: 'same1', token: 'ok', ip: '3.3.3.3' }, deps())).status, 'done');
const b2 = { ...calls }; const runsBefore = store.events.filter((x) => x.kind === 'run').length;
const again = await serveExtras({ checkId: 'same2', token: '', ip: '3.3.3.3' }, deps());
assert.equal(again.status, 'done'); assert.equal(again.payload.reusedFrom, 'same1');
assert.deepEqual(calls, b2, 'повтор домена за сутки не спрашивает ChatGPT');
assert.equal(store.events.filter((x) => x.kind === 'run').length, runsBefore, 'и не тратит попытку');

// Уже готовый результат этой же проверки отдаётся без запросов.
const b3 = { ...calls };
assert.equal((await serveExtras({ checkId: 'same1', token: '', ip: '9.9.9.9' }, deps())).status, 'done');
assert.deepEqual(calls, b3);

// Turnstile не пройден: ChatGPT не трогаем.
const b4 = { ...calls };
assert.equal((await serveExtras({ checkId: 'c7', token: 'bad', ip: '4.4.4.4' }, deps())).status, 'blocked');
assert.deepEqual(calls, b4);

// Сайт не сказал, что продаёт: спрашиваем одним полем, вопросов ChatGPT нет; после ответа прогон идёт.
const b5 = { ...calls };
const needs = await serveExtras({ checkId: 'vague', token: 'ok', ip: '5.5.5.5' }, deps());
assert.equal(needs.status, 'needs'); assert.equal(calls.ask, b5.ask, 'без ниши вопросы не задаются');
const withSell = await serveExtras({ checkId: 'vague', token: 'ok', ip: '5.5.5.5', sell: 'dentist, Bristol' }, deps());
assert.equal(withSell.status, 'done'); assert.equal(withSell.payload.profile.category, 'dentist, Bristol');

// Оповещение одно в сутки, когда расход за сутки больше $20; проверки не останавливаются.
store.events.push({ kind: 'run', cost: 25, at: clock.now, ipHash: 'x' });
assert.equal((await serveExtras({ checkId: 'c8', token: 'ok', ip: '6.6.6.6' }, deps())).status, 'done');
assert.equal(alerts, 1, 'письмо о перерасходе ушло');
checks.c9 = { id: 'c9', domain: 'site9.test', payload: { url: 'https://site9.test/', sample } };
assert.equal((await serveExtras({ checkId: 'c9', token: 'ok', ip: '7.7.7.7' }, deps())).status, 'done');
assert.equal(alerts, 1, 'второе письмо за те же сутки не уходит');

// Выбор страницы: главная в приоритете, служебные мимо.
assert.equal(pickPage([{ url: 'https://a.test/terms/', answerFirst: false }, { url: 'https://a.test/about/', answerFirst: false }, { url: 'https://a.test/', answerFirst: false }]).path, '/');
assert.equal(pickPage([{ url: 'https://a.test/privacy-policy/', answerFirst: false }, { url: 'https://a.test/services/', answerFirst: false }]).path, '/services/');
assert.equal(pickPage([{ url: 'https://a.test/', answerFirst: true }]), null, 'все страницы с коротким ответом: блока нет');
assert.equal(pickPage([{ url: 'https://a.test/contact/', answerFirst: false }]), null);
assert.equal(weakProfile({ category: '', questions: ['a'] }), true);

// Сводка.
const text = weeklyText([{ kind: 'run', n: 10, cost: 0.7, calls: 60, searches: 30 }, { kind: 'reuse', n: 4 }, { kind: 'limit', n: 2 }], { from: Date.parse('2026-09-21'), to: Date.parse('2026-09-28') });
assert.match(text, /Прогонов с запросами к ChatGPT: 10\./); assert.match(text, /\$0\.070 на прогон/); assert.doesNotMatch(text, /[—–]/);
console.log('test-free-extras: ok');
