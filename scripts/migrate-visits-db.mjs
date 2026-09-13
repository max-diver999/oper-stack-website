#!/usr/bin/env node
/**
 * Schema for the AI visit counter used by sites that are not on WordPress.
 *
 * WordPress keeps its numbers in the owner's own database and never touches this one. Everywhere
 * else the snippet has nowhere to write, so it posts to us and we hold the counts here.
 *
 * What is stored: a site key, its domain, the name of the assistant, a day and a number. No visitor
 * identifier, no address, no page. That is deliberate and it is what the page promises the owner.
 *
 * Safe to run repeatedly: every statement is guarded.
 *   node scripts/migrate-visits-db.mjs          # apply
 *   node scripts/migrate-visits-db.mjs --check  # report only, change nothing
 */
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** The connection string comes from Vercel at runtime and from .secrets on this machine. */
function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const local = join(__dirname, '../../.secrets/neon-operstack-visits.env');
  try {
    for (const line of readFileSync(local, 'utf8').split('\n')) {
      if (!line.startsWith('DATABASE_URL=')) continue;
      return line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    /* falls through to the error below */
  }
  return null;
}

const url = connectionString();
if (!url) {
  console.error('No DATABASE_URL. Set it, or keep .secrets/neon-operstack-visits.env in place.');
  process.exit(1);
}

const sql = neon(url);
const checkOnly = process.argv.includes('--check');

/**
 * One row per site we count for. The id is public: it travels in the snippet on the owner's pages,
 * so it must be unguessable enough that nobody can write into somebody else's row by trying.
 */
const STATEMENTS = [
  [
    'sites table',
    `create table if not exists sites (
       id           text primary key,
       domain       text not null,
       email        text,
       created_at   timestamptz not null default now(),
       last_seen_at timestamptz,
       platform     text
     )`,
  ],
  ['sites domain index', 'create index if not exists sites_domain_idx on sites (domain)'],
  [
    'visits table',
    `create table if not exists visits (
       site_id   text not null references sites (id) on delete cascade,
       assistant text not null,
       day       date not null,
       hits      integer not null default 0,
       primary key (site_id, assistant, day)
     )`,
  ],
  ['visits lookup index', 'create index if not exists visits_site_day_idx on visits (site_id, day desc)'],
];

async function tableExists(name) {
  const rows = await sql`select to_regclass(${'public.' + name}) as t`;
  return rows[0].t !== null;
}

async function main() {
  if (checkOnly) {
    for (const name of ['sites', 'visits']) {
      console.log(`${name}: ${(await tableExists(name)) ? 'есть' : 'НЕТ'}`);
    }
    const counts = (await tableExists('sites'))
      ? await sql`select (select count(*) from sites) as sites, (select count(*) from visits) as visits`
      : [{ sites: 0, visits: 0 }];
    console.log(`сайтов: ${counts[0].sites}, строк с визитами: ${counts[0].visits}`);
    return;
  }

  for (const [label, statement] of STATEMENTS) {
    await sql.query(statement);
    console.log('ok:', label);
  }
  console.log('схема на месте');
}

main().catch((err) => {
  // Never print the connection string: it carries the password.
  console.error('не удалось:', err.message);
  process.exit(1);
});
