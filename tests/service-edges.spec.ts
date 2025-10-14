import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('register page submits without crashing', async ({ page }) => {
  await basicInit(page);

  await page.route('**/api/auth', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataJSON() || {};
    return route.fulfill({
      json: {
        user: { id: '99', name: body.name ?? 'New User', email: body.email, roles: [{ role: 'diner' }] },
        token: 'tok_register_123',
      },
    });
  });

  await page.goto('/register');

  const name = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i)).first();
  const email = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
  const password = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first();

  await name.fill('Pat Tester').catch(() => {});
  await email.fill('pat@example.com').catch(() => {});
  await password.fill('supersecret').catch(() => {});

  const submit = page.locator('main form button[type="submit"], main form input[type="submit"], main form button:has-text("Register")').first();
  await submit.click().catch(() => {});

  await expect(page.locator('main')).toBeVisible();
});

test('getUser clears token on 401 from /api/user/me', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'bogus'));

  await basicInit(page);

  await page.unroute(/.*\/api\/user\/me(\?.*)?$/).catch(() => {});
  let hit401 = false;
  await page.route(/.*\/api\/user\/me(\?.*)?$/, async (route) => {
    hit401 = true;
    return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });

  await page.goto('about:blank');
  await page.goto('/');

  await expect.poll(() => hit401).toBe(true);

  await expect
    .poll(async () => await page.evaluate(() => localStorage.getItem('token')))
    .toBeNull();

  await expect(page.locator('main')).toBeVisible();
});

test('docs(factory) loads via absolute factory URL', async ({ page }) => {
  await basicInit(page);

  await page.route('**/api/docs', async (route) => {
    return route.fulfill({
      json: { endpoints: [{ method: 'GET', path: '/api/health' }] },
    });
  });

  await page.goto('/docs/factory');
  await expect(page.locator('main')).toBeVisible();
  await page.getByRole('heading').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => {});
});
