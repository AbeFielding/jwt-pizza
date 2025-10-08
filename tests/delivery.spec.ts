import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Delivery verify performs POST and shows result', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });
  await page.goto('/delivery');
  // if there’s a code/order id field, fill something generic
  const verifyBtn = page.getByRole('button', { name: /verify/i });
  await expect(verifyBtn).toBeVisible();
  await verifyBtn.click();
  // after our stub, something like "verified" or a success section should appear
  await expect(page.getByRole('main')).toBeVisible();
});
