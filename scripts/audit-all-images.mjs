#!/usr/bin/env node
/**
 * HTTP 200 gate for EVERY image URL in src/ (MDX body, Astro pages, data, featured.ts).
 * NOT limited to heroImage frontmatter — inline ![](...) and homepage heroes included.
 *
 * Usage:
 *   node scripts/audit-all-images.mjs [--fail] [--json reports/image-audit.json]
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditImageUrls,
  isAuditableImageUrl,
} from './lib/image-url-audit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const URL_RE = /https?:\/\/[^\s"'`)>\]]+/g;
const args = process.argv.slice(2);
const FAIL = args.includes('--fail');
const jsonIdx = args.indexOf('--json');
const JSON_OUT =
  jsonIdx >= 0 ? join(ROOT, args[jsonIdx + 1] || 'scripts/reports/image-audit.json') : null;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'node_modules') continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(astro|mdx|ts|tsx|css|json)$/.test(name)) out.push(p);
  }
  return out;
}

const map = new Map();
for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;]+$/, '');
    if (!isAuditableImageUrl(url)) continue;
    if (!map.has(url)) map.set(url, new Set());
    map.get(url).add(file.replace(ROOT + '/', ''));
  }
}

const urls = [...map.keys()];
const { ok, bad404, badErr } = await auditImageUrls(urls);

const enrich = (rows) =>
  rows.map((b) => ({ ...b, files: [...(map.get(b.url) || [])] }));

const bad404Full = enrich(bad404);
const badErrFull = enrich(badErr);

console.log('=== IMAGE URL AUDIT ===');
console.log(`URLs checked: ${urls.length}`);
console.log(`OK: ${ok}`);
console.log(`HTTP 404/other: ${bad404Full.length}`);
console.log(`Network ERR: ${badErrFull.length}`);

const show = (label, rows) => {
  if (!rows.length) return;
  console.log(`\n--- ${label} (${rows.length}) ---`);
  for (const b of rows.slice(0, 25)) {
    console.log(`\n[${b.status}] ${b.url}`);
    for (const f of b.files.slice(0, 2)) console.log(`  ${f}`);
  }
  if (rows.length > 25) console.log(`\n... +${rows.length - 25} more`);
};

show('404 / non-200', bad404Full);
show('ERR (after retry)', badErrFull);

if (JSON_OUT) {
  mkdirSync(dirname(JSON_OUT), { recursive: true });
  writeFileSync(
    JSON_OUT,
    JSON.stringify(
      {
        checked: urls.length,
        ok,
        b404: bad404Full.length,
        err: badErrFull.length,
        bad404: bad404Full,
        badErr: badErrFull,
      },
      null,
      2,
    ),
  );
  console.log(`\nReport: ${JSON_OUT.replace(ROOT + '/', '')}`);
}

if (bad404Full.length || badErrFull.length) {
  if (FAIL) process.exit(1);
} else {
  console.log('\n✅ All image URLs return HTTP 200');
}
