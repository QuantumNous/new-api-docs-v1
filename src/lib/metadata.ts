import type { Metadata } from 'next';
import { getLocalePath, i18n } from './i18n';

// Set SITE_URL at build time to choose a different canonical documentation domain.
export function resolveSiteUrl(value = 'https://docs.newapi.ai'): URL {
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'SITE_URL must be an absolute HTTP(S) origin, e.g. https://docs.newapi.ai'
    );
  }
  return url;
}

export const baseUrl = resolveSiteUrl(process.env.SITE_URL || undefined);

export const siteMetadata: Record<
  string,
  { title: string; description: string }
> = {
  en: {
    title: 'New API Documentation',
    description:
      'Deploy New API, connect AI providers, and integrate a unified API. Find installation guides, channel and token configuration, API references, and Skills.',
  },
  zh: {
    title: 'New API 文档',
    description:
      'New API 官方文档：从 Docker 部署、模型渠道与令牌配置，到统一 AI 接口调用、任务插件和 Skills，快速搭建和使用你的 AI 网关。',
  },
  ja: {
    title: 'New API ドキュメント',
    description:
      'New API のデプロイ、AI プロバイダーの接続、統一 API の利用を解説。インストール、チャネルとトークンの設定、API リファレンス、Skills を紹介します。',
  },
};

const ogLocales: Record<string, string> = {
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

export function getLanguageAlternates(
  path: string,
  languages: string[] = i18n.languages
) {
  const alternates: Record<string, string> = {};
  for (const lang of languages) {
    alternates[lang] = new URL(getLocalePath(lang, path), baseUrl).href;
  }
  const defaultLang = languages.includes(i18n.defaultLanguage)
    ? i18n.defaultLanguage
    : languages[0];
  if (defaultLang) alternates['x-default'] = alternates[defaultLang];
  return alternates;
}

export function createPageMetadata({
  lang,
  path = '',
  title,
  description,
  languages = i18n.languages,
  image,
}: {
  lang: string;
  path?: string;
  title: string;
  description?: string;
  languages?: string[];
  image?: string;
}): Metadata {
  const url = new URL(getLocalePath(lang, path), baseUrl).href;
  return createMetadata({
    title,
    description,
    alternates: {
      canonical: url,
      languages: getLanguageAlternates(path, languages),
    },
    openGraph: {
      url,
      locale: ogLocales[lang],
      alternateLocale: languages
        .filter((item) => item !== lang)
        .map((item) => ogLocales[item]),
      ...(image
        ? { images: [{ url: image, width: 1200, height: 630, alt: title }] }
        : {}),
    },
    ...(image
      ? { twitter: { card: 'summary_large_image', images: image } }
      : {}),
  });
}

export function createMetadata(override: Metadata): Metadata {
  return {
    metadataBase: baseUrl,
    ...override,
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/assets/logo.png',
    },
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: '/assets/logo.png',
      siteName: 'New API Documentation',
      type: 'website',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: '/assets/logo.png',
      ...override.twitter,
    },
  };
}
