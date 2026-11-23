import { expect, test } from '@playwright/test';
import movedPages from '../../../src/lib/docs-redirects.json';
import {
  assetRedirects,
  docsRedirects,
} from '../../../src/lib/docs-redirects.mjs';

test('document redirects preserve repeated and encoded query parameters over HTTP', async ({
  request,
}) => {
  test.setTimeout(120_000);
  const search = '?utm_source=google&q=a%2Bb&tag=first&tag=second';
  for (const { source, destination } of docsRedirects()) {
    const response = await request.get(`${source}${search}`, {
      maxRedirects: 0,
    });
    expect(response.status(), source).toBe(308);
    const location = new URL(response.headers().location, response.url());
    expect(location.pathname, source).toBe(destination);
    expect(location.search, source).toBe(search);
  }
});

test('renamed screenshots preserve image responses and query parameters', async ({
  request,
}) => {
  const search = '?version=old&q=a%2Bb&tag=one&tag=two';
  for (const { source, destination } of assetRedirects()) {
    const response = await request.get(`${source}${search}`, {
      maxRedirects: 0,
    });
    expect(response.status(), source).toBe(308);
    const location = new URL(response.headers().location, response.url());
    expect(location.pathname, source).toBe(destination);
    expect(location.search, source).toBe(search);
    const image = await request.get(destination);
    expect(image.status(), destination).toBe(200);
    expect(image.headers()['content-type'], destination).toContain('image/png');
  }
  const unknown = await request.get('/assets/guide/feature-guide/unknown.png');
  expect(unknown.status()).toBe(404);
});

test('encoded API folders and trailing-slash links reach their final document', async ({
  request,
}) => {
  const source = encodeURI('/zh/docs/api/management/令牌管理/token-get/');
  const search = '?q=a%2Bb&tag=one&tag=two';
  const response = await request.get(`${source}${search}`);
  const final = new URL(response.url());
  expect(response.status()).toBe(200);
  expect(final.pathname).toBe(
    '/zh/docs/api/management/token-management/token-get'
  );
  expect(final.searchParams.getAll('tag')).toEqual(['one', 'two']);
  expect(final.searchParams.get('q')).toBe('a+b');

  const english = await request.get('/docs/installation/docker-installation', {
    maxRedirects: 0,
  });
  expect(english.status()).toBe(308);
  expect(new URL(english.headers().location, english.url()).pathname).toBe(
    '/en/docs/installation/deployment-methods/docker-installation'
  );
});

test('sitemap and language alternates exclude moved documents', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  const locations = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1]).pathname
    )
  );
  const alternates = new Set(
    [...sitemap.matchAll(/href="([^"]+)"/g)].map(
      (match) => new URL(match[1]).pathname
    )
  );
  for (const [source, destination] of Object.entries(movedPages)) {
    expect(locations.has(source), source).toBe(false);
    expect(alternates.has(source), source).toBe(false);
    expect(locations.has(destination), destination).toBe(true);
  }
  expect(sitemap).toContain(
    '/en/docs/guide/feature-guide/admin/custom-oauth</loc>'
  );
  expect(sitemap).toContain(
    '/ja/docs/guide/feature-guide/admin/custom-oauth</loc>'
  );
});

test('moved Chinese guides resolve to Chinese HTML and Markdown', async ({
  request,
}) => {
  const path = '/zh/docs/guide/feature-guide/admin/custom-oauth';
  const html = await request.get(path);
  expect(html.status()).toBe(200);
  expect(html.url()).toContain(
    '/zh/docs/guide/feature-guide/system-settings/settings-auth'
  );
  expect(await html.text()).toContain('身份验证配置');

  const markdown = await request.get(path.replace('/docs/', '/llms.mdx/'));
  expect(markdown.status()).toBe(200);
  expect(markdown.url()).toContain(
    '/zh/llms.mdx/guide/feature-guide/system-settings/settings-auth'
  );
  expect(await markdown.text()).toContain('身份验证配置');

  const unknown = await request.get(
    '/zh/docs/guide/feature-guide/unknown-document'
  );
  expect(unknown.status()).toBe(404);
});
