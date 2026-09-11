'use client';

import { useState, type ReactNode } from 'react';
import type { ChangelogRun, PluginChangelog } from '@/lib/plugins/schema';
import type { PluginSite } from '@/lib/plugins/public-site';
import { safeExternalUrl } from '@/lib/plugins/public-site';
import { usePluginResource } from './use-plugin-resource';
import { PluginError, PluginExternalLink, PluginLoading } from './shared';

const CATEGORIES = {
  Added: '新增',
  Changed: '变更',
  Deprecated: '弃用',
  Removed: '移除',
  Fixed: '修复',
  Security: '安全',
  Migration: '迁移说明',
};

function ChangelogText({ run }: { run: ChangelogRun }) {
  let content: ReactNode = run.text;
  if (run.code)
    content = (
      <code className="bg-fd-muted rounded px-1 py-0.5 text-xs">{content}</code>
    );
  if (run.strong)
    content = (
      <strong className="text-fd-foreground font-semibold">{content}</strong>
    );
  if (run.emphasis) content = <em>{content}</em>;
  const href = safeExternalUrl(run.href);
  if (href)
    content = (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4"
      >
        {content}
      </a>
    );
  return content;
}

export function PluginChangelogPanel({
  pluginKey,
  latest,
  versions,
  site,
}: {
  pluginKey: string;
  latest: string;
  versions: string[];
  site: PluginSite;
}) {
  const [version, setVersion] = useState(latest);
  const resource = usePluginResource<PluginChangelog | null>(
    `/${encodeURIComponent(pluginKey)}/${encodeURIComponent(version)}/changelog`,
    site
  );
  const changelog = resource.data;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          发布版本
          <select
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            className="border-fd-border bg-fd-background text-fd-foreground max-w-44 rounded-md border px-3 py-2"
          >
            {[...new Set([latest, ...versions])].map((item) => (
              <option key={item} value={item}>
                v{item}
              </option>
            ))}
          </select>
        </label>
        {changelog && (
          <PluginExternalLink href={changelog.sourceUrl}>
            日志源文件
          </PluginExternalLink>
        )}
      </div>
      {resource.loading ? (
        <PluginLoading label="正在加载更新日志…" />
      ) : resource.error ? (
        <PluginError message={resource.error} onRetry={resource.retry} />
      ) : !changelog ? (
        <p className="text-fd-muted-foreground py-8 text-center text-sm">
          此版本暂无更新日志。
        </p>
      ) : (
        <>
          {changelog.locale === 'en' && (
            <p
              role="status"
              className="bg-fd-muted/60 text-fd-muted-foreground rounded-md p-3 text-xs"
            >
              此更新日志暂时仅提供英文版本。
            </p>
          )}
          {changelog.sections.map((section) => (
            <section key={section.category} className="space-y-2">
              <h3 className="text-sm font-semibold">
                {CATEGORIES[section.category]}
              </h3>
              <ul className="text-fd-muted-foreground list-disc space-y-2 pl-5 text-sm leading-relaxed">
                {section.entries.map((entry, index) => (
                  <li key={index} className="break-words whitespace-pre-line">
                    {entry.map((run, runIndex) => (
                      <ChangelogText key={runIndex} run={run} />
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
