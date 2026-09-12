import Link from 'next/link';
import { OfficialSites } from '@/components/official-sites';
import { Github, MessageCircle } from 'lucide-react';
import { getLocalePath } from '@/lib/i18n';

interface FooterProps {
  lang: string;
}

// ============================================
// Shared Icons (Official SVG paths from Simple Icons)
// ============================================
const AtomGitIcon = (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path
      fillRule="evenodd"
      d="M15.5,5c.1,0,.3-.2.5-.3,0,.1,0,.2,0,.3,0,.1,0,.3,0,.4,0,1,.6,1.8,1.4,2,1.1.3,2.1-.2,2.7-1.1.7-1.1.4-2.4-.8-3.3C16.2.8,12.8.2,9.1,1.2,1.1,3.6-1.6,13.4,4,19.4c2.4,2.6,5.5,3.7,9,3.6,4.5-.1,7.7-2.3,9.7-6.2,1.5-2.7-.1-5.7-3.2-6.4-1.7-.3-3.5-.5-5.3-.3-.6,0-1.2.2-1.7.5-.6.3-.7.9-.7,1.5,0,.6.5.9,1,1,1,.2,2.1.3,3.1.3.3,0,.6,0,.9,0,.4,0,.9,0,1.3,0,1.2.2,1.6,1.2,1,2.3-.2.3-.3.5-.5.7-.8.9-1.9,1.5-3.1,1.8-2.2.5-4.3.6-6.5-.1-2.5-.8-3.9-2.6-4-5,0-1.5.4-3,1.1-4.3.3-.6.5-1.2.5-1.9,0-.3,0-.6,0-.9,0-.2,0-.3,0-.5.2,0,.5.1.7.2.9.4,1.9.5,2.9.3.6-.1,1.2-.2,1.8-.1,1,0,1.9-.2,2.7-.7.2-.1.4-.2.6-.4Z"
    />
  </svg>
);

const DockerIcon = (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185zm-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186zm0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186zm-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186zm-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186zm5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185zm-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185zm-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185zm-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.185.185v1.888c0 .102.084.185.185.185zM23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z" />
  </svg>
);

const ProductHuntIcon = (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 1.8-1.8 1.8 1.8 0 0 0-1.8-1.8zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804a4.2 4.2 0 0 1 4.199 4.2 4.2 4.2 0 0 1-4.2 4.2z" />
  </svg>
);

// ============================================
// Shared Data (same across all languages)
// ============================================
const socialLinks: { name: string; href: string; icon: React.ReactNode }[] = [
  {
    name: 'GitHub',
    href: 'https://github.com/QuantumNous/new-api',
    icon: <Github className="size-4" />,
  },
  {
    name: 'AtomGit',
    href: 'https://atomgit.com/QuantumNous/new-api',
    icon: AtomGitIcon,
  },
  {
    name: 'Docker',
    href: 'https://hub.docker.com/r/calciumion/new-api',
    icon: DockerIcon,
  },
  {
    name: 'QQ',
    href: 'docs/support/community-interaction',
    icon: <MessageCircle className="size-4" />,
  },
  {
    name: 'Product Hunt',
    href: 'https://www.producthunt.com/products/new-api',
    icon: ProductHuntIcon,
  },
];

const beianLinks: { text: string; href: string }[] = [
  { text: '浙ICP备2025190188号-2', href: 'https://beian.miit.gov.cn/' },
  {
    text: '浙公网安备33010602014019号',
    href: 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602014019',
  },
];

// External links (same labels across all languages)
const relatedProjects: { label: string; href: string }[] = [
  { label: 'One API', href: 'https://github.com/songquanpeng/one-api' },
  {
    label: 'Midjourney-Proxy',
    href: 'https://github.com/novicezk/midjourney-proxy',
  },
  {
    label: 'new-api-key-tool',
    href: 'https://github.com/Calcium-Ion/new-api-key-tool',
  },
];

const friendshipLinks: { label: string; href: string }[] = [
  { label: 'CoAI', href: 'https://github.com/coaidev/coai' },
  {
    label: 'new-api-horizon',
    href: 'https://github.com/Calcium-Ion/new-api-horizon',
  },
  { label: 'GPT-Load', href: 'https://www.gpt-load.com' },
  { label: 'LangBot', href: 'https://langbot.app' },
];

// ============================================
// Internal link paths (only labels need translation)
// ============================================
const internalPaths = {
  aboutProject: 'docs/guide/wiki/basic-concepts/project-introduction',
  contactUs: 'docs/support/community-interaction',
  features: 'docs/guide/wiki/basic-concepts/features-introduction',
  installation: 'docs/installation',
  userGuide: 'docs/guide/home',
  apiDocs: 'docs/api',
} as const;

