import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Home shows Order now and navigates to Menu', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('button', { name: /order now/i }).click();
  await expect(page.locator('h2')).toHaveText(/awesome is a click away/i);
});

test('History renders content + image', async ({ page }) => {
  await basicInit(page);
  await page.goto('/history');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(/mama rucci, my my/i);
  await expect(page.locator('img[src$="mamaRicci.png"]')).toBeVisible();
});
