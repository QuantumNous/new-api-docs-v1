import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';
import { Provider } from '@/components/provider';
import '../global.css';
import type { Metadata } from 'next';
import { createMetadata, baseUrl } from '@/lib/metadata';
import { notFound } from 'next/navigation';
import {
  getDocsConfig,
  getLocalizedSiteName,
  replaceBrandName,
} from '@/lib/docs-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    zh: {
      displayName: '简体中文',
      search: '搜索文档',
      searchNoResult: '没有结果',
      toc: '目录',
      lastUpdate: '最后更新于',
      chooseTheme: '选择主题',
      chooseLanguage: '选择语言',
      nextPage: '下一页',
      previousPage: '上一页',
      tocNoHeadings: '目录为空',
    },
    ja: {
      displayName: '日本語',
      search: 'ドキュメントを検索',
      searchNoResult: '結果が見つかりません',
      toc: '目次',
      lastUpdate: '最終更新',
      chooseTheme: 'テーマを選択',
      chooseLanguage: '言語を選択',
      nextPage: '次のページ',
      previousPage: '前のページ',
      tocNoHeadings: '見出しがありません',
    },
  },
});

const titleMap: Record<
  string,
  { default: string; template: string; description: string }
> = {
  en: {
    default: 'TokenFactory - Unified input for large language models',
    template: '%s | TokenFactory',
    description:
      'Connect all AI providers, manage your AI assets, and build the future on a unified infrastructure platform. Deploy in minutes, scale effortlessly.',
  },
  zh: {
    default: 'TokenFactory - 大语言模型的统一入口',
    template: '%s | TokenFactory',
    description:
      '承载所有 AI 应用，管理你的数字资产，连接未来的统一基础设施平台。快速部署，轻松扩展。',
  },
  ja: {
    default: 'TokenFactory - 大規模言語モデルの統一入力',
    template: '%s | TokenFactory',
    description:
      'すべての AI プロバイダーを接続し、AI アセットを管理し、統一されたインフラストラクチャプラットフォームで未来を構築。数分でデプロイ、簡単にスケール。',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang;
  const docsConfig = await getDocsConfig();
  const siteName = getLocalizedSiteName(docsConfig, lang);
  const titles = titleMap[lang] || titleMap.en;
  const title = {
    default: replaceBrandName(titles.default, docsConfig),
    template: `%s | ${siteName}`,
  };

  return createMetadata(
    {
      metadataBase: baseUrl,
      title,
      description: titles.description,
      keywords: docsConfig.metaKeywords,
      authors: [
        { name: `${docsConfig.brandName} Team`, url: docsConfig.githubUrl },
      ],
      creator: `${docsConfig.brandName} Team`,
      alternates: {
        languages: {
          en: '/en',
          zh: '/zh',
          ja: '/ja',
        },
      },
      openGraph: {
        type: 'website',
        locale: lang,
        title: title.default,
        description: titles.description,
        siteName,
      },
      twitter: {
        card: 'summary_large_image',
        title: title.default,
        description: titles.description,
      },
    },
    docsConfig,
    lang
  );
}

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const lang = (await params).lang;

  // Check if the language is valid, prevent invalid language codes (e.g. 'api') from causing errors
  if (!i18n.languages.includes(lang as (typeof i18n.languages)[number])) {
    notFound();
  }

  return (
    <Provider i18n={provider(lang)} lang={lang}>
      {children}
    </Provider>
  );
}
