/** Edit tiers for your niche — imported by CommercialBudgetLadder.astro */
export interface CommercialTier {
  href: string;
  label: string;
  key: string;
}

export const COMMERCIAL_TIERS: CommercialTier[] = [
  { href: '/tier-entry/', label: 'Entry offer', key: 'entry' },
  { href: '/tier-mid/', label: 'Core offer', key: 'mid' },
  { href: '/tier-premium/', label: 'Premium offer', key: 'premium' },
  { href: '/tier-relocation/', label: 'Relocation / lifestyle', key: 'relocation' },
];

export const COMMERCIAL_LADDER_TITLE = 'Browse by category';
