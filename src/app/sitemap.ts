import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import { baseUrl, getLanguageAlternates } from '@/lib/metadata';
import { getLocalePath } from '@/lib/i18n';

/**
 * Generate sitemap with:
 * - Multi-language alternates (hreflang) for SEO
 * - Actual lastModified dates from page data
 * - Proper priority hierarchy
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const url = baseUrl.origin;

  entries.push({
    url: `${url}/zh/plugins`,
    changeFrequency: 'daily',
    priority: 0.9,
    alternates: { languages: getLanguageAlternates('plugins', ['zh']) },
  });

  function toDate(input: unknown): Date | null {
    if (!input) return null;
    if (input instanceof Date)
      return Number.isNaN(input.getTime()) ? null : input;
    const d = new Date(String(input));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function docsPathForSlug(slugKey: string): string {
    return slugKey ? `docs/${slugKey}` : 'docs';
  }

  // Track lastModified per language for homepages (more meaningful than "now")
  const latestModifiedByLang = new Map<string, Date>();

  // Add homepage for each language with alternates
  for (const lang of i18n.languages) {
    entries.push({
      url: `${url}${getLocalePath(lang)}`,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: getLanguageAlternates(''),
      },
    });
  }

  // Create a map to group pages by slug across languages
  const pagesBySlug = new Map<
    string,
    { lang: string; page: ReturnType<typeof source.getPages>[number] }[]
  >();

  // Collect all pages grouped by slug
  for (const lang of i18n.languages) {
    const pages = source.getPages(lang);
    for (const page of pages) {
      const slugKey = page.slugs.join('/');
      if (!pagesBySlug.has(slugKey)) {
        pagesBySlug.set(slugKey, []);
      }
      pagesBySlug.get(slugKey)!.push({ lang, page });

      const lm = toDate(page.data.lastModified);
      if (lm) {
        const prev = latestModifiedByLang.get(lang);
        if (!prev || lm.getTime() > prev.getTime()) {
          latestModifiedByLang.set(lang, lm);
        }
      }
    }
  }

  // Backfill homepage lastModified with latest docs update per language (if any)
  for (const entry of entries) {
    const parts = new URL(entry.url).pathname.split('/').filter(Boolean);
    if (parts.length !== 1) continue;
    const match = parts[0];
    if (!match) continue;
    const lm = latestModifiedByLang.get(match);
    if (lm) entry.lastModified = lm;
  }

  // Add docs pages with proper alternates and lastModified
  for (const [slugKey, langPages] of pagesBySlug) {
    const availableLangs = langPages.map((p) => p.lang);
    const docsPath = docsPathForSlug(slugKey);

    for (const { lang, page } of langPages) {
      // Each language version should use its own lastModified.
      const lastModified = toDate(page.data.lastModified);

      // Determine priority based on page depth
      const depth = page.slugs.length;
      let priority: number;
      if (depth <= 1) {
        priority = 0.9; // Top-level pages (e.g., /docs/guide)
      } else if (depth === 2) {
        priority = 0.8; // Second-level pages
      } else {
        priority = 0.7; // Deeper pages
      }

      // Determine change frequency based on page type
      const isApiPage = page.slugs[0] === 'api';
      const changeFrequency: 'daily' | 'weekly' | 'monthly' = isApiPage
        ? 'monthly'
        : 'weekly';

      entries.push({
        url: `${url}${getLocalePath(lang, docsPath)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency,
        priority,
        alternates: {
          languages: getLanguageAlternates(docsPath, availableLangs),
        },
      });
    }
  }

  return entries;
}
