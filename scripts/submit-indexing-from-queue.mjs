#!/usr/bin/env node
/**
 * Submit URLs from indexing-queue JSON with market-aware channels.
 *
 * Usage:
 *   node scripts/submit-indexing-from-queue.mjs --file indexing-queue.json
 *   node scripts/submit-indexing-from-queue.mjs --file queue.json --market en --dry-run
 *
 * EN: Google + Bing (bing.com only)
 * RU: Google + IndexNow hub + optional Yandex Recrawl (requires submit-url-list-ru.mjs)
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readSiteConfig } from './lib/read-site-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const marketIdx = args.indexOf('--market');
const dryRun = args.includes('--dry-run');

if (fileIdx === -1 || !args[fileIdx + 1]) {
  console.error('Usage: node scripts/submit-indexing-from-queue.mjs --file queue.json [--market en|ru] [--dry-run]');
  process.exit(1);
}

const cfg = readSiteConfig();
const data = JSON.parse(readFileSync(args[fileIdx + 1], 'utf8'));
const market = (marketIdx >= 0 ? args[marketIdx + 1] : cfg.market || 'en').toLowerCase();
const block = data[market] || data.urls;
const urls = Array.isArray(block) ? block : block?.urls || [];
const googleLimit = block?.googleLimit ?? block?.google_limit ?? 200;

if (!urls.length) {
  console.error(`No URLs for market=${market}`);
  process.exit(1);
}

console.log(`[queue] market=${market} urls=${urls.length} googleLimit=${googleLimit} dryRun=${dryRun}`);
urls.forEach((u) => console.log(' ', u));

if (dryRun) process.exit(0);

const googleScript = join(__dirname, 'submit-google-explicit.mjs');
const slice = urls.slice(0, googleLimit);
const g = spawnSync(process.execPath, [googleScript, ...slice], { stdio: 'inherit', cwd: process.cwd() });

if (market === 'en') {
  const bingScript = join(__dirname, 'submit-bing-explicit.mjs');
  spawnSync(process.execPath, [bingScript, ...urls], { stdio: 'inherit', cwd: process.cwd() });
} else if (market === 'ru') {
  const ruLocal = join(process.cwd(), 'scripts/submit-url-list.mjs');
  const ruTpl = join(__dirname, 'submit-url-list-ru.mjs');
  const ruScript = existsSync(ruLocal) ? ruLocal : ruTpl;
  if (existsSync(ruScript)) {
    spawnSync(
      process.execPath,
      [ruScript, '--file', args[fileIdx + 1], '--google-limit', String(googleLimit)],
      { stdio: 'inherit', cwd: process.cwd() },
    );
  } else {
    console.warn('[queue] RU: install submit-url-list-ru.mjs into scripts/');
  }
}

process.exit(g.status ?? 0);
