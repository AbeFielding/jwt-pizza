import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('updateUser: persists after logout and login', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });
  await page.goto('/diner-dashboard');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.goto('/diner-dashboard');

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});
