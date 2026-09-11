'use client';

import { OFFICIAL_PLUGIN_SITES } from '@/lib/plugins/public-site';
import { usePluginSite } from './use-plugin-resource';
import { PluginExternalLink } from './shared';

/** MDX uses this component so a Chinese page on .ai still links to the .ai site. */
export function OfficialPluginLinks() {
  const site = usePluginSite();
  if (!site)
    return (
      <p className="text-fd-muted-foreground text-sm">正在加载官网地址…</p>
    );
  const origin = OFFICIAL_PLUGIN_SITES[site];
  return (
    <div className="not-prose border-fd-border my-5 space-y-3 rounded-xl border p-4">
      <PluginExternalLink href={`${origin}/plugins`}>
        打开官网插件市场
      </PluginExternalLink>
      <label className="block text-sm">
        官方市场源地址
        <input
          readOnly
          aria-label="官方市场源地址"
          value={`${origin}/api/v1/plugins/index.json`}
          onFocus={(event) => event.currentTarget.select()}
          className="border-fd-border bg-fd-muted/40 mt-2 block w-full rounded-md border p-2 font-mono text-xs"
        />
      </label>
    </div>
  );
}
