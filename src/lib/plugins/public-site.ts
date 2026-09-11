export const OFFICIAL_PLUGIN_SITES = {
  pro: 'https://www.newapi.pro',
  ai: 'https://www.newapi.ai',
} as const;

export type PluginSite = keyof typeof OFFICIAL_PLUGIN_SITES;

/** Select by hostname, never by UI language. Previews use the international site. */
export function pluginSiteFromHostname(hostname: string): PluginSite {
  try {
    const host = new URL(`https://${hostname}`).hostname
      .toLowerCase()
      .replace(/\.$/, '');
    if (host === 'newapi.pro' || host.endsWith('.newapi.pro')) return 'pro';
  } catch {
    // An absent/invalid host uses the same default as a local preview.
  }
  return 'ai';
}

export function officialPluginInstallUrl(
  site: PluginSite,
  key: string
): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(key)) {
    throw new Error('Invalid plugin key');
  }
  return `${OFFICIAL_PLUGIN_SITES[site]}/api/v1/plugins/${key}/plugin.js`;
}

export function safeExternalUrl(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
