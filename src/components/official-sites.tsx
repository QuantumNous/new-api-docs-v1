import { ArrowUpRight } from 'lucide-react';

const labels: Record<string, { title: string; link: string }> = {
  zh: { title: '了解 New API 项目与生态', link: 'New API 官网' },
  en: {
    title: 'Explore the New API project and ecosystem',
    link: 'New API official website',
  },
  ja: {
    title: 'New API プロジェクトとエコシステム',
    link: 'New API 公式サイト',
  },
};

export function OfficialSites({ lang }: { lang: string }) {
  const text = labels[lang] || labels.en;
  return (
    <nav
      aria-label={text.link}
      className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between"
    >
      <p className="text-fd-muted-foreground text-sm">{text.title}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {['ai', 'pro'].map((domain) => (
          <a
            key={domain}
            href={`https://www.newapi.${domain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fd-foreground hover:text-brand inline-flex flex-wrap items-center gap-1.5 text-sm font-medium transition-colors"
          >
            {text.link}
            <span className="text-fd-muted-foreground font-normal">
              newapi.{domain}
            </span>
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        ))}
      </div>
    </nav>
  );
}
