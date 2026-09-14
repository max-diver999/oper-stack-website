#!/usr/bin/env node
/**
 * Measures our own site with our own check and writes the result for the page to show.
 *
 * The number is published as proof: a tool that grades other people should be willing to say what
 * it gives its own maker. That only works if the number is measured, never typed. A typed score
 * would be stale the first time anything changed, and it is exactly the failure this check exists
 * to catch in other people's reports.
 *
 * Runs before the build. If the measurement fails, the previous result is kept and the build
 * carries on: a network hiccup must not take the site down, and it must never invent a number.
 *
 *   node scripts/measure-own-score.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkVisibility } from '@operstack/audit';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(root, 'src/data/own-score.json');
const SITE = process.env.OWN_SCORE_SITE || 'oper-stack.com';

function existing() {
  try {
    return JSON.parse(readFileSync(TARGET, 'utf8'));
  } catch {
    return null;
  }
}

const before = existing();

try {
  const r = await checkVisibility(SITE, { budgetMs: 20000 });
  if (!r || r.ok === false) throw new Error(r?.error || 'unreadable');
  const out = {
    host: r.host,
    score: r.score,
    grade: r.grade,
    measured: new Date().toISOString().slice(0, 10),
    areas: (r.areas || []).map((a) => ({ label: a.label, score: a.score, max: a.max })),
    pagesRead: (r.sample || []).length,
  };
  writeFileSync(TARGET, JSON.stringify(out, null, 2) + '\n');
  console.log(`[own-score] ${out.host}: ${out.score}/100 on ${out.measured}, ${out.pagesRead} page(s) read`);
} catch (err) {
  const why = err instanceof Error ? err.message : String(err);
  if (before) {
    console.warn(`[own-score] could not measure (${why}); keeping the result from ${before.measured}`);
  } else {
    // No file and no measurement: write nothing, and the page shows nothing rather than a guess.
    console.warn(`[own-score] could not measure (${why}); the page will show no score`);
  }
}
