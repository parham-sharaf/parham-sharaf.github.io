import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tech: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    status: z.enum(['shipped', 'in-progress', 'archived', 'research']).default('shipped'),
    links: z
      .object({
        github: z.string().url().optional(),
        demo: z.string().url().optional(),
        paper: z.string().url().optional(),
        docs: z.string().url().optional(),
        external: z.string().url().optional(),
      })
      .default({}),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
