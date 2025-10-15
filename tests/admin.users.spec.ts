import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('admin can view paginated list of users and filter by name', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'admin@jwt.com', roles: ['admin'] });

  await page.goto('/admin-dashboard');

  // sanity: we’re on the admin dashboard
  await expect(page.getByText(/Admin dashboard/i)).toBeVisible();

  // click the Users tab
  await page.getByRole('button', { name: /^Users$/i }).click();

  // table headers
  const table = page.getByRole('table', { name: /users/i });
  await expect(table).toContainText(/Name/i);
  await expect(table).toContainText(/Email/i);
  await expect(table).toContainText(/Role/i);

  // known mocked users from basicInit
  await expect(table).toContainText('Kai Chen');

  // filter by name
  await page.getByPlaceholder('Filter users').fill('Buddy');
  await page.getByRole('button', { name: /^Submit$/i }).click();

  // expect filtered results
  await expect(table).toContainText('Buddy');
});
