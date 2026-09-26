// Проверка страниц сравнения перед выкладкой (задание 26.09.2026, п. 7): объём, заголовки, таблица
// с источником у каждой ячейки конкурента, вопросы, запреты, повторы между собой и с гайдами.
// node scripts/check-compare.mjs [slug ...]  Ненулевой выход, если хоть одна страница не прошла.
import { readFileSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';

const DIR = new URL('../src/content/compare/', import.meta.url);
const GUIDES = new URL('../src/content/guides/', import.meta.url);
const release = process.argv.includes('--release');
const only = process.argv.slice(2).filter((x) => x !== '--release');
const split = (raw) => { const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); return m ? { fm: yaml.load(m[1]), body: m[2] } : null; };
const words = (t) => (String(t).replace(/<!--[\s\S]*?-->/g, ' ').replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`|-]/g, ' ').match(/[\p{L}\p{N}$%'.,]+/gu) || []).length;
const shingles = (t, n = 12) => { const w = String(t).toLowerCase().replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').match(/[\p{L}\p{N}$%]+/gu) || []; const s = new Set(); for (let k = 0; k + n <= w.length; k += 1) s.add(w.slice(k, k + n).join(' ')); return s; };
const files = readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const pages = Object.fromEntries(files.map((id) => [id, split(readFileSync(new URL(`${id}.md`, DIR), 'utf8'))]));
const guideText = readdirSync(GUIDES).filter((f) => f.endsWith('.md')).map((f) => [f, readFileSync(new URL(f, GUIDES), 'utf8')]);
let failed = 0;
for (const id of only.length ? only : files) {
  const p = pages[id]; const bad = []; const warn = [];
  if (!p) { console.log(`✗ ${id}: нет frontmatter`); failed += 1; continue; }
  const { fm, body } = p; const raw = readFileSync(new URL(`${id}.md`, DIR), 'utf8');
  const n = words(body);
  if (n < 3000 || n > 3500) bad.push(`объём ${n} слов (нужно 3000-3500)`);
  if (fm.title?.length < 45 || fm.title?.length > 60) bad.push(`title ${fm.title?.length} знаков`);
  if (fm.description?.length < 120 || fm.description?.length > 160) bad.push(`description ${fm.description?.length} знаков`);
  const aw = words(fm.answer || ''); if (aw < 40 || aw > 80) bad.push(`answer ${aw} слов`); if (!/\d/.test(fm.answer || '')) bad.push('в answer нет цифры');
  if ((fm.table || []).length < 15) bad.push(`таблица ${fm.table?.length || 0} строк`);
  for (const r of fm.table || []) if (!r.them?.source && !/not stated|not published|no public/i.test(r.them?.text || '')) bad.push(`нет источника: «${r.feature}»`);
  const fq = (fm.faq || []).length; if (fq < 5 || fq > 7) bad.push(`вопросов ${fq}`);
  for (const f of fm.faq || []) { const w = words(f.answer); if (w < 40 || w > 90) bad.push(`ответ ${w} слов: «${f.question}»`); }
  if ((fm.related || []).length < 3 || (fm.related || []).length > 4) bad.push('related не 3-4');
  if ((fm.sources || []).length < 3) bad.push('источников меньше 3');
  if (/[\u2014\u2013]/.test(raw)) bad.push('длинное или среднее тире');
  if (/MORE Group|moregroup|florida-estate|\bMaxim\b/i.test(raw.replace(/Maksim/g, ''))) bad.push('запрещённое имя (MORE Group, домены, Maxim)');
  if (/\bguarantee[sd]?\b|\b#1\b|number one/i.test(raw)) warn.push('гарантии или «номер один»');
  if (/^# /m.test(body)) bad.push('H1 в тексте');
  const links = (body.match(/\]\((\/[^)\s]*)\)/g) || []).map((x) => x.slice(2, -1));
  if (links.length < 5) bad.push(`внутренних ссылок ${links.length}`);
  for (const l of links) if (!l.endsWith('/') && !l.includes('#')) bad.push(`ссылка без слэша: ${l}`);
  if (/[\u200B-\u200D\uFEFF\u00AD]/.test(raw)) bad.push('невидимый символ');
  if ((fm.chooseUs || []).length < 3 || fm.chooseUs.length > 4) bad.push('chooseUs не 3-4');
  if ((fm.chooseThem || []).length < 2 || fm.chooseThem.length > 3) bad.push('chooseThem не 2-3');
  const clean = body.replace(/<!--[\s\S]*?-->/g, '').trim();
  const sections = clean.split(/^## /m).slice(1);
  if (sections.length !== 8) bad.push(`основных разделов ${sections.length}, нужно 8`);
  for (const s of sections) {
    const [heading, ...lines] = s.split('\n');
    const text = lines.join('\n').trim();
    const lead = text.split(/\n\s*\n/)[0];
    if (words(lead) < 40 || words(lead) > 60 || !/\d/.test(lead)) bad.push(`вступление H2: ${heading} (${words(lead)} слов, нужна цифра)`);
    if (!/^\|.+\|\s*$/m.test(text) && !/^\d+\. /m.test(text)) bad.push(`нет таблицы или последовательности: ${heading}`);
    if (heading === 'When you need a different kind of tool' && (words(text) < 120 || words(text) > 200)) bad.push(`раздел о другой задаче: ${words(text)} слов`);
  }
  const tables = [...clean.matchAll(/^\|[^\n]+\|\n\|[ :|-]+\|/gm)].length + 1;
  if (tables < 3) bad.push(`полезных таблиц ${tables}, нужно 3 с таблицей шаблона`);
  const blocks = [...body.matchAll(/<!-- cite-block:start -->\n([\s\S]*?)\n<!-- cite-block:end -->/g)];
  if (blocks.length < 3) bad.push(`самостоятельных блоков ${blocks.length}, нужно 3`);
  for (const [, text] of blocks) if (words(text) < 130 || words(text) > 170 || !/\d/.test(text) || /^(?:It|This)\b/.test(text)) bad.push(`блок: ${words(text)} слов; ${text.slice(0, 50)}`);
  if (/\]\(https?:\/\//.test(body)) bad.push('внешняя ссылка в тексте: перенести в Sources');
  if (/named in 0 of 3|named fifteen.*not OperStack|we show our zero|zero mentions out of three/i.test(raw)) bad.push('убрать старый пример из задания');
  if (release && new Date(fm.pubDate).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10)) bad.push('поставить фактическую дату публикации; checkedAt не менять');
  // Повторы: 12 слов подряд, совпавшие с другой страницей сравнения или гайдом.
  const mine = shingles(body);
  for (const [other, q] of Object.entries(pages)) { if (other === id || !q) continue; const theirs = shingles(q.body); let same = 0; for (const s of mine) if (theirs.has(s)) same += 1; if (same > 3) bad.push(`повтор с ${other}: ${same} совпадений по 12 слов`); }
  for (const [g, t] of guideText) { const theirs = shingles(t); let same = 0; for (const s of mine) if (theirs.has(s)) same += 1; if (same > 3) bad.push(`повтор с гайдом ${g}: ${same}`); }
  console.log(`${bad.length ? '✗' : '✓'} ${id}: ${n} слов, таблица ${fm.table?.length}, вопросов ${fq}${bad.length ? `\n    ${bad.join('\n    ')}` : ''}${warn.length ? `\n    (замечания) ${warn.slice(0, 6).join('; ')}` : ''}`);
  if (bad.length) failed += 1;
}
process.exit(failed ? 1 : 0);
