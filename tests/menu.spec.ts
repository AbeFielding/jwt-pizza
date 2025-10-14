import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Menu: checkout disabled until store + items, then enabled', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('button', { name: /order now/i }).click();

  const checkout = page.getByRole('button', { name: /checkout/i });
  await expect(checkout).toBeDisabled();

  await page.getByRole('combobox').selectOption('4');
  await expect(checkout).toBeDisabled();           

  await page.getByRole('link', { name: /veggie/i }).click();
  await expect(page.locator('form')).toContainText(/selected pizzas:\s*1/i);
  await expect(checkout).toBeEnabled();
});
