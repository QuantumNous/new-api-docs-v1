import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/plugins/browser',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: process.env.PLUGIN_TEST_BROWSER_CHANNEL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'bunx next start --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/zh/plugins',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
