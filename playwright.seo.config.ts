import { defineConfig } from '@playwright/test';
import pluginsConfig from './playwright.plugins.config';

export default defineConfig({
  ...pluginsConfig,
  testDir: './tests/seo/browser',
  use: { ...pluginsConfig.use, javaScriptEnabled: false },
  webServer: {
    ...pluginsConfig.webServer,
    command: 'bunx next start --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/zh',
  },
});
