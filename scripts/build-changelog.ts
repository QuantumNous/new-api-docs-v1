/**
 * Changelog 构建脚本
 * 在构建时从 GitHub Releases API 获取版本信息并生成更新日志
 */

import * as fs from 'fs';
import * as path from 'path';

// 配置
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

// i18n 配置
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
    console.log('✓ 使用 GitHub Token 进行认证');
  } else {
    console.warn('⚠ 未配置 GitHub Token，API 限制为 60次/小时');
  }

  const url = `https://api.github.com/repos/${SOURCE_REPO}/releases?per_page=${MAX_RELEASES}`;

  try {
    console.log(`正在获取 Releases: ${url}`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API 请求失败: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as Release[];
    console.log(`✓ 成功获取 ${data.length} 个版本`);
    return data;
  } catch (error) {
    console.error('✗ 获取 GitHub Releases 失败:', error);
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

function processMarkdownHeaders(body: string): string {
  if (!body) return '';

  // 降低标题级别（从高到低处理，避免多次降级）
  let processed = body;
  processed = processed.replace(/^######\s+/gm, '###### ');
  processed = processed.replace(/^#####\s+/gm, '###### ');
  processed = processed.replace(/^####\s+/gm, '##### ');
  processed = processed.replace(/^###\s+/gm, '#### ');
  processed = processed.replace(/^##\s+/gm, '### ');
  processed = processed.replace(/^#\s+/gm, '### ');

  return processed;
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
  let markdown = `    **${i18n.downloadResources}**\n\n`;

  // 添加资源文件
  for (const asset of assets) {
    const { name, browser_download_url, size } = asset;
    const sizeStr = formatFileSize(size);
    markdown += `    - [${name}](${browser_download_url}) (${sizeStr})\n`;
  }

  // 添加源代码下载链接
  if (tagName) {
    for (const [ext, extName] of [
      ['zip', 'zip'],
      ['tar.gz', 'tar.gz'],
    ]) {
      const url = `https://github.com/${SOURCE_REPO}/archive/refs/tags/${tagName}.${ext}`;
      markdown += `    - [Source code (${extName})](${url})\n`;
    }
  }

  markdown += '\n';
  return markdown;
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

function formatReleasesMarkdown(
  releases: Release[],
  lang: keyof typeof CHANGELOG_I18N
): string {
  if (!releases?.length) {
    return CHANGELOG_I18N[lang].noData;
  }

  const i18n = CHANGELOG_I18N[lang];

  // 添加 frontmatter
  const titleMap = {
    zh: '更新日志',
    en: 'Changelog',
    ja: '変更履歴',
  };
  let markdown = `---\ntitle: ${titleMap[lang]}\n---\n\n`;

  markdown += `${i18n.title}\n\n`;

  // 添加警告信息
  const currentTime = new Date()
    .toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    })
    .replace(/\//g, '-');

  markdown += `:::warning{title="${i18n.warningTitle} ${currentTime}"}\n`;
  markdown += `${i18n.warningDesc}\n`;
  markdown += `:::\n\n`;

  // 处理每个版本
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

    // 处理内容
    const formattedDate = formatTimeToChina(published_at, lang);
    const processedBody = processMarkdownHeaders(body);

    // 生成版本块
    markdown += `## ${name}\n\n`;

    const versionType = getVersionType(index, prerelease, lang);
    const admonitionType = index === 0 ? 'info' : 'note';

    markdown += `:::${admonitionType}{title="${versionType} · ${i18n.publishedAt} ${formattedDate}"}\n\n`;

    // 添加缩进内容
    const indentedBody = processedBody
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n');
    markdown += `${indentedBody}\n\n`;

    // 添加下载链接
    const downloadLinks = formatDownloadLinks(tag_name, assets, lang);
    if (downloadLinks) {
      markdown += downloadLinks;
    }

    markdown += ':::\n\n';
    markdown += '---\n\n';
  }

  return markdown;
}

async function generateChangelog() {
  console.log('\n🚀 开始生成 Changelog...\n');

  try {
    // 获取 releases 数据
    const releases = await fetchGitHubReleases();

    // 为每种语言生成文件
    const languages = ['zh', 'en', 'ja'] as const;

    for (const lang of languages) {
      console.log(`\n📝 正在生成 ${lang.toUpperCase()} 版本...`);

      const markdown = formatReleasesMarkdown(releases, lang);
      const outputPath = path.join(
        process.cwd(),
        'content',
        'docs',
        lang,
        'wiki',
        'changelog.mdx'
      );

      // 确保目录存在
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(outputPath, markdown, 'utf-8');
      console.log(`✓ 已生成: ${outputPath}`);
    }

    console.log('\n✅ Changelog 生成完成！\n');
  } catch (error) {
    console.error('\n❌ Changelog 生成失败:', error);
    // 不抛出错误，使用现有文件（如果存在）
    console.log('⚠ 将使用现有的 changelog 文件（如果存在）\n');
  }
}

// 执行生成
if (require.main === module) {
  generateChangelog();
}

export { generateChangelog };
