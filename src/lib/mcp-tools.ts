/**
 * The tools OperStack offers to any assistant, over MCP.
 *
 * Same measurement code as the site and the paid reports, so a number a tool reports here and a
 * number on a page can never disagree. Nothing here needs an account, except the one tool that
 * reads somebody's own visit counter, and that one is unlocked by their own private token.
 */
import { VISIBILITY_DEFAULTS, checkVisibility } from '@operstack/audit';
import { checkLlms } from './llms-check';
import { visitsDb, visitsDbConfigured } from './visits-db';
import { snippetInstalled } from './visits-install';

export type McpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (args: Record<string, any>) => Promise<string>;
};

/**
 * Адрес, как его написал человек, приведённый к корню сайта.
 *
 * Люди пишут адрес как придётся: «oper-stack.com», «www.oper-stack.com», со страницей внутри,
 * а иногда прямо ссылку на сам файл. До 16.09.2026 здесь была только обрезка пробелов, и
 * check_llms_txt отвечал «файла нет» на сайте, где файл есть, на любом написании кроме
 * «https://домен/». Живой пользователь потерял на этом время и написал нам об этом первым же
 * отзывом. Разбирать написание это наша работа, а не его.
 *
 * Если разобрать не вышло, отдаём как есть: пусть решает движок, он умеет больше.
 */
const site = (s: unknown): string => {
  const raw = String(s ?? '').trim();
  if (!raw) return raw;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return raw;
  }
};

/** Assistants read text far better than they read our JSON, so every tool answers in sentences. */
function visibilityReport(r: any): string {
  if (!r || r.ok === false) return r?.error || 'That site could not be read.';
  const lines: string[] = [];
  lines.push(`${r.host}: ${r.score}/100 (grade ${r.grade}).`);
  lines.push('');
  for (const a of r.areas || []) {
    lines.push(`${a.label}: ${a.score == null ? 'not measured' : `${a.score}/${a.max}`}`);
    for (const f of a.findings || []) {
      const mark = f.level === 'pass' ? 'ok' : f.level === 'warn' ? 'partial' : 'problem';
      lines.push(`  [${mark}] ${f.text}`);
    }
  }
  if (r.fixes?.length) {
    lines.push('');
    lines.push('Fix these first:');
    r.fixes.forEach((f: any, i: number) => lines.push(`  ${i + 1}. ${f.area}. ${f.text}`));
  }
  lines.push('');
  lines.push(
    r.sitemap?.found
      ? `Sitemap: ${r.sitemap.count} URLs${r.sitemap.lastmod ? ', dated' : ', no dates'}.`
      : 'Sitemap: not found at the usual paths or in robots.txt.',
  );
  return lines.join('\n');
}

