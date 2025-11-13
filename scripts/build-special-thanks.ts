/**
 * Special Thanks 构建脚本
 * 在构建时从 GitHub Contributors API 和爱发电 API 获取数据并生成特别鸣谢页面
 */

import * as fs from 'fs';
import * as path from 'path';

// 配置
const SOURCE_REPO = process.env.SOURCE_REPO || 'QuantumNous/new-api';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const AFDIAN_USER_ID = process.env.AFDIAN_USER_ID || '';
const AFDIAN_TOKEN = process.env.AFDIAN_TOKEN || '';
const MAX_CONTRIBUTORS = 50;

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface Sponsor {
  name: string;
  avatar: string;
  amount: number;
}

interface SponsorsData {
  gold: Sponsor[];
  silver: Sponsor[];
  bronze: Sponsor[];
}

// CSS 样式常量
const CONTRIBUTOR_CSS = `
<style>
.contributor-simple {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.avatar-container {
    position: relative;
    margin-right: 15px;
}

.contributor-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
}

.medal-rank {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.rank-1 { background-color: #ffd700; }
.rank-2 { background-color: #c0c0c0; }
.rank-3 { background-color: #cd7f32; }

.gold-medal .contributor-avatar {
    border: 4px solid #ffd700;
    box-shadow: 0 0 10px #ffd700;
}

.silver-medal .contributor-avatar {
    border: 4px solid #c0c0c0;
    box-shadow: 0 0 10px #c0c0c0;
}

.bronze-medal .contributor-avatar {
    border: 4px solid #cd7f32;
    box-shadow: 0 0 10px #cd7f32;
}

.contributor-details {
    display: flex;
    flex-direction: column;
}

.contributor-details a {
    font-weight: 500;
    text-decoration: none;
}

.contributor-stats {
    font-size: 0.9rem;
    color: #666;
}

[data-md-color-scheme="slate"] .contributor-stats {
    color: #aaa;
}
</style>
`;

const SPONSOR_CSS = `
<style>
.sponsor-card {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    border-radius: 10px;
    background-color: rgba(0,0,0,0.03);
}

[data-md-color-scheme="slate"] .sponsor-card {
    background-color: rgba(255,255,255,0.05);
}

.sponsor-avatar-container {
    position: relative;
    margin-right: 20px;
}

.sponsor-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
}

.sponsor-medal {
    position: absolute;
    bottom: -5px;
    right: -5px;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
    color: white;
}

.gold-badge { background-color: #ffd700; color: #333; }
.silver-badge { background-color: #c0c0c0; color: #333; }
.bronze-badge { background-color: #cd7f32; color: white; }

.gold-sponsor .sponsor-avatar {
    border: 4px solid #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.silver-sponsor .sponsor-avatar {
    border: 4px solid #c0c0c0;
    box-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
}

.sponsor-details {
    display: flex;
    flex-direction: column;
}

.sponsor-name {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 5px;
}

.sponsor-amount {
    font-size: 0.9rem;
    color: #666;
}

[data-md-color-scheme="slate"] .sponsor-amount {
    color: #aaa;
}

.bronze-sponsors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
}

.bronze-sponsor-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 10px;
    border-radius: 8px;
    background-color: rgba(0,0,0,0.02);
}

[data-md-color-scheme="slate"] .bronze-sponsor-item {
    background-color: rgba(255,255,255,0.03);
}

.sponsor-avatar-small {
    width: 50px !important;
    height: 50px !important;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #cd7f32;
    margin-bottom: 8px;
}

.bronze-sponsor-name {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 4px;
    word-break: break-word;
}

.bronze-sponsor-amount {
    font-size: 0.8rem;
    color: #666;
}

[data-md-color-scheme="slate"] .bronze-sponsor-amount {
    color: #aaa;
}
</style>
`;

