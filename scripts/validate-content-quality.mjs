#!/usr/bin/env node
/**
 * SEO Site Kit v3.1 — content quality gate (from more-group-website).
 * Customize `collections` below for RU (gajdy/rajony) vs EN (guides/areas).
 * Run: npm run validate:content -- --changed | --all | --self-test
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runStructuralChecks } from './lib/more-content-gate.mjs';
import { validateHeroImageUrl, isAllowedCloudinaryCloud } from '../../scripts/lib/cloudinary-gate.mjs';
import { checkSerpBrief } from '../../scripts/content-engine/check-serp-brief.mjs';

const ROOT = process.cwd();
const REPO_ROOT = path.join(ROOT, '..');
const SITE_FOLDER = path.basename(ROOT);
const args = process.argv.slice(2);
const skipSerp = args.includes('--skip-serp');
const enforceSerp = !skipSerp && !args.includes('--all');
// --strict-protected: drop the legacy/protected soft exempt so tier-A pages meet full P0.
const strictProtected = args.includes('--strict-protected');
const isRu = fs.existsSync(path.join(ROOT, 'src/content/gajdy'));

const collections = isRu
  ? {
      gajdy: { minWords: 2000, faq: 5, label: 'serious supporting guide', url: '/gajdy/' },
      rajony: { minWords: 1800, faq: 4, label: 'area guide', url: '/rajony/' },
      sravneniya: { minWords: 1800, faq: 4, label: 'comparison', url: '/sravneniya/' },
      proekty: { minWords: 1200, faq: 3, label: 'project review', url: '/proekty/' },
      novosti: { minWords: 500, faq: 0, label: 'news', url: '/novosti/' },
      pereustupki: { minWords: 500, faq: 5, label: 'resale listing', url: '/pereustupki/', kind: 'resale' },
    }
  : {
      guides: { minWords: 2000, faq: 5, label: 'serious supporting guide', url: '/guides/' },
      areas: { minWords: 1800, faq: 4, label: 'area guide', url: '/areas/' },
      comparisons: { minWords: 1800, faq: 4, label: 'comparison', url: '/comparisons/' },
      projects: { minWords: 1200, faq: 3, label: 'project review', url: '/projects/' },
      news: { minWords: 60, faq: 0, label: 'news', url: '/news/' },
      resales: { minWords: 500, faq: 5, label: 'resale listing', url: '/resales/', kind: 'resale' },
    };

const requiredFrontmatterDefault = ['title', 'description', 'pubDate', 'updatedDate', 'author', 'category', 'tags', 'readingTime'];
const requiredFrontmatterResale  = ['title', 'description', 'pubDate', 'updatedDate', 'author', 'tags', 'parentProjectName', 'bedrooms', 'sqm', 'priceThb', 'area'];

function run(cmd, cmdArgs) {
  try {
    return execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function listAllMdx() {
  const contentRoot = path.join(ROOT, 'src/content');
  const files = [];
  for (const collection of Object.keys(collections)) {
    const dir = path.join(contentRoot, collection);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.endsWith('.mdx')) files.push(path.join('src/content', collection, entry));
    }
  }
  return files.sort();
}

function changedMdxFiles() {
  const names = new Set();
  const localRanges = [
    ['diff', '--name-only', '--diff-filter=ACMRT', 'HEAD'],
    ['diff', '--name-only', '--cached', '--diff-filter=ACMRT'],
  ];
  for (const range of localRanges) {
    const out = run('git', range);
    if (!out) continue;
    for (const line of out.split('\n')) names.add(line.trim());
  }
  const untracked = run('git', ['ls-files', '--others', '--exclude-standard']);
  if (untracked) {
    for (const line of untracked.split('\n')) names.add(line.trim());
  }
  if (names.size === 0) {
    const out = run('git', ['diff', '--name-only', '--diff-filter=ACMRT', 'HEAD~1..HEAD']);
    if (out) {
      for (const line of out.split('\n')) names.add(line.trim());
    }
  }
  return [...names].filter((file) => isContentMdx(file) && fs.existsSync(path.join(ROOT, file))).sort();
}

function filesFromArgs() {
  const idx = args.indexOf('--files');
  if (idx === -1) return [];
  return args
    .slice(idx + 1)
    .filter((arg) => !arg.startsWith('--'))
    .flatMap((arg) => arg.split(','))
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => isContentMdx(file) && fs.existsSync(path.join(ROOT, file)));
}

function isContentMdx(file) {
  return file.startsWith('src/content/') && file.endsWith('.mdx');
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return { data: {}, body: text, raw: '' };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: text, raw: '' };
  const raw = text.slice(4, end);
  const body = text.slice(end + 4);
  const data = {};
  let currentArray = null;
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const kv = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentArray = null;
      const [, key, value] = kv;
      if (value === '') {
        data[key] = [];
        currentArray = key;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        data[key] = value
          .slice(1, -1)
          .split(',')
          .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
      } else {
        data[key] = value.replace(/^['"]|['"]$/g, '');
      }
      continue;
    }
    if (currentArray && trimmed.startsWith('- ')) {
      const item = trimmed.slice(2).trim().replace(/^['"]|['"]$/g, '');
      if (!item.includes(':')) data[currentArray].push(item);
    }
  }
  return { data, body, raw };
}

function wordCount(text) {
  return text
    .replace(/^---[\s\S]*?---/, ' ')
    .replace(/^import\s.+$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[\s\S]*?\}/g, ' ')
    .match(/[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9'-]*/g)?.length || 0;
}

