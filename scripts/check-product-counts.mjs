#!/usr/bin/env node
/**
 * Fails the build when a number written on the site disagrees with the product line.
 *
 * The counts have gone stale twice now: the line grew and the prose kept saying twelve, then it
 * grew again and the prose kept saying thirteen. A number on a sales page is the first thing a
 * buyer checks, so the fix is not to remember harder, it is to make the build refuse.
 *
 *   node scripts/check-product-counts.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];
const word = (n) => WORDS[n] ?? String(n);

function counts() {
  const all = readFileSync(join(root, 'src/data/products.ts'), 'utf8');
  // Снятые с витрины (listed: false, 25.09.2026) не входят в счёт: на сайте их нет в каталоге.
  const src = all.split(/\n  \{\n(?=    slug: ')/).filter((b) => !/^\s*listed: false,/m.test(b)).join('\n');
  const prices = [...src.matchAll(/^\s*price: '([^']+)'/gm)].map((m) => m[1]);
  const slugs = [...src.matchAll(/^\s*slug: '([^']+)'/gm)].map((m) => m[1]);
  const free = prices.filter((p) => /^free$/i.test(p.trim())).length;
  // Bought in one click: a plain price, no "from" and no "agreed first".
  const oneClick = prices.filter((p) => !/^free$/i.test(p.trim()) && !/^from /i.test(p.trim())).length;
  return { total: slugs.length, free, paid: prices.length - free, oneClick };
}

/** Every phrase on the site that states a count, and the number it must state. */
function rules(c) {
  const t = word(c.total);
  const f = word(c.free);
  const p = word(c.paid);
  return [
    { re: /\b(\w+) products\b/gi, want: t, label: 'products in the line' },
    { re: /\b(\w+) of the (?:thirteen|fourteen|fifteen|sixteen|twelve|eleven|\w+) (?:are free|products are free)/gi, want: f, label: 'free products' },
    { re: /\bof the ([a-z]+)\b(?=[^.]{0,40}\bfree\b)/gi, want: t, label: 'line size before "free"' },
    { re: /\b(\w+) free(?!\s*(?:gates|content gates|quality gates|written|assessment|tool|check|AI))/gi, want: f, label: 'free products' },
    { re: /\b(\w+) paid\b/gi, want: p, label: 'paid products' },
  ];
}

const FILES = [
  'src/pages/products/index.astro',
  'src/pages/about/index.astro',
  'src/pages/pricing/index.astro',
  'src/data/pricing.ts',
  'src/data/products.ts',
  'public/llms.txt',
];

const c = counts();
const problems = [];

for (const rel of FILES) {
  let text;
  try {
    text = readFileSync(join(root, rel), 'utf8');
  } catch {
    continue;
  }
  for (const rule of rules(c)) {
    for (const m of text.matchAll(rule.re)) {
      const said = String(m[1] || '').toLowerCase();
      if (!WORDS.includes(said) && !/^\d+$/.test(said)) continue;
      const saidNum = /^\d+$/.test(said) ? Number(said) : WORDS.indexOf(said);
      const wantNum = WORDS.indexOf(rule.want);
      if (saidNum !== wantNum) {
        problems.push(`${rel}: "${m[0].trim()}" says ${said}, the line has ${rule.want} (${rule.label})`);
      }
    }
  }
}

console.log(
  `[product-counts] line: ${c.total} products, ${c.free} free, ${c.paid} paid, ${c.oneClick} bought in one click`,
);
if (problems.length) {
  console.error('[product-counts] numbers on the site disagree with the product line:');
  for (const p of [...new Set(problems)]) console.error('  ' + p);
  console.error('[product-counts] fix the prose, or the data, so a buyer is never told a wrong number.');
  process.exit(1);
}
console.log('[product-counts] every stated count matches the data');
