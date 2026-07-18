#!/usr/bin/env node
/**
 * Bing IndexNow — explicit URLs. EN/global sites: bing.com only (never api.indexnow.org → Yandex).
 * Usage: node scripts/submit-bing-explicit.mjs https://YOURDOMAIN.com/page/
 */
import { readSiteConfig } from './lib/read-site-config.mjs';

const cfg = readSiteConfig();
const KEY = cfg.indexNow?.key;
const HOST = cfg.siteHost || cfg.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
const endpoint = cfg.indexNow?.enBingEndpoint || 'https://www.bing.com/indexnow';

const urls = process.argv.slice(2).filter((u) => /^https?:\/\//.test(u));
if (!urls.length || !KEY || KEY.includes('REPLACE')) {
  console.error('Usage: set site.config.json indexNow.key, then: node scripts/submit-bing-explicit.mjs URL...');
  process.exit(1);
}

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls,
});
const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body,
});
console.log(`Bing IndexNow: ${res.status} ${res.statusText} (${urls.length} URLs, host=${HOST})`);
urls.forEach((u) => console.log(' ', u));
