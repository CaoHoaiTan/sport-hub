import { nanoid } from 'nanoid';

/**
 * Generate a URL-friendly slug from a name.
 * Appends a short random suffix to ensure uniqueness.
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = nanoid(8);
  return `${base}-${suffix}`;
}
