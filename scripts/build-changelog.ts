/**
 * Changelog Build Script
 * Fetches version information from GitHub Releases API and generates changelog during build time
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SOURCE_REPO = process.env.SOURCE_REPO || 'QuantumNous/new-api';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const MAX_RELEASES = 30;

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  prerelease: boolean;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

interface ActiveCodeFence {
  char: '`' | '~';
  length: number;
  quoteDepth: number;
}

// i18n Configuration
const CHANGELOG_I18N = {
  zh: {
    title: '# 📝 更新日志',
    warningTitle: '版本日志信息 · 数据更新于',
    warningDesc: `如需查看全部历史版本，请访问 [GitHub Releases 页面](https://github.com/${SOURCE_REPO}/releases)，本页面从该页面定时获取最新更新信息。`,
    unknownVersion: '未知版本',
    noReleaseNotes: '无发布说明',
    publishedAt: '发布于',
    timeSuffix: '(中国时间)',
    latestPre: '最新预发布版本',
    latest: '最新正式版本',
    pre: '预发布版本',
    normal: '正式版本',
    downloadResources: '下载资源',
    noData: '暂无版本数据，请稍后再试。',
  },
  en: {
    title: '# 📝 Changelog',
    warningTitle: 'Version Log Information · Data updated at',
    warningDesc: `To view all historical versions, please visit the [GitHub Releases page](https://github.com/${SOURCE_REPO}/releases). This page automatically fetches the latest update information from that page.`,
    unknownVersion: 'Unknown Version',
    noReleaseNotes: 'No release notes',
    publishedAt: 'Published at',
    timeSuffix: '(UTC+8)',
    latestPre: 'Latest Pre-release',
    latest: 'Latest Release',
    pre: 'Pre-release',
    normal: 'Release',
    downloadResources: 'Download Resources',
    noData: 'No version data available, please try again later.',
  },
  ja: {
    title: '# 📝 変更履歴',
    warningTitle: 'バージョンログ情報 · データ更新日時',
    warningDesc: `すべての履歴バージョンを表示するには、[GitHub Releases ページ](https://github.com/${SOURCE_REPO}/releases)をご覧ください。このページは定期的に最新の更新情報を取得します。`,
    unknownVersion: '不明なバージョン',
    noReleaseNotes: 'リリースノートなし',
    publishedAt: '公開日',
    timeSuffix: '(UTC+8)',
    latestPre: '最新プレリリース版',
    latest: '最新リリース版',
    pre: 'プレリリース版',
    normal: 'リリース版',
    downloadResources: 'Download Resources',
    noData: 'バージョンデータがありません。後でもう一度お試しください。',
  },
};

async function fetchGitHubReleases(): Promise<Release[]> {
  const headers: Record<string, string> = {
    'User-Agent': 'New-API-Docs-Builder/1.0',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    console.log('✓ Using GitHub Token for authentication');
  } else {
    console.warn(
      '⚠ GitHub Token not configured, API rate limit: 60 requests/hour'
    );
  }

  const url = `https://api.github.com/repos/${SOURCE_REPO}/releases?per_page=${MAX_RELEASES}`;

  try {
    console.log(`Fetching Releases: ${url}`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as Release[];
    console.log(`✓ Successfully fetched ${data.length} releases`);
    return data;
  } catch (error) {
    console.error('✗ Failed to fetch GitHub Releases:', error);
    throw error;
  }
}

function formatTimeToChina(
  publishedAt: string,
  lang: keyof typeof CHANGELOG_I18N
): string {
  if (!publishedAt) {
    return CHANGELOG_I18N[lang].unknownVersion;
  }

  try {
    const date = new Date(publishedAt);
    const chinaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const formatted = chinaDate
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
    return `${formatted} ${CHANGELOG_I18N[lang].timeSuffix}`;
  } catch {
    return publishedAt;
  }
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeMdxInlineText(value: string): string {
  return value.replace(/\\?([{}<])/g, '\\$1');
}

function normalizeSafeImgTag(rawAttrs: string): string | null {
  const attrs: Partial<Record<'src' | 'alt' | 'width' | 'height', string>> = {};
  const attrRe =
    /\b(src|alt|width|height)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

  for (let match; (match = attrRe.exec(rawAttrs)); ) {
    const key = match[1].toLowerCase() as 'src' | 'alt' | 'width' | 'height';
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = val;
  }

  if (!attrs.src || !/^(?:https?:\/\/|\/)/i.test(attrs.src)) {
    return null;
  }

  const parts = [`src="${escapeHtmlAttribute(attrs.src)}"`];
  if (attrs.alt !== undefined) {
    parts.push(`alt="${escapeHtmlAttribute(attrs.alt)}"`);
  }
  if (attrs.width !== undefined) {
    parts.push(`width="${escapeHtmlAttribute(attrs.width)}"`);
  }
  if (attrs.height !== undefined) {
    parts.push(`height="${escapeHtmlAttribute(attrs.height)}"`);
  }

  return `<img ${parts.join(' ')} />`;
}

function sanitizeMdxProse(text: string): string {
  const tokenRe =
    /\\[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]|<!--[\s\S]*?-->|<((?:https?|mailto):[^>\s]+)>|<(br|hr)\s*\/?>|<img\b([^>]*?)\/?>|\]\(((?:https?:\/\/|\/)(?:[^\s()]|\([^\s()]*\))+)\)|(https?:\/\/[^\s<>)\]]+)|[{}<]/gi;

  return text.replace(
    tokenRe,
    (
      match,
      autolinkUrl?: string,
      voidTag?: string,
      imgAttrs?: string,
      markdownLinkUrl?: string,
      bareUrl?: string
    ) => {
      if (match.startsWith('\\')) {
        return match;
      }
      if (match.startsWith('<!--')) {
        return '';
      }
      if (autolinkUrl !== undefined) {
        return `[${autolinkUrl.replace(/([{}<])/g, '\\$1')}](${autolinkUrl})`;
      }
      if (voidTag !== undefined) {
        return `<${voidTag.toLowerCase()} />`;
      }
      if (imgAttrs !== undefined) {
        return normalizeSafeImgTag(imgAttrs) ?? match.replace(/[{}<]/g, '\\$&');
      }
      if (markdownLinkUrl !== undefined) {
        return `](${markdownLinkUrl})`;
      }
      if (bareUrl !== undefined) {
        const trailingMatch = /[.,;:!?]+$/.exec(bareUrl);
        const cleanUrl = trailingMatch
          ? bareUrl.slice(0, -trailingMatch[0].length)
          : bareUrl;
        const trailing = trailingMatch ? trailingMatch[0] : '';
        if (/[{}]/.test(cleanUrl)) {
          return `[${cleanUrl.replace(/([{}])/g, '\\$1')}](${cleanUrl})${trailing}`;
        }
        return bareUrl;
      }
      return `\\${match}`;
    }
  );
}

function sanitizeNonFencedChunk(chunk: string): string {
  const headerNormalized = chunk
    .split('\n')
    .map((line) => {
      const headingMatch = /^( {0,3}(?:> ?)* {0,3})(#{1,6})([ \t]+.*)$/.exec(
        line
      );
      if (headingMatch) {
        const [, prefix, hashes, rest] = headingMatch;
        const nextLevel = Math.min(
          6,
          hashes.length === 1 ? 3 : hashes.length + 1
        );
        return `${prefix}${'#'.repeat(nextLevel)}${rest}`;
      }
      if (/^(import|export)(?=\s)/.test(line)) {
        return line.startsWith('import')
          ? `&#105;${line.slice(1)}`
          : `&#101;${line.slice(1)}`;
      }
      return line;
    })
    .join('\n');

  let out = '';
  let proseStart = 0;
  let i = 0;

  while (i < headerNormalized.length) {
    const ch = headerNormalized[i];
    if (
      ch === '\\' &&
      i + 1 < headerNormalized.length &&
      /^[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]$/.test(headerNormalized[i + 1])
    ) {
      i += 2;
      continue;
    }

    if (ch === '`') {
      let openEnd = i;
      while (
        openEnd < headerNormalized.length &&
        headerNormalized[openEnd] === '`'
      ) {
        openEnd++;
      }
      const tickLen = openEnd - i;

      let searchPos = openEnd;
      let closeStart = -1;
      while (searchPos < headerNormalized.length) {
        if (headerNormalized[searchPos] === '`') {
          let runEnd = searchPos;
          while (
            runEnd < headerNormalized.length &&
            headerNormalized[runEnd] === '`'
          ) {
            runEnd++;
          }
          if (runEnd - searchPos === tickLen) {
            const inner = headerNormalized.slice(openEnd, searchPos);
            if (!/\n[ \t]*(?:> ?)*[ \t]*\n/.test(inner)) {
              closeStart = searchPos;
            }
            break;
          }
          searchPos = runEnd;
          continue;
        }
        searchPos++;
      }

      if (closeStart !== -1) {
        out += sanitizeMdxProse(headerNormalized.slice(proseStart, i));
        out += headerNormalized.slice(i, closeStart + tickLen);
        i = closeStart + tickLen;
        proseStart = i;
        continue;
      }

      i = openEnd;
      continue;
    }

    i++;
  }

  if (proseStart < headerNormalized.length) {
    out += sanitizeMdxProse(headerNormalized.slice(proseStart));
  }

  return out;
}

function getQuoteDepth(line: string): { stripped: string; quoteDepth: number } {
  const stripped = line.replace(/^(?: {0,3}> ?)*/, '');
  const prefix = line.slice(0, line.length - stripped.length);
  const quoteDepth = (prefix.match(/>/g) || []).length;
  return { stripped, quoteDepth };
}

