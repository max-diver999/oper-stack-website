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

export const NETWORK_TOTALS = {
  liveSites: 13,
  sitemapUrls: 4283,
  gscClicks: 542,
  gscClicksDelta: '+279%',
  gscImpressions: 68961,
  gscImpressionsDelta: '+194%',
  ga4Sessions: 5449,
  ga4SessionsDelta: '+204%',
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
    headline: 'Doubled organic clicks and GA4 sessions in one GSC period while scaling past 1,100 indexable URLs.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '161', delta: '+115%', tone: 'up' },
      { label: 'GSC impressions', value: '31,907', delta: '+52%', tone: 'up' },
      { label: 'GA4 sessions (28d)', value: '3,317', delta: '+109%', tone: 'up' },
      { label: 'Live URLs', value: '1,139', tone: 'flat' },
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
    headline: 'Fastest click growth in the network: +170% GSC clicks and +269% impressions month over month.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '181', delta: '+170%', tone: 'up' },
      { label: 'GSC impressions', value: '7,419', delta: '+269%', tone: 'up' },
      { label: 'GA4 sessions (28d)', value: '502', delta: '+280%', tone: 'up' },
      { label: 'Live URLs', value: '459', tone: 'flat' },
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
    headline: 'From 9 to 2,655 impressions and 30 GSC clicks in the first full measurement month after launch.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '30', delta: 'new', tone: 'new' },
      { label: 'GSC impressions', value: '2,655', delta: 'new', tone: 'new' },
      { label: 'GA4 sessions (28d)', value: '226', tone: 'flat' },
      { label: 'Live URLs', value: '348', delta: '+17%', tone: 'up' },
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
    headline: '56 GSC clicks and 5,151 impressions in the first full GSC month after mid-June launch.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '56', delta: 'new', tone: 'new' },
      { label: 'GSC impressions', value: '5,151', delta: 'new', tone: 'new' },
      { label: 'GA4 sessions (28d)', value: '180', tone: 'flat' },
      { label: 'Live URLs', value: '308', tone: 'flat' },
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
    headline: '3,652 impressions and 169 GA4 sessions with 19 GSC clicks in the first traction window.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '19', delta: 'new', tone: 'new' },
      { label: 'GSC impressions', value: '3,652', delta: 'new', tone: 'new' },
      { label: 'GA4 sessions (28d)', value: '169', tone: 'flat' },
      { label: 'Live URLs', value: '144', delta: '+33%', tone: 'up' },
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
    headline: '20 GSC clicks with impressions accelerating past 3,100 in the first measurement month.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '20', delta: 'new', tone: 'new' },
      { label: 'GSC impressions', value: '3,116', delta: 'new', tone: 'new' },
      { label: 'GA4 sessions (28d)', value: '125', tone: 'flat' },
      { label: 'Live URLs', value: '150', delta: '+33%', tone: 'up' },
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
    headline: 'Corpus doubled to 260 URLs with 4,857 impressions and first organic clicks from zero baseline.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '10', delta: 'new', tone: 'new' },
      { label: 'GSC impressions', value: '4,857', delta: 'new', tone: 'new' },
      { label: 'GA4 sessions (28d)', value: '226', tone: 'flat' },
      { label: 'Live URLs', value: '260', delta: '+132%', tone: 'up' },
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
    headline: '329 live URLs and steady first clicks in a high-competition US market within weeks of launch.',
    metrics: [
      { label: 'GSC clicks (28d)', value: '16', delta: 'new', tone: 'new' },
      { label: 'GSC impressions', value: '831', delta: 'new', tone: 'new' },
      { label: 'GA4 sessions (28d)', value: '67', tone: 'flat' },
      { label: 'Live URLs', value: '329', delta: '+87%', tone: 'up' },
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
  'Metrics come from Google Search Console and Google Analytics 4, not estimates.',
  'Current window: 23 Jun to 18 Jul 2026. Comparison window: 22 May to 16 Jun 2026 where deltas are shown.',
  'Client domains and CRM lead counts are withheld on this public page.',
  'During a stack audit we can walk through anonymized exports, site-report drill-downs, and indexing logs.',
];
