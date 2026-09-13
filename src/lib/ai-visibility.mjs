/**
 * AI visibility check: can ChatGPT, Perplexity, Copilot, Claude and Gemini read, understand
 * and cite this site? Public signals only, one homepage fetch plus robots, llms.txt, the
 * sitemap head and up to three sampled pages, all in parallel, under a hard time budget so it
 * runs inside a serverless function. Plain ESM so the same module runs in Node for tests.
 */

const UA = 'Mozilla/5.0 (compatible; OperStackVisibility/0.1; +https://oper-stack.com/ai-visibility/)';
const MAX_BODY = 600_000;

const AI_AGENTS = [
  { agent: 'oai-searchbot', label: 'ChatGPT search (OAI-SearchBot)', kind: 'search' },
  { agent: 'chatgpt-user', label: 'ChatGPT browsing (ChatGPT-User)', kind: 'search' },
  { agent: 'gptbot', label: 'OpenAI training (GPTBot)', kind: 'train' },
  { agent: 'perplexitybot', label: 'Perplexity (PerplexityBot)', kind: 'search' },
  { agent: 'perplexity-user', label: 'Perplexity browsing (Perplexity-User)', kind: 'search' },
  { agent: 'claudebot', label: 'Claude (ClaudeBot)', kind: 'train' },
  { agent: 'claude-searchbot', label: 'Claude search (Claude-SearchBot)', kind: 'search' },
  { agent: 'claude-user', label: 'Claude browsing (Claude-User)', kind: 'search' },
  { agent: 'anthropic-ai', label: 'Anthropic (anthropic-ai)', kind: 'train' },
  { agent: 'google-extended', label: 'Gemini grounding (Google-Extended)', kind: 'train' },
  { agent: 'bingbot', label: 'Copilot and Bing (Bingbot)', kind: 'search' },
  { agent: 'applebot-extended', label: 'Apple Intelligence (Applebot-Extended)', kind: 'train' },
  { agent: 'ccbot', label: 'Common Crawl (CCBot)', kind: 'train' },
  { agent: 'duckassistbot', label: 'DuckDuckGo AI (DuckAssistBot)', kind: 'search' },
];

function isPrivateHost(host) {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  return h.includes(':') || h.startsWith('[');
}

export function normaliseInput(input) {
  let s = String(input || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || isPrivateHost(u.hostname)) return null;
  u.hash = ''; u.search = '';
  return u.href;
}

async function get(url, { timeout = 6000, method = 'GET' } = {}) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout);
  const started = Date.now();
  try {
    const res = await fetch(url, { method, redirect: 'follow', signal: c.signal, headers: { 'user-agent': UA, accept: 'text/html,application/xml,text/plain,*/*' } });
    let text = '';
    if (method === 'GET') { const buf = await res.arrayBuffer(); text = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, MAX_BODY)); }
    return { ok: res.ok, status: res.status, url: res.url, type: res.headers.get('content-type') || '', text, ms: Date.now() - started };
  } catch (e) { return { ok: false, status: 0, url, type: '', text: '', ms: Date.now() - started, error: e.name === 'AbortError' ? 'timeout' : 'unreachable' }; }
  finally { clearTimeout(t); }
}

const strip = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const attr = (html, re) => { const m = html.match(re); return m ? m[1].trim() : ''; };

export function parseRobots(text) {
  const blocks = []; let cur = null;
  for (const raw of (text || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
    const key = m[1].toLowerCase(); const val = m[2].trim();
    if (key === 'user-agent') { if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; blocks.push(cur); } cur.agents.push(val.toLowerCase()); }
    else if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push({ key, val });
  }
  const signal = (text.match(/^content-signal:\s*(.+)$/im) || [])[1] || '';
  return { blocks, signal };
}

/** Effective verdict for one agent: the most specific block wins, then the star block, then allowed. */
export function agentVerdict(robots, agent) {
  const own = robots.blocks.find((b) => b.agents.includes(agent));
  const star = robots.blocks.find((b) => b.agents.includes('*'));
  const block = own || star;
  if (!block) return 'allowed';
  const fullBlock = block.rules.some((r) => r.key === 'disallow' && r.val === '/') && !block.rules.some((r) => r.key === 'allow' && r.val === '/');
  return fullBlock ? 'blocked' : 'allowed';
}