// i18n 配置
const SPECIAL_THANKS_I18N = {
  zh: {
    title: '# 🙏 特别鸣谢',
    intro:
      'New API 的开发离不开社区的支持和贡献。在此特别感谢所有为项目提供帮助的个人和组织。',
    sponsorsTitle: '## ❤️ 赞助商',
    sponsorsIntro:
      '以下是所有为项目提供资金支持的赞助商。感谢他们的慷慨捐助，让项目能够持续发展！',
    sponsorsInfoTitle: '赞助商信息 · 数据更新于',
    sponsorsInfoDesc:
      '以下赞助商数据从爱发电平台自动获取。根据累计赞助金额，分为金牌、银牌和铜牌三个等级。如果您也想为项目提供资金支持，欢迎前往 [爱发电](https://afdian.com/a/new-api) 平台进行捐赠。',
    contributorsTitle: '## 👨‍💻 开发贡献者',
    contributorsIntro:
      '以下是所有为项目做出贡献的开发者列表。在此感谢他们的辛勤工作和创意！',
    contributorsInfoTitle: '贡献者信息 · 数据更新于',
    contributorsInfoDesc: `以下贡献者数据从 [GitHub Contributors 页面](https://github.com/${SOURCE_REPO}/graphs/contributors) 自动获取前50名。贡献度前三名分别以金、银、铜牌边框标识。如果您也想为项目做出贡献，欢迎提交 Pull Request。`,
    contributions: '贡献次数',
    totalSponsored: '累计赞助',
    unknownUser: '未知用户',
    anonymousSponsor: '匿名赞助者',
    goldSponsor: '金牌赞助商',
    silverSponsor: '银牌赞助商',
    bronzeSponsor: '铜牌赞助商',
    goldSponsorDesc: '感谢以下金牌赞助商（赞助金额 ≥ 10001元）的慷慨支持！',
    silverSponsorDesc:
      '感谢以下银牌赞助商（赞助金额 1001-10000元）的慷慨支持！',
    bronzeSponsorDesc: '感谢以下铜牌赞助商（赞助金额 0-1000元）的支持！',
  },
  en: {
    title: '# 🙏 Special Thanks',
    intro:
      'The development of New API would not be possible without the support and contributions of the community. We would like to express our special gratitude to all individuals and organizations who have helped with this project.',
    sponsorsTitle: '## ❤️ Sponsors',
    sponsorsIntro:
      'Below are all the sponsors who have provided financial support for the project. Thank you for their generous donations that allow the project to continue developing!',
    sponsorsInfoTitle: 'Sponsor Information · Data updated at',
    sponsorsInfoDesc:
      'The following sponsor data is automatically retrieved from the Afdian platform. Based on the cumulative sponsorship amount, they are divided into three levels: Gold, Silver, and Bronze. If you would also like to provide financial support for the project, you are welcome to make a donation on the [Afdian](https://afdian.com/a/new-api) platform.',
    contributorsTitle: '## 👨‍💻 Developer Contributors',
    contributorsIntro:
      'Below is a list of all developers who have contributed to the project. We thank them for their hard work and creativity!',
    contributorsInfoTitle: 'Contributor Information · Data updated at',
    contributorsInfoDesc: `The following contributor data is automatically retrieved from the [GitHub Contributors page](https://github.com/${SOURCE_REPO}/graphs/contributors) for the top 50 contributors. The top three contributors are marked with gold, silver, and bronze borders respectively. If you would also like to contribute to the project, you are welcome to submit a Pull Request.`,
    contributions: 'Contributions',
    totalSponsored: 'Total Sponsored',
    unknownUser: 'Unknown User',
    anonymousSponsor: 'Anonymous Sponsor',
    goldSponsor: 'Gold Sponsors',
    silverSponsor: 'Silver Sponsors',
    bronzeSponsor: 'Bronze Sponsors',
    goldSponsorDesc:
      'Thank you to the following gold sponsors (sponsorship amount ≥ ¥10,001) for their generous support!',
    silverSponsorDesc:
      'Thank you to the following silver sponsors (sponsorship amount ¥1,001-¥10,000) for their generous support!',
    bronzeSponsorDesc:
      'Thank you to the following bronze sponsors (sponsorship amount ¥0-¥1,000) for their support!',
  },
  ja: {
    title: '# 🙏 スペシャルサンクス',
    intro:
      'New API の開発は、コミュニティのサポートと貢献なしには実現できませんでした。プロジェクトに協力してくださったすべての個人と組織に特別な感謝を申し上げます。',
    sponsorsTitle: '## ❤️ スポンサー',
    sponsorsIntro:
      '以下は、プロジェクトに財政的支援を提供してくださったすべてのスポンサーです。プロジェクトが継続的に発展できるよう、寛大な寄付をしてくださったことに感謝します！',
    sponsorsInfoTitle: 'スポンサー情報 · データ更新日時',
    sponsorsInfoDesc:
      '以下のスポンサーデータは、Afdian プラットフォームから自動的に取得されます。累計スポンサー金額に基づいて、ゴールド、シルバー、ブロンズの3つのレベルに分類されます。プロジェクトに財政的支援を提供したい場合は、[Afdian](https://afdian.com/a/new-api) プラットフォームで寄付を歓迎します。',
    contributorsTitle: '## 👨‍💻 開発貢献者',
    contributorsIntro:
      '以下は、プロジェクトに貢献してくださったすべての開発者のリストです。彼らの勤勉な作業と創造性に感謝します！',
    contributorsInfoTitle: '貢献者情報 · データ更新日時',
    contributorsInfoDesc: `以下の貢献者データは、[GitHub Contributors ページ](https://github.com/${SOURCE_REPO}/graphs/contributors)から上位50名を自動的に取得します。貢献度上位3名は、それぞれゴールド、シルバー、ブロンズの枠で識別されます。プロジェクトに貢献したい場合は、プルリクエストを送信してください。`,
    contributions: '貢献回数',
    totalSponsored: '累計スポンサー',
    unknownUser: '不明なユーザー',
    anonymousSponsor: '匿名スポンサー',
    goldSponsor: 'ゴールドスポンサー',
    silverSponsor: 'シルバースポンサー',
    bronzeSponsor: 'ブロンズスポンサー',
    goldSponsorDesc:
      '以下のゴールドスポンサー（スポンサー金額 ≥ ¥10,001）の寛大なサポートに感謝します！',
    silverSponsorDesc:
      '以下のシルバースポンサー（スポンサー金額 ¥1,001-¥10,000）の寛大なサポートに感謝します！',
    bronzeSponsorDesc:
      '以下のブロンズスポンサー（スポンサー金額 ¥0-¥1,000）のサポートに感謝します！',
  },
};

