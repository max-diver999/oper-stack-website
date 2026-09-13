/**
 * The store behind the AI visit counter for sites that are not on WordPress.
 *
 * WordPress writes into the owner's own database and never reaches this file. Everywhere else the
 * snippet has nowhere to write, so the numbers live here: a site, an assistant, a day and a count.
 * No visitor identifier, no address, no page.
 */
import { neon } from '@neondatabase/serverless';

/** Vercel injects this from the connected Neon database for production and preview. */
const CONNECTION = import.meta.env.DATABASE_URL || process.env.DATABASE_URL || '';

export function visitsDbConfigured(): boolean {
  return Boolean(CONNECTION);
}

export function visitsDb() {
  if (!CONNECTION) throw new Error('DATABASE_URL is not set');
  return neon(CONNECTION);
}

/**
 * Keys the owner is given. The site key travels in the snippet on public pages, so it is not a
 * secret and is only ever used to say which site a count belongs to. The view token is the secret:
 * it is the only thing that shows the numbers, so it is longer and never appears in page source.
 */
export function newSiteKey(): string {
  return 'osv_' + randomText(16);
}

export function newViewToken(): string {
  return randomText(40);
}

function randomText(length: number): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/**
 * Reduces whatever the owner typed to a bare hostname, or null when it cannot be one.
 * Private and local addresses are refused: a counter for them would count nothing.
 */
export function normaliseDomain(input: string): string | null {
  let s = String(input || '').trim().toLowerCase();
  if (!s) return null;
  if (!/^https?:\/\//.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    const h = u.hostname.replace(/^www\./, '');
    if (!h.includes('.') || h.length > 253) return null;
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return null;
    if (!/^[a-z0-9.-]+$/.test(h)) return null;
    return h;
  } catch {
    return null;
  }
}

/** True when the request came from the site that owns this key, or from no page at all. */
export function originMatchesDomain(origin: string | null, domain: string): boolean {
  if (!origin) return true; // a beacon without an Origin header is not evidence of anything
  try {
    const h = new URL(origin).hostname.toLowerCase().replace(/^www\./, '');
    return h === domain || h.endsWith('.' + domain);
  } catch {
    return false;
  }
}
