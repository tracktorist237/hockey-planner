import { test, expect, login, expireSession, gate, healthy, reloadSettled } from './fixtures';

test('login and authenticated production boot', async ({ page, scenario }) => {
  const user = await scenario.user();
  await login(page, user);
  const me = await page.evaluate(async () => {
    const session = JSON.parse(localStorage.getItem('authSession')!);
    const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${session.accessToken}` } });
    return { status: response.status, user: (await response.json()).id };
  });
  expect(me).toEqual({ status: 200, user: user.id });
});

test('expired token refreshes before AllowAnonymous events and preserves login', async ({ page, scenario, request }) => {
  const user = await scenario.user();
  const team = await scenario.team(user);
  const event = await scenario.event(user, team.id, 'private schedule');
  await login(page, user);
  const expired = await expireSession(page);
  expect((await request.get('/api/auth/me', { headers: { Authorization: `Bearer ${expired}` } })).status()).toBe(401);
  const order: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/auth/refresh')) order.push('refresh');
    if (/\/api\/events\?/.test(request.url())) {
      order.push('events');
      expect(request.headers().authorization).toBeTruthy();
      expect(request.headers().authorization === `Bearer ${expired}`).toBe(false);
    }
  });
  const refresh = page.waitForResponse(response => response.url().endsWith('/api/auth/refresh'));
  await reloadSettled(page);
  expect((await refresh).status()).toBe(200);
  await expect(page.getByText(event.title, { exact: true })).toBeVisible();
  expect(order.indexOf('refresh')).toBeLessThan(order.indexOf('events'));
  expect(order.filter(value => value === 'refresh')).toHaveLength(1);
});

test('rejected refresh returns to login without a retry loop', async ({ page, scenario }) => {
  const user = await scenario.user(); await login(page, user);
  await expireSession(page, true);
  let attempts = 0;
  page.on('request', request => { if (request.url().endsWith('/api/auth/refresh')) attempts++; });
  await page.goto('/events/create');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByPlaceholder('Email', { exact: true })).toBeVisible();
  expect(attempts).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('authSession')!).refreshToken)).toBeNull();
});

test('real event creation appears in list and opens details', async ({ page, scenario }) => {
  const user = await scenario.user(); const team = await scenario.team(user);
  await login(page, user);
  const event = await scenario.event(user, team.id, 'created');
  await reloadSettled(page);
  await page.getByText(event.title, { exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/events/${event.id}$`));
  await expect(page.getByText('E2E Arena', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('E2E Address', { exact: true }).first()).toBeVisible();
});

test('attendance Confirmed and Declined survive reload', async ({ page, scenario }) => {
  const user = await scenario.user(); const team = await scenario.team(user);
  const event = await scenario.event(user, team.id, 'attendance');
  await login(page, user); await page.goto(`/events/${event.id}`);
  await page.getByRole('button', { name: '✅ Смогу', exact: true }).click();
  await expect(page.getByRole('button', { name: /Отменить ответ/ })).toBeVisible();
  await reloadSettled(page); expect(await scenario.attendance(user, event.id)).toBe(2);
  await page.getByRole('button', { name: /Отменить ответ/ }).click();
  await page.getByRole('dialog', { name: 'Подтверждение отмены ответа' }).getByRole('button', { name: 'Отменить ответ', exact: true }).click();
  await page.getByRole('button', { name: '❌ Не смогу', exact: true }).click();
  await expect(page.getByRole('button', { name: /Отменить ответ/ })).toBeVisible();
  await reloadSettled(page); expect(await scenario.attendance(user, event.id)).toBe(3);
});

test('HP-70 real 409 renders dates; cancel, confirm and double-submit', async ({ page, scenario }) => {
  const user = await scenario.user(); const team = await scenario.team(user);
  const a = await scenario.event(user, team.id, 'already attending');
  const b = await scenario.event(user, team.id, 'conflicting', 30);
  await scenario.vote(user, a.id, 2); await login(page, user); await page.goto(`/events/${b.id}`);
  const response = page.waitForResponse(response => response.url().includes(`/events/${b.id}/attendance/`));
  await page.getByRole('button', { name: '✅ Смогу', exact: true }).click();
  const conflict = await response;
  expect(conflict.status()).toBe(409);
  expect(conflict.headers()['content-type']).toContain('application/problem+json');
  expect((await conflict.json()).conflicts[0].id).toBe(a.id);
  const dialog = page.getByRole('dialog', { name: 'В это время у вас уже есть мероприятие' });
  await expect(dialog.getByRole('link', { name: a.title })).toBeVisible();
  await expect(dialog).toContainText(/18:00.*19:00/);
  await dialog.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(dialog).toHaveCount(0); expect(await scenario.attendance(user, b.id)).toBe(1);
  await page.getByRole('button', { name: '✅ Смогу', exact: true }).click();
  await expect(dialog).toBeVisible();
  const hold = gate(); const entered = gate(); let submissions = 0;
  await page.route(`**/api/events/${b.id}/attendance/**`, async route => {
    submissions++; expect(route.request().postDataJSON().ignoreConflicts).toBe(true);
    const actual = await route.fetch(); entered.resolve(); await hold.promise; await route.fulfill({ response: actual });
  });
  try {
    // Two clicks in one browser task deliberately stress the synchronous in-flight guard.
    await dialog.getByRole('button', { name: 'Всё равно смогу' }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
    await entered.promise;
    await expect(dialog.getByRole('button', { name: 'Всё равно смогу' })).toBeDisabled();
  } finally { hold.resolve(); }
  await expect(dialog).toHaveCount(0); expect(submissions).toBe(1);
  await reloadSettled(page); expect(await scenario.attendance(user, b.id)).toBe(2);
  await expect(page.getByRole('button', { name: /Отменить ответ/ })).toBeVisible();
});

test('late real conflict response cannot affect another event after browser back', async ({ page, scenario }) => {
  const user = await scenario.user(); const team = await scenario.team(user);
  const a = await scenario.event(user, team.id, 'busy');
  const b = await scenario.event(user, team.id, 'old request', 30);
  const c = await scenario.event(user, team.id, 'destination', 240);
  await scenario.vote(user, a.id, 2); await login(page, user); await page.goto(`/events/${c.id}`);
  // Same-document history navigation keeps the real EventPage mounted across route params.
  await page.evaluate(id => { history.pushState(null, '', `/events/${id}`); dispatchEvent(new PopStateEvent('popstate')); }, b.id);
  await expect(page.getByText(b.title, { exact: true }).first()).toBeVisible();
  const received = gate(); const release = gate(); const delivered = gate();
  await page.route(`**/api/events/${b.id}/attendance/**`, async route => {
    const actual = await route.fetch(); expect(actual.status()).toBe(409);
    received.resolve(); await release.promise; await route.fulfill({ response: actual }); delivered.resolve();
  });
  try {
    await page.getByRole('button', { name: '✅ Смогу', exact: true }).click(); await received.promise;
    await page.goBack(); await expect(page).toHaveURL(new RegExp(`/events/${c.id}$`));
    await expect(page.getByText(c.title, { exact: true }).first()).toBeVisible();
  } finally { release.resolve(); }
  await delivered.promise;
  // Flush actual browser rendering, not an arbitrary delay.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.getByRole('dialog', { name: 'В это время у вас уже есть мероприятие' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Всё равно смогу' })).toHaveCount(0);
  expect(await scenario.attendance(user, c.id)).toBe(1);
  await page.getByRole('button', { name: '❌ Не смогу', exact: true }).click();
  await expect(page.getByRole('button', { name: /Отменить ответ/ })).toBeVisible();
  expect(await scenario.attendance(user, c.id)).toBe(3);
  expect(await scenario.attendance(user, b.id)).toBe(1);
});

test('transfer preview, explicit choice and persisted final attendance', async ({ page, scenario }) => {
  const user = await scenario.user(); const team = await scenario.team(user);
  const source = await scenario.event(user, team.id, 'source'); const target = await scenario.event(user, team.id, 'target', 240);
  await scenario.vote(user, source.id, 2); await login(page, user); await page.goto(`/events/${source.id}/transfer`);
  await page.getByRole('article').filter({ hasText: target.title }).getByRole('button', { name: 'Выбрать', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Предпросмотр явки' })).toContainText(user.name);
  await expect(page.getByRole('button', { name: 'Перенести выбранное' })).toBeDisabled();
  await page.getByRole('radiogroup', { name: 'Удалить исходное мероприятие после переноса?' }).getByRole('radio', { name: /^Нет/ }).check();
  await page.getByRole('button', { name: 'Перенести выбранное' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/${target.id}$`));
  expect(await scenario.attendance(user, target.id)).toBe(2);
  expect(await scenario.attendance(user, source.id)).toBe(2);
});

test('stale transfer override gets real 400 with safe human error', async ({ page, scenario }) => {
  const user = await scenario.user(); const member = await scenario.user(); const team = await scenario.team(user);
  await scenario.api(member, 'POST', `/api/teams/join-by-code?currentUserId=${member.id}`, { code: team.inviteCode });
  const source = await scenario.event(user, team.id, 'source'); const target = await scenario.event(user, team.id, 'target', 240);
  await scenario.vote(member, source.id, 2); await login(page, user); await page.goto(`/events/${source.id}/transfer`);
  await page.getByRole('article').filter({ hasText: target.title }).getByRole('button', { name: 'Выбрать', exact: true }).click();
  await page.getByRole('combobox', { name: new RegExp(`Итог для .*${member.name}`) }).selectOption('3');
  await page.getByRole('radiogroup', { name: 'Удалить исходное мероприятие после переноса?' }).getByRole('radio', { name: /^Нет/ }).check();
  await scenario.api(user, 'DELETE', `/api/teams/${team.id}/members/${member.id}?currentUserId=${user.id}`, undefined, 204);
  const response = page.waitForResponse(response => response.url().endsWith(`/events/${source.id}/transfer`));
  await page.getByRole('button', { name: 'Перенести выбранное' }).click();
  expect((await response).status()).toBe(400);
  await expect(page.getByRole('alert')).toContainText('Участник не входит в набор переноса явки');
  await expect(page.getByRole('alert')).not.toContainText(/\{"|<html|Exception|Npgsql|SELECT /);
  expect(await scenario.attendance(user, target.id)).toBe(1);
});

test('new event notification appears for another team member and opens event', async ({ page, scenario }) => {
  const owner = await scenario.user(); const member = await scenario.user(); const team = await scenario.team(owner);
  await scenario.api(member, 'POST', `/api/teams/join-by-code?currentUserId=${member.id}`, { code: team.inviteCode });
  const event = await scenario.event(owner, team.id, 'notification'); await login(page, member);
  await page.getByRole('button', { name: 'Уведомления', exact: true }).click();
  const notification = page.getByRole('button').filter({ hasText: `${event.title}: отметьтесь` });
  await expect(notification).toHaveCount(1); await notification.click();
  await expect(page).toHaveURL(new RegExp(`/events/${event.id}$`));
});

test.describe('production PWA', () => {
  test.use({ serviceWorkers: 'allow' });
  test('service worker activates and app boots with real API', async ({ page, scenario }) => {
    const user = await scenario.user(); await login(page, user);
    const script = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
    expect(script).toContain('/service-worker.js');
    await reloadSettled(page); await expect(page.getByRole('button', { name: 'Уведомления', exact: true })).toBeVisible();
    await healthy(page);
  });
});
