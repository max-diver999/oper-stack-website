import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
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

export const collections = { guides, services };
