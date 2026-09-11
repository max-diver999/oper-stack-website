#!/usr/bin/env node
/**
 * Markdown renditions for agents.
 *
 * Writes public/<prefix>/<slug>.md for every indexable page in the configured
 * collections, plus public/index.md for the homepage. Vercel then serves these
 * to any client that appends `.md` or sends `Accept: text/markdown`; the routes
 * are injected by scripts/patch-vercel-output.mjs, because the Vercel adapter
 * drops rewrites and headers from vercel.json.
 *
 * It never writes llms.txt. On several sites that file is maintained by hand and
 * already answers 200; check-agent-index.mjs verifies it instead. llms-full.txt is
 * different: it claims to be the whole corpus, so it is rebuilt from the renditions
 * rather than left as a hand-kept link list that drifts.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadConfig, parseFrontmatter, stripJsx, renderFaq, isoDay } from './lib.mjs';

const cfg = loadConfig();
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONTENT_DIR = path.join(ROOT, 'src/content');

function buildPage({ fm, faq, body, canonical, label }) {
  const head = [
    `# ${fm.title || 'Untitled'}`,
    '',
    fm.description ? `> ${fm.description}` : null,
    '',
    `**Source:** ${canonical}  `,
    label ? `**Section:** ${label}  ` : null,
    fm.author ? `**Author:** ${fm.author}  ` : null,
    isoDay(fm.pubDate) ? `**Published:** ${isoDay(fm.pubDate)}  ` : null,
    isoDay(fm.updatedDate || fm.pubDate) ? `**Updated:** ${isoDay(fm.updatedDate || fm.pubDate)}` : null,
    '',
    '---',
    '',
  ].filter((x) => x !== null).join('\n');

  const answer = fm.answer ? `${fm.answer}\n\n` : '';
  const tail = faq.length ? `\n${renderFaq(faq)}` : '';
  return `${head}\n${answer}${body}\n${tail}`;
}

async function processCollection(col) {
  const srcDir = path.join(CONTENT_DIR, col.dir);
  const outDir = path.join(PUBLIC_DIR, col.dir);
  let files;
  try {
    files = await fs.readdir(srcDir);
  } catch {
    return [];
  }
  await fs.mkdir(outDir, { recursive: true });

  const entries = [];
  for (const file of files) {
    if (!/\.mdx?$/.test(file)) continue;
    const slug = file.replace(/\.mdx?$/, '');
    const raw = await fs.readFile(path.join(srcDir, file), 'utf8');
    const { fm, faq, body } = parseFrontmatter(raw);
    if (fm.noindex === 'true' || fm.draft === 'true') continue;

    const canonical = `${cfg.siteUrl}${col.urlPrefix}/${slug}/`;
    const md = buildPage({ fm, faq, body: stripJsx(body), canonical, label: col.label });
    await fs.writeFile(path.join(outDir, `${slug}.md`), md, 'utf8');

    entries.push({
      slug,
      title: fm.title || slug,
      description: fm.description || '',
      url: canonical,
      mdUrl: `${cfg.siteUrl}${col.urlPrefix}/${slug}.md`,
      updated: isoDay(fm.updatedDate || fm.pubDate),
    });
  }
  entries.sort((a, b) => a.title.localeCompare(b.title));
  return entries;
}

async function writeHomepage(perCollection) {
  const p = cfg.contentPolicy || {};
  const lines = [];
  lines.push(`# ${cfg.title}${cfg.tagline ? `: ${cfg.tagline}` : ''}`);
  lines.push('');
  if (cfg.summary) lines.push(`> ${cfg.summary}`, '');
  if (cfg.entity) lines.push(`**Entity:** ${cfg.entity}`, '');
  lines.push(`**Homepage:** ${cfg.siteUrl}/  `);
  if (cfg.contact?.page) lines.push(`**Contact:** ${cfg.siteUrl}${cfg.contact.page}  `);
  if (cfg.contact?.email) lines.push(`**Email:** ${cfg.contact.email}  `);
  if (cfg.contact?.telegram) lines.push(`**Telegram:** ${cfg.contact.telegram}  `);
  lines.push(`**Sitemap:** ${cfg.siteUrl}/sitemap-index.xml  `);
  lines.push(`**Agent index:** ${cfg.siteUrl}/llms.txt  `);
  lines.push(`**Full corpus:** ${cfg.siteUrl}/llms-full.txt  `);
  lines.push(`**Agent card:** ${cfg.siteUrl}/.well-known/agent.json`);
  lines.push('');

  if (cfg.keyPages?.length) {
    lines.push('## Key pages', '');
    for (const k of cfg.keyPages) lines.push(`- [${k.label}](${cfg.siteUrl}${k.url})`);
    lines.push('');
  }

  for (const { col, entries } of perCollection) {
    if (!entries.length) continue;
    lines.push(`## ${col.label}`, '');
    lines.push(`Index: ${cfg.siteUrl}${col.urlPrefix}/`, '');
    for (const e of entries) {
      const desc = e.description ? `: ${e.description}` : '';
      lines.push(`- [${e.title}](${e.mdUrl})${desc}`);
    }
    lines.push('');
  }

  lines.push('## Content policy for AI agents', '');
  lines.push(`- Citation in AI search and retrieval is permitted (Content-Signal: \`search=${p.search ?? 'yes'}, ai-input=${p.aiInput ?? 'yes'}\`).`);
  lines.push(`- Use as LLM training data is ${p.aiTrain === 'yes' ? 'permitted' : '**not permitted**'} (Content-Signal: \`ai-train=${p.aiTrain ?? 'no'}\`).`);
  lines.push('- Any page here can be fetched as markdown by appending `.md` to its URL, or by sending `Accept: text/markdown`.');
  lines.push('');
  await fs.writeFile(path.join(PUBLIC_DIR, 'index.md'), lines.join('\n'), 'utf8');
}

async function writeFullCorpus(perCollection) {
  const chunks = [
    `# ${cfg.title}: full markdown corpus\n`,
    `> Every indexable page of ${cfg.siteUrl}, concatenated. Index: ${cfg.siteUrl}/llms.txt\n`,
    `> Generated ${new Date().toISOString().slice(0, 10)}\n`,
  ];
  for (const { col, entries } of perCollection) {
    if (!entries.length) continue;
    chunks.push(`\n\n# ${col.label}\n`);
    for (const e of entries) {
      try {
        chunks.push(`\n\n${await fs.readFile(path.join(PUBLIC_DIR, col.dir, `${e.slug}.md`), 'utf8')}\n`);
      } catch {
        /* a rendition that failed to write is already reported by the loop above */
      }
    }
  }
  const out = chunks.join('');
  await fs.writeFile(path.join(PUBLIC_DIR, 'llms-full.txt'), out, 'utf8');
  return out.length;
}

async function main() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  const perCollection = [];
  let total = 0;
  for (const col of cfg.collections ?? []) {
    const entries = await processCollection(col);
    perCollection.push({ col, entries });
    total += entries.length;
    console.log(`  ${col.dir.padEnd(14)} ${String(entries.length).padStart(4)} .md`);
  }
  await writeHomepage(perCollection);
  const fullBytes = await writeFullCorpus(perCollection);
  console.log(
    `[agent-markdown] ${total} page file(s) + index.md written to public/, ` +
      `llms-full.txt ${(fullBytes / 1024).toFixed(0)} KB`,
  );
}

main().catch((err) => {
  console.error('[agent-markdown] ERROR:', err);
  process.exit(1);
});
