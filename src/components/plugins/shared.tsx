'use client';

import { useState, type ReactNode } from 'react';
import { Check, Copy, ExternalLink, RotateCw } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  officialPluginInstallUrl,
  safeExternalUrl,
  type PluginSite,
} from '@/lib/plugins/public-site';
import { pluginIconSources } from '@/lib/plugins/display';
import type { PluginView } from '@/lib/plugins/schema';

export function PluginExternalLink({
  href,
  children,
  className = '',
}: {
  href: string | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  const safeHref = safeExternalUrl(href);
  if (!safeHref) return null;
  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-fd-muted-foreground hover:text-fd-foreground inline-flex items-center gap-1.5 text-sm transition-colors ${className}`}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
    </a>
  );
}

export function ModelChip({ children }: { children: ReactNode }) {
  return (
    <span className="border-fd-border bg-fd-muted/50 rounded-md border px-2 py-1 font-mono text-[11px] leading-normal break-all">
      {children}
    </span>
  );
}

export function PluginIcon({
  plugin,
  site,
}: {
  plugin: PluginView;
  site: PluginSite;
}) {
  const sources = pluginIconSources(plugin, site);
  return (
    <PluginImage key={sources.join('|')} sources={sources} name={plugin.name} />
  );
}

function PluginImage({ sources, name }: { sources: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  return (
    <span
      aria-hidden
      className="border-fd-border bg-fd-muted/40 flex size-12 shrink-0 items-center justify-center rounded-xl border text-lg font-semibold"
    >
      {sources[index] ? (
        <img
          src={sources[index]}
          alt=""
          width={30}
          height={30}
          loading="lazy"
          className="size-8 object-contain"
          onError={() => setIndex((value) => value + 1)}
        />
      ) : (
        (name.trim()[0] || '?').toUpperCase()
      )}
    </span>
  );
}

export function CopyInstallButton({
  pluginKey,
  site,
}: {
  pluginKey: string;
  site: PluginSite;
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const url = officialPluginInstallUrl(site, pluginKey);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  }
  return (
    <div className="min-w-0">
      <button
        type="button"
        className={buttonVariants({ variant: 'primary', size: 'sm' })}
        onClick={copy}
      >
        {status === 'copied' ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
        {status === 'copied' ? '已复制安装地址' : '复制安装地址'}
      </button>
      <span
        role="status"
        className={
          status === 'error'
            ? 'text-fd-muted-foreground mt-2 block text-xs'
            : 'sr-only'
        }
      >
        {status === 'copied'
          ? '官网安装地址已复制，可在 New API 任务插件页面导入。'
          : status === 'error'
            ? '复制失败，请手动复制下方地址。'
            : ''}
      </span>
      {status === 'error' && (
        <input
          aria-label="官网安装地址"
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="bg-fd-background mt-2 w-full rounded-md border p-2 font-mono text-xs"
        />
      )}
    </div>
  );
}

export function PluginError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="border-fd-border bg-fd-muted/30 rounded-xl border p-6 text-center"
    >
      <p className="text-fd-muted-foreground text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-4`}
      >
        <RotateCw className="size-3.5" aria-hidden />
        重新加载
      </button>
    </div>
  );
}

export function PluginLoading({
  label = '正在加载插件数据…',
}: {
  label?: string;
}) {
  return (
    <div role="status" className="space-y-3 py-5">
      <span className="sr-only">{label}</span>
      <div className="bg-fd-muted h-4 w-32 animate-pulse rounded" />
      <div className="bg-fd-muted/60 h-20 animate-pulse rounded-xl" />
    </div>
  );
}
