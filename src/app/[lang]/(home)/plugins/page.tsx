import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, BookOpen, Code2, Blocks } from 'lucide-react';
import { PluginMarketplace } from '@/components/plugins/marketplace';
import { buttonVariants } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  lang: 'zh',
  path: 'plugins',
  languages: ['zh'],
  title: '插件市场',
  description:
    '浏览 New API 官方任务插件，查看模型、协议、用量和更新日志，获取官网安装地址与使用开发文档。',
});

export default async function PluginsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (lang !== 'zh') redirect(`/${lang}`);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="border-fd-border mb-12 border-b pb-10 sm:mb-14 sm:pb-12">
        <span className="border-fd-primary/20 bg-fd-primary/5 text-fd-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
          <Blocks className="size-3.5" aria-hidden />
          NEW API PLUGINS
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          任务插件
        </h1>
        <p className="text-fd-muted-foreground mt-5 max-w-2xl text-base leading-7">
          浏览官方任务插件，按需接入图片、视频与音乐生成能力。查看支持的模型和接口，复制官网安装地址，即可前往你的
          New API 实例配置。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/zh/docs/plugins/installation"
            className={`${buttonVariants({ variant: 'primary' })} gap-2 px-4 py-2.5`}
          >
            <BookOpen className="size-4" aria-hidden />
            安装与使用
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/zh/docs/plugins/development"
            className={`${buttonVariants({ variant: 'outline' })} gap-2 px-4 py-2.5`}
          >
            <Code2 className="size-4" aria-hidden />
            开发插件
          </Link>
          <Link
            href="/zh/docs/plugins"
            className={`${buttonVariants({ variant: 'ghost' })} px-4 py-2.5`}
          >
            插件文档
          </Link>
        </div>
      </header>
      <PluginMarketplace />
    </div>
  );
}
