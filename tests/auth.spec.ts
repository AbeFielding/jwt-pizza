import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Login success shows initials and returns to parent', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: /login/i }).click();
  await page.getByLabel(/email address/i).fill('d@jwt.com');
  await page.getByLabel(/password/i).fill('a');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('Login failure shows an error', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: /login/i }).click();
  await page.getByLabel(/email address/i).fill('d@jwt.com');
  await page.getByLabel(/password/i).fill('wrong');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.locator('.h-4')).not.toHaveText('');
});
