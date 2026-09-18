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
import { VISIBILITY_DEFAULTS, checkVisibility } from '@operstack/audit';

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
  const r = await checkVisibility(SITE, { ...VISIBILITY_DEFAULTS, budgetMs: 20000 });
  if (!r || r.ok === false) throw new Error(r?.error || 'unreadable');
  /*
   * Неполный прогон это не результат. Сайт мог ответить медленно, и тогда страниц прочитано
   * меньше, а правила SEO не посчитаны вовсе. Публиковать такое число нельзя: оно окажется втрое
   * меньше настоящего, а на странице рядом написано, что его можно пересчитать.
   */
  const wantPages = (VISIBILITY_DEFAULTS.samplePages || 9) + 1;
  const gotPages = (r.sample || []).length;
  if (gotPages < wantPages || !(r.seo?.checks || []).length) {
    throw new Error(`прогон неполный: страниц ${gotPages} из ${wantPages}, правил SEO ${(r.seo?.checks || []).length}`);
  }
  const out = {
    host: r.host,
    score: r.score,
    grade: r.grade,
    measured: new Date().toISOString().slice(0, 10),
    areas: (r.areas || []).map((a) => ({ label: a.label, score: a.score, max: a.max })),
    pagesRead: (r.sample || []).length,
    /*
     * Из чего складывается «сколько замеров делает проверка». Считается здесь, по настоящему
     * прогону, и на страницу уезжает готовым: вписанное руками число протухает в тот день, когда
     * в движке появляется седьмое правило, и мы становимся теми, кого сами и ловим.
     *
     * Признаки содержимого это поля страницы, из которых складываются области: слова, подзаголовки,
     * таблицы, ссылки, картинки, ответ в первом абзаце, дата и разметка. Адрес и заголовок сюда не
     * идут: заголовок уже посчитан в правилах SEO, а адрес это не замер.
     */
    counts: (() => {
      const pages = (r.sample || []).length;
      const seoRules = (r.seo?.checks || []).length;
      const CONTENT_FIELDS = ['words', 'h2', 'tables', 'links', 'images', 'answerFirst', 'dated', 'schema'];
      const robots = (r.crawlers || []).length;
      const site = 5; // llms.txt, карта сайта, дата в карте, разметка на главной, контакты
      const seo = seoRules * pages;
      const content = CONTENT_FIELDS.length * pages;
      return {
        pages, seoRules, seo, contentFields: CONTENT_FIELDS.length, content, robots, site,
        engines: (r.engines || []).length,
        total: seo + content + robots + site,
        robotNames: (r.crawlers || []).map((c) => String(c.name || c.label || '').replace(/^.*\(([^)]+)\).*$/, '$1')).filter(Boolean),
      };
    })(),
  };
  writeFileSync(TARGET, JSON.stringify(out, null, 2) + '\n');
  console.log(`[own-score] ${out.host}: ${out.score}/100 on ${out.measured}, ${out.pagesRead} page(s) read`);
  console.log(`[own-score] замеров за запуск: ${out.counts.total} (SEO ${out.counts.seo} + содержимое ${out.counts.content} + роботы ${out.counts.robots} + сайт ${out.counts.site})`);
} catch (err) {
  const why = err instanceof Error ? err.message : String(err);
  if (before) {
    console.warn(`[own-score] could not measure (${why}); keeping the result from ${before.measured}`);
  } else {
    // No file and no measurement: write nothing, and the page shows nothing rather than a guess.
    console.warn(`[own-score] could not measure (${why}); the page will show no score`);
  }
}
