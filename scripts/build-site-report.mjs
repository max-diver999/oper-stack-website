#!/usr/bin/env node
/** Build oper-stack.com site-report from Spain v3.6 shell + live MCP snapshot (Sep 2026). */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/pages/site-report/index.astro');

const dailyRaw = [];
for (let d = 21; d <= 31; d++) {
  dailyRaw.push({ d: `08-${String(d).padStart(2, '0')}`, c: 0, i: 0 });
}
for (let d = 1; d <= 7; d++) {
  dailyRaw.push({ d: `09-${String(d).padStart(2, '0')}`, c: 0, i: 0 });
}

const monthlyGsc = [
  {
    month: 'Aug 2026',
    label: 'Aug',
    clicks: 0,
    impressions: 0,
    position: 0,
    note: '21 Aug pilot launch · GSC property live · no search rows yet (3-day lag)',
  },
  {
    month: 'Sep 2026',
    label: 'Sep',
    clicks: 0,
    impressions: 0,
    position: 0,
    note: 'Through 5 Sep · indexing + analytics stack completed 8 Sep',
  },
];

const monthlyGa4 = [
  { month: 'Aug', sessions: 0 },
  { month: 'Sep', sessions: 1 },
];

const contentBreakdown = [
  { type: 'Guides', count: 21, words: 99212, color: '#1A8A7D' },
  { type: 'Services', count: 22, words: 18270, color: '#3DB8A9' },
  { type: 'Core pages', count: 6, words: 8400, color: '#C9922A' },
];

const chartData = {
  monthlyGsc: monthlyGsc.map((m) => ({ label: m.label, clicks: m.clicks, impressions: m.impressions })),
  monthlyGa4,
  contentBreakdown: contentBreakdown.map((c) => ({ type: c.type, count: c.count, color: c.color })),
  dailyRaw,
};

const frontmatter = `---
export const prerender = true;

const reportDate = '8 September 2026';
const reportVersion = 'v1.0';
const launchDate = '21 August 2026';
const dataThrough = '5 September 2026';

const gsc28d = { clicks: 0, impressions: 0, ctr: 0, position: 0 };

const monthlyGsc = ${JSON.stringify(monthlyGsc, null, 2)};

const monthlyGa4 = ${JSON.stringify(monthlyGa4, null, 2)};

const contentBreakdown = ${JSON.stringify(contentBreakdown, null, 2)};

const dailyRaw = ${JSON.stringify(dailyRaw, null, 2)};

const maxMonthlyImp = Math.max(1, ...monthlyGsc.map((m) => m.impressions));
function momPill(i) {
  if (i === 0) return { cls: 'pill-blue', text: 'Launch' };
  const curr = monthlyGsc[i].clicks;
  const prev = monthlyGsc[i - 1].clicks;
  if (prev === 0 && curr === 0) return { cls: 'pill-gray', text: '—' };
  if (prev === 0) return { cls: 'pill-blue', text: 'new' };
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct > 0) return { cls: 'pill-green', text: \`+\${pct}%\` };
  if (pct < 0) return { cls: 'pill-amber', text: \`\${pct}%\` };
  return { cls: 'pill-gray', text: '0%' };
}
function barPx(impressions) {
  return Math.max(20, Math.round((impressions / maxMonthlyImp) * 120));
}
const totalGa4 = monthlyGa4.reduce((s, m) => s + m.sessions, 0);
const clicksDelta = 0;
const maxImp = maxMonthlyImp;

const chartPayload = JSON.stringify(${JSON.stringify(chartData)});

const totalClicks = monthlyGsc.reduce((s, m) => s + m.clicks, 0);
const totalImp = monthlyGsc.reduce((s, m) => s + m.impressions, 0);
const totalWords = contentBreakdown.reduce((s, c) => s + c.words, 0);
const totalFiles = contentBreakdown.reduce((s, c) => s + c.count, 0);
---
`;

let html = readFileSync(OUT, 'utf8');
html = html.replace(/^---[\s\S]*?^---\n/m, frontmatter);

