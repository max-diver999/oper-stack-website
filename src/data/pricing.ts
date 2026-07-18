export type PricingTier = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'audit',
    name: 'Audit',
    tagline: 'See where inbound leads leak',
    price: 'Free',
    features: [
      '30 to 45 min stack review',
      'SEO, bots, CRM, reporting checklist',
      'Module fit for your stage',
      'Written action list, not a sales deck',
    ],
    cta: 'Request free audit',
    href: '/audit/?utm=pricing-audit',
  },
  {
    id: 'setup',
    name: 'Setup',
    tagline: 'Launch your operating stack',
    price: 'Custom quote',
    priceNote: 'Typical scope: Lead Hub + 3 to 5 modules',
    featured: true,
    features: [
      'Lead Hub routing and CRM wiring',
      'SEO site, AI qualification, or reporting modules',
      'Integrations and handoff docs',
      'Go-live support window',
    ],
    cta: 'Book setup call',
    href: '/audit/?utm=pricing-setup',
  },
  {
    id: 'retainer',
    name: 'Retainer',
    tagline: 'Keep the stack running and growing',
    price: 'Custom quote',
    priceNote: 'Monthly ops + content + enablement',
    features: [
      'Content and programmatic SEO cadence',
      'Bot and CRM rule updates',
      'Reporting and SLA reviews',
      'Team training and onboarding paths',
    ],
    cta: 'Talk retainer',
    href: '/audit/?utm=pricing-retainer',
  },
];

export const PRICING_FAQ = [
  {
    question: 'What is OperStack?',
    answer:
      'OperStack is the operating stack for businesses that live on inbound leads: SEO and AEO content, AI qualification, CRM automation, team training, and reporting. One Lead Hub connects every module.',
  },
  {
    question: 'Is OperStack a real estate product?',
    answer:
      'No. OperStack is a standalone B2B lead operations stack. EstateOS is an optional vertical for property businesses and is not the main product.',
  },
  {
    question: 'How long does Setup take?',
    answer:
      'Most setups land in 4 to 8 weeks depending on modules, CRM state, and content backlog. Audit clarifies scope before any build starts.',
  },
  {
    question: 'Do I need every module on the map?',
    answer:
      'No. Teams usually start with Lead Hub plus SEO, AI qualification, and CRM automation. Other modules add when volume or team size demands it.',
  },
  {
    question: 'What do you need from us to start?',
    answer:
      'CRM access or export, current site and ad URLs, qualification scripts if any, and one owner for routing rules. We document everything we touch.',
  },
  {
    question: 'Can we keep our existing CRM?',
    answer:
      'Yes. Lead Hub connects to Kommo, HubSpot, Pipedrive, and custom APIs. We route and tag; we do not force a rip-and-replace on day one.',
  },
];

export const PRICING_INCLUDES = [
  'Lead Hub routing and attribution',
  'Documented integrations and handoff',
  'Human override on every automated step',
  'Production-tested patterns, not slideware',
];