async function fetchGitHubContributors(): Promise<Contributor[]> {
  const headers: Record<string, string> = {
    'User-Agent': 'New-API-Docs-Builder/1.0',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    console.log('✓ 使用 GitHub Token 进行认证');
  } else {
    console.warn('⚠ 未配置 GitHub Token，API 限制为 60次/小时');
  }

  const url = `https://api.github.com/repos/${SOURCE_REPO}/contributors?per_page=${MAX_CONTRIBUTORS}`;

  try {
    console.log(`正在获取 Contributors: ${url}`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API 请求失败: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as Contributor[];
    console.log(`✓ 成功获取 ${data.length} 个贡献者`);
    return data;
  } catch (error) {
    console.error('✗ 获取 GitHub Contributors 失败:', error);
    return [];
  }
}

async function fetchAfdianSponsors(): Promise<SponsorsData | null> {
  if (!AFDIAN_USER_ID || !AFDIAN_TOKEN) {
    console.warn('⚠ 未配置爱发电 API 凭据，跳过赞助商数据获取');
    return null;
  }

  // 这里需要根据爱发电的实际 API 实现
  // 目前返回空数据
  console.log('⚠ 爱发电 API 集成待实现');
  return {
    gold: [],
    silver: [],
    bronze: [],
  };
}

function getMedalInfo(index: number): [string, string] {
  const medals: Record<number, [string, string]> = {
    0: ['gold-medal', '<span class="medal-rank rank-1">1</span>'],
    1: ['silver-medal', '<span class="medal-rank rank-2">2</span>'],
    2: ['bronze-medal', '<span class="medal-rank rank-3">3</span>'],
  };
  return medals[index] || ['', ''];
}

function formatContributorsMarkdown(
  contributors: Contributor[],
  lang: keyof typeof SPECIAL_THANKS_I18N
): string {
  if (!contributors?.length) {
    return '';
  }

  const i18n = SPECIAL_THANKS_I18N[lang];
  let markdown = '';

  for (let index = 0; index < contributors.length; index++) {
    const { login, avatar_url, html_url, contributions } = contributors[index];
    const username = login || i18n.unknownUser;
    const [medalClass, medalLabel] = getMedalInfo(index);

    markdown += `### ${username}\n\n`;
    markdown += `<div class="contributor-simple ${medalClass}">\n`;
    markdown += `  <div class="avatar-container">\n`;
    markdown += `    <img src="${avatar_url}" alt="${username}" class="contributor-avatar" />\n`;
    if (medalLabel) {
      markdown += `    ${medalLabel}\n`;
    }
    markdown += `  </div>\n`;
    markdown += `  <div class="contributor-details">\n`;
    markdown += `    <a href="${html_url}" target="_blank">${username}</a>\n`;
    markdown += `    <span class="contributor-stats">${i18n.contributions}: ${contributions}</span>\n`;
    markdown += `  </div>\n`;
    markdown += `</div>\n\n`;
    markdown += '---\n\n';
  }

  markdown += CONTRIBUTOR_CSS;
  return markdown;
}

function formatSponsorsMarkdown(
  sponsors: SponsorsData,
  lang: keyof typeof SPECIAL_THANKS_I18N
): string {
  if (
    !sponsors ||
    (!sponsors.gold.length &&
      !sponsors.silver.length &&
      !sponsors.bronze.length)
  ) {
    return '';
  }

  const i18n = SPECIAL_THANKS_I18N[lang];
  let markdown = '';

  const levels: Array<{
    key: keyof SponsorsData;
    emoji: string;
    title: string;
    desc: string;
    useGrid: boolean;
  }> = [
    {
      key: 'gold',
      emoji: '🥇',
      title: i18n.goldSponsor,
      desc: i18n.goldSponsorDesc,
      useGrid: false,
    },
    {
      key: 'silver',
      emoji: '🥈',
      title: i18n.silverSponsor,
      desc: i18n.silverSponsorDesc,
      useGrid: false,
    },
    {
      key: 'bronze',
      emoji: '🥉',
      title: i18n.bronzeSponsor,
      desc: i18n.bronzeSponsorDesc,
      useGrid: true,
    },
  ];

  for (const level of levels) {
    const sponsorList = sponsors[level.key];
    if (!sponsorList?.length) continue;

    markdown += `### ${level.emoji} ${level.title}\n\n`;
    markdown += `${level.desc}\n\n`;

    if (level.useGrid) {
      // 铜牌赞助商使用网格布局
      markdown += '<div class="bronze-sponsors-grid">\n';
      for (const sponsor of sponsorList) {
        const { name, avatar, amount } = sponsor;
        markdown += `  <div class="bronze-sponsor-item">\n`;
        markdown += `    <img src="${avatar}" alt="${name}" class="sponsor-avatar-small" />\n`;
        markdown += `    <span class="bronze-sponsor-name">${name}</span>\n`;
        markdown += `    <span class="bronze-sponsor-amount">¥${amount.toFixed(2)}</span>\n`;
        markdown += `  </div>\n`;
      }
      markdown += '</div>\n\n';
    } else {
      // 金牌和银牌赞助商使用卡片布局
      for (const sponsor of sponsorList) {
        const { name, avatar, amount } = sponsor;
        markdown += `<div class="sponsor-card ${level.key}-sponsor">\n`;
        markdown += `  <div class="sponsor-avatar-container">\n`;
        markdown += `    <img src="${avatar}" alt="${name}" class="sponsor-avatar" />\n`;
        markdown += `    <span class="sponsor-medal ${level.key}-badge">${level.key.charAt(0).toUpperCase() + level.key.slice(1)}</span>\n`;
        markdown += `  </div>\n`;
        markdown += `  <div class="sponsor-details">\n`;
        markdown += `    <span class="sponsor-name">${name}</span>\n`;
        markdown += `    <span class="sponsor-amount">${i18n.totalSponsored}: ¥${amount.toFixed(2)}</span>\n`;
        markdown += `  </div>\n`;
        markdown += `</div>\n\n`;
      }
    }

    markdown += '---\n\n';
  }

  markdown += SPONSOR_CSS;
  return markdown;
}

function generateSpecialThanksContent(
  contributors: Contributor[],
  sponsors: SponsorsData | null,
  lang: keyof typeof SPECIAL_THANKS_I18N
): string {
  const currentTime = new Date()
    .toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    })
    .replace(/\//g, '-');

  const i18n = SPECIAL_THANKS_I18N[lang];
  const parts: string[] = [];

  // 添加 frontmatter
  const titleMap = {
    zh: '特别鸣谢',
    en: 'Special Thanks',
    ja: 'スペシャルサンクス',
  };
  parts.push(`---\ntitle: ${titleMap[lang]}\n---\n\n`);

  parts.push(`${i18n.title}\n\n${i18n.intro}\n\n`);

  // 赞助商部分
  if (
    sponsors &&
    (sponsors.gold.length || sponsors.silver.length || sponsors.bronze.length)
  ) {
    parts.push(`${i18n.sponsorsTitle}\n\n`);
    parts.push(`${i18n.sponsorsIntro}\n\n`);
    parts.push(
      `:::info{title="${i18n.sponsorsInfoTitle} ${currentTime} (UTC+8)"}\n`
    );
    parts.push(`${i18n.sponsorsInfoDesc}\n`);
    parts.push(`:::\n\n`);
    parts.push(formatSponsorsMarkdown(sponsors, lang));
  }

  // 贡献者部分
  if (contributors.length) {
    parts.push(`${i18n.contributorsTitle}\n\n`);
    parts.push(`${i18n.contributorsIntro}\n\n`);
    parts.push(
      `:::info{title="${i18n.contributorsInfoTitle} ${currentTime} (UTC+8)"}\n`
    );
    parts.push(`${i18n.contributorsInfoDesc}\n`);
    parts.push(`:::\n\n`);
    parts.push(formatContributorsMarkdown(contributors, lang));
  }

  return parts.join('');
}

async function generateSpecialThanks() {
  console.log('\n🚀 开始生成 Special Thanks...\n');

  try {
    // 获取数据
    const [contributors, sponsors] = await Promise.all([
      fetchGitHubContributors(),
      fetchAfdianSponsors(),
    ]);

    if (!contributors.length && !sponsors) {
      console.warn('⚠ 没有获取到任何数据');
      return;
    }

    // 为每种语言生成文件
    const languages = ['zh', 'en', 'ja'] as const;

    for (const lang of languages) {
      console.log(`\n📝 正在生成 ${lang.toUpperCase()} 版本...`);

      const markdown = generateSpecialThanksContent(
        contributors,
        sponsors,
        lang
      );
      const outputPath = path.join(
        process.cwd(),
        'content',
        'docs',
        lang,
        'wiki',
        'special-thanks.mdx'
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

    console.log('\n✅ Special Thanks 生成完成！\n');
  } catch (error) {
    console.error('\n❌ Special Thanks 生成失败:', error);
    // 不抛出错误，使用现有文件（如果存在）
    console.log('⚠ 将使用现有的 special-thanks 文件（如果存在）\n');
  }
}

// 执行生成
if (require.main === module) {
  generateSpecialThanks();
}

export { generateSpecialThanks };
