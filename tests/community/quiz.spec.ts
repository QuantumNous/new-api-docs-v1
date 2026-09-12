import { expect, test, type Page } from '@playwright/test';

const key = 'newapi-community-quiz-failed';
const path = '/zh/docs/support/community-interaction';
const invite = 'a[href="https://discord.gg/9US8FvUCJE"]';

async function answer(page: Page, wrongQuestion = 0) {
  for (let question = 1; question <= 5; question++) {
    const value =
      question === wrongQuestion
        ? question === 1
          ? 'a'
          : 'true'
        : question === 1
          ? 'b'
          : 'false';
    await page.locator(`input[name="q${question}"][value="${value}"]`).check();
  }
}

test('incomplete answers and cancelling confirmation do not consume the attempt', async ({
  page,
}) => {
  await page.goto(path);
  const submit = page.getByRole('button', { name: '提交答案', exact: true });
  await submit.click();
  await expect(
    page.getByText('请回答所有问题后再提交。', { exact: true })
  ).toBeVisible();
  await answer(page, 1);
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toBe('确定提交答案吗？答错将无法重答。');
    await dialog.dismiss();
  });
  await submit.click();
  await expect(submit).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key)
  ).toBeNull();
  await answer(page);
  page.once('dialog', (dialog) => dialog.accept());
  await submit.click();
  await expect(page.locator(invite)).toBeVisible();
});

for (const question of [1, 2, 3, 4, 5]) {
  test(`one incorrect answer to question ${question} locks the browser`, async ({
    page,
    context,
  }) => {
    await page.goto(path);
    const otherTab = await context.newPage();
    await otherTab.goto('/en/docs/support/community-interaction');
    await expect(otherTab.locator('[data-community-quiz]')).toBeVisible();
    await answer(page, question);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '提交答案', exact: true }).click();
    await expect(
      page.getByText('答题机会已用完', { exact: true })
    ).toBeVisible();
    await expect(page.locator('input[type="radio"]')).toHaveCount(0);
    await expect(page.locator(invite)).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      'true'
    );
    await expect(
      otherTab.getByText('Your attempt has been used', { exact: true })
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('答题机会已用完', { exact: true })
    ).toBeVisible();
    await page.goto('/ja/docs/support/community-interaction');
    await expect(
      page.getByText('回答の機会は使用済みです', { exact: true })
    ).toBeVisible();
    await page.close();
    const reopened = await context.newPage();
    await reopened.goto(path);
    await expect(
      reopened.getByText('答题机会已用完', { exact: true })
    ).toBeVisible();
  });
}

for (const [lang, submit] of [
  ['en', 'Submit Answers'],
  ['ja', '回答を送信'],
]) {
  test(`${lang}: correct answers reveal the invitation only after confirmation`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/docs/support/community-interaction`);
    await answer(page);
    await expect(page.locator(invite)).toHaveCount(0);
    let confirmed = false;
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      confirmed = true;
      await dialog.accept();
    });
    await page.getByRole('button', { name: submit, exact: true }).click();
    await expect(page.locator(invite)).toBeVisible();
    expect(confirmed).toBe(true);
  });
}

test('unavailable local storage prevents an unrecorded attempt', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('newapi-community-quiz-failed'))
        throw new DOMException('Storage unavailable', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto(path);
  await expect(
    page.getByText('无法保存本地答题记录', { exact: false })
  ).toBeVisible();
  await expect(page.locator('input[type="radio"]')).toHaveCount(0);
  await expect(page.locator(invite)).toHaveCount(0);
});
