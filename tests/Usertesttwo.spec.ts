import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('updateUser: dialog opens on Edit and closes on Update', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });
  await page.goto('/diner-dashboard');

  await page.getByRole('button', { name: 'Edit' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10000 });

  await expect(dialog.getByRole('heading', { name: 'Edit user' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Update' }).click();

  await expect(dialog).toBeHidden();

  await expect(page.getByRole('main')).toContainText('Kai Chen');
});