// ============================================
// Translations (only text that differs by language)
// ============================================
interface FooterTranslation {
  sections: {
    about: {
      title: string;
      aboutProject: string;
      contactUs: string;
      features: string;
    };
    docs: {
      title: string;
      installation: string;
      userGuide: string;
      apiDocs: string;
    };
    relatedProjects: string;
    friendshipLinks: string;
  };
  copyright: string;
}

const translations: Record<string, FooterTranslation> = {
  zh: {
    sections: {
      about: {
        title: '关于我们',
        aboutProject: '关于项目',
        contactUs: '联系我们',
        features: '功能特性',
      },
      docs: {
        title: '文档',
        installation: '安装部署',
        userGuide: '使用指南',
        apiDocs: 'API 文档',
      },
      relatedProjects: '相关项目',
      friendshipLinks: '友情链接',
    },
    copyright: '© 2025 锟腾科技. All Rights Reserved.',
  },
  en: {
    sections: {
      about: {
        title: 'About Us',
        aboutProject: 'About Project',
        contactUs: 'Contact Us',
        features: 'Features',
      },
      docs: {
        title: 'Docs',
        installation: 'Installation',
        userGuide: 'User Guide',
        apiDocs: 'API Docs',
      },
      relatedProjects: 'Related Projects',
      friendshipLinks: 'Friendship Links',
    },
    copyright: '© 2025 QuantumNous. All Rights Reserved.',
  },
  ja: {
    sections: {
      about: {
        title: '私たちについて',
        aboutProject: 'プロジェクトについて',
        contactUs: 'お問い合わせ',
        features: '機能',
      },
      docs: {
        title: 'ドキュメント',
        installation: 'インストール',
        userGuide: 'ユーザーガイド',
        apiDocs: 'APIドキュメント',
      },
      relatedProjects: '関連プロジェクト',
      friendshipLinks: '友好リンク',
    },
    copyright: '© 2025 QuantumNous. All Rights Reserved.',
  },
};

// ============================================
// Build sections from translations
// ============================================
function buildSections(t: FooterTranslation) {
  return [
    {
      title: t.sections.about.title,
      links: [
        {
          label: t.sections.about.aboutProject,
          href: internalPaths.aboutProject,
        },
        { label: t.sections.about.contactUs, href: internalPaths.contactUs },
        { label: t.sections.about.features, href: internalPaths.features },
      ],
    },
    {
      title: t.sections.docs.title,
      links: [
        {
          label: t.sections.docs.installation,
          href: internalPaths.installation,
        },
        { label: t.sections.docs.userGuide, href: internalPaths.userGuide },
        { label: t.sections.docs.apiDocs, href: internalPaths.apiDocs },
      ],
    },
    {
      title: t.sections.relatedProjects,
      links: relatedProjects.map((p) => ({ ...p, external: true })),
    },
    {
      title: t.sections.friendshipLinks,
      links: friendshipLinks.map((p) => ({ ...p, external: true })),
    },
  ];
}

// ============================================
// Footer Component
// ============================================
export function Footer({ lang }: FooterProps) {
  const t = translations[lang] || translations.en;
  const sections = buildSections(t);

  return (
    <footer className="border-fd-border bg-fd-card/30 mt-auto border-t backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="border-fd-border mb-8 border-b pb-8">
          <OfficialSites lang={lang} />
        </div>
        {/* Top: Links Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pb-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-fd-foreground mb-4 text-sm font-semibold">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fd-muted-foreground hover:text-fd-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={getLocalePath(lang, link.href)}
                        className="text-fd-muted-foreground hover:text-fd-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: Copyright and Social */}
        <div className="border-fd-border flex flex-col items-start justify-between gap-4 border-t pt-8 sm:flex-row sm:items-center">
          {/* Left: Copyright and Beian */}
          <div className="text-fd-muted-foreground flex flex-col gap-2 text-xs">
            <p>{t.copyright}</p>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              {beianLinks.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-fd-foreground transition-colors"
                >
                  {item.text}
                </a>
              ))}
            </div>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const isExternal = social.href.startsWith('http');
              const Component = isExternal ? 'a' : Link;
              return (
                <Component
                  key={social.name}
                  href={
                    isExternal ? social.href : getLocalePath(lang, social.href)
                  }
                  {...(isExternal && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                  className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </Component>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
