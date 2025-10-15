import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('admin can delete a user from the Users tab', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'admin@jwt.com', roles: ['admin'] });

  await page.goto('/admin-dashboard');
  await page.getByRole('button', { name: /^Users$/i }).click();

  const table = page.getByRole('table', { name: /users/i });

  await expect(table).toContainText('Kai Chen');
  await expect(table).toContainText('Buddy');

  await page.getByRole('button', { name: /^Delete Buddy$/i }).click();

  await expect(table).not.toContainText('Buddy');
  await expect(table).toContainText('Kai Chen');
});
