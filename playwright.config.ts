import { defineConfig, devices } from '@playwright/test';
import { e2eEnvironment } from './e2e/environment.js';

const docker = process.env.DEVTRACK_E2E_DOCKER === '1';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  forbidOnly: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: docker ? 'http://localhost:4174' : e2eEnvironment.APP_ORIGIN,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(!docker && {
    webServer: {
      command: 'node apps/api/dist/server.js',
      url: `${e2eEnvironment.APP_ORIGIN}/api/v1/health`,
      env: e2eEnvironment,
      reuseExistingServer: false,
      timeout: 30_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    },
  }),
});
