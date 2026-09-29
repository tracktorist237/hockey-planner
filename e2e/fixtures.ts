import { test as base, expect, Page, APIRequestContext, Request } from '@playwright/test';
import { randomUUID, createHmac } from 'node:crypto';
import { appendFileSync } from 'node:fs';

export function secret(value: string) {
  appendFileSync(process.env.HP_E2E_SECRETS!, JSON.stringify(value) + '\n');
  return value;
}
export function captureAuth(value: any) {
  if (value?.accessToken) secret(value.accessToken);
  if (value?.refreshToken) secret(value.refreshToken);
}
export async function healthy(page: Page) {
  await expect(page.getByText('Не удалось открыть приложение', { exact: true })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Invalid Date');
}
export type Account = { id: string; name: string; email: string; password: string; token: string };
const pendingApiRequests = new WeakMap<Page, Set<Request>>();
export async function finishApiRendering(page: Page) {
  // Unlike load-state networkidle, this observes requests started after SPA updates.
  await expect(async () => {
    expect(pendingApiRequests.get(page)?.size).toBe(0);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(pendingApiRequests.get(page)?.size).toBe(0);
  }).toPass({ timeout: 10000 });
}
export async function reloadSettled(page: Page) {
  // Persistence checks must not abort unrelated GETs; the stale-response test
  // deliberately bypasses this helper and navigates with its request in flight.
  await finishApiRendering(page);
  await page.reload();
}
export class Scenario {
  constructor(readonly request: APIRequestContext) {}
  async user(): Promise<Account> {
    const suffix = randomUUID();
    const password = secret(randomUUID() + 'Aa1!');
    const name = `E2E ${suffix.slice(0, 8)}`;
    const email = `e2e-${suffix}@example.invalid`;
    const response = await this.request.post('/api/auth/register', { data: { firstName: name, lastName: 'Player', email, password } });
    expect(response.status()).toBe(200);
    const auth = await response.json(); captureAuth(auth);
    return { id: auth.user.id, name, email, password, token: auth.accessToken };
  }
  async api(user: Account, method: string, url: string, data?: unknown, status = 200) {
    const response = await this.request.fetch(url, { method, data, headers: { Authorization: `Bearer ${user.token}` } });
    expect(response.status(), `${method} ${url}`).toBe(status);
    return response;
  }
  async team(user: Account) {
    return (await this.api(user, 'POST', `/api/teams?currentUserId=${user.id}`,
      { name: `E2E Team ${randomUUID()}`, visibility: 1 }, 201)).json();
  }
  async event(user: Account, teamId: string, label: string, minute = 0) {
    const date = new Date(); date.setUTCDate(date.getUTCDate() + 2); date.setUTCHours(15, minute, 0, 0);
    const title = `E2E ${label} ${randomUUID().slice(0, 6)}`;
    const id = await (await this.api(user, 'POST', '/api/events', {
      teamId, title, type: 1, startTime: date.toISOString(), durationMinutes: 60,
      locationName: 'E2E Arena', locationAddress: 'E2E Address', description: 'E2E source description',
    }, 201)).json();
    return { id: id as string, title };
  }
  async vote(user: Account, eventId: string, status: number) {
    await this.api(user, 'POST', `/api/events/${eventId}/attendance/${user.id}`, { status, ignoreConflicts: true });
  }
  async attendance(user: Account, eventId: string) {
    const event = await (await this.api(user, 'GET', `/api/events/${eventId}`)).json();
    return event.attendances.find((value: any) => value.userId === user.id)?.status;
  }
}

export const test = base.extend<{ scenario: Scenario; guard: void }>({
  scenario: async ({ request }, use) => { await use(new Scenario(request)); },
  guard: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    const captures: Promise<void>[] = [];
    const pending = new Set<Request>(); pendingApiRequests.set(page, pending);
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) pending.add(request); });
    page.on('requestfinished', request => pending.delete(request));
    page.on('requestfailed', request => pending.delete(request));
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (/\/api\/auth\/(login|register|refresh)$/.test(response.url()))
        captures.push(response.json().then(captureAuth).catch(() => undefined));
    });
    await use();
    await Promise.all(captures);
    if (testInfo.status !== testInfo.expectedStatus && !page.isClosed()) {
      const diagnostics = await page.evaluate(() => JSON.parse(localStorage.getItem('hpClientDebugLog') || '[]'));
      await testInfo.attach('client-diagnostics', { body: JSON.stringify(diagnostics), contentType: 'application/json' });
    }
    // Also runs after the journey: an ErrorBoundary must not turn a crash into a passing test.
    if (!page.isClosed()) await healthy(page);
    expect(errors, `Unexpected browser runtime exceptions in ${testInfo.title}`).toEqual([]);
  }, { auto: true }],
});
export { expect };

export async function login(page: Page, user: Account) {
  await page.goto('/login');
  await page.getByPlaceholder('Email', { exact: true }).fill(user.email);
  await page.getByPlaceholder('Пароль', { exact: true }).fill(user.password);
  await page.locator('button[type="submit"]').filter({ hasText: 'Войти' }).click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole('button', { name: 'Уведомления', exact: true })).toBeVisible();
  await finishApiRendering(page);
}

export async function expireSession(page: Page, invalidRefresh = false) {
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('authSession')!));
  const payload = JSON.parse(Buffer.from(stored.accessToken.split('.')[1], 'base64url').toString());
  payload.exp = Math.floor(Date.now() / 1000) - 120;
  const input = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.'
    + Buffer.from(JSON.stringify(payload)).toString('base64url');
  const expired = secret(input + '.' + createHmac('sha256', process.env.HP_E2E_SIGNING_KEY!).update(input).digest('base64url'));
  stored.accessToken = expired;
  stored.accessTokenExpiresAt = new Date(payload.exp * 1000).toISOString();
  if (invalidRefresh) stored.refreshToken = secret(randomUUID());
  await page.evaluate(session => {
    localStorage.setItem('authSession', JSON.stringify(session));
    localStorage.setItem('authAccessToken', session.accessToken);
    localStorage.setItem('authAccessTokenExpiresAt', session.accessTokenExpiresAt);
    localStorage.setItem('authRefreshToken', session.refreshToken);
  }, stored);
  return expired;
}

export function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
