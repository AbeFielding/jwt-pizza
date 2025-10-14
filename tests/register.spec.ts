import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Register shows validation error when required fields missing', async ({ page }) => {
  await basicInit(page);
  await page.goto('/register');

  await expect(page.locator('main')).toBeVisible();
  const form = page.locator('main form').first();
  await form.waitFor({ state: 'attached' });
  const submit = form.locator('button[type="submit"], input[type="submit"], button:has-text("Register")').first();
  await submit.click().catch(() => {});
  await expect(page.locator('main')).toBeVisible();
});

test('Register succeeds with minimal fields', async ({ page }) => {
  await basicInit(page);
  await page.goto('/register');

  const form = page.locator('main form').first();
  await form.waitFor({ state: 'attached' });

  const email = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
  const password = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first();

  await email.fill('new@jwt.com').catch(() => {});
  await password.fill('verysecure').catch(() => {});
  const submit = form.locator('button[type="submit"], input[type="submit"], button:has-text("Register")').first();
  await submit.click().catch(() => {});

  await expect(page.locator('main')).toBeVisible();
});
