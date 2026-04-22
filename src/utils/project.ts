import type { CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;

/**
 * Extract the first image URL from a project's markdown body.
 * Looks for ![...](/path/to/image.png) patterns and returns the first match.
 * Falls back to undefined if no image found.
 */
export function coverImage(project: Project): string | undefined {
  const body = project.body ?? '';
  const match = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return match?.[1];
}

/**
 * Rough reading time in minutes based on word count (200 wpm).
 * Only counts the markdown body, stripping image syntax.
 */
export function readingTime(project: Project): number {
  const body = project.body ?? '';
  const stripped = body
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')      // remove images
    .replace(/```[\s\S]*?```/g, '')             // remove code fences
    .replace(/<[^>]+>/g, '')                    // remove html tags
    .replace(/[#*_`~\[\]()>-]/g, ' ');          // strip markdown punctuation
  const words = stripped.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Return all projects sorted by date (newest first), excluding drafts.
 * Mirrors the sort used by the index/listing pages so neighbors match.
 */
export function sortedProjects(projects: Project[]): Project[] {
  return [...projects]
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Return the previous (newer) and next (older) projects relative to the
 * given one, based on the sortedProjects order.
 */
export function neighbors(
  projects: Project[],
  current: Project,
): { prev?: Project; next?: Project } {
  const sorted = sortedProjects(projects);
  const i = sorted.findIndex((p) => p.id === current.id);
  if (i === -1) return {};
  return {
    prev: i > 0 ? sorted[i - 1] : undefined,
    next: i < sorted.length - 1 ? sorted[i + 1] : undefined,
  };
}

/**
 * Aggregate unique tech tags across all projects, sorted by frequency.
 */
export function aggregateTech(projects: Project[]): { tech: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    for (const t of p.data.tech ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Aggregate unique category names across all projects.
 */
export function aggregateCategories(projects: Project[]): string[] {
  const set = new Set<string>();
  for (const p of projects) set.add(p.data.category);
  return [...set].sort();
}

/**
 * Find the 3 most-related projects to a given one, scored by shared tags,
 * tech, and category. Excludes the current project itself.
 */
export function relatedProjects(
  all: Project[],
  current: Project,
  limit = 3,
): Project[] {
  const curTags = new Set(current.data.tags ?? []);
  const curTech = new Set(current.data.tech ?? []);
  const curCat = current.data.category;

  const scored = all
    .filter((p) => p.id !== current.id && !p.data.draft)
    .map((p) => {
      let score = 0;
      for (const t of p.data.tags ?? []) if (curTags.has(t)) score += 3;
      for (const t of p.data.tech ?? []) if (curTech.has(t)) score += 2;
      if (p.data.category === curCat) score += 4;
      return { project: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.project.data.date.valueOf() - a.project.data.date.valueOf())
    .slice(0, limit);

  return scored.map((x) => x.project);
}
