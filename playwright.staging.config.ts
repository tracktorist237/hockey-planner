import { defineConfig, devices } from '@playwright/test';
const baseURL = process.env.HP_STAGING_URL || 'https://staging.hockeyplanner.ru';
const localFixture = process.env.HP_SMOKE_LOCAL_FIXTURE === '1' && /^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL);
if (baseURL !== 'https://staging.hockeyplanner.ru' && !localFixture) throw new Error('Only staging or a local fixture is allowed');
if (!process.env.HP_SMOKE_PRIVATE) throw new Error('Use scripts/staging/run-browser.cjs');
export default defineConfig({
  testDir: './e2e-staging', testMatch: 'boot.spec.ts', workers: 1, retries: 0, timeout: 30000,
  forbidOnly: true, reporter: [['./scripts/staging/reporter.cjs']], outputDir: process.env.HP_SMOKE_PRIVATE,
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', video: 'off',
    trace: { mode: 'retain-on-failure', snapshots: false, screenshots: false, sources: false } },
  projects: [{ name: 'staging-readonly-chromium', use: { ...devices['Desktop Chrome'] } }],
});
