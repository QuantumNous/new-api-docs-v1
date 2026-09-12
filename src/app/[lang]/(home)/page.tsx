import Link from 'next/link';
import { Hero } from './page.client';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Code2,
  Github,
  Headphones,
  Layers3,
  Puzzle,
  Sparkles,
  Blocks,
} from 'lucide-react';
import { createPageMetadata, siteMetadata, baseUrl } from '@/lib/metadata';
import { OfficialSites } from '@/components/official-sites';
import { getLocalePath, i18n } from '@/lib/i18n';
import Image from 'next/image';
import { AntifraudDialog } from '@/components/antifraud-dialog';

const AtomGitIcon = () => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path
      fillRule="evenodd"
      d="M15.5,5c.1,0,.3-.2.5-.3,0,.1,0,.2,0,.3,0,.1,0,.3,0,.4,0,1,.6,1.8,1.4,2,1.1.3,2.1-.2,2.7-1.1.7-1.1.4-2.4-.8-3.3C16.2.8,12.8.2,9.1,1.2,1.1,3.6-1.6,13.4,4,19.4c2.4,2.6,5.5,3.7,9,3.6,4.5-.1,7.7-2.3,9.7-6.2,1.5-2.7-.1-5.7-3.2-6.4-1.7-.3-3.5-.5-5.3-.3-.6,0-1.2.2-1.7.5-.6.3-.7.9-.7,1.5,0,.6.5.9,1,1,1,.2,2.1.3,3.1.3.3,0,.6,0,.9,0,.4,0,.9,0,1.3,0,1.2.2,1.6,1.2,1,2.3-.2.3-.3.5-.5.7-.8.9-1.9,1.5-3.1,1.8-2.2.5-4.3.6-6.5-.1-2.5-.8-3.9-2.6-4-5,0-1.5.4-3,1.1-4.3.3-.6.5-1.2.5-1.9,0-.3,0-.6,0-.9,0-.2,0-.3,0-.5.2,0,.5.1.7.2.9.4,1.9.5,2.9.3.6-.1,1.2-.2,1.8-.1,1,0,1.9-.2,2.7-.7.2-.1.4-.2.6-.4Z"
    />
  </svg>
);

const contentMap = {
  en: {
    badge: 'The Foundation of Your AI Universe',
    title: 'Connect all AI providers, manage your AI assets,',
    subtitle: 'build the',
    highlight: 'future',
    description:
      'Your guide to a unified AI gateway. Deploy your instance, connect model providers, and make your first API call.',
    getStarted: 'Get started',
    browseTitle: 'Find the guide you need',
    browseDescription:
      'Practical documentation for every stage of your project.',
    allDocs: 'All documentation',
    topics: [
      [
        'Installation & deployment',
        'Docker, panels, clusters, and environment configuration.',
      ],
      [
        'Administration & usage',
        'Manage channels, tokens, models, and your instance.',
      ],
      [
        'API reference',
        'Request parameters, responses, and integration examples.',
      ],
      [
        'AI applications',
        'Connect your favorite clients and development tools.',
      ],
      ['Skills', 'Use New API with coding agents and AI workflows.'],
      [
        'Help & support',
        'Find answers, troubleshoot issues, and join the community.',
      ],
    ],
    partnersTitle: 'Our Partners & Clients',
    partnersSubtitle: 'In no particular order',
    sponsorPartnersTitle: 'Sponsor Partners',
    devContributorsTitle: 'Development Contributors',
    docsContributorsTitle: 'Documentation Contributors',
  },
  zh: {
    badge: '人工智能应用基座',
    title: '承载 AI 应用，管理数字资产，',
    subtitle: '连接',
    highlight: '未来',
    description:
      '从部署你的第一个 AI 网关，到接入模型、管理令牌与调用 API。在这里找到每一步的指南。',
    getStarted: '快速开始',
    browseTitle: '找到你需要的文档',
    browseDescription: '从初次部署到日常管理，按你的目标开始。',
    allDocs: '浏览全部文档',
    topics: [
      ['安装部署', 'Docker、可视化面板、集群部署与环境配置。'],
      ['使用指南', '管理渠道、令牌与模型，了解控制台的各项功能。'],
      ['API 参考', '查阅接口参数、响应格式与调用示例。'],
      ['AI 应用接入', '连接常用 AI 客户端、开发工具与应用。'],
      ['Skills', '让 AI 编程助手在工作流中使用和管理 New API。'],
      ['帮助与支持', '查找常见问题、排查故障，参与社区交流。'],
    ],
    partnersTitle: '合作伙伴与客户',
    partnersSubtitle: '排名不分先后',
    sponsorPartnersTitle: '赞助合作伙伴',
    devContributorsTitle: '开发贡献者',
    docsContributorsTitle: '文档贡献者',
  },
  ja: {
    badge: 'あなたの AI ユニバースの基盤',
    title: 'すべての AI プロバイダーを接続し、AI アセットを管理し、',
    subtitle: '',
    highlight: '未来を構築',
    description:
      '統一 AI ゲートウェイの導入ガイド。インスタンスをデプロイし、モデルを接続して、最初の API リクエストを送信しましょう。',
    getStarted: 'クイックスタート',
    browseTitle: '必要なガイドを見つける',
    browseDescription: '初めての導入から日々の運用まで。',
    allDocs: 'すべてのドキュメント',
    topics: [
      ['インストール', 'Docker、管理パネル、クラスターと環境設定。'],
      ['ユーザーガイド', 'チャネル、トークン、モデルを管理。'],
      ['API リファレンス', 'パラメーター、レスポンス、接続サンプル。'],
      ['AI アプリの接続', 'クライアントや開発ツールとの連携。'],
      ['Skills', 'AI コーディングエージェントで New API を活用。'],
      ['ヘルプとサポート', 'よくある質問、問題の解決、コミュニティ。'],
    ],
    partnersTitle: 'パートナーとお客様',
    partnersSubtitle: '順不同',
    sponsorPartnersTitle: 'スポンサーパートナー',
    devContributorsTitle: '開発貢献者',
    docsContributorsTitle: 'ドキュメント貢献者',
  },
};

