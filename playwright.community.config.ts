import { defineConfig } from '@playwright/test';
import pluginsConfig from './playwright.plugins.config';

export default defineConfig({
  ...pluginsConfig,
  testDir: './tests/community',
});
