import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('updateUser: changing the name in dialog updates the dashboard', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });
  await page.goto('/diner-dashboard');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});