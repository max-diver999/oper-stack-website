/**
 * Lead API template (v3.2, 2026-07-13).
 * Copy → src/pages/api/lead.ts
 *
 * Includes: spam gate, { accepted }, intentId dedup, healthcheck bypass.
 * Optional Notion CRM when NOTION_TOKEN + NOTION_LEADS_DB are set.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { assessLeadSpam } from '../../lib/lead-spam-gate';
import { detectExternalAiSource } from '../../lib/lead-attribution';
import {
  createNotionLead,
  findNotionLead,
  updateNotionLead,
  type NotionLeadData,
} from '../../lib/notion-leads';

/** REQUIRED: without this POST returns 405 on Vercel static output */
export const prerender = false;

const TG_TOKEN = import.meta.env.TG_TOKEN || '';
const TG_CHAT_ID = import.meta.env.TG_CHAT_ID || '';
const NOTION_TOKEN = (import.meta.env.NOTION_TOKEN || '').replace(/\\n/g, '').trim();
const NOTION_LEADS_DB = (import.meta.env.NOTION_LEADS_DB || '').replace(/\\n/g, '').trim();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendTelegram(text: string): Promise<void> {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });
  if (!res.ok) {
    throw new Error(`Telegram failed: ${res.status}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const nameText = String(body.name || '').trim();
    const phoneText = String(body.phone || '').trim();
    const contactText = String(body.contact || '').trim();
    const resolvedPhone = phoneText || contactText.split('/')[0]?.trim() || '';
    const phoneDigits = resolvedPhone.replace(/\D/g, '');
    const messageText = String(body.message || '').trim();
    const sourceText = String(body.source || '').toLowerCase();
    const intentIdText = String(body.intentId || '').trim().slice(0, 200);
    const sessionIdText = String(body.sessionId || '').trim().slice(0, 200);
    const firstReferrerText = String(body.firstReferrer || '').trim();
    const resolvedExternalAiSource =
      detectExternalAiSource(firstReferrerText) || String(body.externalAiSource || '');

    const isHealthcheck =
      sourceText.includes('healthcheck') ||
      sourceText.includes('deployment-probe') ||
      String(contactText).toLowerCase() === 'healthcheck@bot';

    if (!isHealthcheck && phoneDigits.length < 8) {
      return new Response(JSON.stringify({ error: 'Valid phone required' }), { status: 400 });
    }

    const spamVerdict = assessLeadSpam({
      name: nameText,
      email: String(body.email || '').trim(),
      message: messageText,
      website: String(body.website || body.hp || ''),
      formLoadedAt:
        typeof body.formLoadedAt === 'number' ? body.formLoadedAt : Number(body.formLoadedAt) || undefined,
      formElapsedMs:
        typeof body.formElapsedMs === 'number' ? body.formElapsedMs : Number(body.formElapsedMs) || undefined,
      isHealthcheck,
    });

    if (spamVerdict.spam) {
      console.info('lead spam blocked', spamVerdict.reason);
      return new Response(JSON.stringify({ success: true, accepted: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lines = [
      isHealthcheck ? '🧪 <b>Healthcheck lead</b>' : `📥 <b>New lead | ${escapeHtml(SITE.name)}</b>`,
      nameText ? `👤 ${escapeHtml(nameText)}` : null,
      resolvedPhone ? `📱 ${escapeHtml(resolvedPhone)}` : null,
      messageText ? `💬 ${escapeHtml(messageText)}` : null,
      body.page ? `🌐 ${escapeHtml(String(body.page))}` : null,
      intentIdText ? `🆔 ${escapeHtml(intentIdText)}` : null,
      resolvedExternalAiSource ? `🤖 ${resolvedExternalAiSource}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    await sendTelegram(lines);

    if (!isHealthcheck && NOTION_TOKEN && NOTION_LEADS_DB) {
      const notionConfig = { token: NOTION_TOKEN, databaseId: NOTION_LEADS_DB };
      const notionLead: NotionLeadData = {
        name: nameText,
        phone: resolvedPhone,
        email: String(body.email || '').trim(),
        budget: String(body.budget || ''),
        request: [body.context, messageText, body.goal].filter(Boolean).join(' | '),
        source: 'Website form',
        sourcePage: String(body.landingPage || body.page || SITE.url),
        stage: 'New',
        captureMethod: 'Form',
        channel: 'Form',
        intentId: intentIdText,
        sessionId: sessionIdText,
        landingPage: String(body.landingPage || ''),
        currentPage: String(body.currentPage || body.page || ''),
        firstReferrer: firstReferrerText,
        externalAiSource: resolvedExternalAiSource as NotionLeadData['externalAiSource'],
        placement: String(body.placement || ''),
        receivedAt: new Date(),
      };
      const existing = intentIdText ? await findNotionLead(notionConfig, { intentId: intentIdText }) : null;
      if (existing) {
        await updateNotionLead(notionConfig, existing.id, notionLead);
      } else {
        await createNotionLead(notionConfig, notionLead);
      }
    }

    return new Response(JSON.stringify({ success: true, accepted: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Lead API error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