export const TOOLS: McpTool[] = [
  {
    name: 'audit_site',
    title: 'Score a site for AI visibility',
    description:
      'Scores any public site out of 100 on the five things an answer engine needs before it will quote a page: whether AI crawlers are allowed in, whether there is a map for agents (llms.txt), whether the entity is clear from schema, whether there is anything quotable, and whether pages carry dates and sources. Reads public signals only, takes about ten seconds, and needs no account.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'A public site address, for example example.com' } },
      required: ['url'],
    },
    run: async (a) => visibilityReport(await checkVisibility(site(a.url), { ...VISIBILITY_DEFAULTS, lang: 'en' })),
  },
  {
    name: 'compare_sites',
    title: 'Compare sites on the same scale',
    description:
      'Runs the same AI-visibility scoring on two to four sites and returns them side by side, so a score means something. Use it to see where a site is losing answers to a rival, area by area.',
    inputSchema: {
      type: 'object',
      properties: {
        urls: { type: 'array', items: { type: 'string' }, description: 'Two to four public site addresses' },
      },
      required: ['urls'],
    },
    run: async (a) => {
      const urls: string[] = (Array.isArray(a.urls) ? a.urls : []).map(site).filter(Boolean).slice(0, 4);
      if (urls.length < 2) return 'Give at least two site addresses.';
      const results = await Promise.all(urls.map((u) => checkVisibility(u, { ...VISIBILITY_DEFAULTS, lang: 'en' })));
      const good = results.filter((r: any) => r && r.ok !== false);
      if (!good.length) return 'None of those sites could be read. They may turn away automated readers.';
      const labels = good[0].areas.map((x: any) => x.label);
      const rows = good.map((r: any) => {
        const cells = r.areas.map((x: any) => (x.score == null ? 'not measured' : `${x.score}/${x.max}`)).join('  ');
        return `${r.host.padEnd(28)} ${String(r.score).padStart(3)}   ${cells}`;
      });
      const failed = results.filter((r: any) => !r || r.ok === false).length;
      return [
        `Areas, in order: ${labels.join(' | ')}`,
        '',
        `${'site'.padEnd(28)} score  areas`,
        ...rows,
        failed ? `\n${failed} site(s) could not be read.` : '',
      ].join('\n');
    },
  },
  {
    name: 'check_llms_txt',
    title: 'Check the map a site offers to machines',
    description:
      'Reads a site llms.txt, the file that tells an assistant which pages matter, and follows its links to see whether they still lead anywhere. A map full of dead links is worse than no map.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'A public site address' } },
      required: ['url'],
    },
    run: async (a) => {
      const r: any = await checkLlms(site(a.url), { budgetMs: 12000 });
      if (!r || r.found === false) return `No llms.txt found on ${site(a.url)}.`;
      const lines = [`llms.txt on ${r.host ?? site(a.url)}: ${r.links?.length ?? 0} link(s).`];
      for (const f of r.findings || []) lines.push(`  [${f.level}] ${f.message}`);
      const broken = (r.links || []).filter((l: any) => l.status && l.status >= 400);
      if (broken.length) {
        lines.push('', 'Links that no longer lead anywhere:');
        for (const l of broken.slice(0, 20)) lines.push(`  ${l.status} ${l.url}`);
      }
      return lines.join('\n');
    },
  },
  {
    name: 'ai_visits',
    title: 'Read your own AI visit counter',
    description:
      'Reports how many visits each AI assistant sent to a site that runs the free OperStack counter. Needs the private token from the counter link, which only the site owner has. Nothing about individual visitors is stored or returned.',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'The private token from your counter link (the part after t=)' },
        days: { type: 'number', description: 'How many days back to report. Default 90.' },
      },
      required: ['token'],
    },
    run: async (a) => {
      if (!visitsDbConfigured()) return 'The counter is not switched on.';
      const token = site(a.token).replace(/^.*[?&]t=/, '');
      if (!/^[a-z0-9]{20,64}$/.test(token)) return 'That does not look like a counter token.';
      const days = Math.min(Math.max(Number(a.days) || 90, 1), 365);
      const sql = visitsDb();
      const s = await sql`select id, domain from sites where view_token = ${token} limit 1`;
      if (!s.length) return 'That token does not open anything.';
      const rows = await sql`
        select assistant, sum(hits)::int as hits from visits
        where site_id = ${s[0].id} and day >= current_date - ${days}::int
        group by assistant order by hits desc`;
      const total = rows.reduce((n: number, r: any) => n + r.hits, 0);
      if (!total) return `${s[0].domain}: nothing counted in the last ${days} days.`;
      return [
        `${s[0].domain}: ${total} visit(s) from AI assistants in the last ${days} days.`,
        ...rows.map((r: any) => `  ${r.assistant}: ${r.hits}`),
      ].join('\n');
    },
  },
  {
    name: 'check_counter_installed',
    title: 'Is the visit counter actually on the site',
    description:
      'Looks at a site page and says whether the OperStack visit counter line is really there, including the case where it is there carrying a different key. Use it when a counter reports nothing and the owner does not know why.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'The site to look at' },
        key: { type: 'string', description: 'The site key from the snippet, starting osv_' },
      },
      required: ['domain', 'key'],
    },
    run: async (a) => {
      const domain = site(a.domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const state = await snippetInstalled(domain, site(a.key));
      if (state.installed === true) return `The counter line is on ${domain} and carries that key.`;
      if (state.wrongKey) return `The counter line is on ${domain} but carries a different key, so the visits are counted somewhere else.`;
      if (state.installed === false) return `The counter line is not on ${domain}.`;
      return `Could not look at ${domain}: ${state.reason}`;
    },
  },
];

export const TOOL_LIST = TOOLS.map((t) => ({
  name: t.name,
  title: t.title,
  description: t.description,
  inputSchema: t.inputSchema,
}));
