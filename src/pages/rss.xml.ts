import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../config';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const projects = await getCollection('projects', (p) => !p.data.draft);
  const items = projects
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.summary,
      link: `/projects/${p.id}`,
      categories: [p.data.category, ...(p.data.tags ?? [])],
    }));

  return rss({
    title: site.name,
    description: site.description,
    site: context.site ?? 'https://parham.dev',
    items,
    customData: '<language>en-us</language>',
  });
}
