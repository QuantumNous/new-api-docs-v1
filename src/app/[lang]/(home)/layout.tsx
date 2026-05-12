import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions, getLinkItems } from '@/lib/layout.shared';
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from 'fumadocs-ui/layouts/home/navbar';
import { Footer } from '@/components/footer';
import Link from 'fumadocs-core/link';
import Image from 'next/image';
import Preview from '@/../public/assets/dashboard-dark.png';
import {
  Rocket,
  Download,
  HelpCircle,
  Sparkles,
  FileCode,
  BookOpen,
  Puzzle,
  type LucideIcon,
} from 'lucide-react';
import { getLocalePath } from '@/lib/i18n';
import { getDocsConfig, replaceBrandName } from '@/lib/docs-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Navigation items configuration
const NAV_ITEMS = [
  { key: 'start', icon: Rocket, path: '' },
  { key: 'install', icon: Download, path: '/installation' },
  { key: 'support', icon: HelpCircle, path: '/support' },
  { key: 'api', icon: BookOpen, path: '/api' },
  { key: 'apps', icon: Sparkles, path: '/apps' },
] as const;

// Internationalization text
const i18nText: Record<
  string,
  Record<string, { text: string; desc: string }>
> = {
  en: {
    title: { text: 'Documentation', desc: '' },
    apiDocs: { text: 'Apifox Playground', desc: '' },
    skills: { text: 'Skills', desc: '' },
    start: {
      text: 'Getting Started',
      desc: 'Learn how to deploy and configure TokenFactory.',
    },
    install: {
      text: 'Installation',
      desc: 'Various deployment methods and installation guides.',
    },
    support: { text: 'Help & Support', desc: 'FAQ and community support.' },
    api: {
      text: 'API Reference',
      desc: 'Complete API documentation and reference.',
    },
    apps: {
      text: 'AI Applications',
      desc: 'Integration guides for AI applications.',
    },
  },
  zh: {
    title: { text: '文档', desc: '' },
    apiDocs: { text: 'Apifox 操练场', desc: '' },
    skills: { text: 'Skills', desc: '' },
    start: { text: '快速开始', desc: '学习如何部署和配置 TokenFactory。' },
    install: { text: '部署安装', desc: '多种部署方式和安装指南。' },
    support: { text: '帮助支持', desc: '常见问题和社区支持。' },
    api: { text: 'API 参考', desc: '完整的 API 文档和参考指南。' },
    apps: { text: 'AI 应用', desc: 'AI 应用集成指南。' },
  },
  ja: {
    title: { text: 'ドキュメント', desc: '' },
    apiDocs: { text: 'Apifox プレイグラウンド', desc: '' },
    skills: { text: 'Skills', desc: '' },
    start: {
      text: 'はじめに',
      desc: 'TokenFactory のデプロイと設定方法を学ぶ。',
    },
    install: {
      text: 'インストール',
      desc: '様々なデプロイ方法とインストールガイド。',
    },
    support: {
      text: 'ヘルプ＆サポート',
      desc: 'よくある質問とコミュニティサポート。',
    },
    api: {
      text: 'API リファレンス',
      desc: '完全な API ドキュメントとリファレンス。',
    },
    apps: {
      text: 'AI アプリケーション',
      desc: 'AI アプリケーション統合ガイド。',
    },
  },
};

// Get localized text
const getTexts = (lang: string) => i18nText[lang] || i18nText.en;

// Build navigation items
const buildNavItems = (lang: string, docsUrl: string) => {
  const texts = getTexts(lang);
  return NAV_ITEMS.map(({ key, icon: Icon, path }) => ({
    text: texts[key].text,
    desc: texts[key].desc,
    url: `${docsUrl}${path}`,
    Icon,
  }));
};

// Menu link item component
function MenuLinkItem({
  item,
  className,
}: {
  item: { text: string; desc: string; url: string; Icon: LucideIcon };
  className?: string;
}) {
  const { Icon, text, desc, url } = item;
  return (
    <NavbarMenuLink href={url} className={className}>
      <Icon className="bg-fd-primary text-fd-primary-foreground mb-2 rounded-md p-1" />
      <p className="font-medium">{text}</p>
      <p className="text-fd-muted-foreground text-sm">{desc}</p>
    </NavbarMenuLink>
  );
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  const docsConfig = await getDocsConfig();
  const texts = getTexts(lang);
  const docsUrl = getLocalePath(lang, 'docs');
  const navItems = buildNavItems(lang, docsUrl).map((item) => ({
    ...item,
    desc: replaceBrandName(item.desc, docsConfig),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <HomeLayout
        {...baseOptions(lang, docsConfig)}
        links={[
          // Mobile menu
          {
            type: 'menu',
            on: 'menu',
            text: texts.title.text,
            items: navItems.map(({ text, url, Icon }) => ({
              text,
              url,
              icon: <Icon />,
            })),
          },
          // {
          //   type: 'main',
          //   on: 'menu',
          //   text: texts.skills.text,
          //   url: `${docsUrl}/skills`,
          //   icon: <Puzzle />,
          // },
          // {
          //   type: 'main',
          //   on: 'menu',
          //   text: texts.apiDocs.text,
          //   url: 'https://apifox.tokenfactoryopen.com/',
          //   icon: <FileCode />,
          //   external: true,
          // },
          // Desktop navigation
          {
            type: 'custom',
            on: 'nav',
            children: (
              <NavbarMenu>
                <NavbarMenuTrigger>
                  <Link href={docsUrl}>{texts.title.text}</Link>
                </NavbarMenuTrigger>
                <NavbarMenuContent className="text-[15px]">
                  {/* First item with preview image */}
                  <NavbarMenuLink href={docsUrl} className="md:row-span-2">
                    <div className="-mx-3 -mt-3">
                      <Image
                        src={Preview}
                        alt="Preview"
                        className="rounded-t-lg object-cover"
                        loading="lazy"
                        fetchPriority="low"
                        style={{
                          maskImage:
                            'linear-gradient(to bottom,white 60%,transparent)',
                        }}
                      />
                    </div>
                    <p className="font-medium">{navItems[0].text}</p>
                    <p className="text-fd-muted-foreground text-sm">
                      {navItems[0].desc}
                    </p>
                  </NavbarMenuLink>
                  {/* Second column */}
                  <MenuLinkItem item={navItems[1]} className="lg:col-start-2" />
                  <MenuLinkItem item={navItems[2]} className="lg:col-start-2" />
                  {/* Third column */}
                  <MenuLinkItem
                    item={navItems[3]}
                    className="lg:col-start-3 lg:row-start-1"
                  />
                  <MenuLinkItem
                    item={navItems[4]}
                    className="lg:col-start-3 lg:row-start-2"
                  />
                </NavbarMenuContent>
              </NavbarMenu>
            ),
          },
          // {
          //   type: 'custom',
          //   on: 'nav',
          //   children: (
          //     <Link
          //       href={`${docsUrl}/skills`}
          //       className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          //     >
          //       {texts.skills.text}
          //       {/* <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          //         New
          //       </span> */}
          //     </Link>
          //   ),
          // },
          // {
          //   type: 'main',
          //   on: 'nav',
          //   text: texts.apiDocs.text,
          //   url: 'https://apifox.tokenfactoryopen.com/',
          //   external: true,
          // },
          ...getLinkItems(docsConfig),
        ]}
        className="flex-1 dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)]"
      >
        {children}
      </HomeLayout>
      <Footer lang={lang} />
    </div>
  );
}