const swaps = [
  ['invest-spain-property.com', 'oper-stack.com'],
  ['invest-spain-property-website', 'oper-stack-website'],
  ['invest-spain-indexing', 'invest-singapore-indexing'],
  ['Invest Spain Property', 'OperStack'],
  ['search-console-invest-spain', 'search-console-oper-stack'],
  ['ga4-analytics-invest-spain', 'ga4-analytics-oper-stack'],
  ['bing-webmaster-invest-spain', 'bing-webmaster-oper-stack'],
  ['<div class="header-logo">ES</div>', '<div class="header-logo">OS</div>'],
  ['#b45309', '#1A8A7D'],
  ['#d4a853', '#3DB8A9'],
  ['Spain investment', 'B2B lead operations'],
  ['Spain', 'OperStack EN'],
  ['Marbella', 'inbound stack'],
  ['Golden Visa', 'lead ops stack'],
  ['info@invest-spain-property.com', 'info@oper-stack.com'],
  ['532235050', '553035819'],
  ['G-XXXXXXXX', 'G-X4NJ5MB5BD'],
];
for (const [from, to] of swaps) html = html.split(from).join(to);

html = html.replace(
  /<script type="application\/json" id="chart-data">[\s\S]*?<\/script>/,
  `<script type="application/json" id="chart-data">{chartPayload}</script>`,
);

html = html.replace(
  /<div class="section-title">At a glance<\/div>[\s\S]*?<!-- ═══ GROWTH DASHBOARD/,
  `<div class="section-title">At a glance</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="num teal">49</div>
      <div class="label">URLs in sitemap</div>
      <div class="sublabel">21 guides · 22 services · 6 core pages</div>
    </div>
    <div class="stat-card">
      <div class="num amber">1</div>
      <div class="label">GA4 sessions (Sep)</div>
      <div class="sublabel">Counter live 8 Sep · baseline week starting now</div>
    </div>
    <div class="stat-card">
      <div class="num">{Math.round(totalWords / 1000)}K</div>
      <div class="label">SEO words</div>
      <div class="sublabel">{totalFiles} pages · ~{Math.round(totalWords / totalFiles).toLocaleString('en-US')} avg · B2B corpus</div>
    </div>
    <div class="stat-card">
      <div class="num teal">0</div>
      <div class="label">GSC clicks (28d)</div>
      <div class="sublabel">Pre-indexation window · sc-domain verified · sitemap 0 errors</div>
    </div>
    <div class="stat-card">
      <div class="num">3</div>
      <div class="label">Content clusters</div>
      <div class="sublabel">guides · services · audit / cases / pricing</div>
    </div>
    <div class="stat-card">
      <div class="num amber">Success</div>
      <div class="label">Bing sitemap</div>
      <div class="sublabel">sitemap-index.xml · IndexNow key on site</div>
    </div>
    <div class="stat-card">
      <div class="num teal">{totalGa4}</div>
      <div class="label">GA4 sessions total</div>
      <div class="sublabel">Aug 0 · Sep 1 · G-X4NJ5MB5BD · property 553035819</div>
    </div>
  </div>


  <!-- ═══ GROWTH DASHBOARD`,
);

