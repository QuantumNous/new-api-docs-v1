import Link from 'next/link';
import Image from 'next/image';
import { Github, Container, MessageCircle } from 'lucide-react';
import { getLocalePath } from '@/lib/i18n';

interface FooterProps {
  lang: string;
}

const footerContent: Record<
  string,
  {
    sections: {
      title: string;
      links: { label: string; href: string; external?: boolean }[];
    }[];
    social: { name: string; href: string; icon: React.ReactNode }[];
    copyright: string;
    beian: { text: string; href?: string; img?: string }[];
  }
> = {
  zh: {
    sections: [
      {
        title: '关于我们',
        links: [
          { label: '关于项目', href: 'docs/wiki/project-introduction' },
          { label: '联系我们', href: 'docs/support/community-interaction' },
          { label: '功能特性', href: 'docs/wiki/features-introduction' },
        ],
      },
      {
        title: '文档',
        links: [
          { label: '快速开始', href: 'docs/getting-started' },
          { label: '安装指南', href: 'docs/installation' },
          { label: 'API 文档', href: 'docs/api' },
        ],
      },
      {
        title: '相关项目',
        links: [
          {
            label: 'One API',
            href: 'https://github.com/songquanpeng/one-api',
            external: true,
          },
          {
            label: 'Midjourney-Proxy',
            href: 'https://github.com/novicezk/midjourney-proxy',
            external: true,
          },
          {
            label: 'neko-api-key-tool',
            href: 'https://github.com/Calcium-Ion/neko-api-key-tool',
            external: true,
          },
        ],
      },
      {
        title: '友情链接',
        links: [
          {
            label: 'CoAI',
            href: 'https://github.com/coaidev/coai',
            external: true,
          },
          {
            label: 'new-api-horizon',
            href: 'https://github.com/Calcium-Ion/new-api-horizon',
            external: true,
          },
          {
            label: 'GPT-Load',
            href: 'https://www.gpt-load.com',
            external: true,
          },
          {
            label: 'LangBot',
            href: 'https://langbot.app',
            external: true,
          },
        ],
      },
    ],
    social: [
      {
        name: 'GitHub',
        href: 'https://github.com/QuantumNous/new-api',
        icon: <Github className="size-4" />,
      },
      {
        name: 'Gitee',
        href: 'https://gitee.com/QuantumNous/new-api',
        icon: (
          <svg
            role="img"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.037a.594.594 0 0 1-.592-.593v-1.482a.593.593 0 0 1 .592-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z" />
          </svg>
        ),
      },
      {
        name: 'Docker',
        href: 'https://hub.docker.com/r/calciumion/new-api',
        icon: <Container className="size-4" />,
      },
      {
        name: 'QQ',
        href: 'https://qm.qq.com/q/Y79glR8raU',
        icon: <MessageCircle className="size-4" />,
      },
    ],
    copyright: '© 2025 锟腾科技（杭州）有限公司. All Rights Reserved.',
    beian: [
      { text: '浙ICP备2025190188号-2', href: 'https://beian.miit.gov.cn/' },
      {
        text: '浙公网安备33010602014019号',
        href: 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602014019',
      },
    ],
  },
  en: {
    sections: [
      {
        title: 'About Us',
        links: [
          {
            label: 'About Project',
            href: 'docs/wiki/project-introduction',
          },
          {
            label: 'Contact Us',
            href: 'docs/support/community-interaction',
          },
          { label: 'Features', href: 'docs/wiki/features-introduction' },
        ],
      },
      {
        title: 'Docs',
        links: [
          { label: 'Quick Start', href: 'docs/getting-started' },
          { label: 'Installation Guide', href: 'docs/installation' },
          { label: 'API Docs', href: 'docs/api' },
        ],
      },
      {
        title: 'Related Projects',
        links: [
          {
            label: 'One API',
            href: 'https://github.com/songquanpeng/one-api',
            external: true,
          },
          {
            label: 'Midjourney-Proxy',
            href: 'https://github.com/novicezk/midjourney-proxy',
            external: true,
          },
          {
            label: 'neko-api-key-tool',
            href: 'https://github.com/Calcium-Ion/neko-api-key-tool',
            external: true,
          },
        ],
      },
      {
        title: 'Friendship Links',
        links: [
          {
            label: 'CoAI',
            href: 'https://github.com/coaidev/coai',
            external: true,
          },
          {
            label: 'new-api-horizon',
            href: 'https://github.com/Calcium-Ion/new-api-horizon',
            external: true,
          },
          {
            label: 'GPT-Load',
            href: 'https://www.gpt-load.com',
            external: true,
          },
          {
            label: 'LangBot',
            href: 'https://langbot.app',
            external: true,
          },
        ],
      },
    ],
    social: [
      {
        name: 'GitHub',
        href: 'https://github.com/QuantumNous/new-api',
        icon: <Github className="size-4" />,
      },
      {
        name: 'Gitee',
        href: 'https://gitee.com/QuantumNous/new-api',
        icon: (
          <svg
            role="img"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.037a.594.594 0 0 1-.592-.593v-1.482a.593.593 0 0 1 .592-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z" />
          </svg>
        ),
      },
      {
        name: 'Docker',
        href: 'https://hub.docker.com/r/calciumion/new-api',
        icon: <Container className="size-4" />,
      },
      {
        name: 'QQ',
        href: 'https://qm.qq.com/q/Y79glR8raU',
        icon: <MessageCircle className="size-4" />,
      },
    ],
    copyright: '© 2025 Quantum Nous. All Rights Reserved.',
    beian: [
      { text: '浙ICP备2025190188号-2', href: 'https://beian.miit.gov.cn/' },
      {
        text: '浙公网安备33010602014019号',
        href: 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602014019',
      },
    ],
  },
  ja: {
    sections: [
      {
        title: '私たちについて',
        links: [
          {
            label: 'プロジェクトについて',
            href: 'docs/wiki/project-introduction',
          },
          {
            label: 'お問い合わせ',
            href: 'docs/support/community-interaction',
          },
          { label: '機能', href: 'docs/wiki/features-introduction' },
        ],
      },
      {
        title: 'ドキュメント',
        links: [
          { label: 'クイックスタート', href: 'docs/getting-started' },
          { label: 'インストールガイド', href: 'docs/installation' },
          { label: 'APIドキュメント', href: 'docs/api' },
        ],
      },
      {
        title: '関連プロジェクト',
        links: [
          {
            label: 'One API',
            href: 'https://github.com/songquanpeng/one-api',
            external: true,
          },
          {
            label: 'Midjourney-Proxy',
            href: 'https://github.com/novicezk/midjourney-proxy',
            external: true,
          },
          {
            label: 'neko-api-key-tool',
            href: 'https://github.com/Calcium-Ion/neko-api-key-tool',
            external: true,
          },
        ],
      },
      {
        title: '友好リンク',
        links: [
          {
            label: 'CoAI',
            href: 'https://github.com/coaidev/coai',
            external: true,
          },
          {
            label: 'new-api-horizon',
            href: 'https://github.com/Calcium-Ion/new-api-horizon',
            external: true,
          },
          {
            label: 'GPT-Load',
            href: 'https://www.gpt-load.com',
            external: true,
          },
          {
            label: 'LangBot',
            href: 'https://langbot.app',
            external: true,
          },
        ],
      },
    ],
    social: [
      {
        name: 'GitHub',
        href: 'https://github.com/QuantumNous/new-api',
        icon: <Github className="size-4" />,
      },
      {
        name: 'Gitee',
        href: 'https://gitee.com/QuantumNous/new-api',
        icon: (
          <svg
            role="img"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.037a.594.594 0 0 1-.592-.593v-1.482a.593.593 0 0 1 .592-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z" />
          </svg>
        ),
      },
      {
        name: 'Docker',
        href: 'https://hub.docker.com/r/calciumion/new-api',
        icon: <Container className="size-4" />,
      },
      {
        name: 'QQ',
        href: 'https://qm.qq.com/q/Y79glR8raU',
        icon: <MessageCircle className="size-4" />,
      },
    ],
    copyright: '© 2025 Quantum Nous. All Rights Reserved.',
    beian: [
      { text: '浙ICP备2025190188号-2', href: 'https://beian.miit.gov.cn/' },
      {
        text: '浙公網安備33010602014019号',
        href: 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602014019',
      },
    ],
  },
};

export function Footer({ lang }: FooterProps) {
  const content = footerContent[lang] || footerContent.en;

  return (
    <footer className="border-fd-border bg-fd-card/30 mt-auto border-t backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        {/* Top: Links Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pb-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-12">
          {content.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-fd-foreground mb-4 text-sm font-semibold">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
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
            <p>{content.copyright}</p>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              {content.beian.map((item, index) => (
                <span key={index}>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-fd-foreground transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-4">
            {content.social.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
