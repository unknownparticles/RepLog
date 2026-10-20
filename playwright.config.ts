import { defineConfig, devices } from '@playwright/test';
import { pagesBase } from './scripts/build-context.mjs';
export default defineConfig({
  testDir: './tests/e2e', timeout: 60000, expect: { timeout: 10000 }, fullyParallel: false,
  reporter: 'list', use: { baseURL: `http://127.0.0.1:4173${pagesBase()}`, trace: 'retain-on-failure', ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined } },
  webServer: { command: 'npm run preview -- --port 4173 --strictPort', url: `http://127.0.0.1:4173${pagesBase()}`, reuseExistingServer: !process.env.CI, timeout: 30000 },
});
