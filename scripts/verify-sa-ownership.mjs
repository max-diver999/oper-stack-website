#!/usr/bin/env node
/**
 * Verify SA ownership for oper-stack.com via Site Verification API.
 * Shared indexing bot: invest-singapore-indexing / indexing-bot-singapore@...
 *
 * Usage:
 *   node scripts/verify-sa-ownership.mjs --get-token
 *   node scripts/verify-sa-ownership.mjs --verify
 *   node scripts/verify-sa-ownership.mjs --check
 */

import { GoogleAuth } from 'google-auth-library';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readSiteConfig } from './lib/read-site-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfg = readSiteConfig();
const KEY_PATH = join(process.cwd(), cfg.googleIndexingKeyPath || 'scripts/google-indexing-key.json');
const SITE_URL = `${cfg.siteUrl.replace(/\/$/, '')}/`;
const PUBLIC_DIR = join(__dirname, '..', 'public');

const key = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
console.log(`Using SA: ${key.client_email}`);
console.log(`Project: ${key.project_id}`);
console.log(`Site: ${SITE_URL}\n`);

if (key.project_id !== 'invest-singapore-indexing') {
  console.warn(`WARN: expected project invest-singapore-indexing, got ${key.project_id}`);
}

const auth = new GoogleAuth({
  keyFile: KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/siteverification'],
});

const action = process.argv[2];

async function getToken() {
  const client = await auth.getClient();
  const res = await client.request({
    url: 'https://www.googleapis.com/siteVerification/v1/token',
    method: 'POST',
    data: {
      site: { type: 'SITE', identifier: SITE_URL },
      verificationMethod: 'FILE',
    },
  });

  const token = res.data.token;
  console.log('Verification token:', token);

  const filePath = join(PUBLIC_DIR, token);
  writeFileSync(filePath, `google-site-verification: ${token}`);
  console.log(`Saved to: public/${token}`);
  console.log('\nNext steps:');
  console.log('  1. Deploy the site');
  console.log(`  2. curl ${SITE_URL}${token}`);
  console.log('  3. node scripts/verify-sa-ownership.mjs --verify');
}

async function verify() {
  const client = await auth.getClient();
  try {
    const res = await client.request({
      url: 'https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE',
      method: 'POST',
      data: {
        site: { type: 'SITE', identifier: SITE_URL },
      },
    });
    console.log('Verification SUCCESS!');
    console.log('Owner:', JSON.stringify(res.data.owners));
    console.log('Site:', res.data.site);
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    console.error('Verification FAILED:', e.response?.status, msg);
    process.exit(1);
  }
}

async function check() {
  const client = await auth.getClient();
  try {
    const res = await client.request({
      url: 'https://www.googleapis.com/siteVerification/v1/webResource',
      method: 'GET',
    });
    console.log('Verified resources:');
    for (const r of res.data.items || []) {
      const hit = (r.site?.identifier || '').includes('oper-stack.com');
      const mark = hit ? '→' : ' ';
      console.log(`${mark} ${r.site?.identifier} — owners: ${r.owners?.join(', ')}`);
    }
    if (!res.data.items?.length) console.log('  (none)');
  } catch (e) {
    console.error('Check failed:', e.response?.status, e.response?.data?.error?.message || e.message);
    process.exit(1);
  }
}

if (action === '--get-token') await getToken();
else if (action === '--verify') await verify();
else if (action === '--check') await check();
else {
  console.log('Usage: --get-token | --verify | --check');
  process.exit(1);
}