const seoPulse = `  <!-- SEO PULSE — Google Search Console, GA4 -->
  <div class="section-title" style="margin-top:40px;">SEO Pulse — Google Search Console</div>

  <div style="background:white;border-radius:16px;border:1px solid #e7e5e4;padding:24px 28px;">
    <div class="pulse-header">
      <div>
        <h2>Search Performance</h2>
        <p style="font-size:12px;color:#9ca3af;margin-top:2px;">oper-stack.com · 21 Aug – 5 Sep 2026 · sc-domain · Updated 8 Sep via GSC MCP</p>
      </div>
      <div class="pulse-updated"><span class="pulse-updated-dot"></span>Updated 8 September 2026</div>
    </div>

    <div class="pulse-kpi-row">
      <div class="pulse-kpi kpi-green">
        <div class="kpi-trend trend-new">baseline</div>
        <div class="kpi-label">Total Clicks</div>
        <div class="kpi-val">0</div>
        <div class="kpi-sub">GSC API returns 0 rows — normal for new domain pre-ranking</div>
      </div>
      <div class="pulse-kpi kpi-blue">
        <div class="kpi-trend trend-new">baseline</div>
        <div class="kpi-label">Impressions</div>
        <div class="kpi-val">0</div>
        <div class="kpi-sub">Sitemap submitted · Google Indexing bot smoke 3/3 OK</div>
      </div>
      <div class="pulse-kpi kpi-amber">
        <div class="kpi-trend" style="background:#f3f4f6;color:#374151;">—</div>
        <div class="kpi-label">Avg. Position</div>
        <div class="kpi-val">—</div>
        <div class="kpi-sub">Awaiting first query rows in GSC</div>
      </div>
      <div class="pulse-kpi kpi-orange">
        <div class="kpi-label">GA4 Sessions</div>
        <div class="kpi-val">1</div>
        <div class="kpi-sub">Sep 7 · analytics deployed 8 Sep · key events pending traffic</div>
      </div>
    </div>

    <div class="pulse-insight" style="margin-top:16px;">
      <div class="pulse-insight-icon">📡</div>
      <div class="pulse-insight-text">
        <strong>Launch phase:</strong> Analytics stack completed 8 Sep (GSC sc-domain, GA4 G-X4NJ5MB5BD, Bing Webmaster, IndexNow, Singapore indexing bot). Search rows will appear after crawl + ranking — expect 2–4 weeks for first GSC query data on competitive B2B terms.
      </div>
    </div>

    <div class="pulse-card" style="margin-top:16px;">
      <div class="pulse-card-title"><span class="span-green"></span>Top queries — no data yet</div>
      <p style="font-size:13px;color:#78716c;">GSC MCP <code>dimensions=query</code> returned 0 rows for 28d. Re-run report after first impressions appear.</p>
    </div>
  </div>

  <div class="section-title" style="margin-top:32px;">Bing Pulse</div>
  <div style="background:white;border-radius:16px;border:1px solid #e7e5e4;padding:24px 28px;">
    <div class="pulse-header">
      <div><h2>Bing Webmaster</h2><p style="font-size:12px;color:#9ca3af;margin-top:2px;">oper-stack.com · MCP refresh 8 Sep 2026</p></div>
    </div>
    <div class="pulse-kpi-row">
      <div class="pulse-kpi kpi-green">
        <div class="kpi-label">Sitemap status</div>
        <div class="kpi-val" style="font-size:22px;">Success</div>
        <div class="kpi-sub">sitemap-index.xml · verified site</div>
      </div>
      <div class="pulse-kpi kpi-blue">
        <div class="kpi-label">Bing clicks (90d)</div>
        <div class="kpi-val">0</div>
        <div class="kpi-sub">Early crawl window</div>
      </div>
    </div>
  </div>
`;

html = html.replace(
  /<!-- SEO PULSE[\s\S]*?<div class="section-title">Change history<\/div>/,
  `${seoPulse}

  <div class="section-title">Change history</div>`,
);

const changelog = `  <div class="changelog">
    <div class="changelog-item">
      <div class="changelog-date">8 Sep 2026 (v1.0)</div>
      <div class="changelog-content">
        <div class="changelog-title">Site report v1.0 — first OperStack EN dashboard</div>
        <div class="changelog-desc">GSC sc-domain verified · GA4 G-X4NJ5MB5BD live · Bing sitemap Success · IndexNow · Singapore indexing bot 3/3 smoke. Corpus: 49 URLs, ~126K words. Sister site oper-stack.ru analytics parallel track.</div>
        <div class="changelog-tags"><span class="tag green">Report v1.0</span><span class="tag blue">Analytics</span><span class="tag amber">MCP</span></div>
      </div>
    </div>
    <div class="changelog-item">
      <div class="changelog-date">8 Sep 2026</div>
      <div class="changelog-content">
        <div class="changelog-title">3 new guides + service cluster expansion</div>
        <div class="changelog-desc">top-ai-consulting-companies, top-ai-automation-agencies, n8n-vs-zapier-vs-make published. 22 programmatic service pages in sitemap.</div>
        <div class="changelog-tags"><span class="tag green">Content</span><span class="tag blue">SEO</span></div>
      </div>
    </div>
    <div class="changelog-item">
      <div class="changelog-date">21 Aug 2026</div>
      <div class="changelog-content">
        <div class="changelog-title">Pilot launch — 21 guides + lead-ops-stack pillar</div>
        <div class="changelog-desc">oper-stack.com + oper-stack.ru sister sites. Content OS pilot: topic discovery, EN/RU slug sync. Vercel production on max-diver999 account.</div>
        <div class="changelog-tags"><span class="tag green">Launch</span><span class="tag amber">Pilot</span></div>
      </div>
    </div>
  </div>`;

html = html.replace(/<div class="section-title">Change history<\/div>[\s\S]*?<div class="section-title">Next steps/, `<div class="section-title">Change history</div>\n${changelog}\n\n  <div class="section-title">Next steps`);

