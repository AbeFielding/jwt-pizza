import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('purchase flow with login and pay', async ({ page }) => {
  await basicInit(page);

  // order 2 pies
  await page.getByRole('button', { name: /order now/i }).click();
  await expect(page.locator('h2')).toContainText(/awesome is a click away/i);
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: /veggie/i }).click();
  await page.getByRole('link', { name: /pepperoni/i }).click();
  await expect(page.locator('form')).toContainText(/selected pizzas:\s*2/i);
  await page.getByRole('button', { name: /checkout/i }).click();

  // login
  await page.getByRole('textbox', { name: /email address/i }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: /password/i }).fill('a');
  await page.getByRole('button', { name: /login/i }).click();

  // pay
  await expect(page.getByRole('main')).toContainText(/send me those 2 pizzas right now!/i);
  await expect(page.locator('tbody')).toContainText(/veggie/i);
  await expect(page.locator('tbody')).toContainText(/pepperoni/i);
  await expect(page.locator('tfoot')).toContainText('₿');
  await page.getByRole('button', { name: /pay now/i }).click();
});
