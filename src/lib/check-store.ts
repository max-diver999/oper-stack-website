/**
 * Где живут результаты бесплатной проверки.
 *
 * Простым языком. До сих пор результат показывался на той же странице и исчезал вместе с вкладкой.
 * Его нельзя было положить в закладки, переслать разработчику или показать через неделю, чтобы
 * сравнить. И, главное, человеку с хорошим баллом нечем было похвастаться у себя на сайте.
 *
 * Теперь у каждой проверки свой адрес: /result/<id>/ показывает её же, а /badge/<id>.svg отдаёт
 * картинку с баллом, которую владелец вставляет к себе. Каждая такая вставка это живая ссылка на
 * нас, и она обновляется сама, когда человек проверит сайт снова.
 *
 * Что здесь НЕ хранится: ни адрес посетителя, ни что-либо о нём. Только проверенный сайт, балл и
 * сам отчёт, то есть ровно то, что человек и так видел на экране и сам решил сохранить.
 *
 * Таблица создаётся сама при первом обращении: отдельного шага установки нет намеренно, иначе
 * однажды выложим код и забудем создать таблицу.
 */
import { neon } from '@neondatabase/serverless';

const CONNECTION = import.meta.env.DATABASE_URL || process.env.DATABASE_URL || '';

export function checkStoreConfigured(): boolean {
  return Boolean(CONNECTION);
}

function db() {
  if (!CONNECTION) throw new Error('DATABASE_URL is not set');
  return neon(CONNECTION);
}

/** Короткий адрес без похожих друг на друга букв: его диктуют голосом и переписывают руками. */
export function newCheckId(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

let ready = false;
async function ensure() {
  if (ready) return;
  const sql = db();
  await sql`
    create table if not exists checks (
      id text primary key,
      domain text not null,
      score int not null,
      lang text not null default 'en',
      payload jsonb not null,
      created_at timestamptz not null default now()
    )`;
  await sql`create index if not exists checks_domain_idx on checks (domain, created_at desc)`;
  await sql`create index if not exists checks_recent_idx on checks (created_at desc)`;
  ready = true;
}

export type StoredCheck = {
  id: string;
  domain: string;
  score: number;
  lang: string;
  payload: any;
  created_at: string;
};

/** Сохранить результат. Возвращает адрес, по которому он теперь живёт. */
export async function saveCheck(domain: string, score: number, lang: string, payload: any): Promise<string | null> {
  if (!checkStoreConfigured()) return null;
  try {
    await ensure();
    const id = newCheckId();
    await db()`insert into checks (id, domain, score, lang, payload) values (${id}, ${domain}, ${score}, ${lang}, ${JSON.stringify(payload)})`;
    return id;
  } catch {
    // Проверка важнее её сохранения: если база недоступна, человек всё равно видит свой результат.
    return null;
  }
}

export async function loadCheck(id: string): Promise<StoredCheck | null> {
  if (!checkStoreConfigured()) return null;
  try {
    await ensure();
    const rows = (await db()`select id, domain, score, lang, payload, created_at from checks where id = ${id} limit 1`) as any[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

/** Последний балл домена: им живёт значок, чтобы обновляться сам при новой проверке. */
export async function latestForDomain(domain: string): Promise<StoredCheck | null> {
  if (!checkStoreConfigured()) return null;
  try {
    await ensure();
    const rows = (await db()`select id, domain, score, lang, payload, created_at from checks where domain = ${domain} order by created_at desc limit 1`) as any[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

/**
 * Лента последних проверок для страницы «кого проверяли». Показываем только домен, балл и дату:
 * это те же данные, что видны в значке на чужом сайте, ничего сверх.
 */
export async function recentChecks(limit = 20): Promise<{ id: string; domain: string; score: number; created_at: string }[]> {
  if (!checkStoreConfigured()) return [];
  try {
    await ensure();
    return (await db()`
      select distinct on (domain) id, domain, score, created_at
      from checks order by domain, created_at desc limit ${limit}`) as any[];
  } catch {
    return [];
  }
}
