/** OperStack — standalone B2B brand (not real estate). */
export const SITE = {
  name: 'OperStack',
  tagline: 'AI visibility software',
  url: 'https://oper-stack.com',
  description:
    'OperStack is AI visibility software: a free check of what ChatGPT and other assistants see on a site, and a weekly subscription that shows whether ChatGPT names you, who it names instead, and what to fix.',
  email: 'info@oper-stack.com',
  /** No phone is published: we answer by email and on Telegram. */
  telegram: 'operstack',
  /** City and country only, no street. Rating systems and answer engines use this to tell one
   *  business from another with a similar name; a street address would add nothing for them. */
  address: { locality: 'Buenos Aires', country: 'AR' },
  editorial: 'OperStack',
  /** Standalone brand. Parent studio mentioned in copy only, not cross-linked for SEO cannibalization.
   *  Only profiles that actually exist and answer 200. Never claim a profile we do not run. */
  sameAs: [
    'https://github.com/oper-stack',
    'https://www.npmjs.com/org/operstack',
    'https://apify.com/operstack',
    'https://www.producthunt.com/products/operstack-gates',
  ] as string[],
} as const;
