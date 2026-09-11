/**
 * Тексты карты системы на главной: название, роль, доказательство и одна строка о деле.
 *
 * Зачем отдельным файлом: эти же слова отдаются в HTML статической секцией, которую читают роботы
 * поиска и роботы, приносящие страницу в ответ ИИ. Они не выполняют скрипты, и до этого видели
 * пустой прямоугольник вместо карты. Скрипт карты берёт эти поля отсюда же (JSON в странице,
 * склейка по ключу), поэтому разойтись текстам некуда: человек и робот читают одно и то же.
 */
export const MAP_CORE = {
  "title": "Lead Hub",
  "role": "routing · CRM · analytics",
  "lede": "Single control point for every inbound lead. All modules read and write here. No lead lost between chat, site, CRM, and reports."
};

export const MAP_MODULES = [
  {
    "key": "seo",
    "name": "SEO + AEO Site",
    "role": "organic acquisition",
    "proof": "1,260+ pages · 2M+ words",
    "lede": "Programmatic SEO site factory: area guides, FAQs, investment content. Indexed for Google, ChatGPT, Perplexity."
  },
  {
    "key": "bot",
    "name": "AI Lead Qualification",
    "role": "24/7 response",
    "proof": "10 sec · chat + voice",
    "lede": "Qualifies inbound leads on WhatsApp, Telegram, web chat. Budget, timeline, intent. Routes hot leads to the right person."
  },
  {
    "key": "crm",
    "name": "CRM Automation",
    "role": "pipeline ops",
    "proof": "Kommo · multi-pipeline",
    "lede": "Automates deal stages, tags, assignments, follow-ups. Human stays in control on high-value steps."
  },
  {
    "key": "calls",
    "name": "Call Analytics",
    "role": "quality control",
    "proof": "Zoom · call review",
    "lede": "Captures call context, summaries, next steps. Surfaces gaps in scripts and follow-up."
  },
  {
    "key": "report",
    "name": "Reporting Engine",
    "role": "visibility",
    "proof": "GSC + GA4 + Kommo",
    "lede": "Live dashboards: organic, conversions, leads by source and broker. One screen for decisions."
  },
  {
    "key": "content",
    "name": "Content Engine",
    "role": "editorial factory",
    "proof": "validate · humanizer",
    "lede": "SEO articles, guides, landing copy. Agent draft, rules, validation, human approval before publish."
  },
  {
    "key": "social",
    "name": "Social Distribution",
    "role": "syndication",
    "proof": "RSS · crosspost",
    "lede": "Site publishes once. Telegram, LinkedIn, X pull from the same source. No duplicate manual work."
  },
  {
    "key": "news",
    "name": "News + Shorts",
    "role": "signal layer",
    "proof": "pipeline v2",
    "lede": "Curated AI and industry news with commentary. Auto digest to site and social. Shorts when video is ready."
  },
  {
    "key": "train",
    "name": "Team Training",
    "role": "onboard · enable",
    "proof": "AI paths · CRM gates",
    "lede": "AI onboarding and training for new hires and ongoing enablement. Company intro, team, scripts, quizzes. Progress synced to CRM before live leads are assigned."
  }
];
