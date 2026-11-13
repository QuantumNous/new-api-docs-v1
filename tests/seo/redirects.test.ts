import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import { docsRedirects } from '../../src/lib/docs-redirects.mjs';
import movedPages from '../../src/lib/docs-redirects.json';
import { i18n } from '../../src/lib/i18n';

const nextConfig = { redirects: docsRedirects };

test('every migration ends at an existing translation without a redirect chain', () => {
  for (const [source, destination] of Object.entries(movedPages)) {
    const [, lang, , ...slug] = destination.split('/');
    const file = resolve('content/docs', lang, slug.join('/'));
    assert.ok(
      existsSync(`${file}.mdx`) || existsSync(`${file}/index.mdx`),
      destination
    );
    assert.ok(!(destination in movedPages), `${source} has a redirect chain`);
  }
});

test('removed Chinese guides are not advertised as English fallback pages', () => {
  assert.equal(i18n.fallbackLanguage, null);
});

test('migrated HTML and both Markdown forms use 308 and preserve queries', async () => {
  for (const host of ['docs.newapi.ai', 'docs.newapi.pro']) {
    for (const rule of docsRedirects()) {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://${host}${rule.source}?utm_source=google&q=a%2Bb`,
        nextConfig,
      });
      assert.equal(response.status, 308, rule.source);
      const location = new URL(response.headers.get('location')!);
      assert.equal(location.origin, `https://${host}`);
      assert.equal(location.pathname, rule.destination);
      assert.equal(location.searchParams.get('utm_source'), 'google');
      assert.equal(location.searchParams.get('q'), 'a+b');
    }
  }
});

test('existing translations, unknown URLs and removed sponsorship pages are not redirected', async () => {
  for (const path of [
    '/en/docs/guide/feature-guide/admin/custom-oauth',
    '/ja/docs/guide/feature-guide/admin/system-setting',
    '/zh/docs/guide/feature-guide/admin/custom-oauth/child',
    '/zh/docs/guide/feature-guide/admin/custom-oauth-extra',
    '/zh/docs/guide/feature-guide/user/unknown',
    '/zh/docs/support/buy-us-a-coffee',
    '/en/docs/guide/wiki/special-thanks',
  ]) {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://docs.newapi.ai${path}`,
      nextConfig,
    });
    assert.equal(response.headers.get('location'), null, path);
  }
});
