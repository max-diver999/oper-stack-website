import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** The paragraph a reader and an answer engine both get first: 20 to 90 words, carrying one
     *  concrete figure this guide can defend. Kept apart from `description`, which is the meta
     *  description and has to stay short enough for a search result. */
    answer: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Maksim Shchegolev'),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional(),
  }),
});

const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    h1: z.string(),
    /** Answer-first paragraph, 40 to 60 words. Rendered above the fold and quoted by AI search. */
    answer: z.string(),
    /** Sort order inside /services/. Lower comes first. */
    order: z.number(),
    /** Short label for the services hub card. */
    cardLabel: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Maksim Shchegolev'),
    /** What the engagement includes. Rendered as the scope list. */
    scope: z.array(z.string()).min(4),
    /** Named deliverables the client keeps. */
    deliverables: z.array(z.string()).min(3),
    /** Honest boundary: what this engagement does not cover. */
    notIncluded: z.array(z.string()).min(2),
    /** Entry point from pricing.ts. Never a made-up figure. */
    entryPoint: z.object({
      tier: z.enum(['audit', 'setup', 'retainer']),
      note: z.string(),
    }),
    timeline: z.string(),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .min(4),
    /** Guides that own the underlying topic. Rendered as further reading. */
    relatedGuides: z.array(z.string()).min(2),
    /** Other services linked from this one. */
    relatedServices: z.array(z.string()).default([]),
  }),
});

/*
 * Страницы сравнения OperStack с другими инструментами (задание 26.09.2026, п. 7). Каждая цифра
 * о конкуренте живёт в frontmatter вместе со ссылкой, по которой её проверили, и датой проверки:
 * шаблон печатает источники под таблицей, чтобы ни одной цены без ссылки на странице не было.
 */
const cell = z.object({ text: z.string(), source: z.string().url().optional() });
const compare = defineCollection({
  loader: glob({ base: './src/content/compare', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    h1: z.string(),
    /** Короткий ответ под заголовком: 40-80 слов, с цифрой. */
    answer: z.string(),
    competitor: z.object({ name: z.string(), site: z.string().url().optional() }),
    kind: z.enum(['ai-visibility', 'seo-suite', 'agency', 'diy', 'free-tool', 'mcp']),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Когда проверены цены и возможности конкурента. */
    checkedAt: z.coerce.date(),
    author: z.string().default('Maksim Shchegolev'),
    chooseUs: z.array(z.string()).min(2),
    chooseThem: z.array(z.string()).min(2),
    table: z.array(z.object({ feature: z.string(), us: cell, them: cell })).min(15),
    /** Сайт самого конкурента в нашей бесплатной проверке: балл, сколько страниц прочитано, как мерили. */
    rivalScore: z.object({ score: z.number(), pages: z.number(), date: z.coerce.date(), note: z.string() }).optional(),
    sources: z.array(z.object({ label: z.string(), url: z.string().url() })).min(3),
    related: z.array(z.string()).min(3),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(5),
  }),
});

export const collections = { guides, services, compare };
