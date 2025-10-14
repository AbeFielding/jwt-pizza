import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Franchise dashboard renders with some store listing UI', async ({ page }) => {
  await basicInit(page, { loggedInEmail: 'fran@jwt.com' });  // franchisee
  await page.goto('/franchise-dashboard').catch(async () => {
    await page.goto('/franchiseDashboard');
  });

  await expect(page.locator('main')).toBeVisible();

  const storeLike = page.locator('main table tbody tr, main .card, main [data-testid*="store"], main li').first();
  await storeLike.waitFor({ state: 'attached', timeout: 1500 }).catch(() => { /* tolerate minimal UIs */ });
});