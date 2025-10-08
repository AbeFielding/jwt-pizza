// tests/misc.spec.ts
import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Logout redirects to home', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });
  await page.goto('/logout');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: /order now/i })).toBeVisible();
});