const topicRoutes = [
  { path: 'docs/installation', icon: Boxes },
  { path: 'docs/guide/home', icon: Layers3 },
  { path: 'docs/api', icon: Code2 },
  { path: 'docs/apps', icon: Sparkles },
  { path: 'docs/skills', icon: Puzzle },
  { path: 'docs/support', icon: Headphones },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const text = siteMetadata[lang] || siteMetadata.en;
  return {
    ...createPageMetadata({
      lang,
      title: text.title,
      description: text.description,
    }),
    title: { absolute: text.title },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const content = contentMap[lang as keyof typeof contentMap] || contentMap.en;
  const canonicalUrl = new URL(getLocalePath(lang), baseUrl).href;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl.origin}/#website`,
        url: baseUrl.origin,
        name: 'New API Documentation',
        inLanguage: i18n.languages,
      },
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: siteMetadata[lang]?.title || siteMetadata.en.title,
        description: content.description,
        inLanguage: lang,
        isPartOf: { '@id': `${baseUrl.origin}/#website` },
        about: {
          '@type': 'SoftwareApplication',
          name: 'New API',
          url: 'https://www.newapi.ai/',
          sameAs: [
            'https://www.newapi.pro/',
            'https://github.com/QuantumNous/new-api',
          ],
        },
      },
    ],
  };

  const partners = [
    {
      name: 'Cherry Studio',
      url: 'https://www.cherry-ai.com/',
      logo: '/assets/partner/cherry-studio.png',
    },
    {
      name: 'AionUi',
      url: 'https://github.com/iOfficeAI/AionUi',
      logo: '/assets/partner/aionui.png',
    },
    {
      name: 'Peking University',
      url: 'https://bda.pku.edu.cn/',
      logo: '/assets/partner/pku.png',
    },
    {
      name: 'UCloud',
      url: 'https://www.compshare.cn/?ytag=GPU_yy_gh_newapi',
      logo: '/assets/partner/ucloud.png',
    },
    {
      name: 'Alibaba Cloud',
      url: 'https://www.aliyun.com/',
      logo: '/assets/partner/aliyun.png',
    },
    {
      name: 'IO.NET',
      url: 'https://io.net/',
      logo: '/assets/partner/io-net.png',
    },
  ];

  const sponsorPartners = [
    {
      name: 'RixAPI',
      url: 'https://rixapi.com/',
      lightLogo: '/assets/partner/rixapi-black.png',
      darkLogo: '/assets/partner/rixapi-white.png',
    },
  ];

  return (
    <div
      id="home-content"
      className="text-fd-foreground mx-auto w-full max-w-[1400px] px-4 pt-6 pb-16 sm:px-6 lg:px-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <div
        aria-labelledby="home-title"
        className="text-landing-foreground relative mx-auto flex h-[70vh] max-h-[900px] min-h-[600px] w-full max-w-[1400px] overflow-hidden rounded-2xl border bg-origin-border"
      >
        <Hero />
        <div className="z-2 flex size-full flex-col px-4 max-md:items-center max-md:text-center md:p-12">
          <p className="border-brand/50 text-brand mt-12 w-fit rounded-full border p-2 text-xs font-medium">
            {content.badge}
          </p>
          <h1
            id="home-title"
            className="leading-tighter my-8 text-4xl font-medium xl:mb-12 xl:text-5xl"
          >
            {content.title}
            <br />
            {content.subtitle}{' '}
            <span className="text-brand">{content.highlight}</span>.
          </h1>
          <div className="flex w-fit flex-row flex-wrap items-center justify-center gap-4">
            <Link
              href={getLocalePath(lang, 'docs')}
              className="bg-brand text-brand-foreground hover:bg-brand-200 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-medium tracking-tight transition-colors max-sm:text-sm"
            >
              <BookOpen className="size-4" />
              {content.getStarted}
            </Link>
            <a
              href="https://github.com/QuantumNous/new-api"
              target="_blank"
              rel="noreferrer noopener"
              className="bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-medium tracking-tight transition-colors max-sm:text-sm"
            >
              <Github className="size-4" />
              GitHub
            </a>
            <a
              href="https://atomgit.com/QuantumNous/new-api"
              target="_blank"
              rel="noreferrer noopener"
              className="bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-medium tracking-tight transition-colors max-sm:text-sm"
            >
              <AtomGitIcon />
              AtomGit
            </a>
          </div>
        </div>
      </div>

      <div className="bg-fd-card/40 mt-5 rounded-2xl border px-6 py-5 backdrop-blur-sm">
        <OfficialSites lang={lang} />
      </div>

      <section aria-labelledby="browse-title" className="mt-12 sm:mt-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="browse-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {content.browseTitle}
            </h2>
            <p className="text-fd-muted-foreground mt-2 text-sm leading-6">
              {content.browseDescription}
            </p>
          </div>
          <Link
            href={getLocalePath(lang, 'docs')}
            className="text-brand inline-flex items-center gap-2 text-sm font-medium"
          >
            {content.allDocs}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topicRoutes.map(({ path, icon: Icon }, index) => (
            <Link
              key={path}
              href={getLocalePath(lang, path)}
              className="group bg-fd-card hover:border-brand/50 hover:bg-brand/5 rounded-2xl border p-6 transition-colors"
            >
              <div className="flex items-center justify-between">
                <Icon className="text-brand size-5" aria-hidden />
                <ArrowRight
                  className="text-fd-muted-foreground/50 group-hover:text-brand size-4"
                  aria-hidden
                />
              </div>
              <h3 className="mt-5 font-semibold">{content.topics[index][0]}</h3>
              <p className="text-fd-muted-foreground mt-2 text-sm leading-6">
                {content.topics[index][1]}
              </p>
            </Link>
          ))}
        </div>
        {lang === 'zh' && (
          <div className="from-brand/8 to-fd-background mt-4 flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-gradient-to-r p-6">
            <div className="flex items-start gap-4">
              <Blocks className="text-brand mt-1 size-6 shrink-0" aria-hidden />
              <div>
                <h3 className="font-semibold">用任务插件，扩展更多模型能力</h3>
                <p className="text-fd-muted-foreground mt-2 text-sm leading-6">
                  浏览图片、视频与音乐生成插件，查看安装指南与开发文档。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-medium">
              <Link
                href="/zh/plugins"
                className="text-brand inline-flex items-center gap-2"
              >
                浏览插件市场
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/zh/docs/plugins" className="hover:text-brand">
                插件文档
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Partners Section */}
      <section className="mx-auto mt-16 border-t pt-12 text-center">
        <h2 className="text-xl font-semibold">{content.partnersTitle}</h2>
        <p className="text-fd-muted-foreground mt-2 text-sm">
          {content.partnersSubtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 grayscale-[50%] transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={72}
                height={60}
                className="h-[50px] w-auto md:h-[60px]"
                loading="lazy"
                decoding="async"
              />
            </a>
          ))}
        </div>
      </section>

      {/* Sponsor Partners Section */}
      <section className="mx-auto mt-16 max-w-[1400px] px-4 text-center">
        <h2 className="text-xl font-semibold">
          {content.sponsorPartnersTitle}
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {sponsorPartners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 grayscale-[50%] transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            >
              <Image
                src={partner.lightLogo}
                alt={partner.name}
                width={120}
                height={60}
                className="block h-[50px] w-auto md:h-[60px] dark:hidden"
                loading="lazy"
                decoding="async"
              />
              <Image
                src={partner.darkLogo}
                alt={partner.name}
                width={120}
                height={60}
                className="hidden h-[50px] w-auto md:h-[60px] dark:block"
                loading="lazy"
                decoding="async"
              />
            </a>
          ))}
        </div>
      </section>

      {/* Development Contributors Section */}
      <section className="mx-auto mt-16 max-w-[1400px] px-4 text-center">
        <h2 className="text-xl font-semibold">
          {content.devContributorsTitle}
        </h2>
        <div className="mt-8 flex justify-center">
          <a
            href="https://github.com/QuantumNous/new-api/graphs/contributors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://contrib.rocks/image?repo=QuantumNous/new-api"
              alt="Development Contributors"
              loading="lazy"
              decoding="async"
              className="max-w-full"
            />
          </a>
        </div>
      </section>

      {/* Documentation Contributors Section */}
      <section className="mx-auto mt-16 max-w-[1400px] px-4 text-center">
        <h2 className="text-xl font-semibold">
          {content.docsContributorsTitle}
        </h2>
        <div className="mt-8 flex justify-center">
          <a
            href="https://github.com/QuantumNous/new-api-docs-v1/graphs/contributors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://contrib.rocks/image?repo=QuantumNous/new-api-docs-v1"
              alt="Documentation Contributors"
              loading="lazy"
              decoding="async"
              className="max-w-full"
            />
          </a>
        </div>
      </section>

      <AntifraudDialog lang={lang} />
    </div>
  );
}

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
