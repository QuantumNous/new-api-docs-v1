import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'zh', 'ja'],
  // 使用 'dir' parser，按语言文件夹组织内容
  parser: 'dir',
});

/**
 * 根据语言生成正确的 URL 路径
 * 对于静态导出，所有语言都需要显示前缀
 */
export function getLocalePath(lang: string, path: string = ''): string {
  // 移除开头的斜杠（如果有）
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // 所有语言都添加语言前缀
  return cleanPath ? `/${lang}/${cleanPath}` : `/${lang}`;
}
