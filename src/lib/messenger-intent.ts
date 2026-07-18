export const MESSENGER_CHANNELS = ['whatsapp', 'telegram', 'max'] as const;

export type MessengerChannel = (typeof MESSENGER_CHANNELS)[number];

export type MessengerIntentPayload = {
  channel: MessengerChannel;
  intentId: string;
  sessionId: string;
  placement: string;
  refCode: string;
  source?: string;
  page: string;
  currentPage: string;
  landingPage: string;
  referrer: string;
  firstReferrer: string;
  externalAiSource: string;
  ctaId: string;
  ctaText: string;
  message: string;
  destination: string;
  utm: Record<string, string>;
  userAgent: string;
};

const PAGE_STOP_WORDS = new Set([
  'phuket',
  'gajdy',
  'guide',
  'proekty',
  'project',
]);

export function isMessengerChannel(value: string): value is MessengerChannel {
  return MESSENGER_CHANNELS.includes(value as MessengerChannel);
}

export function isMessengerPlacement(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{1,63}$/i.test(value);
}

export function detectMessengerChannel(href: string): MessengerChannel | '' {
  try {
    const hostname = new URL(href, 'https://moregroupestate.ru').hostname.toLowerCase();
    if (hostname === 'wa.me' || hostname.endsWith('.whatsapp.com')) return 'whatsapp';
    if (hostname === 't.me' || hostname.endsWith('.telegram.me')) return 'telegram';
    if (hostname === 'max.ru' || hostname === 'max.me') return 'max';
  } catch {
    return '';
  }
  return '';
}

export function normalizePageToken(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const raw = segments.at(-1) || 'home';
  const words = raw
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .filter((word) => !PAGE_STOP_WORDS.has(word.toLowerCase()))
    .filter((word) => !/^20\d{2}$/.test(word));
  const token = (words.join('') || raw)
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 24);
  return token || 'HOME';
}

export function buildMessengerRefCode(pathname: string, placement: string): string {
  const suffix = placement.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 16) || 'CTA';
  return `${normalizePageToken(pathname)}-${suffix}`;
}

export function addRefCodeToWhatsAppHref(href: string, refCode: string): string {
  const url = new URL(href, 'https://wa.me');
  const existing = url.searchParams.get('text')?.trim()
    || 'Здравствуйте! Интересует недвижимость на Пхукете.';
  const marker = `[Ref: ${refCode}]`;
  const message = existing.includes(marker) ? existing : `${existing}\n\n${marker}`;
  url.searchParams.set('text', message);
  return url.href;
}

export function getMessengerMessage(href: string): string {
  try {
    return new URL(href).searchParams.get('text') || '';
  } catch {
    return '';
  }
}
