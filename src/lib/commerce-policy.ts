/** Product names used by the ledger and the email sequence. Keep this file free of DB imports. */
export type CommerceProduct =
  | 'report-9'
  | 'report-29'
  | 'audit-149'
  | 'agency'
  | 'site-kit-owner'
  | 'site-kit-agency'
  | 'pain-to-seo'
  | 'course';

const INCLUDED: Record<CommerceProduct, CommerceProduct[]> = {
  'report-9': ['report-9'],
  'report-29': ['report-9', 'report-29'],
  'audit-149': ['report-9', 'report-29', 'audit-149'],
  agency: ['report-9', 'report-29', 'agency'],
  'site-kit-owner': ['site-kit-owner'],
  'site-kit-agency': ['site-kit-owner', 'site-kit-agency'],
  'pain-to-seo': ['pain-to-seo'],
  course: ['course'],
};

/** Buying a higher rung suppresses offers for every rung it already contains. */
export function entitlementsGranted(product: CommerceProduct): CommerceProduct[] {
  return [...INCLUDED[product]];
}

export function ownsOffer(owned: Iterable<string>, offered: CommerceProduct): boolean {
  const set = new Set(owned);
  return set.has(offered);
}

/** Which concrete offers occur in each follow-up letter. */
export function offersInSequenceLetter(letter: number, agencyVariant = false): CommerceProduct[] {
  if (letter === 2) return ['report-29'];
  if (letter === 3) return ['report-9'];
  if (letter === 4) return agencyVariant ? ['agency'] : ['audit-149'];
  if (letter === 5) return ['report-29'];
  if (letter === 6) return ['audit-149', 'agency'];
  return [];
}
