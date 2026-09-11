import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  officialPluginInstallUrl,
  pluginSiteFromHostname,
  safeExternalUrl,
} from '../../src/lib/plugins/public-site';
import {
  localizedPluginText,
  matchesPluginQuery,
  pluginIconSources,
  pluginUsageGroups,
} from '../../src/lib/plugins/display';
import { detail } from './fixtures';

test('official domains follow the hostname, including ports and normalized hosts', () => {
  for (const hostname of [
    'docs.newapi.pro',
    'newapi.pro',
    'www.newapi.pro:443',
    'DOCS.NEWAPI.PRO.',
    'preview.newapi.pro',
  ])
    assert.equal(pluginSiteFromHostname(hostname), 'pro');
  for (const hostname of [
    'docs.newapi.ai',
    'newapi.ai',
    'localhost:3000',
    '127.0.0.1',
    '',
    'preview.vercel.app',
    'another.pro',
    'newapi.pro.example.com',
  ])
    assert.equal(pluginSiteFromHostname(hostname), 'ai');
});

test('installation always uses the selected official host, never docs or a supplied download URL', () => {
  assert.equal(
    officialPluginInstallUrl('pro', 'sora'),
    'https://www.newapi.pro/api/v1/plugins/sora/plugin.js'
  );
  assert.equal(
    officialPluginInstallUrl('ai', 'sora'),
    'https://www.newapi.ai/api/v1/plugins/sora/plugin.js'
  );
  assert.throws(() => officialPluginInstallUrl('ai', '../other'));
  assert.throws(() => officialPluginInstallUrl('ai', 'bad?host=evil'));
});

test('icon fallback stays on the selected official site and ignores invalid paths', () => {
  assert.deepEqual(
    pluginIconSources(
      { iconUrl: '/api/v1/plugins/sora/1.0.0/icon.svg', icon: 'Sora.Color' },
      'pro'
    ),
    [
      'https://www.newapi.pro/api/v1/plugins/sora/1.0.0/icon.svg',
      'https://www.newapi.pro/lobe-icons/sora-color.svg?v=1',
    ]
  );
  for (const iconUrl of [
    'https://example.com/icon.svg',
    '//example.com/icon.svg',
    '/api/v1/plugins/sora/../icon.svg',
  ])
    assert.deepEqual(
      pluginIconSources({ iconUrl, icon: 'text:Demo' }, 'ai'),
      []
    );
});

test('only web links are rendered for external metadata', () => {
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,test',
    '/relative',
    'https://user:secret@example.com',
  ])
    assert.equal(safeExternalUrl(value), undefined);
  assert.equal(
    safeExternalUrl('https://example.com/docs'),
    'https://example.com/docs'
  );
});

test('search covers key, models and both language descriptions', () => {
  for (const query of [' DEMO ', 'demo-video', '示例', 'generation', ''])
    assert.equal(matchesPluginQuery(detail, query), true);
  assert.equal(matchesPluginQuery(detail, 'not-present'), false);
  assert.equal(localizedPluginText({ en: 'Fallback' }), 'Fallback');
  assert.equal(localizedPluginText({ en: 'Fallback', zh: '中文' }), '中文');
  assert.equal(localizedPluginText(null), null);
});

test('model usage profiles replace defaults, which apply only to ungrouped models', () => {
  const profile = { models: ['demo-video'], schema: [], examples: [] };
  assert.deepEqual(pluginUsageGroups({ ...detail, usageProfiles: [profile] }), [
    profile,
  ]);
  const groups = pluginUsageGroups({
    ...detail,
    models: ['demo-video', 'extra'],
    usageProfiles: [profile],
  });
  assert.deepEqual(groups[0], profile);
  assert.deepEqual(groups[1], {
    models: ['extra'],
    schema: detail.usageSchema,
    examples: detail.usageExamples,
  });
});