html = html.replace(
  /<div class="section-title">Next steps[\s\S]*?<div class="section-title">Quick links<\/div>/,
  `<div class="section-title">Next steps — 8 September 2026 · Goal: qualified B2B inbound</div>
  <div class="next-steps">
    <div class="next-item" style="background:#fef2f2;border-color:#fecaca;">
      <div class="priority high">P0</div>
      <div>
        <div class="text" style="font-weight:700;">Wait for first GSC rows + re-run report</div>
        <div class="subtext">Baseline 0/0 is expected. Refresh v1.1 when impressions &gt; 100/week.</div>
      </div>
    </div>
    <div class="next-item" style="background:#fff7ed;border-color:#fed7aa;">
      <div class="priority medium">P1</div>
      <div>
        <div class="text" style="font-weight:700;">Index new guides via explicit Google API batch</div>
        <div class="subtext">3 Sep-published URLs · indexing-bot-singapore · after Maxim «отправляй».</div>
      </div>
    </div>
    <div class="next-item" style="background:#fff7ed;border-color:#fed7aa;">
      <div class="priority medium">P1</div>
      <div>
        <div class="text" style="font-weight:700;">GA4 key event: lead_form_submit</div>
        <div class="subtext">Mark in GA4 Admin once form traffic starts. lead_form_start is the funnel step above it; qualify_lead has no website trigger and would come from the CRM.</div>
      </div>
    </div>
    <div class="next-item" style="background:#f0fdf4;border-color:#bbf7d0;">
      <div class="priority low">DONE</div>
      <div>
        <div class="text" style="font-weight:700;">Analytics MCP trio + Bing + indexing bot</div>
        <div class="subtext">search-console-oper-stack · ga4-analytics-oper-stack · bing-webmaster-oper-stack · 8 Sep.</div>
      </div>
    </div>
  </div>

  <div class="section-title">Quick links</div>`,
);

html = html.replace(
  /<div class="section-title">Quick links<\/div>\s*<div class="links-grid">[\s\S]*?<\/div>\s*\n\s*<\/div>/,
  `<div class="section-title">Quick links</div>
  <div class="links-grid">
    <a class="link-card" href="https://oper-stack.com" target="_blank">
      <div class="link-label">Live site</div>
      <div class="link-url">oper-stack.com</div>
    </a>
    <a class="link-card" href="https://oper-stack.ru" target="_blank">
      <div class="link-label">Sister site (RU)</div>
      <div class="link-url">oper-stack.ru</div>
    </a>
    <a class="link-card" href="https://github.com/max-diver999/oper-stack-website" target="_blank">
      <div class="link-label">GitHub repository</div>
      <div class="link-url">github.com/max-diver999/oper-stack-website</div>
    </a>
    <a class="link-card" href="https://search.google.com/search-console" target="_blank">
      <div class="link-label">Google Search Console</div>
      <div class="link-url">sc-domain:oper-stack.com</div>
    </a>
    <a class="link-card" href="https://analytics.google.com" target="_blank">
      <div class="link-label">Google Analytics 4</div>
      <div class="link-url">Property 553035819 · G-X4NJ5MB5BD</div>
    </a>
    <a class="link-card" href="https://www.bing.com/webmasters" target="_blank">
      <div class="link-label">Bing Webmaster Tools</div>
      <div class="link-url">bing.com/webmasters</div>
    </a>
    <a class="link-card" href="https://oper-stack.com/sitemap-index.xml" target="_blank">
      <div class="link-label">Sitemap</div>
      <div class="link-url">oper-stack.com/sitemap-index.xml</div>
    </a>
  </div>

</div>`,
);

html = html.replace(
  /<div class="label" style="margin-top:6px;font-size:11px;">Data: GSC through[\s\S]*?<\/div>/,
  `<div class="label" style="margin-top:6px;font-size:11px;">Data: GSC through {dataThrough} · GA4 from 8 Sep 2026</div>`,
);

