/**
 * Messenger intent API (v3.2).
 * EN: copy → src/pages/api/wa-intent.ts + WhatsAppIntentTracker.astro
 * RU: same endpoint; use MessengerIntentTracker + messenger-intent.ts (WA/TG/MAX)
 */
import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { detectExternalAiSource } from '../../lib/lead-attribution';
import {
  createNotionLead,
  findNotionLead,
  updateNotionLead,
  type NotionLeadData,
} from '../../lib/notion-leads';
import {
  buildWhatsAppRefCode,
  isWhatsAppPlacement,
  type WhatsAppIntentPayload,
} from '../../lib/whatsapp-intent';

export const prerender = false;

const TG_TOKEN = import.meta.env.TG_TOKEN || '';
const TG_CHAT_ID = import.meta.env.TG_CHAT_ID || '';
const NOTION_TOKEN = (import.meta.env.NOTION_TOKEN || '').replace(/\\n/g, '').trim();
const NOTION_LEADS_DB = (import.meta.env.NOTION_LEADS_DB || '').replace(/\\n/g, '').trim();

function cleanText(value: unknown, max = 500): string {
  return String(value || '').trim().slice(0, max);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendTelegram(text: string): Promise<boolean> {
  if (!TG_TOKEN || !TG_CHAT_ID) return false;
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' }),
  });
  return res.ok;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Partial<WhatsAppIntentPayload> & { source?: string };

    if (body.source === 'healthcheck') {
      return new Response(JSON.stringify({ success: true, healthcheck: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const intentId = cleanText(body.intentId, 200);
    const placementText = cleanText(body.placement, 50);
    const page = cleanText(body.page, 500) || '/';

    if (!/^wa_[a-z0-9_-]{8,196}$/i.test(intentId)) {
      return new Response(JSON.stringify({ error: 'Invalid intent ID' }), { status: 400 });
    }
    if (!isWhatsAppPlacement(placementText)) {
      return new Response(JSON.stringify({ error: 'Invalid placement' }), { status: 400 });
    }

    const refCode = buildWhatsAppRefCode(page, placementText);
    const firstReferrer = cleanText(body.firstReferrer, 1000);
    const externalAiSource = detectExternalAiSource(firstReferrer);

    if (NOTION_TOKEN && NOTION_LEADS_DB) {
      const notionConfig = { token: NOTION_TOKEN, databaseId: NOTION_LEADS_DB };
      const notionLead: NotionLeadData = {
        name: `WhatsApp intent: ${refCode}`,
        request: cleanText(body.ctaText || body.ctaId, 500),
        source: 'WhatsApp',
        sourcePage: cleanText(body.landingPage, 2000) || SITE.url,
        stage: 'WhatsApp intent',
        captureMethod: 'WhatsApp',
        channel: 'WhatsApp',
        intentId,
        sessionId: cleanText(body.sessionId, 200),
        landingPage: cleanText(body.landingPage, 2000),
        currentPage: cleanText(body.currentPage, 2000),
        firstReferrer,
        externalAiSource: externalAiSource as NotionLeadData['externalAiSource'],
        placement: placementText,
        refCode,
        waConfirmed: false,
        receivedAt: new Date(),
      };
      const existing = await findNotionLead(notionConfig, { intentId });
      if (existing) {
        await updateNotionLead(notionConfig, existing.id, notionLead);
      } else {
        await createNotionLead(notionConfig, notionLead);
      }
    }

    const lines = [
      `💬 <b>WhatsApp intent | ${escapeHtml(SITE.name)}</b>`,
      `🧭 <b>Ref:</b> ${escapeHtml(refCode)}`,
      `📍 <b>Placement:</b> ${escapeHtml(placementText)}`,
      externalAiSource ? `🤖 <b>AI:</b> ${externalAiSource}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const telegram = await sendTelegram(lines).catch(() => false);

    return new Response(JSON.stringify({ success: true, accepted: true, telegram, refCode }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('wa-intent error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
