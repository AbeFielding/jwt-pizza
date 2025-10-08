import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('home page loads and title is JWT Pizza', async ({ page }) => {
  await basicInit(page);
  await expect(page).toHaveTitle(/JWT Pizza/i);
});

test('nav: Order now goes to menu', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('button', { name: /order now/i }).click();
  await expect(page.locator('h2')).toContainText(/awesome is a click away/i);
});
