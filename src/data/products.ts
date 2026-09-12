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
  /** Optional second button, for a live demo. */
  demo?: { text: string; href: string };
  command?: string;
  og: string;
  order: number;
  get: string[];
  how: { step: string; text: string }[];
  notFor: string[];
  /** Everything a buyer must have before this is useful, with what each one costs. Honesty first:
   *  nobody should pay us and then discover they also need an account or a key nobody mentioned. */
  needs: { item: string; cost: string; why: string }[];
  faq: { question: string; answer: string }[];
  relatedGuides: { title: string; href: string }[];
  /** Renders an order form that posts to /api/lead/ with this source. */
  orderForm?: { source: string; heading: string; placeholder: string };
};

export const PRODUCTS: Product[] = [
  {
    slug: 'ai-visibility',
    label: 'Free tool',
    name: 'AI visibility check',
    title: 'AI Visibility Check: Can ChatGPT Cite Your Site?',
    description: 'A free ten-second check of whether ChatGPT, Perplexity, Copilot, Claude and Gemini can read, understand and cite your site: crawler access, llms.txt, schema, quotable content, dates.',
    answer: 'The AI visibility check reads a site\'s robots.txt per crawler, its llms.txt, its sitemap, its schema and a sample of three pages, and scores five things out of 100: whether AI crawlers are allowed in, whether there is a map for agents, whether the entity is clear, whether there is a quotable answer-first paragraph and a table, and whether pages carry dates and sources. It returns the three fixes that move the score most.',
    price: 'Free',
    priceNote: 'No account. Public signals only. Ten seconds.',
    status: 'available',
    cta: { text: 'Check a site', href: '/ai-visibility/' },
    og: '/og/og-default.png',
    order: 0,
    get: ['A score out of 100 and a grade, with five area scores', 'The three fixes that move the score most, in plain words', 'Each question asked several times rather than once, and the share of answers that named you: one AI answer is a coin toss', 'Per-crawler verdicts for fourteen AI crawlers and fetchers from robots.txt', 'A table of the sampled pages: words, answer-first paragraph, dates, schema', 'The sixteen gates PDF by email if you want the method behind every check'],
    how: [{ step: 'Enter a site', text: 'Any public address. The checker reads the homepage, robots.txt, llms.txt, the sitemap and up to three pages.' }, { step: 'Read the score', text: 'Five areas, weighted by what answer engines need first: access, a map, an entity, something to quote, dates.' }, { step: 'Fix the top three', text: 'Most sites move twenty points with robots.txt, llms.txt and an answer-first paragraph on the pages that matter.' }],
    needs: [
      { item: 'Nothing at all', cost: 'Free', why: 'Paste a web address and read the score. No account, no card, no install, nothing to download.' },
    ],
    notFor: ['Measuring citations or traffic that already happen: that is in your analytics', 'Sites behind a login, or sites that block the checker'],
    faq: [{ question: 'Is it really free?', answer: 'Yes. It is the automatic first two pages of the paid audit, offered so you can see whether you need the rest.' }, { question: 'Why does it sample only three pages?', answer: 'To answer in ten seconds. The sixteen gates read every page of your own repository; this check reads what a stranger can fetch.' }, { question: 'What is a good score?', answer: 'Eighty and above: engines can read and quote the site. Under forty-five: they mostly cannot. Between the two, the three fixes listed usually close the gap in a day.' }],
    relatedGuides: [{ title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }, { title: 'Inbound lead audit', href: '/guides/inbound-lead-audit/' }],
  },
  {
    slug: 'gates',
    label: 'Free, open source',
    name: 'Sixteen gates',
    title: 'Sixteen Content Gates for MDX Sites, Free',
    description: 'Sixteen automated quality gates for content sites: cut titles, copied paragraphs, hollow sections, dead links, stale llms.txt, unsourced figures, a missing agent surface. One command, one config, MIT.',
    answer: 'The gates are sixteen automated checks that run on an MDX content site in one command and report what must not ship: characters, compile errors, frontmatter, structure, duplication at paragraph and sentence level, hollow sections, links, redirects, the agent index, unsourced figures and the agent surface (the agent card and the markdown copies an assistant reads). 1,660 files take about 13 seconds.',
    price: 'Free',
    priceNote: 'MIT licence, no account, no telemetry',
    status: 'available',
    cta: { text: 'Copy the command', href: '#install' },
    command: 'npx @operstack/gates',
    og: '/og/og-gates.png',
    order: 1,
    get: ['The npm package with all sixteen gates and a fixture site where every gate fires', 'One JSON config: collections, word minimums, currency codes, place names, allowed sources, thresholds', 'Terminal table, Markdown and JSON reports, exit codes for CI', 'A rules file for Cursor and Claude Code so the model stops producing what the gates reject', 'The eight-page PDF: each gate, the failure it was written for, the fix'],
    how: [{ step: 'Install', text: 'npm i -D @operstack/gates in any Astro, Next or MDX project on Node 20 or newer.' }, { step: 'Describe the site', text: 'Copy gates.config.example.json, set the collections and the currency. Or skip it: src/content is detected.' }, { step: 'Run', text: 'npx gates. Fix in gate order: mechanical first, corpus debt second, links and routing third, trust last.' }],
    needs: [
      { item: 'Node.js, version 20 or newer', cost: 'Free', why: 'The gates run on your own computer with one command. Node.js is free software from nodejs.org.' },
      { item: 'A content site whose text lives in files', cost: 'Free', why: 'The gates read Markdown or MDX files. If your text lives inside WordPress or Tilda, they have nothing to read.' },
    ],
    notFor: ['Rankings, traffic or citations: it measures the corpus, not the results', 'Rewriting prose: the only automatic fix is characters', 'Sites without a content folder of Markdown or MDX'],
    faq: [{ question: 'Does it work outside Astro?', answer: 'Any folder of MDX or Markdown files with frontmatter. Gate 08 needs a static build for the exact link check and otherwise checks source links.' }, { question: 'Why are the thresholds what they are?', answer: 'They are the values one pipeline settled on across eleven sites. Every one lives in gates.config.json; change them for your corpus and tell us which were wrong.' }, { question: 'Is the demo data real?', answer: 'No. The fixture market, Isla Verde, is fictional. Every number was invented for the tests.' }, { question: 'What does it cost?', answer: 'Nothing. It is MIT. The paid products on this page are the starter kit and the audit; the gates stay free.' }],
    relatedGuides: [{ title: 'Programmatic SEO for lead generation', href: '/guides/programmatic-seo-lead-gen/' }, { title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }],
  },
  {
    slug: 'starter',
    label: 'Free, open source',
    name: 'Astro starter',
    title: 'Astro Starter for Content Sites That Rank and Get Cited',
    description: 'An Astro starter with five content collections, an answer-first article layout, data cards, a generated llms.txt, an honest sitemap, twelve Cursor rules and the sixteen gates wired in.',
    answer: 'The starter is an Astro project that already passes the sixteen gates: five collections, an answer-first layout with Article, Breadcrumb and FAQ schema, data cards for entities, llms.txt and llms-full.txt generated from the corpus on every build, a sitemap with real dates, IndexNow and Google Indexing scripts, and a fictional demo market you replace through one config file.',
    price: 'Free',
    priceNote: 'MIT licence, clone and keep',
    status: 'available',
    cta: { text: 'Get the repository', href: 'https://github.com/oper-stack/astro-starter', external: true },
    demo: { text: 'See the live demo', href: 'https://demo.oper-stack.com' },
    command: 'git clone https://github.com/oper-stack/astro-starter my-site',
    og: '/og/og-starter.png',
    order: 2,
    get: ['site.config.mjs as the single source of truth: names, places, currency, navigation, contact, the agent summary', 'Guides, districts, comparisons, project data cards and news, with one schema each', 'Generated llms.txt, llms-full.txt and robots.txt; sitemap that excludes noindex, draft and redirect sources', 'Twelve Cursor rules and a CLAUDE.md written for the starter', 'Eighteen demo pages for the fictional market Isla Verde, every one passing the gates'],
    how: [{ step: 'Clone', text: 'git clone, npm install, npm run dev.' }, { step: 'Make it yours', text: 'Edit site.config.mjs and gates.config.json. Delete the demo content. Scaffold pages with npm run new.' }, { step: 'Verify and deploy', text: 'npm run verify builds and runs the gates. Deploy the dist folder to Vercel, Netlify or Cloudflare Pages.' }],
    needs: [
      { item: 'Node.js, version 20 or newer', cost: 'Free', why: 'You run the site on your own computer before it goes live. Free from nodejs.org.' },
      { item: 'A hosting account when you are ready to publish', cost: 'Free to start', why: 'Vercel, Netlify and Cloudflare all host a site this size on their free plan. You can build and preview the whole site without one.' },
      { item: 'A domain name, only when you want your own address', cost: 'Paid, about 10 to 15 USD a year', why: 'Bought from any registrar. Until then the free hosting address works.' },
    ],
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
    priceNote: 'MIT licence, installs from the OperStack marketplace. Useful only if you already pay for Claude Code',
    status: 'available',
    cta: { text: 'Install instructions', href: '#install' },
    command: '/plugin marketplace add oper-stack/claude-plugins',
    og: '/og/og-plugin.png',
    order: 3,
    get: ['/seo-gates: build if needed, run the gates, read the full report, fix in gate order until exit 0', '/content-preflight: search the corpus, pick the archetype, write the brief with sourced facts, then the page', '/llms-index, /indexnow, /ai-visibility: the agent index, submission, and AI-referral measurement from GA4', 'Skills content-gates and answer-first-writing, active whenever a page is drafted', 'A post-edit hook that never blocks and stays silent outside the content folder'],
    how: [{ step: 'Add the marketplace', text: '/plugin marketplace add oper-stack/claude-plugins' }, { step: 'Install', text: '/plugin install operstack-seo@operstack' }, { step: 'Install the gates in the site', text: 'npm i -D @operstack/gates so the hook runs without a network fetch.' }],
    needs: [
      { item: 'Claude Code', cost: 'Paid, Anthropic subscription', why: 'The plugin runs inside Claude Code, so it is only useful if you already pay for Claude Code. We do not sell it and we get nothing from it.' },
      { item: 'Node.js, version 20 or newer', cost: 'Free', why: 'The gates the plugin calls run on Node.js.' },
    ],
    notFor: ['Editors who do not use Claude Code; the rules file in the gates package covers Cursor', 'Indexing without an explicit request: the indexnow command refuses to run as a side effect'],
    faq: [{ question: 'Does the hook slow editing down?', answer: 'It runs six offline gates on the site after a Write or Edit under src/content, usually under two seconds on a few hundred pages, and prints only the findings for the file you touched.' }, { question: 'Can it publish or index on its own?', answer: 'No. Deploy and indexing run only when you ask in the current task. The rules say so and the commands check it.' }, { question: 'Where does the AI-visibility data come from?', answer: 'A GA4 MCP server in the session, or a CSV you export. Without either it explains how to get the data and stops; it never estimates.' }],
    relatedGuides: [{ title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }, { title: 'Inbound lead reporting', href: '/guides/inbound-lead-reporting/' }],
  },
  {
    slug: 'site-report',
    label: 'Paid, per site',
    name: 'Automatic site report',
    title: 'Automatic SEO and AI Visibility Report, 9 USD',
    description: 'The whole site measured, not one page: six area scores, every check with its finding, how much of your text disappears without JavaScript, and the files an AI agent looks for on your domain. 9 USD, one site, PDF by email.',
    answer: 'The automatic site report reads up to twenty pages of a site with the same tooling behind the paid audit, renders three of them in a real browser to measure how much text is invisible without JavaScript, and returns a PDF with six area scores, a finding per check, and the three things to fix first. Nobody reads it for you: the numbers are measured and the wording is drafted from the measurements.',
    price: '9 USD',
    priceNote: 'One site, one report. No account, no access to anything of yours, no paid tool behind any number',
    status: 'soon',
    // Пока товар не заведён на Whop, кнопка ведёт на бесплатную проверку, а не в никуда.
    // Как только ссылка на оплату появится в checkout.ts, кнопка сама станет «Buy for 9 USD».
    cta: { text: 'Start with the free check', href: '/ai-visibility/' },
    og: '/og/og-audit.png',
    order: 4,
    get: [
      'A PDF report on your whole site, not a single page',
      'Six area scores with the count of checks behind each one, and "not measured" wherever something was not tested',
      'Every check with what it found on your pages, in plain words',
      'How much of your text disappears when JavaScript is off, measured in a real browser: the fetchers that quote you do not run scripts',
      'Whether the files an AI agent looks for exist on your domain at all',
      'Where the links in your llms.txt actually lead: dead, redirecting or closed to indexing',
      'The three things to fix first, written as actions rather than labels',
    ],
    how: [
      { step: 'Pay', text: 'Card on Whop. You get an email with one link straight away.' },
      { step: 'Say which site', text: 'Open the link, type your address. That is the whole form: no account, no access to your Search Console, nothing to install.' },
      { step: 'Read the PDF', text: 'It arrives by email. We do not keep the address of your site once it has been sent.' },
    ],
    needs: [
      { item: 'The address of your site', cost: 'Free', why: 'That is the whole requirement. Every number in the report is computed from what any stranger can read on your site for nothing.' },
      { item: 'A public site', cost: 'Free', why: 'Pages behind a login cannot be read from outside, so they cannot be measured. What is public is what search engines and AI see too.' },
    ],
    notFor: [
      'Anyone who wants a person to read the findings and explain what they mean for their business: that is the 149 USD audit',
      'Anyone who wants the work done for them: that is Fix at 249 USD',
      'Sites behind a login, and sites that block automated readers',
    ],
    faq: [
      { question: 'How is this different from the free check?', answer: 'The free check opens one page and asks one question. This opens up to twenty pages, runs every check behind the paid audit, and measures what a real browser sees that a plain fetch does not.' },
      { question: 'Does a person read my report?', answer: 'No. Every number is measured and the wording is drafted from those measurements. If you want a person to read each finding and write what it means for your business, that is the 149 USD audit.' },
      { question: 'Do I need to install anything?', answer: 'No. You type your address into one field and the report arrives by email.' },
      { question: 'Do you keep my data?', answer: 'No. The address of your site lives only until the report has been sent. Nothing about your site is stored afterwards and nothing is shared.' },
      { question: 'Can I run this myself for nothing?', answer: 'Yes, if you use a terminal: the tool behind it is @operstack/audit on npm under an MIT licence. What you are paying for here is not having to.' },
    ],
    relatedGuides: [{ title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }, { title: 'Inbound lead audit', href: '/guides/inbound-lead-audit/' }],
  },
  {
    slug: 'site-kit',
    label: 'Paid, one licence',
    name: 'Site Kit',
    title: 'Site Kit: the Pipeline Behind a 300 Page Content Site',
    description: 'The starter plus the page generator, the niche discovery module, a WordPress importer, indexing runbooks and support: everything one person needs to launch a content site that passes the gates, or to move an old one onto them.',
    answer: 'Site Kit is the full pipeline the gates came from, packaged for one person: the Astro starter, a generator that turns a topic list into gate-passing pages through Claude, a niche discovery module that finds the queries a market actually types, indexing runbooks for Google, Bing and answer engines, a quick start and a licence key. If you already have a site, the WordPress importer turns your export into pages of the new one and then tells you what is wrong with those old texts: which are too short, which have no description for the search result, which have no dates. It is a one-time purchase per site owner.',
    price: '79 USD',
    priceNote: 'One licence per owner, unlimited sites, updates for a year. The page generator runs on your own OpenAI or Anthropic key, paid to them, a few cents a page',
    status: 'soon',
    cta: { text: 'Join the launch list', href: '/audit/?utm=products-site-kit' },
    og: '/og/og-default.png',
    order: 5,
    get: ['Everything in the free starter', 'A WordPress importer: your export becomes pages of the new site, and the report names which old texts are too short, undescribed or undated', 'The page generator: topic list to briefs to MDX, with the gates in the loop until each page passes', 'Niche discovery: seed terms to autocomplete and SERP shapes to a page plan with volumes where a source exists', 'Indexing runbooks: Search Console, Bing, IndexNow, the Google Indexing API on a per-site project, llms.txt', 'Quick start, EULA, licence key and email support for the first month'],
    how: [{ step: 'Buy', text: 'One payment through the checkout; the licence key arrives by email.' }, { step: 'Activate', text: 'npm run activate with the key. The generator and the discovery module unlock.' }, { step: 'Launch', text: 'Discover the niche, generate the first thirty pages, verify with the gates, deploy, submit.' }],
    needs: [
      { item: 'Node.js, version 20 or newer', cost: 'Free', why: 'Everything in the kit runs on your own computer. Free from nodejs.org.' },
      { item: 'An API key from OpenAI or Anthropic, if you want the generator to write pages', cost: 'Paid, and you pay them directly', why: "The kit ships the prompts, the templates and the checks, not the words. A page typically costs a few cents of the provider's tokens. You can also write the pages yourself and use everything else in the kit, including the gates and the licence." },
      { item: 'A hosting account when you publish', cost: 'Free to start', why: 'Vercel, Netlify and Cloudflare all host a site this size on their free plan.' },
      { item: 'A domain name, only when you want your own address', cost: 'Paid, about 10 to 15 USD a year', why: 'Bought from any registrar.' },
    ],
    notFor: ['Agencies running it for clients: that is the agency licence, quoted separately', 'Anyone expecting the generator to invent figures: pages without sources fail gate 15 by design'],
    faq: [{ question: 'When does it ship?', answer: 'The starter, the gates and the plugin are live now. Site Kit follows once the checkout is open; the launch list is told first.' }, { question: 'Which model does the generator use?', answer: 'Claude or an OpenAI model, through your own API key: pick the provider with one flag. The kit ships prompts, templates and the gates loop, not tokens. A page costs a few cents of tokens and usually passes the gates in the first round.' }, { question: 'Is there a refund?', answer: 'Seven days from purchase, in full. Tell us in one line what did not work.' }],
    relatedGuides: [{ title: 'Programmatic SEO for lead generation', href: '/guides/programmatic-seo-lead-gen/' }, { title: 'Inbound automation ROI', href: '/guides/inbound-automation-roi/' }],
  },
  {
    slug: 'seo-audit',
    label: 'Paid, per site',
    name: 'SEO, AEO and GEO audit',
    title: 'SEO, AEO and GEO Audit for a Content Site',
    description: 'A twelve-page audit of your site: forty checks across six areas, every score computed from the checks and printed with the count behind it. 149 USD for the first ten audits, then 249. Usually one to three working days, five at most.',
    answer: 'The audit collects the public signals of your site with the same tooling behind the gates, adds an analyst\'s reading of the content, the answer-engine readiness and the AI-system visibility, and delivers a ten-page report with a scorecard, the critical issues, a technical checklist, and a roadmap in three phases. Every finding has a price to fix it.',
    price: '149 USD',
    priceNote: 'The price of the first ten audits, then 249 USD. With read-only access to your own free Search Console and Bing Webmaster it is 199 USD and adds your real queries and positions. Usually one to three working days, five at most',
    status: 'available',
    cta: { text: 'Order the audit', href: '#order' },
    og: '/og/og-audit.png',
    order: 6,
    get: ['Scorecard for six areas: technical, content, AEO, GEO, off-page, conversion', 'Critical issues to fix first, with what each one costs you today', 'Technical and on-page checklist with a status and a finding per row', 'AEO and GEO: what answer engines can quote, what blocks them, how the brand is understood', 'Every finding also written as a task you paste into Cursor or Claude Code: the state now, what to change, how to know it is done', 'How much of your text is invisible without JavaScript, measured in a real browser, because the fetchers that quote you do not run scripts', 'Whether the files an AI agent reads exist at all: the agent card and a markdown copy of your pages', 'Roadmap in three phases: week one, weeks two to four, months two and three'],
    how: [{ step: 'Order', text: 'Send the site and how to reach you. We confirm scope and the tier within 24 hours.' }, { step: 'Collect and read', text: 'Public signals are collected automatically; the analyst reads the content and the pages that outrank it.' }, { step: 'Deliver', text: 'The PDF report by email, usually within one to three working days and never later than five. The two packages are quoted in the same letter.' }],
    needs: [
      { item: 'Your site address', cost: 'Free', why: 'That is the whole requirement for the 149 USD report. Every score in it is computed from what anyone can read on your site for nothing.' },
      { item: 'Google Search Console, for the 199 USD tier', cost: 'Free, but you need your own free Google account', why: 'Read-only access to your own property. It adds your real queries, impressions and positions to the report. Setting it up takes about ten minutes and is worth having whether you buy an audit or not.' },
      { item: 'Bing Webmaster Tools, for the 199 USD tier', cost: 'Free, but you need your own free Microsoft account', why: 'Bing shows the conversational questions AI assistants retrieve your site for, which Google does not.' },
      { item: 'No paid tool, ever', cost: 'Free', why: 'No score in your report comes from a service you would have to subscribe to. If we ever quote a paid tool, that row is marked as a note and counted in nothing, so you can re-run the audit yourself and get the same numbers.' },
    ],
    notFor: ['Sites with fewer than ten pages: run the free gates instead', 'Keyword research and backlink audits: separate work, quoted on request'],
    faq: [{ question: 'What do you need from us?', answer: 'The URL. For the 199 USD tier, read-only access to Search Console and Bing Webmaster, both free and both yours.' }, { question: 'What happens after the audit?', answer: 'Two packages. Fix at 249 USD closes the checks that do not need your subject knowledge, against a list we agree before you pay. Foundation starts at 500 USD and adds the writing: the opening paragraphs, the named sources and the missing pages, quoted after the audit because the price depends on how many pages earn impressions.' }, { question: 'Is the report generic?', answer: 'The checklist rows are collected from your site; the narrative is written for it. A real anonymised sample is published so you can see the shape before paying, and the free AI visibility check shows you the first two pages of it in ten seconds.' }],
    relatedGuides: [{ title: 'Inbound lead audit', href: '/guides/inbound-lead-audit/' }, { title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }],
    orderForm: { source: 'products:seo-audit', heading: 'Order the audit', placeholder: 'Your site URL, the tier (149, or 199 with Search Console access), and anything you already know is broken.' },
  },
  {
    slug: 'fix',
    label: 'Paid, per site',
    name: 'Fix',
    title: 'Fix: We Close the Checks That Do Not Need Your Subject Knowledge',
    description: 'We close the mechanical findings on your site: robots, sitemap, llms.txt, schema, headings, contact path, redirects, caching, plus the sixteen gates over every page. The list is agreed before you pay, and anything we do not close comes back as a refund of its share.',
    answer: 'Fix closes the findings that do not need to know anything about your business: crawler access, the sitemap and its hygiene, llms.txt, structured data, headings and descriptions, the contact path and the form, redirects, caching headers, broken internal links and duplicate images. Thirty-six of the forty-four checks the audit can raise fall in this group, thirty-three of them on a hosted site builder where we cannot touch the source. We name the exact list for your site before you pay, and we re-check the site thirty days later and email you what moved.',
    price: '249 USD',
    priceNote: 'The list of checks is agreed in writing before payment. Anything on that list we do not close comes back as a refund of its share',
    status: 'available',
    cta: { text: 'Get the list for your site', href: '#order' },
    og: '/og/og-audit.png',
    order: 7,
    get: [
      'The checks from your audit that do not need your subject knowledge, closed. Thirty-six of the forty-four the audit can raise fall in that group; a typical site has around forty of them open or passing, and only the open ones enter your list',
      'The sixteen quality gates run over every page of your corpus, not a sample: cut titles, copied paragraphs, hollow sections, dead links, stale llms.txt, figures with no source',
      'Broken internal links and duplicate images found by the same gates we run on our own sites',
      'A generated llms.txt that points at your pages, and a sitemap with the utility pages out and real dates in',
      'A redirect pass: ghost pages, dead rules, and links that point at a redirect instead of the page',
      'A re-check thirty days later, automatic, with an email showing exactly what moved',
    ],
    how: [
      { step: 'Run the free check', text: 'Ten seconds, no account. It shows what is broken before anybody pays anything.' },
      { step: 'Get the list and the price', text: 'We name the exact checks we will close on your site. Things your platform cannot do never enter the list.' },
      { step: 'Approve, then pay', text: 'You pay after you have agreed the list, not before. Work starts when the payment clears.' },
      { step: 'Get the site back, then the re-check', text: 'Usually three to five working days. Thirty days later an automatic email shows what moved.' },
    ],
    needs: [
      { item: 'A way for us to change the site', cost: 'Free', why: 'Access to the repository, or an editor account in your CMS. Without one we can tell you what to change but cannot change it.' },
      { item: 'Text that lives in files, for the gates', cost: 'Free', why: 'The sixteen gates read Markdown or MDX files. On WordPress, Tilda and similar the gates cannot run, so they never enter your list and you are not charged for them. Everything else on this page works on any platform.' },
      { item: 'Your site address', cost: 'Free', why: 'That is all we need to produce the list and the price.' },
      { item: 'No paid tool, ever', cost: 'Free', why: 'Nothing we close depends on a service you would have to subscribe to. You can re-run every check yourself with the free tool and see the same result.' },
    ],
    notFor: [
      'Writing: the opening paragraphs, the sources and the missing pages need your facts, and that is Foundation',
      'Rankings and traffic: we close checks, and nobody honest promises positions',
      'Sites we cannot get into: without repository or CMS access there is nothing to fix',
    ],
    faq: [
      { question: 'What exactly do I get back?', answer: 'A written list of the checks we closed, each one verifiable by you with the free tool, plus the automatic re-check thirty days later. Nothing in the list is a claim you have to take on trust.' },
      { question: 'What if you cannot close something on the list?', answer: 'We refund its share. The list is agreed before payment and we only put on it what we have already confirmed is possible on your platform, so this should be rare, and when it happens you are not out of pocket for it.' },
      { question: 'Do I need the audit first?', answer: 'No. The free check plus a look at your site is enough for us to write the list. The audit is worth buying when you want the reading and the plan, not only the fixes.' },
      { question: 'How long does it take?', answer: 'Usually three to five working days from payment. If it is going to take longer we say so before the deadline, not after.' },
    ],
    relatedGuides: [{ title: 'Inbound lead audit', href: '/guides/inbound-lead-audit/' }, { title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }],
    orderForm: { source: 'products:fix', heading: 'Get the list for your site', placeholder: 'Your site URL, what it runs on (Astro, WordPress, Tilda, custom), and whether you can give repository or CMS access.' },
  },
  {
    slug: 'foundation',
    label: 'Paid, quoted per site',
    name: 'Foundation',
    title: 'Foundation: Fix Plus the Writing That Needs Your Facts',
    description: 'Everything in Fix, plus the three things a machine cannot do for you: an opening paragraph that can be quoted, a named source next to every figure, and the pages your market asks for that do not exist yet. From 500 USD, quoted after the audit.',
    answer: 'Foundation is Fix plus the writing. Five of the forty-four checks need to know your business: whether a page opens with an answer carrying a figure, whether that figure names its source, whether the page has enough substance to be cited at all, whether it is broken into sections, and whether it carries a table worth quoting. We rewrite the openings on the pages that already earn impressions, add sources to the figures, and build the pages your market asks for and you do not have. The price depends on how many pages earn impressions and how much rewriting they need, so it is quoted after the audit rather than guessed here.',
    price: 'from 500 USD',
    priceNote: 'Quoted after the audit: the price depends on how many pages earn impressions and how much of the writing is already there',
    status: 'available',
    cta: { text: 'Ask for a quote', href: '#order' },
    og: '/og/og-audit.png',
    order: 8,
    get: [
      'Everything in Fix, on the same terms',
      'An answer-first opening on the pages that already earn impressions: twenty to ninety words, one real figure, the source beside it',
      'A named source next to every figure on those pages, because a figure with no source is the first thing an answer engine drops',
      'The pages your market asks for and you do not have, written from your facts and checked by the gates before they ship',
      'A re-check thirty days later, automatic, with an email showing what moved',
    ],
    how: [
      { step: 'Audit first', text: 'Foundation is quoted from the audit, because the price depends on which pages earn impressions and what is already written.' },
      { step: 'Agree the scope and the price', text: 'A written list of the pages and what happens to each one. You pay after you have agreed it.' },
      { step: 'You supply the facts', text: 'We do not invent figures. Where a page needs a number, you give it or we find a public source and name it.' },
      { step: 'Write, check, ship', text: 'Every page goes through the sixteen gates before it goes live. Timing is in the quote and depends on the page count.' },
    ],
    needs: [
      { item: 'The audit', cost: '149 USD for the first ten', why: 'Foundation is quoted from it. Without the audit we would be guessing at the page count and the state of the writing.' },
      { item: 'Your facts', cost: 'Free, but it is your time', why: 'Figures, prices, terms, whatever your pages should state. We will not invent a number, and a page with no figure cannot be quoted by an answer engine.' },
      { item: 'A way for us to change the site', cost: 'Free', why: 'Repository or CMS access, same as Fix.' },
      { item: 'Patience of weeks, not days', cost: 'Free', why: 'Writing is the slow part. The timing is in the quote and it is honest.' },
    ],
    notFor: [
      'Anyone who wants pages written without supplying any facts: that produces text nobody can cite',
      'Rankings and traffic promises: we make none',
      'Sites with nothing to say yet: start with the free tools and the course instead',
    ],
    faq: [
      { question: 'Why is there no fixed price?', answer: 'Because the work is writing, and the amount depends on how many of your pages earn impressions and how much of the text is already usable. A fixed price would mean overcharging the small sites to cover the large ones.' },
      { question: 'Who writes the text?', answer: 'We do, from your facts. You give the numbers and the terms; we make the pages quotable and run them through the gates.' },
      { question: 'Can I do this myself?', answer: 'Yes, and for many people that is the right answer. Site Kit is the same pipeline packaged for one person at 79 USD, and the free gates check the result. Foundation is for people who would rather buy the hours than spend them.' },
      { question: 'What is the minimum?', answer: '500 USD. Below that the quote is not worth writing and Fix plus Site Kit gets you further for less.' },
    ],
    relatedGuides: [{ title: 'Programmatic SEO for lead generation', href: '/guides/programmatic-seo-lead-gen/' }, { title: 'AEO and GEO for inbound marketing', href: '/guides/aeo-geo-inbound-marketing/' }],
    orderForm: { source: 'products:foundation', heading: 'Ask for a quote', placeholder: 'Your site URL, roughly how many pages it has, and whether you have already bought the audit.' },
  },
];

export const PRODUCTS_FAQ = [
  { question: 'Which product first?', answer: 'The free gates. Run them on your site; the report tells you whether you need the starter, the audit or nothing.' },
  { question: 'Are the free tools really free?', answer: 'Yes, MIT licensed. They came out of a pipeline that publishes to eleven sites and they stay free; the paid products are the kit and the audit.' },
  { question: 'Do the tools send data anywhere?', answer: 'No. The gates and the starter run locally. The audit collector fetches your public pages the way a browser would.' },
];
