import type {
  PluginCatalog,
  PluginDetail,
  PluginChangelog,
} from '../../src/lib/plugins/schema';

export const detail: PluginDetail = {
  key: 'demo',
  name: 'Demo Video',
  kind: 'task',
  latest: '2.0.0',
  sortPriority: 0,
  website: 'https://example.com',
  iconUrl: null,
  icon: null,
  description: { en: 'Video generation', zh: '示例视频生成' },
  models: ['demo-video'],
  channelTypes: [61],
  sourceUrl: 'https://github.com/QuantumNous/new-api-plugins',
  installUrl: '/api/v1/plugins/demo/plugin.js',
  versions: ['2.0.0', '1.0.0'],
  usageSchema: [
    {
      key: 'seconds',
      kind: 'number',
      unit: 'second',
      description: { en: 'Duration', zh: '时长' },
    },
  ],
  usageExamples: [{ label: 'Short video', facts: { seconds: 5 } }],
  usageProfiles: [],
  routes: [],
  protocols: [
    {
      name: 'openai_video',
      models: [],
      supports: [],
      operations: [
        {
          operation: 'create',
          method: 'POST',
          path: '/v1/videos',
          modes: false,
        },
      ],
    },
  ],
};
export const catalog: PluginCatalog = {
  source: {
    owner: 'QuantumNous',
    repo: 'new-api-plugins',
    url: 'https://github.com/QuantumNous/new-api-plugins',
    indexUrl: 'https://www.newapi.ai/api/v1/plugins/index.json',
  },
  fetchedAt: '2026-09-11T12:00:00Z',
  plugins: [
    detail,
    {
      ...detail,
      key: 'second',
      name: 'Second Plugin',
      models: ['second-model'],
      description: { en: 'Another provider' },
    },
  ],
};
export const changelog: PluginChangelog = {
  changelogVersion: 1,
  plugin: 'demo',
  version: '2.0.0',
  locale: 'zh-CN',
  sourceUrl: 'https://github.com/QuantumNous/new-api-plugins',
  sections: [{ category: 'Added', entries: [[{ text: '第二版的新能力' }]] }],
};
