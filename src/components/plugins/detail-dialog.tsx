'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { TabsList, TabsTrigger } from 'fumadocs-ui/components/tabs';
import { Tabs, TabsContent } from 'fumadocs-ui/components/tabs.unstyled';
import { localizedPluginText, pluginUsageGroups } from '@/lib/plugins/display';
import { channelTypeLabel } from '@/lib/plugins/channel-types';
import type {
  PluginDetail,
  PluginView,
  UsageField,
  UsageProfile,
} from '@/lib/plugins/schema';
import type { PluginSite } from '@/lib/plugins/public-site';
import { buttonVariants } from '@/components/ui/button';
import { usePluginResource } from './use-plugin-resource';
import { PluginChangelogPanel } from './changelog';
import {
  CopyInstallButton,
  ModelChip,
  PluginError,
  PluginExternalLink,
  PluginIcon,
  PluginLoading,
} from './shared';

function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children?: ReactNode;
}) {
  return (
    <li className="bg-fd-muted/50 flex flex-wrap items-center gap-2 rounded-lg p-3">
      <span className="bg-fd-primary/10 text-fd-primary rounded px-1.5 py-1 font-mono text-[10px] font-semibold">
        {method}
      </span>
      <code className="min-w-0 flex-1 text-xs break-all">{path}</code>
      {children}
    </li>
  );
}

function UsageFieldView({ field }: { field: UsageField }) {
  const description = localizedPluginText(field.description);
  const labels =
    field.kind === 'number'
      ? [localizedPluginText(field.unitLabel) || field.unit]
      : field.kind === 'boolean'
        ? ['boolean']
        : field.values.map((value) => {
            const label = localizedPluginText(field.enumLabels?.[value]);
            return label && label !== value ? `${label} (${value})` : value;
          });
  return (
    <li>
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm">{field.key}</code>
        {labels.map((label) => (
          <ModelChip key={label}>{label}</ModelChip>
        ))}
      </div>
      {description && (
        <p className="text-fd-muted-foreground mt-1 text-sm leading-relaxed">
          {description}
        </p>
      )}
    </li>
  );
}