function contentIndex() {
  const slugs = new Set();
  const urls = new Set(['/']);
  const noindexSlugs = new Set();
  const noindexUrls = new Set();
  for (const cfg of Object.values(collections)) urls.add(cfg.url);
  for (const file of listAllMdx()) {
    const parts = file.split('/');
    const collection = parts[2];
    const slug = path.basename(file, '.mdx');
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const { data } = parseFrontmatter(text);
    slugs.add(slug);
    const url = `${collections[collection].url}${slug}/`;
    urls.add(url);
    if (data.noindex === true || data.noindex === 'true') {
      noindexSlugs.add(slug);
      noindexUrls.add(url);
    }
  }
  return { slugs, urls, noindexSlugs, noindexUrls };
}

function collectionFor(file) {
  return file.split('/')[2];
}

function isLegacyQualityExempt(file) {
  const base = path.basename(file);
  if (/^(studio-condos|1-bedroom-condos|2-bedroom-condos|3-bedroom-apartments|villas)-for-sale-.+-phuket\.mdx$/.test(base)) {
    return true;
  }
  return new Set([
    'guide-russian-buyers-thailand.mdx',
    'phuket-by-nationality-master-guide-2026.mdx',
    'phuket-property-investment-for-russians-2026.mdx',
    'phuket-property-roi-calculator-guide-2026.mdx',
    'phuket-rental-yield-complete-guide-2026.mdx',
    'what-currency-to-use-when-buying-phuket-property.mdx',
    'phuket-surin-beach-property-market-april-2026.mdx',
    'thb-exchange-rate-2026.mdx',
    'phuket-property-for-australians-2026.mdx',
    'phuket-property-for-uk-buyers-2026.mdx',
    'phuket-property-for-americans-2026.mdx',
    'phuket-property-for-canadians-2026.mdx',
    'phuket-property-for-singaporeans-2026.mdx',
    'phuket-property-for-new-zealanders-2026.mdx',
    'how-to-choose-real-estate-agent-phuket.mdx',
    'phuket-property-uk-european-buyers.mdx',
    'sea-view-condos-phuket-guide.mdx',
    'best-phuket-condos-rental-income.mdx',
  ]).has(base);
}

function countFaq(frontmatterRaw, body) {
  const frontmatterQuestions = (frontmatterRaw.match(/^\s*-\s*question:/gm) || []).length;
  const componentQuestions = (body.match(/question\s*:/g) || []).length;
  const markdownQuestions = (body.match(/\*\*Q:/g) || []).length;
  return Math.max(frontmatterQuestions, componentQuestions, markdownQuestions);
}

function internalLinks(body) {
  const links = new Set();
  const patterns = [/\]\((\/[^)#\s]+\/?)\)/g, /href=["'](\/[^"'#\s]+\/?)["']/g];
  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      if (!match[1].startsWith('/api/') && !match[1].startsWith('/_')) links.add(match[1].endsWith('/') ? match[1] : `${match[1]}/`);
    }
  }
  return [...links];
}

async function urlStatus(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.status === 405) {
      const getRes = await fetch(url, { method: 'GET', redirect: 'follow' });
      return getRes.status;
    }
    return res.status;
  } catch {
    return 0;
  }
}

