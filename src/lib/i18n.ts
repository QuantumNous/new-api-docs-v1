import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'zh', 'ja'],
  // 使用 'dir' parser，按语言文件夹组织内容
  parser: 'dir',
});
