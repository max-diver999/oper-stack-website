const NOTION_VERSION = '2022-06-28';

export type NotionLeadSource =
  | 'Website form'
  | 'Alex chat'
  | 'WhatsApp'
  | 'Telegram'
  | 'Manual'
  | 'Other';

export type ExternalAiSource =
  | 'Perplexity'
  | 'ChatGPT'
  | 'Bing Copilot'
  | 'Claude'
  | 'Other AI'
  | '';

export type NotionLeadData = {
  name?: string;
  phone?: string;
  email?: string;
  budget?: string;
  request?: string;
  source?: NotionLeadSource;
  sourcePage?: string;
  country?: string;
  notes?: string;
  receivedAt?: Date;
  stage?: string;
  broker?: string;
  captureMethod?: 'Form' | 'WhatsApp' | 'AI Alex';
  intentId?: string;
  sessionId?: string;
  landingPage?: string;
  currentPage?: string;
  firstReferrer?: string;
  externalAiSource?: ExternalAiSource;
  placement?: string;
  refCode?: string;
  waConfirmed?: boolean;
  channel?: 'Form' | 'WhatsApp' | 'AI Alex';
};

type NotionConfig = {
  token: string;
  databaseId: string;
};

export type NotionPage = {
  id: string;
  properties?: Record<string, {
    select?: { name?: string } | null;
  }>;
};

type FindLeadIds = {
  intentId?: string;
  sessionId?: string;
};

function notionHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

function richText(value: string) {
  return { rich_text: [{ text: { content: value.slice(0, 2000) } }] };
}

function phuketLeadDateIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+07:00`;
}

function buildLeadProperties(
  data: NotionLeadData,
  options: { leadNumber?: number; includeCreateDefaults?: boolean } = {},
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  if (typeof options.leadNumber === 'number') {
    properties['№'] = { number: options.leadNumber };
  }
  if (data.name !== undefined || options.includeCreateDefaults) {
    properties['Lead Name'] = {
      title: [{ text: { content: (data.name?.trim() || 'Unknown').slice(0, 2000) } }],
    };
  }
  if (data.receivedAt && options.includeCreateDefaults) {
    properties['Дата поступления лида'] = { date: { start: phuketLeadDateIso(data.receivedAt) } };
  }
  if (data.stage || options.includeCreateDefaults) {
    properties.Stage = { select: { name: data.stage || 'New lead' } };
  }
  if (data.broker || options.includeCreateDefaults) {
    properties.Broker = { select: { name: data.broker || 'Igor' } };
  }
  if (data.source) properties.Source = { select: { name: data.source } };
  if (data.phone) properties.Phone = { phone_number: data.phone };
  if (data.email) properties.Email = { email: data.email };
  if (data.budget) properties.Budget = richText(data.budget);
  if (data.request) properties.Request = richText(data.request);
  if (data.country) properties.Country = richText(data.country);
  if (data.notes) properties.Notes = richText(data.notes);
  if (data.sourcePage) properties['Form Page'] = { url: data.sourcePage };
  if (data.captureMethod) properties['Capture Method'] = { select: { name: data.captureMethod } };
  if (data.intentId) properties['Intent ID'] = richText(data.intentId);
  if (data.sessionId) properties['Session ID'] = richText(data.sessionId);
  if (data.landingPage) properties['Landing Page'] = { url: data.landingPage };
  if (data.currentPage) properties['Current Page'] = { url: data.currentPage };
  if (data.firstReferrer) properties['First Referrer'] = richText(data.firstReferrer);
  if (data.externalAiSource) {
    properties['External AI Source'] = { select: { name: data.externalAiSource } };
  }
  if (data.placement) properties.Placement = { select: { name: data.placement } };
  if (data.refCode) properties['Ref Code'] = richText(data.refCode);
  if (data.waConfirmed !== undefined) {
    properties['WA Confirmed'] = { checkbox: data.waConfirmed };
  }
  if (data.channel) properties.Channel = { select: { name: data.channel } };

  return properties;
}

export async function getNextLeadNumber(token: string, databaseId: string): Promise<number> {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: notionHeaders(token),
      body: JSON.stringify({
        sorts: [{ property: '№', direction: 'descending' }],
        page_size: 1,
      }),
    });
    if (!res.ok) return 1;
    const data = (await res.json()) as {
      results: { properties: Record<string, { number: number | null }> }[];
    };
    const max = data.results[0]?.properties?.['№']?.number;
    return (typeof max === 'number' ? max : 0) + 1;
  } catch {
    return 1;
  }
}

export async function findNotionLead(
  config: NotionConfig,
  ids: FindLeadIds,
): Promise<NotionPage | null> {
  const filters = [
    ids.intentId
      ? { property: 'Intent ID', rich_text: { equals: ids.intentId } }
      : null,
    ids.sessionId
      ? { property: 'Session ID', rich_text: { equals: ids.sessionId } }
      : null,
  ].filter(Boolean);

  if (!config.token || filters.length === 0) return null;

  const res = await fetch(`https://api.notion.com/v1/databases/${config.databaseId}/query`, {
    method: 'POST',
    headers: notionHeaders(config.token),
    body: JSON.stringify({
      filter: filters.length === 1 ? filters[0] : { or: filters },
      page_size: 1,
    }),
  });
  if (!res.ok) {
    throw new Error(`Notion lead lookup failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { results?: NotionPage[] };
  return data.results?.[0] ?? null;
}

export async function createNotionLead(
  config: NotionConfig,
  data: NotionLeadData,
): Promise<NotionPage | null> {
  if (!config.token) return null;

  const leadNumber = await getNextLeadNumber(config.token, config.databaseId);
  const properties = buildLeadProperties(
    { ...data, receivedAt: data.receivedAt ?? new Date() },
    { leadNumber, includeCreateDefaults: true },
  );
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(config.token),
    body: JSON.stringify({ parent: { database_id: config.databaseId }, properties }),
  });
  if (!res.ok) {
    throw new Error(`Notion lead creation failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as NotionPage;
}

export async function updateNotionLead(
  config: NotionConfig,
  pageId: string,
  data: NotionLeadData,
): Promise<NotionPage | null> {
  if (!config.token || !pageId) return null;

  const properties = buildLeadProperties(data);
  if (Object.keys(properties).length === 0) return { id: pageId };

  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(config.token),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    throw new Error(`Notion lead update failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as NotionPage;
}
