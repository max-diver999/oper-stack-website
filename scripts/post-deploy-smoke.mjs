#!/usr/bin/env node
/**
 * Post-deploy smoke test: HTTP healthcheck + agent-browser console/error sweep.
 *
 * Usage:
 *   node scripts/post-deploy-smoke.mjs           # HTTP + browser
 *   node scripts/post-deploy-smoke.mjs --http-only
 *   SITE_URL=https://staging.example.com node scripts/post-deploy-smoke.mjs
 *
 * First-time setup:
 *   npm install
 *   npm run smoke:install
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const HTTP_ONLY = process.argv.includes('--http-only');

const SMOKE_UA = 'MORE-Group-smoke/1.0';

/** Cloudflare blocks empty User-Agent (Python urllib); always send one. */
async function siteFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('User-Agent')) headers.set('User-Agent', SMOKE_UA);
  return fetch(url, { ...options, headers });
}
const BROWSER_ONLY = process.argv.includes('--browser-only');

const CONFIG = {
  collections: [
    { hubPath: '/guides/', contentDir: 'guides' },
    { hubPath: '/projects/', contentDir: 'projects' },
    { hubPath: '/areas/', contentDir: 'areas' },
    { hubPath: '/news/', contentDir: 'news' },
  ],
  contactPath: '/contact/',
  allowedDomains: [
    'moregroup.estate',
    '*.moregroup.estate',
    'res.cloudinary.com',
    '*.cloudinary.com',
    'www.googletagmanager.com',
    'www.google-analytics.com',
    'region1.google-analytics.com',
    'connect.facebook.net',
    'static.cloudflareinsights.com',
  ].join(','),
  extraHttpChecks: [
    {
      name: 'messenger intent healthcheck',
      path: '/api/wa-intent/',
      expect: 200,
      method: 'POST',
      body: { source: 'healthcheck' },
    },
  ],
};

function readSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const siteFile = path.join(ROOT, 'src/data/site.ts');
  const match = fs.readFileSync(siteFile, 'utf8').match(/url:\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error(`Could not read site URL from ${siteFile}`);
  return match[1].replace(/\/$/, '');
}

function firstSlug(contentDir) {
  const dir = path.join(ROOT, 'src/content', contentDir);
  if (!fs.existsSync(dir)) return null;
  const file = fs.readdirSync(dir).filter((name) => name.endsWith('.mdx')).sort()[0];
  return file ? file.replace(/\.mdx$/, '') : null;
}

function buildPagePaths() {
  const paths = new Set(['/']);
  for (const { hubPath, contentDir } of CONFIG.collections) {
    paths.add(hubPath);
    const slug = firstSlug(contentDir);
    if (slug) paths.add(`${hubPath}${slug}/`);
  }
  paths.add(CONFIG.contactPath);
  return [...paths];
}

