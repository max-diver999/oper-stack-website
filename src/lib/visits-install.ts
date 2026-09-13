/**
 * Looks at the owner's own page and says whether the counter's line is actually on it.
 *
 * An empty table has two very different causes: nobody has arrived from an assistant yet, or the
 * line was never saved. Guessing between them wastes the owner's week, and telling them to read
 * their own page source is the kind of instruction this product exists to avoid.
 */
const UA =
  'Mozilla/5.0 (compatible; OperStackVisibility/0.2; +https://oper-stack.com/visits/)';

export type InstallState = {
  /** true: our line is on the page. false: it is not. null: we could not look. */
  installed: boolean | null;
  /** Set when the line is there but carrying somebody else's key. */
  wrongKey?: boolean;
  reason?: string;
};

export async function snippetInstalled(domain: string, key: string): Promise<InstallState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(`https://${domain}/`, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'text/html,*/*' },
    });
    const html = (await res.text()).slice(0, 400_000);

    // A challenge page is not the owner's page and proves nothing either way.
    if (res.status === 403 || /cf-mitigated|just a moment|cf_chl/i.test(html)) {
      return { installed: null, reason: 'The site turns away automated readers, so we cannot look from outside.' };
    }
    if (!res.ok) {
      return { installed: null, reason: `The site answered ${res.status}.` };
    }

    if (html.includes(key)) return { installed: true };
    if (/oper-stack\.com\/v\.js/i.test(html)) {
      return {
        installed: false,
        wrongKey: true,
        reason: 'The line is there, but it carries a different key, so the visits are being counted somewhere else.',
      };
    }
    return { installed: false };
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return { installed: null, reason: timeout ? 'The site took too long to answer.' : 'The site did not answer.' };
  } finally {
    clearTimeout(timer);
  }
}