function UsageGroup({ group }: { group: UsageProfile }) {
  return (
    <div className="border-fd-border space-y-3 rounded-xl border p-4">
      {group.models.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {group.models.map((model) => (
            <ModelChip key={model}>{model}</ModelChip>
          ))}
        </div>
      )}
      <ul className="space-y-4">
        {group.schema.map((field) => (
          <UsageFieldView key={field.key} field={field} />
        ))}
      </ul>
      {group.examples.length > 0 && (
        <div className="border-fd-border border-t pt-3">
          <h4 className="mb-2 text-xs font-medium">用量示例</h4>
          <ul className="text-fd-muted-foreground space-y-2 text-xs">
            {group.examples.map((example, index) => (
              <li key={index} className="break-words">
                <span className="font-medium">{example.label}</span>
                <pre className="bg-fd-muted/50 mt-1 overflow-x-auto rounded p-2">
                  {JSON.stringify(example.facts, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PluginDetailDialog({
  plugin,
  site,
  onClose,
}: {
  plugin: PluginView;
  site: PluginSite;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);
  const resource = usePluginResource<PluginDetail>(
    `/${encodeURIComponent(plugin.key)}`,
    site
  );
  const detail = resource.data;
  const summary = localizedPluginText(plugin.description);

  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="plugin-detail-title"
      onClose={onClose}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pressedBackdrop.current =
          event.target === event.currentTarget &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom);
      }}
      onClick={(event) => {
        // Tabs can resize and recenter the dialog between pointer down and click.
        // Dismiss only a gesture that also started on the backdrop.
        const startedOutside = pressedBackdrop.current;
        pressedBackdrop.current = false;
        if (!startedOutside || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
      className="border-fd-border bg-fd-background text-fd-foreground fixed m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="border-fd-border flex shrink-0 items-start gap-3 border-b p-5 sm:p-6">
          <PluginIcon plugin={plugin} site={site} />
          <div className="min-w-0 flex-1">
            <h2
              id="plugin-detail-title"
              className="text-lg font-semibold break-words"
            >
              {plugin.name}
            </h2>
            <p className="text-fd-muted-foreground mt-1 font-mono text-xs">
              {plugin.key} · v{plugin.latest}
            </p>
            <div className="mt-2">
              <PluginExternalLink href={plugin.website}>
                插件官网
              </PluginExternalLink>
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭插件详情"
            onClick={onClose}
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6">
          <Tabs defaultValue="details" className="my-3">
            <TabsList className="border-fd-border mb-5 border-b px-0">
              <TabsTrigger value="details">详情</TabsTrigger>
              <TabsTrigger value="changelog">更新日志</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-6 outline-none">
              {summary && (
                <p className="text-fd-muted-foreground text-sm leading-relaxed">
                  {summary}
                </p>
              )}
              {resource.loading && <PluginLoading />}
              {resource.error && (
                <PluginError
                  message={resource.error}
                  onRetry={resource.retry}
                />
              )}
              {detail &&
                (detail.protocols.length > 0 || detail.routes.length > 0) && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">协议与端点</h3>
                    {detail.protocols.map((protocol) => (
                      <div key={protocol.name} className="space-y-2">
                        <p className="text-fd-muted-foreground font-mono text-xs">
                          {protocol.name}
                        </p>
                        {protocol.models.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {protocol.models.map((model) => (
                              <ModelChip key={model}>{model}</ModelChip>
                            ))}
                          </div>
                        )}
                        <ul className="space-y-1.5">
                          {protocol.operations.map((operation) => (
                            <Endpoint
                              key={`${operation.method}:${operation.path}`}
                              method={operation.method}
                              path={operation.path}
                            >
                              {operation.modes &&
                                protocol.supports.map((mode) => (
                                  <ModelChip key={mode}>{mode}</ModelChip>
                                ))}
                            </Endpoint>
                          ))}
                        </ul>
                        {protocol.operations.length === 0 && (
                          <div className="flex flex-wrap gap-1">
                            {protocol.supports.map((mode) => (
                              <ModelChip key={mode}>{mode}</ModelChip>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {detail.routes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-fd-muted-foreground text-xs">
                          插件原生路由
                        </p>
                        <ul className="space-y-1.5">
                          {detail.routes.map((route) => (
                            <Endpoint
                              key={`${route.method}:${route.path}`}
                              method={route.method}
                              path={route.path}
                            >
                              <ModelChip>{route.type}</ModelChip>
                              {route.action && (
                                <ModelChip>{route.action}</ModelChip>
                              )}
                              {route.models?.map((model) => (
                                <ModelChip key={model}>{model}</ModelChip>
                              ))}
                            </Endpoint>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                )}
              {detail && pluginUsageGroups(detail).length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">用量字段</h3>
                  {pluginUsageGroups(detail).map((group, index) => (
                    <UsageGroup key={index} group={group} />
                  ))}
                </section>
              )}
              {plugin.models.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">支持的模型</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {plugin.models.map((model) => (
                      <ModelChip key={model}>{model}</ModelChip>
                    ))}
                  </div>
                </section>
              )}
              {plugin.channelTypes.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">渠道类型</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {plugin.channelTypes.map((id) => (
                      <ModelChip key={id}>
                        {channelTypeLabel(id)} · {id}
                      </ModelChip>
                    ))}
                  </div>
                </section>
              )}
            </TabsContent>
            <TabsContent value="changelog" className="outline-none">
              <PluginChangelogPanel
                pluginKey={plugin.key}
                latest={plugin.latest}
                versions={detail?.versions ?? [plugin.latest]}
                site={site}
              />
            </TabsContent>
          </Tabs>
        </div>
        <footer className="border-fd-border flex shrink-0 flex-wrap items-start justify-between gap-3 border-t p-5 sm:px-6">
          <CopyInstallButton pluginKey={plugin.key} site={site} />
          <PluginExternalLink href={plugin.sourceUrl} className="py-1.5">
            查看源码
          </PluginExternalLink>
        </footer>
      </div>
    </dialog>
  );
}
