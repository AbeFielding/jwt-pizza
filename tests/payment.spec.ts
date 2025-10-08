// tests/payment.spec.ts
import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Logged-in user sees totals and can pay', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });

  // Build order and go to checkout
  await page.getByRole('button', { name: /order now/i }).click();
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: /veggie/i }).click();
  await page.getByRole('link', { name: /pepperoni/i }).click();
  await page.getByRole('button', { name: /checkout/i }).click();

  // If app still redirected to /payment/login, log in then continue
  if ((await page.url()).match(/\/payment\/login$/)) {
    await page.getByLabel(/email address/i).fill('d@jwt.com');
    await page.getByLabel(/password/i).fill('a');
    await page.getByRole('button', { name: /login/i }).click();
  }

  // Now on Payment with table + totals
  await expect(page.getByRole('main')).toContainText(/send me those 2 pizzas/i);
  await expect(page.locator('tbody')).toContainText(/veggie/i);
  await expect(page.locator('tbody')).toContainText(/pepperoni/i);
  await expect(page.locator('tfoot')).toContainText('₿');
  await page.getByRole('button', { name: /pay now/i }).click();
});
