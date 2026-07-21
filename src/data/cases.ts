export type CaseMetric = {
  label: string;
  value: string;
  delta?: string;
  tone?: 'up' | 'new' | 'flat';
};

export type OperStackCase = {
  id: string;
  title: string;
  subtitle: string;
  market: string;
  launched: string;
  status: 'traction' | 'early' | 'indexing';
  stack: string[];
  headline: string;
  metrics: CaseMetric[];
  whatWeDid: string[];
  proofNote: string;
};

export const CASES_PERIOD = {
  current: '23 Jun to 18 Jul 2026',
  previous: '22 May to 16 Jun 2026',
  updated: '21 July 2026',
};

/** Public-facing hero stats. Growth-first; no raw click totals on marketing surfaces. */
export const NETWORK_HERO = {
  liveSites: 13,
  marketCount: '10+',
  tractionSites: 11,
  organicClicksGrowth: '+279%',
  organicVisibilityGrowth: '+194%',
  siteTrafficGrowth: '+204%',
  markets: [
    'Thailand',
    'Mexico',
    'Spain',
    'Portugal',
    'Greece',
    'Italy',
    'UAE',
    'United States',
    'Singapore',
    'South Africa',
    'Cambodia',
    'Global luxury vertical',
  ],
  proofLine:
    'Organic SEO clicks up +279% month over month across 13 inbound brands in 10+ countries and verticals.',
  proofSubline:
    'Same OperStack playbook: content engine, Lead Hub, CRM automation, and reporting. Metrics verified on audit.',
};

/** Internal totals kept for audit exports; not shown on public marketing copy. */
export const NETWORK_TOTALS = {
  liveSites: 13,
  sitemapUrls: 4283,
  organicClicksGrowth: '+279%',
  organicVisibilityGrowth: '+194%',
  siteTrafficGrowth: '+204%',
  tractionSites: 11,
};

