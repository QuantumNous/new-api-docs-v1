export type DocsConfig = {
  brandName: string;
  siteName: Record<string, string>;
  logoUrl: string;
  homeUrl: string;
  githubUrl: string;
  metaKeywords: string[];
  business: {
    phone: string;
    phoneHref: string;
    workTime: Record<string, string>;
    wechatQrUrl: string;
  };
};

type RemoteDocsConfig = Partial<Omit<DocsConfig, 'siteName' | 'business'>> & {
  siteName?: Partial<Record<string, string>>;
  business?: Partial<Omit<DocsConfig['business'], 'workTime'>> & {
    workTime?: Partial<Record<string, string>>;
  };
};

type DocsConfigApiResponse = {
  success?: boolean;
  data?: RemoteDocsConfig;
};

export const DEFAULT_DOCS_CONFIG: DocsConfig = {
  brandName: 'TokenFactory',
  siteName: {
    en: 'TokenFactory',
    zh: '开放词元工厂',
    ja: 'TokenFactory',
  },
  logoUrl: '/assets/logo.png',
  homeUrl: 'https://tokenfactoryopen.com/',
  githubUrl: 'https://github.com/fyinfor/token-factory',
  metaKeywords: [
    'AI Infrastructure',
    'AI Gateway',
    'AI Asset Management',
    'API Orchestration',
    'AI Application Platform',
    'Multi-Model Integration',
    'Enterprise AI',
    'AI Ecosystem',
    'Unified AI Interface',
    'Intelligent API Management',
  ],
  business: {
    phone: '156 2568 9773',
    phoneHref: '15625689773',
    workTime: {
      en: 'Weekdays 9:30 - 12:00, 13:30 - 19:00',
      zh: '工作日 9:30 - 12:00 13:30 - 19:00',
      ja: '平日 9:30 - 12:00、13:30 - 19:00',
    },
    wechatQrUrl: '/assets/wechat.png',
  },
};

function nonEmpty(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeConfigApiUrl(): string | undefined {
  const explicit = process.env.DOCS_CONFIG_API_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.DOCS_CONFIG_API_BASE_URL?.trim();
  if (!base) return undefined;

  try {
    return new URL(
      '/api/docs/config',
      base.endsWith('/') ? base : `${base}/`
    ).toString();
  } catch {
    return undefined;
  }
}

function mergeDocsConfig(remote?: RemoteDocsConfig): DocsConfig {
  const defaults = DEFAULT_DOCS_CONFIG;
  const siteName = remote?.siteName ?? {};
  const business = remote?.business ?? {};
  const workTime = business.workTime ?? {};

  return {
    brandName: nonEmpty(remote?.brandName, defaults.brandName),
    siteName: {
      en: nonEmpty(siteName.en, defaults.siteName.en),
      zh: nonEmpty(siteName.zh, defaults.siteName.zh),
      ja: nonEmpty(siteName.ja, defaults.siteName.ja),
    },
    logoUrl: nonEmpty(remote?.logoUrl, defaults.logoUrl),
    homeUrl: nonEmpty(remote?.homeUrl, defaults.homeUrl),
    githubUrl: nonEmpty(remote?.githubUrl, defaults.githubUrl),
    metaKeywords:
      Array.isArray(remote?.metaKeywords) && remote.metaKeywords.length > 0
        ? remote.metaKeywords.filter((item): item is string => Boolean(item))
        : defaults.metaKeywords,
    business: {
      phone:
        typeof business.phone === 'string'
          ? business.phone
          : defaults.business.phone,
      phoneHref:
        typeof business.phoneHref === 'string'
          ? business.phoneHref
          : defaults.business.phoneHref,
      workTime: {
        en:
          typeof workTime.en === 'string'
            ? workTime.en
            : defaults.business.workTime.en,
        zh:
          typeof workTime.zh === 'string'
            ? workTime.zh
            : defaults.business.workTime.zh,
        ja:
          typeof workTime.ja === 'string'
            ? workTime.ja
            : defaults.business.workTime.ja,
      },
      wechatQrUrl:
        typeof business.wechatQrUrl === 'string'
          ? business.wechatQrUrl
          : defaults.business.wechatQrUrl,
    },
  };
}

export async function getDocsConfig(): Promise<DocsConfig> {
  const url = normalizeConfigApiUrl();
  if (!url) return DEFAULT_DOCS_CONFIG;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return DEFAULT_DOCS_CONFIG;

    const payload = (await response.json()) as
      | DocsConfigApiResponse
      | DocsConfig;
    const remote =
      'data' in payload && payload.data
        ? payload.data
        : (payload as RemoteDocsConfig);

    return mergeDocsConfig(remote);
  } catch {
    return DEFAULT_DOCS_CONFIG;
  }
}

export function getLocalizedSiteName(
  config: DocsConfig,
  locale: string
): string {
  return config.siteName[locale] || config.brandName;
}

export function getLocalizedBusinessWorkTime(
  config: DocsConfig,
  locale: string
): string {
  return config.business.workTime[locale] || config.business.workTime.en;
}

export const API_BASE_URL_PLACEHOLDER = '__apiBaseUrl__';

export function getApiBaseUrl(config: DocsConfig): string {
  return config.homeUrl.replace(/\/+$/, '');
}

export function replaceBrandName(value: string, config: DocsConfig): string {
  return value
    .replaceAll('__brandName__', config.brandName)
    .replaceAll('{{brandName}}', config.brandName)
    .replaceAll(DEFAULT_DOCS_CONFIG.brandName, config.brandName);
}

export function replaceApiBaseUrl(value: string, config: DocsConfig): string {
  return value.replaceAll(API_BASE_URL_PLACEHOLDER, getApiBaseUrl(config));
}
