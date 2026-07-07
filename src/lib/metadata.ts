import type { Metadata } from 'next';
import {
  DEFAULT_DOCS_CONFIG,
  type DocsConfig,
  getLocalizedSiteName,
} from '@/lib/docs-config';

export function createMetadata(
  override: Metadata,
  config: DocsConfig = DEFAULT_DOCS_CONFIG,
  locale = 'en'
): Metadata {
  const siteName = getLocalizedSiteName(config, locale);

  return {
    ...override,
    icons: {
      icon: config.logoUrl,
      shortcut: config.logoUrl,
      apple: config.logoUrl,
    },
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: config.homeUrl,
      images: config.logoUrl,
      siteName,
      type: 'website',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: config.logoUrl,
      ...override.twitter,
    },
  };
}

function resolveBaseUrl(): URL {
  const explicit = process.env.DOCS_PUBLIC_URL?.trim();
  if (explicit) {
    const u = explicit.replace(/\/+$/, '');
    return new URL(u.startsWith('http') ? u : `https://${u}`);
  }
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT?.trim() || '3000';
    return new URL(`http://localhost:${port}`);
  }
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) {
    return new URL(`https://${vercelHost}`);
  }
  return new URL('http://localhost:3000');
}

export const baseUrl = resolveBaseUrl();
