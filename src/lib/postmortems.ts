import { getCollection, type CollectionEntry } from 'astro:content';

export type Postmortem = CollectionEntry<'postmortems'>;

/** Drafts are visible under `astro dev` and excluded from every build. */
export function isVisible(entry: Postmortem): boolean {
  return import.meta.env.DEV || !entry.data.draft;
}

/** All postmortems, newest incident first. */
export async function allPostmortems(): Promise<Postmortem[]> {
  const entries: Postmortem[] = await getCollection('postmortems');
  return entries.sort((a: Postmortem, b: Postmortem) => b.data.month.localeCompare(a.data.month));
}

/** "2022-06" -> "June 2022". */
export function formatMonth(month: string): string {
  const [year, mm] = month.split('-').map(Number);
  const name = new Date(Date.UTC(year, mm - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  });
  return `${name} ${year}`;
}
