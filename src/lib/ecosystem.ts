// New API ecosystem projects promoted on the docs site, in step with the
// official site's privacy gateway page and footer ecosystem column.

export const astrlinkRepoUrl = 'https://github.com/Calcium-Ion/AstrLink';
export const moejsRepoUrl = 'https://github.com/Calcium-Ion/moejs';

export function astrlinkUrl(lang: string): string {
  return lang === 'zh' ? 'https://astrlink.com/' : 'https://astrlink.com/en/';
}

// The official site only ships en/zh; its zh pages live on .pro, en on .ai.
export function privacyGatewayUrl(lang: string): string {
  return lang === 'zh'
    ? 'https://www.newapi.pro/zh/privacy-gateway'
    : 'https://www.newapi.ai/en/privacy-gateway';
}
