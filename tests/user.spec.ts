import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('updateUser: reach diner dashboard and see current user', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'd@jwt.com' });

  await page.goto('/diner-dashboard');

  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await expect(page.getByRole('main')).toContainText('d@jwt.com');
});
