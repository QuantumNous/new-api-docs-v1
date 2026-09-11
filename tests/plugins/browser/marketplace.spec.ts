import { expect, test, type Page, type Route } from '@playwright/test';
import { catalog, changelog, detail } from '../fixtures';

async function mockCatalog(
  page: Page,
  override?: (route: Route, path: string) => Promise<boolean>
) {
  await page.route('**/api/plugins**', async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('site')).toBe('ai');
    const path = url.pathname.replace('/api/plugins', '');
    if (await override?.(route, path)) return;
    const data =
      path === ''
        ? catalog
        : path.endsWith('/changelog')
          ? changelog
          : path === '/second'
            ? { ...detail, ...catalog.plugins[1] }
            : detail;
    await route.fulfill({ json: { success: true, data } });
  });
}

test('search, official copy URL, detail tabs and keyboard dismissal', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as Window & { copied?: string }).copied = text;
        },
      },
    });
  });
  await mockCatalog(page);
  await page.goto('/zh/plugins');
  await expect(
    page.getByRole('link', { name: '插件', exact: true })
  ).toBeVisible();
  const search = page.getByRole('searchbox');
  await search.fill('示例');
  await expect(
    page.getByRole('heading', { name: 'Demo Video', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Second Plugin', exact: true })
  ).toBeHidden();
  await page.getByRole('button', { name: '复制安装地址', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { copied?: string }).copied)
    )
    .toBe('https://www.newapi.ai/api/v1/plugins/demo/plugin.js');
  const trigger = page.getByRole('button', { name: '查看 Demo Video 详情' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('/v1/videos', { exact: true })).toBeVisible();
  await dialog.getByRole('tab', { name: '更新日志' }).click();
  await expect(dialog.getByText('第二版的新能力')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await search.fill('no-match');
  await expect(page.getByText('没有匹配的插件。')).toBeVisible();
  await page.getByRole('button', { name: '清除搜索' }).click();
  await expect(
    page.getByRole('heading', { name: 'Second Plugin', exact: true })
  ).toBeVisible();
});

test('late detail responses cannot replace a newly selected plugin', async ({
  page,
}) => {
  let pending: Route | undefined;
  let started!: () => void;
  const waiting = new Promise<void>((resolve) => {
    started = resolve;
  });
  await mockCatalog(page, async (route, path) => {
    if (path !== '/demo') return false;
    pending = route;
    started();
    return true;
  });
  await page.goto('/zh/plugins');
  await page.getByRole('button', { name: '查看 Demo Video 详情' }).click();
  await waiting;
  await page.getByRole('button', { name: '关闭插件详情' }).click();
  await page.getByRole('button', { name: '查看 Second Plugin 详情' }).click();
  await expect(
    page.getByRole('dialog').getByText('second-model', { exact: true })
  ).toBeVisible();
  await pending!.fulfill({ json: { success: true, data: detail } });
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Second Plugin' })
  ).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText('demo-video', { exact: true })
  ).toBeHidden();
});

