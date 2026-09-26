/**
 * Маскировка почты, сайтов и токенов во всём, что скрипт печатает.
 *
 * Простым языком. Репозиторий открытый, и логи его прогонов на GitHub видит любой. А скрипты по
 * работе печатают, кому ушло письмо и чей сайт разобран. 18.09.2026 первый открытый репозиторий
 * пришлось закрыть именно из-за этого: в логах лежали адреса покупателей. Здесь каждая строка
 * проходит через фильтр до того, как попасть в лог, и адрес превращается в метку вида
 * `[почта:3f9a1c]`. Метка одна и та же для одного адреса, так что отладке её хватает: видно, что
 * это тот же человек, что и в прошлом прогоне. Узнать по ней человека нельзя.
 *
 * Что закрывается:
 *   почта целиком, вместе с доменом (по домену узнаётся компания);
 *   имя отправителя в виде `Имя <адрес>`;
 *   любой сайт, кроме наших и служебных, в ссылке и голым именем;
 *   параметры и якорь ЛЮБОЙ ссылки, включая наши: в `?t=` лежит почта в base64;
 *   длинные токены и всё, что начинается с `eyJ` (так выглядит base64 от JSON).
 *
 * Подключается первой строкой импорта в каждом скрипте, который запускает расписание. Дочерние
 * процессы, которые печатают прямо в лог, это наши же скрипты, и у них та же первая строка. Вывод
 * пакета аудита идёт через console того же процесса и поэтому тоже проходит через фильтр.
 *
 * Своих доменов, кроме oper-stack, здесь нет намеренно: второй бренд владельца не должен
 * проявляться в открытом коде, даже как исключение из маскировки.
 */
import { createHash } from 'node:crypto';
import { format, inspect } from 'node:util';

const KEEP = [
  'oper-stack.com', 'oper-stack.ru',
  'github.com', 'githubusercontent.com', 'githubassets.com',
  'google.com', 'googleapis.com', 'gmail.com', 'googlemail.com',
  'resend.com', 'whop.com', 'npmjs.org', 'npmjs.com', 'telegram.org', 'apify.com',
  'schema.org', 'w3.org', 'vercel.com', 'vercel.app',
  'yandex.ru', 'mail.ru', 'ya.ru',
];
const EXAMPLE = /(^|\.)example(\.[a-z]{2,})?$/i;
const FILE = /\.(m?js|cjs|ts|json|pdf|png|jpe?g|webp|svg|html?|ya?ml|md|txt|csv|zip|css|map|lock|log|xml|sh)$/i;

const keepHost = (host) => {
  const h = String(host).toLowerCase().replace(/\.$/, '');
  return EXAMPLE.test(h) || KEEP.some((k) => h === k || h.endsWith(`.${k}`));
};
const tag = (kind, v) => `[${kind}:${createHash('sha256').update(String(v).toLowerCase()).digest('hex').slice(0, 6)}]`;

const NAMED = /"?([^"<>\n\r]{1,80}?)"?\s*<([^<>\s@]+@[^<>\s]+)>/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const URLS = /\bhttps?:\/\/[^\s"'<>`)\]]+/gi;
const HOST = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi;
const JWTISH = /\beyJ[A-Za-z0-9_\-.]{6,}/g;
const LONGTOKEN = /\b[A-Za-z0-9_-]{40,}\b/g;

export function redact(input) {
  let s = String(input);
  s = s.replace(NAMED, (_m, _name, addr) => `[отправитель] <${tag('почта', addr)}>`);
  s = s.replace(EMAIL, (m) => tag('почта', m));
  s = s.replace(URLS, (m) => {
    let u;
    try { u = new URL(m); } catch { return tag('адрес', m); }
    const tail = (u.search || u.hash) ? '?[скрыто]' : '';
    return keepHost(u.hostname) ? `${u.protocol}//${u.hostname}${u.pathname}${tail}` : `${tag('сайт', u.hostname)}${tail}`;
  });
  s = s.replace(JWTISH, '[токен]');
  s = s.replace(LONGTOKEN, '[токен]');
  s = s.replace(HOST, (m) => (keepHost(m) || FILE.test(m) ? m : tag('сайт', m)));
  return s;
}

/** Строка так, как её напечатал бы сам console, и только потом фильтр. */
const render = (args) => redact(format(...args));

if (!globalThis.__operstackRedacted) {
  globalThis.__operstackRedacted = true;
  for (const method of ['log', 'info', 'warn', 'error', 'debug', 'trace']) {
    const original = console[method].bind(console);
    console[method] = (...args) => original(render(args));
  }
  console.dir = (obj, opts) => console.log(inspect(obj, { depth: 4, ...(opts || {}) }));
  console.table = (data) => console.log(inspect(data, { depth: 3 }));
}
