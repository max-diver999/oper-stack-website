/**
 * Есть ли куда доставить письмо по этому адресу.
 *
 * Простым языком: перед отправкой спрашиваем у DNS, существует ли вообще почта на этом домене.
 * Опечатка вроде gmial.com или служебное имя вроде example.test принимают письмо нигде, зато
 * отказ доставки бьёт по репутации нашего домена, и следующие письма живым людям уезжают в спам.
 * Двенадцатого и тринадцатого сентября девять таких отказов мы сделали себе сами тестовыми
 * прогонами; здесь стоит заслон, чтобы это не повторилось ни на тесте, ни на опечатке покупателя.
 *
 * Судим только тогда, когда DNS ответил определённо. Если сеть подвела, письмо уходит: потерять
 * покупателя из-за своей же неудачной проверки хуже, чем один отказ доставки.
 */
import { promises as dns } from 'node:dns';

/** Имена, которые стандарт держит под примеры и тесты: почты там не бывает по определению. */
const RESERVED_TLD = /\.(test|invalid|example|localhost)$/i;
const RESERVED_NAME = /^(example\.(com|org|net)|localhost)$/i;

type Answer = { found: boolean; sure: boolean };

/** ENOTFOUND это «домена нет», ENODATA это «домен есть, таких записей нет». Оба ответа точные. */
async function look(fn: () => Promise<unknown[]>): Promise<Answer> {
  try {
    const rows = await fn();
    return { found: Array.isArray(rows) && rows.length > 0, sure: true };
  } catch (e: unknown) {
    const code = String((e as { code?: string })?.code || '');
    if (code === 'ENOTFOUND' || code === 'ENODATA') return { found: false, sure: true };
    return { found: false, sure: false };
  }
}

/**
 * Домены-обманки. gmial.com, gmai.com и yandx.ru кто-то зарегистрировал нарочно, они существуют
 * и DNS их пропускает, а письмо там не прочитает никто. Сверяем только с теми почтовиками, где
 * действительно сидят наши покупатели, и только на расстоянии одной ошибки: так «yandex.ru» и
 * «yandexx.ru» различаются, а чей-то настоящий домен под раздачу не попадает.
 */
const PROVIDERS = ['gmail.com', 'yandex.ru', 'yandex.com', 'ya.ru', 'mail.ru', 'inbox.ru', 'bk.ru',
  'list.ru', 'rambler.ru', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'me.com',
  'yahoo.com', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.net', 'web.de', 'aol.com',
  'zoho.com', 'fastmail.com', 'ukr.net', 'i.ua', 'qq.com', '163.com',
  // mail.com это настоящий почтовик, а не опечатка gmail.com: без него он попадал под нож.
  'mail.com'];

/** Отличается ли одно имя от другого ровно одной правкой: буквой вставленной, убранной или другой. */
function oneEditApart(a: string, b: string): boolean {
  if (a === b) return false;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  if (l.length - s.length > 1) return false;
  let i = 0; let j = 0; let edits = 0;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (s.length === l.length) { i++; j++; } else { j++; }
  }
  return edits + (l.length - j) + (s.length - i) === 1;
}

/** Переставленные местами соседние буквы: gmial вместо gmail, самая частая опечатка вообще. */
function swappedNeighbours(a: string, b: string): boolean {
  if (a.length !== b.length || a === b) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (i + 1 >= a.length || a[i] !== b[i + 1] || a[i + 1] !== b[i]) return false;
  return a.slice(i + 2) === b.slice(i + 2);
}

function lookalike(domain: string): string | null {
  // Сам почтовик опечаткой быть не может, даже если похож на соседа по списку.
  if (PROVIDERS.includes(domain)) return null;
  for (const p of PROVIDERS) if (oneEditApart(domain, p) || swappedNeighbours(domain, p)) return p;
  return null;
}

export type Deliverable = { ok: true } | { ok: false; why: string };

export async function canReceiveMail(address: string): Promise<Deliverable> {
  const at = String(address || '').lastIndexOf('@');
  if (at < 1 || at === String(address).length - 1) return { ok: false, why: 'that does not look like an email address' };
  const domain = String(address).slice(at + 1).trim().toLowerCase();
  if (!domain || /\s/.test(domain) || !domain.includes('.')) return { ok: false, why: `the address has no domain: ${address}` };
  if (RESERVED_TLD.test(domain) || RESERVED_NAME.test(domain)) {
    return { ok: false, why: `${domain} is a name the standard reserves for examples, no mailbox lives there` };
  }

  const near = lookalike(domain);
  if (near) return { ok: false, why: `${domain} looks like a typo, you probably meant ${near}` };

  const mx = await look(() => dns.resolveMx(domain));
  if (mx.found) return { ok: true };
  if (!mx.sure) return { ok: true };

  // Без MX почту принимает сам хост домена, если он существует: так велит RFC 5321.
  const v4 = await look(() => dns.resolve4(domain));
  if (v4.found || !v4.sure) return { ok: true };
  const v6 = await look(() => dns.resolve6(domain));
  if (v6.found || !v6.sure) return { ok: true };

  return { ok: false, why: `${domain} has neither a mail server nor an address` };
}