/** Anonymized client outcomes. Domains withheld; metrics from GSC + GA4. */
export const CASES: OperStackCase[] = [
  {
    id: 'flagship-inbound',
    title: 'Flagship inbound property brand',
    subtitle: 'Primary EN market · high-volume SEO corpus',
    market: 'Southeast Asia resort market',
    launched: 'Mar 2026',
    status: 'traction',
    stack: ['SEO + AEO site', 'Content engine', 'Lead Hub routing', 'Reporting'],
    headline: 'More than doubled organic clicks and site traffic in one month while scaling past 1,100 indexable pages.',
    metrics: [
      { label: 'Organic SEO clicks', value: '+115%', tone: 'up' },
      { label: 'Search visibility', value: '+52%', tone: 'up' },
      { label: 'Site traffic', value: '+109%', tone: 'up' },
      { label: 'Indexable pages', value: '1,100+', tone: 'flat' },
    ],
    whatWeDid: [
      'Built and maintained a large editorial + project URL corpus with internal linking discipline.',
      'Raised CTR on high-intent project and guide templates through title and snippet testing.',
      'Connected capture paths to a single Lead Hub contract for source and routing consistency.',
    ],
    proofNote: 'Flagship primary EN property in the portfolio report snapshot.',
  },
  {
    id: 'ru-localized',
    title: 'Localized RU inbound brand',
    subtitle: 'Parallel corpus · schools and finance clusters',
    market: 'Same geography, Russian-language buyers',
    launched: 'Apr 2026',
    status: 'traction',
    stack: ['SEO + AEO site', 'Content engine', 'CRM automation', 'Reporting'],
    headline: 'Fastest organic growth in the portfolio: +170% clicks and +269% search visibility month over month.',
    metrics: [
      { label: 'Organic SEO clicks', value: '+170%', tone: 'up' },
      { label: 'Search visibility', value: '+269%', tone: 'up' },
      { label: 'Site traffic', value: '+280%', tone: 'up' },
      { label: 'Indexable pages', value: '450+', tone: 'flat' },
    ],
    whatWeDid: [
      'Launched finance and schools guide clusters tuned to RU search intent.',
      'Kept tags, stages, and source fields aligned with the EN stack architecture.',
      'Tracked Yandex index growth alongside Google traction.',
    ],
    proofNote: 'Primary RU property. Yandex metrics available in client drill-down.',
  },
  {
    id: 'mexico-greenfield',
    title: 'Greenfield Mexico investment brand',
    subtitle: 'New domain · first traction month',
    market: 'Mexico · inbound investment buyers',
    launched: 'Jun 2026',
    status: 'traction',
    stack: ['Programmatic SEO', 'SEO guides', 'Lead capture', 'Reporting'],
    headline: 'Greenfield launch reached first organic traction month within six weeks of go-live.',
    metrics: [
      { label: 'Organic traction', value: 'Month 1', delta: 'from zero', tone: 'new' },
      { label: 'Search visibility', value: 'Ramp complete', delta: 'new market', tone: 'new' },
      { label: 'Site traffic', value: 'Tracking live', tone: 'flat' },
      { label: 'Indexable pages', value: '340+', delta: '+17%', tone: 'up' },
    ],
    whatWeDid: [
      'Shipped an indexable core corpus and completed the crawl ramp in under six weeks.',
      'Used template cohorts for location and investment intent without thin duplication.',
      'Wired forms and chat to normalized source fields before scaling page count.',
    ],
    proofNote: 'Illustrates the OperStack launch playbook for a new geo brand.',
  },
  {
    id: 'spain-fast-ramp',
    title: 'Spain property inbound brand',
    subtitle: 'Fastest niche click ramp in the batch',
    market: 'Spain · international buyers',
    launched: 'Jun 2026',
    status: 'traction',
    stack: ['Content engine', 'SEO + AEO', 'CRM automation', 'Lead Hub'],
    headline: 'Fastest niche organic ramp in the June launch batch: first full traction month after mid-June go-live.',
    metrics: [
      { label: 'Organic traction', value: 'Month 1', delta: 'fastest ramp', tone: 'new' },
      { label: 'Search visibility', value: 'Strong start', delta: 'new market', tone: 'new' },
      { label: 'Site traffic', value: 'Growing', tone: 'flat' },
      { label: 'Indexable pages', value: '300+', tone: 'flat' },
    ],
    whatWeDid: [
      'Prioritized developer and region guides with clear buyer intent.',
      'Published only after dataset and internal-link checks passed QA.',
      'Matched CRM stages to sales actions, not marketing funnel labels.',
    ],
    proofNote: 'Highest click count among Jun 2026 niche launches in the portfolio snapshot.',
  },
  {
    id: 'portugal-guides',
    title: 'Portugal leisure property brand',
    subtitle: 'Lisbon + Algarve guide clusters',
    market: 'Portugal · lifestyle and relocation buyers',
    launched: 'Jun 2026',
    status: 'traction',
    stack: ['SEO guides', 'Content engine', 'Lead Hub', 'Reporting'],
    headline: 'Region guide clusters gained search visibility and site traffic in the first traction window after launch.',
    metrics: [
      { label: 'Organic traction', value: 'Month 1', delta: 'new market', tone: 'new' },
      { label: 'Search visibility', value: 'Accelerating', tone: 'up' },
      { label: 'Site traffic', value: 'Growing', tone: 'up' },
      { label: 'Indexable pages', value: '140+', delta: '+33%', tone: 'up' },
    ],
    whatWeDid: [
      'Built region-specific guide clusters instead of generic city swaps.',
      'Connected landing URLs to cohort reporting for template-level decisions.',
      'Kept impression growth ahead of clicks while testing snippet patterns.',
    ],
    proofNote: 'Representative Jun 2026 multi-geo launch pattern.',
  },
  {
    id: 'greece-golden-visa',
    title: 'Greece golden visa cluster',
    subtitle: 'Regulation-led inbound intent',
    market: 'Greece · residency-by-investment queries',
    launched: 'Jun 2026',
    status: 'traction',
    stack: ['SEO + AEO', 'Content engine', 'AI qualification', 'CRM automation'],
    headline: 'Golden visa cluster gained search visibility while qualification and CRM paths stayed governed.',
    metrics: [
      { label: 'Organic traction', value: 'Month 1', delta: 'new market', tone: 'new' },
      { label: 'Search visibility', value: 'Accelerating', tone: 'up' },
      { label: 'Site traffic', value: 'Growing', tone: 'up' },
      { label: 'Indexable pages', value: '150+', delta: '+33%', tone: 'up' },
    ],
    whatWeDid: [
      'Structured golden visa and region guides as answer-first pages.',
      'Separated qualification bot paths from CRM stage automation.',
      'Measured assisted visibility before pushing page count further.',
    ],
    proofNote: 'Cluster-led niche case. Compliance copy reviewed before publish.',
  },
  {
    id: 'yacht-vertical',
    title: 'Global yacht buyer guides',
    subtitle: 'Luxury vertical · corpus expansion',
    market: 'Global · yacht purchase research',
    launched: 'Jun 2026',
    status: 'traction',
    stack: ['Content engine', 'SEO + AEO', 'Social distribution', 'Reporting'],
    headline: 'Corpus doubled and first organic clicks appeared from a zero baseline in a new luxury vertical.',
    metrics: [
      { label: 'Content scale', value: '+132%', tone: 'up' },
      { label: 'Search visibility', value: 'From zero', delta: 'new vertical', tone: 'new' },
      { label: 'Organic traction', value: 'First clicks', tone: 'new' },
      { label: 'Indexable pages', value: '260+', tone: 'flat' },
    ],
    whatWeDid: [
      'Expanded guide factory output while keeping indexation scoped to quality cohorts.',
      'Used freshness and news modules for signal without spam patterns.',
      'Tracked template cohorts separately from flagship property sites.',
    ],
    proofNote: 'Different vertical, same OperStack content and reporting modules.',
  },
  {
    id: 'us-florida-steady',
    title: 'US Florida residential brand',
    subtitle: 'Competitive EN market · steady crawl',
    market: 'Florida · US inbound buyers',
    launched: 'Jun 2026',
    status: 'traction',
    stack: ['Programmatic SEO', 'SEO guides', 'Lead Hub', 'Reporting'],
    headline: 'Steady organic traction in a competitive US market within weeks of launch, without thin page spam.',
    metrics: [
      { label: 'Organic traction', value: 'Month 1', delta: 'US market', tone: 'new' },
      { label: 'Search visibility', value: 'Steady climb', tone: 'up' },
      { label: 'Index scale', value: '+87%', tone: 'up' },
      { label: 'Indexable pages', value: '320+', tone: 'flat' },
    ],
    whatWeDid: [
      'Prioritized indexable URL quality over raw page count in a crowded SERP.',
      'Maintained low-volume but consistent click growth as index matured.',
      'Documented template retirement rules before scaling further.',
    ],
    proofNote: 'Shows OperStack discipline in a mature English SERP, not only emerging geos.',
  },
];

export const VERIFICATION_POINTS = [
  'Growth percentages compare two consecutive 28-day measurement windows in Google Search and Analytics.',
  'Current window: 23 Jun to 18 Jul 2026. Prior window: 22 May to 16 Jun 2026.',
  'Client domains stay off this public page. We show outcomes by market and playbook, not vanity totals.',
  'On a stack audit we can walk through anonymized exports, per-brand drill-downs, and indexing logs under NDA.',
];
