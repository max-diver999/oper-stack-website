/**
 * Gives an owner the one line they paste on their site, and the private link that shows the number.
 *
 * Two keys come out of this. The site key goes in the snippet and is public by design: it is in the
 * page source of every page. The view token is the secret and is the only way to see the numbers,
 * so it is shown once here and emailed once, and never appears on a public page.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../../data/site';
import { sendTransactionalMail } from '../../../lib/mail-smtp';
import {
  visitsDb,
  visitsDbConfigured,
  newSiteKey,
  newViewToken,
  normaliseDomain,
} from '../../../lib/visits-db';

/** REQUIRED: without this POST returns 405 on Vercel static output */
export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!visitsDbConfigured()) {
    return json({ error: 'The counter is not switched on yet. Write to ' + SITE.email + '.' }, 503);
  }

  let domainInput = '';
  let email = '';
  let platform = '';
  let honeypot = '';
  try {
    const body = await request.json();
    domainInput = String(body?.domain || '');
    email = String(body?.email || '').trim();
    platform = String(body?.platform || '').trim().slice(0, 40);
    honeypot = String(body?.website || '').trim();
  } catch {
    return json({ error: 'Send a site address and an email.' }, 400);
  }

  // A field no person can see. Anything in it came from a machine.
  if (honeypot) return json({ error: 'Thanks.' }, 400);

  const domain = normaliseDomain(domainInput);
  if (!domain) return json({ error: 'Give a public web address, like yoursite.com.' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'Give an email we can send the link to.' }, 400);

  const sql = visitsDb();

  // Registering the same site twice is harmless: a key only counts pages that carry it, and the
  // numbers stay with whoever holds the view token. But sending back the key they already have
  // saves the honest owner from installing two snippets.
  const existing = await sql`
    select id, view_token from sites
    where domain = ${domain} and lower(email) = ${email.toLowerCase()} and view_token is not null
    order by created_at desc limit 1`;

  let key: string;
  let token: string;
  if (existing.length) {
    key = existing[0].id;
    token = existing[0].view_token;
  } else {
    key = newSiteKey();
    token = newViewToken();
    await sql`
      insert into sites (id, domain, email, platform, view_token)
      values (${key}, ${domain}, ${email}, ${platform || null}, ${token})`;
  }

  const dashboard = `${SITE.url}/visits/numbers/?t=${token}`;
  const snippet = `<script defer src="${SITE.url}/v.js" data-key="${key}"></script>`;

  // The link is the only way back to their numbers, so it goes to them by email as well as on
  // screen. A mail failure must not lose them the key they just got.
  try {
    await sendTransactionalMail({
      to: email,
      subject: 'Your AI visit counter for ' + domain,
      text: [
        'Paste this line into your site, just before </head>:',
        '',
        snippet,
        '',
        'Then open this link to see who sent you visitors:',
        dashboard,
        '',
        'Keep the link. It is the only way to see your numbers, and anyone who has it can see them too.',
        'Nothing about your visitors is stored: only which assistant, which day, and how many.',
      ].join('\n'),
      html: `<p>Paste this line into your site, just before <code>&lt;/head&gt;</code>:</p>
<pre style="background:#f4f4f5;padding:12px;border-radius:8px;overflow-x:auto"><code>${snippet
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</code></pre>
<p>Then open this link to see who sent you visitors:<br><a href="${dashboard}">${dashboard}</a></p>
<p>Keep the link. It is the only way to see your numbers, and anyone who has it can see them too.</p>
<p>Nothing about your visitors is stored: only which assistant, which day, and how many.</p>`,
    });
  } catch {
    /* the owner still has both on screen */
  }

  return json({ key, snippet, dashboard, domain });
};
