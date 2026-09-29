import { test, expect } from '@playwright/test';

test('anonymous production boot and public health/version', async ({ page, baseURL }) => {
  const errors: string[] = [], writes: string[] = [], assets: number[] = [];
  page.on('pageerror', () => errors.push('runtime_exception'));
  page.on('response', response => {
    if (new URL(response.url()).pathname.startsWith('/static/js/')) assets.push(response.status());
  });
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { writes.push('non_read_request'); await route.abort(); return; }
    // No accounts/business API, third-party pixels or credentials in the staging smoke.
    if (url.origin !== baseURL || (url.pathname.startsWith('/api/') && !['/api/health', '/api/version'].includes(url.pathname))) {
      await route.abort(); return;
    }
    await route.continue();
  });
  await page.goto('/login');
  await expect(page.getByText('Не удалось открыть приложение', { exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder('Email', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Пароль', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Сервер доступен', { exact: true })).toBeVisible();
  const health = await page.evaluate(async () => {
    const health = await fetch('/api/health', { cache: 'no-store' });
    const version = await fetch('/api/version', { cache: 'no-store' });
    const json = await version.json();
    return { health: health.status === 200 && (await health.text()).trim() === 'Healthy',
      version: version.status === 200 && json.environment === 'Staging' && /^[0-9a-f]{7,40}$/.test(json.commit) };
  });
  expect(health).toEqual({ health: true, version: true });
  expect(assets.length).toBeGreaterThan(0);
  expect(assets.every(status => status === 200)).toBe(true);
  expect(errors).toEqual([]); expect(writes).toEqual([]);
});

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus || page.isClosed()) return;
  const boundary = page.getByText('Не удалось открыть приложение', { exact: true });
  if (await boundary.count()) {
    await boundary.screenshot({ path: info.outputPath('failure.png') });
  } else {
    // An arbitrary proxy/error HTML page may contain internals: don't screenshot its text.
    const form = page.locator('form').filter({ has: page.getByPlaceholder('Email', { exact: true }) });
    if (await form.count()) await form.screenshot({ path: info.outputPath('failure.png'), mask: [page.locator('input'), page.getByRole('alert')] });
  }
});
