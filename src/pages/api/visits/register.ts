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

/** The Russian site sells the same counter and calls this endpoint from its own origin. */
const ALLOWED_ORIGINS = new Set(['https://oper-stack.ru', 'https://www.oper-stack.ru', 'https://oper-stack.com']);

function corsFor(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  return ALLOWED_ORIGINS.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {};
}

function json(body: unknown, status = 200, cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
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
  if (!visitsDbConfigured()) {
    return json({ error: 'The counter is not switched on yet. Write to ' + SITE.email + '.' }, 503);
  }

  let domainInput = '';
  let email = '';
  let platform = '';
  let honeypot = '';
  let lang = 'en';
  try {
    const body = await request.json();
    domainInput = String(body?.domain || '');
    email = String(body?.email || '').trim();
    platform = String(body?.platform || '').trim().slice(0, 40);
    honeypot = String(body?.website || '').trim();
    lang = body?.lang === 'ru' ? 'ru' : 'en';
  } catch {
    return json({ error: 'Send a site address and an email.' }, 400, cors);
  }

  // A field no person can see. Anything in it came from a machine.
  if (honeypot) return json({ error: 'Thanks.' }, 400, cors);

  const domain = normaliseDomain(domainInput);
  if (!domain) return json({ error: 'Give a public web address, like yoursite.com.' }, 400, cors);
  if (!EMAIL_RE.test(email)) return json({ error: 'Give an email we can send the link to.' }, 400, cors);

  const sql = visitsDb();

  // This endpoint sends an email to whatever address it is given, so without a ceiling it is a
  // machine for posting mail to strangers from our domain, which is how a sending domain gets
  // burned. Two ceilings: one address cannot keep asking, and the whole endpoint has an hourly cap.
  const recent = await sql`
    select
      (select count(*) from sites where lower(email) = ${email.toLowerCase()}
         and created_at > now() - interval '1 hour')::int as mine,
      (select count(*) from sites where created_at > now() - interval '1 hour')::int as everyone`;
  if (recent[0].mine >= 5 || recent[0].everyone >= 120) {
    return new Response(
      JSON.stringify({
        error: 'That is a lot of sites at once. Write to ' + SITE.email + ' and we will set it up by hand.',
      }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  }

  // Registering the same site twice is harmless: a key only counts pages that carry it, and the
  // numbers stay with whoever holds the view token. But sending back the key they already have
  // saves the honest owner from installing two snippets.
  const existing = await sql`
    select id, view_token, last_email_at from sites
    where domain = ${domain} and lower(email) = ${email.toLowerCase()} and view_token is not null
    order by created_at desc limit 1`;

  let key: string;
  let token: string;
  let mayEmail = true;
  if (existing.length) {
    key = existing[0].id;
    token = existing[0].view_token;
    // Asking again is how an owner recovers a lost link, so it has to work. Asking again every
    // second is how somebody else's inbox gets filled, so it only works occasionally.
    const last = existing[0].last_email_at ? new Date(existing[0].last_email_at).getTime() : 0;
    mayEmail = Date.now() - last > 10 * 60 * 1000;
  } else {
    key = newSiteKey();
    token = newViewToken();
    await sql`
      insert into sites (id, domain, email, platform, view_token, lang)
      values (${key}, ${domain}, ${email}, ${platform || null}, ${token}, ${lang})`;
  }

  const dashboard = `${SITE.url}/visits/numbers/?t=${token}${lang === 'ru' ? '&lang=ru' : ''}`;
  const snippet = `<script defer src="${SITE.url}/v.js" data-key="${key}"></script>`;

  // The link is the only way back to their numbers, so it goes to them by email as well as on
  // screen. A mail failure must not lose them the key they just got.
  try {
    if (!mayEmail) throw new Error('emailed recently');
    await sendTransactionalMail({
      to: email,
      subject: lang === 'ru' ? `Ваш счётчик визитов из ИИ для ${domain}` : 'Your AI visit counter for ' + domain,
      text: (lang === 'ru'
        ? [
            'Вставьте эту строчку в шапку сайта, прямо перед </head>:',
            '',
            snippet,
            '',
            'Потом откройте эту ссылку, по ней видно, кто прислал вам людей:',
            dashboard,
            '',
            'Сохраните ссылку. Это единственный путь к вашим числам, и любой, у кого она есть, увидит их тоже.',
            'О самих посетителях не хранится ничего: только какой ассистент, какой день и сколько.',
          ]
        : [
            'Paste this line into your site, just before </head>:',
            '',
            snippet,
            '',
            'Then open this link to see who sent you visitors:',
            dashboard,
            '',
            'Keep the link. It is the only way to see your numbers, and anyone who has it can see them too.',
            'Nothing about your visitors is stored: only which assistant, which day, and how many.',
          ]).join('\n'),
      html: (() => {
        const code = snippet.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const pre = `<pre style="background:#f4f4f5;padding:12px;border-radius:8px;overflow-x:auto"><code>${code}</code></pre>`;
        return lang === 'ru'
          ? `<p>Вставьте эту строчку в шапку сайта, прямо перед <code>&lt;/head&gt;</code>:</p>
${pre}
<p>Потом откройте эту ссылку, по ней видно, кто прислал вам людей:<br><a href="${dashboard}">${dashboard}</a></p>
<p>Сохраните ссылку. Это единственный путь к вашим числам, и любой, у кого она есть, увидит их тоже.</p>
<p>О самих посетителях не хранится ничего: только какой ассистент, какой день и сколько.</p>`
          : `<p>Paste this line into your site, just before <code>&lt;/head&gt;</code>:</p>
${pre}
<p>Then open this link to see who sent you visitors:<br><a href="${dashboard}">${dashboard}</a></p>
<p>Keep the link. It is the only way to see your numbers, and anyone who has it can see them too.</p>
<p>Nothing about your visitors is stored: only which assistant, which day, and how many.</p>`;
      })(),
    });
    await sql`update sites set last_email_at = now() where id = ${key}`;
  } catch {
    /* the owner still has both on screen, which is the copy that matters */
  }

  return json({ key, snippet, dashboard, domain }, 200, cors);
};
