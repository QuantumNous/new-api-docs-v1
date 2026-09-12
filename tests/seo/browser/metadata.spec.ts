import { expect, test } from '@playwright/test';

const origin = process.env.SITE_URL || 'https://docs.newapi.ai';
const locales = [
  { lang: 'zh', htmlLang: 'zh-CN', title: 'New API 文档', ogLocale: 'zh_CN' },
  {
    lang: 'en',
    htmlLang: 'en',
    title: 'New API Documentation',
    ogLocale: 'en_US',
  },
  {
    lang: 'ja',
    htmlLang: 'ja',
    title: 'New API ドキュメント',
    ogLocale: 'ja_JP',
  },
];

for (const { lang, htmlLang, title, ogLocale } of locales) {
  test(`${lang}: homepage metadata and crawlable navigation without JavaScript`, async ({
    page,
    request,
  }) => {
    await page.goto(`/${lang}`);
    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}/${lang}`
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${origin}/${lang}`
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      ogLocale
    );
    await expect(page.locator('link[hreflang]')).toHaveCount(4);
    for (const domain of ['ai', 'pro']) {
      for (const section of ['main', 'footer']) {
        const link = page
          .locator(`${section} a[href="https://www.newapi.${domain}/"]`)
          .first();
        await expect(link).toBeVisible();
        await expect(link).not.toHaveAttribute('rel', /nofollow|sponsored|ugc/);
        await expect(link).toContainText('New API');
      }
    }
    const data = JSON.parse(
      await page.locator('script[type="application/ld+json"]').innerText()
    );
    expect(
      data['@graph'].find(
        (node: { '@type': string }) => node['@type'] === 'CollectionPage'
      ).url
    ).toBe(`${origin}/${lang}`);

    // Every internal destination offered by the homepage must resolve directly.
    const links = await page
      .locator('main a[href^="/"]')
      .evaluateAll((items) => [
        ...new Set(items.map((item) => item.getAttribute('href')!)),
      ]);
    for (const href of links) {
      const response = await request.get(href, { maxRedirects: 0 });
      expect(response.status(), href).toBe(200);
    }
    if (lang !== 'zh')
      await expect(page.locator('main a[href*="/plugins"]')).toHaveCount(0);
  });
}

test('translated docs use matching canonicals, alternates and sharing images', async ({
  page,
}) => {
  const path =
    'docs/installation/deployment-methods/docker-compose-installation';
  for (const { lang, htmlLang } of locales) {
    await page.goto(`/${lang}/${path}`);
    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}/${lang}/${path}`
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${origin}/${lang}/${path}`
    );
    for (const alternate of locales) {
      await expect(
        page.locator(`link[hreflang="${alternate.lang}"]`)
      ).toHaveAttribute('href', `${origin}/${alternate.lang}/${path}`);
    }
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `${origin}/og/docs/${lang}/installation/deployment-methods/docker-compose-installation/image.png`
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      `${origin}/og/docs/${lang}/installation/deployment-methods/docker-compose-installation/image.png`
    );
  }
});

test('Chinese-only plugin pages do not advertise missing translations', async ({
  page,
  request,
}) => {
  for (const path of ['/zh/plugins', '/zh/docs/plugins/installation']) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}${path}`
    );
    await expect(page.locator('link[hreflang]')).toHaveCount(2);
    for (const lang of ['zh', 'x-default']) {
      await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveAttribute(
        'href',
        `${origin}${path}`
      );
    }
  }
  const fallback = await request.get('/en/docs/plugins/installation', {
    maxRedirects: 0,
  });
  expect(fallback.status()).toBe(307);
  expect(fallback.headers().location).toBe('/en/docs');
});

test('sitemap and robots use the same canonical origin and existing locales', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).not.toMatch(/localhost|127\.0\.0\.1|www\.newapi|vercel\.app/);
  expect(xml).toContain(`<loc>${origin}/zh/docs/plugins/installation</loc>`);
  expect(xml).not.toMatch(/\/(en|ja)\/docs\/plugins/);
  const pluginEntry = xml.match(
    /<url>\s*<loc>[^<]+\/zh\/plugins<\/loc>[\s\S]*?<\/url>/
  )?.[0];
  expect(pluginEntry).toBeDefined();
  expect(pluginEntry).toContain('hreflang="zh"');
  expect(pluginEntry).toContain('hreflang="x-default"');
  expect(pluginEntry).not.toMatch(/hreflang="(?:en|ja)"/);
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(await robots.text()).not.toContain('Disallow: /og/');
});

test('localized sharing images return PNGs without language redirects', async ({
  request,
}) => {
  for (const path of [
    '/og/docs/zh/plugins/image.png',
    '/og/docs/en/image.png',
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).subarray(0, 8).toString('hex')).toBe(
      '89504e470d0a1a0a'
    );
  }
});

test('mobile pages fit the viewport in every language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/zh', '/en', '/ja', '/zh/docs', '/zh/plugins']) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      path
    ).toBeLessThanOrEqual(390);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('document exports keep their text content types', async ({ request }) => {
  for (const [path, type] of [
    ['/zh/llms.txt', 'text/plain'],
    ['/zh/llms.mdx', 'text/markdown'],
    ['/zh/docs/api.mdx', 'text/markdown'],
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(type);
  }
});