html = html.replace(
  /<div class="kpi-strip">[\s\S]*?<\/div>\n\n  <section class="section">\n    <div class="section-head">\n      <div>\n        <h2>Monthly growth since launch<\/h2>/,
  `<div class="kpi-strip">
    <div class="kpi-card">
      <div class="kpi-label">GSC Clicks</div>
      <div class="kpi-value">{totalClicks}</div>
      <span class="kpi-delta neutral">baseline</span>
      <div class="kpi-sub">Since 21 Aug launch · sc-domain oper-stack.com</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Impressions</div>
      <div class="kpi-value">0</div>
      <span class="kpi-delta neutral">awaiting</span>
      <div class="kpi-sub">First GSC rows expected within 2–4 weeks</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">GA4 Sessions</div>
      <div class="kpi-value">{totalGa4}</div>
      <span class="kpi-delta neutral">new counter</span>
      <div class="kpi-sub">GA4 live 8 Sep · G-X4NJ5MB5BD · property 553035819</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Content corpus</div>
      <div class="kpi-value">{Math.round(totalWords / 1000)}K</div>
      <span class="kpi-delta neutral">{totalFiles} URLs</span>
      <div class="kpi-sub">21 guides · 22 services · B2B lead-ops cluster</div>
    </div>
  </div>

  <section class="section">
    <div class="section-head">
      <div>
        <h2>Monthly growth since launch</h2>`,
);

html = html.replace(
  /<p>Google Search Console web search ·[\s\S]*?<\/p>\n      <\/div>\n      <span class="badge-src"/,
  `<p>Google Search Console web search · 21 August 2026 → 5 September 2026 · pilot launch month.</p>
      </div>
      <span class="badge-src"`,
);

html = html.replace(
  /<strong>Traffic mix:<\/strong>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*\n\s*<div class="card" style="margin-top:20px;">)/,
  `<strong>Traffic mix:</strong> {totalGa4} GA4 session(s) since counter deployed 8 Sep. GSC baseline 0/0 — indexing stack live, rankings not yet visible.
        `,
);

html = html.replace(
  /<strong>Impression ramp continues:<\/strong>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/section>)/,
  `<strong>Launch baseline:</strong> {totalImp} GSC impressions and {totalClicks} clicks since 21 Aug pilot launch. Analytics completed 8 Sep — first search rows expected within 2–4 weeks after crawl.
      `,
);

html = html.replace(
  /<div class="sublabel">Aug 0 · Sep 1 · G-RYKBS75ZBX property 553035819<\/div>/,
  `<div class="sublabel">Aug 0 · Sep 1 · G-X4NJ5MB5BD · property 553035819</div>`,
);

html = html.replace(
  /GA4 G-X4NJ5MB5BD live/g,
  'GA4 G-X4NJ5MB5BD live',
);

html = html.replace(
  /<div class="footer">[\s\S]*?<\/body>/,
  `<div class="footer">
  <strong>OperStack</strong> · oper-stack.com · Report updated {reportDate} {reportVersion} · {totalFiles} URLs · ~{Math.round(totalWords / 1000)}K words · GSC {totalClicks} clicks / {totalImp} imp · GA4 {totalGa4} sessions
  <br>Internal dashboard · noindex · data via GSC + GA4 + Bing MCP · refresh: node scripts/build-site-report.mjs
</div>

<script is:inline id="chart-data" set:html={chartPayload}></script>
<script is:inline>
  const raw = document.getElementById('chart-data')?.textContent || '{}';
  const data = JSON.parse(raw);
  const grid = '#e7e5e4';
  if (typeof Chart !== 'undefined') {
    const m = data.monthlyGsc || [];
    new Chart(document.getElementById('chartMonthly'), {
      type: 'bar',
      data: {
        labels: m.map(x => x.label),
        datasets: [
          { label: 'Impressions', data: m.map(x => x.impressions), backgroundColor: '#93c5fd' },
          { label: 'Clicks', data: m.map(x => x.clicks), backgroundColor: '#1A8A7D' },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: grid } } } },
    });
    new Chart(document.getElementById('chartGa4'), {
      type: 'line',
      data: { labels: (data.monthlyGa4 || []).map(x => x.month), datasets: [{ label: 'Sessions', data: (data.monthlyGa4 || []).map(x => x.sessions), borderColor: '#1A8A7D', tension: 0.3, fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
    });
    const d = data.dailyRaw || [];
    new Chart(document.getElementById('chartDaily'), {
      type: 'line',
      data: {
        labels: d.map(x => x.d),
        datasets: [
          { label: 'Impressions', data: d.map(x => x.i), borderColor: '#93c5fd', tension: 0.2 },
          { label: 'Clicks', data: d.map(x => x.c), borderColor: '#1A8A7D', tension: 0.2 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } },
    });
    const c = data.contentBreakdown || [];
    new Chart(document.getElementById('chartContent'), {
      type: 'doughnut',
      data: { labels: c.map(x => x.type), datasets: [{ data: c.map(x => x.count), backgroundColor: c.map(x => x.color) }] },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }
</script>
</body>`,
);

writeFileSync(OUT, html);
