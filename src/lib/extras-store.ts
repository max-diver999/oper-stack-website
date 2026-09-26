/**
 * Где живёт платная часть бесплатной проверки (задание 26.09.2026, п. 2 и 3).
 *
 * check_extras: результат к конкретной проверке (готовый текст и ответы ChatGPT), со статусом:
 * running, done, needs (спросить, что продаёт), error. free_ai_log: журнал каждого шага: прогон,
 * повтор из сохранённого, отсечено лимитом или Turnstile, ошибка, письмо о перерасходе. По журналу
 * считаются три прогона с адреса за сутки, расход за сутки и недельная сводка.
 *
 * Адрес посетителя здесь не хранится: только его отпечаток (sha-256 с солью), по которому можно
 * посчитать прогоны, но нельзя узнать адрес. Та же база, что у сохранённых проверок.
 */
import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';

const CONNECTION = import.meta.env.DATABASE_URL || process.env.DATABASE_URL || '';
const db = () => { if (!CONNECTION) throw new Error('DATABASE_URL is not set'); return neon(CONNECTION); };

let ready = false;
async function ensure() {
  if (ready) return;
  const sql = db();
  await sql`create table if not exists check_extras (
      check_id text primary key, domain text not null, status text not null, payload jsonb,
      cost numeric not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`;
  await sql`create index if not exists check_extras_domain_idx on check_extras (domain, updated_at desc)`;
  await sql`create table if not exists free_ai_log (
      id bigserial primary key, at timestamptz not null default now(), kind text not null, check_id text, domain text,
      ip_hash text, cost numeric not null default 0, calls int not null default 0, searches int not null default 0)`;
  await sql`create index if not exists free_ai_log_ip_idx on free_ai_log (ip_hash, at desc)`;
  await sql`create index if not exists free_ai_log_at_idx on free_ai_log (at desc)`;
  ready = true;
}

const SALT = () => import.meta.env.CRON_SECRET || process.env.CRON_SECRET || import.meta.env.KIT_DOWNLOAD_SECRET || process.env.KIT_DOWNLOAD_SECRET || 'operstack-free-check';
export const hashIp = (ip: string): string => (ip ? createHash('sha256').update(`${SALT()}:${ip}`).digest('hex').slice(0, 32) : 'unknown');

export type Extras = { check_id: string; domain: string; status: string; payload: any; cost: number; updated_at: string };

export async function getExtras(checkId: string): Promise<Extras | null> {
  if (!CONNECTION) return null;
  try {
    await ensure();
    const rows = (await db()`select check_id, domain, status, payload, cost, updated_at from check_extras where check_id = ${checkId} limit 1`) as any[];
    return rows[0] || null;
  } catch { return null; }
}

export const extrasStore = {
  async getExtras(checkId: string) { return getExtras(checkId); },
  async recentDoneForDomain(domain: string, since: number, exceptId: string) {
    await ensure();
    const rows = (await db()`select check_id, payload from check_extras
      where domain = ${domain} and status = 'done' and check_id <> ${exceptId} and updated_at >= ${new Date(since).toISOString()}
      order by updated_at desc limit 1`) as any[];
    return rows[0] || null;
  },
  async countRuns(ipHash: string, since: number) {
    await ensure();
    const rows = (await db()`select count(*)::int as n from free_ai_log where kind = 'run' and ip_hash = ${ipHash} and at >= ${new Date(since).toISOString()}`) as any[];
    return rows[0]?.n || 0;
  },
  /** Занять проверку под прогон: второй одновременный запрос получает false и ждёт готового. */
  async claim(checkId: string, domain: string) {
    await ensure();
    const rows = (await db()`insert into check_extras (check_id, domain, status) values (${checkId}, ${domain}, 'running')
      on conflict (check_id) do update set status = 'running', updated_at = now()
      where check_extras.status in ('error', 'needs') or (check_extras.status = 'running' and check_extras.updated_at < now() - interval '3 minutes')
      returning check_id`) as any[];
    return rows.length > 0;
  },
  async saveExtras(checkId: string, domain: string, status: string, payload: any, cost: number) {
    await ensure();
    await db()`insert into check_extras (check_id, domain, status, payload, cost) values (${checkId}, ${domain}, ${status}, ${JSON.stringify(payload)}, ${cost})
      on conflict (check_id) do update set status = excluded.status, payload = excluded.payload, cost = excluded.cost, updated_at = now()`;
  },
  async log(e: { kind: string; checkId?: string; domain?: string; ipHash?: string; cost?: number; calls?: number; searches?: number }) {
    try {
      await ensure();
      await db()`insert into free_ai_log (kind, check_id, domain, ip_hash, cost, calls, searches)
        values (${e.kind}, ${e.checkId || null}, ${e.domain || null}, ${e.ipHash || null}, ${e.cost || 0}, ${e.calls || 0}, ${e.searches || 0})`;
    } catch { /* журнал не роняет проверку */ }
  },
  async costSince(since: number) {
    await ensure();
    const rows = (await db()`select coalesce(sum(cost), 0)::float as usd from free_ai_log where at >= ${new Date(since).toISOString()}`) as any[];
    return Number(rows[0]?.usd || 0);
  },
  async hasEvent(kind: string, since: number) {
    await ensure();
    const rows = (await db()`select 1 from free_ai_log where kind = ${kind} and at >= ${new Date(since).toISOString()} limit 1`) as any[];
    return rows.length > 0;
  },
  async weekly(since: number) {
    await ensure();
    return (await db()`select kind, count(*)::int as n, coalesce(sum(cost), 0)::float as cost, coalesce(sum(calls), 0)::int as calls, coalesce(sum(searches), 0)::int as searches
      from free_ai_log where at >= ${new Date(since).toISOString()} group by kind`) as any[];
  },
};
