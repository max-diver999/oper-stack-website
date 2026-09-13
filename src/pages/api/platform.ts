/**
 * Tells a visitor what their own site is built with, so the instructions they get are the ones for
 * their platform rather than a generic "paste it into the head". Reads one public page, the way a
 * browser would, and stores nothing.
 */
import type { APIRoute } from 'astro';

/** REQUIRED: without this POST returns 405 on Vercel static output */
export const prerender = false;

const UA = 'Mozilla/5.0 (compatible; OperStackVisibility/0.1; +https://oper-stack.com/ai-visibility/)';

/** Order matters: a Shopify store built on a WordPress blog should read as Shopify for our purpose. */
const SIGNS: Array<[string, RegExp]> = [
  ['Shopify', /cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i],
  ['Wix', /static\.wixstatic\.com|wixsite\.com|_wixCIDX|X-Wix-/i],
  ['Squarespace', /squarespace\.com|static1\.squarespace|Squarespace\.afterBodyLoad/i],
  ['Tilda', /tilda\.(ws|cc)|tildacdn|t-body|tilda-blocks/i],
  ['Bitrix', /bitrix\/js|bx-core|\/bitrix\//i],
  ['Webflow', /webflow\.com|data-wf-page|assets\.website-files\.com/i],
  ['GoDaddy', /img1\.wsimg\.com|godaddysites\.com/i],
  ['Duda', /irp\.cdn-website\.com|dudaone|d\.la\d-c\d-/i],
  ['Weebly', /weebly\.com|editmysite\.com/i],
  ['HubSpot', /hs-scripts\.com|hubspot\.net|hs-analytics/i],
  ['Framer', /framerusercontent\.com|framer\.website/i],
  ['WordPress', /wp-content\/|wp-includes\/|content="WordPress/i],
  ['Next.js', /\/_next\/static\//i],
  ['Astro', /astro-island|data-astro-cid|\/_astro\//i],
  ['Nuxt', /\/_nuxt\//i],
];

/** Where the one line goes on each platform, in the words of somebody who has never seen HTML. */
const WHERE: Record<string, string> = {
  WordPress: 'plugin',
  Shopify: 'app',
  Tilda: 'Site settings, the More tab, the field called HTML code for the head. Paste it there and press Publish all pages.',
  Wix: 'Settings, Custom code, Add code to all pages, place it in the Head.',
  Squarespace: 'Settings, Advanced, Code injection, the Header field.',
  Bitrix: 'the site template, inside the head section. Whoever maintains the site does this in a minute.',
  Webflow: 'Project settings, Custom code, the Head code field, then Publish.',
  GoDaddy: 'Settings, Site-wide code, the Head field.',
  Duda: 'Site settings, Head HTML.',
  Weebly: 'Settings, SEO, Header code.',
  HubSpot: 'Settings, Website, Pages, the site header HTML field.',
  Framer: 'Site settings, General, Custom code, Start of head tag.',
  'Next.js': 'your own layout file, in the head. Send this page to whoever writes the code.',
  Astro: 'your base layout, in the head. Send this page to whoever writes the code.',
  Nuxt: 'nuxt.config, the head script list. Send this page to whoever writes the code.',
};

function normalise(input: string): string | null {
  let s = String(input || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
    const h = u.hostname.toLowerCase();
    // Never fetch something that is not a public site.
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return null;
    u.hash = '';
    u.search = '';
    return u.href;
  } catch {
    return null;
  }
}

/** The Russian site asks the same question from its own origin. Only ours are answered. */
const ALLOWED_ORIGINS = new Set(['https://oper-stack.ru', 'https://www.oper-stack.ru', 'https://oper-stack.com']);

function corsFor(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  return ALLOWED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
}

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, {
    status: 204,
    headers: {
      ...corsFor(request),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });

export const POST: APIRoute = async ({ request }) => {
  const cors = corsFor(request);
  let url: string | null = null;
  try {
    const body = await request.json();
    url = normalise(body?.url);
  } catch {
    /* falls through to the error below */
  }
  if (!url) {
    return new Response(JSON.stringify({ error: 'Give a public web address, like example.com.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'text/html,*/*' },
    });
    const html = (await res.text()).slice(0, 300_000);

    // A challenge page tells us nothing about the platform and must not be guessed at.
    const walled = res.status === 403 || /cf-mitigated|just a moment|cf_chl/i.test(html);
    if (walled) {
      return new Response(
        JSON.stringify({ url, platform: null, walled: true, where: null }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...cors } },
      );
    }

    let platform: string | null = null;
    for (const [name, re] of SIGNS) {
      if (re.test(html)) {
        platform = name;
        break;
      }
    }
    return new Response(
      JSON.stringify({ url, platform, where: platform ? WHERE[platform] ?? null : null, walled: false }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return new Response(
      JSON.stringify({ url, platform: null, error: timeout ? 'The site took too long to answer.' : 'The site did not answer.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  } finally {
    clearTimeout(timer);
  }
};