function analysePage(html, url) {
  const head = html.slice(0, 200_000);
  const title = strip(attr(head, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const description = attr(head, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || attr(head, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const robotsMeta = attr(head, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i).toLowerCase();
  const canonical = attr(head, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) || attr(head, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const ogTitle = /property=["']og:title["']/i.test(head);
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const types = new Set();
  for (const block of ld) for (const m of block.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)) types.add(m[1]);
  const datePublished = attr(head, /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']*)["']/i) || (ld.join('\n').match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1] || '';
  const dateModified = attr(head, /<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']*)["']/i) || (ld.join('\n').match(/"dateModified"\s*:\s*"([^"]+)"/) || [])[1] || '';
  // Site chrome is dropped so it cannot be counted as content, with one exception that matters:
  // an article's title block is usually <header><h1>…</h1><p>the answer…</p></header>. Stripping
  // every <header> deleted exactly the paragraph this check looks for, so a page that did open
  // with an answer scored as if it had none. Keep any header that carries the H1.
  const stripChrome = (h) => h
    .replace(/<(nav|footer|aside)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, (block) => (/<h1[\s>]/i.test(block) ? block : ' '));
  const bodyHtml = stripChrome((html.match(/<body[\s\S]*<\/body>/i) || [html])[0]);
  const text = strip(bodyHtml);
  const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  const h1 = strip((bodyHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || ['', ''])[1]);
  const h2Count = (bodyHtml.match(/<h2[\s>]/gi) || []).length;
  const tables = (bodyHtml.match(/<table[\s>]/gi) || []).length;
  const afterH1 = bodyHtml.split(/<\/h1>/i)[1] || '';
  const firstPara = strip((afterH1.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || ['', ''])[1]);
  const firstParaWords = (firstPara.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  const answerFirst = firstParaWords >= 20 && firstParaWords <= 90 && /\d/.test(firstPara);
  const sourcePhrases = (text.match(/\b(according to|source:|sources:|data from|reported by|published by|registry|statistics office|central bank)\b/gi) || []).length;
  const numbers = (text.match(/\d[\d,.]*\s*(%|percent|[A-Z]{3}\b|km|m²|sqm|min)/g) || []).length;
  return { url, title, description, robotsMeta, canonical, ogTitle, schemaTypes: [...types], datePublished, dateModified, words, h1, h2Count, tables, firstPara: firstPara.slice(0, 220), answerFirst, sourcePhrases, numbers, noai: /noai|noimageai/.test(robotsMeta) };
}

async function readSitemap(origin, robotsText, timeoutFn = () => 3000) {
  const fromRobots = [...(robotsText || '').matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const candidates = fromRobots.length ? fromRobots.slice(0, 2) : [`${origin}/sitemap-index.xml`, `${origin}/sitemap.xml`];
  for (const u of candidates) {
    if (timeoutFn() < 500) break;
    const r = await get(u, { timeout: timeoutFn() });
    if (!r.ok || !/<(urlset|sitemapindex)/.test(r.text)) continue;
    let locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    let lastmod = /<lastmod>/.test(r.text);
    if (/<sitemapindex/.test(r.text) && locs.length && timeoutFn() > 500) {
      const child = await get(locs[0], { timeout: timeoutFn() });
      if (child.ok) { locs = [...child.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]); lastmod = lastmod || /<lastmod>/.test(child.text); }
    }
    return { found: true, url: u, count: locs.length, lastmod, pages: locs.filter((l) => !/\.(xml|pdf|jpe?g|png)$/i.test(l)) };
  }
  return { found: false, url: '', count: 0, lastmod: false, pages: [] };
}

export async function checkVisibility(input, { budgetMs = 8500 } = {}) {
  const started = Date.now();
  const deadline = started + budgetMs;
  const left = () => deadline - Date.now();
  const url = normaliseInput(input);
  if (!url) return { ok: false, error: 'Enter a public site address, for example example.com' };
  const origin = new URL(url).origin; const host = new URL(url).host;
  const [home, robotsRes, llmsRes] = await Promise.all([get(url, { timeout: Math.min(6000, left() - 300) }), get(`${origin}/robots.txt`, { timeout: Math.min(4000, left() - 300) }), get(`${origin}/llms.txt`, { timeout: Math.min(4000, left() - 300) })]);
  if (!home.ok || !/html/i.test(home.type)) return { ok: false, error: home.error === 'timeout' ? 'The site took too long to answer' : `The site answered ${home.status || 'nothing'} for ${url}` };
  const homePage = analysePage(home.text, home.url);
  const robots = parseRobots(robotsRes.ok ? robotsRes.text : '');
  const sitemap = left() > 1500 ? await readSitemap(origin, robotsRes.ok ? robotsRes.text : '', () => Math.min(3000, left() - 300)) : { found: false, url: '', count: 0, lastmod: false, pages: [], skipped: true };
  let sampled = [];
  if (left() > 2000 && sitemap.pages.length) {
    const norm = (u) => u.replace(/\/$/, '').toLowerCase();
    const picks = sitemap.pages.filter((p) => norm(p) !== norm(home.url) && p.startsWith(origin)).sort((a, b) => b.length - a.length).slice(0, 12).filter((_, i) => i % 4 === 0).slice(0, 3);
    const rs = await Promise.all(picks.map((p) => get(p, { timeout: Math.min(4000, left() - 300) })));
    sampled = rs.filter((r) => r.ok && /html/i.test(r.type)).map((r) => analysePage(r.text, r.url));
  }
  const pages = [homePage, ...sampled];

  // llms.txt
  const llmsIsText = llmsRes.ok && !/<html/i.test(llmsRes.text.slice(0, 400));
  const llmsLinks = llmsIsText ? [...llmsRes.text.matchAll(/https?:\/\/[^\s)\]>]+/g)].map((m) => m[0]) : [];
  const llmsForeign = llmsLinks.filter((l) => { try { return !new URL(l).host.endsWith(host.replace(/^www\./, '')); } catch { return false; } });

  // Area 1: access for AI crawlers (25)
  const verdicts = AI_AGENTS.map((a) => ({ ...a, verdict: agentVerdict(robots, a.agent) }));
  const blockedSearch = verdicts.filter((v) => v.kind === 'search' && v.verdict === 'blocked');
  const blockedTrain = verdicts.filter((v) => v.kind === 'train' && v.verdict === 'blocked');
  const starBlocked = agentVerdict(robots, '__none__') === 'blocked';
  const noai = pages.some((p) => p.noai);
  let access = 25;
  if (starBlocked) access = 0; else { access -= Math.min(15, blockedSearch.length * 4); access -= Math.min(8, blockedTrain.length * 2); if (noai) access -= 5; }
  access = Math.max(0, access);
  const accessFindings = [];
  if (starBlocked) accessFindings.push({ id: 'robots-all-blocked', level: 'fail', text: 'robots.txt disallows the whole site for every crawler. Nothing can read it.' });
  if (blockedSearch.length) accessFindings.push({ id: 'robots-fetchers-blocked', level: 'fail', text: `Blocked answer-engine fetchers: ${blockedSearch.map((v) => v.label).join(', ')}. These are the bots that cite pages live.` });
  if (blockedTrain.length) accessFindings.push({ id: 'robots-training-blocked', level: 'warn', text: `Blocked training crawlers: ${blockedTrain.map((v) => v.label).join(', ')}. Models will not learn the brand from the site.` });
  if (noai) accessFindings.push({ id: 'noai-meta', level: 'warn', text: 'A page carries a noai robots meta tag.' });
  if (!accessFindings.length) accessFindings.push({ level: 'pass', text: `All ${AI_AGENTS.length} AI crawlers and fetchers are allowed${robots.signal ? ` (Content-Signal: ${robots.signal})` : ''}.` });

  // Area 2: agent index (15)
  let index = 0; const indexFindings = [];
  if (!llmsRes.ok) indexFindings.push({ id: 'llms-missing', level: 'fail', text: 'No llms.txt. Answer engines get no map of what the site is and which pages matter.' });
  else if (!llmsIsText) { index = 3; indexFindings.push({ id: 'llms-not-text', level: 'fail', text: '/llms.txt answers with an HTML page instead of a text index.' }); }
  else if (llmsLinks.length && llmsForeign.length > llmsLinks.length / 2) { index = 5; indexFindings.push({ id: 'llms-foreign', level: 'fail', text: `llms.txt links mostly to other hosts (${[...new Set(llmsForeign.map((l) => new URL(l).host))].slice(0, 3).join(', ')}). An AI system may misidentify the business.` }); }
  else { index = llmsLinks.length >= 5 ? 15 : 10; indexFindings.push({ level: 'pass', text: `llms.txt present with ${llmsLinks.length} link(s) to the site's own pages.` }); }

  // Area 3: entity and structure (20)
  const allTypes = new Set(pages.flatMap((p) => p.schemaTypes));
  const hasOrg = [...allTypes].some((t) => /Organization|Corporation|NGO|EducationalOrganization|GovernmentOrganization|MedicalOrganization|NewsMediaOrganization|Person|LocalBusiness|RealEstateAgent|Dentist|Physician|Hospital|Pharmacy|VeterinaryCare|LegalService|Attorney|Notary|AccountingService|InsuranceAgency|FinancialService|BankOrCreditUnion|AutomotiveBusiness|AutoRepair|AutoDealer|HomeAndConstructionBusiness|Plumber|Electrician|RoofingContractor|HVACBusiness|HousePainter|Locksmith|MovingCompany|GeneralContractor|Restaurant|FoodEstablishment|CafeOrCoffeeShop|Bakery|BarOrPub|LodgingBusiness|Hotel|TravelAgency|HealthAndBeautyBusiness|BeautySalon|HairSalon|DaySpa|NailSalon|TattooParlor|SportsActivityLocation|HealthClub|Gym|ProfessionalService|Store|ClothingStore|GroceryStore|HardwareStore|FurnitureStore|JewelryStore|PetStore|ChildCare|EmploymentAgency|SelfStorage|Library|Museum|EntertainmentBusiness|MedicalClinic|DentalClinic|Optician|PhysicalTherapy|NutritionService|EmergencyService|ITService|WebDesignService|MarketingAgency|AdvertisingAgency/.test(t));
  const hasFaq = allTypes.has('FAQPage');
  const hasArticle = [...allTypes].some((t) => /Article|BlogPosting|NewsArticle/.test(t));
  /*
   * A page does not have to be an article to be quotable. Asking every site for Article schema
   * marks a correctly typed service, shop, course or job page as missing something, which is the
   * same mistake the check once made by refusing "Dentist" as a business type. What an answer
   * engine needs is a page-level type it can name, so any of these earns the same points.
   */
  const PAGE_TYPES = /^(Service|Product|Course|Event|HowTo|Recipe|SoftwareApplication|WebApplication|MobileApplication|JobPosting|Book|Review|QAPage|MedicalWebPage|CollectionPage|ItemPage|AboutPage|ProfilePage)$/;
  const pageType = [...allTypes].find((t) => PAGE_TYPES.test(t)) || null;
  let entity = 0; const entityFindings = [];
  if (hasOrg) { entity += 8; entityFindings.push({ level: 'pass', text: 'Organization or business schema names the entity behind the site.' }); } else entityFindings.push({ id: 'schema-org-missing', level: 'fail', text: 'No Organization or business schema: AI systems have no entity to attach the site to.' });
  if (hasFaq) { entity += 5; entityFindings.push({ level: 'pass', text: 'FAQPage schema found, the easiest format for an engine to quote.' }); } else entityFindings.push({ id: 'schema-faq-missing', level: 'warn', text: 'No FAQPage schema on the sampled pages.' });
  if (hasArticle) {
    entity += 3;
    entityFindings.push({ level: 'pass', text: 'Article schema on the sampled pages: an engine can name and date what it is quoting.' });
  } else if (pageType) {
    entity += 3;
    entityFindings.push({ level: 'pass', text: `${pageType} schema on the sampled pages: an engine can name what it is quoting.` });
  } else if (sampled.length) {
    entityFindings.push({ id: 'schema-article-missing', level: 'warn', text: 'The sampled pages carry no page-level type (Article, Service, Product, Course and the like), so an engine cannot say what kind of thing it is quoting.' });
  }
  if (homePage.canonical) entity += 2; else entityFindings.push({ id: 'canonical-missing', level: 'warn', text: 'The homepage has no canonical tag.' });
  if (homePage.ogTitle) entity += 2; else entityFindings.push({ id: 'og-missing', level: 'warn', text: 'No Open Graph tags on the homepage: shared links and previews render without a title or image.' });

  // Area 4: answer-first content (25)
  const contentPages = sampled.length ? sampled : [homePage];
  const thin = contentPages.filter((p) => p.words < 300).length;
  const answerFirst = contentPages.filter((p) => p.answerFirst).length;
  const structured = contentPages.filter((p) => p.h2Count >= 3).length;
  const withTables = contentPages.filter((p) => p.tables > 0).length;
  let content = 0; const contentFindings = [];
  content += Math.round(10 * (1 - thin / contentPages.length));
  if (thin) contentFindings.push({ id: 'thin-pages', level: thin === contentPages.length ? 'fail' : 'warn', text: `${thin} of ${contentPages.length} sampled page(s) hold under 300 words. Engines rarely cite thin pages.` }); else contentFindings.push({ level: 'pass', text: `Sampled pages carry ${Math.round(contentPages.reduce((a, p) => a + p.words, 0) / contentPages.length)} words on average.` });
  content += Math.round(8 * (answerFirst / contentPages.length));
  if (answerFirst < contentPages.length) contentFindings.push({ id: 'answer-first-missing', level: answerFirst ? 'warn' : 'fail', text: `${answerFirst} of ${contentPages.length} sampled page(s) open with an answer-first paragraph (20 to 90 words with a figure right after the H1). That paragraph is what gets quoted.` }); else contentFindings.push({ level: 'pass', text: 'Every sampled page opens with an answer-first paragraph carrying a figure.' });
  content += Math.round(4 * (structured / contentPages.length)) + Math.round(3 * (withTables / contentPages.length));
  if (structured < contentPages.length) contentFindings.push({ id: 'few-h2', level: 'warn', text: `${contentPages.length - structured} sampled page(s) have fewer than three H2 sections.` });
  if (!withTables) contentFindings.push({ id: 'no-tables', level: 'warn', text: 'No tables on the sampled pages. Tables are the second most quoted format after the first paragraph.' });

  // Area 5: freshness and sources (15)
  const dated = contentPages.filter((p) => p.datePublished || p.dateModified).length;
  /*
   * Only a page that states figures can fail to attribute them. Docking a page for naming no
   * source for numbers it does not contain is not a measurement, it is a complaint, and the
   * finding said something untrue about the page.
   */
  const withFigures = contentPages.filter((p) => p.numbers > 0);
  const sourced = withFigures.filter((p) => p.sourcePhrases > 0).length;
  let trust = 0; const trustFindings = [];
  trust += Math.round(7 * (dated / contentPages.length));
  if (dated < contentPages.length) trustFindings.push({ id: 'dates-missing', level: dated ? 'warn' : 'fail', text: `${contentPages.length - dated} sampled page(s) expose no publication or modified date. Engines prefer sources they can date.` }); else trustFindings.push({ level: 'pass', text: 'Sampled pages expose publication dates.' });
  if (!withFigures.length) {
    trust += 5;
    trustFindings.push({ level: 'pass', text: 'The sampled pages state no figures, so there is nothing that needs a source named.' });
  } else {
    trust += Math.round(5 * (sourced / withFigures.length));
    if (sourced < withFigures.length) {
      trustFindings.push({ id: 'sources-missing', level: 'warn', text: `${withFigures.length - sourced} of ${withFigures.length} sampled page(s) state figures without naming where they came from ("according to", "data from").` });
    } else {
      trustFindings.push({ level: 'pass', text: 'Every sampled page that states figures names where they came from.' });
    }
  }
  if (sitemap.found) { trust += sitemap.lastmod ? 3 : 1; if (!sitemap.lastmod) trustFindings.push({ id: 'sitemap-no-lastmod', level: 'warn', text: 'The sitemap carries no lastmod dates.' }); } else trustFindings.push({ level: 'fail', text: 'No XML sitemap found at the usual paths or in robots.txt.' });

  const areas = [
    { id: 'access', label: 'Can AI crawlers read it', score: access, max: 25, findings: accessFindings },
    { id: 'index', label: 'Is there a map for agents (llms.txt)', score: index, max: 15, findings: indexFindings },
    { id: 'entity', label: 'Is the entity clear (schema)', score: entity, max: 20, findings: entityFindings },
    { id: 'content', label: 'Is there something to quote', score: content, max: 25, findings: contentFindings },
    { id: 'trust', label: 'Can it be dated and trusted', score: trust, max: 15, findings: trustFindings },
  ];
  const total = areas.reduce((a, x) => a + x.score, 0);
  const grade = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 45 ? 'C' : total >= 25 ? 'D' : 'E';
  const fixes = areas.flatMap((a) => a.findings.filter((f) => f.level === 'fail').map((f) => ({ id: f.id, area: a.label, text: f.text }))).concat(areas.flatMap((a) => a.findings.filter((f) => f.level === 'warn').map((f) => ({ id: f.id, area: a.label, text: f.text })))).slice(0, 3);
  return {
    ok: true, url: home.url, host, checkedAt: new Date().toISOString(), ms: Date.now() - started,
    score: total, grade, areas, fixes,
    sample: pages.map((p) => ({ url: p.url, title: p.title, words: p.words, answerFirst: p.answerFirst, dated: Boolean(p.datePublished || p.dateModified), schema: p.schemaTypes.slice(0, 4) })),
    sitemap: { found: sitemap.found, count: sitemap.count, lastmod: sitemap.lastmod },
    crawlers: verdicts.map((v) => ({ label: v.label, kind: v.kind, verdict: v.verdict })),
  };
}
