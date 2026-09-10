/** The OperStack product line: tools for content sites that have to rank, be cited and convert.
 *  Prices are the published entry points; anything not listed here is not a price. */
export type Product = {
  slug: string;
  label: string;
  name: string;
  title: string;
  description: string;
  answer: string;
  price: string;
  priceNote: string;
  status: 'available' | 'soon';
  cta: { text: string; href: string; external?: boolean };
  command?: string;
  og: string;
  order: number;
  get: string[];
  how: { step: string; text: string }[];
  notFor: string[];
  faq: { question: string; answer: string }[];
  relatedGuides: { title: string; href: string }[];
  /** Renders an order form that posts to /api/lead/ with this source. */
  orderForm?: { source: string; heading: string; placeholder: string };
};

export const PRODUCTS: Product[] = [
  {
    slug: 'gates',
    label: 'Free, open source',
    name: 'Fifteen gates',
    title: 'Fifteen Content Gates for MDX Sites, Free',
    description: 'Fifteen automated quality gates for content sites: cut titles, copied paragraphs, hollow sections, dead links, stale llms.txt, unsourced figures. One command, one config, MIT.',
    answer: 'The gates are fifteen automated checks that run on an MDX content site in one command and report what must not ship: characters, compile errors, frontmatter, structure, duplication at paragraph and sentence level, hollow sections, links, redirects, the agent index and unsourced figures. 1,660 files take about 13 seconds.',
    price: 'Free',
    priceNote: 'MIT licence, no account, no telemetry',
    status: 'available',
    cta: { text: 'Copy the command', href: '#install' },
    command: 'npx @operstack/gates',
    og: '/og/og-gates.png',
    order: 1,
    get: ['The npm package with all fifteen gates and a fixture site where every gate fires', 'One JSON config: collections, word minimums, currency codes, place names, allowed sources, thresholds', 'Terminal table, Markdown and JSON reports, exit codes for CI', 'A rules file for Cursor and Claude Code so the model stops producing what the gates reject', 'The eight-page PDF: each gate, the failure it was written for, the fix'],
    how: [{ step: 'Install', text: 'npm i -D @operstack/gates in any Astro, Next or MDX project on Node 20 or newer.' }, { step: 'Describe the site', text: 'Copy gates.config.example.json, set the collections and the currency. Or skip it: src/content is detected.' }, { step: 'Run', text: 'npx gates. Fix in gate order: mechanical first, corpus debt second, links and routing third, trust last.' }],
    notFor: ['Rankings, traffic or citations: it measures the corpus, not the results', 'Rewriting prose: the only automatic fix is characters', 'Sites without a content folder of Markdown or MDX'],
    faq: [{ question: 'Does it work outside Astro?', answer: 'Any folder of MDX or Markdown files with frontmatter. Gate 08 needs a static build for the exact link check and otherwise checks source links.' }, { question: 'Why are the thresholds what they are?', answer: 'They are the values one pipeline settled on across eleven sites. Every one lives in gates.config.json; change them for your corpus and tell us which were wrong.' }, { question: 'Is the demo data real?', answer: 'No. The fixture market, Isla Verde, is fictional. Every number was invented for the tests.' }, { question: 'What does it cost?', answer: 'Nothing. It is MIT. The paid products on this page are the starter kit and the audit; the gates stay free.' }],
    relatedGuides: [{ title: 'Programmatic SEO for lead generation', href: '/guides/programmatic-seo-lead-gen/' }, { title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }],
  },
  {
    slug: 'starter',
    label: 'Free, open source',
    name: 'Astro starter',
    title: 'Astro Starter for Content Sites That Rank and Get Cited',
    description: 'An Astro starter with five content collections, an answer-first article layout, data cards, a generated llms.txt, an honest sitemap, twelve Cursor rules and the fifteen gates wired in.',
    answer: 'The starter is an Astro project that already passes the fifteen gates: five collections, an answer-first layout with Article, Breadcrumb and FAQ schema, data cards for entities, llms.txt and llms-full.txt generated from the corpus on every build, a sitemap with real dates, IndexNow and Google Indexing scripts, and a fictional demo market you replace through one config file.',
    price: 'Free',
    priceNote: 'MIT licence, clone and keep',
    status: 'available',
    cta: { text: 'Get the repository', href: 'https://github.com/operstack/astro-starter', external: true },
    command: 'git clone https://github.com/operstack/astro-starter my-site',
    og: '/og/og-starter.png',
    order: 2,
    get: ['site.config.mjs as the single source of truth: names, places, currency, navigation, contact, the agent summary', 'Guides, districts, comparisons, project data cards and news, with one schema each', 'Generated llms.txt, llms-full.txt and robots.txt; sitemap that excludes noindex, draft and redirect sources', 'Twelve Cursor rules and a CLAUDE.md written for the starter', 'Eighteen demo pages for the fictional market Isla Verde, every one passing the gates'],
    how: [{ step: 'Clone', text: 'git clone, npm install, npm run dev.' }, { step: 'Make it yours', text: 'Edit site.config.mjs and gates.config.json. Delete the demo content. Scaffold pages with npm run new.' }, { step: 'Verify and deploy', text: 'npm run verify builds and runs the gates. Deploy the dist folder to Vercel, Netlify or Cloudflare Pages.' }],
    notFor: ['Sites that need a CMS with an editor interface', 'E-commerce', 'Anyone who wants the demo figures reused: Isla Verde does not exist'],
    faq: [{ question: 'Which Astro version?', answer: 'Astro 7 with the MDX and sitemap integrations, Tailwind 4 for utilities, and two variable fonts. Node 20 or newer.' }, { question: 'Can I add a collection?', answer: 'Three registrations: the schema, the config entry, and a pair of routes copied from an existing collection. The sitemap, llms.txt and the gates follow the config.' }, { question: 'Does it include the gates?', answer: 'The gates run through npx from the npm package; the starter ships the config, the templates and the rules that make pages pass them.' }, { question: 'What is the difference from Site Kit?', answer: 'Site Kit adds the page generator, the niche discovery module, indexing runbooks and support. The starter is the free foundation both share.' }],
    relatedGuides: [{ title: 'Programmatic SEO for lead generation', href: '/guides/programmatic-seo-lead-gen/' }, { title: 'Website lead capture', href: '/guides/website-lead-capture/' }],
  },
  {
    slug: 'plugin',
    label: 'Free, for Claude Code',
    name: 'Claude Code plugin',
    title: 'OperStack SEO Plugin for Claude Code',
    description: 'Five commands, two skills, a reviewer agent and a post-edit hook that runs the fast gates on every content file Claude touches. Free.',
    answer: 'The operstack-seo plugin gives Claude Code five commands (seo-gates, content-preflight, llms-index, indexnow, ai-visibility), two skills that apply on their own when content is written, a content-reviewer agent, and a hook that runs gates 1, 2, 3, 4, 7 and 15 after every edit under src/content and prints the findings for that file.',
    price: 'Free',
    priceNote: 'MIT licence, installs from the OperStack marketplace',
    status: 'available',
    cta: { text: 'Install instructions', href: '#install' },
    command: '/plugin marketplace add operstack/claude-plugins',
    og: '/og/og-plugin.png',
    order: 3,
    get: ['/seo-gates: build if needed, run the gates, read the full report, fix in gate order until exit 0', '/content-preflight: search the corpus, pick the archetype, write the brief with sourced facts, then the page', '/llms-index, /indexnow, /ai-visibility: the agent index, submission, and AI-referral measurement from GA4', 'Skills content-gates and answer-first-writing, active whenever a page is drafted', 'A post-edit hook that never blocks and stays silent outside the content folder'],
    how: [{ step: 'Add the marketplace', text: '/plugin marketplace add operstack/claude-plugins' }, { step: 'Install', text: '/plugin install operstack-seo@operstack' }, { step: 'Install the gates in the site', text: 'npm i -D @operstack/gates so the hook runs without a network fetch.' }],
    notFor: ['Editors who do not use Claude Code; the rules file in the gates package covers Cursor', 'Indexing without an explicit request: the indexnow command refuses to run as a side effect'],
    faq: [{ question: 'Does the hook slow editing down?', answer: 'It runs six offline gates on the site after a Write or Edit under src/content, usually under two seconds on a few hundred pages, and prints only the findings for the file you touched.' }, { question: 'Can it publish or index on its own?', answer: 'No. Deploy and indexing run only when you ask in the current task. The rules say so and the commands check it.' }, { question: 'Where does the AI-visibility data come from?', answer: 'A GA4 MCP server in the session, or a CSV you export. Without either it explains how to get the data and stops; it never estimates.' }],
    relatedGuides: [{ title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }, { title: 'Inbound lead reporting', href: '/guides/inbound-lead-reporting/' }],
  },
  {
    slug: 'site-kit',
    label: 'Paid, one licence',
    name: 'Site Kit',
    title: 'Site Kit: the Pipeline Behind a 300 Page Content Site',
    description: 'The starter plus the page generator, the niche discovery module, indexing runbooks and support: everything one person needs to launch a content site that passes the gates.',
    answer: 'Site Kit is the full pipeline the gates came from, packaged for one person: the Astro starter, a generator that turns a topic list into gate-passing pages through Claude, a niche discovery module that finds the queries a market actually types, indexing runbooks for Google, Bing and answer engines, a quick start and a licence key. It is a one-time purchase per site owner.',
    price: '79 USD',
    priceNote: 'One licence per owner, unlimited sites, updates for a year',
    status: 'soon',
    cta: { text: 'Join the launch list', href: '/audit/?utm=products-site-kit' },
    og: '/og/og-default.png',
    order: 4,
    get: ['Everything in the free starter', 'The page generator: topic list to briefs to MDX, with the gates in the loop until each page passes', 'Niche discovery: seed terms to autocomplete and SERP shapes to a page plan with volumes where a source exists', 'Indexing runbooks: Search Console, Bing, IndexNow, the Google Indexing API on a per-site project, llms.txt', 'Quick start, EULA, licence key and email support for the first month'],
    how: [{ step: 'Buy', text: 'One payment through the checkout; the licence key arrives by email.' }, { step: 'Activate', text: 'npm run activate with the key. The generator and the discovery module unlock.' }, { step: 'Launch', text: 'Discover the niche, generate the first thirty pages, verify with the gates, deploy, submit.' }],
    notFor: ['Agencies running it for clients: that is the agency licence, quoted separately', 'Anyone expecting the generator to invent figures: pages without sources fail gate 15 by design'],
    faq: [{ question: 'When does it ship?', answer: 'The starter, the gates and the plugin are live now. Site Kit follows once the checkout is open; the launch list is told first.' }, { question: 'Which model does the generator use?', answer: 'Claude through your own API key. The kit ships prompts, templates and the gates loop, not tokens.' }, { question: 'Is there a refund?', answer: 'Fourteen days, no questions, if the kit did not do what this page says.' }],
    relatedGuides: [{ title: 'Programmatic SEO for lead generation', href: '/guides/programmatic-seo-lead-gen/' }, { title: 'Inbound automation ROI', href: '/guides/inbound-automation-roi/' }],
  },
  {
    slug: 'seo-audit',
    label: 'Paid, per site',
    name: 'SEO, AEO and GEO audit',
    title: 'SEO, AEO and GEO Audit for a Content Site',
    description: 'A ten-page audit of your site: public signals collected automatically, findings priced per fix, a 90 day plan. 249 USD external, 349 USD with Search Console access. Five working days.',
    answer: 'The audit collects the public signals of your site with the same tooling behind the gates, adds an analyst\'s reading of the content, the answer-engine readiness and the AI-system visibility, and delivers a ten-page report with a scorecard, the critical issues, a technical checklist, and a roadmap in three phases. Every finding has a price to fix it.',
    price: '249 USD',
    priceNote: '349 USD with read-only Search Console access; five working days',
    status: 'available',
    cta: { text: 'Order the audit', href: '#order' },
    og: '/og/og-audit.png',
    order: 5,
    get: ['Scorecard for six areas: technical, content, AEO, GEO, off-page, conversion', 'Critical issues to fix first, with what each one costs you today', 'Technical and on-page checklist with a status and a finding per row', 'AEO and GEO: what answer engines can quote, what blocks them, how the brand is understood', 'Roadmap: week 1, weeks 2 to 4, months 2 to 3, and a fixed price for each fix package'],
    how: [{ step: 'Order', text: 'Send the site and how to reach you. We confirm scope and the tier the same day.' }, { step: 'Collect and read', text: 'Public signals are collected automatically; the analyst reads the content and the pages that outrank it.' }, { step: 'Deliver', text: 'The PDF and a 30 minute call within five working days. Fix packages are quoted in the same letter.' }],
    notFor: ['Sites with fewer than ten pages: run the free gates instead', 'Keyword research and backlink audits: separate work, quoted on request'],
    faq: [{ question: 'What do you need from us?', answer: 'The URL. For the 349 USD tier, read-only access to Search Console and, if you have it, GA4.' }, { question: 'What are the fix packages?', answer: 'Fix (critical items, five working days), Foundation (Fix plus the missing pages and schema, ten days) and Growth (Foundation plus content and three months of reporting). Prices are in the letter that comes with the audit.' }, { question: 'Is the report generic?', answer: 'The checklist rows are collected from your site; the narrative is written for it. A sample audit of a fictional site is available on request so you can see the shape before paying.' }],
    relatedGuides: [{ title: 'Inbound lead audit', href: '/guides/inbound-lead-audit/' }, { title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }],
    orderForm: { source: 'products:seo-audit', heading: 'Order the audit', placeholder: 'Your site URL, the tier (249 external or 349 with Search Console), and anything you already know is broken.' },
  },
];

export const PRODUCTS_FAQ = [
  { question: 'Which product first?', answer: 'The free gates. Run them on your site; the report tells you whether you need the starter, the audit or nothing.' },
  { question: 'Are the free tools really free?', answer: 'Yes, MIT licensed. They came out of a pipeline that publishes to eleven sites and they stay free; the paid products are the kit and the audit.' },
  { question: 'Do the tools send data anywhere?', answer: 'No. The gates and the starter run locally. The audit collector fetches your public pages the way a browser would.' },
];