function validateVirtualDocs() {
  const docs = [
    {
      name: 'thin.mdx',
      text: `---\ntitle: "Thin"\ndescription: "x"\npubDate: 2026-04-28\nupdatedDate: 2026-04-28\nauthor: "MORE Group Editorial"\ncategory: "guides"\ntags: ["x"]\nreadingTime: 1\nheroImage: "https://example.com/a.jpg"\n---\n<FaqBlock faqs={[]} />\n<5% text`,
    },
    {
      name: 'duplicate-a.mdx',
      text: `---\ntitle: "A"\ndescription: "x"\npubDate: 2026-04-28\nupdatedDate: 2026-04-28\nauthor: "MORE Group Editorial"\ncategory: "guides"\ntags: ["x"]\nreadingTime: 10\nheroImage: "https://example.com/same.jpg"\nfaq:\n  - question: "Q?"\n---\n${'word '.repeat(2100)}`,
    },
    {
      name: 'duplicate-b.mdx',
      text: `---\ntitle: "B"\ndescription: "x"\npubDate: 2026-04-28\nupdatedDate: 2026-04-28\nauthor: "MORE Group Editorial"\ncategory: "guides"\ntags: ["x"]\nreadingTime: 10\nheroImage: "https://example.com/same.jpg"\nfaq:\n  - question: "Q?"\n---\n${'word '.repeat(2100)}`,
    },
  ];
  const errors = [];
  const heroMap = new Map();
  for (const doc of docs) {
    const { data, body, raw } = parseFrontmatter(doc.text);
    validateParsedDoc({ file: doc.name, collection: 'guides', data, body, raw, text: doc.text, index: { slugs: new Set(), urls: new Set() }, errors, skipUrlCheck: true });
    if (data.heroImage) {
      const list = heroMap.get(data.heroImage) || [];
      list.push(doc.name);
      heroMap.set(data.heroImage, list);
    }
  }
  addHeroDuplicateErrors(heroMap, errors);
  const expected = ['word count', 'FaqBlock faqs', 'angle-bracket', 'Duplicate heroImage'];
  const missing = expected.filter((needle) => !errors.some((error) => error.includes(needle)));
  if (missing.length) {
    console.error(`[content-quality] self-test failed, missing checks: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`[content-quality] self-test passed (${errors.length} expected errors detected)`);
}

function validateParsedDoc({ file, collection, data, body, raw, text, index, errors, skipUrlCheck }) {
  const cfg = collections[collection] || { minWords: 2000, faq: 5, label: collection, url: `/${collection}/` };
  const isResale = cfg.kind === 'resale';
  const legacyQualityExempt =
    data.noindex === true || data.noindex === 'true' || (!strictProtected && isLegacyQualityExempt(file));
  const prefix = `${file}:`;
  const required = isResale ? requiredFrontmatterResale : requiredFrontmatterDefault;
  if (!legacyQualityExempt) {
    for (const key of required) {
      if (data[key] === undefined || data[key] === '') errors.push(`${prefix} missing frontmatter "${key}"`);
    }
  }
  if (!data.heroImage) {
    errors.push(`${prefix} missing heroImage`);
  } else {
    if (/(images\.unsplash\.com|unsplash\.com)/i.test(data.heroImage)) errors.push(`${prefix} heroImage uses Unsplash`);
    const localOk = (isResale || collection === 'projects') && /^\/images\//.test(data.heroImage);
    const cloudinaryOk = isAllowedCloudinaryCloud(data.heroImage);
    if (!localOk && !cloudinaryOk) {
      errors.push(`${prefix} heroImage must use Cloudinary (dphvjbqb4 or dlrrtf6bq)${isResale ? ' or local /images/ path' : ''}`);
    }
    if (!legacyQualityExempt && cloudinaryOk) {
      for (const msg of validateHeroImageUrl(data.heroImage)) {
        errors.push(`${prefix} heroImage ${msg}`);
      }
    }
  }
  const words = wordCount(text);
  if (!legacyQualityExempt && words < cfg.minWords) errors.push(`${prefix} word count ${words} below ${cfg.label} minimum ${cfg.minWords}`);
  const imports = body.match(/^import\s+.+$/gm) || [];
  const duplicateImports = imports.filter((line, index) => imports.indexOf(line) !== index);
  for (const duplicate of [...new Set(duplicateImports)]) errors.push(`${prefix} duplicate import: ${duplicate}`);
  if (!legacyQualityExempt && cfg.faq > 0 && countFaq(raw, body) < cfg.faq) errors.push(`${prefix} has fewer than ${cfg.faq} FAQ questions`);

  runStructuralChecks({
    prefix,
    data,
    body,
    raw,
    text,
    collection,
    cfg,
    legacyExempt: legacyQualityExempt,
    errors,
  });

  if (enforceSerp && !legacyQualityExempt) {
    checkSerpBrief({
      repoRoot: REPO_ROOT,
      siteFolder: SITE_FOLDER,
      collection,
      slug: path.basename(file, '.mdx'),
      data,
      errors,
      prefix,
    });
  }

  const isNews = cfg.label === 'news';
  if (!isNews && !isResale && !legacyQualityExempt && !/(<LeadForm|<InlineCta|#lead-form|WhatsApp|Telegram|подбер|consultation|shortlist)/i.test(body)) errors.push(`${prefix} missing CTA or LeadForm`);
  if (!legacyQualityExempt && !isResale && cfg.label !== 'news' && internalLinks(body).length < 5) errors.push(`${prefix} has fewer than 5 internal links`);
  if (!legacyQualityExempt) {
    for (const slug of Array.isArray(data.relatedSlugs) ? data.relatedSlugs : []) {
      if (!index.slugs.has(slug)) errors.push(`${prefix} relatedSlug "${slug}" does not exist`);
      if (index.noindexSlugs?.has(slug)) errors.push(`${prefix} relatedSlug "${slug}" points to noindex content`);
    }
  }
  for (const link of internalLinks(body)) {
    if (/^\/(gajdy|rajony|sravneniya|proekty|novosti|pereustupki|guides|areas|comparisons|projects|news|resales)\//.test(link) && !index.urls.has(link)) {
      errors.push(`${prefix} internal content link does not exist: ${link}`);
    }
    if (index.noindexUrls?.has(link)) errors.push(`${prefix} internal link points to noindex content: ${link}`);
  }
  return skipUrlCheck;
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, ' ').replace(/\s+/g, ' ').trim();
}

function addHeroDuplicateErrors(heroMap, errors) {
  for (const [url, files] of heroMap.entries()) {
    if (files.length > 1) errors.push(`Duplicate heroImage in validation batch: ${url} used by ${files.join(', ')}`);
  }
}

async function validateFiles(files) {
  const errors = [];
  const index = contentIndex();
  const heroMap = new Map();
  const titleMap = new Map();
  const descriptionMap = new Map();
  const paragraphMap = new Map();
  const imageChecks = [];

  for (const file of files) {
    const absolute = path.join(ROOT, file);
    const text = fs.readFileSync(absolute, 'utf8');
    const { data, body, raw } = parseFrontmatter(text);
    const collection = collectionFor(file);
    validateParsedDoc({ file, collection, data, body, raw, text, index, errors });
    if (data.title) {
      const key = normalizeText(data.title);
      const list = titleMap.get(key) || [];
      list.push(file);
      titleMap.set(key, list);
    }
    if (data.description) {
      const key = normalizeText(data.description);
      const list = descriptionMap.get(key) || [];
      list.push(file);
      descriptionMap.set(key, list);
    }
    for (const paragraph of body.split(/\n\s*\n/)) {
      const clean = paragraph.replace(/\s+/g, ' ').trim();
      if (clean.length < 180) continue;
      const key = normalizeText(clean).slice(0, 260);
      if (key.length < 140) continue;
      const list = paragraphMap.get(key) || [];
      list.push(file);
      paragraphMap.set(key, list);
    }
    if (data.heroImage) {
      const list = heroMap.get(data.heroImage) || [];
      list.push(file);
      heroMap.set(data.heroImage, list);
      imageChecks.push([file, data.heroImage]);
    }
  }

  addHeroDuplicateErrors(heroMap, errors);
  for (const [title, usedBy] of titleMap.entries()) {
    if (usedBy.length > 1) errors.push(`Duplicate title in validation batch: "${title}" used by ${usedBy.join(', ')}`);
  }
  for (const [description, usedBy] of descriptionMap.entries()) {
    if (usedBy.length > 1) errors.push(`Duplicate description in validation batch: "${description}" used by ${usedBy.join(', ')}`);
  }
  for (const [fragment, usedBy] of paragraphMap.entries()) {
    const unique = [...new Set(usedBy)];
    if (unique.length >= 3) errors.push(`Repeated paragraph/table fragment in 3+ files: ${unique.slice(0, 8).join(', ')} :: ${fragment.slice(0, 120)}...`);
  }

  for (const [file, url] of imageChecks) {
    if (url.startsWith('/')) {
      const localPath = path.join(ROOT, 'public', url.replace(/^\//, ''));
      if (!fs.existsSync(localPath)) errors.push(`${file}: heroImage local path missing in public/: ${url}`);
      continue;
    }
    const status = await urlStatus(url);
    if (status < 200 || status >= 400) errors.push(`${file}: heroImage returned HTTP ${status}`);
  }

  if (errors.length) {
    console.error(`\n[content-quality] ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`[content-quality] passed for ${files.length} file(s)`);
}

if (args.includes('--self-test')) {
  validateVirtualDocs();
  process.exit(0);
}

let files = [];
if (args.includes('--all')) files = listAllMdx();
else files = filesFromArgs();
if (!files.length && args.includes('--changed')) files = changedMdxFiles();
if (!files.length) {
  console.log('[content-quality] no changed content files to validate');
  process.exit(0);
}

await validateFiles([...new Set(files)]);
