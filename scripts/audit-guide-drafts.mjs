import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const draftsDir = path.resolve('drafts/guides');
const files = (await readdir(draftsDir))
  .filter((name) => name.endsWith('.md') && name !== 'README.md')
  .sort();

const banned = [
  /[—–]/,
  /\[VERIFY\]/i,
  /\bTODO\b/i,
  /source needed/i,
  /comprehensive framework/i,
  /operational excellence/i,
  /future outlook/i,
  /\bEstateOS\b/i,
];

const paragraphs = new Map();
const reports = [];

for (const file of files) {
  const text = await readFile(path.join(draftsDir, file), 'utf8');
  const parts = text.split(/^---\s*$/m);
  const frontmatter = parts[1] || '';
  const body = parts.slice(2).join('---').trim();
  const title = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || '';
  const description = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] || '';
  const faqCount = (frontmatter.match(/^\s*-\s+question:/gm) || []).length;
  const h2 = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
  const duplicateH2 = [...new Set(h2.filter((heading, index) => h2.indexOf(heading) !== index))];
  const tables = (body.match(/^\|(?:\s*---|\s*:?-+)/gm) || []).length;
  const internalLinks = (body.match(/\]\(\/[^)]+\/(?:[?#][^)]*)?\)/g) || []).length;
  const words = body.split(/\s+/).filter(Boolean).length;
  const minWords = file === 'lead-ops-stack.md' ? 2800 : 2200;
  const issues = [];

  if (words < minWords) issues.push(`body words ${words}/${minWords}`);
  if (title.length < 50 || title.length > 60) issues.push(`title length ${title.length}/50-60`);
  if (description.length < 120 || description.length > 160) {
    issues.push(`description length ${description.length}/120-160`);
  }
  if (faqCount < 5) issues.push(`frontmatter FAQ ${faqCount}/5`);
  if (tables < 3) issues.push(`tables ${tables}/3`);
  if (internalLinks < 5) issues.push(`internal links ${internalLinks}/5`);
  if (duplicateH2.length) issues.push(`duplicate H2: ${duplicateH2.join(', ')}`);
  if (/^##\s+(?:Frequently asked questions|FAQ)\s*$/im.test(body)) {
    issues.push('manual FAQ section duplicates the layout-rendered FAQ');
  }

  for (const pattern of banned) {
    if (pattern.test(text)) issues.push(`banned pattern: ${pattern}`);
  }

  for (const paragraph of body.split(/\n\s*\n/)) {
    const normalized = paragraph.replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalized.length < 140 || normalized.startsWith('|')) continue;
    const owners = paragraphs.get(normalized) || [];
    owners.push(file);
    paragraphs.set(normalized, owners);
  }

  reports.push({ file, words, h2: h2.length, tables, internalLinks, issues });
}

const repeated = [...paragraphs.entries()]
  .filter(([, owners]) => new Set(owners).size >= 2)
  .map(([paragraph, owners]) => ({ paragraph, owners: [...new Set(owners)] }));

let failed = false;
for (const report of reports) {
  const status = report.issues.length ? 'FAIL' : 'PASS';
  if (status === 'FAIL') failed = true;
  console.log(
    `${status} ${report.file}: ${report.words} words, ${report.h2} H2, ` +
      `${report.tables} tables, ${report.internalLinks} internal links`,
  );
  for (const issue of report.issues) console.log(`  - ${issue}`);
}

if (repeated.length) {
  failed = true;
  console.log('\nRepeated paragraphs across files:');
  for (const item of repeated) {
    console.log(`  - ${item.owners.join(', ')}: ${item.paragraph.slice(0, 140)}...`);
  }
}

if (failed) process.exitCode = 1;
