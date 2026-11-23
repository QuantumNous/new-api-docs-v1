import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { NextFetchEvent } from 'next/dist/server/web/spec-extension/fetch-event';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import middleware, { config } from '../../middleware';
import {
  docsRedirects,
  resolveDocRedirect,
} from '../../src/lib/docs-redirects.mjs';
import movedPages from '../../src/lib/docs-redirects.json';
import movedAssets from '../../src/lib/docs-asset-redirects.json';
import legacyOperations from './fixtures/legacy-api-operations.json';
import { i18n } from '../../src/lib/i18n';

async function dispatch(url: string) {
  const request = new NextRequest(url);
  const event = new NextFetchEvent({
    request,
    page: '/middleware',
    context: undefined,
  });
  const response = await middleware(request, event);
  assert.ok(response);
  return response;
}

test('every migration ends at an existing translation without a redirect chain', () => {
  for (const [source, destination] of Object.entries(movedPages)) {
    const [, lang, , ...slug] = destination.split('/');
    const file = resolve('content/docs', lang, slug.join('/'));
    assert.ok(
      existsSync(`${file}.mdx`) || existsSync(`${file}/index.mdx`),
      destination
    );
    assert.ok(!(destination in movedPages), `${source} has a redirect chain`);
    if (/^\/(en|zh|ja)\//.test(source))
      assert.equal(source.split('/')[1], destination.split('/')[1], source);
    if (/^\/(en|zh|ja)\/docs\//.test(source)) {
      const [, sourceLang, , ...sourceSlug] = source.split('/');
      const oldFile = resolve('content/docs', sourceLang, sourceSlug.join('/'));
      assert.ok(
        !existsSync(`${oldFile}.mdx`) && !existsSync(`${oldFile}/index.mdx`),
        source
      );
    }
  }
});

test('historical API links retain their HTTP operation', () => {
  for (const [source, operations] of Object.entries(legacyOperations)) {
    const destination = movedPages[source as keyof typeof movedPages];
    assert.ok(destination, source);
    const [, lang, , ...slug] = destination.split('/');
    const contents = readFileSync(
      resolve('content/docs', lang, `${slug.join('/')}.mdx`),
      'utf8'
    );
    const match = contents.match(/operations=\{(\[.*?\])\}/);
    assert.ok(match, destination);
    const current = JSON.parse(match[1]) as Array<{
      method: string;
      path: string;
    }>;
    const key = (operation: { method: string; path: string }) =>
      `${operation.method.toLowerCase()} ${operation.path.replace(/\/$/, '')}`;
    assert.deepEqual(
      operations.map(key).sort(),
      current.map(key).sort(),
      source
    );
  }
});

test('removed Chinese guides are not advertised as English fallback pages', () => {
  assert.equal(i18n.fallbackLanguage, null);
});

test('migrated HTML and both Markdown forms use 308 and preserve queries', async () => {
  for (const host of ['docs.newapi.ai', 'docs.newapi.pro']) {
    for (const rule of docsRedirects()) {
      const search = '?utm_source=google&q=a%2Bb&tag=first&tag=second';
      const url = `https://${host}${rule.source}${search}`;
      assert.ok(unstable_doesMiddlewareMatch({ config, url }), rule.source);
      const response = await dispatch(url);
      assert.equal(response.status, 308, rule.source);
      const location = new URL(response.headers.get('location')!);
      assert.equal(location.origin, `https://${host}`);
      assert.equal(location.pathname, rule.destination);
      assert.equal(location.search, search);
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
    assert.equal(resolveDocRedirect(path), undefined, path);
  }
});

test('encoded paths, trailing slashes and unprefixed English aliases resolve exactly', () => {
  const path = '/zh/docs/api/management/令牌管理/token-get';
  const target = '/zh/docs/api/management/token-management/token-get';
  assert.equal(resolveDocRedirect(encodeURI(`${path}/`)), target);
  assert.equal(
    resolveDocRedirect('/docs/installation/docker-installation/'),
    '/en/docs/installation/deployment-methods/docker-installation'
  );
  assert.equal(
    resolveDocRedirect('/zh/docs/api/management/%E0%A4/token-get'),
    undefined
  );
  assert.equal(
    resolveDocRedirect('/zh/docs/api/management%2F令牌管理/token-get'),
    undefined
  );
  assert.equal(
    resolveDocRedirect('/zh/docs/api/management/%25E4%25BB%25A4/token-get'),
    undefined
  );
  assert.equal(
    resolveDocRedirect('/en/docs/installation/docker-installation-extra'),
    undefined
  );
});

test('renamed screenshots return permanent image redirects with query parameters', async () => {
  for (const [source, destination] of Object.entries(movedAssets)) {
    assert.ok(!existsSync(resolve('public', `.${source}`)), source);
    assert.ok(existsSync(resolve('public', `.${destination}`)), destination);
    assert.ok(!(destination in movedAssets), source);
    const url = `https://docs.newapi.ai${source}?v=old&tag=one&tag=two`;
    assert.ok(unstable_doesMiddlewareMatch({ config, url }), source);
    const response = await dispatch(url);
    assert.equal(response.status, 308, source);
    assert.equal(
      response.headers.get('location'),
      `https://docs.newapi.ai${destination}?v=old&tag=one&tag=two`
    );
  }
  const unknown = await dispatch(
    'https://docs.newapi.ai/assets/guide/feature-guide/unknown.png'
  );
  assert.equal(unknown.headers.get('location'), null);
});