function log(ok, label, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${label}${detail ? `: ${detail}` : ''}`);
}

async function runHttpChecks(site) {
  console.log('\n[http] Production HTTP checks');
  let failed = 0;

  const checks = [
    { name: 'sitemap-index', url: `${site}/sitemap-index.xml`, expect: 200 },
    { name: 'robots.txt', url: `${site}/robots.txt`, expect: 200 },
    { name: 'homepage', url: `${site}/`, expect: 200 },
    {
      name: 'lead API POST',
      url: `${site}/api/lead/`,
      expect: 200,
      method: 'POST',
      body: { name: 'healthcheck', phone: '+10000000000', source: 'healthcheck' },
    },
    ...CONFIG.extraHttpChecks.map((check) => ({
      name: check.name,
      url: `${site}${check.path}`,
      expect: check.expect,
      method: check.method || 'GET',
      body: check.body,
    })),
  ];

  for (const check of checks) {
    try {
      const opts = { method: check.method || 'GET' };
      if (check.body) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(check.body);
      }
      const response = await siteFetch(check.url, opts);
      const ok = response.status === check.expect;
      log(ok, check.name, `${response.status} (expected ${check.expect})`);
      if (!ok) failed++;
    } catch (error) {
      log(false, check.name, error.message);
      failed++;
    }
  }

  return failed;
}

function resolveAgentBrowserBin() {
  const localBin = path.join(ROOT, 'node_modules', '.bin', 'agent-browser');
  if (fs.existsSync(localBin)) return localBin;
  const global = spawnSync('which', ['agent-browser'], { encoding: 'utf8' });
  if (global.status === 0 && global.stdout.trim()) return global.stdout.trim();
  return null;
}

function parseJsonOutput(raw) {
  if (!raw?.trim()) return null;
  const lines = raw.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith('{') && !line.startsWith('[')) continue;
    try {
      return JSON.parse(line);
    } catch {
      // keep scanning
    }
  }
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

function isAgentBrowserChromeInstalled() {
  const browsersDir = path.join(process.env.HOME || '', '.agent-browser', 'browsers');
  if (!fs.existsSync(browsersDir)) return false;
  return fs.readdirSync(browsersDir).some((name) => name.startsWith('chrome-'));
}

function runBrowserChecks(site, pages) {
  console.log('\n[browser] agent-browser console/error sweep');
  const bin = resolveAgentBrowserBin();
  if (!bin) {
    console.error('✗ agent-browser not found. Run: npm install && npm run smoke:install');
    return 1;
  }

  if (!isAgentBrowserChromeInstalled()) {
    console.error('✗ Chrome for agent-browser not installed. Run: npm run smoke:install');
    return 1;
  }

  let failed = 0;
  const env = {
    ...process.env,
    AGENT_BROWSER_ALLOWED_DOMAINS: CONFIG.allowedDomains,
  };

  const batch = [];
  for (const pagePath of pages) {
    batch.push(['open', `${site}${pagePath}`]);
    batch.push(['wait', '--load', 'networkidle']);
    batch.push(['errors', '--json']);
    batch.push(['console', '--json']);
  }
  batch.push(['close']);

  const result = spawnSync(bin, ['batch', '--json', '--bail'], {
    encoding: 'utf8',
    input: JSON.stringify(batch),
    env,
    timeout: 300000,
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    log(false, 'agent-browser batch', result.error.message);
    return 1;
  }

  if (result.status !== 0) {
    log(false, 'agent-browser batch', result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`);
    return 1;
  }

  const parsed = parseJsonOutput(result.stdout);
  const steps = Array.isArray(parsed) ? parsed : parsed?.results || [];

  let stepIndex = 0;
  for (const pagePath of pages) {
    const openStep = steps[stepIndex];
    const waitStep = steps[stepIndex + 1];
    const errorsStep = steps[stepIndex + 2];
    const consoleStep = steps[stepIndex + 3];
    stepIndex += 4;

    const label = pagePath;
    if (openStep && openStep.success === false) {
      log(false, label, openStep.error || 'open failed');
      failed++;
      continue;
    }
    if (waitStep && waitStep.success === false) {
      log(false, label, waitStep.error || 'wait failed');
      failed++;
      continue;
    }

    const pageErrors = errorsStep?.data?.errors || errorsStep?.data || [];
    const errorList = Array.isArray(pageErrors) ? pageErrors : [];
    if (errorsStep?.success === false || errorList.length > 0) {
      const sample = errorList[0]?.message || errorsStep?.error || 'uncaught page errors';
      log(false, label, `${errorList.length || 1} page error(s) — ${sample}`);
      failed++;
      continue;
    }

    const consoleMessages = consoleStep?.data?.messages || consoleStep?.data || [];
    const consoleErrors = (Array.isArray(consoleMessages) ? consoleMessages : []).filter(
      (entry) => String(entry.level || entry.type || '').toLowerCase() === 'error',
    );
    if (consoleStep?.success === false) {
      log(false, label, consoleStep.error || 'console check failed');
      failed++;
      continue;
    }
    if (consoleErrors.length > 0) {
      const sample = consoleErrors[0]?.text || consoleErrors[0]?.message || 'console.error';
      log(false, label, `${consoleErrors.length} console error(s) — ${sample}`);
      failed++;
      continue;
    }

    log(true, label, '0 page errors, 0 console errors');
  }

  return failed;
}

async function main() {
  const site = readSiteUrl();
  const pages = buildPagePaths();
  console.log(`[smoke] ${site}`);
  console.log(`[smoke] pages: ${pages.join(', ')}`);

  let failed = 0;
  if (!BROWSER_ONLY) failed += await runHttpChecks(site);
  if (!HTTP_ONLY) failed += runBrowserChecks(site, pages);

  console.log(failed === 0 ? '\n[smoke] All checks passed.' : `\n[smoke] Failed checks: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('[smoke] Fatal:', error);
  process.exit(1);
});
