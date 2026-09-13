#!/usr/bin/env node
/**
 * Writes public/v.js, the one line an owner pastes on a site that is not WordPress.
 *
 * The host list is generated from src/lib/assistant-hosts.ts rather than typed here, so the script
 * running on customer sites and the endpoint recording the visits can never drift apart. A
 * mismatch would show as visits counted by one half and rejected by the other.
 *
 *   node scripts/build-visit-script.mjs          # write
 *   node scripts/build-visit-script.mjs --check  # fail if the file on disk is out of date
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'src/lib/assistant-hosts.ts');
const TARGET = join(root, 'public/v.js');
const ENDPOINT = 'https://oper-stack.com/api/visits/hit';

function hosts() {
  const src = readFileSync(SOURCE, 'utf8');
  const block = src.match(/ASSISTANT_HOSTS[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error('Could not find ASSISTANT_HOSTS in ' + SOURCE);
  const found = [...block[1].matchAll(/'([a-z0-9.\-]+)':/g)].map((m) => m[1]);
  if (found.length < 5) throw new Error('Suspiciously few hosts parsed: ' + found.length);
  return found;
}

function script() {
  return `/*! OperStack AI visit counter. One request, and only when the visitor arrived from an AI
    assistant. Nothing about the visitor is read or sent: the assistant's name is all that leaves
    this page. What you get back is how many people each assistant sent you.
    Free, and the code is open: https://oper-stack.com/visits/ */
(function () {
  try {
    var s = document.currentScript || document.querySelector('script[data-key]');
    var key = s && s.getAttribute('data-key');
    if (!key) return;
    var ref = document.referrer;
    if (!ref) return;
    var host = new URL(ref).hostname.replace(/^www\\./, '').toLowerCase();
    var known = ${JSON.stringify(hosts())};
    if (known.indexOf(host) < 0) return;
    if (sessionStorage.getItem('op_visit')) return;
    sessionStorage.setItem('op_visit', '1');
    fetch(${JSON.stringify(ENDPOINT)}, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key, from: host }),
      keepalive: true,
      mode: 'cors',
      credentials: 'omit'
    }).catch(function () {});
  } catch (e) {}
})();
`;
}

const wanted = script();
if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(TARGET, 'utf8');
  } catch {
    /* missing counts as out of date */
  }
  if (current !== wanted) {
    console.error('public/v.js is out of date. Run: node scripts/build-visit-script.mjs');
    process.exit(1);
  }
  console.log('public/v.js matches the host list');
} else {
  writeFileSync(TARGET, wanted);
  console.log('public/v.js written,', hosts().length, 'hosts,', wanted.length, 'bytes');
}
