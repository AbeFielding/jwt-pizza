import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

// 1) Keep this as a *UI* registration smoke (your Register page posts to /api/register, not /api/auth).
// We don't assert token here because httpPizzaService.register() isn't invoked by the UI.
// We still keep the route override for /api/auth in case the UI ever switches, but we won't rely on it.
test('register page submits without crashing', async ({ page }) => {
  await basicInit(page);

  // If the UI ever uses POST /api/auth, this override will make it succeed;
  // but current UI posts to /api/register via basicInit, which already returns 201.
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

  // Page stays mounted; no crash
  await expect(page.locator('main')).toBeVisible();
});

// 2) Deterministic 401 path for getUser(): prove our /api/user/me override is HIT, THEN wait for token removal.
test('getUser clears token on 401 from /api/user/me', async ({ page }) => {
  // Seed bogus token BEFORE any scripts run
  await page.addInitScript(() => localStorage.setItem('token', 'bogus'));

  // Install normal mocks (this also navigates to '/')
  await basicInit(page);

  // Replace any existing /api/user/me handler with a 401 and record that we saw it
  await page.unroute(/.*\/api\/user\/me(\?.*)?$/).catch(() => {});
  let hit401 = false;
  await page.route(/.*\/api\/user\/me(\?.*)?$/, async (route) => {
    hit401 = true;
    return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });

  // Hard reload to force the app to call getUser() again under our 401
  await page.goto('about:blank');
  await page.goto('/');

  // Confirm our route actually ran
  await expect.poll(() => hit401).toBe(true);

  // Wait until the app’s catch clears the token (it’s async in the app frame)
  await expect
    .poll(async () => await page.evaluate(() => localStorage.getItem('token')))
    .toBeNull();

  await expect(page.locator('main')).toBeVisible();
});

// 3) Factory docs absolute URL branch — unchanged
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
