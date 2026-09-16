/**
 * Какая карточка доказательства стоит на какой странице товара.
 *
 * Правило одно и оно жёсткое: продукт получает карточку только того, к чему он реально приложил
 * руку. Карточка роста под инструментом, который к росту отношения не имеет, это не доказательство,
 * а украшение, и первый же внимательный покупатель это поймёт.
 *
 * Две карточки:
 *   network   показы в поиске по всей сети, тринадцать сайтов, замер из Search Console
 *   signals   восемь технических сигналов ИИ-видимости на пятнадцати сайтах, до и после
 *
 * Картинки собираются генератором: node _СИСТЕМА/tools/proof/build-cards.mjs --to-sites
 * Руками в этом файле ничего числового не пишется, только соответствие.
 */
export type ProofSlot = { card: 'network' | 'signals'; caption: string };

export const PRODUCT_PROOF: Record<string, ProofSlot> = {
  // Инструменты, которые ставят и проверяют сигналы ИИ-видимости.
  'ai-visibility': {
    card: 'signals',
    caption: 'This is the check run against our own fifteen sites, before and after the work. The audit score did not move, because its GEO group grew from three checks to eight in the same period; the signals did. Both measurements are dated and every signal is one curl request away.',
  },
  mcp: {
    card: 'signals',
    caption: 'The same eight signals, measured live on our own fifteen sites. This is what the MCP server reads when your assistant asks it to check a site.',
  },
  plugin: {
    card: 'signals',
    caption: 'What the plugin puts in place, measured on our own fifteen sites before and after.',
  },
  'seo-audit': {
    card: 'signals',
    caption: 'Part of what the audit looks for, shown on our own fifteen sites before and after the work.',
  },
  fix: {
    card: 'signals',
    caption: 'The kind of work in this package, done on our own fifteen sites and measured on both sides.',
  },

  // Инструменты и услуги, стоящие за ростом сети.
  gates: {
    card: 'network',
    caption: 'Every page behind this curve went through these gates before it was published.',
  },
  starter: {
    card: 'network',
    caption: 'The sites in this curve are built on this starter.',
  },
  'site-kit': {
    card: 'network',
    caption: 'This kit is the pipeline behind the sites in this curve.',
  },
  'pain-to-seo': {
    card: 'network',
    caption: 'The sites in this curve are the ones this toolkit was built for and tested on.',
  },
  foundation: {
    card: 'network',
    caption: 'The text work in this package is what moved this curve.',
  },
  agency: {
    card: 'network',
    caption: 'The reports in this plan are the ones behind this curve.',
  },
};

/**
 * Чего здесь намеренно нет. Счётчик визитов, отчёт за 9, сравнение с конкурентами за 29 и курс к
 * этим замерам отношения не имеют: они меряют или показывают, а не двигают. Ставить им карточку
 * роста значит присваивать чужой результат.
 */
export const NO_PROOF = ['visits', 'site-report', 'rival-watch', 'course'] as const;
