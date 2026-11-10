// Astro content collections. Only postmortems use one; the rest of
// src/content/ is YAML loaded through src/lib/content.ts.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postmortems = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/postmortems' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    // Month and year only, YYYY-MM. Exact dates are scrubbed.
    month: z.string().regex(/^\d{4}-\d{2}$/),
    duration: z.string(),
    impact: z.string(),
    tags: z.array(z.string()).default([]),
    // Drafts render under `astro dev` only and never ship in a build.
    draft: z.boolean().default(true),
  }),
});

export const collections = { postmortems };
