import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Github, BookOpen } from 'lucide-react';
import { Hero } from './page.client';
import { getLocalePath, i18n } from '@/lib/i18n';

const contentMap: Record<
  string,
  {
    badge: string;
    title: string;
    getStarted: string;
    github: string;
  }
> = {
  en: {
    badge: 'the AI Gateway you need.',
    title: 'Build excellent AI applications,',
    getStarted: 'Getting Started',
    github: 'GitHub',
  },
  zh: {
    badge: '你需要的 AI 网关。',
    title: '构建卓越的 AI 应用,',
    getStarted: '快速开始',
    github: 'GitHub',
  },
  ja: {
    badge: 'あなたに必要な AI ゲートウェイ。',
    title: '優れた AI アプリケーションを構築,',
    getStarted: 'はじめに',
    github: 'GitHub',
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const content = contentMap[lang] || contentMap.en;

  return (
    <main className="text-landing-foreground dark:text-landing-foreground-dark pt-4 pb-6 md:pb-12">
      <div className="relative mx-auto flex h-[70vh] max-h-[900px] min-h-[600px] w-full max-w-[1400px] overflow-hidden rounded-2xl border bg-origin-border">
        <Hero />
        <div className="z-2 flex size-full flex-col px-4 max-md:items-center max-md:text-center md:p-12">
          <p className="border-brand/50 text-brand mt-12 w-fit rounded-full border p-2 text-xs font-medium">
            {content.badge}
          </p>
          <h1 className="leading-tighter my-8 text-4xl font-medium xl:mb-12 xl:text-5xl">
            {content.title}
            <br />
            your <span className="text-brand">style</span>.
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
              className={cn(
                'bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-medium tracking-tight transition-colors max-sm:text-sm'
              )}
            >
              <Github className="size-4" />
              {content.github}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
