import type {
  LocalizedText,
  PluginDetail,
  PluginView,
  UsageProfile,
} from './schema';
import { OFFICIAL_PLUGIN_SITES, type PluginSite } from './public-site';

export function localizedPluginText(
  text: LocalizedText | null | undefined
): string | null {
  return text?.zh || text?.en || null;
}

export function matchesPluginQuery(plugin: PluginView, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return (
    !normalized ||
    [
      plugin.key,
      plugin.name,
      plugin.kind,
      ...plugin.models,
      ...Object.values(plugin.description ?? {}),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
}

export function pluginUsageGroups(
  detail: Pick<
    PluginDetail,
    'models' | 'usageSchema' | 'usageExamples' | 'usageProfiles'
  >
): UsageProfile[] {
  const profiles = detail.usageProfiles;
  const assigned = new Set(profiles.flatMap((profile) => profile.models));
  const ungrouped = detail.models.filter((model) => !assigned.has(model));
  const groups = [...profiles];
  if (
    detail.usageSchema.length > 0 &&
    (profiles.length === 0 || ungrouped.length > 0)
  ) {
    groups.push({
      models: ungrouped,
      schema: detail.usageSchema,
      examples: detail.usageExamples,
    });
  }
  return groups;
}

const ICON_VARIANTS: Record<string, string> = {
  Color: 'color',
  Brand: 'brand',
  BrandColor: 'brand-color',
  Text: 'text',
  TextCn: 'text-cn',
  TextColor: 'text-color',
};

export function pluginIconSources(
  plugin: Pick<PluginView, 'iconUrl' | 'icon'>,
  site: PluginSite
): string[] {
  const origin = OFFICIAL_PLUGIN_SITES[site];
  const sources: string[] = [];
  if (
    plugin.iconUrl &&
    /^\/api\/v1\/plugins\/[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*\/icon\.(svg|png)$/.test(
      plugin.iconUrl
    )
  ) {
    sources.push(`${origin}${plugin.iconUrl}`);
  }
  const [brand, variant, extra] = plugin.icon?.trim().split('.') ?? [];
  if (brand && /^[A-Z][A-Za-z0-9]{0,47}$/.test(brand) && extra === undefined) {
    const suffix = variant === undefined ? '' : ICON_VARIANTS[variant];
    if (suffix !== undefined)
      sources.push(
        `${origin}/lobe-icons/${brand.toLowerCase()}${suffix ? `-${suffix}` : ''}.svg?v=1`
      );
  }
  return sources;
}
