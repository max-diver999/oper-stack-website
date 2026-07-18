/**
 * Soft lead spam gate: honeypot + timing + gibberish heuristics.
 * Returns { spam: true, reason } — caller should respond 200 without notifying.
 */

export type LeadSpamInput = {
  name?: string;
  email?: string;
  message?: string;
  website?: string;
  hp?: string;
  formLoadedAt?: number;
  formElapsedMs?: number;
  isHealthcheck?: boolean;
};

export type LeadSpamVerdict = {
  spam: boolean;
  reason?: string;
};

const MIN_ELAPSED_MS = 1200;

function isTooFast(input: LeadSpamInput, elapsed: number): boolean {
  if (elapsed >= MIN_ELAPSED_MS) return false;
  const name = String(input.name || '').trim();
  if (name.includes(' ') && name.length >= 4) return false;
  return true;
}

/** Random-bot names like MeJaRqtwZCEKwhiUz — long single token, many internal capitals. */
export function looksLikeGibberish(text: string): boolean {
  const t = text.trim();
  if (t.length < 12) return false;
  if (/\s/.test(t)) return false;
  if (/[^A-Za-z]/.test(t)) return false;
  if (/^[a-z]+$/.test(t)) return false;
  if (/^[A-Z][a-z]{2,}$/.test(t)) return false;

  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length < 12) return false;

  const upper = (letters.match(/[A-Z]/g) || []).length;
  const upperRatio = upper / letters.length;
  const internalCaps = (t.slice(1).match(/[A-Z]/g) || []).length;

  if (internalCaps >= 3 && upperRatio >= 0.18) return true;
  if (letters.length >= 16 && upperRatio >= 0.22) return true;

  return false;
}

/** Emails like a.k.u.g.e.r.u.l.o.l0.5.6@gmail.com or pr.ana.b.ses1@gmail.com */
export function looksLikeDotSpamEmail(email: string): boolean {
  const local = email.split('@')[0]?.trim() || '';
  if (!local) return false;
  const dots = (local.match(/\./g) || []).length;
  if (dots >= 4 && local.length / (dots + 1) <= 4) return true;
  if (dots >= 3) {
    const segments = local.split('.').filter(Boolean);
    if (segments.length >= 4 && segments.every((s) => s.length <= 4)) return true;
  }
  return false;
}

const SEO_PITCH_RE = [
  /optimiz(e|ing)\s+your\s+website\s+for\s+search\s+engines/i,
  /\bseo\s+services\b/i,
  /boost\s+your\s+(visibility|rankings?)/i,
  /search\s+engine\s+optim/i,
  /rank\s+higher\s+on\s+google/i,
  /\blink\s+building\b/i,
  /digital\s+marketing\s+(services|agency)/i,
  /we\s+recommend\s+optimizing/i,
  /help\s+more\s+(\w+\s+){0,4}discover\s+your/i,
  /website\s+for\s+search\s+engines/i,
  /your\s+valuable\s+\w+\s+property\s+research.*optimiz/i,
];

export function looksLikeSeoPitch(text: string): boolean {
  const t = text.trim();
  if (t.length < 40) return false;
  return SEO_PITCH_RE.some((re) => re.test(t));
}

export function assessLeadSpam(input: LeadSpamInput): LeadSpamVerdict {
  if (input.isHealthcheck) return { spam: false };

  const hp = String(input.website || input.hp || '').trim();
  if (hp) return { spam: true, reason: 'honeypot' };

  const elapsed =
    typeof input.formElapsedMs === 'number' && Number.isFinite(input.formElapsedMs)
      ? input.formElapsedMs
      : typeof input.formLoadedAt === 'number' && input.formLoadedAt > 0
        ? Date.now() - input.formLoadedAt
        : null;

  if (elapsed != null && elapsed >= 0 && isTooFast(input, elapsed)) {
    return { spam: true, reason: 'too_fast' };
  }

  const name = String(input.name || '').trim();
  const message = String(input.message || '').trim();
  const email = String(input.email || '').trim();

  if (name && looksLikeGibberish(name)) return { spam: true, reason: 'gibberish_name' };
  if (message && looksLikeGibberish(message)) return { spam: true, reason: 'gibberish_message' };
  if (message && looksLikeSeoPitch(message)) return { spam: true, reason: 'seo_pitch' };
  if (email && looksLikeDotSpamEmail(email)) return { spam: true, reason: 'dot_email' };

  return { spam: false };
}