function matchOpenCodeFence(line: string): ActiveCodeFence | null {
  const { stripped, quoteDepth } = getQuoteDepth(line);
  const backtickMatch = /^ {0,3}(`{3,})([^`]*)$/.exec(stripped);
  if (backtickMatch) {
    return { char: '`', length: backtickMatch[1].length, quoteDepth };
  }
  const tildeMatch = /^ {0,3}(~{3,})(.*)$/.exec(stripped);
  if (tildeMatch) {
    return { char: '~', length: tildeMatch[1].length, quoteDepth };
  }
  return null;
}

function isClosingCodeFence(line: string, fence: ActiveCodeFence): boolean {
  const { stripped } = getQuoteDepth(line);
  const closeMatch = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(stripped);
  if (!closeMatch) return false;
  const marker = closeMatch[1];
  return marker[0] === fence.char && marker.length >= fence.length;
}

export function sanitizeReleaseMarkdown(body: string): string {
  if (!body) return '';

  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const outputSegments: string[] = [];
  let proseBuffer: string[] = [];
  let codeBuffer: string[] = [];
  let activeFence: ActiveCodeFence | null = null;

  const flushProse = () => {
    if (proseBuffer.length > 0) {
      outputSegments.push(sanitizeNonFencedChunk(proseBuffer.join('\n')));
      proseBuffer = [];
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      outputSegments.push(codeBuffer.join('\n'));
      codeBuffer = [];
    }
  };

  for (const line of lines) {
    if (activeFence) {
      const { quoteDepth } = getQuoteDepth(line);
      if (quoteDepth < activeFence.quoteDepth) {
        codeBuffer.push(
          `${'> '.repeat(activeFence.quoteDepth)}${activeFence.char.repeat(activeFence.length)}`
        );
        flushCode();
        activeFence = null;
      } else {
        codeBuffer.push(line);
        if (isClosingCodeFence(line, activeFence)) {
          flushCode();
          activeFence = null;
        }
        continue;
      }
    }

    const opened = matchOpenCodeFence(line);
    if (opened) {
      flushProse();
      activeFence = opened;
      codeBuffer.push(line);
    } else {
      proseBuffer.push(line);
    }
  }

  if (activeFence) {
    codeBuffer.push(
      `${'> '.repeat(activeFence.quoteDepth)}${activeFence.char.repeat(activeFence.length)}`
    );
    flushCode();
  } else {
    flushProse();
  }

  return outputSegments.join('\n');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDownloadLinks(
  tagName: string,
  assets: Release['assets'],
  lang: keyof typeof CHANGELOG_I18N
): string {
  if (!assets?.length && !tagName) return '';

  const i18n = CHANGELOG_I18N[lang];
  let html = `**${i18n.downloadResources}**\n\n<ul>\n`;

  // Add asset files
  for (const asset of assets) {
    const { name, browser_download_url, size } = asset;
    const sizeStr = formatFileSize(size);
    html += `<li><a href="${escapeHtmlAttribute(browser_download_url)}">${escapeMdxInlineText(name)}</a> (${sizeStr})</li>\n`;
  }

  // Add source code download links
  if (tagName) {
    const encodedTag = encodeURIComponent(tagName);
    for (const [ext, extName] of [
      ['zip', 'zip'],
      ['tar.gz', 'tar.gz'],
    ]) {
      const url = `https://github.com/${SOURCE_REPO}/archive/refs/tags/${encodedTag}.${ext}`;
      html += `<li><a href="${escapeHtmlAttribute(url)}">Source code (${extName})</a></li>\n`;
    }
  }

  html += '</ul>';
  return html;
}

function getVersionType(
  index: number,
  prerelease: boolean,
  lang: keyof typeof CHANGELOG_I18N
): string {
  const i18n = CHANGELOG_I18N[lang];

  if (index === 0) {
    return prerelease ? i18n.latestPre : i18n.latest;
  } else {
    return prerelease ? i18n.pre : i18n.normal;
  }
}

export function formatReleasesMarkdown(
  releases: Release[],
  lang: keyof typeof CHANGELOG_I18N
): string {
  if (!releases?.length) {
    return CHANGELOG_I18N[lang].noData;
  }

  const i18n = CHANGELOG_I18N[lang];

  // Add frontmatter
  const titleMap = {
    zh: '更新日志',
    en: 'Changelog',
    ja: '変更履歴',
  };
  let markdown = `---\ntitle: ${titleMap[lang]}\n---\n\n`;

  markdown += `import { Callout } from 'fumadocs-ui/components/callout';\n\n`;

  // Add warning information
  const currentTime = new Date()
    .toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    })
    .replace(/\//g, '-');

  markdown += `<Callout type="warn" title="${i18n.warningTitle} ${currentTime}">\n`;
  markdown += `${i18n.warningDesc}\n`;
  markdown += `</Callout>\n\n`;

  // Process each release version
  for (let index = 0; index < releases.length; index++) {
    const release = releases[index];
    const {
      tag_name = i18n.unknownVersion,
      name = tag_name,
      published_at = '',
      body = i18n.noReleaseNotes,
      prerelease = false,
      assets = [],
    } = release;

    // Process content
    const formattedDate = formatTimeToChina(published_at, lang);
    const processedBody = sanitizeReleaseMarkdown(body || i18n.noReleaseNotes);
    const safeHeading = escapeMdxInlineText(
      (name || tag_name || i18n.unknownVersion).replace(/\r?\n/g, ' ').trim()
    );

    // Generate version block
    markdown += `## ${safeHeading}\n\n`;

    const versionType = getVersionType(index, prerelease, lang);
    const calloutType = index === 0 ? 'info' : 'note';

    markdown += `<Callout type="${calloutType}" title="${versionType} · ${i18n.publishedAt} ${formattedDate}">\n\n`;
    markdown += `${processedBody}\n\n`;

    // Add download links
    const downloadLinks = formatDownloadLinks(tag_name, assets, lang);
    if (downloadLinks) {
      markdown += `${downloadLinks}\n\n`;
    }

    markdown += `</Callout>\n\n`;
    markdown += '---\n\n';
  }

  return markdown;
}

export async function generateChangelog() {
  console.log('\n🚀 Starting to generate Changelog...\n');

  try {
    // Fetch releases data
    const releases = await fetchGitHubReleases();

    // Generate files for each language
    const languages = ['zh', 'en', 'ja'] as const;

    for (const lang of languages) {
      console.log(`\n📝 Generating ${lang.toUpperCase()} version...`);

      const markdown = formatReleasesMarkdown(releases, lang);
      const outputPath = path.join(
        process.cwd(),
        'content',
        'docs',
        lang,
        'guide',
        'wiki',
        'changelog.mdx'
      );

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(outputPath, markdown, 'utf-8');
      console.log(`✓ Generated: ${outputPath}`);
    }

    console.log('\n✅ Changelog generation completed!\n');
  } catch (error) {
    console.error('\n❌ Changelog generation failed:', error);
    // Don't throw error, use existing files if they exist
    console.log('⚠ Will use existing changelog files if available\n');
  }
}

// Execute generation
if (typeof require !== 'undefined' && require.main === module) {
  generateChangelog();
}

export type { Release };
