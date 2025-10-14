import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Logged-in user sees totals and can pay', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });

  await page.getByRole('button', { name: /order now/i }).click();
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: /veggie/i }).click();
  await page.getByRole('link', { name: /pepperoni/i }).click();
  await page.getByRole('button', { name: /checkout/i }).click();

  if ((await page.url()).match(/\/payment\/login$/)) {
    await page.getByLabel(/email address/i).fill('d@jwt.com');
    await page.getByLabel(/password/i).fill('a');
    await page.getByRole('button', { name: /login/i }).click();
  }

  await expect(page.getByRole('main')).toContainText(/send me those 2 pizzas/i);
  await expect(page.locator('tbody')).toContainText(/veggie/i);
  await expect(page.locator('tbody')).toContainText(/pepperoni/i);
  await expect(page.locator('tfoot')).toContainText('₿');
  await page.getByRole('button', { name: /pay now/i }).click();
});