test('late changelog responses cannot overwrite the selected version', async ({
  page,
}) => {
  let pending: Route | undefined;
  let started!: () => void;
  const waiting = new Promise<void>((resolve) => {
    started = resolve;
  });
  await mockCatalog(page, async (route, path) => {
    if (path !== '/demo/1.0.0/changelog') return false;
    pending = route;
    started();
    return true;
  });
  await page.goto('/zh/plugins');
  await page.getByRole('button', { name: '查看 Demo Video 详情' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('/v1/videos', { exact: true })).toBeVisible();
  await dialog.getByRole('tab', { name: '更新日志' }).click();
  await expect(dialog.getByText('第二版的新能力')).toBeVisible();
  await dialog
    .getByRole('combobox', { name: '发布版本' })
    .selectOption('1.0.0');
  await waiting;
  await expect(dialog.getByText('第二版的新能力')).toBeHidden();
  await dialog.getByRole('combobox').selectOption('2.0.0');
  await expect(dialog.getByText('第二版的新能力')).toBeVisible();
  await pending!.fulfill({
    json: {
      success: true,
      data: {
        ...changelog,
        version: '1.0.0',
        sections: [{ category: 'Added', entries: [[{ text: '旧版本内容' }]] }],
      },
    },
  });
  await expect(dialog.getByText('旧版本内容')).toBeHidden();
  await expect(dialog.getByRole('combobox')).toHaveValue('2.0.0');
});

test('missing historical changelog and English fallback remain readable', async ({
  page,
}) => {
  await mockCatalog(page, async (route, path) => {
    if (!path.endsWith('/changelog')) return false;
    const data = path.includes('/1.0.0/')
      ? null
      : { ...changelog, locale: 'en' };
    await route.fulfill({ json: { success: true, data } });
    return true;
  });
  await page.goto('/zh/plugins');
  await page.getByRole('button', { name: '查看 Demo Video 详情' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('/v1/videos', { exact: true })).toBeVisible();
  await dialog.getByRole('tab', { name: '更新日志' }).click();
  await expect(
    dialog.getByText('此更新日志暂时仅提供英文版本。')
  ).toBeVisible();
  await dialog.getByRole('combobox').selectOption('1.0.0');
  await expect(dialog.getByText('此版本暂无更新日志。')).toBeVisible();
});

test('switching from a long detail to a short changelog does not dismiss the dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockCatalog(page, async (route, path) => {
    if (path !== '/demo') return false;
    await route.fulfill({
      json: {
        success: true,
        data: {
          ...detail,
          routes: Array.from({ length: 24 }, (_, index) => ({
            method: 'POST',
            path: `/vendor/jobs/${index}`,
            type: 'submit',
            action: null,
          })),
        },
      },
    });
    return true;
  });
  await page.goto('/zh/plugins');
  await page.getByRole('button', { name: '查看 Demo Video 详情' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByText('/vendor/jobs/0', { exact: true })
  ).toBeVisible();
  await dialog.getByRole('tab', { name: '更新日志' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('第二版的新能力')).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(dialog).toBeHidden();
});

test('catalog failure can be retried and empty data has its own state', async ({
  page,
}) => {
  let attempt = 0;
  await mockCatalog(page, async (route, path) => {
    if (path) return false;
    attempt += 1;
    await route.fulfill(
      attempt === 1
        ? { status: 502, json: { success: false, message: '官网暂时不可用' } }
        : { json: { success: true, data: { ...catalog, plugins: [] } } }
    );
    return true;
  });
  await page.goto('/zh/plugins');
  await expect(
    page.getByRole('region', { name: '官方插件目录' }).getByRole('alert')
  ).toHaveText(/官网暂时不可用/);
  await page.getByRole('button', { name: '重新加载' }).click();
  await expect(page.getByText('目录里还没有插件。')).toBeVisible();
});

test('mobile dark theme, icon failure, clipboard failure and modal scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    });
  });
  await mockCatalog(page, async (route, path) => {
    if (path) return false;
    await route.fulfill({
      json: {
        success: true,
        data: {
          ...catalog,
          plugins: [
            {
              ...detail,
              icon: 'Sora.Color',
              iconUrl: '/api/v1/plugins/demo/2.0.0/icon.svg',
            },
          ],
        },
      },
    });
    return true;
  });
  await page.route('https://www.newapi.ai/**', (route) =>
    route.fulfill({ status: 404, body: '' })
  );
  await page.goto('/zh/plugins');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: '复制安装地址', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: '官网安装地址', exact: true })
  ).toHaveValue('https://www.newapi.ai/api/v1/plugins/demo/plugin.js');
  await expect(
    page.getByRole('article').getByText('D', { exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page.getByRole('button', { name: '查看 Demo Video 详情' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('/v1/videos', { exact: true })).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.height).toBeLessThanOrEqual(844 * 0.85 + 2);
  await expect(
    dialog.getByRole('button', { name: '关闭插件详情' })
  ).toBeVisible();
  await dialog.getByRole('tab', { name: '详情', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('tab', { name: '更新日志' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});

test('all Chinese tutorials render and unavailable translations return to their locale', async ({
  request,
}) => {
  for (const slug of [
    '',
    'installation',
    'configuration',
    'billing',
    'usage',
    'development',
    'api-reference',
    'publishing',
    'faq',
  ]) {
    const response = await request.get(
      `/zh/docs/plugins${slug ? `/${slug}` : ''}`
    );
    expect(response.status()).toBe(200);
  }
  for (const lang of ['en', 'ja']) {
    const market = await request.get(`/${lang}/plugins`, { maxRedirects: 0 });
    expect(market.status()).toBe(307);
    expect(market.headers().location).toBe(`/${lang}`);
    const docs = await request.get(`/${lang}/docs/plugins/development`, {
      maxRedirects: 0,
    });
    expect(docs.status()).toBe(307);
    expect(docs.headers().location).toBe(`/${lang}/docs`);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/zh/plugins');
  expect(sitemap).toContain('/zh/docs/plugins/development');
  expect(sitemap).not.toContain('/en/plugins');
  const search = await request.get('/api/search?query=demo-task&locale=zh');
  expect(search.status()).toBe(200);
  expect(JSON.stringify(await search.json())).toContain(
    '/zh/docs/plugins/development'
  );
  const markdown = await request.get('/zh/llms.mdx/plugins/development');
  expect(markdown.status()).toBe(200);
  expect(await markdown.text()).toContain('buildSubmitRequest');
  expect((await request.post('/api/plugins')).status()).toBe(405);
  expect((await request.get('/api/plugins?site=invalid')).status()).toBe(400);
});
