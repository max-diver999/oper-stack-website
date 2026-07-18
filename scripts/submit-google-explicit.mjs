#!/usr/bin/env node
/**
 * Google Indexing API — explicit URLs only (never whole sitemap).
 * Usage: node scripts/submit-google-explicit.mjs https://YOURDOMAIN.com/page/
 * Or:    node scripts/submit-indexing-from-queue.mjs --file queue.json --market en
 */
import { GoogleAuth } from 'google-auth-library';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSiteConfig } from './lib/read-site-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfg = readSiteConfig();
const KEY_PATH = join(process.cwd(), cfg.googleIndexingKeyPath || 'scripts/google-indexing-key.json');
const ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const urls = process.argv.slice(2).filter((u) => /^https?:\/\//.test(u));

if (!urls.length) {
  console.error('Usage: node scripts/submit-google-explicit.mjs https://...');
  process.exit(1);
}

const auth = new GoogleAuth({
  keyFile: KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/indexing'],
});
const client = await auth.getClient();
let ok = 0;
let fail = 0;

for (const url of urls) {
  try {
    const res = await client.request({
      url: ENDPOINT,
      method: 'POST',
      data: { url, type: 'URL_UPDATED' },
    });
    if (res.status === 200) ok++;
    else {
      fail++;
      console.log(`ERR ${res.status}: ${url}`);
    }
  } catch (e) {
    fail++;
    const msg = e.response?.data?.error?.message || e.message;
    console.log(`FAIL ${url} — ${msg}`);
    if (e.response?.status === 429) break;
  }
}
console.log(`Google: ${ok}/${urls.length} OK, ${fail} errors (${cfg.siteHost})`);
