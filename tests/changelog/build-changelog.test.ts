import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  formatReleasesMarkdown,
  sanitizeReleaseMarkdown,
  type Release,
} from '../../scripts/build-changelog';

const dynamicImport = new Function(
  'specifier',
  'return import(specifier);'
) as <T>(specifier: string) => Promise<T>;

async function renderMdxDocument(mdxSource: string): Promise<string> {
  const [{ compile, run }, { default: remarkGfm }] = await Promise.all([
    dynamicImport<typeof import('@mdx-js/mdx')>('@mdx-js/mdx'),
    dynamicImport<{ default: typeof import('remark-gfm').default }>(
      'remark-gfm'
    ),
  ]);

  const bodyOnly = mdxSource
    .replace(/^---\n[\s\S]*?\n---\n+/, '')
    .replace(/^import\s+\{\s*Callout\s*\}\s+from\s+['"][^'"]+['"];?\n+/m, '');

  const compiled = await compile(bodyOnly, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkGfm],
  });

  const { default: MDXContent } = await run(String(compiled), {
    ...(jsxRuntime as any),
    baseUrl: pathToFileURL(__filename).href,
  });

  const Callout = ({
    title,
    children,
  }: {
    title?: string;
    children?: unknown;
  }) =>
    jsxRuntime.jsxs('div', {
      'data-callout': title ?? '',
      children: [
        title ? jsxRuntime.jsx('strong', { children: title }) : null,
        children,
      ],
    });

  return renderToStaticMarkup(
    jsxRuntime.jsx(MDXContent, {
      components: { Callout },
    })
  );
}

test('escapes unquoted JSX-like braces and placeholders in release notes while preserving code and links', async () => {
  const rawBody = [
    '# Highlights',
    '<!-- Release notes generated using configuration in .github/release.yml -->',
    '* fix(plugins): load plugins that declare their own /{key} address by @Calcium-Ion in https://github.com/QuantumNous/new-api/pull/8119',
    '* fix(router): handle <model> and <user_id> placeholders when latency < 10ms',
    '* docs: see <https://example.com/docs/{id}> and [route /{key}](https://example.com/api/{key}) and https://example.com/raw/{slug}.',
    '> Preserve old mapping with `{"some-model-thinking":"some-model@thinking:on"}` and `` `/{key}` ``.',
    '<img width="100%" alt="Dashboard {preview}" src="https://github.com/user-attachments/assets/8d403155-27ac-407d-b0ae-8815034c66a7">',
    '<br>',
    'export OPENAI_API_KEY=sk-demo',
    '```json',
    '{',
    '  "#not-a-heading": "<kept-verbatim>",',
    '  "route": "/{key}"',
    '}',
    '```',
  ].join('\n');

  const sanitized = sanitizeReleaseMarkdown(rawBody);
  assert.match(sanitized, /^### Highlights$/m);
  assert.doesNotMatch(sanitized, /<!--/);
  assert.match(sanitized, /\/\\\{key\\\} address/);
  assert.match(sanitized, /"route": "\/{key}"/);

  const releases: Release[] = [
    {
      tag_name: 'v1.0.0-rc.48',
      name: 'v1.0.0-rc.48 {beta} <preview>',
      published_at: '2026-11-04T15:40:15Z',
      prerelease: true,
      body: rawBody,
      assets: [
        {
          name: 'new-api-{linux}-<amd64>.tar.gz',
          browser_download_url:
            'https://github.com/QuantumNous/new-api/releases/download/v1.0.0-rc.48/new-api.tar.gz',
          size: 2048,
        },
      ],
    },
  ];

  for (const lang of ['zh', 'en', 'ja'] as const) {
    const mdx = formatReleasesMarkdown(releases, lang);
    const html = await renderMdxDocument(mdx);
    assert.ok(
      html.includes('load plugins that declare their own /{key} address')
    );
    assert.ok(
      html.includes('handle &lt;model&gt; and &lt;user_id&gt; placeholders')
    );
    assert.ok(html.includes('&quot;route&quot;: &quot;/{key}&quot;'));
    assert.ok(
      html.includes(
        'https://github.com/user-attachments/assets/8d403155-27ac-407d-b0ae-8815034c66a7'
      )
    );
  }
});

test('closes dangling fenced code blocks so surrounding Callout stays valid MDX', async () => {
  const releases: Release[] = [
    {
      tag_name: 'v1.0.0-rc.49',
      name: 'v1.0.0-rc.49',
      published_at: '2026-11-08T05:06:38Z',
      prerelease: true,
      body: '### Example\n```bash\ncurl https://example.com/{key}',
      assets: [],
    },
  ];

  const mdx = formatReleasesMarkdown(releases, 'zh');
  const html = await renderMdxDocument(mdx);
  assert.ok(html.includes('curl https://example.com/{key}'));
});
