'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { localizedPluginText, matchesPluginQuery } from '@/lib/plugins/display';
import {
  OFFICIAL_PLUGIN_SITES,
  type PluginSite,
} from '@/lib/plugins/public-site';
import type { PluginCatalog, PluginView } from '@/lib/plugins/schema';
import { PluginDetailDialog } from './detail-dialog';
import {
  CopyInstallButton,
  ModelChip,
  PluginError,
  PluginExternalLink,
  PluginIcon,
} from './shared';
import { usePluginResource, usePluginSite } from './use-plugin-resource';

function PluginCard({
  plugin,
  site,
  onOpen,
}: {
  plugin: PluginView;
  site: PluginSite;
  onOpen: () => void;
}) {
  const summary = localizedPluginText(plugin.description);
  return (
    <article className="border-fd-border bg-fd-card hover:border-fd-primary/40 flex h-full min-w-0 flex-col gap-5 rounded-2xl border p-5 transition-colors sm:p-6">
      <div className="flex items-start gap-3">
        <PluginIcon plugin={plugin} site={site} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-snug font-semibold break-words">
            {plugin.name}
          </h2>
          <p className="text-fd-muted-foreground mt-1 font-mono text-xs">
            {plugin.key}
          </p>
        </div>
        <span className="bg-fd-muted text-fd-muted-foreground shrink-0 rounded-md px-2 py-1 font-mono text-[10px]">
          v{plugin.latest}
        </span>
      </div>
      {summary && (
        <p className="text-fd-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {summary}
        </p>
      )}
      <div className="text-fd-muted-foreground flex flex-wrap items-center gap-3 text-xs">
        <span>{plugin.kind === 'task' ? '任务插件' : plugin.kind}</span>
        <PluginExternalLink href={plugin.website} className="text-xs">
          插件官网
        </PluginExternalLink>
      </div>
      {plugin.models.length > 0 && (
        <div>
          <p className="text-fd-muted-foreground mb-2 text-xs">支持模型</p>
          <div className="flex flex-wrap gap-1.5">
            {plugin.models.slice(0, 4).map((model) => (
              <ModelChip key={model}>{model}</ModelChip>
            ))}
            {plugin.models.length > 4 && (
              <span className="text-fd-muted-foreground self-center px-1 text-xs">
                +{plugin.models.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="border-fd-border mt-auto flex flex-wrap items-start gap-2 border-t pt-4">
        <CopyInstallButton pluginKey={plugin.key} site={site} />
        <button
          type="button"
          aria-label={`查看 ${plugin.name} 详情`}
          aria-haspopup="dialog"
          onClick={onOpen}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          详情
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
        <PluginExternalLink
          href={plugin.sourceUrl}
          className="ml-auto py-1.5 text-xs"
        >
          源码
        </PluginExternalLink>
      </div>
    </article>
  );
}

export function PluginMarketplace() {
  const site = usePluginSite();
  const resource = usePluginResource<PluginCatalog>('', site);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PluginView | null>(null);
  const catalog = resource.data;
  const plugins = useMemo(
    () =>
      catalog?.plugins.filter((plugin) => matchesPluginQuery(plugin, query)) ??
      [],
    [catalog, query]
  );

  return (
    <section aria-label="官方插件目录" className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">官方插件</h2>
          <p
            aria-live="polite"
            className="text-fd-muted-foreground mt-1 text-sm"
          >
            {catalog
              ? `共 ${catalog.plugins.length} 个插件${query.trim() ? `，找到 ${plugins.length} 个结果` : ''}`
              : '从官网获取最新插件目录'}
          </p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search
            aria-hidden
            className="text-fd-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
          />
          <input
            type="search"
            aria-label="搜索插件名称、模型或描述"
            placeholder="搜索名称、模型或描述…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="border-fd-border bg-fd-background focus-visible:ring-fd-ring h-11 w-full rounded-xl border pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
          />
        </div>
      </div>
      {resource.loading ? (
        <div role="status">
          <span className="sr-only">正在加载插件目录…</span>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="border-fd-border bg-fd-muted/40 h-72 animate-pulse rounded-2xl border"
              />
            ))}
          </div>
        </div>
      ) : resource.error ? (
        <PluginError message={resource.error} onRetry={resource.retry} />
      ) : !catalog?.plugins.length ? (
        <p className="border-fd-border text-fd-muted-foreground rounded-xl border border-dashed py-16 text-center">
          目录里还没有插件。
        </p>
      ) : !plugins.length ? (
        <div className="py-16 text-center">
          <p className="text-fd-muted-foreground">没有匹配的插件。</p>
          <button
            type="button"
            className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mt-3`}
            onClick={() => setQuery('')}
          >
            清除搜索
          </button>
        </div>
      ) : (
        site && (
          <ul className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {plugins.map((plugin) => (
              <li key={plugin.key} className="min-w-0">
                <PluginCard
                  plugin={plugin}
                  site={site}
                  onOpen={() => setSelected(plugin)}
                />
              </li>
            ))}
          </ul>
        )
      )}
      {catalog && (
        <div className="border-fd-border text-fd-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs">
          <PluginExternalLink href={catalog.source.url} className="text-xs">
            数据来自 {catalog.source.owner}/{catalog.source.repo}
          </PluginExternalLink>
          {Number.isFinite(Date.parse(catalog.fetchedAt)) && (
            <time dateTime={catalog.fetchedAt}>
              更新于 {new Date(catalog.fetchedAt).toLocaleString('zh-CN')}
            </time>
          )}
        </div>
      )}
      {site && (
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <Link
            href="/zh/docs/plugins/installation"
            className="text-fd-primary hover:underline"
          >
            如何安装插件 →
          </Link>
          <PluginExternalLink href={`${OFFICIAL_PLUGIN_SITES[site]}/plugins`}>
            官网插件市场
          </PluginExternalLink>
        </div>
      )}
      {selected && site && (
        <PluginDetailDialog
          key={`${site}:${selected.key}`}
          plugin={selected}
          site={site}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
